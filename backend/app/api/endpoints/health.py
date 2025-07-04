"""
Health Check Endpoints
API endpoints for system health monitoring
"""

import logging
from typing import Dict, Any
from fastapi import APIRouter, HTTPException
from datetime import datetime

from app.services.azure_openai_service import azure_openai_service
from app.services.chroma_service import chroma_service
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/")
async def health_check() -> Dict[str, Any]:
    """
    Basic health check endpoint
    
    Returns overall system health status
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "TecSalud Medical API",
        "version": settings.APP_VERSION
    }

@router.get("/detailed")
async def detailed_health_check() -> Dict[str, Any]:
    """
    Detailed health check with service status
    
    Checks all critical services and dependencies
    """
    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "TecSalud Medical API",
        "version": settings.APP_VERSION,
        "services": {}
    }
    
    # Check Azure OpenAI service
    try:
        if azure_openai_service.is_initialized:
            health_status["services"]["azure_openai"] = {
                "status": "healthy",
                "message": "Connected and operational"
            }
        else:
            health_status["services"]["azure_openai"] = {
                "status": "unhealthy",
                "message": "Service not initialized"
            }
            health_status["status"] = "degraded"
    except Exception as e:
        health_status["services"]["azure_openai"] = {
            "status": "unhealthy",
            "message": f"Error: {str(e)}"
        }
        health_status["status"] = "degraded"
    
    # Check Chroma vector database
    try:
        if hasattr(chroma_service, 'is_initialized') and chroma_service.is_initialized:
            health_status["services"]["chroma"] = {
                "status": "healthy",
                "message": "Vector database operational"
            }
        else:
            health_status["services"]["chroma"] = {
                "status": "unhealthy",
                "message": "Vector database not initialized"
            }
            health_status["status"] = "degraded"
    except Exception as e:
        health_status["services"]["chroma"] = {
            "status": "unhealthy",
            "message": f"Error: {str(e)}"
        }
        health_status["status"] = "degraded"
    
    # Check configuration
    try:
        config_status = "healthy"
        config_message = "All required settings configured"
        
        # Check critical settings
        if not settings.AZURE_OPENAI_API_KEY:
            config_status = "unhealthy"
            config_message = "Azure OpenAI API key not configured"
            health_status["status"] = "unhealthy"
        elif not settings.AZURE_OPENAI_ENDPOINT:
            config_status = "unhealthy"
            config_message = "Azure OpenAI endpoint not configured"
            health_status["status"] = "unhealthy"
        
        health_status["services"]["configuration"] = {
            "status": config_status,
            "message": config_message
        }
    except Exception as e:
        health_status["services"]["configuration"] = {
            "status": "unhealthy",
            "message": f"Configuration error: {str(e)}"
        }
        health_status["status"] = "unhealthy"
    
    return health_status

@router.get("/azure-openai")
async def azure_openai_health() -> Dict[str, Any]:
    """
    Specific health check for Azure OpenAI service
    """
    try:
        if not azure_openai_service.is_initialized:
            raise HTTPException(
                status_code=503,
                detail="Azure OpenAI service not initialized"
            )
        
        # Test with a simple completion
        from app.models.chat import ChatMessage, ModelType
        test_messages = [
            ChatMessage(role="user", content="Test connection")
        ]
        
        response = await azure_openai_service.chat_completion(
            messages=test_messages,
            model_type=ModelType.GPT4O_MINI,
            max_tokens=10,
            temperature=0
        )
        
        return {
            "status": "healthy",
            "message": "Azure OpenAI service operational",
            "test_response_length": len(response.content),
            "models_available": [ModelType.GPT4O, ModelType.GPT4O_MINI],
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ Azure OpenAI health check failed: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail=f"Azure OpenAI service unhealthy: {str(e)}"
        )

@router.get("/chroma")
async def chroma_health() -> Dict[str, Any]:
    """
    Specific health check for Chroma vector database
    """
    try:
        # Test Chroma connection
        collection_info = await chroma_service.get_collection_info()
        
        return {
            "status": "healthy",
            "message": "Chroma vector database operational",
            "collection_info": collection_info,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ Chroma health check failed: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail=f"Chroma service unhealthy: {str(e)}"
        )

