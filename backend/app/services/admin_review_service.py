#!/usr/bin/env python3
"""
Admin Review Service for TecSalud Batch Processing
Handles administrative decisions on files requiring manual review
"""

import logging
from datetime import datetime
from typing import List, Dict, Optional, Any
from dataclasses import dataclass
from enum import Enum

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.db.models import (
    BatchFile, BatchUpload, Patient, MedicalDocument,
    PatientMatchingStatusEnum, VectorizationStatusEnum,
    ProcessingTypeEnum, DocumentTypeEnum, GenderEnum
)
from app.services.patient_matching_service import PatientMatchingService
from app.services.batch_processing_service import BatchProcessingService


logger = logging.getLogger(__name__)


class AdminDecisionEnum(str, Enum):
    """Admin decision types for review cases"""
    APPROVE_MATCH = "approve_match"          # Approve suggested patient match
    REJECT_MATCH = "reject_match"            # Reject match, create new patient
    MANUAL_MATCH = "manual_match"            # Manually select different patient
    SKIP_FILE = "skip_file"                  # Skip processing this file
    RETRY_PROCESSING = "retry_processing"    # Retry failed processing
    DELETE_FILE = "delete_file"              # Remove file from batch


@dataclass
class AdminDecision:
    """Represents an admin decision on a review case"""
    decision: AdminDecisionEnum
    selected_patient_id: Optional[int] = None
    new_patient_data: Optional[Dict[str, Any]] = None
    admin_notes: Optional[str] = None
    reviewed_by: str = "admin"


@dataclass
class ReviewCase:
    """Complete review case information for admin interface"""
    batch_file_id: int
    filename: str
    session_id: str
    
    # File parsing results
    parsed_patient_id: Optional[str]
    parsed_patient_name: Optional[str]
    parsed_document_type: Optional[str]
    
    # Current status
    patient_matching_status: PatientMatchingStatusEnum
    processing_status: VectorizationStatusEnum
    matching_confidence: Optional[float]
    error_message: Optional[str]
    
    # Matching details
    matching_details: Optional[str]  # JSON with match candidates
    suggested_matches: List[Dict[str, Any]]
    
    # Review metadata
    review_priority: str  # high, medium, low
    review_category: str  # patient_match, parsing_error, processing_error
    created_at: datetime


