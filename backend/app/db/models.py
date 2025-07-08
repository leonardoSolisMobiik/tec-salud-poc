"""
SQLAlchemy Database Models
Models for TecSalud application including doctors, patients, and interactions
"""

from sqlalchemy import Column, Integer, String, DateTime, Date, Float, Boolean, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import enum

from app.core.database import Base


class GenderEnum(str, enum.Enum):
    """Gender enum for database"""
    MALE = "masculino"
    FEMALE = "femenino"
    OTHER = "otro"
    UNKNOWN = "desconocido"


class BloodTypeEnum(str, enum.Enum):
    """Blood type enum for database"""
    A_POSITIVE = "A+"
    A_NEGATIVE = "A-"
    B_POSITIVE = "B+"
    B_NEGATIVE = "B-"
    AB_POSITIVE = "AB+"
    AB_NEGATIVE = "AB-"
    O_POSITIVE = "O+"
    O_NEGATIVE = "O-"
    UNKNOWN = "desconocido"


class DocumentTypeEnum(str, enum.Enum):
    """Document type enum for database"""
    HISTORY = "historia_clinica"
    LAB_RESULTS = "resultados_laboratorio"
    IMAGING = "estudios_imagen"
    PRESCRIPTION = "receta_medica"
    DISCHARGE = "alta_medica"
    CONSULTATION = "consulta"
    SURGERY = "cirugia"
    OTHER = "otro"


class StatusEnum(str, enum.Enum):
    """Patient status enum"""
    ACTIVE = "Activo"
    FOLLOW_UP = "Seguimiento"
    CONTROL = "Control"
    PREGNANCY = "Embarazo"
    POST_OP = "Post-operatorio"
    INACTIVE = "Inactivo"


class ProcessingTypeEnum(str, enum.Enum):
    """Document processing type enum for dual processing system"""
    VECTORIZED = "vectorized"       # Only vectorized for semantic search
    COMPLETE = "complete"           # Complete content stored for full context
    BOTH = "both"                  # Both vectorized and complete storage


class VectorizationStatusEnum(str, enum.Enum):
    """Vectorization status enum for document processing"""
    PENDING = "pending"             # Not yet processed
    PROCESSING = "processing"       # Currently being processed
    COMPLETED = "completed"         # Successfully processed
    FAILED = "failed"              # Processing failed


class BatchUploadStatusEnum(str, enum.Enum):
    """Batch upload status enum for admin bulk uploads"""
    PENDING = "pending"             # Upload initiated but not started
    PROCESSING = "processing"       # Files being processed
    COMPLETED = "completed"         # All files processed successfully
    PARTIALLY_FAILED = "partially_failed"  # Some files failed
    FAILED = "failed"              # Upload completely failed


class PatientMatchingStatusEnum(str, enum.Enum):
    """Patient matching status enum for batch processing"""
    PENDING = "pending"             # Not yet matched
    MATCHED = "matched"             # Successfully matched to existing patient
    NEW_PATIENT = "new_patient"     # New patient created
    REVIEW_REQUIRED = "review_required"  # Admin review required
    REJECTED = "rejected"           # Matching rejected by admin


class Doctor(Base):
    """Doctor model"""
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    specialty = Column(String, nullable=False)
    license_number = Column(String, unique=True, nullable=False)
    phone = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    patients = relationship("Patient", back_populates="doctor")
    interactions = relationship("PatientInteraction", back_populates="doctor")


class Patient(Base):
    """Patient model"""
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    medical_record_number = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False, index=True)
    birth_date = Column(Date, nullable=False)
    gender = Column(Enum(GenderEnum), nullable=False)
    blood_type = Column(Enum(BloodTypeEnum), default=BloodTypeEnum.UNKNOWN)
    phone = Column(String)
    email = Column(String)
    address = Column(Text)
    emergency_contact = Column(String)
    insurance_number = Column(String)
    status = Column(Enum(StatusEnum), default=StatusEnum.ACTIVE)
    
    # Foreign Keys
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    doctor = relationship("Doctor", back_populates="patients")
    vital_signs = relationship("VitalSign", back_populates="patient", cascade="all, delete-orphan")
    documents = relationship("MedicalDocument", back_populates="patient", cascade="all, delete-orphan")
    diagnoses = relationship("Diagnosis", back_populates="patient", cascade="all, delete-orphan")
    treatments = relationship("Treatment", back_populates="patient", cascade="all, delete-orphan")
    interactions = relationship("PatientInteraction", back_populates="patient", cascade="all, delete-orphan")
    

class PatientInteraction(Base):
    """Track interactions between doctors and patient records"""
    __tablename__ = "patient_interactions"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    interaction_type = Column(String, nullable=False)  # 'view', 'chat', 'update', etc.
    interaction_summary = Column(Text)
    duration_seconds = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    patient = relationship("Patient", back_populates="interactions")
    doctor = relationship("Doctor", back_populates="interactions")


