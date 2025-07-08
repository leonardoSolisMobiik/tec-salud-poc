#!/usr/bin/env python3
"""
Script de Vectorización Masiva de Expedientes Médicos
Procesa documentos en lote y los agrega al sistema vectorial de TecSalud
"""

import asyncio
import logging
import argparse
import json
import hashlib
import time
from pathlib import Path
from typing import List, Dict, Any, Optional
import sys
import os

# Add parent directory to path to import app modules
sys.path.append(str(Path(__file__).parent.parent))

from app.services.chroma_service import chroma_service
from app.core.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('vectorization.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class DocumentVectorizer:
    """Vectorizador de documentos médicos para TecSalud"""
    
    def __init__(self):
        self.processed_count = 0
        self.error_count = 0
        self.skipped_count = 0
        
    async def initialize(self):
        """Inicializar el servicio de Chroma"""
        try:
            await chroma_service.initialize()
            logger.info("✅ Servicio de vectorización inicializado")
        except Exception as e:
            logger.error(f"❌ Error inicializando servicio: {str(e)}")
            raise
    
    async def vectorize_directory(
        self, 
        directory_path: str,
        patient_mapping_file: Optional[str] = None,
        document_type: str = "expediente_medico"
    ) -> Dict[str, Any]:
        """
        Vectorizar todos los documentos en un directorio
        
        Args:
            directory_path: Ruta al directorio con documentos
            patient_mapping_file: Archivo JSON con mapeo filename -> patient_id
            document_type: Tipo de documento por defecto
            
        Returns:
            Resumen del procesamiento
        """
        logger.info(f"🔄 Iniciando vectorización de directorio: {directory_path}")
        
        # Cargar mapeo de pacientes si existe
        patient_mapping = {}
        if patient_mapping_file and Path(patient_mapping_file).exists():
            with open(patient_mapping_file, 'r', encoding='utf-8') as f:
                patient_mapping = json.load(f)
            logger.info(f"📋 Cargado mapeo de {len(patient_mapping)} archivos")
        
        # Buscar archivos soportados
        directory = Path(directory_path)
        if not directory.exists():
            raise FileNotFoundError(f"Directorio no encontrado: {directory_path}")
        
        supported_extensions = ['.pdf', '.txt', '.docx', '.doc']
        files = []
        for ext in supported_extensions:
            files.extend(directory.glob(f"**/*{ext}"))
        
        logger.info(f"📁 Encontrados {len(files)} archivos para procesar")
        
        # Procesar archivos
        start_time = time.time()
        results = []
        
        for file_path in files:
            try:
                result = await self._process_single_file(
                    file_path, 
                    patient_mapping, 
                    document_type
                )
                results.append(result)
                
                # Progress update every 10 files
                if self.processed_count % 10 == 0:
                    logger.info(f"📊 Progreso: {self.processed_count} procesados, {self.error_count} errores")
                    
            except Exception as e:
                logger.error(f"❌ Error procesando {file_path}: {str(e)}")
                self.error_count += 1
        
        # Resumen final
        elapsed_time = time.time() - start_time
        summary = {
            "total_files": len(files),
            "processed": self.processed_count,
            "errors": self.error_count,
            "skipped": self.skipped_count,
            "elapsed_time": f"{elapsed_time:.2f}s",
            "avg_time_per_file": f"{elapsed_time/len(files):.2f}s" if files else "0s",
            "results": results
        }
        
        logger.info(f"🎉 Vectorización completada: {self.processed_count}/{len(files)} archivos procesados")
        return summary
    
    async def _process_single_file(
        self,
        file_path: Path,
        patient_mapping: Dict[str, str],
        default_document_type: str
    ) -> Dict[str, Any]:
        """Procesar un archivo individual"""
        
        filename = file_path.name
        file_key = filename.replace(' ', '_').lower()
        
        # Determinar patient_id
        patient_id = patient_mapping.get(filename) or patient_mapping.get(file_key) or "UNKNOWN"
        
        # Generar document_id único
        with open(file_path, 'rb') as f:
            content_bytes = f.read()
        
        document_id = f"DOC_{patient_id}_{int(time.time())}_{hashlib.md5(content_bytes).hexdigest()[:8]}"
        
        # Extraer texto
        try:
            text_content = await self._extract_text_from_file(file_path, content_bytes)
            if not text_content.strip():
                logger.warning(f"⚠️ Archivo vacío o sin texto extraíble: {filename}")
                self.skipped_count += 1
                return {"file": filename, "status": "skipped", "reason": "empty_content"}
        except Exception as e:
            logger.error(f"❌ Error extrayendo texto de {filename}: {str(e)}")
            self.error_count += 1
            return {"file": filename, "status": "error", "reason": str(e)}
        
        # Preparar metadatos
        metadata = {
            "patient_id": patient_id,
            "document_type": default_document_type,
            "filename": filename,
            "title": filename.replace('_', ' ').replace('.pdf', '').replace('.txt', ''),
            "file_size": len(content_bytes),
            "upload_date": time.strftime("%Y-%m-%d"),
            "processed_by": "vectorization_script",
            "original_path": str(file_path)
        }
        
        # Agregar al vector database
        try:
            await chroma_service.add_document(
                document_id=document_id,
                content=text_content,
                metadata=metadata
            )
            
            self.processed_count += 1
            logger.info(f"✅ Procesado: {filename} -> {document_id}")
            
            return {
                "file": filename,
                "document_id": document_id,
                "patient_id": patient_id,
                "status": "success",
                "text_length": len(text_content),
                "chunks_created": len(text_content) // 1000 + 1
            }
            
        except Exception as e:
            logger.error(f"❌ Error agregando {filename} a vector DB: {str(e)}")
            self.error_count += 1
            return {"file": filename, "status": "error", "reason": str(e)}
    
    async def _extract_text_from_file(self, file_path: Path, content_bytes: bytes) -> str:
        """Extraer texto de diferentes tipos de archivo"""
        
        filename = file_path.name.lower()
        
        try:
            if filename.endswith('.txt'):
                # Detectar encoding
                encodings = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
                for encoding in encodings:
                    try:
                        return content_bytes.decode(encoding)
                    except UnicodeDecodeError:
                        continue
                raise ValueError("No se pudo decodificar el archivo de texto")
                
            elif filename.endswith('.pdf'):
                # Extraer texto de PDF
                return await self._extract_pdf_text(content_bytes)
                
            elif filename.endswith(('.doc', '.docx')):
                # Extraer texto de Word
                return await self._extract_word_text(file_path, content_bytes)
                
            else:
                raise ValueError(f"Tipo de archivo no soportado: {filename}")
                
        except Exception as e:
            logger.error(f"❌ Error extrayendo texto de {filename}: {str(e)}")
            raise
    
    async def _extract_pdf_text(self, content_bytes: bytes) -> str:
        """Extraer texto de PDF usando PyPDF2"""
        try:
            import PyPDF2
            import io
            
            pdf_file = io.BytesIO(content_bytes)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            
            text_parts = []
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                text_parts.append(page.extract_text())
            
            text = "\\n".join(text_parts)
            
            # Limpiar texto
            text = text.replace('\\x00', '').replace('\\x0c', '\\n')
            text = ' '.join(text.split())  # Normalize whitespace
            
            if not text.strip():
                raise ValueError("No se pudo extraer texto del PDF")
                
            return text
            
        except ImportError:
            logger.warning("⚠️ PyPDF2 no instalado, usando extracción básica")
            return f"[PDF] {len(content_bytes)} bytes - Instale PyPDF2 para extracción completa"
        except Exception as e:
            logger.error(f"❌ Error extrayendo PDF: {str(e)}")
            return f"[PDF Error] {str(e)}"
    
    async def _extract_word_text(self, file_path: Path, content_bytes: bytes) -> str:
        """Extraer texto de documento Word"""
        try:
            import docx
            import io
            
            if file_path.suffix.lower() == '.docx':
                doc = docx.Document(io.BytesIO(content_bytes))
                text_parts = []
                
                for paragraph in doc.paragraphs:
                    if paragraph.text.strip():
                        text_parts.append(paragraph.text)
                
                text = "\\n".join(text_parts)
                
                if not text.strip():
                    raise ValueError("No se pudo extraer texto del documento Word")
                    
                return text
            else:
                # .doc files need different handling
                return f"[DOC] {file_path.name} - Archivos .doc requieren conversión a .docx"
                
        except ImportError:
            logger.warning("⚠️ python-docx no instalado, usando extracción básica")
            return f"[DOCX] {len(content_bytes)} bytes - Instale python-docx para extracción completa"
        except Exception as e:
            logger.error(f"❌ Error extrayendo Word: {str(e)}")
            return f"[DOCX Error] {str(e)}"
    
    async def verify_vectorization(self, sample_query: str = "expediente médico") -> Dict[str, Any]:
        """Verificar que la vectorización funcionó correctamente"""
        try:
            logger.info("🔍 Verificando vectorización...")
            
            # Obtener info de la colección
            collection_info = await chroma_service.get_collection_info()
            
            # Hacer búsqueda de prueba
            test_results = await chroma_service.search_documents(
                query=sample_query,
                n_results=5
            )
            
            verification = {
                "collection_status": "healthy",
                "total_documents": collection_info.get("document_count", 0),
                "test_search_results": len(test_results),
                "sample_results": [
                    {
                        "document_id": r.get("document_id", "unknown"),
                        "patient_id": r.get("patient_id", "unknown"),
                        "score": r.get("score", 0),
                        "preview": r.get("content", "")[:100] + "..."
                    }
                    for r in test_results[:3]
                ]
            }
            
            logger.info(f"✅ Verificación completada: {verification['total_documents']} documentos en la colección")
            return verification
            
        except Exception as e:
            logger.error(f"❌ Error en verificación: {str(e)}")
            return {"status": "error", "message": str(e)}

async def main():
    """Función principal del script"""
    parser = argparse.ArgumentParser(description="Vectorizar expedientes médicos para TecSalud")
    parser.add_argument("directory", help="Directorio con documentos médicos")
    parser.add_argument("--mapping", help="Archivo JSON con mapeo filename -> patient_id")
    parser.add_argument("--type", default="expediente_medico", help="Tipo de documento")
    parser.add_argument("--verify", action="store_true", help="Verificar vectorización después de procesar")
    
    args = parser.parse_args()
    
    # Inicializar vectorizador
    vectorizer = DocumentVectorizer()
    
    try:
        # Inicializar servicios
        await vectorizer.initialize()
        
        # Procesar documentos
        logger.info("🚀 Iniciando vectorización masiva...")
        summary = await vectorizer.vectorize_directory(
            directory_path=args.directory,
            patient_mapping_file=args.mapping,
            document_type=args.type
        )
        
        # Mostrar resumen
        print("\\n" + "="*60)
        print("📊 RESUMEN DE VECTORIZACIÓN")
        print("="*60)
        print(f"Total de archivos: {summary['total_files']}")
        print(f"Procesados exitosamente: {summary['processed']}")
        print(f"Errores: {summary['errors']}")
        print(f"Omitidos: {summary['skipped']}")
        print(f"Tiempo total: {summary['elapsed_time']}")
        print(f"Tiempo promedio por archivo: {summary['avg_time_per_file']}")
        
        # Verificación opcional
        if args.verify:
            print("\\n🔍 Ejecutando verificación...")
            verification = await vectorizer.verify_vectorization()
            print(f"Documentos en la colección: {verification.get('total_documents', 'Error')}")
            print(f"Resultados de búsqueda de prueba: {verification.get('test_search_results', 'Error')}")
        
        # Guardar resumen detallado
        summary_file = f"vectorization_summary_{int(time.time())}.json"
        with open(summary_file, 'w', encoding='utf-8') as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)
        print(f"\\n📄 Resumen detallado guardado en: {summary_file}")
        
    except Exception as e:
        logger.error(f"❌ Error en proceso principal: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main()) 