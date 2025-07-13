"""
Chat Endpoints
API endpoints for medical chat functionality with enhanced hybrid context
"""

import logging
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.responses import StreamingResponse
import json

from app.models.chat import ChatRequest, ChatResponse, ChatMessage, ModelType
from app.services.azure_openai_service import AzureOpenAIService
from app.services.chroma_service import chroma_service
from app.services.enhanced_document_service import ContextStrategy
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

# @router.post("/medical", response_model=ChatResponse)
# async def medical_chat(
#     request: ChatRequest,
#     background_tasks: BackgroundTasks
# ) -> ChatResponse:
#     """
#     Enhanced medical chat endpoint with hybrid document context
    
#     This endpoint:
#     1. Analyzes the user query to determine the best agent and context strategy
#     2. Retrieves hybrid context (vectors + full documents) if patient_id provided
#     3. Routes to specialized medical agents with enhanced context
#     4. Returns comprehensive medical assistance with context metadata
#     """
#     try:
#         logger.info(f"🏥 Enhanced medical chat request: {len(request.messages)} messages, patient_id: {request.patient_id}")
        
#         # Ensure all services are initialized
#         await ensure_services_initialized()
        
#         # Legacy context retrieval for backward compatibility
#         legacy_context = None
#         if request.patient_id and request.include_context:
#             try:
#                 legacy_context = await chroma_service.get_patient_context(
#                     request.patient_id
#                 )
#                 logger.info(f"📋 Retrieved legacy context for patient {request.patient_id}")
#             except ChromaError as e:
#                 logger.warning(f"⚠️ Could not retrieve legacy patient context: {str(e)}")
        
#         # Determine context strategy if specified
#         context_strategy = None
#         if hasattr(request, 'context_strategy') and request.context_strategy:
#             try:
#                 context_strategy = ContextStrategy(request.context_strategy)
#             except ValueError:
#                 logger.warning(f"⚠️ Invalid context strategy: {request.context_strategy}, using default")
        
#         # Route request through enhanced medical coordinator
#         response = await coordinator_agent.process_request(
#             messages=request.messages,
#             patient_context=legacy_context,
#             patient_id=request.patient_id if request.patient_id else None,  # Enhanced context
#             model_type=request.model_type or ModelType.GPT4O,
#             temperature=request.temperature,
#             max_tokens=request.max_tokens,
#             context_strategy=context_strategy
#         )
        
#         # Enhanced logging with context metadata
#         if response.metadata and "coordinator" in response.metadata:
#             coord_meta = response.metadata["coordinator"]
#             logger.info(f"✅ Enhanced response generated - Agent: {coord_meta.get('agent_used')}, "
#                        f"Context: {coord_meta.get('total_context_documents', 0)} docs, "
#                        f"Tokens: {coord_meta.get('total_context_tokens', 0)}")
        
#         # Log interaction for audit trail
#         background_tasks.add_task(
#             _log_medical_interaction,
#             request.patient_id,
#             request.messages[-1].content if request.messages else "",
#             response.content,
#             response.metadata
#         )
        
#         return response
        
#     except AzureOpenAIError as e:
#         logger.error(f"❌ Azure OpenAI error: {str(e)}")
#         raise HTTPException(status_code=503, detail=f"AI service error: {str(e)}")
#     except Exception as e:
#         logger.error(f"❌ Enhanced medical chat error: {str(e)}")
#         raise HTTPException(status_code=500, detail="Internal server error")

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
        
        # Legacy context for backward compatibility
        legacy_context = None
        if request.patient_id and request.include_context:
            try:
                legacy_context = await chroma_service.get_patient_context(
                    request.patient_id
                )
            except ChromaError as e:
                logger.warning(f"⚠️ Could not retrieve legacy patient context: {str(e)}")
        
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

# @router.post("/medical/context-preview")
# async def preview_patient_context(
#     patient_id: str,
#     query: str,
#     context_strategy: str = "vectors_only"
# ) -> Dict[str, Any]:
#     """
#     Preview what context would be retrieved for a patient query
#     Simplified version for MongoDB compatibility
#     """
#     try:
#         import time
#         start_time = time.time()
        
#         logger.info(f"🔍 Context preview for patient {patient_id}")
        
#         # Validate context strategy
#         valid_strategies = ["vectors_only", "full_docs_only", "hybrid_smart", "hybrid_priority_vectors", "hybrid_priority_full"]
#         if context_strategy not in valid_strategies:
#             raise HTTPException(status_code=400, detail=f"Invalid context strategy: {context_strategy}")
        
#         # Get database connection
#         from app.database.factory import get_db_async
        
#         async with get_db_async() as db:
#             # Get patient info
#             patient = await db.get_by_id("patients", patient_id)
#             if not patient:
#                 raise HTTPException(status_code=404, detail=f"Patient not found: {patient_id}")
            
#             # Get patient documents from MongoDB
#             documents = await db.find_many("medical_documents", {"patient_id": patient_id})
            
#             # Get vector context if available
#             vector_results = []
#             if context_strategy in ["vectors_only", "hybrid_smart", "hybrid_priority_vectors"]:
#                 try:
#                     if not chroma_service.is_initialized:
#                         await chroma_service.initialize()
                    
