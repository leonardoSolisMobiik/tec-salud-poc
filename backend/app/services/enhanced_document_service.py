#!/usr/bin/env python3
"""
Enhanced Document Service for TecSalud Medical Chat
Provides complete document context for medical consultations
"""

import logging
from typing import List, Dict, Any, Optional, Union
from enum import Enum
from datetime import datetime, timedelta
from dataclasses import dataclass

from app.database.abstract_layer import DatabaseSession
from app.services.tecsalud_filename_parser import DocumentTypeEnum

# Local enums for document processing
class ProcessingTypeEnum(str, Enum):
    """Document processing types"""
    COMPLETE = "complete"
    VECTORIZED = "vectorized"  
    BOTH = "both"

# ChromaDB removed - using only complete documents
from app.services.azure_openai_service import AzureOpenAIService
from app.utils.exceptions import DocumentError

logger = logging.getLogger(__name__)

class ContextStrategy(str, Enum):
    """Strategies for selecting document context"""
    FULL_DOCS_ONLY = "full_docs_only"      # Use only complete documents (default)
    RECENT_DOCS = "recent_docs"            # Prioritize recent documents
    CRITICAL_DOCS = "critical_docs"        # Prioritize critical documents

class DocumentRelevance(str, Enum):
    """Document relevance levels"""
    CRITICAL = "critical"       # Highly relevant (score > 0.8)
    HIGH = "high"              # Relevant (score > 0.6)
    MEDIUM = "medium"          # Moderately relevant (score > 0.4)
    LOW = "low"               # Low relevance (score > 0.2)
    MINIMAL = "minimal"       # Minimal relevance (score <= 0.2)

@dataclass
class DocumentContext:
    """Complete document context information"""
    document_id: Union[int, str]
    patient_id: Union[int, str]
    title: str
    content: str
    document_type: DocumentTypeEnum
    created_at: datetime
    processing_type: ProcessingTypeEnum
    relevance_score: float
    relevance_level: DocumentRelevance
    source: str  # 'mongodb', 'recent', 'critical'
    summary: Optional[str] = None
    key_points: Optional[List[str]] = None

@dataclass
class DocumentsContext:
    """Document context from complete medical records"""
    patient_id: Union[int, str]
    strategy_used: ContextStrategy
    full_documents: List[DocumentContext]
    total_documents: int
    total_tokens: int
    context_summary: str
    recommendations: List[str]
    confidence: float
    processing_time_ms: float

