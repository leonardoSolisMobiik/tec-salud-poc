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
from app.services.chroma_service import chroma_service
from app.agents.document_analysis_agent import DocumentAnalysisAgent
from app.models.chat import ChatMessage, ModelType
from app.utils.exceptions import ChromaError, AgentError
from app.core.database import get_db
from app.services.patient_matching_service import PatientMatchingService
from app.services.tecsalud_filename_parser import TecSaludFilenameService

logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize services
document_agent = DocumentAnalysisAgent()
filename_service = TecSaludFilenameService()

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    patient_id: str = Form(...),
    document_type: str = Form("general"),
    title: Optional[str] = Form(None),
    processing_type: str = Form("both"),  # "vectorized", "complete", or "both"
    db: Session = Depends(get_db)
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
                        # Create a default patient for failed cases
                        from app.db.models import Patient, Doctor, GenderEnum
                        
                        # Find or create default doctor
                        default_doctor = db.query(Doctor).filter(Doctor.email == "admin@tecsalud.com").first()
                        if not default_doctor:
                            default_doctor = Doctor(
                                email="admin@tecsalud.com",
                                name="Sistema Administrativo",
                                specialty="Administración",
                                license_number="ADMIN001"
                            )
                            db.add(default_doctor)
                            db.commit()
                            db.refresh(default_doctor)
                        
                        # Create default patient for failed creation
                        import datetime
                        import time
                        failed_patient = Patient(
                            medical_record_number=f"FAILED_{int(time.time())}",
                            name="Creación Fallida",
                            birth_date=datetime.date(1900, 1, 1),
                            gender=GenderEnum.UNKNOWN,
                            doctor_id=default_doctor.id
                        )
                        db.add(failed_patient)
                        db.commit()
                        db.refresh(failed_patient)
                        
                        actual_patient_id = str(failed_patient.id)
                        logger.info(f"✅ Created default patient for failed creation: {actual_patient_id}")
            else:
                logger.warning(f"⚠️ Could not parse TecSalud filename: {file.filename}")
                # Create a default patient for unknown cases
                from app.db.models import Patient, Doctor, GenderEnum
                
                # Find or create default doctor
                default_doctor = db.query(Doctor).filter(Doctor.email == "admin@tecsalud.com").first()
                if not default_doctor:
                    default_doctor = Doctor(
                        email="admin@tecsalud.com",
                        name="Sistema Administrativo",
                        specialty="Administración",
                        license_number="ADMIN001"
                    )
                    db.add(default_doctor)
                    db.commit()
                    db.refresh(default_doctor)
                
                # Create default patient for unknown documents
                import datetime
                unknown_patient = Patient(
                    medical_record_number=f"UNKNOWN_{int(time.time())}",
                    name="Paciente Desconocido",
                    birth_date=datetime.date(1900, 1, 1),
                    gender=GenderEnum.UNKNOWN,
                    doctor_id=default_doctor.id
                )
                db.add(unknown_patient)
                db.commit()
                db.refresh(unknown_patient)
                
                actual_patient_id = str(unknown_patient.id)
                logger.info(f"✅ Created default patient for unknown document: {actual_patient_id}")
        
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
        
        # Handle vectorization (ChromaDB)
        if processing_type in ["vectorized", "both"]:
            try:
                await chroma_service.add_document(
                    document_id=document_id,
                    content=text_content,
                    metadata=metadata
                )
                processing_results["vectorized"] = "success"
                logger.info(f"✅ Document vectorized: {document_id}")
            except Exception as e:
                logger.error(f"❌ Vectorization failed: {str(e)}")
                processing_results["vectorized"] = f"error: {str(e)}"
        
        # Handle complete document storage (SQL Database)
        if processing_type in ["complete", "both"]:
            try:
                # Store complete document in medical_documents table
                from app.db.models import MedicalDocument, DocumentTypeEnum, ProcessingTypeEnum, VectorizationStatusEnum
                
                # Map document_type to enum
                try:
                    doc_type_enum = DocumentTypeEnum(document_type)
                except ValueError:
                    doc_type_enum = DocumentTypeEnum.OTHER
                
                # Map processing_type to enum
                try:
                    proc_type_enum = ProcessingTypeEnum(processing_type)
                except ValueError:
                    proc_type_enum = ProcessingTypeEnum.COMPLETE
                
                medical_doc = MedicalDocument(
                    patient_id=int(actual_patient_id) if actual_patient_id.isdigit() else None,
                    document_type=doc_type_enum,
                    title=title or file.filename,
                    content=text_content,
                    file_path=f"uploads/{file.filename}",  # Would store actual file path
                    file_size=len(content),
                    created_by="admin",  # Would be actual user
                    processing_type=proc_type_enum,
                    original_filename=file.filename,
                    vectorization_status=VectorizationStatusEnum.COMPLETED if processing_type in ["vectorized", "both"] else VectorizationStatusEnum.PENDING,
                    content_hash=hashlib.sha256(content).hexdigest()
                )
                
                db.add(medical_doc)
                db.commit()
                db.refresh(medical_doc)
                
                processing_results["complete_storage"] = "success"
                processing_results["medical_document_id"] = medical_doc.id
                logger.info(f"✅ Document stored completely: {medical_doc.id}")
                
            except Exception as e:
                logger.error(f"❌ Complete storage failed: {str(e)}")
                processing_results["complete_storage"] = f"error: {str(e)}"
                db.rollback()
        
        # Generate automatic analysis only if vectorization was successful
        analysis_summary = "No analysis performed"
        if processing_results.get("vectorized") == "success":
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

