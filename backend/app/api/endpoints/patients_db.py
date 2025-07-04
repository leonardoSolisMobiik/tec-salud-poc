"""
Patients Endpoints with Database Support
API endpoints for patient management using SQLAlchemy models
"""

import logging
import unicodedata
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, or_, and_, func

from app.core.database import get_db
from app.db.models import Patient, Doctor, PatientInteraction, StatusEnum
from app.models.medical import PatientSearch
from app.services.chroma_service import chroma_service
from app.utils.exceptions import ChromaError

logger = logging.getLogger(__name__)

router = APIRouter()


def normalize_text(text: str) -> str:
    """
    Normalize text by removing accents and converting to lowercase
    
    Args:
        text: Text to normalize
        
    Returns:
        Normalized text without accents
    """
    if not text:
        return ""
    
    # Convert to lowercase
    text = text.lower()
    
    # Normalize using NFD (decompose characters)
    normalized = unicodedata.normalize('NFD', text)
    
    # Filter out combining characters (accents)
    return ''.join(char for char in normalized if unicodedata.category(char) != 'Mn')


@router.get("/")
async def get_patients(
    limit: int = 10,
    offset: int = 0,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get list of patients with pagination
    
    Args:
        limit: Maximum number of patients to return
        offset: Number of patients to skip
        db: Database session
        
    Returns:
        PatientSearchResult with list of patients
    """
    try:
        logger.info(f"👥 Getting patients list (limit: {limit}, offset: {offset})")
        
        # Get total count of patients
        total = db.query(Patient).count()
        
        # Get patients from database
        patients = db.query(Patient).offset(offset).limit(limit).all()
        
        # Convert to dict format expected by frontend
        patient_list = []
        for patient in patients:
            patient_dict = {
                "id": str(patient.id),
                "name": patient.name,
                "age": (datetime.now().date() - patient.birth_date).days // 365,
                "gender": patient.gender.value,
                "blood_type": patient.blood_type.value,
                "phone": patient.phone,
                "email": patient.email,
                "medical_record_number": patient.medical_record_number,
                "status": patient.status.value,
                "conditions": [],  # Could be populated from diagnoses
                "allergies": [],  # Would need to add to model
                "medications": []  # Could be populated from treatments
            }
            
            # Get last interaction date
            last_interaction = db.query(PatientInteraction).filter(
                PatientInteraction.patient_id == patient.id
            ).order_by(desc(PatientInteraction.created_at)).first()
            
            if last_interaction:
                patient_dict["last_visit"] = last_interaction.created_at.isoformat()
            else:
                patient_dict["last_visit"] = patient.created_at.isoformat()
            
            patient_list.append(patient_dict)
        
        # Return in expected format
        return {
            "patients": patient_list,
            "total": total,
            "page": (offset // limit) + 1,
            "per_page": limit
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to get patients: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve patients")


@router.get("/recent", response_model=List[Dict[str, Any]])
async def get_recent_patients(
    limit: int = 10,
    doctor_id: int = 1,  # Default to first doctor, should come from auth
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """
    Get patients with recent interactions, ordered by last interaction
    
    Args:
        limit: Maximum number of patients to return
        doctor_id: ID of the doctor
        db: Database session
        
    Returns:
        List of recently accessed patients
    """
    try:
        logger.info(f"🕐 Getting recent patients for doctor {doctor_id}")
        
        # Subquery to get the latest interaction for each patient
        from sqlalchemy import func
        latest_interactions = db.query(
            PatientInteraction.patient_id,
            func.max(PatientInteraction.created_at).label('last_interaction')
        ).filter(
            PatientInteraction.doctor_id == doctor_id
        ).group_by(PatientInteraction.patient_id).subquery()
        
        # Get patients with their latest interaction, ordered by interaction time
        recent_patients = db.query(Patient, latest_interactions.c.last_interaction).join(
            latest_interactions,
            Patient.id == latest_interactions.c.patient_id
        ).order_by(desc(latest_interactions.c.last_interaction)).limit(limit).all()
        
        # Convert to frontend format
        patient_list = []
        for patient, last_interaction in recent_patients:
            # Calculate age
            age = (datetime.now().date() - patient.birth_date).days // 365
            
            # Get specialty from first diagnosis or default
            specialty = "Medicina Interna"
            if patient.diagnoses:
                specialty = patient.diagnoses[0].description.split()[0]
            
            patient_dict = {
                "id": str(patient.id),
                "name": patient.name,
                "age": age,
                "specialty": specialty,
                "expediente": patient.medical_record_number,
                "status": patient.status.value,
                "lastVisit": last_interaction.isoformat()
            }
            patient_list.append(patient_dict)
        
        return patient_list
        
    except Exception as e:
        logger.error(f"❌ Failed to get recent patients: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve recent patients")


@router.get("/search")
async def search_patients(
    query: str,
    limit: int = 10,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """
    Search patients by name, medical record number, or other criteria
    
    Args:
        query: Search query
        limit: Maximum results
        offset: Results offset
        db: Database session
        
    Returns:
        Search results with patients
    """
    try:
        logger.info(f"🔍 Searching patients: {query}")
        
        # Normalize search query
        normalized_query = normalize_text(query)
        
        # Get all patients first (we'll filter in Python for accent-insensitive search)
        # This is not ideal for large datasets, but works well for small-medium patient lists
        all_patients = db.query(Patient).all()
        
        # Filter patients using normalized comparison
        matching_patients = []
        for patient in all_patients:
            # Normalize patient fields
            normalized_name = normalize_text(patient.name)
            normalized_email = normalize_text(patient.email or "")
            normalized_record = normalize_text(patient.medical_record_number or "")
            normalized_phone = normalize_text(patient.phone or "")
            
            # Check if query matches any field
            if (normalized_query in normalized_name or
                normalized_query in normalized_email or
                normalized_query in normalized_record or
                normalized_query in normalized_phone):
                matching_patients.append(patient)
        
        # Get total count
        total = len(matching_patients)
        
        # Apply pagination
        patients = matching_patients[offset:offset + limit]
        
        # Convert to API format
        patient_list = []
        for patient in patients:
            age = (datetime.now().date() - patient.birth_date).days // 365
            
            patient_dict = {
                "id": str(patient.id),
                "name": patient.name,
                "age": age,
                "gender": patient.gender.value,
                "medical_record_number": patient.medical_record_number,
                "phone": patient.phone,
                "email": patient.email,
                "conditions": [d.description for d in patient.diagnoses[:3]],  # First 3 conditions
                "last_visit": patient.updated_at.isoformat() if patient.updated_at else patient.created_at.isoformat()
            }
            patient_list.append(patient_dict)
        
        return {
            "patients": patient_list,
            "total": total,
            "limit": limit,
            "offset": offset
        }
        
    except Exception as e:
        logger.error(f"❌ Patient search failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Patient search failed")


@router.get("/{patient_id}", response_model=Dict[str, Any])
async def get_patient(
    patient_id: str,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get detailed patient information
    
    Args:
        patient_id: Patient identifier
        db: Database session
        
    Returns:
        Patient details with medical history
    """
    try:
        logger.info(f"👤 Getting patient details: {patient_id}")
        
        # Get patient with relationships
        patient = db.query(Patient).options(
            joinedload(Patient.vital_signs),
            joinedload(Patient.diagnoses),
            joinedload(Patient.treatments),
            joinedload(Patient.documents)
        ).filter(Patient.id == int(patient_id)).first()
        
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        # Convert to API format
        age = (datetime.now().date() - patient.birth_date).days // 365
        
        patient_dict = {
            "id": str(patient.id),
            "name": patient.name,
            "age": age,
            "birth_date": patient.birth_date.isoformat(),
            "gender": patient.gender.value,
            "blood_type": patient.blood_type.value,
            "phone": patient.phone,
            "email": patient.email,
            "address": patient.address,
            "emergency_contact": patient.emergency_contact,
            "insurance_number": patient.insurance_number,
            "medical_record_number": patient.medical_record_number,
            "status": patient.status.value,
            "conditions": [d.description for d in patient.diagnoses],
            "medications": [t.description for t in patient.treatments if t.treatment_type == "medication"],
            "allergies": [],  # Would need to add to model
            "vital_signs": [
                {
                    "date": vs.measured_at.isoformat(),
                    "blood_pressure": f"{vs.systolic_bp}/{vs.diastolic_bp}",
                    "heart_rate": vs.heart_rate,
                    "temperature": vs.temperature,
                    "weight": vs.weight,
                    "height": vs.height
                }
                for vs in sorted(patient.vital_signs, key=lambda x: x.measured_at, reverse=True)[:5]
            ]
        }
        
        # Try to get vector context
        try:
            patient_context = await chroma_service.get_patient_context(patient_id)
            patient_dict["vector_context"] = patient_context
        except ChromaError as e:
            logger.warning(f"⚠️ Could not retrieve vector context: {str(e)}")
            patient_dict["vector_context"] = None
        
        return patient_dict
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to get patient {patient_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve patient")


@router.post("/{patient_id}/interaction")
async def record_patient_interaction(
    patient_id: str,
    interaction_type: str = "view",
    summary: Optional[str] = None,
    doctor_id: int = 1,  # Should come from auth
    db: Session = Depends(get_db)
) -> Dict[str, str]:
    """
    Record an interaction with a patient's record
    
    Args:
        patient_id: Patient identifier
        interaction_type: Type of interaction (view, chat, update)
        summary: Optional summary of the interaction
        doctor_id: ID of the doctor
        db: Database session
        
    Returns:
        Success message
    """
    try:
        logger.info(f"📝 Recording interaction for patient {patient_id}")
        
        # Verify patient exists
        patient = db.query(Patient).filter(Patient.id == int(patient_id)).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        # Create interaction record
        interaction = PatientInteraction(
            patient_id=int(patient_id),
            doctor_id=doctor_id,
            interaction_type=interaction_type,
            interaction_summary=summary or f"Doctor accessed patient record",
            duration_seconds=0,  # Could track actual duration
            created_at=datetime.now()
        )
        
        db.add(interaction)
        db.commit()
        
        return {"message": "Interaction recorded successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to record interaction: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to record interaction")