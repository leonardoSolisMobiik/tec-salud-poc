#!/usr/bin/env python3
"""
Batch Processing Service for TecSalud Document Management
Orchestrates bulk upload workflow with patient matching and document processing
"""

import os
import uuid
import hashlib
import asyncio
import logging
from datetime import datetime
from typing import List, Dict, Optional, Tuple, Any
from pathlib import Path
from dataclasses import dataclass
from concurrent.futures import ThreadPoolExecutor, as_completed

from sqlalchemy.orm import Session
from sqlalchemy import text
from fastapi import UploadFile

from app.core.database import get_db
from app.db.models import (
    BatchUpload, BatchFile, MedicalDocument, Patient,
    BatchUploadStatusEnum, PatientMatchingStatusEnum, VectorizationStatusEnum,
    ProcessingTypeEnum, DocumentTypeEnum
)
from app.services.tecsalud_filename_parser import TecSaludFilenameParser, PatientData, DocumentTypeEnum as TecSaludDocTypeEnum
from app.services.patient_matching_service import PatientMatchingService
from app.services.chroma_service import ChromaService
from app.services.azure_openai_service import AzureOpenAIService
from app.agents.document_analysis_agent import DocumentAnalysisAgent


logger = logging.getLogger(__name__)


@dataclass
class BatchProcessingResult:
    """Result of batch processing operation"""
    session_id: str
    total_files: int
    processed_files: int
    failed_files: int
    created_patients: int
    matched_patients: int
    review_required: int
    processing_time: float
    status: BatchUploadStatusEnum
    error_details: List[str]


@dataclass
class FileProcessingResult:
    """Result of individual file processing"""
    filename: str
    success: bool
    patient_id: Optional[int] = None
    document_id: Optional[int] = None
    matching_confidence: Optional[float] = None
    review_required: bool = False
    error_message: Optional[str] = None
    processing_time: float = 0.0


