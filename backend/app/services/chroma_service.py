"""
Chroma Service
Vector database service for semantic search in medical documents
"""

import logging
import asyncio
from typing import List, Dict, Any, Optional
from pathlib import Path
import chromadb
from chromadb.config import Settings
from chromadb.utils import embedding_functions

from app.core.config import settings
from app.services.azure_openai_service import azure_openai_service
from app.utils.exceptions import ChromaError

logger = logging.getLogger(__name__)

class ChromaService:
    """
    Service for managing Chroma vector database operations
    Handles document storage, embedding generation, and semantic search
    """
    
    def __init__(self):
        self.client: Optional[chromadb.Client] = None
        self.collection = None
        self.is_initialized = False
        self.embedding_function = None
    
    async def initialize(self) -> None:
        """Initialize Chroma client and collection"""
        try:
            # Create persist directory if it doesn't exist
            persist_dir = Path(settings.CHROMA_PERSIST_DIRECTORY)
            persist_dir.mkdir(parents=True, exist_ok=True)
            
            # Initialize Chroma client with persistence
            self.client = chromadb.PersistentClient(
                path=str(persist_dir),
                settings=Settings(
                    anonymized_telemetry=False,
                    allow_reset=True
                )
            )
            
            # Create custom embedding function using Azure OpenAI
            self.embedding_function = AzureOpenAIEmbeddingFunction()
            
            # Get or create collection
            try:
                # First try to get existing collection without embedding function
                self.collection = self.client.get_collection(
                    name=settings.CHROMA_COLLECTION_NAME
                )
                logger.info(f"📚 Loaded existing collection: {settings.CHROMA_COLLECTION_NAME}")
            except Exception:
                try:
                    self.collection = self.client.create_collection(
                        name=settings.CHROMA_COLLECTION_NAME,
                        embedding_function=self.embedding_function,
                        metadata={"description": "TecSalud medical documents collection"}
                    )
                    logger.info(f"📚 Created new collection: {settings.CHROMA_COLLECTION_NAME}")
                except Exception as create_error:
                    # If collection exists but with different embedding, delete and recreate
                    try:
                        self.client.delete_collection(name=settings.CHROMA_COLLECTION_NAME)
                        self.collection = self.client.create_collection(
                            name=settings.CHROMA_COLLECTION_NAME,
                            embedding_function=self.embedding_function,
                            metadata={"description": "TecSalud medical documents collection"}
                        )
                        logger.info(f"📚 Recreated collection: {settings.CHROMA_COLLECTION_NAME}")
                    except Exception as final_error:
                        raise create_error
            
            self.is_initialized = True
            logger.info("✅ Chroma service initialized successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize Chroma service: {str(e)}")
            raise ChromaError(f"Failed to initialize Chroma: {str(e)}")
    
    async def add_document(
        self,
        document_id: str,
        content: str,
        metadata: Dict[str, Any]
    ) -> None:
        """
        Add a document to the vector database
        
        Args:
            document_id: Unique document identifier
            content: Document text content
            metadata: Document metadata (patient_id, type, date, etc.)
        """
        if not self.is_initialized:
            raise ChromaError("Chroma service not initialized")
        
        try:
            # Chunk document if it's too long
            chunks = self._chunk_document(content)
            
            # Prepare data for insertion
            ids = []
            documents = []
            metadatas = []
            
            for i, chunk in enumerate(chunks):
                chunk_id = f"{document_id}_chunk_{i}" if len(chunks) > 1 else document_id
                ids.append(chunk_id)
                documents.append(chunk)
                
                # Add chunk metadata
                chunk_metadata = metadata.copy()
                chunk_metadata.update({
                    "chunk_index": i,
                    "total_chunks": len(chunks),
                    "original_document_id": document_id
                })
                metadatas.append(chunk_metadata)
            
            # Add to collection
            self.collection.add(
                ids=ids,
                documents=documents,
                metadatas=metadatas
            )
            
            logger.info(f"📄 Added document {document_id} with {len(chunks)} chunks")
            
        except Exception as e:
            logger.error(f"❌ Failed to add document {document_id}: {str(e)}")
            raise ChromaError(f"Failed to add document: {str(e)}")
    
    async def search_documents(
        self,
        query: str,
        n_results: int = 10,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Search documents using semantic similarity
        
        Args:
            query: Search query
            n_results: Number of results to return
            filters: Metadata filters
            
        Returns:
            List of search results with content and metadata
        """
        if not self.is_initialized:
            raise ChromaError("Chroma service not initialized")
        
        try:
            # Prepare where clause for filtering
            where_clause = None
            if filters:
                where_clause = self._build_where_clause(filters)
            
            # Perform search
            results = self.collection.query(
                query_texts=[query],
                n_results=n_results,
                where=where_clause,
                include=["documents", "metadatas", "distances"]
            )
            
            # Format results
            formatted_results = []
            if results["documents"] and results["documents"][0]:
                for i in range(len(results["documents"][0])):
                    result = {
                        "content": results["documents"][0][i],
                        "metadata": results["metadatas"][0][i],
                        "score": 1 - results["distances"][0][i],  # Convert distance to similarity
                        "document_id": results["metadatas"][0][i].get("original_document_id", "unknown"),
                        "document_type": results["metadatas"][0][i].get("document_type", "unknown"),
                        "date": results["metadatas"][0][i].get("date", "unknown"),
                        "patient_id": results["metadatas"][0][i].get("patient_id", "unknown")
                    }
                    formatted_results.append(result)
            
            logger.info(f"🔍 Search returned {len(formatted_results)} results for: {query[:50]}...")
            return formatted_results
            
        except Exception as e:
            logger.error(f"❌ Search failed: {str(e)}")
            raise ChromaError(f"Search failed: {str(e)}")
    
    async def get_patient_context(self, patient_id: str) -> Dict[str, Any]:
        """
        Get comprehensive patient context from vector database
        
        Args:
            patient_id: Patient identifier
            
        Returns:
            Patient context with documents and metadata
        """
        if not self.is_initialized:
            raise ChromaError("Chroma service not initialized")
            
        try:
            # Search for all documents for this patient
            results = await self.search_documents(
                query="historial médico completo",
                n_results=50,
                filters={"patient_id": patient_id}
            )
            
            # Organize results by document type
            context = {
                "patient_id": patient_id,
                "documents": results,
                "document_types": {},
                "recent_visits": [],
                "medical_history": {
                    "allergies": [],
                    "medications": [],
                    "conditions": []
                }
            }
            
            # Group by document type
            for result in results:
                doc_type = result.get("document_type", "unknown")
                if doc_type not in context["document_types"]:
                    context["document_types"][doc_type] = []
                context["document_types"][doc_type].append(result)
            
            # Extract key information from documents
            context = await self._extract_patient_info_from_documents(context)
            
            logger.info(f"📋 Retrieved context for patient {patient_id}: {len(results)} documents")
            return context
            
        except Exception as e:
            logger.error(f"❌ Failed to get patient context: {str(e)}")
            raise ChromaError(f"Failed to get patient context: {str(e)}")
    
    async def get_collection_info(self) -> Dict[str, Any]:
        """Get information about the collection"""
        if not self.is_initialized:
            raise ChromaError("Chroma service not initialized")
        
        try:
            count = self.collection.count()
            return {
                "name": settings.CHROMA_COLLECTION_NAME,
                "document_count": count,
                "status": "healthy"
            }
        except Exception as e:
            logger.error(f"❌ Failed to get collection info: {str(e)}")
            raise ChromaError(f"Failed to get collection info: {str(e)}")
    
    async def delete_document(self, document_id: str) -> None:
        """Delete a document and all its chunks"""
        if not self.is_initialized:
            raise ChromaError("Chroma service not initialized")
        
        try:
            # Find all chunks for this document
            results = self.collection.get(
                where={"original_document_id": document_id}
            )
            
            if results["ids"]:
                self.collection.delete(ids=results["ids"])
                logger.info(f"🗑️ Deleted document {document_id} and {len(results['ids'])} chunks")
            
        except Exception as e:
            logger.error(f"❌ Failed to delete document {document_id}: {str(e)}")
            raise ChromaError(f"Failed to delete document: {str(e)}")
    
    def _chunk_document(self, content: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
        """
        Split document into overlapping chunks for better search
        
        Args:
            content: Document content
            chunk_size: Maximum chunk size in characters
            overlap: Overlap between chunks
            
        Returns:
            List of text chunks
        """
        if len(content) <= chunk_size:
            return [content]
        
        chunks = []
        start = 0
        
        while start < len(content):
            end = start + chunk_size
            
            # Try to break at sentence boundary
            if end < len(content):
                # Look for sentence endings
                for i in range(end, max(start + chunk_size // 2, end - 100), -1):
                    if content[i] in '.!?\\n':
                        end = i + 1
                        break
            
            chunk = content[start:end].strip()
            if chunk:
                chunks.append(chunk)
            
            start = end - overlap
            if start >= len(content):
                break
        
        return chunks
    
    def _build_where_clause(self, filters: Dict[str, Any]) -> Dict[str, Any]:
        """Build Chroma where clause from filters"""
        where_clause = {}
        
        for key, value in filters.items():
            if value is not None:
                where_clause[key] = value
        
        return where_clause if where_clause else None
    
    async def _extract_patient_info_from_documents(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Extract structured patient information from documents using AI"""
        try:
            # This would use AI to extract structured information
            # For now, return basic structure
            return context
            
        except Exception as e:
            logger.error(f"❌ Failed to extract patient info: {str(e)}")
            return context
    
    async def close(self) -> None:
        """Close Chroma client"""
        if self.client:
            # Chroma client doesn't need explicit closing
            self.is_initialized = False
            logger.info("🔒 Chroma service closed")

class AzureOpenAIEmbeddingFunction:
    """Custom embedding function using Azure OpenAI"""
    
    def __call__(self, input: List[str]) -> List[List[float]]:
        """Generate embeddings for input texts"""
        try:
            # Use asyncio to call the async embedding function
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # If we're in an async context, we need to handle this differently
                # For now, we'll use a simple approach
                import nest_asyncio
                nest_asyncio.apply()
            
            embeddings = loop.run_until_complete(
                azure_openai_service.generate_embeddings(input)
            )
            return embeddings
            
        except Exception as e:
            logger.error(f"❌ Embedding generation failed: {str(e)}")
            # Return zero embeddings as fallback
            return [[0.0] * 1536 for _ in input]  # text-embedding-3-large dimension

# Global service instance
chroma_service = ChromaService()

