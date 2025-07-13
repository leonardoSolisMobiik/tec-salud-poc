"""
Patients Endpoints with Database Support
API endpoints for patient management using SQLAlchemy models
"""

import logging
import unicodedata
from typing import List, Dict, Any, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends

from app.core.database import get_db
from app.database.abstract_layer import DatabaseSession

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
    db: DatabaseSession = Depends(get_db)
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
        total = await db.count("patients")
        
        # Get patients from database using abstraction layer
        patients_data = await db.find_many(
            "patients", 
            filter_dict={},
            limit=limit,
            offset=offset,
            sort_by="created_at",
            sort_order="desc"
        )
        
        # Convert to dict format expected by frontend
        patient_list = []
        for patient_data in patients_data:
            # Calculate age if birth_date is available
            age = None
            if patient_data.get("birth_date"):
                try:
                    birth_date = datetime.fromisoformat(patient_data["birth_date"]) if isinstance(patient_data["birth_date"], str) else patient_data["birth_date"]
                    age = (datetime.now().date() - birth_date.date()).days // 365
                except:
                    age = None
            
            patient_dict = {
                "id": str(patient_data.get("id") or patient_data.get("_id")),
                "name": patient_data.get("name"),
                "age": age,
                "gender": patient_data.get("gender"),
                "blood_type": patient_data.get("blood_type"),
                "phone": patient_data.get("phone"),
                "email": patient_data.get("email"),
                "medical_record_number": patient_data.get("medical_record_number"),
                "status": patient_data.get("status"),
                "conditions": [],  # Could be populated from diagnoses
                "allergies": [],  # Would need to add to model
                "medications": []  # Could be populated from treatments
            }
            
            # Get last interaction date (use created_at for now)
            patient_dict["last_visit"] = patient_data.get("created_at")
            
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
    db: DatabaseSession = Depends(get_db)
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
        
        # Get recent interactions for the doctor
        recent_interactions = await db.find_many(
            "patient_interactions",
            filter_dict={"doctor_id": doctor_id},
            limit=limit,
            sort_by="created_at",
            sort_order="desc"
        )
        
        # Get unique patient IDs from interactions
        patient_ids = []
        interaction_map = {}
        for interaction in recent_interactions:
            patient_id = interaction.get("patient_id")
            if patient_id not in interaction_map:
                patient_ids.append(patient_id)
                interaction_map[patient_id] = interaction.get("created_at")
        
        # Get patients data
        patients_data = []
        for patient_id in patient_ids:
            patient = await db.get_by_id("patients", patient_id)
            if patient:
                patients_data.append(patient)
        
        # Convert to frontend format
        patient_list = []
        for patient in patients_data:
            # Calculate age if birth_date is available
            age = None
            if patient.get("birth_date"):
                try:
                    birth_date = datetime.fromisoformat(patient["birth_date"]) if isinstance(patient["birth_date"], str) else patient["birth_date"]
                    age = (datetime.now().date() - birth_date.date()).days // 365
                except:
                    age = None
            
            # Get specialty from first diagnosis or default
            specialty = "Medicina Interna"
            
            patient_dict = {
                "id": str(patient.get("id") or patient.get("_id")),
                "name": patient.get("name"),
                "age": age,
                "specialty": specialty,
                "expediente": patient.get("medical_record_number"),
                "status": patient.get("status"),
                "lastVisit": interaction_map.get(patient.get("id") or patient.get("_id"))
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
    db: DatabaseSession = Depends(get_db)
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
        all_patients = await db.find_many("patients", filter_dict={})
        
        # Filter patients using normalized comparison
        matching_patients = []
        for patient in all_patients:
            # Normalize patient fields
            normalized_name = normalize_text(patient.get("name", ""))
            normalized_email = normalize_text(patient.get("email", ""))
            normalized_record = normalize_text(patient.get("medical_record_number", ""))
            normalized_phone = normalize_text(patient.get("phone", ""))
            
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
            # Calculate age if birth_date is available
            age = None
            if patient.get("birth_date"):
                try:
                    birth_date = datetime.fromisoformat(patient["birth_date"]) if isinstance(patient["birth_date"], str) else patient["birth_date"]
                    age = (datetime.now().date() - birth_date.date()).days // 365
                except:
                    age = None
            
            patient_dict = {
                "id": str(patient.get("id") or patient.get("_id")),
                "name": patient.get("name"),
                "age": age,
                "gender": patient.get("gender"),
                "medical_record_number": patient.get("medical_record_number"),
                "phone": patient.get("phone"),
                "email": patient.get("email"),
                "conditions": [],  # Will need to be populated from diagnoses collection
                "last_visit": patient.get("updated_at") or patient.get("created_at")
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
    db: DatabaseSession = Depends(get_db)
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
        
        # Get patient
        patient = await db.get_by_id("patients", patient_id)
        
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        # Get related data
        diagnoses = await db.find_many("diagnoses", {"patient_id": patient_id})
        treatments = await db.find_many("treatments", {"patient_id": patient_id})
        vital_signs = await db.find_many("vital_signs", {"patient_id": patient_id})
        documents = await db.find_many("medical_documents", {"patient_id": patient_id})
        
        # Calculate age if birth_date is available
        age = None
        if patient.get("birth_date"):
            try:
                birth_date = datetime.fromisoformat(patient["birth_date"]) if isinstance(patient["birth_date"], str) else patient["birth_date"]
                age = (datetime.now().date() - birth_date.date()).days // 365
            except:
                age = None
        
        patient_dict = {
            "id": str(patient.get("id") or patient.get("_id")),
            "name": patient.get("name"),
            "age": age,
            "birth_date": patient.get("birth_date"),
            "gender": patient.get("gender"),
            "blood_type": patient.get("blood_type"),
            "phone": patient.get("phone"),
            "email": patient.get("email"),
            "address": patient.get("address"),
            "emergency_contact": patient.get("emergency_contact"),
            "insurance_number": patient.get("insurance_number"),
            "medical_record_number": patient.get("medical_record_number"),
            "status": patient.get("status"),
            "conditions": [d.get("description") for d in diagnoses],
            "medications": [t.get("description") for t in treatments if t.get("treatment_type") == "medication"],
            "allergies": [],  # Would need to add to model
            "vital_signs": [
                {
                    "date": vs.get("measured_at"),
                    "blood_pressure": f"{vs.get('systolic_bp', 0)}/{vs.get('diastolic_bp', 0)}",
                    "heart_rate": vs.get("heart_rate"),
                    "temperature": vs.get("temperature"),
                    "weight": vs.get("weight"),
                    "height": vs.get("height")
                }
                for vs in sorted(vital_signs, key=lambda x: x.get("measured_at", ""), reverse=True)[:5]
            ]
        }
        
        # Vector context removed - using only complete documents
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
    db: DatabaseSession = Depends(get_db)
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
        patient = await db.get_by_id("patients", patient_id)
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        # Create interaction record
        interaction_data = {
            "patient_id": patient_id,
            "doctor_id": doctor_id,
            "interaction_type": interaction_type,
            "interaction_summary": summary or f"Doctor accessed patient record",
            "duration_seconds": 0,  # Could track actual duration
            "created_at": datetime.now().isoformat()
        }
        
        await db.create("patient_interactions", interaction_data)
        
        return {"message": "Interaction recorded successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to record interaction: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to record interaction")