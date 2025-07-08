#!/usr/bin/env python3
"""
Admin Review API Endpoints
API endpoints for administrative review of batch processing cases
"""

import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.services.admin_review_service import (
    AdminReviewService, AdminDecision, AdminDecisionEnum, ReviewCase
)


logger = logging.getLogger(__name__)
router = APIRouter()
admin_review_service = AdminReviewService()


class AdminDecisionRequest(BaseModel):
    """Request model for admin decision"""
    decision: AdminDecisionEnum
    selected_patient_id: Optional[int] = None
    new_patient_data: Optional[Dict[str, Any]] = None
    admin_notes: Optional[str] = None
    reviewed_by: str = Field(..., description="Admin user identifier")


class NewPatientData(BaseModel):
    """Model for new patient data"""
    medical_record_number: str
    name: str
    birth_date: Optional[str] = "1900-01-01"
    gender: Optional[str] = "desconocido"
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    doctor_id: Optional[int] = 1


class BulkApprovalRequest(BaseModel):
    """Request model for bulk approval"""
    confidence_threshold: float = Field(0.9, ge=0.0, le=1.0)
    reviewed_by: str = Field(..., description="Admin user identifier")


class ReviewCaseResponse(BaseModel):
    """Response model for review case"""
    batch_file_id: int
    filename: str
    session_id: str
    parsed_patient_id: Optional[str]
    parsed_patient_name: Optional[str]
    parsed_document_type: Optional[str]
    patient_matching_status: str
    processing_status: str
    matching_confidence: Optional[float]
    error_message: Optional[str]
    suggested_matches: List[Dict[str, Any]]
    review_priority: str
    review_category: str
    created_at: str


@router.get("/review/pending", response_model=List[ReviewCaseResponse])
async def get_pending_reviews(
    session_id: Optional[str] = Query(None, description="Filter by batch session ID"),
    priority: Optional[str] = Query(None, description="Filter by priority: high, medium, low"),
    category: Optional[str] = Query(None, description="Filter by category: patient_match, parsing_error, processing_error"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of cases to return"),
    db: Session = Depends(get_db)
):
    """Get all files requiring admin review with optional filtering"""
    try:
        review_cases = await admin_review_service.get_pending_reviews(
            session_id=session_id,
            priority=priority,
            category=category,
            limit=limit,
            db=db
        )
        
        # Convert to response model
        response_cases = []
        for case in review_cases:
            response_cases.append(ReviewCaseResponse(
                batch_file_id=case.batch_file_id,
                filename=case.filename,
                session_id=case.session_id,
                parsed_patient_id=case.parsed_patient_id,
                parsed_patient_name=case.parsed_patient_name,
                parsed_document_type=case.parsed_document_type,
                patient_matching_status=case.patient_matching_status,
                processing_status=case.processing_status,
                matching_confidence=case.matching_confidence,
                error_message=case.error_message,
                suggested_matches=case.suggested_matches,
                review_priority=case.review_priority,
                review_category=case.review_category,
                created_at=case.created_at.isoformat()
            ))
        
        return response_cases
        
    except Exception as e:
        logger.error(f"❌ Failed to get pending reviews: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get pending reviews: {str(e)}"
        )


@router.post("/review/{batch_file_id}/decision")
async def make_admin_decision(
    batch_file_id: int,
    request: AdminDecisionRequest,
    db: Session = Depends(get_db)
):
    """Make an administrative decision on a review case"""
    try:
        # Create admin decision object
        decision = AdminDecision(
            decision=request.decision,
            selected_patient_id=request.selected_patient_id,
            new_patient_data=request.new_patient_data,
            admin_notes=request.admin_notes,
            reviewed_by=request.reviewed_by
        )
        
        # Process the decision
        result = await admin_review_service.process_admin_decision(
            batch_file_id=batch_file_id,
            decision=decision,
            db=db
        )
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "message": "Admin decision processed successfully",
                "result": result
            }
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"❌ Failed to process admin decision: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process admin decision: {str(e)}"
        )


@router.get("/review/statistics")
async def get_review_statistics(
    session_id: Optional[str] = Query(None, description="Filter by batch session ID"),
    db: Session = Depends(get_db)
):
    """Get statistics about review cases"""
    try:
        stats = await admin_review_service.get_review_statistics(
            session_id=session_id,
            db=db
        )
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "message": "Review statistics retrieved successfully",
                "statistics": stats
            }
        )
        
    except Exception as e:
        logger.error(f"❌ Failed to get review statistics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get review statistics: {str(e)}"
        )


@router.post("/review/{session_id}/bulk-approve")
async def bulk_approve_high_confidence_matches(
    session_id: str,
    request: BulkApprovalRequest,
    db: Session = Depends(get_db)
):
    """Bulk approve high confidence patient matches to speed up review process"""
    try:
        result = await admin_review_service.bulk_approve_high_confidence_matches(
            session_id=session_id,
            confidence_threshold=request.confidence_threshold,
            db=db
        )
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "message": f"Bulk approval completed: {result['approved_count']} files approved",
                "result": result
            }
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"❌ Failed to bulk approve matches: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to bulk approve matches: {str(e)}"
        )


