#!/usr/bin/env python3
"""
Database Cleanup Script
Cleans patients, documents, and related data while preserving system data
"""

import sys
import asyncio
import logging
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy import text
from app.core.database import get_db, SessionLocal
from app.db.models import (
    Patient, MedicalDocument, VitalSign, Diagnosis, Treatment, 
    PatientInteraction, BatchUpload, BatchFile
)
from app.services.chroma_service import chroma_service

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class DatabaseCleaner:
    """Clean database while preserving essential system data"""
    
    def __init__(self):
        self.db = SessionLocal()
    
    def clean_patients_and_related_data(self) -> None:
        """
        Clean all patient-related data while preserving:
        - Doctors (keep system doctors)
        - System configuration
        """
        try:
            logger.info("🧹 Starting database cleanup...")
            
            # Get counts before cleanup
            before_counts = self._get_record_counts()
            logger.info(f"📊 Before cleanup: {before_counts}")
            
            # Delete in order to respect foreign key constraints
            logger.info("🗑️ Deleting patient interactions...")
            self.db.query(PatientInteraction).delete()
            
            logger.info("🗑️ Deleting treatments...")
            self.db.query(Treatment).delete()
            
            logger.info("🗑️ Deleting diagnoses...")
            self.db.query(Diagnosis).delete()
            
            logger.info("🗑️ Deleting vital signs...")
            self.db.query(VitalSign).delete()
            
            logger.info("🗑️ Deleting batch files...")
            self.db.query(BatchFile).delete()
            
            logger.info("🗑️ Deleting batch uploads...")
            self.db.query(BatchUpload).delete()
            
            logger.info("🗑️ Deleting medical documents...")
            self.db.query(MedicalDocument).delete()
            
            logger.info("🗑️ Deleting patients...")
            self.db.query(Patient).delete()
            
            # Reset auto-increment sequences
            logger.info("🔄 Resetting auto-increment sequences...")
            self._reset_sequences()
            
            # Commit all changes
            self.db.commit()
            
            # Get counts after cleanup
            after_counts = self._get_record_counts()
            logger.info(f"📊 After cleanup: {after_counts}")
            
            logger.info("✅ Database cleanup completed successfully!")
            
        except Exception as e:
            logger.error(f"❌ Error during cleanup: {str(e)}")
            self.db.rollback()
            raise
        finally:
            self.db.close()
    
    def _get_record_counts(self) -> dict:
        """Get count of records in each table"""
        try:
            counts = {}
            counts['patients'] = self.db.query(Patient).count()
            counts['medical_documents'] = self.db.query(MedicalDocument).count()
            counts['vital_signs'] = self.db.query(VitalSign).count()
            counts['diagnoses'] = self.db.query(Diagnosis).count()
            counts['treatments'] = self.db.query(Treatment).count()
            counts['patient_interactions'] = self.db.query(PatientInteraction).count()
            counts['batch_uploads'] = self.db.query(BatchUpload).count()
            counts['batch_files'] = self.db.query(BatchFile).count()
            return counts
        except Exception as e:
            logger.error(f"Error getting record counts: {e}")
            return {}
    
    def _reset_sequences(self) -> None:
        """Reset auto-increment sequences for SQLite"""
        try:
            # SQLite uses sqlite_sequence table to track auto-increment values
            tables_to_reset = [
                'patients', 'medical_documents', 'vital_signs', 
                'diagnoses', 'treatments', 'patient_interactions',
                'batch_uploads', 'batch_files'
            ]
            
            for table in tables_to_reset:
                try:
                    # Delete the sequence entry for this table
                    self.db.execute(
                        text("DELETE FROM sqlite_sequence WHERE name = :table"),
                        {"table": table}
                    )
                    logger.info(f"🔄 Reset sequence for {table}")
                except Exception as e:
                    logger.warning(f"Could not reset sequence for {table}: {e}")
            
        except Exception as e:
            logger.error(f"Error resetting sequences: {e}")

async def clean_chroma_collections():
    """Clean ChromaDB collections"""
    try:
        logger.info("🧹 Cleaning ChromaDB collections...")
        
        # Initialize ChromaDB if not already done
        if not chroma_service.is_initialized:
            await chroma_service.initialize()
        
        if chroma_service.collection:
            # Get document count before
            before_count = chroma_service.collection.count()
            logger.info(f"📊 ChromaDB documents before cleanup: {before_count}")
            
            # Delete all documents in the collection
            if before_count > 0:
                # Get all document IDs
                all_docs = chroma_service.collection.get()
                if all_docs['ids']:
                    chroma_service.collection.delete(ids=all_docs['ids'])
                    logger.info(f"🗑️ Deleted {len(all_docs['ids'])} documents from ChromaDB")
            
            # Verify cleanup
            after_count = chroma_service.collection.count()
            logger.info(f"📊 ChromaDB documents after cleanup: {after_count}")
            
            if after_count == 0:
                logger.info("✅ ChromaDB cleanup completed successfully!")
            else:
                logger.warning(f"⚠️ ChromaDB still contains {after_count} documents")
        else:
            logger.info("ℹ️ No ChromaDB collection found to clean")
            
    except Exception as e:
        logger.error(f"❌ Error cleaning ChromaDB: {str(e)}")

async def main():
    """Main cleanup function"""
    try:
        print("\n🚨 WARNING: This will delete ALL patient data!")
        print("The following will be PERMANENTLY deleted:")
        print("  • All patients")
        print("  • All medical documents") 
        print("  • All vital signs")
        print("  • All diagnoses and treatments")
        print("  • All patient interactions")
        print("  • All batch uploads")
        print("  • All ChromaDB vectors")
        print("\nDoctors and system configuration will be PRESERVED.")
        
        confirm = input("\n❓ Are you sure you want to proceed? (type 'YES' to confirm): ")
        
        if confirm != 'YES':
            print("❌ Cleanup cancelled by user")
            return
        
        # Clean SQL database
        logger.info("🗄️ Cleaning SQL database...")
        cleaner = DatabaseCleaner()
        cleaner.clean_patients_and_related_data()
        
        # Clean ChromaDB
        logger.info("🔍 Cleaning vector database...")
        await clean_chroma_collections()
        
        print("\n🎉 Database cleanup completed successfully!")
        print("You can now upload TecSalud files to create fresh patient records.")
        
    except KeyboardInterrupt:
        print("\n❌ Cleanup interrupted by user")
    except Exception as e:
        logger.error(f"❌ Cleanup failed: {str(e)}")
        print(f"\n💥 Error during cleanup: {str(e)}")

if __name__ == "__main__":
    asyncio.run(main()) 