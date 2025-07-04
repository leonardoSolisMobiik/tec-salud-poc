"""
Medical Models
Pydantic models for medical data, patients, and clinical records
"""

from pydantic import BaseModel, Field, validator
from typing import List, Dict, Any, Optional
from datetime import datetime, date
from enum import Enum

class Gender(str, Enum):
    """Patient gender options"""
    MALE = "masculino"
    FEMALE = "femenino"
    OTHER = "otro"
    UNKNOWN = "desconocido"

class BloodType(str, Enum):
    """Blood type options"""
    A_POSITIVE = "A+"
    A_NEGATIVE = "A-"
    B_POSITIVE = "B+"
    B_NEGATIVE = "B-"
    AB_POSITIVE = "AB+"
    AB_NEGATIVE = "AB-"
    O_POSITIVE = "O+"
    O_NEGATIVE = "O-"
    UNKNOWN = "desconocido"

class DocumentType(str, Enum):
    """Medical document types"""
    HISTORY = "historia_clinica"
    LAB_RESULTS = "resultados_laboratorio"
    IMAGING = "estudios_imagen"
    PRESCRIPTION = "receta_medica"
    DISCHARGE = "alta_medica"
    CONSULTATION = "consulta"
    SURGERY = "cirugia"
    OTHER = "otro"

class Patient(BaseModel):
    """Patient information model"""
    id: str
    name: str
    birth_date: date
    gender: Gender
    blood_type: Optional[BloodType] = BloodType.UNKNOWN
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    insurance_number: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    @property
    def age(self) -> int:
        """Calculate patient age"""
        today = date.today()
        return today.year - self.birth_date.year - (
            (today.month, today.day) < (self.birth_date.month, self.birth_date.day)
        )
    
    @validator('phone')
    def validate_phone(cls, v):
        if v and not v.replace('+', '').replace('-', '').replace(' ', '').isdigit():
            raise ValueError('Invalid phone number format')
        return v
    
    class Config:
        use_enum_values = True

class VitalSigns(BaseModel):
    """Vital signs measurement"""
    systolic_bp: Optional[int] = Field(None, ge=50, le=300)
    diastolic_bp: Optional[int] = Field(None, ge=30, le=200)
    heart_rate: Optional[int] = Field(None, ge=30, le=250)
    temperature: Optional[float] = Field(None, ge=30.0, le=45.0)
    respiratory_rate: Optional[int] = Field(None, ge=5, le=60)
    oxygen_saturation: Optional[int] = Field(None, ge=70, le=100)
    weight: Optional[float] = Field(None, ge=0.5, le=500.0)
    height: Optional[float] = Field(None, ge=30.0, le=250.0)
    measured_at: datetime = Field(default_factory=datetime.utcnow)
    
    @property
    def bmi(self) -> Optional[float]:
        """Calculate BMI if weight and height are available"""
        if self.weight and self.height:
            height_m = self.height / 100  # Convert cm to meters
            return round(self.weight / (height_m ** 2), 2)
        return None

class MedicalDocument(BaseModel):
    """Medical document model"""
    id: str
    patient_id: str
    document_type: DocumentType
    title: str
    content: str
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    tags: List[str] = []
    metadata: Dict[str, Any] = {}
    
    class Config:
        use_enum_values = True

class Diagnosis(BaseModel):
    """Medical diagnosis model"""
    id: str
    patient_id: str
    code: Optional[str] = None  # ICD-10 code
    description: str
    diagnosis_type: str = "primary"  # primary, secondary, differential
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0)
    diagnosed_by: str
    diagnosed_at: datetime = Field(default_factory=datetime.utcnow)
    notes: Optional[str] = None

class Treatment(BaseModel):
    """Medical treatment model"""
    id: str
    patient_id: str
    diagnosis_id: Optional[str] = None
    treatment_type: str  # medication, procedure, therapy, etc.
    description: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    duration: Optional[str] = None
    prescribed_by: str
    prescribed_at: datetime = Field(default_factory=datetime.utcnow)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    notes: Optional[str] = None

class MedicalRecord(BaseModel):
    """Complete medical record for a patient"""
    patient: Patient
    vital_signs: List[VitalSigns] = []
    documents: List[MedicalDocument] = []
    diagnoses: List[Diagnosis] = []
    treatments: List[Treatment] = []
    allergies: List[str] = []
    medications: List[str] = []
    medical_history: List[str] = []
    family_history: List[str] = []
    last_visit: Optional[datetime] = None
    
class PatientSearch(BaseModel):
    """Patient search request"""
    query: str
    limit: int = Field(default=10, ge=1, le=100)
    offset: int = Field(default=0, ge=0)
    filters: Dict[str, Any] = {}

class PatientSearchResult(BaseModel):
    """Patient search result"""
    patients: List[Patient]
    total: int
    limit: int
    offset: int

class DocumentAnalysisRequest(BaseModel):
    """Request for document analysis"""
    document_id: str
    analysis_type: str = "summary"  # summary, diagnosis, treatment, etc.
    include_context: bool = True

class DocumentAnalysisResponse(BaseModel):
    """Response from document analysis"""
    document_id: str
    analysis_type: str
    summary: str
    key_findings: List[str] = []
    recommendations: List[str] = []
    confidence: float = Field(ge=0.0, le=1.0)
    processed_at: datetime = Field(default_factory=datetime.utcnow)

