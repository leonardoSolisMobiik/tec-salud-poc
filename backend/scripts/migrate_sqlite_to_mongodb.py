#!/usr/bin/env python3
"""
Migration Script: SQLite to MongoDB
Migrates all data from SQLite database to MongoDB using the abstraction layer
"""

import sys
import asyncio
import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any

# Add parent directory to path to import app modules
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings
from app.db.models import (
    Patient, Doctor, MedicalDocument, Diagnosis, Treatment, VitalSign,
    PatientInteraction, BatchUpload, BatchFile
)
from app.database.mongodb_adapter import MongoDBAdapter
from app.database.sqlite_adapter import SQLiteAdapter

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class SQLiteToMongoMigration:
    """Migration tool for transferring data from SQLite to MongoDB"""
    
    def __init__(self):
        self.sqlite_adapter = SQLiteAdapter()
        self.mongodb_adapter = MongoDBAdapter()
        self.migration_stats = {
            'doctors': {'migrated': 0, 'errors': 0},
            'patients': {'migrated': 0, 'errors': 0},
            'medical_documents': {'migrated': 0, 'errors': 0},
            'diagnoses': {'migrated': 0, 'errors': 0},
            'treatments': {'migrated': 0, 'errors': 0},
            'vital_signs': {'migrated': 0, 'errors': 0},
            'patient_interactions': {'migrated': 0, 'errors': 0},
            'batch_uploads': {'migrated': 0, 'errors': 0},
            'batch_files': {'migrated': 0, 'errors': 0}
        }
    
    async def initialize(self):
        """Initialize both database adapters"""
        logger.info("🔄 Initializing database adapters...")
        
        # Initialize SQLite with original DATABASE_URL
        original_db_url = settings.DATABASE_URL
        await self.sqlite_adapter.initialize()
        
        # Initialize MongoDB
        await self.mongodb_adapter.initialize()
        
        logger.info("✅ Database adapters initialized")
    
    async def migrate_all_data(self):
        """Migrate all data from SQLite to MongoDB"""
        try:
            logger.info("🚀 Starting full migration from SQLite to MongoDB")
            start_time = datetime.now()
            
            # Migration order matters due to foreign key relationships
            migration_order = [
                ('doctors', Doctor),
                ('patients', Patient),
                ('medical_documents', MedicalDocument),
                ('diagnoses', Diagnosis),
                ('treatments', Treatment),
                ('vital_signs', VitalSign),
                ('patient_interactions', PatientInteraction),
                ('batch_uploads', BatchUpload),
                ('batch_files', BatchFile)
            ]
            
            for collection_name, model_class in migration_order:
                await self.migrate_table(collection_name, model_class)
            
            # Generate final report
            total_time = (datetime.now() - start_time).total_seconds()
            await self.generate_migration_report(total_time)
            
        except Exception as e:
            logger.error(f"❌ Migration failed: {str(e)}")
            raise
    
    async def migrate_table(self, collection_name: str, model_class):
        """Migrate a single table to MongoDB collection"""
        logger.info(f"📋 Migrating {collection_name}...")
        
        try:
            # Get SQLite session
            sqlite_session = self.sqlite_adapter.get_session()
            
            # Get all records from SQLite
            records = sqlite_session.query(model_class).all()
            logger.info(f"  Found {len(records)} records in {collection_name}")
            
            # Convert and insert into MongoDB
            for record in records:
                try:
                    # Convert SQLAlchemy model to dictionary
                    record_dict = self._model_to_dict(record)
                    
                    # Map collection name
                    mongo_collection = settings.MONGODB_COLLECTIONS.get(collection_name, collection_name)
                    
                    # Insert into MongoDB
                    await self.mongodb_adapter.create(mongo_collection, record_dict)
                    
                    self.migration_stats[collection_name]['migrated'] += 1
                    
                except Exception as e:
                    logger.error(f"  ❌ Error migrating record ID {getattr(record, 'id', 'unknown')}: {str(e)}")
                    self.migration_stats[collection_name]['errors'] += 1
            
            sqlite_session.close()
            
            migrated = self.migration_stats[collection_name]['migrated']
            errors = self.migration_stats[collection_name]['errors']
            logger.info(f"  ✅ {collection_name}: {migrated} migrated, {errors} errors")
            
        except Exception as e:
            logger.error(f"❌ Failed to migrate {collection_name}: {str(e)}")
            self.migration_stats[collection_name]['errors'] += 1
    
    def _model_to_dict(self, model) -> Dict[str, Any]:
        """Convert SQLAlchemy model to dictionary for MongoDB"""
        result = {}
        
        for column in model.__table__.columns:
            value = getattr(model, column.name)
            
            # Handle special data type conversions
            if value is not None:
                # Convert dates to datetime for MongoDB
                if hasattr(value, 'date') and callable(getattr(value, 'date')):
                    # It's a datetime
                    result[column.name] = value
                elif hasattr(value, 'year'):
                    # It's a date
                    result[column.name] = datetime.combine(value, datetime.min.time())
                else:
                    result[column.name] = value
            else:
                result[column.name] = value
        
        return result
    
    async def verify_migration(self) -> bool:
        """Verify that migration was successful by comparing counts"""
        logger.info("🔍 Verifying migration...")
        
        verification_passed = True
        
        for collection_name in self.migration_stats.keys():
            try:
                # Get SQLite count
                sqlite_session = self.sqlite_adapter.get_session()
                model_class = self._get_model_class(collection_name)
                sqlite_count = sqlite_session.query(model_class).count()
                sqlite_session.close()
                
                # Get MongoDB count
                mongo_collection = settings.MONGODB_COLLECTIONS.get(collection_name, collection_name)
                mongo_count = await self.mongodb_adapter.count(mongo_collection)
                
                if sqlite_count == mongo_count:
                    logger.info(f"  ✅ {collection_name}: {sqlite_count} = {mongo_count}")
                else:
                    logger.error(f"  ❌ {collection_name}: SQLite={sqlite_count}, MongoDB={mongo_count}")
                    verification_passed = False
                    
            except Exception as e:
                logger.error(f"  ❌ Error verifying {collection_name}: {str(e)}")
                verification_passed = False
        
        return verification_passed
    
    def _get_model_class(self, collection_name: str):
        """Get SQLAlchemy model class by collection name"""
        model_map = {
            'doctors': Doctor,
            'patients': Patient,
            'medical_documents': MedicalDocument,
            'diagnoses': Diagnosis,
            'treatments': Treatment,
            'vital_signs': VitalSign,
            'patient_interactions': PatientInteraction,
            'batch_uploads': BatchUpload,
            'batch_files': BatchFile
        }
        return model_map.get(collection_name)
    
    async def generate_migration_report(self, total_time: float):
        """Generate comprehensive migration report"""
        logger.info("📊 Migration Report")
        logger.info("=" * 50)
        
        total_migrated = 0
        total_errors = 0
        
        for collection_name, stats in self.migration_stats.items():
            migrated = stats['migrated']
            errors = stats['errors']
            total_migrated += migrated
            total_errors += errors
            
            status = "✅" if errors == 0 else "⚠️"
            logger.info(f"{status} {collection_name:20} | Migrated: {migrated:4} | Errors: {errors:2}")
        
        logger.info("=" * 50)
        logger.info(f"📈 Total Records Migrated: {total_migrated}")
        logger.info(f"❌ Total Errors: {total_errors}")
        logger.info(f"⏱️  Total Time: {total_time:.2f} seconds")
        logger.info(f"🚀 Average Speed: {total_migrated/total_time:.2f} records/second")
        
        if total_errors == 0:
            logger.info("🎉 Migration completed successfully!")
        else:
            logger.warning(f"⚠️  Migration completed with {total_errors} errors")
    
    async def close(self):
        """Close database connections"""
        await self.sqlite_adapter.close()
        await self.mongodb_adapter.close()