#                     vector_results = await chroma_service.search_documents(
#                         query=query,
#                         n_results=5,
#                         filters={"patient_id": str(patient_id)}
#                     )
#                 except Exception as e:
#                     logger.warning(f"Vector search failed: {e}")
#                     vector_results = []
            
#             # Calculate basic metrics
#             total_documents = len(documents) + len(vector_results)
#             processing_time = (time.time() - start_time) * 1000
            
#             # Document type breakdown
#             document_breakdown = {}
#             for doc in documents:
#                 doc_type = doc.get("document_type", "unknown")
#                 document_breakdown[doc_type] = document_breakdown.get(doc_type, 0) + 1
            
#             # Sample documents
#             sample_documents = []
#             for doc in documents[:5]:
#                 sample_documents.append({
#                     "document_id": str(doc.get("_id", doc.get("id", "unknown"))),
#                     "title": doc.get("title", "Untitled"),
#                     "document_type": doc.get("document_type", "unknown"),
#                     "content_length": len(doc.get("content", "")),
#                     "created_at": doc.get("created_at", "unknown"),
#                     "source": "mongodb"
#                 })
            
#             # Prepare preview response
#             preview = {
#                 "patient_id": patient_id,
#                 "patient_name": patient.get("name", "Unknown"),
#                 "query": query,
#                 "strategy_used": context_strategy,
#                 "total_documents": total_documents,
#                 "total_tokens": len(query) * 2 + sum(len(doc.get("content", "")) for doc in documents[:3]),
#                 "confidence": 0.8 if total_documents > 0 else 0.3,
#                 "processing_time_ms": processing_time,
#                 "context_summary": f"Retrieved {len(documents)} documents from MongoDB and {len(vector_results)} vector matches for patient {patient.get('name', 'Unknown')}",
#                 "recommendations": [
#                     "Context retrieved successfully from MongoDB",
#                     "Vector search available" if vector_results else "No vector matches found",
#                     f"Found {len(documents)} complete documents"
#                 ],
#                 "vector_results_count": len(vector_results),
#                 "full_documents_count": len(documents),
#                 "document_breakdown": document_breakdown,
#                 "relevance_distribution": {
#                     "high": len([d for d in documents if len(d.get("content", "")) > 1000]),
#                     "medium": len([d for d in documents if 500 <= len(d.get("content", "")) <= 1000]),
#                     "low": len([d for d in documents if len(d.get("content", "")) < 500])
#                 },
#                 "sample_documents": sample_documents,
#                 "database_type": "mongodb",
#                 "migration_status": "completed"
#             }
        
#         return preview
        
#     except HTTPException:
#         raise
#     except Exception as e:
#         logger.error(f"❌ Context preview error: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Context preview failed: {str(e)}")

# @router.get("/medical/context-strategies")
# async def get_context_strategies() -> Dict[str, Any]:
#     """Get available context strategies and their descriptions"""
#     return {
#         "strategies": [
#             {
#                 "name": "vectors_only",
#                 "title": "Vectores Semánticos Únicamente",
#                 "description": "Usa solo búsqueda semántica en vectores para respuestas rápidas",
#                 "best_for": ["Preguntas rápidas", "Información general médica", "Definiciones"],
#                 "performance": "Muy rápido",
#                 "context_depth": "Moderado"
#             },
#             {
#                 "name": "full_docs_only", 
#                 "title": "Documentos Completos Únicamente",
#                 "description": "Usa solo documentos médicos completos para análisis detallado",
#                 "best_for": ["Análisis detallado", "Diagnósticos complejos", "Revisión exhaustiva"],
#                 "performance": "Más lento",
#                 "context_depth": "Muy alto"
#             },
#             {
#                 "name": "hybrid_smart",
#                 "title": "Híbrido Inteligente",
#                 "description": "Combinación inteligente de vectores y documentos según la consulta",
#                 "best_for": ["Mayoría de consultas", "Balance óptimo", "Casos generales"],
#                 "performance": "Balanceado",
#                 "context_depth": "Alto"
#             },
#             {
#                 "name": "hybrid_priority_vectors",
#                 "title": "Híbrido con Prioridad en Vectores",
#                 "description": "Prioriza vectores semánticos con documentos como respaldo",
#                 "best_for": ["Consultas con tiempo limitado", "Información específica", "Seguimiento"],
#                 "performance": "Rápido",
#                 "context_depth": "Moderado-Alto"
#             },
#             {
#                 "name": "hybrid_priority_full",
#                 "title": "Híbrido con Prioridad en Documentos",
#                 "description": "Prioriza documentos completos con vectores como complemento",
#                 "best_for": ["Diagnósticos complejos", "Análisis críticos", "Casos urgentes"],
#                 "performance": "Moderado",
#                 "context_depth": "Muy alto"
#             }
#         ],
#         "default_strategy": "hybrid_smart",
#         "recommendations": {
#             "quick_questions": "vectors_only",
#             "diagnostic_queries": "hybrid_priority_full",
#             "document_analysis": "full_docs_only",
#             "general_consultation": "hybrid_smart",
#             "urgent_cases": "hybrid_priority_full"
#         }
#     }

