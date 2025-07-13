"""
MongoDB Patient Models
Pydantic models for patient-related MongoDB documents
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime, date
from enum import Enum


class GenderEnum(str, Enum):
    """Gender enum for database"""
    MALE = "masculino"
    FEMALE = "femenino"
    OTHER = "otro"
    UNKNOWN = "desconocido"


class BloodTypeEnum(str, Enum):
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


class StatusEnum(str, Enum):
    """Patient status enum"""
    ACTIVE = "Activo"
    FOLLOW_UP = "Seguimiento"
    CONTROL = "Control"
    PREGNANCY = "Embarazo"
    POST_OP = "Post-operatorio"
    INACTIVE = "Inactivo"


class Doctor(BaseModel):
    """Doctor MongoDB document"""
    id: Optional[int] = Field(default=None, alias="_id")
    email: str = Field(..., unique=True, index=True)
    name: str
    specialty: str
    license_number: str = Field(..., unique=True)
    phone: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        use_enum_values = True
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "email": "doctor@tecsalud.com",
                "name": "Dr. Juan Pérez",
                "specialty": "Cardiología",
                "license_number": "MED123456",
                "phone": "+52 81 1234 5678"
            }
        }


class Patient(BaseModel):
    """Patient MongoDB document"""
    id: Optional[int] = Field(default=None, alias="_id")
    medical_record_number: str = Field(..., unique=True, index=True)
    name: str = Field(..., index=True)
    birth_date: date
    gender: GenderEnum
    blood_type: BloodTypeEnum = BloodTypeEnum.UNKNOWN
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    insurance_number: Optional[str] = None
    status: StatusEnum = StatusEnum.ACTIVE
    
    # Foreign Keys (stored as references in MongoDB)
    doctor_id: int
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        use_enum_values = True
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "medical_record_number": "3000003799",
                "name": "María García López",
                "birth_date": "1985-03-15",
                "gender": "femenino",
                "blood_type": "O+",
                "phone": "+52 81 1234 5678",
                "email": "maria.garcia@email.com",
                "doctor_id": 1,
                "status": "Activo"
            }
        }


class PatientInteraction(BaseModel):
    """Patient interaction MongoDB document"""
    id: Optional[int] = Field(default=None, alias="_id")
    patient_id: int = Field(..., index=True)
    doctor_id: int = Field(..., index=True)
    interaction_type: str  # 'view', 'chat', 'update', etc.
    interaction_summary: Optional[str] = None
    duration_seconds: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    
    class Config:
        use_enum_values = True
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "patient_id": 1,
                "doctor_id": 1,
                "interaction_type": "chat",
                "interaction_summary": "Consulta sobre síntomas de dolor abdominal",
                "duration_seconds": 1200
            }
        } 