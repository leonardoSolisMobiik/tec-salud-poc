"""
Diagnostic Agent
Specialized agent for medical diagnosis and differential diagnosis using GPT-4o
"""

import logging
from typing import List, Dict, Any, Optional, AsyncGenerator
import json

from app.models.chat import ChatMessage, ChatResponse, ModelType
from app.services.azure_openai_service import AzureOpenAIService
from app.utils.exceptions import AgentError

logger = logging.getLogger(__name__)

class DiagnosticAgent:
    """
    Specialized agent for medical diagnosis and differential diagnosis
    Uses GPT-4o for complex medical reasoning
    """
    
    def __init__(self):
        self.azure_openai_service = AzureOpenAIService()
        # Diagnostic tools for function calling
        self.diagnostic_tools = [
            {
                "type": "function",
                "function": {
                    "name": "generate_differential_diagnosis",
                    "description": "Generate differential diagnosis based on symptoms and clinical data",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "primary_diagnosis": {
                                "type": "string",
                                "description": "Most likely primary diagnosis"
                            },
                            "differential_diagnoses": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "diagnosis": {"type": "string"},
                                        "probability": {"type": "number", "minimum": 0, "maximum": 1},
                                        "reasoning": {"type": "string"}
                                    }
                                },
                                "description": "List of differential diagnoses with probabilities"
                            },
                            "recommended_tests": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "Recommended diagnostic tests"
                            },
                            "red_flags": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "Warning signs that require immediate attention"
                            },
                            "confidence_level": {
                                "type": "string",
                                "enum": ["low", "medium", "high"],
                                "description": "Confidence in diagnostic assessment"
                            }
                        },
                        "required": ["primary_diagnosis", "differential_diagnoses", "confidence_level"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "recommend_treatment_plan",
                    "description": "Recommend treatment plan based on diagnosis",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "immediate_actions": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "Immediate treatment actions"
                            },
                            "medications": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "medication": {"type": "string"},
                                        "dosage": {"type": "string"},
                                        "frequency": {"type": "string"},
                                        "duration": {"type": "string"}
                                    }
                                },
                                "description": "Recommended medications"
                            },
                            "follow_up": {
                                "type": "string",
                                "description": "Follow-up recommendations"
                            },
                            "specialist_referral": {
                                "type": "string",
                                "description": "Specialist referral if needed"
                            }
                        },
                        "required": ["immediate_actions", "follow_up"]
                    }
                }
            }
        ]
        
        self.system_prompt = """Eres un médico especialista en diagnóstico médico con amplia experiencia clínica.
        Tu función es ayudar con:
        
        1. ANÁLISIS DE SÍNTOMAS: Evaluar síntomas y signos clínicos
        2. DIAGNÓSTICO DIFERENCIAL: Generar lista de posibles diagnósticos
        3. RECOMENDACIONES: Sugerir estudios y tratamientos apropiados
        4. EVALUACIÓN DE RIESGO: Identificar señales de alarma
        
        PRINCIPIOS IMPORTANTES:
        - Siempre considera el contexto clínico completo
        - Prioriza diagnósticos más probables pero no descartes raros
        - Identifica señales de alarma que requieren atención inmediata
        - Recomienda estudios diagnósticos apropiados
        - Sugiere tratamientos basados en evidencia
        
        LIMITACIONES:
        - Tus recomendaciones son sugerencias que requieren validación médica
        - No reemplazas la evaluación clínica directa
        - Siempre recomienda consulta presencial para casos complejos
        - En emergencias, deriva inmediatamente a servicios de urgencia
        """
    
    async def initialize(self):
        """Initialize the Azure OpenAI service"""
        if not self.azure_openai_service.is_initialized:
            await self.azure_openai_service.initialize()
    
    async def process(
        self,
        messages: List[ChatMessage],
        patient_context: Optional[Dict[str, Any]] = None,
        model_type: ModelType = ModelType.GPT4O,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> ChatResponse:
        """
        Process diagnostic request using GPT-4o with specialized tools
        
        Args:
            messages: Chat messages with diagnostic query
            patient_context: Patient medical history and context
            model_type: Model to use (defaults to GPT-4o)
            temperature: Sampling temperature
            max_tokens: Maximum tokens
            
        Returns:
            ChatResponse with diagnostic analysis
        """
        try:
            logger.info("🔬 Processing diagnostic request")
            
            # Prepare enhanced messages with context
            enhanced_messages = await self._prepare_diagnostic_context(
                messages, patient_context
            )
            
            # Use GPT-4o for complex diagnostic reasoning
            response = await self.azure_openai_service.chat_completion(
                messages=enhanced_messages,
                model_type=ModelType.GPT4O,
                tools=self.diagnostic_tools,
                tool_choice="auto",
                temperature=temperature or 0.1,  # Lower temperature for consistency
                max_tokens=max_tokens or 4096
            )
            
            # Enhance response with diagnostic metadata
            if response.tool_calls:
                response = await self._enhance_diagnostic_response(response)
            
            logger.info("✅ Diagnostic analysis completed")
            return response
            
        except Exception as e:
            logger.error(f"❌ Diagnostic processing failed: {str(e)}")
            raise AgentError(f"Diagnostic analysis failed: {str(e)}")
    
    async def process_stream(
        self,
        messages: List[ChatMessage],
        patient_context: Optional[Dict[str, Any]] = None,
        model_type: ModelType = ModelType.GPT4O,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> AsyncGenerator[str, None]:
        """
        Process diagnostic request with streaming response
        """
        try:
            logger.info("🌊 Streaming diagnostic analysis")
            
            # Prepare context
            enhanced_messages = await self._prepare_diagnostic_context(
                messages, patient_context
            )
            
            # Stream response
            async for chunk in self.azure_openai_service.chat_completion_stream(
                messages=enhanced_messages,
                model_type=ModelType.GPT4O,
                temperature=temperature or 0.1,
                max_tokens=max_tokens or 4096
            ):
                yield chunk
                
        except Exception as e:
            logger.error(f"❌ Diagnostic streaming failed: {str(e)}")
            yield f"Error en análisis diagnóstico: {str(e)}"
    
    async def _prepare_diagnostic_context(
        self,
        messages: List[ChatMessage],
        patient_context: Optional[Dict[str, Any]]
    ) -> List[ChatMessage]:
        """
        Prepare enhanced messages with patient context for diagnostic analysis
        """
        enhanced_messages = [
            ChatMessage(role="system", content=self.system_prompt)
        ]
        
        # Add patient context if available
        if patient_context:
            context_content = self._format_patient_context(patient_context)
            enhanced_messages.append(
                ChatMessage(
                    role="system",
                    content=f"CONTEXTO DEL PACIENTE:\\n{context_content}"
                )
            )
        
        # Add user messages
        enhanced_messages.extend(messages)
        
        return enhanced_messages
    
    def _format_patient_context(self, context: Dict[str, Any]) -> str:
        """Format patient context for diagnostic analysis"""
        formatted_context = []
        
        if "patient_info" in context:
            patient = context["patient_info"]
            formatted_context.append(f"Paciente: {patient.get('name', 'N/A')}")
            formatted_context.append(f"Edad: {patient.get('age', 'N/A')} años")
            formatted_context.append(f"Género: {patient.get('gender', 'N/A')}")
        
        if "medical_history" in context:
            history = context["medical_history"]
            if history.get("allergies"):
                formatted_context.append(f"Alergias: {', '.join(history['allergies'])}")
            if history.get("medications"):
                formatted_context.append(f"Medicamentos actuales: {', '.join(history['medications'])}")
            if history.get("conditions"):
                formatted_context.append(f"Condiciones médicas: {', '.join(history['conditions'])}")
        
        if "recent_visits" in context:
            visits = context["recent_visits"]
            if visits:
                formatted_context.append("Visitas recientes:")
                for visit in visits[:3]:  # Last 3 visits
                    formatted_context.append(f"- {visit.get('date', 'N/A')}: {visit.get('summary', 'N/A')}")
        
        if "vital_signs" in context:
            vitals = context["vital_signs"]
            if vitals:
                latest = vitals[0]  # Most recent
                formatted_context.append("Signos vitales recientes:")
                for key, value in latest.items():
                    if value and key != "date":
                        formatted_context.append(f"- {key}: {value}")
        
        return "\\n".join(formatted_context)
    
    async def _enhance_diagnostic_response(self, response: ChatResponse) -> ChatResponse:
        """
        Enhance diagnostic response with structured analysis from tool calls
        """
        try:
            if not response.tool_calls:
                return response
            
            enhanced_content = response.content
            
            for tool_call in response.tool_calls:
                if tool_call.function["name"] == "generate_differential_diagnosis":
                    diagnosis_data = json.loads(tool_call.function["arguments"])
                    enhanced_content += self._format_differential_diagnosis(diagnosis_data)
                
                elif tool_call.function["name"] == "recommend_treatment_plan":
                    treatment_data = json.loads(tool_call.function["arguments"])
                    enhanced_content += self._format_treatment_plan(treatment_data)
            
            response.content = enhanced_content
            return response
            
        except Exception as e:
            logger.error(f"❌ Failed to enhance diagnostic response: {str(e)}")
            return response
    
    def _format_differential_diagnosis(self, data: Dict[str, Any]) -> str:
        """Format differential diagnosis data"""
        formatted = "\\n\\n## 🎯 ANÁLISIS DIAGNÓSTICO\\n\\n"
        
        formatted += f"**Diagnóstico Principal:** {data.get('primary_diagnosis', 'N/A')}\\n\\n"
        
        if data.get('differential_diagnoses'):
            formatted += "**Diagnósticos Diferenciales:**\\n"
            for dx in data['differential_diagnoses']:
                prob = dx.get('probability', 0) * 100
                formatted += f"- {dx.get('diagnosis', 'N/A')} ({prob:.0f}% probabilidad)\\n"
                formatted += f"  *Razonamiento:* {dx.get('reasoning', 'N/A')}\\n\\n"
        
        if data.get('recommended_tests'):
            formatted += "**Estudios Recomendados:**\\n"
            for test in data['recommended_tests']:
                formatted += f"- {test}\\n"
            formatted += "\\n"
        
        if data.get('red_flags'):
            formatted += "**⚠️ Señales de Alarma:**\\n"
            for flag in data['red_flags']:
                formatted += f"- {flag}\\n"
            formatted += "\\n"
        
        confidence = data.get('confidence_level', 'medium')
        formatted += f"**Nivel de Confianza:** {confidence.upper()}\\n"
        
        return formatted
    
    def _format_treatment_plan(self, data: Dict[str, Any]) -> str:
        """Format treatment plan data"""
        formatted = "\\n\\n## 💊 PLAN DE TRATAMIENTO\\n\\n"
        
        if data.get('immediate_actions'):
            formatted += "**Acciones Inmediatas:**\\n"
            for action in data['immediate_actions']:
                formatted += f"- {action}\\n"
            formatted += "\\n"
        
        if data.get('medications'):
            formatted += "**Medicamentos Sugeridos:**\\n"
            for med in data['medications']:
                formatted += f"- **{med.get('medication', 'N/A')}**\\n"
                formatted += f"  - Dosis: {med.get('dosage', 'N/A')}\\n"
                formatted += f"  - Frecuencia: {med.get('frequency', 'N/A')}\\n"
                formatted += f"  - Duración: {med.get('duration', 'N/A')}\\n\\n"
        
        if data.get('follow_up'):
            formatted += f"**Seguimiento:** {data['follow_up']}\\n\\n"
        
        if data.get('specialist_referral'):
            formatted += f"**Referencia a Especialista:** {data['specialist_referral']}\\n\\n"
        
        formatted += "---\\n*⚠️ Estas recomendaciones requieren validación médica profesional*"
        
        return formatted

