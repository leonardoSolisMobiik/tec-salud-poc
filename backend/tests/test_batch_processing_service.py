#!/usr/bin/env python3
"""
Test Suite for Batch Processing Service
Tests for bulk document upload and processing workflows
"""

import pytest
import uuid
import tempfile
import asyncio
from pathlib import Path
from unittest.mock import Mock, AsyncMock, patch
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi import UploadFile

from app.db.models import (
    Base, BatchUpload, BatchFile, MedicalDocument, Patient, Doctor,
    BatchUploadStatusEnum, PatientMatchingStatusEnum, VectorizationStatusEnum,
    ProcessingTypeEnum, DocumentTypeEnum, GenderEnum
)
from app.services.batch_processing_service import (
    BatchProcessingService, BatchProcessingResult, FileProcessingResult
)


@pytest.fixture
def test_db():
    """Create test database"""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return TestingSessionLocal


@pytest.fixture
def test_session(test_db):
    """Create test session"""
    session = test_db()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def test_doctor(test_session):
    """Create test doctor"""
    doctor = Doctor(
        email="test@tecsalud.mx",
        name="Dr. Juan Pérez",
        specialty="Medicina General",
        license_number="12345678",
        phone="555-1234"
    )
    test_session.add(doctor)
    test_session.commit()
    return doctor


@pytest.fixture
def test_patient(test_session, test_doctor):
    """Create test patient"""
    patient = Patient(
        medical_record_number="3000003799",
        name="GARZA TIJERINA, MARIA ESTHER",
        birth_date="1980-01-15",
        gender=GenderEnum.FEMALE,
        doctor_id=test_doctor.id
    )
    test_session.add(patient)
    test_session.commit()
    return patient


@pytest.fixture
def mock_upload_file():
    """Create mock upload file"""
    content = b"PDF content here"
    file = Mock(spec=UploadFile)
    file.filename = "3000003799_GARZA TIJERINA, MARIA ESTHER_6001467010_CONS.pdf"
    file.read = AsyncMock(return_value=content)
    return file


@pytest.fixture
def batch_service():
    """Create batch processing service with mocked dependencies"""
    service = BatchProcessingService()
    
    # Mock external services
    service.filename_parser = Mock()
    service.patient_matcher = Mock()
    service.chroma_service = Mock()
    service.azure_openai_service = Mock()
    service.document_agent = Mock()
    
    # Create temp directory for testing
    service.upload_directory = Path(tempfile.mkdtemp())
    
    return service