class EnhancedDocumentService:
    """Enhanced document service providing complete medical document context"""
    
    def __init__(self):
        self.azure_openai_service = AzureOpenAIService()
        self.max_context_tokens = 32000  # Conservative token limit
        self.max_documents = 10  # Maximum documents per request
        
    async def _ensure_azure_openai_initialized(self):
        """Ensure Azure OpenAI service is initialized"""
        if not self.azure_openai_service.is_initialized:
            await self.azure_openai_service.initialize()

    async def get_enhanced_patient_context(
        self,
        patient_id: Union[int, str],
        query: str,
        strategy: ContextStrategy = ContextStrategy.FULL_DOCS_ONLY,
        db: DatabaseSession = None,
        max_documents: Optional[int] = None,
        include_recent: bool = True,
        include_critical: bool = True
    ) -> DocumentsContext:
        """
        Get enhanced patient context using complete documents only
        
        Args:
            patient_id: Patient ID
            query: User query for context relevance
            strategy: Context retrieval strategy
            db: Database session
            max_documents: Maximum documents to include
            include_recent: Include recent documents
            include_critical: Include critical documents
            
        Returns:
            DocumentsContext with complete medical records
        """
        start_time = datetime.now()
        
        try:
            # Ensure Azure OpenAI service is initialized
            await self._ensure_azure_openai_initialized()
            
            logger.info(f"🔍 Getting documents context for patient {patient_id} with strategy {strategy}")
            
            # Initialize collections
            full_documents = []
            total_tokens = 0
            
            # Get patient info using MongoDB abstraction
            if db:
                patient = await db.get_by_id("patients", str(patient_id))
                if not patient:
                    raise DocumentError(f"Patient not found: {patient_id}")
            else:
                patient = {"id": patient_id, "name": "Unknown Patient"}
            
            # Get medical documents from MongoDB for the patient
            if db:
                try:
                    # Get all medical documents for this patient
                    documents = await db.find_many("medical_documents", {"patient_id": str(patient_id)})
                    logger.info(f"🔍 Found {len(documents)} medical documents for patient {patient_id}")
                    
                    # Convert MongoDB documents to DocumentContext objects
                    for doc in documents:
                        doc_context = DocumentContext(
                            document_id=str(doc.get("_id", doc.get("id", "unknown"))),
                            patient_id=str(patient_id),
                            title=doc.get("title", "Documento Médico"),
                            content=doc.get("content", ""),
                            document_type=DocumentTypeEnum.OTHER,  # Default type
                            created_at=datetime.now(),  # Use current time as fallback
                            processing_type=ProcessingTypeEnum.COMPLETE,
                            relevance_score=0.8,  # Default high relevance
                            relevance_level=DocumentRelevance.HIGH,
                            source="mongodb"
                        )
                        full_documents.append(doc_context)
                        
                except Exception as e:
                    logger.error(f"❌ Error retrieving medical documents: {e}")
                    full_documents = []
            
            # Apply strategy-specific logic
            if strategy == ContextStrategy.RECENT_DOCS:
                # Sort by most recent
                full_documents = sorted(full_documents, key=lambda x: x.created_at, reverse=True)
                logger.info(f"📅 Using recent documents strategy: {len(full_documents)} documents")
            elif strategy == ContextStrategy.CRITICAL_DOCS:
                # Sort by relevance score
                full_documents = sorted(full_documents, key=lambda x: x.relevance_score, reverse=True)
                logger.info(f"🚨 Using critical documents strategy: {len(full_documents)} documents")
            else:
                # Default: all documents
                logger.info(f"📋 Using all documents: {len(full_documents)} documents")
            
            # Apply document limit
            if max_documents:
                full_documents = full_documents[:max_documents]
            else:
                full_documents = full_documents[:self.max_documents]
            
            # Calculate tokens and apply limits
            total_tokens = sum(len(doc.content) for doc in full_documents)
            if total_tokens > self.max_context_tokens:
                # Truncate documents to fit within token limit
                truncated_docs = []
                current_tokens = 0
                for doc in full_documents:
                    if current_tokens + len(doc.content) <= self.max_context_tokens:
                        truncated_docs.append(doc)
                        current_tokens += len(doc.content)
                    else:
                        break
                full_documents = truncated_docs
                total_tokens = current_tokens
            
            # Generate comprehensive summary and recommendations
            context_summary = f"Retrieved {len(full_documents)} complete medical documents for patient {patient.get('name', 'Unknown')}. Total content: {total_tokens} tokens."
            
            recommendations = []
            if full_documents:
                recommendations.append(f"Found {len(full_documents)} complete medical documents")
                recommendations.append("Full patient medical history available")
                recommendations.append("Complete document context available for diagnosis")
            else:
                recommendations.append("No medical documents found for this patient")
                recommendations.append("Consider creating patient medical record")
                
            confidence = 0.9 if full_documents else 0.3
            
            processing_time = (datetime.now() - start_time).total_seconds() * 1000
            
            result = DocumentsContext(
                patient_id=patient_id,
                strategy_used=strategy,
                full_documents=full_documents,
                total_documents=len(full_documents),
                total_tokens=total_tokens,
                context_summary=context_summary,
                recommendations=recommendations,
                confidence=confidence,
                processing_time_ms=processing_time
            )
            
            logger.info(f"✅ Documents context retrieved: {len(full_documents)} documents, {total_tokens} tokens")
            return result
            
        except Exception as e:
            logger.error(f"❌ Failed to get documents context: {str(e)}")
            raise DocumentError(f"Documents context retrieval failed: {str(e)}")

# Global service instance
enhanced_document_service = EnhancedDocumentService() 