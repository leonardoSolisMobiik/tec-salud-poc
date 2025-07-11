"""
Search Agent
Specialized agent for semantic search in medical documents using Chroma
"""

import logging
from typing import List, Dict, Any, Optional, AsyncGenerator

from app.models.chat import ChatMessage, ChatResponse, ModelType
from app.services.azure_openai_service import AzureOpenAIService
from app.services.chroma_service import chroma_service
from app.utils.exceptions import AgentError, ChromaError

logger = logging.getLogger(__name__)

class SearchAgent:
    """
    Specialized agent for semantic search in medical documents
    Uses Chroma vector database for intelligent document retrieval
    """
    
    def __init__(self):
        self.azure_openai_service = AzureOpenAIService()
        self.system_prompt = """Eres un especialista en búsqueda médica que ayuda a encontrar información relevante en expedientes clínicos.
        
        Tu función es:
        1. BÚSQUEDA SEMÁNTICA: Encontrar documentos relevantes basados en consultas
        2. ANÁLISIS DE RESULTADOS: Interpretar y contextualizar los resultados encontrados
        3. SÍNTESIS DE INFORMACIÓN: Combinar información de múltiples fuentes
        4. RECOMENDACIONES: Sugerir búsquedas adicionales o información faltante
        
        CAPACIDADES:
        - Búsqueda por síntomas, diagnósticos, tratamientos
        - Búsqueda temporal (fechas, períodos)
        - Búsqueda por especialidad médica
        - Identificación de patrones en múltiples documentos
        - Detección de información faltante o inconsistente
        
        PRINCIPIOS:
        - Proporciona resultados relevantes y contextualizados
        - Indica la fuente y fecha de la información
        - Señala limitaciones en los resultados
        - Sugiere búsquedas complementarias
        - Mantén la confidencialidad médica
        """
        
        # Search tools for function calling
        self.search_tools = [
            {
                "type": "function",
                "function": {
                    "name": "semantic_search",
                    "description": "Perform semantic search in medical documents",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "search_query": {
                                "type": "string",
                                "description": "Optimized search query for vector database"
                            },
                            "search_filters": {
                                "type": "object",
                                "properties": {
                                    "patient_id": {"type": "string"},
                                    "document_type": {"type": "string"},
                                    "date_range": {"type": "string"},
                                    "specialty": {"type": "string"}
                                },
                                "description": "Filters to apply to search"
                            },
                            "max_results": {
                                "type": "integer",
                                "minimum": 1,
                                "maximum": 20,
                                "description": "Maximum number of results to return"
                            }
                        },
                        "required": ["search_query"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "analyze_search_results",
                    "description": "Analyze and synthesize search results",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "key_findings": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "Key findings from search results"
                            },
                            "patterns_identified": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "Patterns or trends identified across results"
                            },
                            "information_gaps": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "Missing information or gaps identified"
                            },
                            "recommendations": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "Recommendations for additional searches or actions"
                            },
                            "confidence_level": {
                                "type": "string",
                                "enum": ["low", "medium", "high"],
                                "description": "Confidence in search results completeness"
                            }
                        },
                        "required": ["key_findings", "confidence_level"]
                    }
                }
            }
        ]
    
    async def initialize(self):
        """Initialize the Azure OpenAI service"""
        if not self.azure_openai_service.is_initialized:
            await self.azure_openai_service.initialize()
    
    async def process(
        self,
        messages: List[ChatMessage],
        patient_context: Optional[Dict[str, Any]] = None,
        model_type: ModelType = ModelType.GPT4O_MINI,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> ChatResponse:
        """
        Process search request using semantic search and AI analysis
        
        Args:
            messages: Chat messages with search query
            patient_context: Patient context for filtering
            model_type: Model to use
            temperature: Sampling temperature
            max_tokens: Maximum tokens
            
        Returns:
            ChatResponse with search results and analysis
        """
        try:
            logger.info("🔍 Processing search request")
            
            # Extract search intent from messages
            search_intent = await self._extract_search_intent(messages)
            
            # Perform semantic search
            search_results = await self._perform_semantic_search(
                search_intent, patient_context
            )
            
            # Analyze and synthesize results
            response = await self._analyze_search_results(
                messages, search_results, model_type, temperature, max_tokens
            )
            
            logger.info(f"✅ Search completed with {len(search_results)} results")
            return response
            
        except ChromaError as e:
            logger.error(f"❌ Search database error: {str(e)}")
            raise AgentError(f"Search failed: {str(e)}")
        except Exception as e:
            logger.error(f"❌ Search processing failed: {str(e)}")
            raise AgentError(f"Search processing failed: {str(e)}")
    
    async def process_stream(
        self,
        messages: List[ChatMessage],
        patient_context: Optional[Dict[str, Any]] = None,
        model_type: ModelType = ModelType.GPT4O_MINI,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> AsyncGenerator[str, None]:
        """
        Process search request with streaming response
        """
        try:
            logger.info("🌊 Streaming search analysis")
            
            # Perform search first
            search_intent = await self._extract_search_intent(messages)
            search_results = await self._perform_semantic_search(
                search_intent, patient_context
            )
            
            # Stream analysis
            enhanced_messages = await self._prepare_search_context(
                messages, search_results
            )
            
            async for chunk in self.azure_openai_service.chat_completion_stream(
                messages=enhanced_messages,
                model_type=model_type,
                temperature=temperature or 0.3,
                max_tokens=max_tokens or 2048
            ):
                yield chunk
                
        except Exception as e:
            logger.error(f"❌ Search streaming failed: {str(e)}")
            yield f"Error en búsqueda: {str(e)}"
    
    async def _extract_search_intent(self, messages: List[ChatMessage]) -> Dict[str, Any]:
        """
        Extract search intent from user messages using AI
        """
        try:
            intent_messages = [
                ChatMessage(
                    role="system",
                    content="""Analiza la consulta del usuario y extrae la intención de búsqueda.
                    Identifica qué tipo de información médica está buscando y cómo optimizar la búsqueda."""
                )
            ] + messages
            
            response = await self.azure_openai_service.chat_completion(
                messages=intent_messages,
                model_type=ModelType.GPT4O_MINI,
                tools=self.search_tools[:1],  # Only semantic_search tool
                tool_choice="auto",
                temperature=0.1,
                max_tokens=500
            )
            
            if response.tool_calls:
                import json
                tool_call = response.tool_calls[0]
                return json.loads(tool_call.function["arguments"])
            else:
                # Fallback: extract from last message
                last_message = messages[-1].content if messages else ""
                return {
                    "search_query": last_message,
                    "max_results": 10
                }
                
        except Exception as e:
            logger.error(f"❌ Search intent extraction failed: {str(e)}")
            # Fallback
            last_message = messages[-1].content if messages else "búsqueda médica"
            return {
                "search_query": last_message,
                "max_results": 10
            }
    
    async def _perform_semantic_search(
        self,
        search_intent: Dict[str, Any],
        patient_context: Optional[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Perform semantic search using Chroma vector database
        """
        try:
            search_query = search_intent.get("search_query", "")
            max_results = search_intent.get("max_results", 10)
            search_filters = search_intent.get("search_filters", {})
            
            # Add patient filter if available
            if patient_context and "patient_info" in patient_context:
                patient_id = patient_context["patient_info"].get("id")
                if patient_id:
                    search_filters["patient_id"] = patient_id
            
            # Perform vector search
            results = await chroma_service.search_documents(
                query=search_query,
                n_results=max_results,
                filters=search_filters
            )
            
            return results
            
        except Exception as e:
            logger.error(f"❌ Semantic search failed: {str(e)}")
            return []
    
    async def _analyze_search_results(
        self,
        messages: List[ChatMessage],
        search_results: List[Dict[str, Any]],
        model_type: ModelType,
        temperature: Optional[float],
        max_tokens: Optional[int]
    ) -> ChatResponse:
        """
        Analyze search results and generate comprehensive response
        """
        try:
            # Prepare enhanced messages with search results
            enhanced_messages = await self._prepare_search_context(
                messages, search_results
            )
            
            # Generate analysis
            response = await self.azure_openai_service.chat_completion(
                messages=enhanced_messages,
                model_type=model_type,
                tools=self.search_tools[1:],  # Only analyze_search_results tool
                tool_choice="auto",
                temperature=temperature or 0.3,
                max_tokens=max_tokens or 2048
            )
            
            # Enhance response with search metadata
            if response.tool_calls:
                response = await self._enhance_search_response(
                    response, search_results
                )
            
            return response
            
        except Exception as e:
            logger.error(f"❌ Search analysis failed: {str(e)}")
            # Return basic response with search results
            return ChatResponse(
                content=self._format_basic_search_results(search_results),
                model=model_type,
                usage={"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}
            )
    
    async def _prepare_search_context(
        self,
        messages: List[ChatMessage],
        search_results: List[Dict[str, Any]]
    ) -> List[ChatMessage]:
        """
        Prepare enhanced messages with search results context
        """
        enhanced_messages = [
            ChatMessage(role="system", content=self.system_prompt)
        ]
        
        # Add search results context
        if search_results:
            results_content = self._format_search_results_for_analysis(search_results)
            enhanced_messages.append(
                ChatMessage(
                    role="system",
                    content=f"RESULTADOS DE BÚSQUEDA:\\n{results_content}"
                )
            )
        else:
            enhanced_messages.append(
                ChatMessage(
                    role="system",
                    content="No se encontraron resultados en la búsqueda. Informa al usuario y sugiere búsquedas alternativas."
                )
            )
        
        # Add user messages
        enhanced_messages.extend(messages)
        
        return enhanced_messages
    
    def _format_search_results_for_analysis(self, results: List[Dict[str, Any]]) -> str:
        """Format search results for AI analysis"""
        if not results:
            return "No se encontraron resultados."
        
        formatted_results = []
        for i, result in enumerate(results[:10], 1):  # Limit to top 10
            result_text = f"RESULTADO {i}:\\n"
            result_text += f"Relevancia: {result.get('score', 0):.2f}\\n"
            result_text += f"Documento: {result.get('document_id', 'N/A')}\\n"
            result_text += f"Tipo: {result.get('document_type', 'N/A')}\\n"
            result_text += f"Fecha: {result.get('date', 'N/A')}\\n"
            result_text += f"Contenido: {result.get('content', 'N/A')[:500]}...\\n"
            result_text += "---\\n"
            formatted_results.append(result_text)
        
        return "\\n".join(formatted_results)
    
    def _format_basic_search_results(self, results: List[Dict[str, Any]]) -> str:
        """Format basic search results for user"""
        if not results:
            return "🔍 No se encontraron resultados para su búsqueda.\\n\\nSugerencias:\\n• Intente con términos más generales\\n• Verifique la ortografía\\n• Use sinónimos médicos"
        
        formatted = f"🔍 **Resultados de Búsqueda** ({len(results)} encontrados)\\n\\n"
        
        for i, result in enumerate(results[:5], 1):
            formatted += f"**{i}. {result.get('title', 'Documento médico')}**\\n"
            formatted += f"📅 {result.get('date', 'Fecha no disponible')}\\n"
            formatted += f"📄 {result.get('document_type', 'Tipo no especificado')}\\n"
            formatted += f"📊 Relevancia: {result.get('score', 0):.0%}\\n"
            
            content = result.get('content', '')
            if len(content) > 200:
                content = content[:200] + "..."
            formatted += f"{content}\\n\\n"
        
        if len(results) > 5:
            formatted += f"... y {len(results) - 5} resultados más\\n"
        
        return formatted
    
    async def _enhance_search_response(
        self,
        response: ChatResponse,
        search_results: List[Dict[str, Any]]
    ) -> ChatResponse:
        """
        Enhance search response with structured analysis from tool calls
        """
        try:
            if not response.tool_calls:
                return response
            
            import json
            enhanced_content = response.content
            
            for tool_call in response.tool_calls:
                if tool_call.function["name"] == "analyze_search_results":
                    analysis_data = json.loads(tool_call.function["arguments"])
                    enhanced_content += self._format_search_analysis(
                        analysis_data, search_results
                    )
            
            response.content = enhanced_content
            return response
            
        except Exception as e:
            logger.error(f"❌ Failed to enhance search response: {str(e)}")
            return response
    
    def _format_search_analysis(
        self,
        analysis_data: Dict[str, Any],
        search_results: List[Dict[str, Any]]
    ) -> str:
        """Format search analysis results"""
        formatted = "\\n\\n## 🔍 ANÁLISIS DE BÚSQUEDA\\n\\n"
        
        # Search summary
        formatted += f"**Resultados encontrados:** {len(search_results)}\\n"
        confidence = analysis_data.get('confidence_level', 'medium')
        confidence_emoji = {"low": "🟡", "medium": "🟠", "high": "🟢"}.get(confidence, "🟠")
        formatted += f"**Confianza en resultados:** {confidence_emoji} {confidence.upper()}\\n\\n"
        
        # Key findings
        if analysis_data.get('key_findings'):
            formatted += "**Hallazgos Principales:**\\n"
            for finding in analysis_data['key_findings']:
                formatted += f"• {finding}\\n"
            formatted += "\\n"
        
        # Patterns identified
        if analysis_data.get('patterns_identified'):
            formatted += "**Patrones Identificados:**\\n"
            for pattern in analysis_data['patterns_identified']:
                formatted += f"• {pattern}\\n"
            formatted += "\\n"
        
        # Information gaps
        if analysis_data.get('information_gaps'):
            formatted += "**⚠️ Información Faltante:**\\n"
            for gap in analysis_data['information_gaps']:
                formatted += f"• {gap}\\n"
            formatted += "\\n"
        
        # Recommendations
        if analysis_data.get('recommendations'):
            formatted += "**💡 Recomendaciones:**\\n"
            for rec in analysis_data['recommendations']:
                formatted += f"• {rec}\\n"
            formatted += "\\n"
        
        formatted += "---\\n*🔍 Búsqueda realizada en expedientes médicos disponibles*"
        
        return formatted

