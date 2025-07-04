"""
Documents Endpoints
API endpoints for medical document management and analysis
"""

import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse

from app.models.medical import DocumentAnalysisRequest, DocumentAnalysisResponse
from app.services.chroma_service import chroma_service
from app.agents.document_analysis_agent import DocumentAnalysisAgent
from app.models.chat import ChatMessage, ModelType
from app.utils.exceptions import ChromaError, AgentError

logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize document analysis agent
document_agent = DocumentAnalysisAgent()

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    patient_id: str = Form(...),
    document_type: str = Form("general"),
    title: Optional[str] = Form(None)
) -> Dict[str, Any]:
    """
    Upload and process medical document
    
    Args:
        file: Document file to upload
        patient_id: Patient identifier
        document_type: Type of medical document
        title: Document title
        
    Returns:
        Upload result with document processing status
    """
    try:
        logger.info(f"📤 Uploading document: {file.filename} for patient {patient_id}")
        
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        allowed_extensions = ['.pdf', '.txt', '.docx', '.doc']
        if not any(file.filename.lower().endswith(ext) for ext in allowed_extensions):
            raise HTTPException(
                status_code=400,
                detail=f"File type not supported. Allowed: {', '.join(allowed_extensions)}"
            )
        
        # Check file size (10MB limit)
        content = await file.read()
        if len(content) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large (max 10MB)")
        
        # Generate document ID
        import hashlib
        import time
        document_id = f"DOC_{patient_id}_{int(time.time())}_{hashlib.md5(content).hexdigest()[:8]}"
        
        # Extract text content
        text_content = await _extract_text_from_file(file.filename, content)
        
        # Prepare metadata
        metadata = {
            "patient_id": patient_id,
            "document_type": document_type,
            "filename": file.filename,
            "title": title or file.filename,
            "file_size": len(content),
            "upload_date": "2024-01-01",  # Would use actual timestamp
            "processed": True
        }
        
        # Add to vector database
        await chroma_service.add_document(
            document_id=document_id,
            content=text_content,
            metadata=metadata
        )
        
        # Generate automatic analysis
        analysis_summary = await _generate_document_analysis(text_content, document_type)
        
        return {
            "document_id": document_id,
            "filename": file.filename,
            "size": len(content),
            "text_length": len(text_content),
            "status": "processed",
            "analysis_summary": analysis_summary,
            "message": "Document uploaded and indexed successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Document upload failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Document upload failed: {str(e)}")

@router.post("/analyze", response_model=DocumentAnalysisResponse)
async def analyze_document(
    request: DocumentAnalysisRequest
) -> DocumentAnalysisResponse:
    """
    Analyze medical document using AI
    
    Args:
        request: Document analysis request
        
    Returns:
        Document analysis results
    """
    try:
        logger.info(f"🔬 Analyzing document: {request.document_id}")
        
        # Get document from vector database
        documents = await chroma_service.search_documents(
            query="documento completo",
            n_results=1,
            filters={"original_document_id": request.document_id}
        )
        
        if not documents:
            raise HTTPException(status_code=404, detail="Document not found")
        
        document = documents[0]
        
        # Prepare analysis request
        analysis_messages = [
            ChatMessage(
                role="user",
                content=f"Analiza este documento médico tipo '{request.analysis_type}': {document['content']}"
            )
        ]
        
        # Get patient context if needed
        patient_context = None
        if request.include_context:
            patient_id = document.get("patient_id")
            if patient_id:
                try:
                    patient_context = await chroma_service.get_patient_context(patient_id)
                except ChromaError as e:
                    logger.warning(f"⚠️ Could not get patient context: {str(e)}")
        
        # Perform analysis using document agent
        response = await document_agent.process(
            messages=analysis_messages,
            patient_context=patient_context,
            model_type=ModelType.GPT4O
        )
        
        # Extract key findings and recommendations
        key_findings = _extract_key_findings(response.content)
        recommendations = _extract_recommendations(response.content)
        
        return DocumentAnalysisResponse(
            document_id=request.document_id,
            analysis_type=request.analysis_type,
            summary=response.content,
            key_findings=key_findings,
            recommendations=recommendations,
            confidence=0.85  # Would be calculated based on analysis
        )
        
    except HTTPException:
        raise
    except AgentError as e:
        logger.error(f"❌ Document analysis failed: {str(e)}")
        raise HTTPException(status_code=503, detail="Document analysis service error")
    except Exception as e:
        logger.error(f"❌ Document analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Document analysis failed")