class TestBatchProcessingService:
    """Test BatchProcessingService functionality"""
    
    @pytest.mark.asyncio
    async def test_create_batch_upload_session(self, batch_service, test_session):
        """Test creating new batch upload session"""
        
        session_id = await batch_service.create_batch_upload_session(
            uploaded_by="admin@tecsalud.mx",
            processing_type=ProcessingTypeEnum.VECTORIZED,
            db=test_session
        )
        
        # Verify session was created
        assert session_id is not None
        assert uuid.UUID(session_id)  # Valid UUID
        
        # Verify database record
        batch_upload = test_session.query(BatchUpload).filter_by(session_id=session_id).first()
        assert batch_upload is not None
        assert batch_upload.uploaded_by == "admin@tecsalud.mx"
        assert batch_upload.processing_type == ProcessingTypeEnum.VECTORIZED
        assert batch_upload.status == BatchUploadStatusEnum.PENDING
        
    @pytest.mark.asyncio
    async def test_upload_files_to_session_success(self, batch_service, test_session, mock_upload_file):
        """Test successful file upload to batch session"""
        
        # Setup
        session_id = await batch_service.create_batch_upload_session(
            uploaded_by="admin@tecsalud.mx",
            processing_type=ProcessingTypeEnum.VECTORIZED,
            db=test_session
        )
        
        # Mock filename parser
        mock_parsing_result = Mock()
        mock_parsing_result.success = True
        mock_parsing_result.patient_id = "3000003799"
        mock_parsing_result.patient_name = "GARZA TIJERINA, MARIA ESTHER"
        mock_parsing_result.document_number = "6001467010"
        mock_parsing_result.document_type = "CONS"
        mock_parsing_result.error_message = None
        
        batch_service.filename_parser.parse_filename = AsyncMock(return_value=mock_parsing_result)
        
        # Test
        result = await batch_service.upload_files_to_session(
            session_id=session_id,
            files=[mock_upload_file],
            db=test_session
        )
        
        # Verify result
        assert result['session_id'] == session_id
        assert result['total_files'] == 1
        assert result['parsing_success_rate'] == 1.0
        assert len(result['uploaded_files']) == 1
        assert len(result['failed_files']) == 0
        
        # Verify database record
        batch_files = test_session.query(BatchFile).all()
        assert len(batch_files) == 1
        
        batch_file = batch_files[0]
        assert batch_file.original_filename == mock_upload_file.filename
        assert batch_file.parsed_patient_id == "3000003799"
        assert batch_file.parsed_patient_name == "GARZA TIJERINA, MARIA ESTHER"
        assert batch_file.patient_matching_status == PatientMatchingStatusEnum.PENDING
        
    @pytest.mark.asyncio
    async def test_upload_files_parsing_failure(self, batch_service, test_session, mock_upload_file):
        """Test file upload with parsing failure"""
        
        # Setup
        session_id = await batch_service.create_batch_upload_session(
            uploaded_by="admin@tecsalud.mx",
            processing_type=ProcessingTypeEnum.VECTORIZED,
            db=test_session
        )
        
        # Mock filename parser failure
        mock_parsing_result = Mock()
        mock_parsing_result.success = False
        mock_parsing_result.error_message = "Invalid filename format"
        
        batch_service.filename_parser.parse_filename = AsyncMock(return_value=mock_parsing_result)
        
        # Test
        result = await batch_service.upload_files_to_session(
            session_id=session_id,
            files=[mock_upload_file],
            db=test_session
        )
        
        # Verify result
        assert result['parsing_success_rate'] == 0.0
        
        # Verify batch file has error and requires review
        batch_file = test_session.query(BatchFile).first()
        assert batch_file.review_required == True
        assert "Filename parsing failed" in batch_file.error_message
        
    @pytest.mark.asyncio
    async def test_process_batch_upload_success(self, batch_service, test_session, test_patient):
        """Test successful batch processing"""
        
        # Setup
        session_id = await batch_service.create_batch_upload_session(
            uploaded_by="admin@tecsalud.mx",
            processing_type=ProcessingTypeEnum.VECTORIZED,
            db=test_session
        )
        
        # Create batch file
        batch_upload = test_session.query(BatchUpload).filter_by(session_id=session_id).first()
        batch_file = BatchFile(
            batch_upload_id=batch_upload.id,
            original_filename="3000003799_GARZA TIJERINA, MARIA ESTHER_6001467010_CONS.pdf",
            file_path="/tmp/test_file.pdf",
            file_size=1024,
            content_hash="abc123",
            parsed_patient_id="3000003799",
            parsed_patient_name="GARZA TIJERINA, MARIA ESTHER",
            parsed_document_number="6001467010",
            parsed_document_type="CONS"
        )
        test_session.add(batch_file)
        test_session.commit()
        
        # Mock patient matching
        mock_matching_result = Mock()
        mock_matching_result.confidence = 0.95
        mock_matching_result.matched_patient_id = test_patient.id
        mock_matching_result.review_required = False
        mock_matching_result.to_json = Mock(return_value='{"confidence": 0.95}')
        
        batch_service.patient_matcher.find_matching_patients = AsyncMock(return_value=mock_matching_result)
        
        # Mock file reading
        batch_service._read_file_content = AsyncMock(return_value="Test document content")
        
        # Mock vectorization
        batch_service.chroma_service.add_document = AsyncMock(return_value=["chunk1", "chunk2"])
        
        # Test
        result = await batch_service.process_batch_upload(
            session_id=session_id,
            db=test_session
        )
        
        # Verify result
        assert isinstance(result, BatchProcessingResult)
        assert result.session_id == session_id
        assert result.total_files == 1
        assert result.processed_files == 1
        assert result.failed_files == 0
        assert result.status == BatchUploadStatusEnum.COMPLETED
        
        # Verify database updates
        batch_upload_updated = test_session.query(BatchUpload).filter_by(session_id=session_id).first()
        assert batch_upload_updated.status == BatchUploadStatusEnum.COMPLETED
        assert batch_upload_updated.processed_files == 1
        
        # Verify medical document was created
        medical_docs = test_session.query(MedicalDocument).all()
        assert len(medical_docs) == 1
        
        medical_doc = medical_docs[0]
        assert medical_doc.patient_id == test_patient.id
        assert medical_doc.processing_type == ProcessingTypeEnum.VECTORIZED
        assert medical_doc.vectorization_status == VectorizationStatusEnum.COMPLETED
        
    @pytest.mark.asyncio
    async def test_process_batch_upload_parsing_failure(self, batch_service, test_session):
        """Test batch processing with parsing failures"""
        
        # Setup
        session_id = await batch_service.create_batch_upload_session(
            uploaded_by="admin@tecsalud.mx",
            processing_type=ProcessingTypeEnum.VECTORIZED,
            db=test_session
        )
        
        # Create batch file without parsed data (parsing failed)
        batch_upload = test_session.query(BatchUpload).filter_by(session_id=session_id).first()
        batch_file = BatchFile(
            batch_upload_id=batch_upload.id,
            original_filename="invalid_filename.pdf",
            file_path="/tmp/test_file.pdf",
            file_size=1024,
            content_hash="abc123",
            parsed_patient_id=None,  # Parsing failed
            parsed_patient_name=None,
            error_message="Filename parsing failed"
        )
        test_session.add(batch_file)
        test_session.commit()
        
        # Test
        result = await batch_service.process_batch_upload(
            session_id=session_id,
            db=test_session
        )
        
        # Verify result
        assert result.processed_files == 0
        assert result.failed_files == 1
        assert result.status == BatchUploadStatusEnum.FAILED
        
    @pytest.mark.asyncio
    async def test_process_batch_upload_patient_matching_review(self, batch_service, test_session):
        """Test batch processing requiring patient matching review"""
        
        # Setup
        session_id = await batch_service.create_batch_upload_session(
            uploaded_by="admin@tecsalud.mx",
            processing_type=ProcessingTypeEnum.VECTORIZED,
            db=test_session
        )
        
        # Create batch file
        batch_upload = test_session.query(BatchUpload).filter_by(session_id=session_id).first()
        batch_file = BatchFile(
            batch_upload_id=batch_upload.id,
            original_filename="3000003799_GARZA TIJERINA, MARIA ESTHER_6001467010_CONS.pdf",
            file_path="/tmp/test_file.pdf",
            file_size=1024,
            content_hash="abc123",
            parsed_patient_id="3000003799",
            parsed_patient_name="GARZA TIJERINA, MARIA ESTHER",
            parsed_document_number="6001467010",
            parsed_document_type="CONS"
        )
        test_session.add(batch_file)
        test_session.commit()
        
        # Mock patient matching with medium confidence (requires review)
        mock_matching_result = Mock()
        mock_matching_result.confidence = 0.85  # Medium confidence
        mock_matching_result.matched_patient_id = None
        mock_matching_result.review_required = True
        mock_matching_result.to_json = Mock(return_value='{"confidence": 0.85}')
        
        batch_service.patient_matcher.find_matching_patients = AsyncMock(return_value=mock_matching_result)
        
        # Mock patient creation
        batch_service._create_new_patient = AsyncMock(return_value=123)
        
        # Mock file reading and vectorization
        batch_service._read_file_content = AsyncMock(return_value="Test document content")
        batch_service.chroma_service.add_document = AsyncMock(return_value=["chunk1"])
        
        # Test
        result = await batch_service.process_batch_upload(
            session_id=session_id,
            db=test_session
        )
        
        # Verify result
        assert result.review_required == 1
        assert result.processed_files == 1  # Still processed but marked for review
        
        # Verify batch file marked for review
        updated_batch_file = test_session.query(BatchFile).first()
        assert updated_batch_file.review_required == True
        assert updated_batch_file.patient_matching_status == PatientMatchingStatusEnum.REVIEW_REQUIRED
        
    @pytest.mark.asyncio
    async def test_get_batch_status(self, batch_service, test_session):
        """Test getting batch status"""
        
        # Setup
        session_id = await batch_service.create_batch_upload_session(
            uploaded_by="admin@tecsalud.mx",
            processing_type=ProcessingTypeEnum.VECTORIZED,
            db=test_session
        )
        
        # Test
        status = await batch_service.get_batch_status(
            session_id=session_id,
            db=test_session
        )
        
        # Verify
        assert status['session_id'] == session_id
        assert status['uploaded_by'] == "admin@tecsalud.mx"
        assert status['processing_type'] == ProcessingTypeEnum.VECTORIZED
        assert status['status'] == BatchUploadStatusEnum.PENDING
        assert isinstance(status['files'], list)
        
    @pytest.mark.asyncio
    async def test_get_files_requiring_review(self, batch_service, test_session):
        """Test getting files requiring review"""
        
        # Setup
        session_id = await batch_service.create_batch_upload_session(
            uploaded_by="admin@tecsalud.mx",
            processing_type=ProcessingTypeEnum.VECTORIZED,
            db=test_session
        )
        
        # Create batch file requiring review
        batch_upload = test_session.query(BatchUpload).filter_by(session_id=session_id).first()
        batch_file = BatchFile(
            batch_upload_id=batch_upload.id,
            original_filename="test_file.pdf",
            file_path="/tmp/test_file.pdf",
            file_size=1024,
            content_hash="abc123",
            review_required=True,
            matching_confidence=0.85,
            patient_matching_status=PatientMatchingStatusEnum.REVIEW_REQUIRED
        )
        test_session.add(batch_file)
        test_session.commit()
        
        # Test
        review_files = await batch_service.get_files_requiring_review(
            session_id=session_id,
            db=test_session
        )
        
        # Verify
        assert len(review_files) == 1
        review_file = review_files[0]
        assert review_file['filename'] == "test_file.pdf"
        assert review_file['matching_confidence'] == 0.85
        assert review_file['patient_matching_status'] == PatientMatchingStatusEnum.REVIEW_REQUIRED
        
    @pytest.mark.asyncio
    async def test_parallel_file_processing(self, batch_service, test_session, test_patient):
        """Test parallel processing of multiple files"""
        
        # Setup
        session_id = await batch_service.create_batch_upload_session(
            uploaded_by="admin@tecsalud.mx",
            processing_type=ProcessingTypeEnum.VECTORIZED,
            db=test_session
        )
        
        # Create multiple batch files
        batch_upload = test_session.query(BatchUpload).filter_by(session_id=session_id).first()
        
        for i in range(3):
            batch_file = BatchFile(
                batch_upload_id=batch_upload.id,
                original_filename=f"file_{i}.pdf",
                file_path=f"/tmp/file_{i}.pdf",
                file_size=1024,
                content_hash=f"hash_{i}",
                parsed_patient_id="3000003799",
                parsed_patient_name="GARZA TIJERINA, MARIA ESTHER",
                parsed_document_number=f"600146701{i}",
                parsed_document_type="CONS"
            )
            test_session.add(batch_file)
        
        test_session.commit()
        
        # Mock dependencies
        mock_matching_result = Mock()
        mock_matching_result.confidence = 0.95
        mock_matching_result.matched_patient_id = test_patient.id
        mock_matching_result.review_required = False
        mock_matching_result.to_json = Mock(return_value='{"confidence": 0.95}')
        
        batch_service.patient_matcher.find_matching_patients = AsyncMock(return_value=mock_matching_result)
        batch_service._read_file_content = AsyncMock(return_value="Test content")
        batch_service.chroma_service.add_document = AsyncMock(return_value=["chunk1"])
        
        # Test
        result = await batch_service.process_batch_upload(
            session_id=session_id,
            db=test_session
        )
        
        # Verify all files processed
        assert result.total_files == 3
        assert result.processed_files == 3
        assert result.failed_files == 0
        
        # Verify all medical documents created
        medical_docs = test_session.query(MedicalDocument).all()
        assert len(medical_docs) == 3
        
    @pytest.mark.asyncio
    async def test_cleanup_batch_session(self, batch_service, test_session):
        """Test cleaning up batch session"""
        
        # Setup
        session_id = await batch_service.create_batch_upload_session(
            uploaded_by="admin@tecsalud.mx",
            processing_type=ProcessingTypeEnum.VECTORIZED,
            db=test_session
        )
        
        # Create session directory
        session_dir = batch_service.upload_directory / session_id
        session_dir.mkdir(exist_ok=True)
        
        # Create test file
        test_file = session_dir / "test.pdf"
        test_file.write_text("test content")
        
        assert session_dir.exists()
        assert test_file.exists()
        
        # Test cleanup
        await batch_service.cleanup_batch_session(
            session_id=session_id,
            db=test_session
        )
        
        # Verify directory is removed
        assert not session_dir.exists()


