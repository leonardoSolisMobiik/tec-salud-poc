"""
Chat Endpoints
API endpoints for medical chat functionality with Azure OpenAI
"""

import logging
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.responses import StreamingResponse
import json

from app.models.chat import ChatRequest, ChatResponse, ChatMessage, ModelType
from app.services.azure_openai_service import AzureOpenAIService
from app.services.chroma_service import chroma_service
from app.agents.medical_coordinator import MedicalCoordinatorAgent
from app.utils.exceptions import AzureOpenAIError, ChromaError

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
        # Initialize Chroma service to prevent initialization errors
        if not chroma_service.is_initialized:
            try:
                await chroma_service.initialize()
                logger.info("✅ Chroma service initialized")
            except Exception as e:
                logger.warning(f"⚠️ Chroma service initialization failed: {str(e)}")
                logger.warning("🔄 Continuing without vector search capabilities")
        _services_initialized = True

@router.post("/medical", response_model=ChatResponse)
async def medical_chat(
    request: ChatRequest,
    background_tasks: BackgroundTasks
) -> ChatResponse:
    """
    Medical chat endpoint with intelligent agent routing
    
    This endpoint:
    1. Analyzes the user query to determine the best agent
    2. Retrieves relevant patient context if patient_id provided
    3. Routes to specialized medical agents
    4. Returns comprehensive medical assistance
    """
    try:
        logger.info(f"🏥 Medical chat request: {len(request.messages)} messages")
        
        # Ensure all services are initialized
        await ensure_services_initialized()
        
        # Get patient context if patient_id provided
        patient_context = None
        if request.patient_id and request.include_context:
            try:
                patient_context = await chroma_service.get_patient_context(
                    request.patient_id
                )
                logger.info(f"📋 Retrieved context for patient {request.patient_id}")
            except ChromaError as e:
                logger.warning(f"⚠️ Could not retrieve patient context: {str(e)}")
        
        # Route request through medical coordinator
        response = await coordinator_agent.process_request(
            messages=request.messages,
            patient_context=patient_context,
            model_type=request.model_type or ModelType.GPT4O,
            temperature=request.temperature,
            max_tokens=request.max_tokens
        )
        
        # Log interaction for audit trail
        background_tasks.add_task(
            _log_medical_interaction,
            request.patient_id,
            request.messages[-1].content if request.messages else "",
            response.content
        )
        
        return response
        
    except AzureOpenAIError as e:
        logger.error(f"❌ Azure OpenAI error: {str(e)}")
        raise HTTPException(status_code=503, detail=f"AI service error: {str(e)}")
    except Exception as e:
        logger.error(f"❌ Medical chat error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/medical/stream")
async def medical_chat_stream(request: ChatRequest):
    """
    Streaming medical chat endpoint
    
    Returns server-sent events for real-time chat experience
    """
    try:
        logger.info(f"🌊 Streaming medical chat request")
        
        # Ensure services are initialized
        await ensure_services_initialized()
        
        # Get patient context if needed
        patient_context = None
        if request.patient_id and request.include_context:
            try:
                patient_context = await chroma_service.get_patient_context(
                    request.patient_id
                )
            except ChromaError as e:
                logger.warning(f"⚠️ Could not retrieve patient context: {str(e)}")
        
        async def generate_stream():
            try:
                logger.info("🌊 Starting stream generation")
                chunk_count = 0
                async for chunk in coordinator_agent.process_request_stream(
                    messages=request.messages,
                    patient_context=patient_context,
                    model_type=request.model_type,
                    temperature=request.temperature,
                    max_tokens=request.max_tokens
                ):
                    chunk_count += 1
                    logger.info(f"📦 Yielding chunk {chunk_count}: '{chunk}'")
                    yield f"data: {json.dumps({'content': chunk, 'is_complete': False})}\\n\\n"
                
                # Send completion signal
                logger.info(f"✅ Stream generation completed, sent {chunk_count} chunks")
                yield f"data: {json.dumps({'content': '', 'is_complete': True})}\\n\\n"
                
            except Exception as e:
                logger.error(f"❌ Streaming error: {str(e)}")
                yield f"data: {json.dumps({'error': str(e)})}\\n\\n"
        
        return StreamingResponse(
            generate_stream(),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Content-Type": "text/event-stream"
            }
        )
        
    except Exception as e:
        logger.error(f"❌ Streaming chat error: {str(e)}")
        raise HTTPException(status_code=500, detail="Streaming error")

