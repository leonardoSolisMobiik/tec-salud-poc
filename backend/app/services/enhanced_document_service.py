#!/usr/bin/env python3
"""
Enhanced Document Service for TecSalud Medical Chat
Provides hybrid context combining semantic vectors with complete documents
"""

import logging
from typing import List, Dict, Any, Optional, Union
from enum import Enum
from datetime import datetime, timedelta
from dataclasses import dataclass

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc

from app.core.database import get_db
from app.db.models import MedicalDocument, Patient, ProcessingTypeEnum, VectorizationStatusEnum, DocumentTypeEnum
from app.services.chroma_service import chroma_service
from app.services.azure_openai_service import AzureOpenAIService
from app.utils.exceptions import DocumentError

logger = logging.getLogger(__name__)

class ContextStrategy(str, Enum):
    """Strategies for selecting document context"""
    VECTORS_ONLY = "vectors_only"           # Use only semantic vectors
    FULL_DOCS_ONLY = "full_docs_only"      # Use only complete documents  
    HYBRID_SMART = "hybrid_smart"          # Smart combination of both
    HYBRID_PRIORITY_VECTORS = "hybrid_priority_vectors"    # Vectors first, docs as backup
    HYBRID_PRIORITY_FULL = "hybrid_priority_full"          # Full docs first, vectors as enhancement

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
    document_id: int
    patient_id: int
    title: str
    content: str
    document_type: DocumentTypeEnum
    created_at: datetime
    processing_type: ProcessingTypeEnum
    relevance_score: float
    relevance_level: DocumentRelevance
    source: str  # 'vector_search', 'full_document', 'recent', 'critical'
    summary: Optional[str] = None
    key_points: Optional[List[str]] = None

@dataclass
class HybridContext:
    """Combined context from multiple sources"""
    patient_id: int
    strategy_used: ContextStrategy
    vector_results: List[Dict[str, Any]]
    full_documents: List[DocumentContext]
    total_documents: int
    total_tokens: int
    context_summary: str
    recommendations: List[str]
    confidence: float
    processing_time_ms: float