# @router.post("/quick", response_model=ChatResponse)
# async def quick_medical_query(
#     request: ChatRequest
# ) -> ChatResponse:
#     """
#     Quick medical query endpoint using optimized context strategy
    
#     Automatically uses vectors-only strategy for faster responses
#     """
#     try:
#         logger.info(f"⚡ Quick medical query")
        
#         # Ensure services are initialized
#         await ensure_services_initialized()
        
#         # Force optimized settings for quick responses
#         request.model_type = ModelType.GPT4O
#         request.max_tokens = min(request.max_tokens or 1024, 1024)
        
#         # Use enhanced coordinator with vectors-only strategy for speed
#         if request.patient_id:
#             response = await coordinator_agent.process_request(
#                 messages=request.messages,
#                 patient_id=request.patient_id,
#                 model_type=request.model_type,
#                 temperature=request.temperature,
#                 max_tokens=request.max_tokens,
#                 context_strategy=ContextStrategy.VECTORS_ONLY  # Fast strategy
#             )
#         else:
#             # No patient context - direct AI call
#             response = await azure_openai_service.chat_completion(
#                 messages=request.messages,
#                 model_type=request.model_type,
#                 temperature=request.temperature,
#                 max_tokens=request.max_tokens
#             )
        
#         return response
        
#     except AzureOpenAIError as e:
#         logger.error(f"❌ Quick query error: {str(e)}")
#         raise HTTPException(status_code=503, detail=f"AI service error: {str(e)}")
#     except Exception as e:
#         logger.error(f"❌ Quick query error: {str(e)}")
#         raise HTTPException(status_code=500, detail="Internal server error")

# @router.post("/analyze", response_model=ChatResponse)
# async def analyze_medical_case(
#     request: ChatRequest
# ) -> ChatResponse:
#     """
#     Deep medical case analysis using enhanced full document context
    
#     Automatically uses full documents strategy for comprehensive analysis
#     """
#     try:
#         logger.info(f"🔬 Enhanced medical case analysis")
        
#         # Ensure services are initialized
#         await ensure_services_initialized()
        
#         # Force GPT-4o for complex analysis
#         request.model_type = ModelType.GPT4O
        
#         # Add specialized system prompt for analysis
#         analysis_prompt = ChatMessage(
#             role="system",
#             content="""Eres un especialista en análisis de casos médicos complejos con acceso a expedientes completos. 
#             Proporciona un análisis detallado que incluya:
#             1. Resumen del caso y contexto del expediente
#             2. Diagnósticos diferenciales basados en historial completo
#             3. Estudios recomendados considerando estudios previos
#             4. Plan de tratamiento integrado con medicaciones actuales
#             5. Consideraciones especiales del paciente
            
#             Utiliza toda la información disponible en el expediente médico completo.
#             Mantén siempre el enfoque médico profesional y recuerda que tus 
#             recomendaciones requieren validación por un médico especialista."""
#         )
        
#         messages_with_prompt = [analysis_prompt] + request.messages
        
#         # Use enhanced coordinator with full documents priority for comprehensive analysis
#         if request.patient_id:
#             response = await coordinator_agent.process_request(
#                 messages=messages_with_prompt,
#                 patient_id=request.patient_id,
#                 model_type=request.model_type,
#                 temperature=0.1,  # Lower temperature for more consistent analysis
#                 max_tokens=request.max_tokens,
#                 context_strategy=ContextStrategy.HYBRID_PRIORITY_FULL  # Comprehensive strategy
#             )
#         else:
#             # No patient context - direct AI call with analysis prompt
#             response = await azure_openai_service.chat_completion(
#                 messages=messages_with_prompt,
#                 model_type=request.model_type,
#                 temperature=0.1,
#                 max_tokens=request.max_tokens
#             )
        
#         return response
        
#     except AzureOpenAIError as e:
#         logger.error(f"❌ Case analysis error: {str(e)}")
#         raise HTTPException(status_code=503, detail=f"AI service error: {str(e)}")
#     except Exception as e:
#         logger.error(f"❌ Case analysis error: {str(e)}")
#         raise HTTPException(status_code=500, detail="Internal server error")

# @router.post("/test")
# async def test_basic_chat(request: ChatRequest) -> ChatResponse:
#     """
#     Test endpoint for basic Azure OpenAI functionality
#     """
#     try:
#         logger.info(f"🧪 Testing basic Azure OpenAI chat")
        
#         # Ensure services are initialized
#         await ensure_services_initialized()
        
#         # Direct call to Azure OpenAI service
#         response = await azure_openai_service.chat_completion(
#             messages=request.messages,
#             model_type=ModelType.GPT4O,
#             temperature=0.7,
#             max_tokens=1000
#         )
        
#         return response
        
#     except Exception as e:
#         logger.error(f"❌ Test chat error: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Test error: {str(e)}")

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
            "vectors_only",
            "full_docs_only", 
            "hybrid_smart",
            "hybrid_priority_vectors",
            "hybrid_priority_full"
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

