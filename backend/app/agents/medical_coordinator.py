"""
Medical Coordinator Agent
Main orchestrator that routes medical queries to specialized agents with enhanced document context
"""

import logging
from typing import List, Dict, Any, Optional, AsyncGenerator
from enum import Enum
from datetime import datetime

from app.models.chat import ChatMessage, ChatResponse, ModelType
from app.services.azure_openai_service import AzureOpenAIService
from app.services.enhanced_document_service import enhanced_document_service, ContextStrategy
from app.database.factory import get_db_async
from app.agents.diagnostic_agent import DiagnosticAgent
from app.agents.document_analysis_agent import DocumentAnalysisAgent
from app.agents.quick_response_agent import QuickResponseAgent
from app.agents.search_agent import SearchAgent
from app.utils.exceptions import AgentError

logger = logging.getLogger(__name__)

class QueryType(str, Enum):
    """Types of medical queries for agent routing"""
    DIAGNOSTIC = "diagnostic"
    DOCUMENT_ANALYSIS = "document_analysis"
    QUICK_QUESTION = "quick_question"
    SEARCH = "search"
    GENERAL = "general"

class MedicalCoordinatorAgent:
    """
    Enhanced coordinator agent that uses hybrid document context
    Combines semantic vectors with complete documents for optimal medical assistance
    """
    
    def __init__(self):
        self.azure_openai_service = AzureOpenAIService()
        self.diagnostic_agent = DiagnosticAgent()
        self.document_agent = DocumentAnalysisAgent()
        self.quick_agent = QuickResponseAgent()
        self.search_agent = SearchAgent()
        
        # Enhanced context configuration
        self.use_enhanced_context = True
        self.default_context_strategy = ContextStrategy.FULL_DOCS_ONLY
        
        # Classification tools for function calling
        self.classification_tools = [
            {
                "type": "function",
                "function": {
                    "name": "classify_medical_query",
                    "description": "Classify the type of medical query to route to appropriate agent",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "query_type": {
                                "type": "string",
                                "enum": ["diagnostic", "document_analysis", "quick_question", "search", "general"],
                                "description": "Type of medical query"
                            },
                            "confidence": {
                                "type": "number",
                                "minimum": 0,
                                "maximum": 1,
                                "description": "Confidence in classification (0-1)"
                            },
                            "reasoning": {
                                "type": "string",
                                "description": "Brief explanation of classification reasoning"
                            },
                            "requires_patient_context": {
                                "type": "boolean",
                                "description": "Whether this query requires patient context"
                            },
                            "urgency": {
                                "type": "string",
                                "enum": ["low", "medium", "high", "critical"],
                                "description": "Medical urgency level"
                            },
                            "context_strategy": {
                                "type": "string",
                                "enum": ["full_docs_only", "recent_docs", "critical_docs"],
                                "description": "Recommended context retrieval strategy"
                            }
                        },
                        "required": ["query_type", "confidence", "reasoning"]
                    }
                }
            }
        ]
    
    async def initialize(self):
        """Initialize the Azure OpenAI service and all agents"""
        if not self.azure_openai_service.is_initialized:
            await self.azure_openai_service.initialize()
        
        # Initialize all agents
        await self.diagnostic_agent.initialize()
        await self.document_agent.initialize()
        await self.quick_agent.initialize()
        await self.search_agent.initialize()
    
    async def process_request(
        self,
        messages: List[ChatMessage],
        patient_context: Optional[Dict[str, Any]] = None,  # Legacy context (now optional)
        patient_id: Optional[str] = None,  # New: direct patient ID for enhanced context
        model_type: ModelType = ModelType.GPT4O,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        context_strategy: Optional[ContextStrategy] = None
    ) -> ChatResponse:
        """
        Process medical request with enhanced hybrid context
        
        Args:
            messages: Chat messages from user
            patient_context: Legacy patient context (deprecated)
            patient_id: Patient ID for enhanced context retrieval
            model_type: Preferred model type
            temperature: Sampling temperature
            max_tokens: Maximum tokens
            context_strategy: Context retrieval strategy
            
        Returns:
            ChatResponse from specialized agent with enhanced context
        """
        try:
            logger.info("🎯 Coordinating medical request with enhanced context")
            
            # Ensure Azure OpenAI service is initialized
            await self.initialize()
            
            # Ensure model_type is ModelType enum
            if isinstance(model_type, str):
                model_type = ModelType.GPT4O if model_type == "gpt-4o" else ModelType.GPT4O_MINI
            
            # Extract user query for context
            user_query = ""
            if messages:
                for msg in reversed(messages):
                    if msg.role == "user":
                        user_query = msg.content
                        break
            
            # Step 1: Get enhanced patient context FIRST if patient_id provided
            enhanced_context = None
            if patient_id and self.use_enhanced_context:
                try:
                    from app.database.factory import get_database_adapter
                    adapter = get_database_adapter()
                    async with adapter.get_session() as db:
                        # Use default strategy for initial context retrieval
                        enhanced_context = await enhanced_document_service.get_enhanced_patient_context(
                            patient_id=patient_id,
                            query=user_query,
                            strategy=context_strategy or self.default_context_strategy,
                            db=db,
                            include_recent=True,
                            include_critical=False  # Don't assume critical yet
                        )
                    logger.info(f"🔍 Pre-classification context: {enhanced_context.total_documents} docs, {enhanced_context.total_tokens} tokens")
                except Exception as e:
                    logger.warning(f"⚠️ Enhanced context failed, classification will proceed without context: {str(e)}")
                    enhanced_context = None
            
            # Step 2: Classify the query WITH context information available
            query_classification = await self._classify_query_enhanced(messages, enhanced_context)
            logger.info(f"📊 Context-aware classification: {query_classification['query_type']} (confidence: {query_classification['confidence']:.2f})")
            
            # Step 3: Refine context based on classification if needed
            if enhanced_context and query_classification.get("context_strategy"):
                # Update context strategy based on classification
                refined_strategy = ContextStrategy(query_classification["context_strategy"])
                if refined_strategy != enhanced_context.strategy_used:
                    logger.info(f"🔄 Refining context strategy from {enhanced_context.strategy_used.value} to {refined_strategy.value}")
                    try:
                        async with get_db_async() as db:
                            enhanced_context = await enhanced_document_service.get_enhanced_patient_context(
                                patient_id=patient_id,
                                query=user_query,
                                strategy=refined_strategy,
                                db=db,
                                include_recent=True,
                                include_critical=query_classification.get("urgency", "low") in ["high", "critical"]
                            )
                        logger.info(f"🔍 Refined context: {enhanced_context.total_documents} docs, {enhanced_context.total_tokens} tokens")
                    except Exception as e:
                        logger.warning(f"⚠️ Context refinement failed, using original context: {str(e)}")
            
            # Step 4: Route to appropriate agent with enhanced context
            response = await self._route_to_agent_enhanced(
                query_classification,
                messages,
                patient_context,  # Legacy context as fallback
                enhanced_context,  # New enhanced context
                model_type,
                temperature,
                max_tokens
            )
            
            # Step 5: Add enhanced coordinator metadata
            response.metadata = {
                "coordinator": {
                    "classification": query_classification,
                    "agent_used": query_classification["query_type"],
                    "enhanced_context_used": enhanced_context is not None,
                    "context_strategy": enhanced_context.strategy_used.value if enhanced_context else None,
                    "context_confidence": enhanced_context.confidence if enhanced_context else None,
                    "total_context_documents": enhanced_context.total_documents if enhanced_context else 0,
                    "total_context_tokens": enhanced_context.total_tokens if enhanced_context else 0,
                    "legacy_context_used": patient_context is not None,
                    "context_available_for_classification": enhanced_context is not None
                }
            }
            
            # Add context summary to response if available
            if enhanced_context:
                if not response.metadata:
                    response.metadata = {}
                response.metadata["context_summary"] = enhanced_context.context_summary
                response.metadata["context_recommendations"] = enhanced_context.recommendations
            
            return response
            
        except Exception as e:
            logger.error(f"❌ Enhanced coordinator error: {str(e)}")
            raise AgentError(f"Enhanced coordination failed: {str(e)}")
    
    async def process_request_stream(
        self,
        messages: List[ChatMessage],
        patient_context: Optional[Dict[str, Any]] = None,
        patient_id: Optional[str] = None,
        model_type: ModelType = ModelType.GPT4O,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        context_strategy: Optional[ContextStrategy] = None
    ) -> AsyncGenerator[str, None]:
        """
        Process medical request with streaming response and enhanced context
        """
        try:
            # Ensure model_type is ModelType enum
            if isinstance(model_type, str):
                model_type = ModelType.GPT4O if model_type == "gpt-4o" else ModelType.GPT4O_MINI
            
            # Extract user query
            user_query = ""
            if messages:
                for msg in reversed(messages):
                    if msg.role == "user":
                        user_query = msg.content
                        break
            
            # Step 1: Get enhanced context FIRST if available
            enhanced_context = None
            if patient_id and self.use_enhanced_context:
                try:
                    async with get_db_async() as db:
                        enhanced_context = await enhanced_document_service.get_enhanced_patient_context(
                            patient_id=patient_id,
                            query=user_query,
                            strategy=context_strategy or self.default_context_strategy,
                            db=db,
                            include_recent=True,
                            include_critical=False  # Don't assume critical yet
                        )
                    logger.info(f"🔍 Pre-classification streaming context: {enhanced_context.total_documents} docs, {enhanced_context.total_tokens} tokens")
                except Exception as e:
                    logger.warning(f"⚠️ Enhanced context failed for streaming: {str(e)}")
                    enhanced_context = None
            
            # Step 2: Classify query WITH context information
            query_classification = await self._classify_query_enhanced(messages, enhanced_context)
            logger.info(f"🌊 Context-aware streaming classification: {query_classification['query_type']} (confidence: {query_classification['confidence']:.2f})")
            
            # Step 3: Refine context based on classification if needed
            if enhanced_context and query_classification.get("context_strategy"):
                refined_strategy = ContextStrategy(query_classification["context_strategy"])
                if refined_strategy != enhanced_context.strategy_used:
                    logger.info(f"🔄 Refining streaming context strategy from {enhanced_context.strategy_used.value} to {refined_strategy.value}")
                    try:
                        async with get_db_async() as db:
                            enhanced_context = await enhanced_document_service.get_enhanced_patient_context(
                                patient_id=patient_id,
                                query=user_query,
                                strategy=refined_strategy,
                                db=db,
                                include_recent=True,
                                include_critical=query_classification.get("urgency", "low") in ["high", "critical"]
                        )
                        logger.info(f"🔍 Refined streaming context: {enhanced_context.total_documents} docs, {enhanced_context.total_tokens} tokens")
                    except Exception as e:
                        logger.warning(f"⚠️ Streaming context refinement failed: {str(e)}")
            
            # Step 4: Route to appropriate agent for streaming
            async for chunk in self._route_to_agent_stream_enhanced(
                query_classification,
                messages,
                patient_context,
                enhanced_context,
                model_type,
                temperature,
                max_tokens
            ):
                yield chunk
                
        except Exception as e:
            logger.error(f"❌ Enhanced streaming coordinator error: {str(e)}")
            yield f"Error: {str(e)}"
    
    async def _classify_query_enhanced(self, messages: List[ChatMessage], enhanced_context=None) -> Dict[str, Any]:
        """
        Enhanced query classification that considers available patient context
        
        Args:
            messages: Chat messages from user
            enhanced_context: Available patient context (HybridContext object)
            
        Returns:
            Classification result with context-aware decisions
        """
        try:
            # Prepare context information for classification
            context_info = ""
            if enhanced_context:
                context_info = f"""
                
                CONTEXTO DISPONIBLE DEL PACIENTE:
                - Documentos disponibles: {enhanced_context.total_documents}
                - Tokens de contexto: {enhanced_context.total_tokens}
                - Estrategia usada: {enhanced_context.strategy_used.value}
                - Confianza del contexto: {enhanced_context.confidence:.2f}
                - Documentos completos: {len(enhanced_context.full_documents)}
                - Resultados vectoriales: {len(enhanced_context.vector_results)}
                
                IMPORTANTE: Si la consulta pide información específica del paciente y hay documentos disponibles,
                es muy probable que sea "document_analysis" o "search" en lugar de "general".
                """
            else:
                context_info = """
                
                CONTEXTO DEL PACIENTE: No hay documentos disponibles para este paciente.
                
                IMPORTANTE: Sin contexto del paciente, las consultas específicas sobre expedientes 
                deben clasificarse como "general" ya que no hay información para procesar.
                """
            
            # Create enhanced classification prompt with context awareness
            classification_messages = [
                ChatMessage(
                    role="system",
                    content=f"""Eres un clasificador avanzado de consultas médicas con acceso a información del contexto del paciente.
                    
                    Analiza la consulta y clasifícala según estos tipos:
                    
                    - diagnostic: Consultas sobre síntomas, diagnósticos, diagnósticos diferenciales
                    - document_analysis: Análisis de documentos médicos, expedientes, estudios, resúmenes de historiales, análisis de contenido específico
                    - quick_question: Preguntas rápidas sobre medicina, definiciones, información médica general
                    - search: Búsqueda de información específica en expedientes (cuando no requiere análisis profundo)
                    - general: Saludos simples, consultas no médicas, conversación casual
                    
                                    También determina la mejor estrategia de contexto:
                - full_docs_only: Documentos médicos completos (estrategia principal)
                - recent_docs: Priorizar documentos más recientes
                - critical_docs: Priorizar documentos críticos (emergencias, cirugías)
                    
                    REGLAS DE CLASIFICACIÓN CONTEXTUAL:
                    - Si hay documentos disponibles Y la consulta pide información del paciente → document_analysis
                    - Si hay documentos disponibles Y la consulta busca datos específicos → search
                    - Si NO hay documentos disponibles Y se pide información del paciente → general
                    - Para preguntas médicas generales (sin requerir expediente específico) → quick_question
                    - Para análisis de síntomas complejos → diagnostic
                    - Solo usar "general" para saludos básicos, despedidas, agradecimientos
                    
                    CRITERIOS ESPECÍFICOS PARA DOCUMENT_ANALYSIS:
                    - Solicitudes de resúmenes de expedientes
                    - Preguntas sobre estudios realizados (laboratorios, imágenes, procedimientos)
                    - Análisis de contenido específico de documentos médicos
                    - Consultas que requieren interpretar el contenido completo del expediente
                    - Preguntas como "qué estudios se ha hecho", "cuáles son los resultados", "dame un resumen"
                    
                    CRITERIOS ESPECÍFICOS PARA SEARCH:
                    - Búsqueda de información específica pero sin análisis profundo
                    - Búsqueda de datos puntuales (fechas, nombres, números)
                    - Cuando se necesita encontrar información específica sin interpretación
                    
                    EJEMPLOS ACTUALIZADOS:
                    - "dame un resumen del expediente" + documentos disponibles → document_analysis
                    - "qué estudios se ha hecho pedro" + documentos disponibles → document_analysis
                    - "cuáles son los resultados de laboratorio" + documentos disponibles → document_analysis
                    - "busca la fecha de la última consulta" + documentos disponibles → search
                    - "cuáles son los síntomas de diabetes" → quick_question
                    - "analiza los síntomas del paciente" + documentos disponibles → diagnostic
                    - "hola, buenos días" → general{context_info}
                    
                )"""
                )
            ] + messages
            
            response = await self.azure_openai_service.chat_completion(
                messages=classification_messages,
                model_type=ModelType.GPT4O,
                tools=self.classification_tools,
                tool_choice="auto",
                temperature=0.1,
                max_tokens=500
            )
            
            # Extract classification from tool call
            if response.tool_calls:
                import json
                tool_call = response.tool_calls[0]
                classification = json.loads(tool_call.function["arguments"])
                
                # Ensure context_strategy is set
                if "context_strategy" not in classification:
                    classification["context_strategy"] = self._determine_default_strategy(classification["query_type"])
                
                # Add context awareness metadata
                classification["context_available"] = enhanced_context is not None
                classification["context_documents"] = enhanced_context.total_documents if enhanced_context else 0
                
                return classification
            else:
                # Fallback classification with context awareness
                has_context = enhanced_context is not None and enhanced_context.total_documents > 0
                return {
                    "query_type": "document_analysis" if has_context else "general",
                    "confidence": 0.5,
                    "reasoning": "Could not classify automatically, using context-aware fallback",
                    "requires_patient_context": has_context,
                    "urgency": "low",
                    "context_strategy": "full_docs_only" if has_context else "full_docs_only",
                    "context_available": has_context,
                    "context_documents": enhanced_context.total_documents if enhanced_context else 0
                }
                
        except Exception as e:
            logger.error(f"❌ Enhanced query classification failed: {str(e)}")
            # Return safe fallback with context awareness
            has_context = enhanced_context is not None and enhanced_context.total_documents > 0
            return {
                "query_type": "document_analysis" if has_context else "general",
                "confidence": 0.3,
                "reasoning": f"Classification error: {str(e)}, using context-aware fallback",
                "requires_patient_context": has_context,
                "urgency": "low",
                "context_strategy": "full_docs_only" if has_context else "full_docs_only",
                "context_available": has_context,
                "context_documents": enhanced_context.total_documents if enhanced_context else 0
            }
    
    def _determine_default_strategy(self, query_type: str) -> str:
        """Determine default context strategy based on query type"""
        strategy_map = {
            "diagnostic": "full_docs_only",
            "document_analysis": "full_docs_only", 
            "quick_question": "recent_docs",
            "search": "full_docs_only",
            "general": "full_docs_only"
        }
        return strategy_map.get(query_type, "full_docs_only")
    
    async def _route_to_agent_enhanced(
        self,
        classification: Dict[str, Any],
        messages: List[ChatMessage],
        legacy_context: Optional[Dict[str, Any]],
        enhanced_context,  # HybridContext object
        model_type: ModelType,
        temperature: Optional[float],
        max_tokens: Optional[int]
    ) -> ChatResponse:
        """Route request to appropriate specialized agent with enhanced context"""
        
        query_type = classification.get("query_type", "general")
        
        # Prepare unified context for agents
        unified_context = await self._prepare_unified_context(legacy_context, enhanced_context)
        
        try:
            if query_type == "diagnostic":
                return await self.diagnostic_agent.process(
                    messages=messages,
                    patient_context=unified_context,
                    model_type=ModelType.GPT4O,  # Use GPT-4o for complex diagnostics
                    temperature=temperature,
                    max_tokens=max_tokens
                )
            
            elif query_type == "document_analysis":
                return await self.document_agent.process(
                    messages=messages,
                    patient_context=unified_context,
                    model_type=ModelType.GPT4O,  # Use GPT-4o for document analysis
                    temperature=temperature,
                    max_tokens=max_tokens
                )
            
            elif query_type == "quick_question":
                return await self.quick_agent.process(
                    messages=messages,
                    patient_context=unified_context,
                    model_type=ModelType.GPT4O,  # Use GPT-4o for quick responses
                    temperature=temperature,
                    max_tokens=max_tokens
                )
            
            elif query_type == "search":
                return await self.search_agent.process(
                    messages=messages,
                    patient_context=unified_context,
                    model_type=model_type,
                    temperature=temperature,
                    max_tokens=max_tokens
                )
            
            else:  # general
                # Handle general conversations with enhanced context awareness
                general_prompt = ChatMessage(
                    role="system",
                    content="""Eres un asistente médico avanzado y amigable del TecSalud con acceso a expedientes médicos completos.
                    
                    Para saludos y consultas generales:
                    - Saluda cordialmente y preséntate como asistente médico de TecSalud
                    - Menciona que tienes acceso a expedientes médicos completos y vectorización semántica
                    - Ofrece ayuda con consultas médicas específicas
                    - Si hay contexto del paciente disponible, menciona que puedes revisar su historial
                    
                    Características del sistema:
                    - Análisis inteligente de documentos médicos completos
                    - Búsqueda semántica en expedientes
                    - Agentes especializados para diagnóstico, análisis de documentos y búsquedas
                    - Contexto híbrido que combina vectores con documentos completos
                    
                    Mantén un tono profesional pero cálido, y destaca las capacidades avanzadas del sistema."""
                )
                
                general_messages = [general_prompt] + messages
                
                return await self.azure_openai_service.chat_completion(
                    messages=general_messages,
                    model_type=ModelType.GPT4O_MINI,  # Use faster model for general chat
                    temperature=temperature or 0.7,  # More natural conversation
                    max_tokens=max_tokens or 512     # Shorter responses for general chat
                )
                
        except Exception as e:
            logger.error(f"❌ Enhanced agent routing failed for {query_type}: {str(e)}")
            # Fallback to general response
            return await self.azure_openai_service.chat_completion(
                messages=messages,
                model_type=ModelType.GPT4O,
                temperature=0.7,
                max_tokens=1024
            )
    
    async def _route_to_agent_stream_enhanced(
        self,
        classification: Dict[str, Any],
        messages: List[ChatMessage],
        legacy_context: Optional[Dict[str, Any]],
        enhanced_context,  # HybridContext object
        model_type: ModelType,
        temperature: Optional[float],
        max_tokens: Optional[int]
    ) -> AsyncGenerator[str, None]:
        """Route request to appropriate agent for streaming with enhanced context"""
        
        query_type = classification.get("query_type", "general")
        unified_context = await self._prepare_unified_context(legacy_context, enhanced_context)
        
        logger.info(f"🎯 MedicalCoordinator: Routing to {query_type} agent")
        logger.info(f"🎯 MedicalCoordinator: Unified context prepared with {len(unified_context)} keys")
        
        try:
            if query_type == "diagnostic":
                logger.info("🎯 MedicalCoordinator: Calling DiagnosticAgent")
                async for chunk in self.diagnostic_agent.process_stream(
                    messages=messages,
                    patient_context=unified_context,
                    model_type=ModelType.GPT4O,
                    temperature=temperature,
                    max_tokens=max_tokens
                ):
                    yield chunk
            
            elif query_type == "document_analysis":
                logger.info("🎯 MedicalCoordinator: Calling DocumentAnalysisAgent")
                async for chunk in self.document_agent.process_stream(
                    messages=messages,
                    patient_context=unified_context,
                    model_type=ModelType.GPT4O,
                    temperature=temperature,
                    max_tokens=max_tokens
                ):
                    yield chunk
            
            elif query_type == "quick_question":
                logger.info("🎯 MedicalCoordinator: Calling QuickResponseAgent")
                async for chunk in self.quick_agent.process_stream(
                    messages=messages,
                    patient_context=unified_context,
                    model_type=ModelType.GPT4O,
                    temperature=temperature,
                    max_tokens=max_tokens
                ):
                    yield chunk
            
            elif query_type == "search":
                logger.info("🎯 MedicalCoordinator: Calling SearchAgent")
                async for chunk in self.search_agent.process_stream(
                    messages=messages,
                    patient_context=unified_context,
                    model_type=model_type,
                    temperature=temperature,
                    max_tokens=max_tokens
                ):
                    yield chunk
            
            else:  # general
                logger.info("🎯 MedicalCoordinator: Handling general conversation")
                # Enhanced general conversation with streaming
                general_prompt = ChatMessage(
                    role="system",
                    content="""Eres un asistente médico avanzado y amigable del TecSalud con acceso a expedientes médicos completos.
                    
                    Características del sistema mejorado:
                    - Análisis inteligente de documentos médicos completos
                    - Búsqueda semántica avanzada en expedientes  
                    - Contexto híbrido que combina vectores con documentos completos
                    - Agentes especializados para diferentes tipos de consultas
                    
                    Responde de manera cálida y profesional, destacando las capacidades avanzadas cuando sea relevante."""
                )
                
                general_messages = [general_prompt] + messages
                
                async for chunk in self.azure_openai_service.chat_completion_stream(
                    messages=general_messages,
                    model_type=ModelType.GPT4O_MINI,
                    temperature=temperature or 0.7,
                    max_tokens=max_tokens or 512
                ):
                    yield chunk
                    
        except Exception as e:
            logger.error(f"❌ Enhanced streaming routing failed: {str(e)}")
            yield f"Error en el procesamiento mejorado: {str(e)}"
    
    async def _prepare_unified_context(
        self, 
        legacy_context: Optional[Dict[str, Any]], 
        enhanced_context,  # HybridContext object
        patient_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Prepare unified context combining legacy and enhanced context"""
        unified = {}
        
        # Add legacy context if available
        if legacy_context:
            unified.update(legacy_context)
            unified["legacy_context"] = True
        
        # Add enhanced context if available
        if enhanced_context:
            # Get patient info to include in context
            patient_info = {}
            try:
                from app.database.factory import get_db_async
                
                async with get_db_async() as db:
                    patient = await db.get_by_id("patients", str(enhanced_context.patient_id))
                    if patient:
                        patient_info = {
                            "name": patient.get("name", "Unknown"),
                            "medical_record_number": patient.get("medical_record_number", "N/A"),
                            "age": patient.get("age", "N/A"),
                            "gender": patient.get("gender", "N/A"),
                            "blood_type": patient.get("blood_type", "N/A"),
                            "status": patient.get("status", "N/A")
                        }
                    else:
                        patient_info = {"name": "Unknown Patient"}
            except Exception as e:
                logger.warning(f"Could not retrieve patient info: {e}")
                patient_info = {"name": "Unknown Patient"}
            
            unified.update({
                "enhanced_context": True,
                "patient_id": enhanced_context.patient_id,
                "patient_info": patient_info,  # Add patient information
                "strategy_used": enhanced_context.strategy_used.value,
                "total_documents": enhanced_context.total_documents,
                "total_tokens": enhanced_context.total_tokens,
                "context_summary": enhanced_context.context_summary,
                "context_confidence": enhanced_context.confidence,
                "recommendations": enhanced_context.recommendations,
                
                # Complete medical documents only
                "full_documents": [
                    {
                        "document_id": doc.document_id,
                        "title": doc.title,
                        "content": doc.content,  # Use full content for medical analysis
                        "document_type": doc.document_type.value,
                        "relevance_score": doc.relevance_score,
                        "relevance_level": doc.relevance_level.value,
                        "source": doc.source,
                        "created_at": doc.created_at.isoformat(),
                        "key_points": doc.key_points or []
                    }
                    for doc in enhanced_context.full_documents
                ],
                "documents_count": len(enhanced_context.full_documents),  # Add count for easier access
                "full_documents_count": len(enhanced_context.full_documents)
            })
        
        # Add metadata
        unified["context_type"] = "hybrid" if enhanced_context else "legacy"
        unified["generation_timestamp"] = datetime.now().isoformat()
        
        return unified

