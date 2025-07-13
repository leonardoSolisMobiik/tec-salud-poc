"""
Chat Endpoints
API endpoints for medical chat functionality with enhanced hybrid context
"""

import logging
from typing import Dict, Any
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
import json

from app.models.chat import ChatRequest, ChatResponse, ModelType
from app.services.azure_openai_service import AzureOpenAIService
from app.services.enhanced_document_service import ContextStrategy
from app.agents.medical_coordinator import MedicalCoordinatorAgent

logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize medical coordinator agent and Azure OpenAI service
coordinator_agent = MedicalCoordinatorAgent()
azure_openai_service = AzureOpenAIService()

# Global initialization flag
_services_initialized = False

async def ensure_services_initialized():
    """Ensure all services are properly initialized"""
    global _services_initialized
    if not _services_initialized:
        await coordinator_agent.initialize()
        if not azure_openai_service.is_initialized:
            await azure_openai_service.initialize()
        # ChromaDB removed - using only complete documents
        logger.info("✅ Using complete document context only")
        _services_initialized = True

@router.post("/medical/stream")
async def medical_chat_stream(request: ChatRequest):
    """
    Enhanced streaming medical chat endpoint with hybrid context
    
    Returns server-sent events for real-time chat experience with context metadata
    """
    try:
        logger.info(f"🌊 Streaming enhanced medical chat request - patient_id: {request.patient_id}")
        
        # Ensure services are initialized
        await ensure_services_initialized()
        
        # Legacy context removed - using only complete documents
        legacy_context = None
        
        # Determine context strategy
        context_strategy = None
        if hasattr(request, 'context_strategy') and request.context_strategy:
            try:
                context_strategy = ContextStrategy(request.context_strategy)
            except ValueError:
                logger.warning(f"⚠️ Invalid context strategy: {request.context_strategy}")
        
        async def generate_enhanced_stream():
            try:
                logger.info("🌊 Starting enhanced stream generation")
                chunk_count = 0
                context_sent = False
                
                # Stream the response
                async for chunk in coordinator_agent.process_request_stream(
                    messages=request.messages,
                    patient_context=legacy_context,
                    patient_id=request.patient_id if request.patient_id else None,
                    model_type=request.model_type,
                    temperature=request.temperature,
                    max_tokens=request.max_tokens,
                    context_strategy=context_strategy
                ):
                    chunk_count += 1
                    
                    # Send context metadata with the first chunk
                    if not context_sent and chunk_count == 1:
                        context_info = {
                            "type": "context_info",
                            "patient_id": request.patient_id,
                            "enhanced_context_available": request.patient_id is not None,
                            "context_strategy": context_strategy.value if context_strategy else "default"
                        }
                        yield f"data: {json.dumps(context_info)}\\n\\n"
                        context_sent = True
                    
                    logger.info(f"📦 Yielding enhanced chunk {chunk_count}: '{chunk[:50]}...'")
                    yield f"data: {json.dumps({'content': chunk, 'is_complete': False, 'chunk_id': chunk_count})}\\n\\n"
                
                # Send completion signal with metadata
                completion_data = {
                    'content': '', 
                    'is_complete': True, 
                    'total_chunks': chunk_count,
                    'enhanced_processing': True
                }
                logger.info(f"✅ Enhanced stream generation completed, sent {chunk_count} chunks")
                yield f"data: {json.dumps(completion_data)}\\n\\n"
                
            except Exception as e:
                logger.error(f"❌ Enhanced streaming error: {str(e)}")
                yield f"data: {json.dumps({'error': str(e), 'enhanced_processing': True})}\\n\\n"
        
        return StreamingResponse(
            generate_enhanced_stream(),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Content-Type": "text/event-stream",
                "X-Enhanced-Context": "true"
            }
        )
        
    except Exception as e:
        logger.error(f"❌ Enhanced streaming chat error: {str(e)}")
        raise HTTPException(status_code=500, detail="Streaming error")


@router.get("/models")
async def get_available_models() -> Dict[str, Any]:
    """Get information about available AI models and enhanced features"""
    return {
        "models": [
            {
                "name": "GPT-4o",
                "type": ModelType.GPT4O,
                "description": "Advanced model for complex medical analysis with enhanced context",
                "max_tokens": 4096,
                "use_cases": ["Complex diagnosis", "Case analysis", "Research", "Document analysis"],
                "enhanced_features": ["Hybrid context", "Full document access", "Multi-agent routing"]
            },
            {
                "name": "GPT-4o-mini",
                "type": ModelType.GPT4O_MINI,
                "description": "Fast model for quick medical queries with vector context",
                "max_tokens": 2048,
                "use_cases": ["Quick questions", "Simple queries", "Real-time chat"],
                "enhanced_features": ["Vector search", "Fast context retrieval"]
            }
        ],
        "features": {
            "tool_calling": True,
            "streaming": True,
            "patient_context": True,
            "document_analysis": True,
            "enhanced_context": True,
            "hybrid_retrieval": True,
            "context_strategies": True,
            "multi_agent_routing": True,
            "full_document_access": True,
            "semantic_search": True
        },
        "context_strategies": [
            "full_docs_only", 
            "recent_docs",
            "critical_docs"
        ]
    }

async def _log_medical_interaction(
    patient_id: str,
    user_query: str,
    ai_response: str,
    metadata: Dict[str, Any] = None
) -> None:
    """Enhanced logging of medical interaction with context metadata"""
    try:
        # Extract enhanced metadata
        context_info = {}
        if metadata and "coordinator" in metadata:
            coord_meta = metadata["coordinator"]
            context_info = {
                "agent_used": coord_meta.get("agent_used"),
                "enhanced_context_used": coord_meta.get("enhanced_context_used", False),
                "context_strategy": coord_meta.get("context_strategy"),
                "total_context_documents": coord_meta.get("total_context_documents", 0),
                "total_context_tokens": coord_meta.get("total_context_tokens", 0),
                "context_confidence": coord_meta.get("context_confidence")
            }
        
        # This would typically save to a database with enhanced metadata
        logger.info(f"📝 Enhanced interaction logged for patient {patient_id} - "
                   f"Agent: {context_info.get('agent_used', 'unknown')}, "
                   f"Context: {context_info.get('total_context_documents', 0)} docs")
        
        # TODO: Implement enhanced database logging with context metadata
        
    except Exception as e:
        logger.error(f"❌ Failed to log enhanced interaction: {str(e)}")

