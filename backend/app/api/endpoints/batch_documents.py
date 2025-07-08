#!/usr/bin/env python3
"""
Batch Documents API Endpoints
API endpoints for bulk document upload and processing
"""

import logging
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.db.models import ProcessingTypeEnum
from app.services.batch_processing_service import BatchProcessingService, BatchProcessingResult


logger = logging.getLogger(__name__)
router = APIRouter()
batch_service = BatchProcessingService()


class BatchUploadRequest(BaseModel):
    """Request model for creating batch upload session"""
    processing_type: ProcessingTypeEnum
    uploaded_by: str


class BatchUploadResponse(BaseModel):
    """Response model for batch upload session creation"""
    session_id: str
    message: str


class BatchStatusResponse(BaseModel):
    """Response model for batch status"""
    session_id: str
    status: str
    uploaded_by: str
    processing_type: str
    total_files: int
    processed_files: int
    failed_files: int
    files: List[Dict[str, Any]]


@router.post("/batch/create-session", response_model=BatchUploadResponse)
async def create_batch_upload_session(
    request: BatchUploadRequest,
    db: Session = Depends(get_db)
):
    """Create new batch upload session"""
    try:
        session_id = await batch_service.create_batch_upload_session(
            uploaded_by=request.uploaded_by,
            processing_type=request.processing_type,
            db=db
        )
        
        return BatchUploadResponse(
            session_id=session_id,
            message=f"Batch upload session created successfully"
        )
        
    except Exception as e:
        logger.error(f"❌ Failed to create batch upload session: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create batch upload session: {str(e)}"
        )


@router.post("/batch/{session_id}/upload")
async def upload_files_to_batch(
    session_id: str,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    """Upload files to existing batch session"""
    try:
        if not files:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No files provided"
            )
        
        # Validate file types (only PDFs for now)
        for file in files:
            if not file.filename.lower().endswith('.pdf'):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Only PDF files are supported. Invalid file: {file.filename}"
                )
        
        result = await batch_service.upload_files_to_session(
            session_id=session_id,
            files=files,
            db=db
        )
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "message": f"Successfully uploaded {result['total_files']} files",
                "session_id": session_id,
                "total_files": result['total_files'],
                "parsing_success_rate": result['parsing_success_rate'],
                "uploaded_files": result['uploaded_files'],
                "failed_files": result['failed_files']
            }
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"❌ Failed to upload files to batch {session_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload files: {str(e)}"
        )


@router.post("/batch/{session_id}/process")
async def process_batch_upload(
    session_id: str,
    db: Session = Depends(get_db)
):
    """Start processing batch upload"""
    try:
        result = await batch_service.process_batch_upload(
            session_id=session_id,
            db=db
        )
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "message": "Batch processing completed",
                "session_id": result.session_id,
                "total_files": result.total_files,
                "processed_files": result.processed_files,
                "failed_files": result.failed_files,
                "created_patients": result.created_patients,
                "matched_patients": result.matched_patients,
                "review_required": result.review_required,
                "processing_time": result.processing_time,
                "status": result.status,
                "error_details": result.error_details
            }
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"❌ Failed to process batch {session_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process batch: {str(e)}"
        )


@router.get("/batch/{session_id}/status", response_model=BatchStatusResponse)
async def get_batch_status(
    session_id: str,
    db: Session = Depends(get_db)
):
    """Get current status of batch processing"""
    try:
        status_data = await batch_service.get_batch_status(
            session_id=session_id,
            db=db
        )
        
        return BatchStatusResponse(**status_data)
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"❌ Failed to get batch status {session_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get batch status: {str(e)}"
        )


@router.get("/batch/{session_id}/review")
async def get_files_requiring_review(
    session_id: str,
    db: Session = Depends(get_db)
):
    """Get files that require admin review"""
    try:
        review_files = await batch_service.get_files_requiring_review(
            session_id=session_id,
            db=db
        )
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "session_id": session_id,
                "review_required_count": len(review_files),
                "files_requiring_review": review_files
            }
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"❌ Failed to get review files {session_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get review files: {str(e)}"
        )


@router.delete("/batch/{session_id}/cleanup")
async def cleanup_batch_session(
    session_id: str,
    db: Session = Depends(get_db)
):
    """Clean up batch session files"""
    try:
        await batch_service.cleanup_batch_session(
            session_id=session_id,
            db=db
        )
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "message": f"Batch session {session_id} cleaned up successfully"
            }
        )
        
    except Exception as e:
        logger.error(f"❌ Failed to cleanup batch {session_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cleanup batch session: {str(e)}"
        )


@router.get("/batch/processing-types")
async def get_processing_types():
    """Get available processing types"""
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "processing_types": [
                {
                    "value": ProcessingTypeEnum.VECTORIZED,
                    "label": "Vectorized Only",
                    "description": "Documents are processed for semantic search only"
                },
                {
                    "value": ProcessingTypeEnum.COMPLETE,
                    "label": "Complete Storage",
                    "description": "Documents are stored completely for full context access"
                },
                {
                    "value": ProcessingTypeEnum.BOTH,
                    "label": "Both",
                    "description": "Documents are both vectorized and stored completely"
                }
            ]
        }
    ) 