async def main():
    """Main migration function"""
    print("🔄 TecSalud SQLite to MongoDB Migration Tool")
    print("=" * 50)
    
    # Verify MongoDB is configured
    if settings.DATABASE_TYPE.lower() != "mongodb":
        print("❌ DATABASE_TYPE must be set to 'mongodb' for migration")
        print("   Please update your .env file and try again")
        return
    
    if not settings.MONGODB_CONNECTION_STRING:
        print("❌ MONGODB_CONNECTION_STRING is required")
        print("   Please configure MongoDB connection in .env file")
        return
    
    # Confirm migration
    response = input("This will migrate ALL data from SQLite to MongoDB. Continue? (y/N): ")
    if response.lower() != 'y':
        print("❌ Migration cancelled")
        return
    
    migration = SQLiteToMongoMigration()
    
    try:
        # Initialize
        await migration.initialize()
        
        # Perform migration
        await migration.migrate_all_data()
        
        # Verify migration
        verification_passed = await migration.verify_migration()
        
        if verification_passed:
            print("✅ Migration verification PASSED")
            print("🎉 You can now safely switch to MongoDB!")
            print(f"   Set DATABASE_TYPE=mongodb in your .env file")
        else:
            print("❌ Migration verification FAILED")
            print("   Please check the logs and retry migration")
        
    except Exception as e:
        logger.error(f"❌ Migration failed: {str(e)}")
    finally:
        await migration.close()


if __name__ == "__main__":
    asyncio.run(main()) 