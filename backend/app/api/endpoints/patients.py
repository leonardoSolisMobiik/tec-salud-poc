"""
Patients Endpoints
API endpoints for patient management and medical records
"""

import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.responses import JSONResponse

from app.models.medical import (
    Patient, PatientSearch, PatientSearchResult,
    MedicalRecord, DocumentAnalysisRequest, DocumentAnalysisResponse
)
from app.services.chroma_service import chroma_service
from app.utils.exceptions import ChromaError

logger = logging.getLogger(__name__)

router = APIRouter()

# Mock patient data for development
MOCK_PATIENTS = [
    {
        "id": "PAT001",
        "name": "María González Rodríguez",
        "age": 45,
        "gender": "femenino",
        "blood_type": "O+",
        "phone": "+52 81 1234-5678",
        "email": "maria.gonzalez@email.com",
        "medical_record_number": "EXP-2024-001",
        "last_visit": "2024-01-15",
        "conditions": ["Diabetes Mellitus tipo 2", "Hipertensión arterial"],
        "allergies": ["Penicilina"],
        "medications": ["Metformina 850mg", "Losartán 50mg"]
    },
    {
        "id": "PAT002", 
        "name": "Carlos Alberto Mendoza",
        "age": 28,
        "gender": "masculino",
        "blood_type": "A+",
        "phone": "+52 81 2345-6789",
        "email": "carlos.mendoza@email.com",
        "medical_record_number": "EXP-2024-002",
        "last_visit": "2024-01-10",
        "conditions": ["Fractura de tibia"],
        "allergies": [],
        "medications": ["Ibuprofeno 400mg", "Tramadol 50mg"]
    },
    {
        "id": "PAT003",
        "name": "Ana Sofía Herrera",
        "age": 32,
        "gender": "femenino", 
        "blood_type": "B+",
        "phone": "+52 81 3456-7890",
        "email": "ana.herrera@email.com",
        "medical_record_number": "EXP-2024-003",
        "last_visit": "2024-01-20",
        "conditions": ["Embarazo 28 semanas"],
        "allergies": ["Sulfonamidas"],
        "medications": ["Ácido fólico", "Hierro"]
    },
    {
        "id": "PAT004",
        "name": "Roberto Jiménez López", 
        "age": 67,
        "gender": "masculino",
        "blood_type": "AB+",
        "phone": "+52 81 4567-8901",
        "email": "roberto.jimenez@email.com",
        "medical_record_number": "EXP-2024-004",
        "last_visit": "2024-01-18",
        "conditions": ["Infarto agudo al miocardio", "Diabetes tipo 2"],
        "allergies": ["Aspirina"],
        "medications": ["Clopidogrel 75mg", "Atorvastatina 40mg", "Metformina 500mg"]
    }
]

@router.get("/", response_model=List[Dict[str, Any]])
async def get_patients(
    limit: int = 10,
    offset: int = 0
) -> List[Dict[str, Any]]:
    """
    Get list of patients with pagination
    
    Args:
        limit: Maximum number of patients to return
        offset: Number of patients to skip
        
    Returns:
        List of patients
    """
    try:
        logger.info(f"👥 Getting patients list (limit: {limit}, offset: {offset})")
        
        # Return mock data for now
        start = offset
        end = offset + limit
        patients = MOCK_PATIENTS[start:end]
        
        return patients
        
    except Exception as e:
        logger.error(f"❌ Failed to get patients: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve patients")

@router.get("/search", response_model=PatientSearchResult)
async def search_patients(
    query: str,
    limit: int = 10,
    offset: int = 0
) -> PatientSearchResult:
    """
    Search patients by name, ID, or other criteria
    
    Args:
        query: Search query
        limit: Maximum results
        offset: Results offset
        
    Returns:
        Search results with patients
    """
    try:
        logger.info(f"🔍 Searching patients: {query}")
        
        # Simple search in mock data
        query_lower = query.lower()
        filtered_patients = [
            patient for patient in MOCK_PATIENTS
            if (query_lower in patient["name"].lower() or 
                query_lower in patient["id"].lower() or
                query_lower in patient["medical_record_number"].lower())
        ]
        
        start = offset
        end = offset + limit
        result_patients = filtered_patients[start:end]
        
        return PatientSearchResult(
            patients=result_patients,
            total=len(filtered_patients),
            limit=limit,
            offset=offset
        )
        
    except Exception as e:
        logger.error(f"❌ Patient search failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Patient search failed")