class AdminReviewService:
    """Service for handling administrative review of batch processing cases"""
    
    def __init__(self):
        # Don't initialize patient_matcher here - create it when needed with db session
        self.batch_service = BatchProcessingService()
    
    async def get_pending_reviews(
        self,
        session_id: Optional[str] = None,
        priority: Optional[str] = None,
        category: Optional[str] = None,
        limit: int = 50,
        db: Session = None
    ) -> List[ReviewCase]:
        """Get all files requiring admin review with filtering options"""
        
        # Build query for files requiring review
        query = db.query(BatchFile).filter(
            BatchFile.review_required == True
        )
        
        # Add filters
        if session_id:
            batch_upload = db.query(BatchUpload).filter_by(session_id=session_id).first()
            if batch_upload:
                query = query.filter(BatchFile.batch_upload_id == batch_upload.id)
        
        # Get batch files requiring review
        batch_files = query.limit(limit).all()
        
        review_cases = []
        for batch_file in batch_files:
            # Get batch upload session info
            batch_upload = db.query(BatchUpload).filter_by(id=batch_file.batch_upload_id).first()
            
            # Parse matching details
            suggested_matches = []
            if batch_file.matching_details:
                import json
                try:
                    matching_data = json.loads(batch_file.matching_details)
                    suggested_matches = matching_data.get('suggestions', [])
                except:
                    suggested_matches = []
            
            # Determine review category and priority
            category = self._determine_review_category(batch_file)
            priority = self._determine_review_priority(batch_file)
            
            review_case = ReviewCase(
                batch_file_id=batch_file.id,
                filename=batch_file.original_filename,
                session_id=batch_upload.session_id,
                parsed_patient_id=batch_file.parsed_patient_id,
                parsed_patient_name=batch_file.parsed_patient_name,
                parsed_document_type=batch_file.parsed_document_type,
                patient_matching_status=batch_file.patient_matching_status,
                processing_status=batch_file.processing_status,
                matching_confidence=batch_file.matching_confidence,
                error_message=batch_file.error_message,
                matching_details=batch_file.matching_details,
                suggested_matches=suggested_matches,
                review_priority=priority,
                review_category=category,
                created_at=batch_file.created_at
            )
            
            # Apply filters
            if priority and review_case.review_priority != priority:
                continue
            if category and review_case.review_category != category:
                continue
                
            review_cases.append(review_case)
        
        # Sort by priority and date
        priority_order = {'high': 0, 'medium': 1, 'low': 2}
        review_cases.sort(key=lambda x: (priority_order.get(x.review_priority, 3), x.created_at))
        
        logger.info(f"📋 Retrieved {len(review_cases)} review cases")
        return review_cases
    
    async def process_admin_decision(
        self,
        batch_file_id: int,
        decision: AdminDecision,
        db: Session
    ) -> Dict[str, Any]:
        """Process an admin decision on a review case"""
        
        # Get batch file
        batch_file = db.query(BatchFile).filter_by(id=batch_file_id).first()
        if not batch_file:
            raise ValueError(f"Batch file not found: {batch_file_id}")
        
        logger.info(f"🔍 Processing admin decision: {decision.decision} for {batch_file.original_filename}")
        
        result = {
            "batch_file_id": batch_file_id,
            "filename": batch_file.original_filename,
            "decision": decision.decision,
            "success": False,
            "message": "",
            "patient_id": None,
            "document_id": None
        }
        
        try:
            # Update review metadata
            batch_file.reviewed_by = decision.reviewed_by
            batch_file.reviewed_at = datetime.now()
            batch_file.review_notes = decision.admin_notes
            
            if decision.decision == AdminDecisionEnum.APPROVE_MATCH:
                result = await self._handle_approve_match(batch_file, decision, db, result)
                
            elif decision.decision == AdminDecisionEnum.REJECT_MATCH:
                result = await self._handle_reject_match(batch_file, decision, db, result)
                
            elif decision.decision == AdminDecisionEnum.MANUAL_MATCH:
                result = await self._handle_manual_match(batch_file, decision, db, result)
                
            elif decision.decision == AdminDecisionEnum.SKIP_FILE:
                result = await self._handle_skip_file(batch_file, decision, db, result)
                
            elif decision.decision == AdminDecisionEnum.RETRY_PROCESSING:
                result = await self._handle_retry_processing(batch_file, decision, db, result)
                
            elif decision.decision == AdminDecisionEnum.DELETE_FILE:
                result = await self._handle_delete_file(batch_file, decision, db, result)
            
            else:
                raise ValueError(f"Unknown admin decision: {decision.decision}")
            
            # Mark as no longer requiring review
            batch_file.review_required = False
            db.commit()
            
            logger.info(f"✅ Admin decision processed successfully: {decision.decision}")
            return result
            
        except Exception as e:
            db.rollback()
            logger.error(f"❌ Failed to process admin decision: {str(e)}")
            result["message"] = f"Error processing decision: {str(e)}"
            return result
    
    async def _handle_approve_match(
        self,
        batch_file: BatchFile,
        decision: AdminDecision,
        db: Session,
        result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle approve match decision"""
        
        if not batch_file.matched_patient_id:
            raise ValueError("No patient match to approve")
        
        # Use the matched patient
        patient_id = batch_file.matched_patient_id
        batch_file.patient_matching_status = PatientMatchingStatusEnum.MATCHED
        
        # Process the document
        document_id = await self._create_and_process_document(batch_file, patient_id, db)
        
        result.update({
            "success": True,
            "message": "Patient match approved and document processed",
            "patient_id": patient_id,
            "document_id": document_id
        })
        
        return result
    
    async def _handle_reject_match(
        self,
        batch_file: BatchFile,
        decision: AdminDecision,
        db: Session,
        result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle reject match decision - create new patient"""
        
        # Create new patient
        if decision.new_patient_data:
            patient_id = await self._create_patient_from_admin_data(decision.new_patient_data, db)
        else:
            patient_id = await self._create_patient_from_filename(batch_file, db)
        
        batch_file.matched_patient_id = patient_id
        batch_file.patient_matching_status = PatientMatchingStatusEnum.NEW_PATIENT
        
        # Process the document
        document_id = await self._create_and_process_document(batch_file, patient_id, db)
        
        result.update({
            "success": True,
            "message": "New patient created and document processed",
            "patient_id": patient_id,
            "document_id": document_id
        })
        
        return result
    
    async def _handle_manual_match(
        self,
        batch_file: BatchFile,
        decision: AdminDecision,
        db: Session,
        result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle manual match decision - use admin-selected patient"""
        
        if not decision.selected_patient_id:
            raise ValueError("No patient selected for manual match")
        
        # Verify patient exists
        patient = db.query(Patient).filter_by(id=decision.selected_patient_id).first()
        if not patient:
            raise ValueError(f"Selected patient not found: {decision.selected_patient_id}")
        
        batch_file.matched_patient_id = decision.selected_patient_id
        batch_file.patient_matching_status = PatientMatchingStatusEnum.MATCHED
        
        # Process the document
        document_id = await self._create_and_process_document(batch_file, decision.selected_patient_id, db)
        
        result.update({
            "success": True,
            "message": f"Manually matched to patient {patient.name} and document processed",
            "patient_id": decision.selected_patient_id,
            "document_id": document_id
        })
        
        return result
    
    async def _handle_skip_file(
        self,
        batch_file: BatchFile,
        decision: AdminDecision,
        db: Session,
        result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle skip file decision"""
        
        batch_file.patient_matching_status = PatientMatchingStatusEnum.REJECTED
        batch_file.processing_status = VectorizationStatusEnum.FAILED
        batch_file.error_message = f"Skipped by admin: {decision.admin_notes or 'No reason provided'}"
        
        result.update({
            "success": True,
            "message": "File skipped as requested"
        })
        
        return result
    
    async def _handle_retry_processing(
        self,
        batch_file: BatchFile,
        decision: AdminDecision,
        db: Session,
        result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle retry processing decision"""
        
        # Reset status for retry
        batch_file.processing_status = VectorizationStatusEnum.PENDING
        batch_file.error_message = None
        
        # If there's a matched patient, try to process
        if batch_file.matched_patient_id:
            document_id = await self._create_and_process_document(batch_file, batch_file.matched_patient_id, db)
            result.update({
                "success": True,
                "message": "Processing retried successfully",
                "patient_id": batch_file.matched_patient_id,
                "document_id": document_id
            })
        else:
            result.update({
                "success": True,
                "message": "File marked for retry - patient matching still required"
            })
        
        return result
    
    async def _handle_delete_file(
        self,
        batch_file: BatchFile,
        decision: AdminDecision,
        db: Session,
        result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle delete file decision"""
        
        # Remove file from filesystem if it exists
        import os
        if batch_file.file_path and os.path.exists(batch_file.file_path):
            os.remove(batch_file.file_path)
        
        # Mark as deleted (don't actually delete from DB for audit trail)
        batch_file.patient_matching_status = PatientMatchingStatusEnum.REJECTED
        batch_file.processing_status = VectorizationStatusEnum.FAILED
        batch_file.error_message = f"Deleted by admin: {decision.admin_notes or 'File removed'}"
        
        result.update({
            "success": True,
            "message": "File deleted successfully"
        })
        
        return result
    
    async def _create_and_process_document(
        self,
        batch_file: BatchFile,
        patient_id: int,
        db: Session
    ) -> int:
        """Create medical document and process it"""
        
        # Get batch upload to determine processing type
        batch_upload = db.query(BatchUpload).filter_by(id=batch_file.batch_upload_id).first()
        
        # Read file content
        content = await self._read_file_content(batch_file.file_path)
        
        # Map document type
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
        
        # Create medical document
        document = MedicalDocument(
            patient_id=patient_id,
            document_type=document_type,
            title=f"{batch_file.parsed_document_type or 'DOC'} - {batch_file.parsed_patient_name or 'Unknown'}",
            content=content,
            created_by=f"admin_review_{batch_file.reviewed_by}",
            processing_type=batch_upload.processing_type,
            original_filename=batch_file.original_filename,
            vectorization_status=VectorizationStatusEnum.PENDING,
            content_hash=batch_file.content_hash
        )
        
        db.add(document)
        db.commit()
        db.refresh(document)
        
        # Vectorize if needed
        if batch_upload.processing_type in [ProcessingTypeEnum.VECTORIZED, ProcessingTypeEnum.BOTH]:
            await self._vectorize_document(document.id, content, db)
        
        # Update batch file
        batch_file.medical_document_id = document.id
        batch_file.processing_status = VectorizationStatusEnum.COMPLETED
        batch_file.processed_at = datetime.now()
        
        return document.id
    
    async def _create_patient_from_admin_data(
        self,
        patient_data: Dict[str, Any],
        db: Session
    ) -> int:
        """Create new patient from admin-provided data"""
        
        patient = Patient(
            medical_record_number=patient_data.get('medical_record_number'),
            name=patient_data.get('name'),
            birth_date=patient_data.get('birth_date', '1900-01-01'),
            gender=patient_data.get('gender', GenderEnum.UNKNOWN),
            phone=patient_data.get('phone'),
            email=patient_data.get('email'),
            address=patient_data.get('address'),
            emergency_contact=patient_data.get('emergency_contact'),
            doctor_id=patient_data.get('doctor_id', 1),  # Default doctor
            status="Activo"
        )
        
        db.add(patient)
        db.commit()
        db.refresh(patient)
        
        logger.info(f"👤 Created patient from admin data: {patient.name} (ID: {patient.id})")
        return patient.id
    
    async def _create_patient_from_filename(
        self,
        batch_file: BatchFile,
        db: Session
    ) -> int:
        """Create new patient from filename parsing results"""
        
        if not batch_file.parsed_patient_name or not batch_file.parsed_patient_id:
            raise ValueError("Insufficient patient data in filename")
        
        # Parse patient name components
        name_parts = batch_file.parsed_patient_name.split(',')
        if len(name_parts) >= 2:
            surnames = name_parts[0].strip()
            given_names = name_parts[1].strip()
            full_name = f"{surnames}, {given_names}"
        else:
            full_name = batch_file.parsed_patient_name
        
        patient = Patient(
            medical_record_number=batch_file.parsed_patient_id,
            name=full_name,
            birth_date="1900-01-01",  # Default - requires admin review
            gender=GenderEnum.UNKNOWN,  # Default - requires admin review
            doctor_id=1,  # Default doctor - requires admin review
            status="Activo"
        )
        
        db.add(patient)
        db.commit()
        db.refresh(patient)
        
        logger.info(f"👤 Created patient from filename: {full_name} (ID: {patient.id})")
        return patient.id
    
    async def _read_file_content(self, file_path: str) -> str:
        """Read file content"""
        # For now, return placeholder content
        # In production, this would use PDF extraction
        return f"Document content from {file_path}"
    
    async def _vectorize_document(self, document_id: int, content: str, db: Session) -> None:
        """Vectorize document content"""
        try:
            # Use the batch service's vectorization logic
            await self.batch_service._vectorize_document(document_id, content, db)
        except Exception as e:
            logger.error(f"❌ Vectorization failed for document {document_id}: {str(e)}")
            # Update document status
            document = db.query(MedicalDocument).filter_by(id=document_id).first()
            if document:
                document.vectorization_status = VectorizationStatusEnum.FAILED
                db.commit()
    
    def _determine_review_category(self, batch_file: BatchFile) -> str:
        """Determine the category of review case"""
        
        if not batch_file.parsed_patient_id:
            return "parsing_error"
        elif batch_file.patient_matching_status == PatientMatchingStatusEnum.REVIEW_REQUIRED:
            return "patient_match"
        elif batch_file.processing_status == VectorizationStatusEnum.FAILED:
            return "processing_error"
        else:
            return "other"
    
    def _determine_review_priority(self, batch_file: BatchFile) -> str:
        """Determine the priority of review case"""
        
        # High priority: parsing errors or complete failures
        if not batch_file.parsed_patient_id or batch_file.processing_status == VectorizationStatusEnum.FAILED:
            return "high"
        
        # Medium priority: low confidence matches
        if batch_file.matching_confidence and batch_file.matching_confidence < 0.7:
            return "medium"
        
        # Low priority: medium confidence matches
        return "low"
    
    async def get_review_statistics(
        self,
        session_id: Optional[str] = None,
        db: Session = None
    ) -> Dict[str, Any]:
        """Get statistics about review cases"""
        
        # Build base query
        query = db.query(BatchFile)
        
        if session_id:
            batch_upload = db.query(BatchUpload).filter_by(session_id=session_id).first()
            if batch_upload:
                query = query.filter(BatchFile.batch_upload_id == batch_upload.id)
        
        # Get counts
        total_files = query.count()
        review_required = query.filter(BatchFile.review_required == True).count()
        completed_reviews = query.filter(
            and_(
                BatchFile.review_required == False,
                BatchFile.reviewed_by.isnot(None)
            )
        ).count()
        
        # Get category breakdown
        review_files = query.filter(BatchFile.review_required == True).all()
        categories = {
            "parsing_error": 0,
            "patient_match": 0,
            "processing_error": 0,
            "other": 0
        }
        
        priorities = {
            "high": 0,
            "medium": 0,
            "low": 0
        }
        
        for batch_file in review_files:
            category = self._determine_review_category(batch_file)
            priority = self._determine_review_priority(batch_file)
            
            categories[category] += 1
            priorities[priority] += 1
        
        return {
            "total_files": total_files,
            "review_required": review_required,
            "completed_reviews": completed_reviews,
            "review_percentage": (review_required / total_files * 100) if total_files > 0 else 0,
            "categories": categories,
            "priorities": priorities
        }
    
    async def bulk_approve_high_confidence_matches(
        self,
        session_id: str,
        confidence_threshold: float = 0.9,
        db: Session = None
    ) -> Dict[str, Any]:
        """Bulk approve high confidence matches to speed up review process"""
        
        # Get batch upload
        batch_upload = db.query(BatchUpload).filter_by(session_id=session_id).first()
        if not batch_upload:
            raise ValueError(f"Batch upload session not found: {session_id}")
        
        # Find high confidence matches requiring review
        high_confidence_files = db.query(BatchFile).filter(
            and_(
                BatchFile.batch_upload_id == batch_upload.id,
                BatchFile.review_required == True,
                BatchFile.matching_confidence >= confidence_threshold,
                BatchFile.matched_patient_id.isnot(None)
            )
        ).all()
        
        approved_count = 0
        failed_count = 0
        
        for batch_file in high_confidence_files:
            try:
                decision = AdminDecision(
                    decision=AdminDecisionEnum.APPROVE_MATCH,
                    admin_notes=f"Auto-approved (confidence: {batch_file.matching_confidence:.2%})",
                    reviewed_by="system_bulk_approve"
                )
                
                await self.process_admin_decision(batch_file.id, decision, db)
                approved_count += 1
                
            except Exception as e:
                logger.error(f"❌ Failed to bulk approve file {batch_file.original_filename}: {str(e)}")
                failed_count += 1
        
        logger.info(f"📋 Bulk approval completed: {approved_count} approved, {failed_count} failed")
        
        return {
            "approved_count": approved_count,
            "failed_count": failed_count,
            "confidence_threshold": confidence_threshold
        } 