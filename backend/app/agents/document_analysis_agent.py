"""
Document Analysis Agent
Specialized agent for analyzing medical documents using GPT-4o
"""

import logging
from typing import List, Dict, Any, Optional, AsyncGenerator
import json

from app.models.chat import ChatMessage, ChatResponse, ModelType
from app.services.azure_openai_service import AzureOpenAIService
from app.utils.exceptions import AgentError

logger = logging.getLogger(__name__)

class DocumentAnalysisAgent:
    """
    Specialized agent for medical document analysis
    Uses GPT-4o for complex document understanding and analysis
    """
    
    def __init__(self):
        self.azure_openai_service = AzureOpenAIService()
        self.system_prompt = """Eres un especialista en análisis de documentos médicos con experiencia en:
        
        1. ANÁLISIS DE EXPEDIENTES: Revisión completa de historias clínicas
        2. EXTRACCIÓN DE DATOS: Identificación de información clave
        3. RESÚMENES MÉDICOS: Síntesis de información relevante
        4. ANÁLISIS DE ESTUDIOS: Interpretación de laboratorios e imágenes
        5. SEGUIMIENTO: Análisis de evolución y progreso
        
        CAPACIDADES ESPECÍFICAS:
        - Identificar diagnósticos y tratamientos
        - Extraer signos vitales y datos clínicos
        - Detectar patrones y tendencias
        - Identificar información faltante o inconsistencias
        - Generar resúmenes estructurados
        
        PRINCIPIOS:
        - Mantén precisión en la extracción de datos
        - Identifica información crítica y urgente
        - Señala discrepancias o datos incompletos
        - Proporciona análisis contextualizado
        - Respeta la confidencialidad médica
        """
        
        # Document analysis tools
        self.analysis_tools = [
            {
                "type": "function",
                "function": {
                    "name": "analyze_medical_document",
                    "description": "Analyze medical document and extract key information",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "document_type": {
                                "type": "string",
                                "enum": ["historia_clinica", "laboratorio", "imagen", "consulta", "alta", "otro"],
                                "description": "Type of medical document"
                            },
                            "key_findings": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "Key medical findings from the document"
                            },
                            "diagnoses": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "diagnosis": {"type": "string"},
                                        "icd_code": {"type": "string"},
                                        "status": {"type": "string", "enum": ["active", "resolved", "suspected"]}
                                    }
                                },
                                "description": "Diagnoses mentioned in the document"
                            },
                            "medications": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "medication": {"type": "string"},
                                        "dosage": {"type": "string"},
                                        "frequency": {"type": "string"}
                                    }
                                },
                                "description": "Medications mentioned"
                            },
                            "vital_signs": {
                                "type": "object",
                                "properties": {
                                    "blood_pressure": {"type": "string"},
                                    "heart_rate": {"type": "string"},
                                    "temperature": {"type": "string"},
                                    "respiratory_rate": {"type": "string"},
                                    "oxygen_saturation": {"type": "string"}
                                },
                                "description": "Vital signs if present"
                            },
                            "lab_results": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "test": {"type": "string"},
                                        "result": {"type": "string"},
                                        "reference_range": {"type": "string"},
                                        "status": {"type": "string", "enum": ["normal", "abnormal", "critical"]}
                                    }
                                },
                                "description": "Laboratory results if present"
                            },
                            "recommendations": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "Medical recommendations or next steps"
                            },
                            "red_flags": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "Critical findings requiring immediate attention"
                            },
                            "summary": {
                                "type": "string",
                                "description": "Brief summary of the document"
                            }
                        },
                        "required": ["document_type", "key_findings", "summary"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "compare_documents",
                    "description": "Compare multiple medical documents to identify changes or trends",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "comparison_type": {
                                "type": "string",
                                "enum": ["temporal", "diagnostic", "treatment", "lab_trends"],
                                "description": "Type of comparison being performed"
                            },
                            "changes_identified": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "category": {"type": "string"},
                                        "change": {"type": "string"},
                                        "significance": {"type": "string", "enum": ["minor", "moderate", "significant", "critical"]}
                                    }
                                },
                                "description": "Changes identified between documents"
                            },
                            "trends": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "Trends observed across documents"
                            },
                            "recommendations": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "Recommendations based on comparison"
                            }
                        },
                        "required": ["comparison_type", "changes_identified"]
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
        model_type: ModelType = ModelType.GPT4O,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> ChatResponse:
        """
        Process document analysis request using GPT-4o
        
        Args:
            messages: Chat messages with document analysis request
            patient_context: Patient context and documents
            model_type: Model to use (defaults to GPT-4o)
            temperature: Sampling temperature
            max_tokens: Maximum tokens
            
        Returns:
            ChatResponse with document analysis
        """
        try:
            logger.info("📄 Processing document analysis request")
            
            # Prepare enhanced messages with document context
            enhanced_messages = await self._prepare_document_context(
                messages, patient_context
            )
            
            # Use GPT-4o for complex document analysis
            response = await self.azure_openai_service.chat_completion(
                messages=enhanced_messages,
                model_type=ModelType.GPT4O,
                tools=self.analysis_tools,
                tool_choice="auto",
                temperature=temperature or 0.1,  # Low temperature for accuracy
                max_tokens=max_tokens or 4096
            )
            
            # Enhance response with structured analysis
            if response.tool_calls:
                response = await self._enhance_analysis_response(response)
            
            logger.info("✅ Document analysis completed")
            return response
            
        except Exception as e:
            logger.error(f"❌ Document analysis failed: {str(e)}")
            raise AgentError(f"Document analysis failed: {str(e)}")
    
    async def process_stream(
        self,
        messages: List[ChatMessage],
        patient_context: Optional[Dict[str, Any]] = None,
        model_type: ModelType = ModelType.GPT4O,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> AsyncGenerator[str, None]:
        """
        Process document analysis with streaming response
        """
        try:
            logger.info("🌊 DocumentAnalysisAgent: Starting streaming document analysis")
            logger.info(f"📄 DocumentAnalysisAgent: Patient context available: {patient_context is not None}")
            
            if patient_context:
                logger.info(f"📄 DocumentAnalysisAgent: Context keys: {list(patient_context.keys())}")
                
                # Check for documents in context
                if "full_documents" in patient_context:
                    logger.info(f"📄 DocumentAnalysisAgent: Found {len(patient_context['full_documents'])} full documents")
                elif "documents" in patient_context:
                    logger.info(f"📄 DocumentAnalysisAgent: Found {len(patient_context['documents'])} legacy documents")
                else:
                    logger.warning("📄 DocumentAnalysisAgent: No documents found in context")
            
            # Prepare context
            enhanced_messages = await self._prepare_document_context(
                messages, patient_context
            )
            
            logger.info(f"📄 DocumentAnalysisAgent: Prepared {len(enhanced_messages)} enhanced messages")
            
            # Stream response
            async for chunk in self.azure_openai_service.chat_completion_stream(
                messages=enhanced_messages,
                model_type=ModelType.GPT4O,
                temperature=temperature or 0.1,
                max_tokens=max_tokens or 4096
            ):
                yield chunk
                
        except Exception as e:
            logger.error(f"❌ DocumentAnalysisAgent: Streaming failed: {str(e)}")
            yield f"Error en análisis de documento: {str(e)}"
    
    async def _prepare_document_context(
        self,
        messages: List[ChatMessage],
        patient_context: Optional[Dict[str, Any]]
    ) -> List[ChatMessage]:
        """
        Prepare enhanced messages with document context
        """
        enhanced_messages = [
            ChatMessage(role="system", content=self.system_prompt)
        ]
        
        # Add document context if available (check both 'documents' and 'full_documents')
        documents = None
        if patient_context:
            # First check for 'full_documents' (new enhanced format)
            if "full_documents" in patient_context:
                documents = patient_context["full_documents"]
            # Fallback to 'documents' (legacy format)
            elif "documents" in patient_context:
                documents = patient_context["documents"]
        
        if documents:
            document_content = self._format_documents_for_analysis(documents)
            enhanced_messages.append(
                ChatMessage(
                    role="system",
                    content=f"DOCUMENTOS MÉDICOS PARA ANÁLISIS:\\n{document_content}"
                )
            )
        
        # Add patient info context
        if patient_context and "patient_info" in patient_context:
            patient_info = self._format_patient_info(patient_context["patient_info"])
            enhanced_messages.append(
                ChatMessage(
                    role="system",
                    content=f"INFORMACIÓN DEL PACIENTE:\\n{patient_info}"
                )
            )
        
        # Add user messages
        enhanced_messages.extend(messages)
        
        return enhanced_messages
    
    def _format_documents_for_analysis(self, documents: List[Dict[str, Any]]) -> str:
        """Format documents for analysis (supports both legacy and enhanced formats)"""
        formatted_docs = []
        
        for i, doc in enumerate(documents[:5], 1):  # Limit to 5 most recent
            doc_text = f"DOCUMENTO {i}:\\n"
            
            # Handle both legacy and enhanced document formats
            doc_type = doc.get('document_type') or doc.get('type', 'N/A')
            if isinstance(doc_type, str) and '.' in doc_type:
                # Handle enum values like 'DocumentTypeEnum.GENERAL'
                doc_type = doc_type.split('.')[-1].replace('_', ' ').title()
            
            doc_text += f"Tipo: {doc_type}\\n"
            
            # Handle different date formats
            date = doc.get('created_at') or doc.get('date', 'N/A')
            doc_text += f"Fecha: {date}\\n"
            
            title = doc.get('title', 'N/A')
            doc_text += f"Título: {title}\\n"
            
            # Add additional enhanced format fields if available
            if doc.get('relevance_score'):
                doc_text += f"Relevancia: {doc['relevance_score']:.2f}\\n"
            
            if doc.get('document_id'):
                doc_text += f"ID: {doc['document_id']}\\n"
            
            content = doc.get('content', 'N/A')
            doc_text += f"Contenido:\\n{content}\\n"
            doc_text += "---\\n"
            formatted_docs.append(doc_text)
        
        return "\\n".join(formatted_docs)
    
    def _format_patient_info(self, patient_info: Dict[str, Any]) -> str:
        """Format patient information"""
        info_parts = []
        
        info_parts.append(f"Nombre: {patient_info.get('name', 'N/A')}")
        info_parts.append(f"Edad: {patient_info.get('age', 'N/A')} años")
        info_parts.append(f"Género: {patient_info.get('gender', 'N/A')}")
        
        if patient_info.get('medical_record_number'):
            info_parts.append(f"Expediente: {patient_info['medical_record_number']}")
        
        return "\\n".join(info_parts)
    
    async def _enhance_analysis_response(self, response: ChatResponse) -> ChatResponse:
        """
        Enhance analysis response with structured data from tool calls
        """
        try:
            if not response.tool_calls:
                return response
            
            enhanced_content = response.content
            
            for tool_call in response.tool_calls:
                if tool_call.function["name"] == "analyze_medical_document":
                    analysis_data = json.loads(tool_call.function["arguments"])
                    enhanced_content += self._format_document_analysis(analysis_data)
                
                elif tool_call.function["name"] == "compare_documents":
                    comparison_data = json.loads(tool_call.function["arguments"])
                    enhanced_content += self._format_document_comparison(comparison_data)
            
            response.content = enhanced_content
            return response
            
        except Exception as e:
            logger.error(f"❌ Failed to enhance analysis response: {str(e)}")
            return response
    
    def _format_document_analysis(self, data: Dict[str, Any]) -> str:
        """Format document analysis results"""
        formatted = "\\n\\n## 📄 ANÁLISIS DE DOCUMENTO\\n\\n"
        
        # Document type and summary
        doc_type = data.get('document_type', 'N/A')
        formatted += f"**Tipo de Documento:** {doc_type.replace('_', ' ').title()}\\n\\n"
        formatted += f"**Resumen:** {data.get('summary', 'N/A')}\\n\\n"
        
        # Key findings
        if data.get('key_findings'):
            formatted += "**Hallazgos Principales:**\\n"
            for finding in data['key_findings']:
                formatted += f"• {finding}\\n"
            formatted += "\\n"
        
        # Diagnoses
        if data.get('diagnoses'):
            formatted += "**Diagnósticos:**\\n"
            for dx in data['diagnoses']:
                status_emoji = {"active": "🔴", "resolved": "🟢", "suspected": "🟡"}.get(dx.get('status', ''), "")
                formatted += f"• {status_emoji} {dx.get('diagnosis', 'N/A')}"
                if dx.get('icd_code'):
                    formatted += f" ({dx['icd_code']})"
                formatted += "\\n"
            formatted += "\\n"
        
        # Medications
        if data.get('medications'):
            formatted += "**Medicamentos:**\\n"
            for med in data['medications']:
                formatted += f"• {med.get('medication', 'N/A')}"
                if med.get('dosage'):
                    formatted += f" - {med['dosage']}"
                if med.get('frequency'):
                    formatted += f" - {med['frequency']}"
                formatted += "\\n"
            formatted += "\\n"
        
        # Vital signs
        if data.get('vital_signs'):
            vitals = data['vital_signs']
            formatted += "**Signos Vitales:**\\n"
            for key, value in vitals.items():
                if value:
                    key_name = key.replace('_', ' ').title()
                    formatted += f"• {key_name}: {value}\\n"
            formatted += "\\n"
        
        # Lab results
        if data.get('lab_results'):
            formatted += "**Resultados de Laboratorio:**\\n"
            for lab in data['lab_results']:
                status_emoji = {"normal": "🟢", "abnormal": "🟡", "critical": "🔴"}.get(lab.get('status', ''), "")
                formatted += f"• {status_emoji} {lab.get('test', 'N/A')}: {lab.get('result', 'N/A')}"
                if lab.get('reference_range'):
                    formatted += f" (Ref: {lab['reference_range']})"
                formatted += "\\n"
            formatted += "\\n"
        
        # Red flags
        if data.get('red_flags'):
            formatted += "**🚨 Hallazgos Críticos:**\\n"
            for flag in data['red_flags']:
                formatted += f"• {flag}\\n"
            formatted += "\\n"
        
        # Recommendations
        if data.get('recommendations'):
            formatted += "**Recomendaciones:**\\n"
            for rec in data['recommendations']:
                formatted += f"• {rec}\\n"
            formatted += "\\n"
        
        return formatted
    
    def _format_document_comparison(self, data: Dict[str, Any]) -> str:
        """Format document comparison results"""
        formatted = "\\n\\n## 🔄 COMPARACIÓN DE DOCUMENTOS\\n\\n"
        
        comparison_type = data.get('comparison_type', 'N/A')
        formatted += f"**Tipo de Comparación:** {comparison_type.replace('_', ' ').title()}\\n\\n"
        
        # Changes identified
        if data.get('changes_identified'):
            formatted += "**Cambios Identificados:**\\n"
            for change in data['changes_identified']:
                significance = change.get('significance', 'minor')
                emoji = {"minor": "🟢", "moderate": "🟡", "significant": "🟠", "critical": "🔴"}.get(significance, "")
                formatted += f"• {emoji} **{change.get('category', 'N/A')}:** {change.get('change', 'N/A')}\\n"
            formatted += "\\n"
        
        # Trends
        if data.get('trends'):
            formatted += "**Tendencias Observadas:**\\n"
            for trend in data['trends']:
                formatted += f"• {trend}\\n"
            formatted += "\\n"
        
        # Recommendations
        if data.get('recommendations'):
            formatted += "**Recomendaciones:**\\n"
            for rec in data['recommendations']:
                formatted += f"• {rec}\\n"
            formatted += "\\n"
        
        return formatted

