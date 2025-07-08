#!/usr/bin/env python3
"""
Test Suite for Dual Processing Models
Tests for MedicalDocument extensions and BatchUpload/BatchFile models
"""

import pytest
import uuid
import hashlib
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.models import (
    Base, MedicalDocument, BatchUpload, BatchFile, Patient, Doctor,
    ProcessingTypeEnum, VectorizationStatusEnum, BatchUploadStatusEnum,
    PatientMatchingStatusEnum, DocumentTypeEnum, GenderEnum
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


class TestMedicalDocumentExtensions:
    """Test MedicalDocument model extensions"""
    
    def test_medical_document_with_vectorized_processing(self, test_session, test_patient):
        """Test MedicalDocument with vectorized processing"""
        content = "Historia clínica del paciente..."
        content_hash = hashlib.sha256(content.encode()).hexdigest()
        
        document = MedicalDocument(
            patient_id=test_patient.id,
            document_type=DocumentTypeEnum.HISTORY,
            title="Historia Clínica",
            content=content,
            created_by="Dr. Juan Pérez",
            processing_type=ProcessingTypeEnum.VECTORIZED,
            original_filename="3000003799_GARZA TIJERINA, MARIA ESTHER_6001467010_HIST.pdf",
            vectorization_status=VectorizationStatusEnum.COMPLETED,
            chunks_count=5,
            content_hash=content_hash
        )
        
        test_session.add(document)
        test_session.commit()
        
        # Verify document was created with all fields
        assert document.id is not None
        assert document.processing_type == ProcessingTypeEnum.VECTORIZED
        assert document.original_filename is not None
        assert document.vectorization_status == VectorizationStatusEnum.COMPLETED
        assert document.chunks_count == 5
        assert document.content_hash == content_hash
        
    def test_medical_document_with_complete_processing(self, test_session, test_patient):
        """Test MedicalDocument with complete processing"""
        document = MedicalDocument(
            patient_id=test_patient.id,
            document_type=DocumentTypeEnum.CONSULTATION,
            title="Consulta Médica",
            content="Consulta médica detallada...",
            created_by="Dr. Juan Pérez",
            processing_type=ProcessingTypeEnum.COMPLETE,
            original_filename="3000003799_GARZA TIJERINA, MARIA ESTHER_6001467010_CONS.pdf",
            vectorization_status=VectorizationStatusEnum.PENDING,
            chunks_count=0
        )
        
        test_session.add(document)
        test_session.commit()
        
        assert document.processing_type == ProcessingTypeEnum.COMPLETE
        assert document.vectorization_status == VectorizationStatusEnum.PENDING
        assert document.chunks_count == 0
        
    def test_medical_document_with_both_processing(self, test_session, test_patient):
        """Test MedicalDocument with both vectorized and complete processing"""
        document = MedicalDocument(
            patient_id=test_patient.id,
            document_type=DocumentTypeEnum.LAB_RESULTS,
            title="Resultados de Laboratorio",
            content="Resultados de laboratorio...",
            created_by="Dr. Juan Pérez",
            processing_type=ProcessingTypeEnum.BOTH,
            original_filename="3000003799_GARZA TIJERINA, MARIA ESTHER_6001467010_LAB.pdf",
            vectorization_status=VectorizationStatusEnum.PROCESSING,
            chunks_count=3
        )
        
        test_session.add(document)
        test_session.commit()
        
        assert document.processing_type == ProcessingTypeEnum.BOTH
        assert document.vectorization_status == VectorizationStatusEnum.PROCESSING
        assert document.chunks_count == 3
        
    def test_medical_document_defaults(self, test_session, test_patient):
        """Test MedicalDocument default values"""
        document = MedicalDocument(
            patient_id=test_patient.id,
            document_type=DocumentTypeEnum.OTHER,
            title="Documento Genérico",
            content="Contenido genérico...",
            created_by="Dr. Juan Pérez"
        )
        
        test_session.add(document)
        test_session.commit()
        
        # Check default values
        assert document.processing_type == ProcessingTypeEnum.VECTORIZED
        assert document.vectorization_status == VectorizationStatusEnum.PENDING
        assert document.chunks_count == 0
        assert document.original_filename is None
        assert document.content_hash is None


class TestBatchUpload:
    """Test BatchUpload model"""
    
    def test_batch_upload_creation(self, test_session):
        """Test basic BatchUpload creation"""
        session_id = str(uuid.uuid4())
        
        batch_upload = BatchUpload(
            session_id=session_id,
            uploaded_by="admin@tecsalud.mx",
            total_files=10,
            processing_type=ProcessingTypeEnum.VECTORIZED,
            status=BatchUploadStatusEnum.PENDING
        )
        
        test_session.add(batch_upload)
        test_session.commit()
        
        assert batch_upload.id is not None
        assert batch_upload.session_id == session_id
        assert batch_upload.uploaded_by == "admin@tecsalud.mx"
        assert batch_upload.total_files == 10
        assert batch_upload.processed_files == 0
        assert batch_upload.failed_files == 0
        assert batch_upload.processing_type == ProcessingTypeEnum.VECTORIZED
        assert batch_upload.status == BatchUploadStatusEnum.PENDING
        
    def test_batch_upload_progress_tracking(self, test_session):
        """Test batch upload progress tracking"""
        batch_upload = BatchUpload(
            session_id=str(uuid.uuid4()),
            uploaded_by="admin@tecsalud.mx",
            total_files=5,
            processing_type=ProcessingTypeEnum.COMPLETE,
            status=BatchUploadStatusEnum.PROCESSING
        )
        
        test_session.add(batch_upload)
        test_session.commit()
        
        # Simulate progress
        batch_upload.processed_files = 3
        batch_upload.failed_files = 1
        batch_upload.started_at = datetime.now()
        
        test_session.commit()
        
        assert batch_upload.processed_files == 3
        assert batch_upload.failed_files == 1
        assert batch_upload.started_at is not None
        
    def test_batch_upload_completion(self, test_session):
        """Test batch upload completion"""
        batch_upload = BatchUpload(
            session_id=str(uuid.uuid4()),
            uploaded_by="admin@tecsalud.mx",
            total_files=5,
            processing_type=ProcessingTypeEnum.BOTH,
            status=BatchUploadStatusEnum.COMPLETED
        )
        
        test_session.add(batch_upload)
        test_session.commit()
        
        # Mark as completed
        batch_upload.processed_files = 5
        batch_upload.completed_at = datetime.now()
        
        test_session.commit()
        
        assert batch_upload.processed_files == 5
        assert batch_upload.completed_at is not None
        assert batch_upload.status == BatchUploadStatusEnum.COMPLETED


class TestBatchFile:
    """Test BatchFile model"""
    
    def test_batch_file_creation(self, test_session):
        """Test basic BatchFile creation"""
        # Create batch upload first
        batch_upload = BatchUpload(
            session_id=str(uuid.uuid4()),
            uploaded_by="admin@tecsalud.mx",
            total_files=1,
            processing_type=ProcessingTypeEnum.VECTORIZED
        )
        test_session.add(batch_upload)
        test_session.commit()
        
        # Create batch file
        filename = "3000003799_GARZA TIJERINA, MARIA ESTHER_6001467010_CONS.pdf"
        content_hash = hashlib.sha256(filename.encode()).hexdigest()
        
        batch_file = BatchFile(
            batch_upload_id=batch_upload.id,
            original_filename=filename,
            file_path="/tmp/uploads/" + filename,
            file_size=1024000,
            content_hash=content_hash
        )
        
        test_session.add(batch_file)
        test_session.commit()
        
        assert batch_file.id is not None
        assert batch_file.batch_upload_id == batch_upload.id
        assert batch_file.original_filename == filename
        assert batch_file.file_size == 1024000
        assert batch_file.content_hash == content_hash
        
    def test_batch_file_tecsalud_parsing(self, test_session):
        """Test BatchFile with TecSalud filename parsing results"""
        batch_upload = BatchUpload(
            session_id=str(uuid.uuid4()),
            uploaded_by="admin@tecsalud.mx",
            total_files=1,
            processing_type=ProcessingTypeEnum.VECTORIZED
        )
        test_session.add(batch_upload)
        test_session.commit()
        
        batch_file = BatchFile(
            batch_upload_id=batch_upload.id,
            original_filename="3000003799_GARZA TIJERINA, MARIA ESTHER_6001467010_CONS.pdf",
            file_path="/tmp/uploads/file.pdf",
            file_size=1024000,
            content_hash="abc123",
            parsed_patient_id="3000003799",
            parsed_patient_name="GARZA TIJERINA, MARIA ESTHER",
            parsed_document_number="6001467010",
            parsed_document_type="CONS"
        )
        
        test_session.add(batch_file)
        test_session.commit()
        
        assert batch_file.parsed_patient_id == "3000003799"
        assert batch_file.parsed_patient_name == "GARZA TIJERINA, MARIA ESTHER"
        assert batch_file.parsed_document_number == "6001467010"
        assert batch_file.parsed_document_type == "CONS"
        
    def test_batch_file_patient_matching(self, test_session, test_patient):
        """Test BatchFile with patient matching results"""
        batch_upload = BatchUpload(
            session_id=str(uuid.uuid4()),
            uploaded_by="admin@tecsalud.mx",
            total_files=1,
            processing_type=ProcessingTypeEnum.VECTORIZED
        )
        test_session.add(batch_upload)
        test_session.commit()
        
        batch_file = BatchFile(
            batch_upload_id=batch_upload.id,
            original_filename="3000003799_GARZA TIJERINA, MARIA ESTHER_6001467010_CONS.pdf",
            file_path="/tmp/uploads/file.pdf",
            file_size=1024000,
            content_hash="abc123",
            patient_matching_status=PatientMatchingStatusEnum.MATCHED,
            matched_patient_id=test_patient.id,
            matching_confidence=0.95,
            matching_details='{"algorithm": "fuzzy_match", "score": 0.95}'
        )
        
        test_session.add(batch_file)
        test_session.commit()
        
        assert batch_file.patient_matching_status == PatientMatchingStatusEnum.MATCHED
        assert batch_file.matched_patient_id == test_patient.id
        assert batch_file.matching_confidence == 0.95
        assert batch_file.matching_details is not None


class TestModelRelationships:
    """Test relationships between models"""
    
    def test_batch_upload_to_batch_files_relationship(self, test_session):
        """Test one-to-many relationship between BatchUpload and BatchFile"""
        batch_upload = BatchUpload(
            session_id=str(uuid.uuid4()),
            uploaded_by="admin@tecsalud.mx",
            total_files=2,
            processing_type=ProcessingTypeEnum.VECTORIZED
        )
        test_session.add(batch_upload)
        test_session.commit()
        
        # Create multiple batch files
        for i in range(2):
            batch_file = BatchFile(
                batch_upload_id=batch_upload.id,
                original_filename=f"file_{i}.pdf",
                file_path=f"/tmp/uploads/file_{i}.pdf",
                file_size=1024000,
                content_hash=f"hash_{i}"
            )
            test_session.add(batch_file)
        
        test_session.commit()
        
        # Test relationship
        assert len(batch_upload.batch_files) == 2
        assert all(bf.batch_upload_id == batch_upload.id for bf in batch_upload.batch_files)
        
    def test_batch_file_to_medical_document_relationship(self, test_session, test_patient):
        """Test relationship between BatchFile and MedicalDocument"""
        # Create batch upload
        batch_upload = BatchUpload(
            session_id=str(uuid.uuid4()),
            uploaded_by="admin@tecsalud.mx",
            total_files=1,
            processing_type=ProcessingTypeEnum.VECTORIZED
        )
        test_session.add(batch_upload)
        test_session.commit()
        
        # Create medical document
        document = MedicalDocument(
            patient_id=test_patient.id,
            document_type=DocumentTypeEnum.CONSULTATION,
            title="Consulta Médica",
            content="Consulta médica detallada...",
            created_by="Dr. Juan Pérez"
        )
        test_session.add(document)
        test_session.commit()
        
        # Create batch file linked to document
        batch_file = BatchFile(
            batch_upload_id=batch_upload.id,
            original_filename="3000003799_GARZA TIJERINA, MARIA ESTHER_6001467010_CONS.pdf",
            file_path="/tmp/uploads/file.pdf",
            file_size=1024000,
            content_hash="abc123",
            medical_document_id=document.id
        )
        test_session.add(batch_file)
        test_session.commit()
        
        # Test relationships
        assert batch_file.medical_document_id == document.id
        assert batch_file.medical_document == document
        assert document.batch_file == batch_file


class TestEnums:
    """Test enum values"""
    
    def test_processing_type_enum(self):
        """Test ProcessingTypeEnum values"""
        assert ProcessingTypeEnum.VECTORIZED == "vectorized"
        assert ProcessingTypeEnum.COMPLETE == "complete"
        assert ProcessingTypeEnum.BOTH == "both"
        
    def test_vectorization_status_enum(self):
        """Test VectorizationStatusEnum values"""
        assert VectorizationStatusEnum.PENDING == "pending"
        assert VectorizationStatusEnum.PROCESSING == "processing"
        assert VectorizationStatusEnum.COMPLETED == "completed"
        assert VectorizationStatusEnum.FAILED == "failed"
        
    def test_batch_upload_status_enum(self):
        """Test BatchUploadStatusEnum values"""
        assert BatchUploadStatusEnum.PENDING == "pending"
        assert BatchUploadStatusEnum.PROCESSING == "processing"
        assert BatchUploadStatusEnum.COMPLETED == "completed"
        assert BatchUploadStatusEnum.PARTIALLY_FAILED == "partially_failed"
        assert BatchUploadStatusEnum.FAILED == "failed"
        
    def test_patient_matching_status_enum(self):
        """Test PatientMatchingStatusEnum values"""
        assert PatientMatchingStatusEnum.PENDING == "pending"
        assert PatientMatchingStatusEnum.MATCHED == "matched"
        assert PatientMatchingStatusEnum.NEW_PATIENT == "new_patient"
        assert PatientMatchingStatusEnum.REVIEW_REQUIRED == "review_required"
        assert PatientMatchingStatusEnum.REJECTED == "rejected"


if __name__ == "__main__":
    pytest.main([__file__, "-v"]) 