class VitalSign(Base):
    """Vital signs measurements"""
    __tablename__ = "vital_signs"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    systolic_bp = Column(Integer)
    diastolic_bp = Column(Integer)
    heart_rate = Column(Integer)
    temperature = Column(Float)
    respiratory_rate = Column(Integer)
    oxygen_saturation = Column(Integer)
    weight = Column(Float)
    height = Column(Float)
    measured_at = Column(DateTime(timezone=True), server_default=func.now())
    measured_by = Column(String)
    
    # Relationships
    patient = relationship("Patient", back_populates="vital_signs")


class MedicalDocument(Base):
    """Medical documents with dual processing support"""
    __tablename__ = "medical_documents"

    # Original fields
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    document_type = Column(Enum(DocumentTypeEnum), nullable=False)
    title = Column(String, nullable=False)
    content = Column(Text)
    file_path = Column(String)
    file_size = Column(Integer)
    created_by = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # New fields for dual processing system
    processing_type = Column(Enum(ProcessingTypeEnum), default=ProcessingTypeEnum.VECTORIZED, nullable=False)
    original_filename = Column(String)  # Original filename from upload
    vectorization_status = Column(Enum(VectorizationStatusEnum), default=VectorizationStatusEnum.PENDING, nullable=False)
    chunks_count = Column(Integer, default=0)  # Number of chunks created during vectorization
    content_hash = Column(String)  # SHA-256 hash of content for deduplication
    
    # Relationships
    patient = relationship("Patient", back_populates="documents")
    batch_file = relationship("BatchFile", back_populates="medical_document", uselist=False)


class Diagnosis(Base):
    """Medical diagnoses"""
    __tablename__ = "diagnoses"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    code = Column(String)  # ICD-10 code
    description = Column(Text, nullable=False)
    diagnosis_type = Column(String, default="primary")
    confidence = Column(Float)
    diagnosed_by = Column(String, nullable=False)
    diagnosed_at = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(Text)
    
    # Relationships
    patient = relationship("Patient", back_populates="diagnoses")
    treatments = relationship("Treatment", back_populates="diagnosis")


class Treatment(Base):
    """Medical treatments"""
    __tablename__ = "treatments"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    diagnosis_id = Column(Integer, ForeignKey("diagnoses.id"))
    treatment_type = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    dosage = Column(String)
    frequency = Column(String)
    duration = Column(String)
    prescribed_by = Column(String, nullable=False)
    prescribed_at = Column(DateTime(timezone=True), server_default=func.now())
    start_date = Column(Date)
    end_date = Column(Date)
    notes = Column(Text)
    
    # Relationships
    patient = relationship("Patient", back_populates="treatments")
    diagnosis = relationship("Diagnosis", back_populates="treatments")


class BatchUpload(Base):
    """Batch upload session for admin bulk document uploads"""
    __tablename__ = "batch_uploads"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, unique=True, index=True, nullable=False)  # UUID for tracking
    uploaded_by = Column(String, nullable=False)  # Admin user who initiated upload
    total_files = Column(Integer, default=0)
    processed_files = Column(Integer, default=0)
    failed_files = Column(Integer, default=0)
    processing_type = Column(Enum(ProcessingTypeEnum), nullable=False)
    status = Column(Enum(BatchUploadStatusEnum), default=BatchUploadStatusEnum.PENDING, nullable=False)
    error_message = Column(Text)  # Error details if failed
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    
    # Relationships
    batch_files = relationship("BatchFile", back_populates="batch_upload", cascade="all, delete-orphan")


class BatchFile(Base):
    """Individual file in a batch upload session"""
    __tablename__ = "batch_files"

    id = Column(Integer, primary_key=True, index=True)
    batch_upload_id = Column(Integer, ForeignKey("batch_uploads.id"), nullable=False)
    original_filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    content_hash = Column(String, nullable=False)  # SHA-256 hash for deduplication
    
    # TecSalud filename parsing results
    parsed_patient_id = Column(String)  # From filename: "3000003799"
    parsed_patient_name = Column(String)  # From filename: "GARZA TIJERINA, MARIA ESTHER"
    parsed_document_number = Column(String)  # From filename: "6001467010"
    parsed_document_type = Column(String)  # From filename: "CONS"
    
    # Patient matching results
    patient_matching_status = Column(Enum(PatientMatchingStatusEnum), default=PatientMatchingStatusEnum.PENDING, nullable=False)
    matched_patient_id = Column(Integer, ForeignKey("patients.id"))  # If matched to existing patient
    matching_confidence = Column(Float)  # Confidence score 0-1
    matching_details = Column(Text)  # JSON with detailed matching results
    
    # Processing results
    processing_status = Column(Enum(VectorizationStatusEnum), default=VectorizationStatusEnum.PENDING, nullable=False)
    medical_document_id = Column(Integer, ForeignKey("medical_documents.id"))  # If successfully processed
    error_message = Column(Text)  # Error details if failed
    
    # Admin review
    review_required = Column(Boolean, default=False)
    reviewed_by = Column(String)  # Admin who reviewed
    reviewed_at = Column(DateTime(timezone=True))
    review_notes = Column(Text)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    processed_at = Column(DateTime(timezone=True))
    
    # Relationships
    batch_upload = relationship("BatchUpload", back_populates="batch_files")
    matched_patient = relationship("Patient", foreign_keys=[matched_patient_id])
    medical_document = relationship("MedicalDocument", back_populates="batch_file")