#!/usr/bin/env python3
"""
Script de Inicialización de Colecciones ChromaDB
Inicializa y gestiona las colecciones de vector database para TecSalud
"""

import asyncio
import logging
import argparse
import sys
from pathlib import Path
from typing import Dict, Any, Optional

# Add parent directory to path to import app modules
sys.path.append(str(Path(__file__).parent.parent))

from app.services.chroma_service import ChromaService
from app.core.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('chroma_init.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class ChromaInitializer:
    """Inicializador de colecciones ChromaDB"""
    
    def __init__(self):
        self.chroma_service = ChromaService()
        
    async def initialize_service(self):
        """Inicializar el servicio ChromaDB"""
        try:
            await self.chroma_service.initialize()
            logger.info("✅ Servicio ChromaDB inicializado correctamente")
            return True
        except Exception as e:
            logger.error(f"❌ Error inicializando ChromaDB: {str(e)}")
            return False
    
    async def create_collection(self, collection_name: str, recreate: bool = False) -> bool:
        """
        Crear una nueva colección
        
        Args:
            collection_name: Nombre de la colección
            recreate: Si True, elimina la colección existente antes de crear
            
        Returns:
            True si la colección fue creada exitosamente
        """
        try:
            # Verificar si la colección existe
            existing_collections = await self.list_collections()
            collection_exists = collection_name in existing_collections
            
            if collection_exists and not recreate:
                logger.info(f"📚 Colección '{collection_name}' ya existe")
                return True
            
            # Eliminar colección existente si se requiere recrear
            if collection_exists and recreate:
                logger.info(f"🗑️ Eliminando colección existente: {collection_name}")
                await self.delete_collection(collection_name)
            
            # Crear nueva colección
            logger.info(f"🏗️ Creando colección: {collection_name}")
            
            # Usar el servicio para crear la colección
            if hasattr(self.chroma_service, 'client') and self.chroma_service.client:
                self.chroma_service.client.create_collection(
                    name=collection_name,
                    embedding_function=self.chroma_service.embedding_function,
                    metadata={"description": f"TecSalud medical documents collection - {collection_name}"}
                )
                logger.info(f"✅ Colección '{collection_name}' creada exitosamente")
                return True
            else:
                logger.error("❌ Cliente ChromaDB no disponible")
                return False
                
        except Exception as e:
            logger.error(f"❌ Error creando colección '{collection_name}': {str(e)}")
            return False
    
    async def list_collections(self) -> list:
        """Listar todas las colecciones disponibles"""
        try:
            if hasattr(self.chroma_service, 'client') and self.chroma_service.client:
                collections = self.chroma_service.client.list_collections()
                collection_names = [col.name for col in collections]
                return collection_names
            else:
                logger.error("❌ Cliente ChromaDB no disponible")
                return []
        except Exception as e:
            logger.error(f"❌ Error listando colecciones: {str(e)}")
            return []
    
    async def get_collection_info(self, collection_name: str) -> Optional[Dict[str, Any]]:
        """Obtener información detallada de una colección"""
        try:
            if hasattr(self.chroma_service, 'client') and self.chroma_service.client:
                collection = self.chroma_service.client.get_collection(collection_name)
                
                # Obtener estadísticas
                count = collection.count()
                
                info = {
                    "name": collection_name,
                    "document_count": count,
                    "metadata": collection.metadata if hasattr(collection, 'metadata') else {},
                    "embedding_function": str(type(collection._embedding_function).__name__) if hasattr(collection, '_embedding_function') else "Unknown"
                }
                
                return info
            else:
                logger.error("❌ Cliente ChromaDB no disponible")
                return None
                
        except Exception as e:
            logger.error(f"❌ Error obteniendo info de colección '{collection_name}': {str(e)}")
            return None
    
    async def delete_collection(self, collection_name: str) -> bool:
        """Eliminar una colección"""
        try:
            if hasattr(self.chroma_service, 'client') and self.chroma_service.client:
                self.chroma_service.client.delete_collection(collection_name)
                logger.info(f"🗑️ Colección '{collection_name}' eliminada")
                return True
            else:
                logger.error("❌ Cliente ChromaDB no disponible")
                return False
        except Exception as e:
            logger.error(f"❌ Error eliminando colección '{collection_name}': {str(e)}")
            return False
    
    async def verify_collections(self) -> Dict[str, Any]:
        """Verificar el estado de todas las colecciones"""
        logger.info("🔍 Verificando estado de colecciones...")
        
        collections = await self.list_collections()
        verification_results = {
            "total_collections": len(collections),
            "collections": {},
            "status": "healthy"
        }
        
        for collection_name in collections:
            info = await self.get_collection_info(collection_name)
            if info:
                verification_results["collections"][collection_name] = info
                logger.info(f"📊 {collection_name}: {info['document_count']} documentos")
            else:
                verification_results["status"] = "issues_found"
                logger.warning(f"⚠️ No se pudo obtener información de: {collection_name}")
        
        return verification_results
    
    async def initialize_default_collections(self, recreate: bool = False):
        """Inicializar las colecciones por defecto de TecSalud"""
        logger.info("🚀 Inicializando colecciones por defecto...")
        
        # Colecciones por defecto
        default_collections = [
            settings.CHROMA_COLLECTION_NAME,  # expedientes_medicos
            "laboratorios_clinicos",
            "imagenes_medicas",
            "consultas_medicas",
            "documentos_administrativos"
        ]
        
        results = {}
        
        for collection_name in default_collections:
            success = await self.create_collection(collection_name, recreate)
            results[collection_name] = "creada" if success else "error"
        
        # Mostrar resumen
        logger.info("📋 Resumen de inicialización:")
        for collection_name, status in results.items():
            if status == "creada":
                logger.info(f"✅ {collection_name}: {status}")
            else:
                logger.error(f"❌ {collection_name}: {status}")
        
        return results

async def main():
    """Función principal del script"""
    parser = argparse.ArgumentParser(description="Inicializar colecciones ChromaDB para TecSalud")
    parser.add_argument("--action", choices=["init", "list", "info", "delete", "verify", "recreate"], 
                       default="init", help="Acción a ejecutar")
    parser.add_argument("--collection", help="Nombre de la colección específica")
    parser.add_argument("--recreate", action="store_true", help="Recrear colecciones existentes")
    
    args = parser.parse_args()
    
    # Inicializar el servicio
    initializer = ChromaInitializer()
    
    if not await initializer.initialize_service():
        logger.error("❌ No se pudo inicializar el servicio ChromaDB")
        sys.exit(1)
    
    try:
        if args.action == "init":
            # Inicializar colecciones por defecto
            await initializer.initialize_default_collections(recreate=args.recreate)
            
        elif args.action == "list":
            # Listar todas las colecciones
            collections = await initializer.list_collections()
            print(f"\n📚 Colecciones disponibles ({len(collections)}):")
            for i, collection in enumerate(collections, 1):
                print(f"{i}. {collection}")
                
        elif args.action == "info":
            # Mostrar información de una colección específica
            if not args.collection:
                logger.error("❌ Se requiere --collection para la acción 'info'")
                sys.exit(1)
            
            info = await initializer.get_collection_info(args.collection)
            if info:
                print(f"\n📊 Información de la colección '{args.collection}':")
                print(f"Documentos: {info['document_count']}")
                print(f"Embedding Function: {info['embedding_function']}")
                print(f"Metadata: {info['metadata']}")
            else:
                logger.error(f"❌ No se pudo obtener información de '{args.collection}'")
                
        elif args.action == "delete":
            # Eliminar una colección específica
            if not args.collection:
                logger.error("❌ Se requiere --collection para la acción 'delete'")
                sys.exit(1)
            
            confirm = input(f"⚠️ ¿Estás seguro de eliminar la colección '{args.collection}'? (y/N): ")
            if confirm.lower() == 'y':
                await initializer.delete_collection(args.collection)
            else:
                logger.info("❌ Operación cancelada")
                
        elif args.action == "verify":
            # Verificar estado de todas las colecciones
            results = await initializer.verify_collections()
            print(f"\n🔍 Estado de las colecciones:")
            print(f"Total: {results['total_collections']}")
            print(f"Estado general: {results['status']}")
            
        elif args.action == "recreate":
            # Recrear colecciones por defecto
            confirm = input("⚠️ ¿Estás seguro de recrear todas las colecciones? (y/N): ")
            if confirm.lower() == 'y':
                await initializer.initialize_default_collections(recreate=True)
            else:
                logger.info("❌ Operación cancelada")
        
        logger.info("🎉 Operación completada exitosamente")
        
    except Exception as e:
        logger.error(f"❌ Error en operación: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main()) 