@router.get("/review/decision-types")
async def get_available_decision_types():
    """Get available admin decision types with descriptions"""
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "decision_types": [
                {
                    "value": AdminDecisionEnum.APPROVE_MATCH,
                    "label": "Approve Match",
                    "description": "Approve the suggested patient match and process the document"
                },
                {
                    "value": AdminDecisionEnum.REJECT_MATCH,
                    "label": "Reject Match",
                    "description": "Reject the suggested match and create a new patient"
                },
                {
                    "value": AdminDecisionEnum.MANUAL_MATCH,
                    "label": "Manual Match",
                    "description": "Manually select a different patient for this document"
                },
                {
                    "value": AdminDecisionEnum.SKIP_FILE,
                    "label": "Skip File",
                    "description": "Skip processing this file entirely"
                },
                {
                    "value": AdminDecisionEnum.RETRY_PROCESSING,
                    "label": "Retry Processing",
                    "description": "Retry processing this file (for failed cases)"
                },
                {
                    "value": AdminDecisionEnum.DELETE_FILE,
                    "label": "Delete File",
                    "description": "Remove this file from the batch"
                }
            ]
        }
    )


@router.get("/review/priorities")
async def get_review_priorities():
    """Get available review priority levels"""
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "priorities": [
                {
                    "value": "high",
                    "label": "High Priority",
                    "description": "Parsing errors or complete processing failures"
                },
                {
                    "value": "medium",
                    "label": "Medium Priority", 
                    "description": "Low confidence patient matches (< 70%)"
                },
                {
                    "value": "low",
                    "label": "Low Priority",
                    "description": "Medium confidence patient matches (70-95%)"
                }
            ]
        }
    )


@router.get("/review/categories")
async def get_review_categories():
    """Get available review categories"""
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "categories": [
                {
                    "value": "patient_match",
                    "label": "Patient Matching",
                    "description": "Files requiring manual patient matching decisions"
                },
                {
                    "value": "parsing_error",
                    "label": "Parsing Error",
                    "description": "Files with filename parsing failures"
                },
                {
                    "value": "processing_error",
                    "label": "Processing Error",
                    "description": "Files with document processing failures"
                },
                {
                    "value": "other",
                    "label": "Other",
                    "description": "Other types of review cases"
                }
            ]
        }
    )


@router.get("/review/{batch_file_id}/details")
async def get_review_case_details(
    batch_file_id: int,
    db: Session = Depends(get_db)
):
    """Get detailed information about a specific review case"""
    try:
        from app.db.models import BatchFile, BatchUpload, Patient
        
        # Get batch file
        batch_file = db.query(BatchFile).filter_by(id=batch_file_id).first()
        if not batch_file:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Batch file not found: {batch_file_id}"
            )
        
        # Get batch upload session
        batch_upload = db.query(BatchUpload).filter_by(id=batch_file.batch_upload_id).first()
        
        # Get suggested patients if any
        suggested_patients = []
        if batch_file.matching_details:
            import json
            try:
                matching_data = json.loads(batch_file.matching_details)
                suggestions = matching_data.get('suggestions', [])
                
                for suggestion in suggestions:
                    patient_id = suggestion.get('patient_id')
                    if patient_id:
                        patient = db.query(Patient).filter_by(id=patient_id).first()
                        if patient:
                            suggested_patients.append({
                                "patient_id": patient.id,
                                "name": patient.name,
                                "medical_record_number": patient.medical_record_number,
                                "birth_date": str(patient.birth_date),
                                "similarity_score": suggestion.get('similarity', 0)
                            })
            except:
                pass
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "batch_file": {
                    "id": batch_file.id,
                    "filename": batch_file.original_filename,
                    "file_size": batch_file.file_size,
                    "content_hash": batch_file.content_hash,
                    "parsed_patient_id": batch_file.parsed_patient_id,
                    "parsed_patient_name": batch_file.parsed_patient_name,
                    "parsed_document_number": batch_file.parsed_document_number,
                    "parsed_document_type": batch_file.parsed_document_type,
                    "patient_matching_status": batch_file.patient_matching_status,
                    "processing_status": batch_file.processing_status,
                    "matching_confidence": batch_file.matching_confidence,
                    "error_message": batch_file.error_message,
                    "review_required": batch_file.review_required,
                    "reviewed_by": batch_file.reviewed_by,
                    "reviewed_at": batch_file.reviewed_at.isoformat() if batch_file.reviewed_at else None,
                    "review_notes": batch_file.review_notes,
                    "created_at": batch_file.created_at.isoformat()
                },
                "batch_session": {
                    "session_id": batch_upload.session_id,
                    "uploaded_by": batch_upload.uploaded_by,
                    "processing_type": batch_upload.processing_type,
                    "status": batch_upload.status
                },
                "suggested_patients": suggested_patients,
                "current_matched_patient": None  # TODO: Get current matched patient details if exists
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to get review case details: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get review case details: {str(e)}"
        )


@router.get("/review/search-patients")
async def search_patients_for_matching(
    query: str = Query(..., min_length=2, description="Search term for patient name or ID"),
    limit: int = Query(10, ge=1, le=50, description="Maximum number of results"),
    db: Session = Depends(get_db)
):
    """Search for patients to manually match with a document"""
    try:
        from app.db.models import Patient
        from sqlalchemy import or_, func
        
        # Search patients by name or medical record number
        search_term = f"%{query}%"
        patients = db.query(Patient).filter(
            or_(
                func.lower(Patient.name).like(func.lower(search_term)),
                Patient.medical_record_number.like(search_term)
            )
        ).limit(limit).all()
        
        patient_results = []
        for patient in patients:
            patient_results.append({
                "patient_id": patient.id,
                "name": patient.name,
                "medical_record_number": patient.medical_record_number,
                "birth_date": str(patient.birth_date),
                "gender": patient.gender,
                "status": patient.status,
                "doctor_name": patient.doctor.name if patient.doctor else "Unknown"
            })
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "query": query,
                "results_count": len(patient_results),
                "patients": patient_results
            }
        )
        
    except Exception as e:
        logger.error(f"❌ Failed to search patients: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search patients: {str(e)}"
        ) 