@router.get("/{patient_id}", response_model=Dict[str, Any])
async def get_patient(patient_id: str) -> Dict[str, Any]:
    """
    Get detailed patient information
    
    Args:
        patient_id: Patient identifier
        
    Returns:
        Patient details with medical history
    """
    try:
        logger.info(f"👤 Getting patient details: {patient_id}")
        
        # Find patient in mock data
        patient = next(
            (p for p in MOCK_PATIENTS if p["id"] == patient_id),
            None
        )
        
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        # Get patient context from vector database
        try:
            patient_context = await chroma_service.get_patient_context(patient_id)
            patient["vector_context"] = patient_context
        except ChromaError as e:
            logger.warning(f"⚠️ Could not retrieve vector context: {str(e)}")
            patient["vector_context"] = None
        
        return patient
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to get patient {patient_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve patient")

@router.get("/{patient_id}/documents")
async def get_patient_documents(
    patient_id: str,
    document_type: Optional[str] = None,
    limit: int = 20
) -> List[Dict[str, Any]]:
    """
    Get patient documents from vector database
    
    Args:
        patient_id: Patient identifier
        document_type: Filter by document type
        limit: Maximum documents to return
        
    Returns:
        List of patient documents
    """
    try:
        logger.info(f"📄 Getting documents for patient {patient_id}")
        
        # Search for patient documents
        filters = {"patient_id": patient_id}
        if document_type:
            filters["document_type"] = document_type
        
        documents = await chroma_service.search_documents(
            query="documentos médicos",
            n_results=limit,
            filters=filters
        )
        
        return documents
        
    except ChromaError as e:
        logger.error(f"❌ Failed to get patient documents: {str(e)}")
        raise HTTPException(status_code=503, detail="Document retrieval failed")
    except Exception as e:
        logger.error(f"❌ Failed to get patient documents: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve documents")

@router.post("/{patient_id}/documents/upload")
async def upload_patient_document(
    patient_id: str,
    file: UploadFile = File(...),
    document_type: str = "general",
    title: Optional[str] = None
) -> Dict[str, Any]:
    """
    Upload and process patient document
    
    Args:
        patient_id: Patient identifier
        file: Document file to upload
        document_type: Type of medical document
        title: Document title
        
    Returns:
        Upload result with document ID
    """
    try:
        logger.info(f"📤 Uploading document for patient {patient_id}")
        
        # Validate file type
        if not file.filename.lower().endswith(('.pdf', '.txt', '.docx')):
            raise HTTPException(
                status_code=400, 
                detail="Only PDF, TXT, and DOCX files are supported"
            )
        
        # Read file content
        content = await file.read()
        
        # Process document (this would include PDF extraction, etc.)
        # For now, we'll simulate processing
        document_id = f"DOC_{patient_id}_{len(content)}"
        
        # Extract text content (simplified)
        if file.filename.lower().endswith('.txt'):
            text_content = content.decode('utf-8')
        else:
            # For PDF/DOCX, we would use proper extraction libraries
            text_content = f"Documento médico: {file.filename}\\nContenido procesado..."
        
        # Add to vector database
        metadata = {
            "patient_id": patient_id,
            "document_type": document_type,
            "filename": file.filename,
            "title": title or file.filename,
            "file_size": len(content),
            "upload_date": "2024-01-01"  # Would use actual timestamp
        }
        
        await chroma_service.add_document(
            document_id=document_id,
            content=text_content,
            metadata=metadata
        )
        
        return {
            "document_id": document_id,
            "filename": file.filename,
            "size": len(content),
            "status": "processed",
            "message": "Document uploaded and indexed successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Document upload failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Document upload failed")

@router.get("/{patient_id}/timeline")
async def get_patient_timeline(
    patient_id: str,
    limit: int = 50
) -> List[Dict[str, Any]]:
    """
    Get patient medical timeline
    
    Args:
        patient_id: Patient identifier
        limit: Maximum timeline events
        
    Returns:
        Chronological list of medical events
    """
    try:
        logger.info(f"📅 Getting timeline for patient {patient_id}")
        
        # Get patient documents and create timeline
        documents = await chroma_service.search_documents(
            query="historial cronológico",
            n_results=limit,
            filters={"patient_id": patient_id}
        )
        
        # Sort by date and create timeline events
        timeline = []
        for doc in documents:
            event = {
                "date": doc.get("date", "2024-01-01"),
                "type": doc.get("document_type", "unknown"),
                "title": doc.get("metadata", {}).get("title", "Evento médico"),
                "summary": doc.get("content", "")[:200] + "...",
                "document_id": doc.get("document_id")
            }
            timeline.append(event)
        
        # Sort by date (most recent first)
        timeline.sort(key=lambda x: x["date"], reverse=True)
        
        return timeline
        
    except Exception as e:
        logger.error(f"❌ Failed to get patient timeline: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve timeline")

@router.get("/{patient_id}/summary")
async def get_patient_summary(patient_id: str) -> Dict[str, Any]:
    """
    Get AI-generated patient summary
    
    Args:
        patient_id: Patient identifier
        
    Returns:
        Comprehensive patient summary
    """
    try:
        logger.info(f"📋 Generating summary for patient {patient_id}")
        
        # Get patient data
        patient = next(
            (p for p in MOCK_PATIENTS if p["id"] == patient_id),
            None
        )
        
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        # Get patient context from vector database
        try:
            patient_context = await chroma_service.get_patient_context(patient_id)
        except ChromaError:
            patient_context = None
        
        # Generate AI summary (this would use the medical agents)
        summary = {
            "patient_id": patient_id,
            "name": patient["name"],
            "age": patient["age"],
            "gender": patient["gender"],
            "active_conditions": patient.get("conditions", []),
            "current_medications": patient.get("medications", []),
            "allergies": patient.get("allergies", []),
            "last_visit": patient.get("last_visit"),
            "risk_factors": ["Diabetes", "Hipertensión"] if patient_id == "PAT001" else [],
            "recommendations": [
                "Control glucémico regular",
                "Monitoreo de presión arterial",
                "Dieta balanceada"
            ] if patient_id == "PAT001" else ["Seguimiento médico regular"],
            "document_count": len(patient_context.get("documents", [])) if patient_context else 0
        }
        
        return summary
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to generate patient summary: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate summary")