class TestBatchProcessingEdgeCases:
    """Test edge cases and error conditions"""
    
    @pytest.mark.asyncio
    async def test_invalid_session_id(self, batch_service, test_session):
        """Test operations with invalid session ID"""
        
        invalid_session_id = str(uuid.uuid4())
        
        # Test upload files to invalid session
        with pytest.raises(ValueError, match="Batch upload session not found"):
            await batch_service.upload_files_to_session(
                session_id=invalid_session_id,
                files=[],
                db=test_session
            )
        
        # Test process invalid session
        with pytest.raises(ValueError, match="Batch upload session not found"):
            await batch_service.process_batch_upload(
                session_id=invalid_session_id,
                db=test_session
            )
        
        # Test get status for invalid session
        with pytest.raises(ValueError, match="Batch upload session not found"):
            await batch_service.get_batch_status(
                session_id=invalid_session_id,
                db=test_session
            )
    
    @pytest.mark.asyncio
    async def test_process_already_started_session(self, batch_service, test_session):
        """Test processing session that's already started"""
        
        # Setup
        session_id = await batch_service.create_batch_upload_session(
            uploaded_by="admin@tecsalud.mx",
            processing_type=ProcessingTypeEnum.VECTORIZED,
            db=test_session
        )
        
        # Mark session as processing
        batch_upload = test_session.query(BatchUpload).filter_by(session_id=session_id).first()
        batch_upload.status = BatchUploadStatusEnum.PROCESSING
        test_session.commit()
        
        # Test
        with pytest.raises(ValueError, match="Batch upload session already processed"):
            await batch_service.process_batch_upload(
                session_id=session_id,
                db=test_session
            )
    
    @pytest.mark.asyncio
    async def test_upload_to_started_session(self, batch_service, test_session, mock_upload_file):
        """Test uploading files to session that's already started"""
        
        # Setup
        session_id = await batch_service.create_batch_upload_session(
            uploaded_by="admin@tecsalud.mx",
            processing_type=ProcessingTypeEnum.VECTORIZED,
            db=test_session
        )
        
        # Mark session as processing
        batch_upload = test_session.query(BatchUpload).filter_by(session_id=session_id).first()
        batch_upload.status = BatchUploadStatusEnum.PROCESSING
        test_session.commit()
        
        # Test
        with pytest.raises(ValueError, match="Batch upload session already started"):
            await batch_service.upload_files_to_session(
                session_id=session_id,
                files=[mock_upload_file],
                db=test_session
            )


if __name__ == "__main__":
    pytest.main([__file__, "-v"]) 