"""
MongoDB Batch Processing Models
Pydantic models for batch upload and processing documents
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
from enum import Enum


class BatchUploadStatusEnum(str, Enum):
    """Batch upload status enum for admin bulk uploads"""
    PENDING = "pending"             # Upload initiated but not started
    PROCESSING = "processing"       # Files being processed
    COMPLETED = "completed"         # All files processed successfully
    PARTIALLY_FAILED = "partially_failed"  # Some files failed
    FAILED = "failed"              # Upload completely failed


class PatientMatchingStatusEnum(str, Enum):
    """Patient matching status enum for batch processing"""
    PENDING = "pending"             # Not yet matched
    MATCHED = "matched"             # Successfully matched to existing patient
    NEW_PATIENT = "new_patient"     # New patient created
    REVIEW_REQUIRED = "review_required"  # Admin review required
    REJECTED = "rejected"           # Matching rejected by admin


class VectorizationStatusEnum(str, Enum):
    """Vectorization status enum for document processing"""
    PENDING = "pending"             # Not yet processed
    PROCESSING = "processing"       # Currently being processed
    COMPLETED = "completed"         # Successfully processed
    FAILED = "failed"              # Processing failed


class ProcessingTypeEnum(str, Enum):
    """Document processing type enum for dual processing system"""
    VECTORIZED = "vectorized"       # Only vectorized for semantic search
    COMPLETE = "complete"           # Complete content stored for full context
    BOTH = "both"                  # Both vectorized and complete storage


class BatchUpload(BaseModel):
    """Batch upload session MongoDB document"""
    id: Optional[int] = Field(default=None, alias="_id")
    session_id: str = Field(..., unique=True, index=True)  # UUID for tracking
    uploaded_by: str = Field(..., index=True)  # Admin user who initiated upload
    total_files: int = 0
    processed_files: int = 0
    failed_files: int = 0
    processing_type: ProcessingTypeEnum
    status: BatchUploadStatusEnum = BatchUploadStatusEnum.PENDING
    error_message: Optional[str] = None  # Error details if failed
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    class Config:
        use_enum_values = True
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "session_id": "550e8400-e29b-41d4-a716-446655440000",
                "uploaded_by": "admin@tecsalud.com",
                "total_files": 50,
                "processed_files": 45,
                "failed_files": 5,
                "processing_type": "both",
                "status": "completed"
            }
        }


class BatchFile(BaseModel):
    """Individual file in a batch upload session MongoDB document"""
    id: Optional[int] = Field(default=None, alias="_id")
    batch_upload_id: int = Field(..., index=True)  # Reference to BatchUpload
    original_filename: str
    file_path: str
    file_size: int
    content_hash: str = Field(..., index=True)  # SHA-256 hash for deduplication
    
    # TecSalud filename parsing results
    parsed_patient_id: Optional[str] = None  # From filename: "3000003799"
    parsed_patient_name: Optional[str] = None  # From filename: "GARZA TIJERINA, MARIA ESTHER"
    parsed_document_number: Optional[str] = None  # From filename: "6001467010"
    parsed_document_type: Optional[str] = None  # From filename: "CONS"
    
    # Patient matching results
    patient_matching_status: PatientMatchingStatusEnum = PatientMatchingStatusEnum.PENDING
    matched_patient_id: Optional[int] = None  # If matched to existing patient
    matching_confidence: Optional[float] = None  # Confidence score 0-1
    matching_details: Optional[str] = None  # JSON with detailed matching results
    
    # Processing results
    processing_status: VectorizationStatusEnum = VectorizationStatusEnum.PENDING
    medical_document_id: Optional[int] = None  # If successfully processed
    error_message: Optional[str] = None  # Error details if failed
    
    # Admin review
    review_required: bool = False
    reviewed_by: Optional[str] = None  # Admin who reviewed
    reviewed_at: Optional[datetime] = None
    review_notes: Optional[str] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    processed_at: Optional[datetime] = None
    
    class Config:
        use_enum_values = True
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "batch_upload_id": 1,
                "original_filename": "3000003799_GARZA TIJERINA, MARIA ESTHER_6001467010_CONS.pdf",
                "file_path": "/uploads/batch_123/file.pdf",
                "file_size": 1024000,
                "content_hash": "sha256_hash_here",
                "parsed_patient_id": "3000003799",
                "parsed_patient_name": "GARZA TIJERINA, MARIA ESTHER",
                "parsed_document_number": "6001467010",
                "parsed_document_type": "CONS",
                "patient_matching_status": "matched",
                "matched_patient_id": 123,
                "matching_confidence": 0.95,
                "processing_status": "completed",
                "medical_document_id": 456
            }
        } 