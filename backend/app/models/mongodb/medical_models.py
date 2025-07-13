"""
MongoDB Medical Models
Pydantic models for medical-related MongoDB documents
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime, date
from enum import Enum


class DocumentTypeEnum(str, Enum):
    """Document type enum for database"""
    HISTORY = "historia_clinica"
    LAB_RESULTS = "resultados_laboratorio"
    IMAGING = "estudios_imagen"
    PRESCRIPTION = "receta_medica"
    DISCHARGE = "alta_medica"
    CONSULTATION = "consulta"
    SURGERY = "cirugia"
    OTHER = "otro"


class ProcessingTypeEnum(str, Enum):
    """Document processing type enum for dual processing system"""
    VECTORIZED = "vectorized"       # Only vectorized for semantic search
    COMPLETE = "complete"           # Complete content stored for full context
    BOTH = "both"                  # Both vectorized and complete storage


class VectorizationStatusEnum(str, Enum):
    """Vectorization status enum for document processing"""
    PENDING = "pending"             # Not yet processed
    PROCESSING = "processing"       # Currently being processed
    COMPLETED = "completed"         # Successfully processed
    FAILED = "failed"              # Processing failed


class MedicalDocument(BaseModel):
    """Medical document MongoDB document"""
    id: Optional[int] = Field(default=None, alias="_id")
    patient_id: int = Field(..., index=True)
    document_type: DocumentTypeEnum = Field(..., index=True)
    title: str
    content: Optional[str] = None
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Dual processing system fields
    processing_type: ProcessingTypeEnum = ProcessingTypeEnum.VECTORIZED
    original_filename: Optional[str] = None
    vectorization_status: VectorizationStatusEnum = VectorizationStatusEnum.PENDING
    chunks_count: int = 0
    content_hash: Optional[str] = Field(None, index=True)  # SHA-256 hash for deduplication
    
    class Config:
        use_enum_values = True
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "patient_id": 1,
                "document_type": "consulta",
                "title": "Consulta Cardiología - Dr. Pérez",
                "content": "Paciente refiere dolor torácico...",
                "created_by": "admin",
                "processing_type": "both",
                "original_filename": "consulta_123.pdf"
            }
        }


class VitalSign(BaseModel):
    """Vital signs MongoDB document"""
    id: Optional[int] = Field(default=None, alias="_id")
    patient_id: int = Field(..., index=True)
    systolic_bp: Optional[int] = None
    diastolic_bp: Optional[int] = None
    heart_rate: Optional[int] = None
    temperature: Optional[float] = None
    respiratory_rate: Optional[int] = None
    oxygen_saturation: Optional[int] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    measured_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    measured_by: Optional[str] = None
    
    class Config:
        use_enum_values = True
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "patient_id": 1,
                "systolic_bp": 120,
                "diastolic_bp": 80,
                "heart_rate": 72,
                "temperature": 36.5,
                "respiratory_rate": 16,
                "oxygen_saturation": 98,
                "weight": 70.5,
                "height": 175.0,
                "measured_by": "Enfermera López"
            }
        }


class Diagnosis(BaseModel):
    """Medical diagnosis MongoDB document"""
    id: Optional[int] = Field(default=None, alias="_id")
    patient_id: int = Field(..., index=True)
    code: Optional[str] = None  # ICD-10 code
    description: str
    diagnosis_type: str = "primary"  # primary, secondary, differential
    confidence: Optional[float] = None
    diagnosed_by: str
    diagnosed_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    notes: Optional[str] = None
    
    class Config:
        use_enum_values = True
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "patient_id": 1,
                "code": "I25.9",
                "description": "Enfermedad isquémica crónica del corazón",
                "diagnosis_type": "primary",
                "confidence": 0.85,
                "diagnosed_by": "Dr. Pérez",
                "notes": "Paciente presenta síntomas característicos"
            }
        }


class Treatment(BaseModel):
    """Medical treatment MongoDB document"""
    id: Optional[int] = Field(default=None, alias="_id")
    patient_id: int = Field(..., index=True)
    diagnosis_id: Optional[int] = None  # Reference to diagnosis
    treatment_type: str  # medication, procedure, therapy, etc.
    description: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    duration: Optional[str] = None
    prescribed_by: str
    prescribed_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    notes: Optional[str] = None
    
    class Config:
        use_enum_values = True
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "patient_id": 1,
                "diagnosis_id": 1,
                "treatment_type": "medication",
                "description": "Atorvastatina",
                "dosage": "20mg",
                "frequency": "1 vez al día",
                "duration": "3 meses",
                "prescribed_by": "Dr. Pérez",
                "start_date": "2024-01-15",
                "notes": "Tomar con el desayuno"
            }
        } 