class BatchProcessingService:
    """Service for processing bulk document uploads with patient matching"""
    
    def __init__(self):
        self.filename_parser = TecSaludFilenameParser()
        # Don't initialize patient_matcher here - create it when needed with db session
        self.chroma_service = ChromaService()
        self.azure_openai_service = AzureOpenAIService()
        self.document_agent = DocumentAnalysisAgent()
        self.max_parallel_files = 5  # Process up to 5 files in parallel
        self.upload_directory = Path("/tmp/batch_uploads")
        self.upload_directory.mkdir(exist_ok=True)
        
    async def create_batch_upload_session(
        self, 
        uploaded_by: str, 
        processing_type: ProcessingTypeEnum,
        db: Session
    ) -> str:
        """Create new batch upload session"""
        session_id = str(uuid.uuid4())
        
        batch_upload = BatchUpload(
            session_id=session_id,
            uploaded_by=uploaded_by,
            processing_type=processing_type,
            status=BatchUploadStatusEnum.PENDING
        )
        
        db.add(batch_upload)
        db.commit()
        db.refresh(batch_upload)
        
        logger.info(f"📤 Created batch upload session: {session_id}")
        return session_id
    
    async def upload_files_to_session(
        self,
        session_id: str,
        files: List[UploadFile],
        db: Session
    ) -> Dict[str, Any]:
        """Upload files to batch session and prepare for processing"""
        
        # Get batch upload session
        batch_upload = db.query(BatchUpload).filter_by(session_id=session_id).first()
        if not batch_upload:
            raise ValueError(f"Batch upload session not found: {session_id}")
        
        if batch_upload.status != BatchUploadStatusEnum.PENDING:
            raise ValueError(f"Batch upload session already started: {session_id}")
        
        # Create session directory
        session_dir = self.upload_directory / session_id
        session_dir.mkdir(exist_ok=True)
        
        uploaded_files = []
        failed_files = []
        
        for file in files:
            try:
                # Save file to disk
                file_path = session_dir / file.filename
                content = await file.read()
                
                with open(file_path, 'wb') as f:
                    f.write(content)
                
                # Calculate content hash
                content_hash = hashlib.sha256(content).hexdigest()
                
                # Parse TecSalud filename
                parsing_result = await self.filename_parser.parse_filename(file.filename)
                
                # Create batch file record
                batch_file = BatchFile(
                    batch_upload_id=batch_upload.id,
                    original_filename=file.filename,
                    file_path=str(file_path),
                    file_size=len(content),
                    content_hash=content_hash,
                    parsed_patient_id=parsing_result.patient_id if parsing_result.success else None,
                    parsed_patient_name=parsing_result.patient_name if parsing_result.success else None,
                    parsed_document_number=parsing_result.document_number if parsing_result.success else None,
                    parsed_document_type=parsing_result.document_type if parsing_result.success else None,
                    patient_matching_status=PatientMatchingStatusEnum.PENDING,
                    processing_status=VectorizationStatusEnum.PENDING
                )
                
                if not parsing_result.success:
                    batch_file.error_message = f"Filename parsing failed: {parsing_result.error_message}"
                    batch_file.review_required = True
                
                db.add(batch_file)
                uploaded_files.append({
                    'filename': file.filename,
                    'size': len(content),
                    'parsed': parsing_result.success,
                    'patient_id': parsing_result.patient_id if parsing_result.success else None,
                    'patient_name': parsing_result.patient_name if parsing_result.success else None
                })
                
            except Exception as e:
                logger.error(f"❌ Failed to upload file {file.filename}: {str(e)}")
                failed_files.append({
                    'filename': file.filename,
                    'error': str(e)
                })
        
        # Update batch upload with file counts
        batch_upload.total_files = len(uploaded_files)
        batch_upload.failed_files = len(failed_files)
        
        db.commit()
        
        logger.info(f"📤 Uploaded {len(uploaded_files)} files to session {session_id}")
        
        return {
            'session_id': session_id,
            'uploaded_files': uploaded_files,
            'failed_files': failed_files,
            'total_files': len(uploaded_files),
            'parsing_success_rate': len([f for f in uploaded_files if f['parsed']]) / len(uploaded_files) if uploaded_files else 0
        }
    
    async def process_batch_upload(
        self,
        session_id: str,
        db: Session
    ) -> BatchProcessingResult:
        """Process all files in batch upload session"""
        
        start_time = datetime.now()
        
        # Get batch upload session
        batch_upload = db.query(BatchUpload).filter_by(session_id=session_id).first()
        if not batch_upload:
            raise ValueError(f"Batch upload session not found: {session_id}")
        
        if batch_upload.status != BatchUploadStatusEnum.PENDING:
            raise ValueError(f"Batch upload session already processed: {session_id}")
        
        # Update status to processing
        batch_upload.status = BatchUploadStatusEnum.PROCESSING
        batch_upload.started_at = start_time
        db.commit()
        
        logger.info(f"🔄 Starting batch processing for session: {session_id}")
        
        try:
            # Get all batch files for this session
            batch_files = db.query(BatchFile).filter_by(batch_upload_id=batch_upload.id).all()
            
            # Process files in parallel
            results = await self._process_files_parallel(batch_files, batch_upload.processing_type, db)
            
            # Aggregate results
            processed_files = sum(1 for r in results if r.success)
            failed_files = sum(1 for r in results if not r.success)
            created_patients = sum(1 for r in results if r.success and r.patient_id)
            matched_patients = sum(1 for r in results if r.success and r.matching_confidence and r.matching_confidence > 0.8)
            review_required = sum(1 for r in results if r.review_required)
            error_details = [r.error_message for r in results if r.error_message]
            
            # Update batch upload status
            batch_upload.processed_files = processed_files
            batch_upload.failed_files = failed_files
            batch_upload.completed_at = datetime.now()
            
            if failed_files == 0:
                batch_upload.status = BatchUploadStatusEnum.COMPLETED
            elif processed_files > 0:
                batch_upload.status = BatchUploadStatusEnum.PARTIALLY_FAILED
            else:
                batch_upload.status = BatchUploadStatusEnum.FAILED
                batch_upload.error_message = f"All files failed processing. First error: {error_details[0] if error_details else 'Unknown error'}"
            
            db.commit()
            
            processing_time = (datetime.now() - start_time).total_seconds()
            
            result = BatchProcessingResult(
                session_id=session_id,
                total_files=len(batch_files),
                processed_files=processed_files,
                failed_files=failed_files,
                created_patients=created_patients,
                matched_patients=matched_patients,
                review_required=review_required,
                processing_time=processing_time,
                status=batch_upload.status,
                error_details=error_details
            )
            
            logger.info(f"✅ Batch processing completed: {session_id} - {processed_files}/{len(batch_files)} files processed")
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Batch processing failed: {session_id} - {str(e)}")
            
            # Update batch upload status to failed
            batch_upload.status = BatchUploadStatusEnum.FAILED
            batch_upload.error_message = str(e)
            batch_upload.completed_at = datetime.now()
            db.commit()
            
            processing_time = (datetime.now() - start_time).total_seconds()
            
            return BatchProcessingResult(
                session_id=session_id,
                total_files=len(batch_files) if 'batch_files' in locals() else 0,
                processed_files=0,
                failed_files=len(batch_files) if 'batch_files' in locals() else 0,
                created_patients=0,
                matched_patients=0,
                review_required=0,
                processing_time=processing_time,
                status=BatchUploadStatusEnum.FAILED,
                error_details=[str(e)]
            )
    
    async def _process_files_parallel(
        self,
        batch_files: List[BatchFile],
        processing_type: ProcessingTypeEnum,
        db: Session
    ) -> List[FileProcessingResult]:
        """Process files in parallel with limited concurrency"""
        
        results = []
        
        # Process files in batches to avoid overwhelming the system
        for i in range(0, len(batch_files), self.max_parallel_files):
            batch = batch_files[i:i + self.max_parallel_files]
            
            # Create tasks for parallel processing
            tasks = []
            for batch_file in batch:
                task = asyncio.create_task(
                    self._process_single_file(batch_file, processing_type, db)
                )
                tasks.append(task)
            
            # Wait for all tasks in this batch to complete
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Process results
            for result in batch_results:
                if isinstance(result, Exception):
                    logger.error(f"❌ File processing exception: {str(result)}")
                    results.append(FileProcessingResult(
                        filename="unknown",
                        success=False,
                        error_message=str(result)
                    ))
                else:
                    results.append(result)
        
        return results
    
    async def _process_single_file(
        self,
        batch_file: BatchFile,
        processing_type: ProcessingTypeEnum,
        db: Session
    ) -> FileProcessingResult:
        """Process a single file through the complete workflow"""
        
        start_time = datetime.now()
        
        try:
            logger.info(f"🔄 Processing file: {batch_file.original_filename}")
            
            # Step 1: Check if filename was parsed successfully
            if not batch_file.parsed_patient_id:
                batch_file.error_message = "Filename parsing failed - cannot extract patient information"
                batch_file.review_required = True
                db.commit()
                
                return FileProcessingResult(
                    filename=batch_file.original_filename,
                    success=False,
                    error_message="Filename parsing failed",
                    review_required=True,
                    processing_time=(datetime.now() - start_time).total_seconds()
                )
            
            # Step 2: Patient matching
            patient_id, matching_result = await self._match_or_create_patient(batch_file, db)
            
            if not patient_id:
                batch_file.error_message = "Patient matching failed"
                batch_file.review_required = True
                db.commit()
                
                return FileProcessingResult(
                    filename=batch_file.original_filename,
                    success=False,
                    error_message="Patient matching failed",
                    review_required=True,
                    processing_time=(datetime.now() - start_time).total_seconds()
                )
            
            # Step 3: Read file content
            file_content = await self._read_file_content(batch_file.file_path)
            
            # Step 4: Create medical document
            document_id = await self._create_medical_document(
                batch_file, patient_id, file_content, processing_type, db
            )
            
            # Step 5: Process document based on processing type
            if processing_type in [ProcessingTypeEnum.VECTORIZED, ProcessingTypeEnum.BOTH]:
                await self._vectorize_document(document_id, file_content, db)
            
            # Update batch file with success
            batch_file.medical_document_id = document_id
            batch_file.processing_status = VectorizationStatusEnum.COMPLETED
            batch_file.processed_at = datetime.now()
            db.commit()
            
            logger.info(f"✅ Successfully processed: {batch_file.original_filename}")
            
            return FileProcessingResult(
                filename=batch_file.original_filename,
                success=True,
                patient_id=patient_id,
                document_id=document_id,
                matching_confidence=matching_result.confidence if matching_result else None,
                review_required=matching_result.review_required if matching_result else False,
                processing_time=(datetime.now() - start_time).total_seconds()
            )
            
        except Exception as e:
            logger.error(f"❌ Error processing file {batch_file.original_filename}: {str(e)}")
            
            # Update batch file with error
            batch_file.error_message = str(e)
            batch_file.processing_status = VectorizationStatusEnum.FAILED
            batch_file.processed_at = datetime.now()
            db.commit()
            
            return FileProcessingResult(
                filename=batch_file.original_filename,
                success=False,
                error_message=str(e),
                processing_time=(datetime.now() - start_time).total_seconds()
            )
    
    async def _match_or_create_patient(
        self,
        batch_file: BatchFile,
        db: Session
    ) -> Tuple[Optional[int], Optional[Any]]:
        """Match patient or create new one based on TecSalud data"""
        
        # Create patient matcher with db session
        patient_matcher = PatientMatchingService(db)
        
        # Try to match existing patient using TecSalud data
        tecsalud_data = PatientData(
            expediente_id=batch_file.parsed_patient_id,
            nombre="", # We need to parse this from full name
            apellido_paterno="",
            apellido_materno="",
            full_name=batch_file.parsed_patient_name,
            numero_adicional="",
            document_type=TecSaludDocTypeEnum.OTHER,  # Map from batch_file.parsed_document_type if needed
            original_filename=batch_file.original_filename,
            confidence=1.0
        )
        
        matching_result = await patient_matcher.find_patient_matches(tecsalud_data)
        
        # Update batch file with matching results
        batch_file.matching_confidence = matching_result.best_match.confidence if matching_result.best_match else 0.0
        batch_file.matching_details = str(matching_result)
        
        if matching_result.best_match and matching_result.best_match.confidence >= 0.95:
            # High confidence match - use existing patient
            batch_file.patient_matching_status = PatientMatchingStatusEnum.MATCHED
            batch_file.matched_patient_id = matching_result.best_match.patient_id
            db.commit()
            
            return matching_result.best_match.patient_id, matching_result
            
        elif matching_result.best_match and matching_result.best_match.confidence >= 0.8:
            # Medium confidence - requires admin review
            batch_file.patient_matching_status = PatientMatchingStatusEnum.REVIEW_REQUIRED
            batch_file.review_required = True
            db.commit()
            
            # For now, create new patient but mark for review
            patient_id = await self._create_new_patient(batch_file, db)
            return patient_id, matching_result
            
        else:
            # Low confidence - create new patient
            batch_file.patient_matching_status = PatientMatchingStatusEnum.NEW_PATIENT
            patient_id = await self._create_new_patient(batch_file, db)
            
            if patient_id:
                batch_file.matched_patient_id = patient_id
                db.commit()
            
            return patient_id, matching_result
    
    async def _create_new_patient(
        self,
        batch_file: BatchFile,
        db: Session
    ) -> Optional[int]:
        """Create new patient from TecSalud filename data"""
        
        try:
            # Parse patient name components
            name_parts = batch_file.parsed_patient_name.split(',')
            if len(name_parts) >= 2:
                surnames = name_parts[0].strip()
                given_names = name_parts[1].strip()
                full_name = f"{surnames}, {given_names}"
            else:
                full_name = batch_file.parsed_patient_name
            
            # Create patient with minimal information from filename
            patient = Patient(
                medical_record_number=batch_file.parsed_patient_id,
                name=full_name,
                birth_date="1900-01-01",  # Default date - requires admin review
                gender="desconocido",  # Default gender - requires admin review
                doctor_id=1,  # Default doctor - requires admin review
                status="Activo"
            )
            
            db.add(patient)
            db.commit()
            db.refresh(patient)
            
            logger.info(f"👤 Created new patient: {full_name} (ID: {patient.id})")
            
            return patient.id
            
        except Exception as e:
            logger.error(f"❌ Failed to create patient: {str(e)}")
            return None
    
    async def _read_file_content(self, file_path: str) -> str:
        """Read file content (PDF extraction would go here)"""
        
        # For now, return placeholder content
        # In production, this would use PDF extraction libraries
        return f"Document content from {os.path.basename(file_path)}"
    
    async def _create_medical_document(
        self,
        batch_file: BatchFile,
        patient_id: int,
        content: str,
        processing_type: ProcessingTypeEnum,
        db: Session
    ) -> int:
        """Create medical document record"""
        
        # Map TecSalud document types to our enum
        doc_type_mapping = {
            'CONS': DocumentTypeEnum.CONSULTATION,
            'HIST': DocumentTypeEnum.HISTORY,
            'LAB': DocumentTypeEnum.LAB_RESULTS,
            'IMG': DocumentTypeEnum.IMAGING,
            'EMER': DocumentTypeEnum.CONSULTATION,
            'CIRUG': DocumentTypeEnum.SURGERY,
            'RECETA': DocumentTypeEnum.PRESCRIPTION,
            'ALTA': DocumentTypeEnum.DISCHARGE
        }
        
        document_type = doc_type_mapping.get(
            batch_file.parsed_document_type, 
            DocumentTypeEnum.OTHER
        )
        
        document = MedicalDocument(
            patient_id=patient_id,
            document_type=document_type,
            title=f"{batch_file.parsed_document_type} - {batch_file.parsed_patient_name}",
            content=content,
            created_by="batch_processor",
            processing_type=processing_type,
            original_filename=batch_file.original_filename,
            vectorization_status=VectorizationStatusEnum.PENDING,
            content_hash=batch_file.content_hash
        )
        
        db.add(document)
        db.commit()
        db.refresh(document)
        
        return document.id
    
    async def _vectorize_document(
        self,
        document_id: int,
        content: str,
        db: Session
    ) -> None:
        """Vectorize document content using ChromaDB"""
        
        try:
            # Get document
            document = db.query(MedicalDocument).filter_by(id=document_id).first()
            if not document:
                raise ValueError(f"Document not found: {document_id}")
            
            # Update status to processing
            document.vectorization_status = VectorizationStatusEnum.PROCESSING
            db.commit()
            
            # Add to ChromaDB
            chunks = await self.chroma_service.add_document(
                content=content,
                metadata={
                    'document_id': document_id,
                    'patient_id': document.patient_id,
                    'document_type': document.document_type,
                    'created_at': str(document.created_at)
                }
            )
            
            # Update document with chunk count
            document.chunks_count = len(chunks)
            document.vectorization_status = VectorizationStatusEnum.COMPLETED
            db.commit()
            
        except Exception as e:
            logger.error(f"❌ Vectorization failed for document {document_id}: {str(e)}")
            
            # Update document with error
            document.vectorization_status = VectorizationStatusEnum.FAILED
            db.commit()
            
            raise e
    
    async def get_batch_status(
        self,
        session_id: str,
        db: Session
    ) -> Dict[str, Any]:
        """Get current status of batch processing"""
        
        batch_upload = db.query(BatchUpload).filter_by(session_id=session_id).first()
        if not batch_upload:
            raise ValueError(f"Batch upload session not found: {session_id}")
        
        # Get detailed file status
        batch_files = db.query(BatchFile).filter_by(batch_upload_id=batch_upload.id).all()
        
        file_status = []
        for batch_file in batch_files:
            file_status.append({
                'filename': batch_file.original_filename,
                'patient_matching_status': batch_file.patient_matching_status,
                'processing_status': batch_file.processing_status,
                'matching_confidence': batch_file.matching_confidence,
                'review_required': batch_file.review_required,
                'error_message': batch_file.error_message,
                'processed_at': batch_file.processed_at
            })
        
        return {
            'session_id': session_id,
            'status': batch_upload.status,
            'uploaded_by': batch_upload.uploaded_by,
            'processing_type': batch_upload.processing_type,
            'total_files': batch_upload.total_files,
            'processed_files': batch_upload.processed_files,
            'failed_files': batch_upload.failed_files,
            'created_at': batch_upload.created_at,
            'started_at': batch_upload.started_at,
            'completed_at': batch_upload.completed_at,
            'error_message': batch_upload.error_message,
            'files': file_status
        }
    
    async def get_files_requiring_review(
        self,
        session_id: str,
        db: Session
    ) -> List[Dict[str, Any]]:
        """Get files that require admin review"""
        
        batch_upload = db.query(BatchUpload).filter_by(session_id=session_id).first()
        if not batch_upload:
            raise ValueError(f"Batch upload session not found: {session_id}")
        
        review_files = db.query(BatchFile).filter_by(
            batch_upload_id=batch_upload.id,
            review_required=True
        ).all()
        
        return [
            {
                'filename': batch_file.original_filename,
                'parsed_patient_name': batch_file.parsed_patient_name,
                'parsed_patient_id': batch_file.parsed_patient_id,
                'matching_confidence': batch_file.matching_confidence,
                'matching_details': batch_file.matching_details,
                'error_message': batch_file.error_message,
                'patient_matching_status': batch_file.patient_matching_status
            }
            for batch_file in review_files
        ]
    
    async def cleanup_batch_session(
        self,
        session_id: str,
        db: Session
    ) -> None:
        """Clean up batch session files and data"""
        
        # Remove uploaded files
        session_dir = self.upload_directory / session_id
        if session_dir.exists():
            import shutil
            shutil.rmtree(session_dir)
            logger.info(f"🧹 Cleaned up batch session directory: {session_id}")
        
        # Optionally remove batch records (keep for audit trail)
        # This could be implemented as a separate cleanup job 