"""
API Routes
Main router that includes all API endpoints
"""

from fastapi import APIRouter
from app.api.endpoints import chat, patients_db as patients, documents, health

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(
    health.router,
    prefix="/health",
    tags=["health"]
)

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

