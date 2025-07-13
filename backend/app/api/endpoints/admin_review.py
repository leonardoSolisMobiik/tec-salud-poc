#!/usr/bin/env python3
"""
Admin Review API Endpoints
API endpoints for administrative review of batch processing cases
"""

import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from app.database.abstract_layer import DatabaseSession
from app.database.factory import get_db
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
    db: DatabaseSession = Depends(get_db)
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
        
        # Convert to response format
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
                created_at=case.created_at
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
    db: DatabaseSession = Depends(get_db)
):
    """Make an admin decision on a batch processing case"""
    try:
        decision = AdminDecision(
            decision=request.decision,
            selected_patient_id=request.selected_patient_id,
            new_patient_data=request.new_patient_data,
            admin_notes=request.admin_notes,
            reviewed_by=request.reviewed_by
        )
        
        result = await admin_review_service.make_admin_decision(
            batch_file_id=batch_file_id,
            decision=decision,
            db=db
        )
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "success": True,
                "batch_file_id": batch_file_id,
                "decision": request.decision,
                "processed_patient_id": result.processed_patient_id,
                "message": result.message
            }
        )
        
    except ValueError as e:
        logger.error(f"❌ Invalid decision request: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"❌ Failed to make admin decision: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to make admin decision: {str(e)}"
        )


@router.get("/review/statistics")
async def get_review_statistics(
    session_id: Optional[str] = Query(None, description="Filter by batch session ID"),
    db: DatabaseSession = Depends(get_db)
):
    """Get review statistics for batch processing"""
    try:
        stats = await admin_review_service.get_review_statistics(
            session_id=session_id,
            db=db
        )
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "success": True,
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
    db: DatabaseSession = Depends(get_db)
):
    """Bulk approve high confidence matches for a batch session"""
    try:
        result = await admin_review_service.bulk_approve_high_confidence(
            session_id=session_id,
            confidence_threshold=request.confidence_threshold,
            reviewed_by=request.reviewed_by,
            db=db
        )
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "success": True,
                "session_id": session_id,
                "approved_count": result.approved_count,
                "remaining_count": result.remaining_count,
                "message": result.message
            }
        )
        
    except Exception as e:
        logger.error(f"❌ Failed to bulk approve: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to bulk approve: {str(e)}"
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
    db: DatabaseSession = Depends(get_db)
):
    """Get detailed information about a specific review case"""
    try:
        case_details = await admin_review_service.get_review_case_details(
            batch_file_id=batch_file_id,
            db=db
        )
        
        if not case_details:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review case not found"
            )
        
        # Extract batch upload information
        batch_upload = case_details.batch_file.batch_upload
        
        # Get matching service results
        matching_results = []
        if case_details.patient_matching_status == "fuzzy_match":
            matching_results = case_details.suggested_matches
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "success": True,
                "case_details": {
                    "batch_file_id": case_details.batch_file_id,
                    "filename": case_details.filename,
                    "file_content": case_details.file_content,
                    "parsed_patient_data": case_details.parsed_patient_data,
                    "patient_matching_status": case_details.patient_matching_status,
                    "processing_status": case_details.processing_status,
                    "matching_confidence": case_details.matching_confidence,
                    "error_message": case_details.error_message,
                    "suggested_matches": matching_results,
                    "review_priority": case_details.review_priority,
                    "review_category": case_details.review_category,
                    "created_at": case_details.created_at,
                    "updated_at": case_details.updated_at
                },
                "batch_session": {
                    "session_id": batch_upload.session_id,
                    "uploaded_by": batch_upload.uploaded_by,
                    "processing_type": batch_upload.processing_type,
                    "created_at": batch_upload.created_at
                }
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
    db: DatabaseSession = Depends(get_db)
):
    """Search patients for admin review matching"""
    try:
        patients = await admin_review_service.search_patients_for_matching(
            query=query,
            limit=limit,
            db=db
        )
        
        # Convert to response format
        patient_results = []
        for patient in patients:
            patient_results.append({
                "id": patient.id,
                "name": patient.name,
                "medical_record_number": patient.medical_record_number,
                "birth_date": patient.birth_date.isoformat() if patient.birth_date else None,
                "gender": patient.gender,
                "doctor_name": patient.doctor.name if patient.doctor else None
            })
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "success": True,
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