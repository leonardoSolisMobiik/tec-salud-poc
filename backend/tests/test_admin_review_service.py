#!/usr/bin/env python3
"""
Test Suite for Admin Review Service
Tests for administrative review functionality and decision processing
"""

import pytest
import json
import uuid
from datetime import datetime
from unittest.mock import Mock, AsyncMock, patch
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.models import (
    Base, BatchUpload, BatchFile, MedicalDocument, Patient, Doctor,
    BatchUploadStatusEnum, PatientMatchingStatusEnum, VectorizationStatusEnum,
    ProcessingTypeEnum, DocumentTypeEnum, GenderEnum
)
from app.services.admin_review_service import (
    AdminReviewService, AdminDecision, AdminDecisionEnum, ReviewCase
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
def test_batch_upload(test_session):
    """Create test batch upload"""
    batch_upload = BatchUpload(
        session_id=str(uuid.uuid4()),
        uploaded_by="admin@tecsalud.mx",
        processing_type=ProcessingTypeEnum.BOTH,
        status=BatchUploadStatusEnum.PROCESSING
    )
    test_session.add(batch_upload)
    test_session.commit()
    return batch_upload


@pytest.fixture
def test_batch_file(test_session, test_batch_upload, test_patient):
    """Create test batch file requiring review"""
    matching_details = {
        "algorithm": "fuzzy_match",
        "confidence": 0.85,
        "suggestions": [
            {
                "patient_id": test_patient.id,
                "similarity": 0.85,
                "name": test_patient.name
            }
        ]
    }
    
    batch_file = BatchFile(
        batch_upload_id=test_batch_upload.id,
        original_filename="3000003799_GARZA TIJERINA, MARIA ESTHER_6001467010_CONS.pdf",
        file_path="/tmp/test_file.pdf",
        file_size=1024000,
        content_hash="abc123",
        parsed_patient_id="3000003799",
        parsed_patient_name="GARZA TIJERINA, MARIA ESTHER",
        parsed_document_number="6001467010",
        parsed_document_type="CONS",
        patient_matching_status=PatientMatchingStatusEnum.REVIEW_REQUIRED,
        matched_patient_id=test_patient.id,
        matching_confidence=0.85,
        matching_details=json.dumps(matching_details),
        processing_status=VectorizationStatusEnum.PENDING,
        review_required=True
    )
    test_session.add(batch_file)
    test_session.commit()
    return batch_file


@pytest.fixture
def admin_review_service():
    """Create admin review service with mocked dependencies"""
    service = AdminReviewService()
    
    # Mock external services
    service.patient_matcher = Mock()
    service.batch_service = Mock()
    service._read_file_content = AsyncMock(return_value="Test document content")
    service._vectorize_document = AsyncMock()
    
    return service


class TestAdminReviewService:
    """Test AdminReviewService functionality"""
    
    @pytest.mark.asyncio
    async def test_get_pending_reviews(self, admin_review_service, test_session, test_batch_file):
        """Test getting pending review cases"""
        
        review_cases = await admin_review_service.get_pending_reviews(
            db=test_session,
            limit=10
        )
        
        assert len(review_cases) == 1
        case = review_cases[0]
        
        assert isinstance(case, ReviewCase)
        assert case.batch_file_id == test_batch_file.id
        assert case.filename == test_batch_file.original_filename
        assert case.parsed_patient_id == "3000003799"
        assert case.parsed_patient_name == "GARZA TIJERINA, MARIA ESTHER"
        assert case.matching_confidence == 0.85
        assert case.review_priority in ["high", "medium", "low"]
        assert case.review_category in ["patient_match", "parsing_error", "processing_error", "other"]
        assert len(case.suggested_matches) > 0
    
    @pytest.mark.asyncio
    async def test_get_pending_reviews_with_filters(self, admin_review_service, test_session, test_batch_file, test_batch_upload):
        """Test getting pending reviews with filters"""
        
        # Test session filter
        review_cases = await admin_review_service.get_pending_reviews(
            session_id=test_batch_upload.session_id,
            db=test_session
        )
        assert len(review_cases) == 1
        
        # Test priority filter
        review_cases = await admin_review_service.get_pending_reviews(
            priority="high",
            db=test_session
        )
        # Should be empty since our test case is not high priority
        assert len(review_cases) == 0
        
        # Test category filter
        review_cases = await admin_review_service.get_pending_reviews(
            category="patient_match",
            db=test_session
        )
        assert len(review_cases) == 1
    
    @pytest.mark.asyncio
    async def test_process_admin_decision_approve_match(self, admin_review_service, test_session, test_batch_file, test_patient):
        """Test approving a patient match"""
        
        decision = AdminDecision(
            decision=AdminDecisionEnum.APPROVE_MATCH,
            admin_notes="Match looks correct",
            reviewed_by="admin_test"
        )
        
        result = await admin_review_service.process_admin_decision(
            batch_file_id=test_batch_file.id,
            decision=decision,
            db=test_session
        )
        
        assert result["success"] == True
        assert result["patient_id"] == test_patient.id
        assert result["document_id"] is not None
        assert "approved" in result["message"].lower()
        
        # Verify batch file updated
        test_session.refresh(test_batch_file)
        assert test_batch_file.review_required == False
        assert test_batch_file.reviewed_by == "admin_test"
        assert test_batch_file.patient_matching_status == PatientMatchingStatusEnum.MATCHED
    
    @pytest.mark.asyncio
    async def test_process_admin_decision_reject_match(self, admin_review_service, test_session, test_batch_file):
        """Test rejecting a patient match and creating new patient"""
        
        decision = AdminDecision(
            decision=AdminDecisionEnum.REJECT_MATCH,
            admin_notes="Not the right patient",
            reviewed_by="admin_test"
        )
        
        result = await admin_review_service.process_admin_decision(
            batch_file_id=test_batch_file.id,
            decision=decision,
            db=test_session
        )
        
        assert result["success"] == True
        assert result["patient_id"] is not None
        assert result["document_id"] is not None
        assert "new patient created" in result["message"].lower()
        
        # Verify new patient was created
        new_patient = test_session.query(Patient).filter_by(id=result["patient_id"]).first()
        assert new_patient is not None
        assert new_patient.medical_record_number == test_batch_file.parsed_patient_id
        
        # Verify batch file updated
        test_session.refresh(test_batch_file)
        assert test_batch_file.review_required == False
        assert test_batch_file.patient_matching_status == PatientMatchingStatusEnum.NEW_PATIENT
    
    @pytest.mark.asyncio
    async def test_process_admin_decision_manual_match(self, admin_review_service, test_session, test_batch_file, test_patient):
        """Test manually matching to a different patient"""
        
        # Create another patient to match to
        other_patient = Patient(
            medical_record_number="3000003800",
            name="LOPEZ MARTINEZ, CARLOS EDUARDO",
            birth_date="1975-05-20",
            gender=GenderEnum.MALE,
            doctor_id=test_patient.doctor_id
        )
        test_session.add(other_patient)
        test_session.commit()
        
        decision = AdminDecision(
            decision=AdminDecisionEnum.MANUAL_MATCH,
            selected_patient_id=other_patient.id,
            admin_notes="Manually matched to correct patient",
            reviewed_by="admin_test"
        )
        
        result = await admin_review_service.process_admin_decision(
            batch_file_id=test_batch_file.id,
            decision=decision,
            db=test_session
        )
        
        assert result["success"] == True
        assert result["patient_id"] == other_patient.id
        assert result["document_id"] is not None
        assert "manually matched" in result["message"].lower()
        
        # Verify batch file updated
        test_session.refresh(test_batch_file)
        assert test_batch_file.matched_patient_id == other_patient.id
        assert test_batch_file.patient_matching_status == PatientMatchingStatusEnum.MATCHED
    
    @pytest.mark.asyncio
    async def test_process_admin_decision_skip_file(self, admin_review_service, test_session, test_batch_file):
        """Test skipping a file"""
        
        decision = AdminDecision(
            decision=AdminDecisionEnum.SKIP_FILE,
            admin_notes="File not needed",
            reviewed_by="admin_test"
        )
        
        result = await admin_review_service.process_admin_decision(
            batch_file_id=test_batch_file.id,
            decision=decision,
            db=test_session
        )
        
        assert result["success"] == True
        assert "skipped" in result["message"].lower()
        
        # Verify batch file updated
        test_session.refresh(test_batch_file)
        assert test_batch_file.review_required == False
        assert test_batch_file.patient_matching_status == PatientMatchingStatusEnum.REJECTED
        assert test_batch_file.processing_status == VectorizationStatusEnum.FAILED
        assert "Skipped by admin" in test_batch_file.error_message
    
    @pytest.mark.asyncio
    async def test_process_admin_decision_retry_processing(self, admin_review_service, test_session, test_batch_file):
        """Test retrying file processing"""
        
        decision = AdminDecision(
            decision=AdminDecisionEnum.RETRY_PROCESSING,
            admin_notes="Retry with fixed settings",
            reviewed_by="admin_test"
        )
        
        result = await admin_review_service.process_admin_decision(
            batch_file_id=test_batch_file.id,
            decision=decision,
            db=test_session
        )
        
        assert result["success"] == True
        assert "retry" in result["message"].lower()
        
        # Verify batch file updated
        test_session.refresh(test_batch_file)
        assert test_batch_file.review_required == False
        assert test_batch_file.processing_status == VectorizationStatusEnum.COMPLETED
    
    @pytest.mark.asyncio
    async def test_process_admin_decision_delete_file(self, admin_review_service, test_session, test_batch_file):
        """Test deleting a file"""
        
        decision = AdminDecision(
            decision=AdminDecisionEnum.DELETE_FILE,
            admin_notes="File corrupted",
            reviewed_by="admin_test"
        )
        
        result = await admin_review_service.process_admin_decision(
            batch_file_id=test_batch_file.id,
            decision=decision,
            db=test_session
        )
        
        assert result["success"] == True
        assert "deleted" in result["message"].lower()
        
        # Verify batch file updated
        test_session.refresh(test_batch_file)
        assert test_batch_file.review_required == False
        assert test_batch_file.patient_matching_status == PatientMatchingStatusEnum.REJECTED
        assert test_batch_file.processing_status == VectorizationStatusEnum.FAILED
        assert "Deleted by admin" in test_batch_file.error_message
    
    @pytest.mark.asyncio
    async def test_get_review_statistics(self, admin_review_service, test_session, test_batch_file, test_batch_upload):
        """Test getting review statistics"""
        
        stats = await admin_review_service.get_review_statistics(
            session_id=test_batch_upload.session_id,
            db=test_session
        )
        
        assert stats["total_files"] == 1
        assert stats["review_required"] == 1
        assert stats["completed_reviews"] == 0
        assert stats["review_percentage"] == 100.0
        assert "categories" in stats
        assert "priorities" in stats
        assert stats["categories"]["patient_match"] == 1
    
    @pytest.mark.asyncio
    async def test_bulk_approve_high_confidence_matches(self, admin_review_service, test_session, test_batch_upload):
        """Test bulk approval of high confidence matches"""
        
        # Create high confidence batch file
        high_confidence_file = BatchFile(
            batch_upload_id=test_batch_upload.id,
            original_filename="high_confidence.pdf",
            file_path="/tmp/high_confidence.pdf",
            file_size=1024000,
            content_hash="def456",
            parsed_patient_id="3000003801",
            parsed_patient_name="RODRIGUEZ SANCHEZ, ANA LUCIA",
            patient_matching_status=PatientMatchingStatusEnum.REVIEW_REQUIRED,
            matched_patient_id=1,  # Assume existing patient
            matching_confidence=0.95,  # High confidence
            processing_status=VectorizationStatusEnum.PENDING,
            review_required=True
        )
        test_session.add(high_confidence_file)
        test_session.commit()
        
        result = await admin_review_service.bulk_approve_high_confidence_matches(
            session_id=test_batch_upload.session_id,
            confidence_threshold=0.9,
            db=test_session
        )
        
        assert result["approved_count"] == 1
        assert result["failed_count"] == 0
        assert result["confidence_threshold"] == 0.9
        
        # Verify file was approved
        test_session.refresh(high_confidence_file)
        assert high_confidence_file.review_required == False
    
    def test_determine_review_category(self, admin_review_service):
        """Test review category determination"""
        
        # Test parsing error
        batch_file = Mock()
        batch_file.parsed_patient_id = None
        category = admin_review_service._determine_review_category(batch_file)
        assert category == "parsing_error"
        
        # Test patient match
        batch_file.parsed_patient_id = "123"
        batch_file.patient_matching_status = PatientMatchingStatusEnum.REVIEW_REQUIRED
        batch_file.processing_status = VectorizationStatusEnum.PENDING
        category = admin_review_service._determine_review_category(batch_file)
        assert category == "patient_match"
        
        # Test processing error
        batch_file.patient_matching_status = PatientMatchingStatusEnum.MATCHED
        batch_file.processing_status = VectorizationStatusEnum.FAILED
        category = admin_review_service._determine_review_category(batch_file)
        assert category == "processing_error"
    
    def test_determine_review_priority(self, admin_review_service):
        """Test review priority determination"""
        
        # Test high priority (parsing error)
        batch_file = Mock()
        batch_file.parsed_patient_id = None
        batch_file.processing_status = VectorizationStatusEnum.PENDING
        batch_file.matching_confidence = None
        priority = admin_review_service._determine_review_priority(batch_file)
        assert priority == "high"
        
        # Test high priority (processing failed)
        batch_file.parsed_patient_id = "123"
        batch_file.processing_status = VectorizationStatusEnum.FAILED
        priority = admin_review_service._determine_review_priority(batch_file)
        assert priority == "high"
        
        # Test medium priority (low confidence)
        batch_file.processing_status = VectorizationStatusEnum.PENDING
        batch_file.matching_confidence = 0.65
        priority = admin_review_service._determine_review_priority(batch_file)
        assert priority == "medium"
        
        # Test low priority (medium confidence)
        batch_file.matching_confidence = 0.85
        priority = admin_review_service._determine_review_priority(batch_file)
        assert priority == "low"


class TestAdminReviewEdgeCases:
    """Test edge cases and error conditions"""
    
    @pytest.mark.asyncio
    async def test_process_decision_invalid_batch_file(self, admin_review_service, test_session):
        """Test processing decision with invalid batch file ID"""
        
        decision = AdminDecision(
            decision=AdminDecisionEnum.APPROVE_MATCH,
            reviewed_by="admin_test"
        )
        
        result = await admin_review_service.process_admin_decision(
            batch_file_id=99999,  # Non-existent ID
            decision=decision,
            db=test_session
        )
        
        assert result["success"] == False
        assert "not found" in result["message"].lower()
    
    @pytest.mark.asyncio
    async def test_approve_match_no_matched_patient(self, admin_review_service, test_session, test_batch_file):
        """Test approving match when no patient is matched"""
        
        # Clear matched patient
        test_batch_file.matched_patient_id = None
        test_session.commit()
        
        decision = AdminDecision(
            decision=AdminDecisionEnum.APPROVE_MATCH,
            reviewed_by="admin_test"
        )
        
        result = await admin_review_service.process_admin_decision(
            batch_file_id=test_batch_file.id,
            decision=decision,
            db=test_session
        )
        
        assert result["success"] == False
        assert "no patient match" in result["message"].lower()
    
    @pytest.mark.asyncio
    async def test_manual_match_invalid_patient(self, admin_review_service, test_session, test_batch_file):
        """Test manual match with invalid patient ID"""
        
        decision = AdminDecision(
            decision=AdminDecisionEnum.MANUAL_MATCH,
            selected_patient_id=99999,  # Non-existent patient
            reviewed_by="admin_test"
        )
        
        result = await admin_review_service.process_admin_decision(
            batch_file_id=test_batch_file.id,
            decision=decision,
            db=test_session
        )
        
        assert result["success"] == False
        assert "not found" in result["message"].lower()
    
    @pytest.mark.asyncio
    async def test_reject_match_insufficient_data(self, admin_review_service, test_session, test_batch_file):
        """Test rejecting match with insufficient patient data"""
        
        # Clear patient data
        test_batch_file.parsed_patient_id = None
        test_batch_file.parsed_patient_name = None
        test_session.commit()
        
        decision = AdminDecision(
            decision=AdminDecisionEnum.REJECT_MATCH,
            reviewed_by="admin_test"
        )
        
        result = await admin_review_service.process_admin_decision(
            batch_file_id=test_batch_file.id,
            decision=decision,
            db=test_session
        )
        
        assert result["success"] == False
        assert "insufficient" in result["message"].lower()


if __name__ == "__main__":
    pytest.main([__file__, "-v"]) 