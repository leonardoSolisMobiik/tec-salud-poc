"""
API Routes
Main router that includes all API endpoints
"""

from fastapi import APIRouter
from app.api.endpoints import chat, patients_db as patients, documents, batch_documents, admin_review

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(
    chat.router,
    prefix="/chat",
    tags=["chat"]
)

api_router.include_router(
    patients.router,
    prefix="/patients",
    tags=["patients"]
)

api_router.include_router(
    documents.router,
    prefix="/documents",
    tags=["documents"]
)

api_router.include_router(
    batch_documents.router,
    prefix="/documents",
    tags=["batch-documents"]
)

api_router.include_router(
    admin_review.router,
    prefix="/admin",
    tags=["admin-review"]
)

