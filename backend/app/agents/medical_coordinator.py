"""
Medical Coordinator Agent
Main orchestrator that routes medical queries to specialized agents
"""

import logging
from typing import List, Dict, Any, Optional, AsyncGenerator
from enum import Enum

from app.models.chat import ChatMessage, ChatResponse, ModelType
from app.services.azure_openai_service import AzureOpenAIService
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
    Coordinator agent that analyzes queries and routes to specialized agents
    """
    
    def __init__(self):
        self.azure_openai_service = AzureOpenAIService()
        self.diagnostic_agent = DiagnosticAgent()
        self.document_agent = DocumentAnalysisAgent()
        self.quick_agent = QuickResponseAgent()
        self.search_agent = SearchAgent()
        
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
        patient_context: Optional[Dict[str, Any]] = None,
        model_type: ModelType = ModelType.GPT4O,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> ChatResponse:
        """
        Process medical request by routing to appropriate specialized agent
        
        Args:
            messages: Chat messages from user
            patient_context: Optional patient context from vector database
            model_type: Preferred model type
            temperature: Sampling temperature
            max_tokens: Maximum tokens
            
        Returns:
            ChatResponse from specialized agent
        """
        try:
            logger.info("🎯 Coordinating medical request")
            
            # Ensure Azure OpenAI service is initialized
            await self.initialize()
            
            # Ensure model_type is ModelType enum
            if isinstance(model_type, str):
                model_type = ModelType.GPT4O if model_type == "gpt-4o" else ModelType.GPT4O_MINI
            
            # Step 1: Classify the query type
            query_classification = await self._classify_query(messages)
            logger.info(f"📊 Query classified as: {query_classification['query_type']}")
            
            # Step 2: Route to appropriate agent
            response = await self._route_to_agent(
                query_classification,
                messages,
                patient_context,
                model_type,
                temperature,
                max_tokens
            )
            
            # Step 3: Add coordinator metadata
            response.metadata = {
                "coordinator": {
                    "classification": query_classification,
                    "agent_used": query_classification["query_type"],
                    "patient_context_used": patient_context is not None
                }
            }
            
            return response
            
        except Exception as e:
            logger.error(f"❌ Coordinator error: {str(e)}")
            raise AgentError(f"Coordination failed: {str(e)}")
    
    async def process_request_stream(
        self,
        messages: List[ChatMessage],
        patient_context: Optional[Dict[str, Any]] = None,
        model_type: ModelType = ModelType.GPT4O,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> AsyncGenerator[str, None]:
        """
        Process medical request with streaming response
        """
        try:
            # Ensure model_type is ModelType enum
            if isinstance(model_type, str):
                model_type = ModelType.GPT4O if model_type == "gpt-4o" else ModelType.GPT4O_MINI
            
            # Classify query first
            query_classification = await self._classify_query(messages)
            logger.info(f"🌊 Streaming {query_classification['query_type']} query")
            
            # Route to appropriate agent for streaming
            async for chunk in self._route_to_agent_stream(
                query_classification,
                messages,
                patient_context,
                model_type,
                temperature,
                max_tokens
            ):
                yield chunk
                
        except Exception as e:
            logger.error(f"❌ Streaming coordinator error: {str(e)}")
            yield f"Error: {str(e)}"
    
    async def _classify_query(self, messages: List[ChatMessage]) -> Dict[str, Any]:
        """
        Classify the medical query using GPT-4o-mini with function calling
        """
        try:
            # Create classification prompt
            classification_messages = [
                ChatMessage(
                    role="system",
                    content="""Eres un clasificador de consultas médicas especializado. 
                    Analiza la consulta del usuario y clasifícala según estos tipos:
                    
                    - diagnostic: Consultas sobre síntomas, diagnósticos, diagnósticos diferenciales
                    - document_analysis: Análisis de documentos médicos, expedientes, estudios  
                    - quick_question: Preguntas rápidas sobre medicina, definiciones, información médica general
                    - search: Búsqueda de información específica en expedientes
                    - general: Saludos simples (hola, buenos días), consultas no médicas, conversación casual
                    
                    IMPORTANTE:
                    - Usa "general" para saludos básicos, despedidas, agradecimientos
                    - Usa "quick_question" solo para preguntas médicas reales
                    - Considera la urgencia médica y si requiere contexto del paciente"""
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
                return classification
            else:
                # Fallback classification
                return {
                    "query_type": "general",
                    "confidence": 0.5,
                    "reasoning": "Could not classify automatically",
                    "requires_patient_context": False,
                    "urgency": "low"
                }
                
        except Exception as e:
            logger.error(f"❌ Query classification failed: {str(e)}")
            # Return safe fallback
            return {
                "query_type": "general",
                "confidence": 0.3,
                "reasoning": f"Classification error: {str(e)}",
                "requires_patient_context": False,
                "urgency": "low"
            }
    
    async def _route_to_agent(
        self,
        classification: Dict[str, Any],
        messages: List[ChatMessage],
        patient_context: Optional[Dict[str, Any]],
        model_type: ModelType,
        temperature: Optional[float],
        max_tokens: Optional[int]
    ) -> ChatResponse:
        """Route request to appropriate specialized agent"""
        
        query_type = classification.get("query_type", "general")
        
        try:
            if query_type == "diagnostic":
                return await self.diagnostic_agent.process(
                    messages=messages,
                    patient_context=patient_context,
                    model_type=ModelType.GPT4O,  # Use GPT-4o for complex diagnostics
                    temperature=temperature,
                    max_tokens=max_tokens
                )
            
            elif query_type == "document_analysis":
                return await self.document_agent.process(
                    messages=messages,
                    patient_context=patient_context,
                    model_type=ModelType.GPT4O,  # Use GPT-4o for document analysis
                    temperature=temperature,
                    max_tokens=max_tokens
                )
            
            elif query_type == "quick_question":
                return await self.quick_agent.process(
                    messages=messages,
                    patient_context=patient_context,
                    model_type=ModelType.GPT4O,  # Use GPT-4o for quick responses
                    temperature=temperature,
                    max_tokens=max_tokens
                )
            
            elif query_type == "search":
                return await self.search_agent.process(
                    messages=messages,
                    patient_context=patient_context,
                    model_type=model_type,
                    temperature=temperature,
                    max_tokens=max_tokens
                )
            
            else:  # general
                # Handle general conversations with friendly medical assistant persona
                general_prompt = ChatMessage(
                    role="system",
                    content="""Eres un asistente médico amigable y profesional del TecSalud.
                    Responde de manera cálida y profesional a saludos y consultas generales.
                    
                    Para saludos:
                    - Saluda cordialmente
                    - Preséntate como asistente médico de TecSalud
                    - Ofrece ayuda con consultas médicas
                    
                    Mantén un tono profesional pero cálido, y siempre ofrece asistencia médica."""
                )
                
                general_messages = [general_prompt] + messages
                
                return await self.azure_openai_service.chat_completion(
                    messages=general_messages,
                    model_type=ModelType.GPT4O_MINI,  # Use faster model for general chat
                    temperature=temperature or 0.7,  # More natural conversation
                    max_tokens=max_tokens or 512     # Shorter responses for general chat
                )
                
        except Exception as e:
            logger.error(f"❌ Agent routing failed for {query_type}: {str(e)}")
            # Fallback to general response
            return await self.azure_openai_service.chat_completion(
                messages=messages,
                model_type=ModelType.GPT4O,
                temperature=0.7,
                max_tokens=1024
            )
    
    async def _route_to_agent_stream(
        self,
        classification: Dict[str, Any],
        messages: List[ChatMessage],
        patient_context: Optional[Dict[str, Any]],
        model_type: ModelType,
        temperature: Optional[float],
        max_tokens: Optional[int]
    ) -> AsyncGenerator[str, None]:
        """Route request to appropriate agent for streaming"""
        
        query_type = classification.get("query_type", "general")
        
        try:
            if query_type == "diagnostic":
                async for chunk in self.diagnostic_agent.process_stream(
                    messages=messages,
                    patient_context=patient_context,
                    model_type=ModelType.GPT4O,
                    temperature=temperature,
                    max_tokens=max_tokens
                ):
                    yield chunk
            
            elif query_type == "quick_question":
                async for chunk in self.quick_agent.process_stream(
                    messages=messages,
                    patient_context=patient_context,
                    model_type=ModelType.GPT4O,
                    temperature=temperature,
                    max_tokens=max_tokens
                ):
                    yield chunk
            
            else:  # general
                # Handle general conversations with streaming
                general_prompt = ChatMessage(
                    role="system",
                    content="""Eres un asistente médico amigable y profesional del TecSalud.
                    Responde de manera cálida y profesional a saludos y consultas generales.
                    
                    Para saludos:
                    - Saluda cordialmente
                    - Preséntate como asistente médico de TecSalud
                    - Ofrece ayuda con consultas médicas
                    
                    Mantén un tono profesional pero cálido, y siempre ofrece asistencia médica."""
                )
                
                general_messages = [general_prompt] + messages
                
                async for chunk in self.azure_openai_service.chat_completion_stream(
                    messages=general_messages,
                    model_type=ModelType.GPT4O_MINI,  # Use faster model for general chat
                    temperature=temperature or 0.7,  # More natural conversation
                    max_tokens=max_tokens or 512     # Shorter responses for general chat
                ):
                    yield chunk
                    
        except Exception as e:
            logger.error(f"❌ Streaming routing failed: {str(e)}")
            yield f"Error en el procesamiento: {str(e)}"

