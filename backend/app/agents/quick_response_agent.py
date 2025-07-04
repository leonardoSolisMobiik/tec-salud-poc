"""
Quick Response Agent
Specialized agent for fast medical queries using GPT-4o-mini
"""

import logging
from typing import List, Dict, Any, Optional, AsyncGenerator

from app.models.chat import ChatMessage, ChatResponse, ModelType
from app.services.azure_openai_service import AzureOpenAIService
from app.utils.exceptions import AgentError

logger = logging.getLogger(__name__)

class QuickResponseAgent:
    """
    Specialized agent for quick medical responses
    Uses GPT-4o-mini for fast, efficient answers to simple queries
    """
    
    def __init__(self):
        self.azure_openai_service = AzureOpenAIService()
        self.system_prompt = """Eres un asistente médico especializado en respuestas rápidas y precisas.
        Tu función es proporcionar información médica clara y concisa para:
        
        1. DEFINICIONES MÉDICAS: Explicar términos y conceptos médicos
        2. INFORMACIÓN GENERAL: Datos sobre enfermedades, síntomas, tratamientos
        3. CONSULTAS RÁPIDAS: Respuestas directas a preguntas específicas
        4. ORIENTACIÓN BÁSICA: Guía inicial sobre cuándo buscar atención médica
        
        CARACTERÍSTICAS DE TUS RESPUESTAS:
        - Concisas pero completas
        - Fáciles de entender
        - Basadas en evidencia médica
        - Incluyen cuándo buscar atención profesional
        
        IMPORTANTE:
        - Mantén respuestas breves (máximo 200-300 palabras)
        - Usa lenguaje claro y accesible
        - Siempre indica cuándo consultar a un médico
        - No proporciones diagnósticos específicos
        - En caso de emergencia, deriva inmediatamente
        """
        
        # Quick response tools for function calling
        self.quick_tools = [
            {
                "type": "function",
                "function": {
                    "name": "provide_quick_medical_info",
                    "description": "Provide quick, structured medical information",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "main_answer": {
                                "type": "string",
                                "description": "Main answer to the medical question"
                            },
                            "key_points": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "Key points or bullet points (max 5)"
                            },
                            "when_to_see_doctor": {
                                "type": "string",
                                "description": "When to seek medical attention"
                            },
                            "urgency_level": {
                                "type": "string",
                                "enum": ["routine", "soon", "urgent", "emergency"],
                                "description": "Level of medical urgency"
                            },
                            "additional_resources": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "Additional helpful information or tips"
                            }
                        },
                        "required": ["main_answer", "when_to_see_doctor", "urgency_level"]
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
        Process quick medical query using GPT-4o-mini
        
        Args:
            messages: Chat messages with quick query
            patient_context: Optional patient context
            model_type: Model to use (defaults to GPT-4o-mini)
            temperature: Sampling temperature
            max_tokens: Maximum tokens
            
        Returns:
            ChatResponse with quick medical information
        """
        try:
            logger.info("⚡ Processing quick medical query")
            
            # Prepare messages for quick response
            enhanced_messages = await self._prepare_quick_context(
                messages, patient_context
            )
            
            # Use GPT-4o-mini for fast responses
            response = await self.azure_openai_service.chat_completion(
                messages=enhanced_messages,
                model_type=ModelType.GPT4O_MINI,
                tools=self.quick_tools,
                tool_choice="auto",
                temperature=temperature or 0.3,  # Slightly higher for natural responses
                max_tokens=max_tokens or 1024  # Limit for quick responses
            )
            
            # Enhance response if tool calls were made
            if response.tool_calls:
                response = await self._enhance_quick_response(response)
            
            logger.info("✅ Quick response completed")
            return response
            
        except Exception as e:
            logger.error(f"❌ Quick response failed: {str(e)}")
            raise AgentError(f"Quick response failed: {str(e)}")
    
    async def process_stream(
        self,
        messages: List[ChatMessage],
        patient_context: Optional[Dict[str, Any]] = None,
        model_type: ModelType = ModelType.GPT4O_MINI,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> AsyncGenerator[str, None]:
        """
        Process quick query with streaming response
        """
        try:
            logger.info("🌊 Streaming quick response")
            
            # Prepare context
            enhanced_messages = await self._prepare_quick_context(
                messages, patient_context
            )
            
            # Stream response
            async for chunk in self.azure_openai_service.chat_completion_stream(
                messages=enhanced_messages,
                model_type=ModelType.GPT4O_MINI,
                temperature=temperature or 0.3,
                max_tokens=max_tokens or 1024
            ):
                yield chunk
                
        except Exception as e:
            logger.error(f"❌ Quick streaming failed: {str(e)}")
            yield f"Error en respuesta rápida: {str(e)}"
    
    async def _prepare_quick_context(
        self,
        messages: List[ChatMessage],
        patient_context: Optional[Dict[str, Any]]
    ) -> List[ChatMessage]:
        """
        Prepare enhanced messages for quick response
        """
        enhanced_messages = [
            ChatMessage(role="system", content=self.system_prompt)
        ]
        
        # Add minimal patient context if available (for quick responses)
        if patient_context:
            context_summary = self._create_quick_context_summary(patient_context)
            if context_summary:
                enhanced_messages.append(
                    ChatMessage(
                        role="system",
                        content=f"Contexto del paciente: {context_summary}"
                    )
                )
        
        # Add user messages
        enhanced_messages.extend(messages)
        
        return enhanced_messages
    
    def _create_quick_context_summary(self, context: Dict[str, Any]) -> str:
        """Create brief context summary for quick responses"""
        summary_parts = []
        
        if "patient_info" in context:
            patient = context["patient_info"]
            age = patient.get('age', 'N/A')
            gender = patient.get('gender', 'N/A')
            summary_parts.append(f"{age} años, {gender}")
        
        if "medical_history" in context:
            history = context["medical_history"]
            if history.get("allergies"):
                summary_parts.append(f"Alergias: {', '.join(history['allergies'][:2])}")
            if history.get("conditions"):
                summary_parts.append(f"Condiciones: {', '.join(history['conditions'][:2])}")
        
        return "; ".join(summary_parts) if summary_parts else ""
    
    async def _enhance_quick_response(self, response: ChatResponse) -> ChatResponse:
        """
        Enhance quick response with structured information from tool calls
        """
        try:
            if not response.tool_calls:
                return response
            
            import json
            enhanced_content = response.content
            
            for tool_call in response.tool_calls:
                if tool_call.function["name"] == "provide_quick_medical_info":
                    info_data = json.loads(tool_call.function["arguments"])
                    enhanced_content += self._format_quick_info(info_data)
            
            response.content = enhanced_content
            return response
            
        except Exception as e:
            logger.error(f"❌ Failed to enhance quick response: {str(e)}")
            return response
    
    def _format_quick_info(self, data: Dict[str, Any]) -> str:
        """Format quick medical information"""
        formatted = "\\n\\n## ⚡ RESPUESTA RÁPIDA\\n\\n"
        
        # Main answer
        formatted += f"{data.get('main_answer', '')}\\n\\n"
        
        # Key points
        if data.get('key_points'):
            formatted += "**Puntos Clave:**\\n"
            for point in data['key_points']:
                formatted += f"• {point}\\n"
            formatted += "\\n"
        
        # When to see doctor
        urgency = data.get('urgency_level', 'routine')
        urgency_emoji = {
            'routine': '📅',
            'soon': '⏰',
            'urgent': '🚨',
            'emergency': '🆘'
        }.get(urgency, '📅')
        
        formatted += f"**{urgency_emoji} Cuándo consultar:** {data.get('when_to_see_doctor', '')}\\n\\n"
        
        # Additional resources
        if data.get('additional_resources'):
            formatted += "**💡 Información Adicional:**\\n"
            for resource in data['additional_resources']:
                formatted += f"• {resource}\\n"
            formatted += "\\n"
        
        # Urgency indicator
        if urgency == 'emergency':
            formatted += "🆘 **EMERGENCIA: Busque atención médica inmediata**\\n\\n"
        elif urgency == 'urgent':
            formatted += "🚨 **URGENTE: Consulte pronto con un médico**\\n\\n"
        
        formatted += "---\\n*💬 Respuesta rápida - Para evaluación completa consulte a su médico*"
        
        return formatted