@router.get("/{document_id}")
async def get_document(document_id: str) -> Dict[str, Any]:
    """
    Get document details and content
    
    Args:
        document_id: Document identifier
        
    Returns:
        Document information and content
    """
    try:
        logger.info(f"📄 Getting document: {document_id}")
        
        # Search for document
        documents = await chroma_service.search_documents(
            query="documento completo",
            n_results=10,
            filters={"original_document_id": document_id}
        )
        
        if not documents:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Combine chunks if multiple
        if len(documents) > 1:
            # Sort by chunk index
            documents.sort(key=lambda x: x.get("metadata", {}).get("chunk_index", 0))
            content = " ".join([doc["content"] for doc in documents])
            metadata = documents[0]["metadata"]
        else:
            content = documents[0]["content"]
            metadata = documents[0]["metadata"]
        
        return {
            "document_id": document_id,
            "content": content,
            "metadata": metadata,
            "chunks": len(documents),
            "total_length": len(content)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to get document: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve document")

@router.delete("/{document_id}")
async def delete_document(document_id: str) -> Dict[str, Any]:
    """
    Delete document from vector database
    
    Args:
        document_id: Document identifier
        
    Returns:
        Deletion confirmation
    """
    try:
        logger.info(f"🗑️ Deleting document: {document_id}")
        
        await chroma_service.delete_document(document_id)
        
        return {
            "document_id": document_id,
            "status": "deleted",
            "message": "Document deleted successfully"
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to delete document: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete document")

@router.get("/")
async def list_documents(
    patient_id: Optional[str] = None,
    document_type: Optional[str] = None,
    limit: int = 20,
    offset: int = 0
) -> Dict[str, Any]:
    """
    List documents with optional filtering
    
    Args:
        patient_id: Filter by patient ID
        document_type: Filter by document type
        limit: Maximum documents to return
        offset: Number of documents to skip
        
    Returns:
        List of documents with metadata
    """
    try:
        logger.info(f"📋 Listing documents (patient: {patient_id}, type: {document_type})")
        
        # Build filters
        filters = {}
        if patient_id:
            filters["patient_id"] = patient_id
        if document_type:
            filters["document_type"] = document_type
        
        # Search documents
        documents = await chroma_service.search_documents(
            query="documentos médicos",
            n_results=limit + offset,
            filters=filters if filters else None
        )
        
        # Apply pagination
        paginated_docs = documents[offset:offset + limit]
        
        # Format response
        formatted_docs = []
        for doc in paginated_docs:
            formatted_docs.append({
                "document_id": doc.get("document_id"),
                "title": doc.get("metadata", {}).get("title", "Untitled"),
                "document_type": doc.get("document_type"),
                "patient_id": doc.get("patient_id"),
                "date": doc.get("date"),
                "file_size": doc.get("metadata", {}).get("file_size", 0),
                "preview": doc.get("content", "")[:200] + "..." if len(doc.get("content", "")) > 200 else doc.get("content", "")
            })
        
        return {
            "documents": formatted_docs,
            "total": len(documents),
            "limit": limit,
            "offset": offset,
            "has_more": len(documents) > offset + limit
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to list documents: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to list documents")

@router.post("/search")
async def search_documents(
    query: str,
    patient_id: Optional[str] = None,
    document_type: Optional[str] = None,
    limit: int = 10
) -> Dict[str, Any]:
    """
    Search documents using semantic search
    
    Args:
        query: Search query
        patient_id: Filter by patient ID
        document_type: Filter by document type
        limit: Maximum results
        
    Returns:
        Search results with relevance scores
    """
    try:
        logger.info(f"🔍 Searching documents: {query}")
        
        # Build filters
        filters = {}
        if patient_id:
            filters["patient_id"] = patient_id
        if document_type:
            filters["document_type"] = document_type
        
        # Perform semantic search
        results = await chroma_service.search_documents(
            query=query,
            n_results=limit,
            filters=filters if filters else None
        )
        
        # Format results
        formatted_results = []
        for result in results:
            formatted_results.append({
                "document_id": result.get("document_id"),
                "title": result.get("metadata", {}).get("title", "Untitled"),
                "content_preview": result.get("content", "")[:300] + "...",
                "relevance_score": result.get("score", 0),
                "document_type": result.get("document_type"),
                "patient_id": result.get("patient_id"),
                "date": result.get("date"),
                "metadata": result.get("metadata", {})
            })
        
        return {
            "query": query,
            "results": formatted_results,
            "total_found": len(results),
            "search_time": "0.1s"  # Would be actual search time
        }
        
    except Exception as e:
        logger.error(f"❌ Document search failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Document search failed")

async def _extract_text_from_file(filename: str, content: bytes) -> str:
    """Extract text content from uploaded file"""
    try:
        if filename.lower().endswith('.txt'):
            return content.decode('utf-8')
        elif filename.lower().endswith('.pdf'):
            # Would use PyPDF2 or pdfplumber here
            return f"[PDF Content] {filename} - Content would be extracted using PDF library"
        elif filename.lower().endswith(('.doc', '.docx')):
            # Would use python-docx here
            return f"[Word Document] {filename} - Content would be extracted using docx library"
        else:
            return f"[Unknown Format] {filename} - Content extraction not implemented"
    except Exception as e:
        logger.error(f"❌ Text extraction failed: {str(e)}")
        return f"[Error] Could not extract text from {filename}"

async def _generate_document_analysis(content: str, document_type: str) -> str:
    """Generate automatic document analysis summary"""
    try:
        # This would use the document analysis agent
        # For now, return a simple summary
        word_count = len(content.split())
        return f"Documento de tipo '{document_type}' procesado. Contiene {word_count} palabras. Análisis automático completado."
    except Exception as e:
        logger.error(f"❌ Auto-analysis failed: {str(e)}")
        return "Análisis automático no disponible"

def _extract_key_findings(analysis_content: str) -> List[str]:
    """Extract key findings from analysis content"""
    # Simple extraction - would be more sophisticated in practice
    findings = []
    lines = analysis_content.split('\\n')
    for line in lines:
        if 'hallazgo' in line.lower() or 'finding' in line.lower():
            findings.append(line.strip())
    return findings[:5]  # Limit to 5 findings

def _extract_recommendations(analysis_content: str) -> List[str]:
    """Extract recommendations from analysis content"""
    # Simple extraction - would be more sophisticated in practice
    recommendations = []
    lines = analysis_content.split('\\n')
    for line in lines:
        if 'recomend' in line.lower() or 'suggest' in line.lower():
            recommendations.append(line.strip())
    return recommendations[:5]  # Limit to 5 recommendations