@router.post("/quick", response_model=ChatResponse)
async def quick_medical_query(
    request: ChatRequest
) -> ChatResponse:
    """
    Quick medical query endpoint using GPT-4o-mini
    
    Optimized for fast responses to simple medical questions
    """
    try:
        logger.info(f"⚡ Quick medical query")
        
        # Ensure services are initialized
        await ensure_services_initialized()
        
        # Force GPT-4o for quick responses
        request.model_type = ModelType.GPT4O
        request.max_tokens = min(request.max_tokens or 1024, 1024)
        
        response = await azure_openai_service.chat_completion(
            messages=request.messages,
            model_type=request.model_type,
            temperature=request.temperature,
            max_tokens=request.max_tokens
        )
        
        return response
        
    except AzureOpenAIError as e:
        logger.error(f"❌ Quick query error: {str(e)}")
        raise HTTPException(status_code=503, detail=f"AI service error: {str(e)}")
    except Exception as e:
        logger.error(f"❌ Quick query error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/analyze", response_model=ChatResponse)
async def analyze_medical_case(
    request: ChatRequest
) -> ChatResponse:
    """
    Deep medical case analysis using GPT-4o
    
    For complex medical cases requiring detailed analysis
    """
    try:
        logger.info(f"🔬 Medical case analysis")
        
        # Ensure services are initialized
        await ensure_services_initialized()
        
        # Force GPT-4o for complex analysis
        request.model_type = ModelType.GPT4O
        
        # Add specialized system prompt for analysis
        analysis_prompt = ChatMessage(
            role="system",
            content="""Eres un especialista en análisis de casos médicos complejos. 
            Proporciona un análisis detallado que incluya:
            1. Resumen del caso
            2. Diagnósticos diferenciales
            3. Estudios recomendados
            4. Plan de tratamiento sugerido
            5. Consideraciones especiales
            
            Mantén siempre el enfoque médico profesional y recuerda que tus 
            recomendaciones requieren validación por un médico especialista."""
        )
        
        messages_with_prompt = [analysis_prompt] + request.messages
        
        response = await azure_openai_service.chat_completion(
            messages=messages_with_prompt,
            model_type=request.model_type,
            temperature=0.1,  # Lower temperature for more consistent analysis
            max_tokens=request.max_tokens
        )
        
        return response
        
    except AzureOpenAIError as e:
        logger.error(f"❌ Case analysis error: {str(e)}")
        raise HTTPException(status_code=503, detail=f"AI service error: {str(e)}")
    except Exception as e:
        logger.error(f"❌ Case analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/test")
async def test_basic_chat(request: ChatRequest) -> ChatResponse:
    """
    Test endpoint for basic Azure OpenAI functionality
    """
    try:
        logger.info(f"🧪 Testing basic Azure OpenAI chat")
        
        # Ensure services are initialized
        await ensure_services_initialized()
        
        # Direct call to Azure OpenAI service
        response = await azure_openai_service.chat_completion(
            messages=request.messages,
            model_type=ModelType.GPT4O,
            temperature=0.7,
            max_tokens=1000
        )
        
        return response
        
    except Exception as e:
        logger.error(f"❌ Test chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Test error: {str(e)}")

@router.get("/models")
async def get_available_models() -> Dict[str, Any]:
    """Get information about available AI models"""
    return {
        "models": [
            {
                "name": "GPT-4o",
                "type": ModelType.GPT4O,
                "description": "Advanced model for complex medical analysis",
                "max_tokens": 4096,
                "use_cases": ["Complex diagnosis", "Case analysis", "Research"]
            },
            {
                "name": "GPT-4o-mini",
                "type": ModelType.GPT4O_MINI,
                "description": "Fast model for quick medical queries",
                "max_tokens": 2048,
                "use_cases": ["Quick questions", "Simple queries", "Real-time chat"]
            }
        ],
        "features": {
            "tool_calling": True,
            "streaming": True,
            "patient_context": True,
            "document_analysis": True
        }
    }

async def _log_medical_interaction(
    patient_id: str,
    user_query: str,
    ai_response: str
) -> None:
    """Log medical interaction for audit trail"""
    try:
        # This would typically save to a database
        logger.info(f"📝 Logged interaction for patient {patient_id}")
        # TODO: Implement database logging
    except Exception as e:
        logger.error(f"❌ Failed to log interaction: {str(e)}")