class EnhancedDocumentService:
    """
    Enhanced service that provides hybrid document context for medical chat
    Combines semantic vectors with complete documents for optimal context
    """
    
    def __init__(self):
        self.azure_openai_service = AzureOpenAIService()
        self.max_full_documents = 5      # Maximum full documents to include
        self.max_vector_results = 20     # Maximum vector search results
        self.max_context_tokens = 32000  # Maximum total context tokens
        self.recent_documents_days = 30  # Consider documents from last N days as recent
        
    async def get_enhanced_patient_context(
        self,
        patient_id: int,
        query: str,
        strategy: ContextStrategy = ContextStrategy.HYBRID_SMART,
        db: Session = None,
        max_documents: Optional[int] = None,
        include_recent: bool = True,
        include_critical: bool = True
    ) -> HybridContext:
        """
        Get enhanced patient context using hybrid approach
        
        Args:
            patient_id: Patient ID
            query: User query for context relevance
            strategy: Context retrieval strategy
            db: Database session
            max_documents: Maximum documents to include
            include_recent: Include recent documents
            include_critical: Include critical documents
            
        Returns:
            HybridContext with combined information
        """
        start_time = datetime.now()
        
        try:
            logger.info(f"🔍 Getting enhanced context for patient {patient_id} with strategy {strategy}")
            
            # Initialize collections
            vector_results = []
            full_documents = []
            total_tokens = 0
            
            # Get patient info
            patient = db.query(Patient).filter(Patient.id == patient_id).first()
            if not patient:
                raise DocumentError(f"Patient not found: {patient_id}")
            
            # Apply strategy-specific logic
            if strategy == ContextStrategy.VECTORS_ONLY:
                vector_results = await self._get_vector_context(patient_id, query)
                
            elif strategy == ContextStrategy.FULL_DOCS_ONLY:
                full_documents = await self._get_full_document_context(
                    patient_id, query, db, max_documents or self.max_full_documents
                )
                
            elif strategy == ContextStrategy.HYBRID_SMART:
                # Smart hybrid: analyze query to determine best approach
                vector_results, full_documents = await self._get_smart_hybrid_context(
                    patient_id, query, db, max_documents
                )
                
            elif strategy == ContextStrategy.HYBRID_PRIORITY_VECTORS:
                # Vectors first, then complement with full docs
                vector_results = await self._get_vector_context(patient_id, query)
                if len(vector_results) < 5:  # If few vector results, add full docs
                    full_documents = await self._get_complementary_full_docs(
                        patient_id, query, db, vector_results, max_documents or 3
                    )
                    
            elif strategy == ContextStrategy.HYBRID_PRIORITY_FULL:
                # Full docs first, then enhance with vectors
                full_documents = await self._get_full_document_context(
                    patient_id, query, db, max_documents or 3
                )
                vector_results = await self._get_complementary_vectors(
                    patient_id, query, full_documents
                )
            
            # Add recent and critical documents if requested
            if include_recent:
                recent_docs = await self._get_recent_documents(patient_id, db, exclude_ids=[d.document_id for d in full_documents])
                full_documents.extend(recent_docs[:2])  # Add up to 2 recent docs
                
            if include_critical:
                critical_docs = await self._get_critical_documents(patient_id, query, db, exclude_ids=[d.document_id for d in full_documents])
                full_documents.extend(critical_docs[:1])  # Add up to 1 critical doc
            
            # Calculate total tokens and truncate if necessary
            total_tokens = self._calculate_context_tokens(vector_results, full_documents)
            if total_tokens > self.max_context_tokens:
                vector_results, full_documents = await self._optimize_context_size(
                    vector_results, full_documents, self.max_context_tokens
                )
                total_tokens = self._calculate_context_tokens(vector_results, full_documents)
            
            # Generate context summary
            context_summary = await self._generate_context_summary(
                patient, vector_results, full_documents, query
            )
            
            # Generate recommendations
            recommendations = await self._generate_context_recommendations(
                vector_results, full_documents, query
            )
            
            # Calculate confidence score
            confidence = self._calculate_context_confidence(vector_results, full_documents)
            
            processing_time = (datetime.now() - start_time).total_seconds() * 1000
            
            result = HybridContext(
                patient_id=patient_id,
                strategy_used=strategy,
                vector_results=vector_results,
                full_documents=full_documents,
                total_documents=len(vector_results) + len(full_documents),
                total_tokens=total_tokens,
                context_summary=context_summary,
                recommendations=recommendations,
                confidence=confidence,
                processing_time_ms=processing_time
            )
            
            logger.info(f"✅ Enhanced context retrieved: {len(full_documents)} full docs, {len(vector_results)} vector results, {total_tokens} tokens")
            return result
            
        except Exception as e:
            logger.error(f"❌ Failed to get enhanced context: {str(e)}")
            raise DocumentError(f"Enhanced context retrieval failed: {str(e)}")
    
    async def _get_vector_context(self, patient_id: int, query: str) -> List[Dict[str, Any]]:
        """Get context using semantic vector search"""
        try:
            if not chroma_service.is_initialized:
                await chroma_service.initialize()
                
            results = await chroma_service.search_documents(
                query=query,
                n_results=self.max_vector_results,
                filters={"patient_id": str(patient_id)}
            )
            
            logger.info(f"🎯 Vector search returned {len(results)} results")
            return results
            
        except Exception as e:
            logger.error(f"❌ Vector context retrieval failed: {str(e)}")
            return []
    
    async def _get_full_document_context(
        self, 
        patient_id: int, 
        query: str, 
        db: Session, 
        max_docs: int
    ) -> List[DocumentContext]:
        """Get full document context from database"""
        try:
            # Query for complete documents
            documents = db.query(MedicalDocument).filter(
                and_(
                    MedicalDocument.patient_id == patient_id,
                    or_(
                        MedicalDocument.processing_type == ProcessingTypeEnum.COMPLETE,
                        MedicalDocument.processing_type == ProcessingTypeEnum.BOTH
                    )
                )
            ).order_by(desc(MedicalDocument.created_at)).limit(max_docs * 2).all()  # Get more to score and filter
            
            # Score documents for relevance to query
            scored_documents = []
            for doc in documents:
                relevance_score = await self._calculate_document_relevance(doc, query)
                relevance_level = self._get_relevance_level(relevance_score)
                
                doc_context = DocumentContext(
                    document_id=doc.id,
                    patient_id=doc.patient_id,
                    title=doc.title,
                    content=doc.content,
                    document_type=doc.document_type,
                    created_at=doc.created_at,
                    processing_type=doc.processing_type,
                    relevance_score=relevance_score,
                    relevance_level=relevance_level,
                    source="full_document"
                )
                scored_documents.append(doc_context)
            
            # Sort by relevance and take top documents
            scored_documents.sort(key=lambda x: x.relevance_score, reverse=True)
            result = scored_documents[:max_docs]
            
            # Generate summaries for long documents
            for doc_context in result:
                if len(doc_context.content) > 2000:  # Summarize long documents
                    doc_context.summary = await self._generate_document_summary(doc_context.content, query)
                    doc_context.key_points = await self._extract_key_points(doc_context.content, query)
            
            logger.info(f"📋 Retrieved {len(result)} full documents")
            return result
            
        except Exception as e:
            logger.error(f"❌ Full document context retrieval failed: {str(e)}")
            return []
    
    async def _get_smart_hybrid_context(
        self, 
        patient_id: int, 
        query: str, 
        db: Session, 
        max_docs: Optional[int]
    ) -> tuple[List[Dict[str, Any]], List[DocumentContext]]:
        """Smart hybrid approach - analyze query to determine optimal mix"""
        try:
            # Analyze query to determine context needs
            query_analysis = await self._analyze_query_context_needs(query)
            
            vector_results = []
            full_documents = []
            
            if query_analysis["needs_specific_details"]:
                # For specific details, prioritize full documents
                full_documents = await self._get_full_document_context(
                    patient_id, query, db, max_docs or 4
                )
                vector_results = await self._get_vector_context(patient_id, query)
                vector_results = vector_results[:10]  # Limit vector results
                
            elif query_analysis["needs_broad_overview"]:
                # For broad overview, prioritize vectors with some full docs
                vector_results = await self._get_vector_context(patient_id, query)
                full_documents = await self._get_full_document_context(
                    patient_id, query, db, max_docs or 2
                )
                
            else:
                # Balanced approach
                vector_results = await self._get_vector_context(patient_id, query)
                vector_results = vector_results[:15]  # Moderate vector results
                full_documents = await self._get_full_document_context(
                    patient_id, query, db, max_docs or 3
                )
            
            logger.info(f"🧠 Smart hybrid: {len(full_documents)} full docs, {len(vector_results)} vectors")
            return vector_results, full_documents
            
        except Exception as e:
            logger.error(f"❌ Smart hybrid context failed: {str(e)}")
            # Fallback to basic hybrid
            vector_results = await self._get_vector_context(patient_id, query)
            full_documents = await self._get_full_document_context(patient_id, query, db, 2)
            return vector_results[:10], full_documents
    
    async def _get_recent_documents(
        self, 
        patient_id: int, 
        db: Session, 
        exclude_ids: List[int] = None
    ) -> List[DocumentContext]:
        """Get recent documents for additional context"""
        try:
            cutoff_date = datetime.now() - timedelta(days=self.recent_documents_days)
            
            query_filter = and_(
                MedicalDocument.patient_id == patient_id,
                MedicalDocument.created_at >= cutoff_date
            )
            
            if exclude_ids:
                query_filter = and_(query_filter, ~MedicalDocument.id.in_(exclude_ids))
            
            documents = db.query(MedicalDocument).filter(query_filter).order_by(
                desc(MedicalDocument.created_at)
            ).limit(3).all()
            
            result = []
            for doc in documents:
                doc_context = DocumentContext(
                    document_id=doc.id,
                    patient_id=doc.patient_id,
                    title=doc.title,
                    content=doc.content[:1000] + "..." if len(doc.content) > 1000 else doc.content,  # Truncate for recent docs
                    document_type=doc.document_type,
                    created_at=doc.created_at,
                    processing_type=doc.processing_type,
                    relevance_score=0.7,  # Moderate relevance for recent docs
                    relevance_level=DocumentRelevance.MEDIUM,
                    source="recent"
                )
                result.append(doc_context)
            
            logger.info(f"📅 Retrieved {len(result)} recent documents")
            return result
            
        except Exception as e:
            logger.error(f"❌ Recent documents retrieval failed: {str(e)}")
            return []
    
    async def _get_critical_documents(
        self, 
        patient_id: int, 
        query: str, 
        db: Session, 
        exclude_ids: List[int] = None
    ) -> List[DocumentContext]:
        """Get critical documents (emergency, surgery, etc.)"""
        try:
            critical_types = [
                DocumentTypeEnum.EMERGENCY,
                DocumentTypeEnum.SURGERY,
                DocumentTypeEnum.DISCHARGE
            ]
            
            query_filter = and_(
                MedicalDocument.patient_id == patient_id,
                MedicalDocument.document_type.in_(critical_types)
            )
            
            if exclude_ids:
                query_filter = and_(query_filter, ~MedicalDocument.id.in_(exclude_ids))
            
            documents = db.query(MedicalDocument).filter(query_filter).order_by(
                desc(MedicalDocument.created_at)
            ).limit(2).all()
            
            result = []
            for doc in documents:
                doc_context = DocumentContext(
                    document_id=doc.id,
                    patient_id=doc.patient_id,
                    title=doc.title,
                    content=doc.content,
                    document_type=doc.document_type,
                    created_at=doc.created_at,
                    processing_type=doc.processing_type,
                    relevance_score=0.9,  # High relevance for critical docs
                    relevance_level=DocumentRelevance.CRITICAL,
                    source="critical"
                )
                result.append(doc_context)
            
            logger.info(f"🚨 Retrieved {len(result)} critical documents")
            return result
            
        except Exception as e:
            logger.error(f"❌ Critical documents retrieval failed: {str(e)}")
            return []
    
    async def _calculate_document_relevance(self, document: MedicalDocument, query: str) -> float:
        """Calculate document relevance to query using AI"""
        try:
            # Use AI to score relevance
            prompt = f"""Analyze how relevant this medical document is to the query.
            
Query: {query}

Document Title: {document.title}
Document Type: {document.document_type}
Document Content (first 500 chars): {document.content[:500]}

Rate relevance from 0.0 to 1.0:
- 1.0: Directly answers the query
- 0.8: Highly relevant 
- 0.6: Moderately relevant
- 0.4: Somewhat relevant
- 0.2: Minimally relevant
- 0.0: Not relevant

Return only the score as a number."""

            response = await self.azure_openai_service.chat_completion(
                messages=[{"role": "user", "content": prompt}],
                model_type="gpt-4o-mini",
                temperature=0.1,
                max_tokens=50
            )
            
            # Extract score
            score_text = response.content.strip()
            try:
                score = float(score_text)
                return max(0.0, min(1.0, score))  # Clamp to 0-1 range
            except ValueError:
                return 0.5  # Default score if parsing fails
                
        except Exception as e:
            logger.error(f"❌ Document relevance calculation failed: {str(e)}")
            return 0.5  # Default moderate relevance
    
    def _get_relevance_level(self, score: float) -> DocumentRelevance:
        """Convert relevance score to level"""
        if score > 0.8:
            return DocumentRelevance.CRITICAL
        elif score > 0.6:
            return DocumentRelevance.HIGH
        elif score > 0.4:
            return DocumentRelevance.MEDIUM
        elif score > 0.2:
            return DocumentRelevance.LOW
        else:
            return DocumentRelevance.MINIMAL
    
    async def _analyze_query_context_needs(self, query: str) -> Dict[str, bool]:
        """Analyze query to determine what type of context is needed"""
        try:
            prompt = f"""Analyze this medical query to determine context needs:

Query: {query}

Determine:
1. needs_specific_details: Does this query need specific, detailed information from complete documents?
2. needs_broad_overview: Does this query need a broad overview from multiple sources?
3. is_urgent: Is this an urgent medical query?
4. is_diagnostic: Is this a diagnostic query?

Return as JSON with boolean values."""

            response = await self.azure_openai_service.chat_completion(
                messages=[{"role": "user", "content": prompt}],
                model_type="gpt-4o-mini",
                temperature=0.1,
                max_tokens=200
            )
            
            import json
            try:
                analysis = json.loads(response.content)
                return analysis
            except json.JSONDecodeError:
                return {"needs_specific_details": False, "needs_broad_overview": True, "is_urgent": False, "is_diagnostic": False}
                
        except Exception as e:
            logger.error(f"❌ Query analysis failed: {str(e)}")
            return {"needs_specific_details": False, "needs_broad_overview": True, "is_urgent": False, "is_diagnostic": False}
    
    def _calculate_context_tokens(self, vector_results: List[Dict], full_documents: List[DocumentContext]) -> int:
        """Estimate total tokens in context"""
        total_chars = 0
        
        for result in vector_results:
            total_chars += len(result.get("content", ""))
        
        for doc in full_documents:
            if doc.summary:
                total_chars += len(doc.summary)
            else:
                total_chars += len(doc.content)
        
        # Rough estimation: 4 characters per token
        return total_chars // 4
    
    async def _optimize_context_size(
        self, 
        vector_results: List[Dict], 
        full_documents: List[DocumentContext], 
        max_tokens: int
    ) -> tuple[List[Dict], List[DocumentContext]]:
        """Optimize context size to fit within token limits"""
        try:
            # Priority: keep highest relevance items
            
            # Sort vector results by score
            vector_results = sorted(vector_results, key=lambda x: x.get("score", 0), reverse=True)
            
            # Sort full documents by relevance
            full_documents = sorted(full_documents, key=lambda x: x.relevance_score, reverse=True)
            
            current_tokens = 0
            optimized_vectors = []
            optimized_docs = []
            
            # Add critical and high relevance full documents first
            for doc in full_documents:
                if doc.relevance_level in [DocumentRelevance.CRITICAL, DocumentRelevance.HIGH]:
                    doc_tokens = len(doc.summary or doc.content) // 4
                    if current_tokens + doc_tokens <= max_tokens:
                        optimized_docs.append(doc)
                        current_tokens += doc_tokens
            
            # Add high-score vector results
            for result in vector_results:
                if result.get("score", 0) > 0.7:
                    result_tokens = len(result.get("content", "")) // 4
                    if current_tokens + result_tokens <= max_tokens:
                        optimized_vectors.append(result)
                        current_tokens += result_tokens
            
            # Fill remaining space with medium relevance items
            for doc in full_documents:
                if doc not in optimized_docs and doc.relevance_level == DocumentRelevance.MEDIUM:
                    doc_tokens = len(doc.summary or doc.content) // 4
                    if current_tokens + doc_tokens <= max_tokens:
                        optimized_docs.append(doc)
                        current_tokens += doc_tokens
            
            logger.info(f"🎯 Optimized context: {len(optimized_docs)} docs, {len(optimized_vectors)} vectors, ~{current_tokens} tokens")
            return optimized_vectors, optimized_docs
            
        except Exception as e:
            logger.error(f"❌ Context optimization failed: {str(e)}")
            # Return truncated versions as fallback
            return vector_results[:5], full_documents[:2]
    
    async def _generate_context_summary(
        self, 
        patient: Patient, 
        vector_results: List[Dict], 
        full_documents: List[DocumentContext], 
        query: str
    ) -> str:
        """Generate a summary of the retrieved context"""
        try:
            doc_types = [doc.document_type.value for doc in full_documents]
            vector_count = len(vector_results)
            doc_count = len(full_documents)
            
            summary = f"Context for {patient.name}: Retrieved {doc_count} complete documents ({', '.join(set(doc_types))}) and {vector_count} semantic search results relevant to: '{query}'"
            
            return summary
            
        except Exception as e:
            logger.error(f"❌ Context summary generation failed: {str(e)}")
            return f"Context retrieved for patient {patient.name if patient else 'Unknown'}"
    
    async def _generate_context_recommendations(
        self, 
        vector_results: List[Dict], 
        full_documents: List[DocumentContext], 
        query: str
    ) -> List[str]:
        """Generate recommendations for using the context"""
        recommendations = []
        
        if len(full_documents) > 3:
            recommendations.append("Consider focusing on the most recent and relevant documents")
        
        if any(doc.relevance_level == DocumentRelevance.CRITICAL for doc in full_documents):
            recommendations.append("Critical documents found - pay special attention to emergency/surgery records")
        
        if len(vector_results) > 15:
            recommendations.append("Large number of semantic matches - consider refining query for specificity")
        
        if not full_documents and vector_results:
            recommendations.append("Only semantic matches found - consider processing documents as complete for better context")
        
        return recommendations
    
    def _calculate_context_confidence(
        self, 
        vector_results: List[Dict], 
        full_documents: List[DocumentContext]
    ) -> float:
        """Calculate confidence in the retrieved context"""
        if not vector_results and not full_documents:
            return 0.0
        
        # Factor in number and quality of results
        doc_score = sum(doc.relevance_score for doc in full_documents) / max(len(full_documents), 1)
        vector_score = sum(result.get("score", 0) for result in vector_results) / max(len(vector_results), 1)
        
        # Weight full documents higher
        confidence = (doc_score * 0.7 + vector_score * 0.3)
        
        # Boost confidence if we have both types
        if full_documents and vector_results:
            confidence *= 1.1
        
        return min(confidence, 1.0)
    
    async def _generate_document_summary(self, content: str, query: str) -> str:
        """Generate a summary of a document focused on the query"""
        try:
            prompt = f"""Summarize this medical document focusing on information relevant to: "{query}"

Document content (first 1500 chars):
{content[:1500]}

Provide a concise summary (max 200 words) highlighting the most relevant information."""

            response = await self.azure_openai_service.chat_completion(
                messages=[{"role": "user", "content": prompt}],
                model_type="gpt-4o-mini",
                temperature=0.1,
                max_tokens=300
            )
            
            return response.content
            
        except Exception as e:
            logger.error(f"❌ Document summary generation failed: {str(e)}")
            return content[:500] + "..." if len(content) > 500 else content
    
    async def _extract_key_points(self, content: str, query: str) -> List[str]:
        """Extract key points from document content"""
        try:
            prompt = f"""Extract 3-5 key points from this medical document that are relevant to: "{query}"

Document content:
{content[:1000]}

Return as a simple list of key points."""

            response = await self.azure_openai_service.chat_completion(
                messages=[{"role": "user", "content": prompt}],
                model_type="gpt-4o-mini",
                temperature=0.1,
                max_tokens=200
            )
            
            # Parse response into list
            points = [point.strip() for point in response.content.split('\n') if point.strip() and not point.strip().startswith('#')]
            return points[:5]  # Limit to 5 points
            
        except Exception as e:
            logger.error(f"❌ Key points extraction failed: {str(e)}")
            return []
    
    async def _get_complementary_full_docs(
        self, 
        patient_id: int, 
        query: str, 
        db: Session, 
        vector_results: List[Dict], 
        max_docs: int
    ) -> List[DocumentContext]:
        """Get full documents that complement vector results"""
        # Get document IDs that are already covered by vectors
        covered_doc_ids = set()
        for result in vector_results:
            doc_id = result.get("document_id")
            if doc_id and doc_id != "unknown":
                try:
                    covered_doc_ids.add(int(doc_id))
                except ValueError:
                    pass
        
        # Get full documents not covered by vectors
        documents = db.query(MedicalDocument).filter(
            and_(
                MedicalDocument.patient_id == patient_id,
                or_(
                    MedicalDocument.processing_type == ProcessingTypeEnum.COMPLETE,
                    MedicalDocument.processing_type == ProcessingTypeEnum.BOTH
                ),
                ~MedicalDocument.id.in_(covered_doc_ids) if covered_doc_ids else True
            )
        ).order_by(desc(MedicalDocument.created_at)).limit(max_docs).all()
        
        result = []
        for doc in documents:
            doc_context = DocumentContext(
                document_id=doc.id,
                patient_id=doc.patient_id,
                title=doc.title,
                content=doc.content,
                document_type=doc.document_type,
                created_at=doc.created_at,
                processing_type=doc.processing_type,
                relevance_score=0.6,  # Moderate relevance as complement
                relevance_level=DocumentRelevance.MEDIUM,
                source="complementary_full"
            )
            result.append(doc_context)
        
        return result
    
    async def _get_complementary_vectors(
        self, 
        patient_id: int, 
        query: str, 
        full_documents: List[DocumentContext]
    ) -> List[Dict[str, Any]]:
        """Get vector results that complement full documents"""
        try:
            # Get all vector results first
            all_vectors = await self._get_vector_context(patient_id, query)
            
            # Filter out vectors from documents we already have complete
            full_doc_ids = {doc.document_id for doc in full_documents}
            
            complementary_vectors = []
            for result in all_vectors:
                doc_id = result.get("document_id")
                if doc_id and doc_id != "unknown":
                    try:
                        if int(doc_id) not in full_doc_ids:
                            complementary_vectors.append(result)
                    except ValueError:
                        complementary_vectors.append(result)  # Include if can't parse ID
                else:
                    complementary_vectors.append(result)
            
            return complementary_vectors[:10]  # Limit complementary vectors
            
        except Exception as e:
            logger.error(f"❌ Complementary vectors retrieval failed: {str(e)}")
            return []

# Global service instance
enhanced_document_service = EnhancedDocumentService() 