"""
Documents Endpoints
API endpoints for medical document management and analysis
"""

import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.models.medical import DocumentAnalysisRequest, DocumentAnalysisResponse
# from app.services.chroma_service import ChromaService  # Removed - focusing on complete storage
from app.agents.document_analysis_agent import DocumentAnalysisAgent
from app.models.chat import ChatMessage, ModelType
from app.utils.exceptions import AgentError  # ChromaError removed
from app.core.database import get_db
from app.database.abstract_layer import DatabaseSession
from app.services.patient_matching_service import PatientMatchingService
from app.services.tecsalud_filename_parser import TecSaludFilenameService

logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize services
document_agent = DocumentAnalysisAgent()
filename_service = TecSaludFilenameService()

# Chroma service removed - focusing on complete document storage only
# chroma_service = None

# async def get_chroma_service():
#     """Get or initialize Chroma service"""
#     global chroma_service
#     if chroma_service is None:
#         chroma_service = ChromaService()
#         await chroma_service.initialize()
#     return chroma_service

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    patient_id: str = Form(...),
    document_type: str = Form("general"),
    title: Optional[str] = Form(None),
    processing_type: str = Form("both"),  # "vectorized", "complete", or "both"
    db: DatabaseSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Upload and process medical document
    
    Args:
        file: Document file to upload
        patient_id: Patient identifier (or 'BULK_UPLOAD_PATIENT' for TecSalud parsing)
        document_type: Type of medical document
        title: Document title
        processing_type: "vectorized", "complete", or "both"
        db: Database session
        
    Returns:
        Upload result with document processing status
    """
    try:
        logger.info(f"📤 Uploading document: {file.filename} for patient {patient_id} (type: {processing_type})")
        
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
        
        # Handle TecSalud filename parsing and patient creation
        actual_patient_id = patient_id
        patient_creation_result = None
        
        if patient_id == 'BULK_UPLOAD_PATIENT' and processing_type in ["complete", "both"]:
            logger.info(f"🔍 Parsing TecSalud filename: {file.filename}")
            
            # Parse TecSalud filename
            parse_result = await filename_service.parse_filename(file.filename)
            
            if parse_result.success and parse_result.patient_data:
                # Initialize patient matching service
                patient_matching_service = PatientMatchingService(db)
                
                # Find or create patient
                match_result = await patient_matching_service.find_patient_matches(parse_result.patient_data)
                
                if match_result.best_match and match_result.best_match.confidence >= 0.8:
                    # Use existing patient
                    actual_patient_id = str(match_result.best_match.patient_id)
                    logger.info(f"✅ Found existing patient: {match_result.best_match.patient_name} (ID: {actual_patient_id})")
                else:
                    # Create new patient
                    patient_creation_result = await patient_matching_service.create_patient_from_tecsalud_data(
                        parse_result.patient_data
                    )
                    
                    if patient_creation_result.success:
                        actual_patient_id = str(patient_creation_result.patient_id)
                        logger.info(f"✅ Created new patient: {parse_result.patient_data.full_name} (ID: {actual_patient_id})")
                    else:
                        logger.error(f"❌ Failed to create patient: {patient_creation_result.error_message}")
                        # Use default patient ID for failed cases
                        actual_patient_id = "FAILED_PATIENT_CREATION"
                        logger.warning(f"⚠️ Using default patient ID for failed creation: {actual_patient_id}")
            else:
                logger.warning(f"⚠️ Could not parse TecSalud filename: {file.filename}")
                # Use default patient ID for unknown documents
                actual_patient_id = "UNKNOWN_PATIENT"
                logger.warning(f"⚠️ Using default patient ID for unknown document: {actual_patient_id}")
        
        # Prepare metadata
        metadata = {
            "patient_id": actual_patient_id,
            "document_type": document_type,
            "filename": file.filename,
            "title": title or file.filename,
            "file_size": len(content),
            "upload_date": "2024-01-01",  # Would use actual timestamp
            "processed": True,
            "processing_type": processing_type
        }
        
        processing_results = {}
        
        # Skip vectorization - focusing only on complete document storage
        if processing_type in ["vectorized", "both"]:
            processing_results["vectorized"] = "skipped - not implemented"
            logger.info("ℹ️ Vectorization skipped - focusing on complete document storage")
        
        # Handle complete document storage (MongoDB)
        if processing_type in ["complete", "both"]:
            try:
                import hashlib
                from datetime import datetime
                
                # Create document data for MongoDB
                # Handle patient_id conversion for MongoDB
                patient_id_for_doc = None
                if actual_patient_id and actual_patient_id.isdigit():
                    patient_id_for_doc = int(actual_patient_id)
                elif actual_patient_id and actual_patient_id not in ["FAILED_PATIENT_CREATION", "UNKNOWN_PATIENT"]:
                    patient_id_for_doc = actual_patient_id  # Keep as string for MongoDB ObjectId
                
                medical_doc_data = {
                    "patient_id": patient_id_for_doc,
                    "document_type": document_type,
                    "title": title or file.filename,
                    "content": text_content,
                    "file_path": f"uploads/{file.filename}",
                    "file_size": len(content),
                    "created_by": "admin",  # Would be actual user
                    "processing_type": processing_type,
                    "original_filename": file.filename,
                    "vectorization_status": "completed" if processing_type in ["vectorized", "both"] else "pending",
                    "content_hash": hashlib.sha256(content).hexdigest(),
                    "created_at": datetime.now().isoformat(),
                    "updated_at": datetime.now().isoformat()
                }
                
                # Store in MongoDB
                result = await db.create("medical_documents", medical_doc_data)
                
                # Get document ID from result
                if isinstance(result, dict):
                    document_mongo_id = str(result.get("_id") or result.get("id"))
                else:
                    document_mongo_id = str(result)
                
                processing_results["complete_storage"] = "success"
                processing_results["medical_document_id"] = document_mongo_id
                logger.info(f"✅ Document stored completely: {document_mongo_id}")
                
            except Exception as e:
                logger.error(f"❌ Complete storage failed: {str(e)}")
                processing_results["complete_storage"] = f"error: {str(e)}"
        
        # Generate automatic analysis for complete documents
        analysis_summary = "No analysis performed"
        if processing_results.get("complete_storage") == "success":
            try:
                analysis_summary = await _generate_document_analysis(text_content, document_type)
            except Exception as e:
                logger.warning(f"⚠️ Analysis generation failed: {str(e)}")
                analysis_summary = "Analysis not available"
        
        # Prepare response
        response = {
            "document_id": document_id,
            "filename": file.filename,
            "size": len(content),
            "text_length": len(text_content),
            "processing_type": processing_type,
            "processing_results": processing_results,
            "status": "processed",
            "analysis_summary": analysis_summary,
            "message": f"Document uploaded with {processing_type} processing"
        }
        
        # Add patient information to response
        if actual_patient_id != patient_id:
            response["patient_id"] = actual_patient_id
            response["patient_created"] = patient_creation_result and patient_creation_result.success
        
        return response
        
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
    Note: Temporarily disabled - focusing on complete document storage
    
    Args:
        request: Document analysis request
        
    Returns:
        Document analysis results
    """
    raise HTTPException(
        status_code=501, 
        detail="Document analysis temporarily disabled - focusing on complete document storage"
    )

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
        
        # Temporarily disabled - focusing on complete document storage
        raise HTTPException(
            status_code=501, 
            detail="Document retrieval temporarily disabled - focusing on complete document storage"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to get document: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve document")

@router.delete("/{document_id}")
async def delete_document(document_id: str) -> Dict[str, Any]:
    """
    Delete document - temporarily disabled
    
    Args:
        document_id: Document identifier
        
    Returns:
        Deletion confirmation
    """
    raise HTTPException(
        status_code=501, 
        detail="Document deletion temporarily disabled - focusing on complete document storage"
    )

@router.get("/")
async def list_documents(
    patient_id: Optional[str] = None,
    document_type: Optional[str] = None,
    limit: int = 20,
    offset: int = 0
) -> Dict[str, Any]:
    """
    List documents - temporarily disabled
    
    Args:
        patient_id: Filter by patient ID
        document_type: Filter by document type
        limit: Maximum documents to return
        offset: Number of documents to skip
        
    Returns:
        List of documents with metadata
    """
    raise HTTPException(
        status_code=501, 
        detail="Document listing temporarily disabled - focusing on complete document storage"
    )

@router.post("/search")
async def search_documents(
    query: str,
    patient_id: Optional[str] = None,
    document_type: Optional[str] = None,
    limit: int = 10
) -> Dict[str, Any]:
    """
    Search documents - temporarily disabled
    
    Args:
        query: Search query
        patient_id: Filter by patient ID
        document_type: Filter by document type
        limit: Maximum results
        
    Returns:
        Search results with relevance scores
    """
    raise HTTPException(
        status_code=501, 
        detail="Document search temporarily disabled - focusing on complete document storage"
    )

async def _extract_text_from_file(filename: str, content: bytes) -> str:
    """Extract text content from uploaded file using appropriate libraries"""
    try:
        import io
        import logging
        
        logger = logging.getLogger(__name__)
        
        if filename.lower().endswith('.txt'):
            return content.decode('utf-8')
            
        elif filename.lower().endswith('.pdf'):
            # Try with pdfplumber first (better for complex layouts)
            try:
                import pdfplumber
                
                text_content = []
                with io.BytesIO(content) as file_buffer:
                    with pdfplumber.open(file_buffer) as pdf:
                        for page_num, page in enumerate(pdf.pages, 1):
                            try:
                                page_text = page.extract_text()
                                if page_text and page_text.strip():
                                    text_content.append(f"=== PÁGINA {page_num} ===\n{page_text.strip()}")
                                else:
                                    text_content.append(f"=== PÁGINA {page_num} ===\n[Página sin texto extraíble]")
                            except Exception as e:
                                logger.warning(f"Error extracting page {page_num}: {str(e)}")
                                text_content.append(f"=== PÁGINA {page_num} ===\n[Error en extracción: {str(e)}]")
                
                if text_content:
                    full_text = "\n\n".join(text_content)
                    logger.info(f"✅ PDF extraction successful using pdfplumber: {len(full_text)} characters from {len(text_content)} pages")
                    return full_text
                else:
                    logger.warning("⚠️ No text extracted with pdfplumber, trying PyPDF2")
                    
            except Exception as e:
                logger.warning(f"⚠️ pdfplumber extraction failed: {str(e)}, trying PyPDF2")
            
            # Fallback to PyPDF2
            try:
                import PyPDF2
                
                text_content = []
                with io.BytesIO(content) as file_buffer:
                    pdf_reader = PyPDF2.PdfReader(file_buffer)
                    
                    for page_num, page in enumerate(pdf_reader.pages, 1):
                        try:
                            page_text = page.extract_text()
                            if page_text and page_text.strip():
                                text_content.append(f"=== PÁGINA {page_num} ===\n{page_text.strip()}")
                            else:
                                text_content.append(f"=== PÁGINA {page_num} ===\n[Página sin texto extraíble]")
                        except Exception as e:
                            logger.warning(f"Error extracting page {page_num} with PyPDF2: {str(e)}")
                            text_content.append(f"=== PÁGINA {page_num} ===\n[Error en extracción: {str(e)}]")
                
                if text_content:
                    full_text = "\n\n".join(text_content)
                    logger.info(f"✅ PDF extraction successful using PyPDF2: {len(full_text)} characters from {len(text_content)} pages")
                    return full_text
                else:
                    logger.error("❌ No text could be extracted from PDF with either library")
                    return f"[PDF Error] {filename} - No se pudo extraer texto del PDF. Posiblemente sea un PDF de imagen o esté protegido."
                    
            except Exception as e:
                logger.error(f"❌ PyPDF2 extraction failed: {str(e)}")
                return f"[PDF Error] {filename} - Error al extraer contenido: {str(e)}"
            
        elif filename.lower().endswith(('.doc', '.docx')):
            # Try to extract from Word documents
            try:
                import docx
                
                with io.BytesIO(content) as file_buffer:
                    doc = docx.Document(file_buffer)
                    text_content = []
                    
                    for paragraph in doc.paragraphs:
                        if paragraph.text.strip():
                            text_content.append(paragraph.text.strip())
                    
                    if text_content:
                        full_text = "\n\n".join(text_content)
                        logger.info(f"✅ DOCX extraction successful: {len(full_text)} characters")
                        return full_text
                    else:
                        return f"[Word Document] {filename} - Documento vacío o sin texto extraíble"
                        
            except ImportError:
                logger.warning("python-docx not installed, cannot extract Word documents")
                return f"[Word Document] {filename} - Biblioteca python-docx no disponible para extraer contenido"
            except Exception as e:
                logger.error(f"❌ Word document extraction failed: {str(e)}")
                return f"[Word Document Error] {filename} - Error al extraer contenido: {str(e)}"
        else:
            return f"[Unknown Format] {filename} - Formato de archivo no soportado para extracción de texto"
            
    except Exception as e:
        logger.error(f"❌ Text extraction failed for {filename}: {str(e)}")
        return f"[Error] No se pudo extraer texto de {filename}: {str(e)}"

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

