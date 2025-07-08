#!/usr/bin/env python3
"""
Database Migration Script
Adds new columns for enhanced document context functionality (TASK-DOC-006)
"""

import sys
import os
from datetime import datetime

# Add the backend app to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.core.database import engine, get_db
from app.db.models import Base, MedicalDocument, ProcessingTypeEnum, VectorizationStatusEnum
from sqlalchemy import text, inspect
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_column_exists(table_name: str, column_name: str) -> bool:
    """Check if a column exists in a table"""
    inspector = inspect(engine)
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    return column_name in columns

def migrate_database():
    """Add new columns for enhanced document context"""
    print("🚀 MIGRATING DATABASE FOR ENHANCED DOCUMENT CONTEXT")
    print("=" * 60)
    
    try:
        with engine.connect() as conn:
            
            # Check which columns need to be added
            new_columns = [
                ('processing_type', 'TEXT DEFAULT "vectorized"'),
                ('original_filename', 'TEXT'),
                ('vectorization_status', 'TEXT DEFAULT "completed"'),
                ('chunks_count', 'INTEGER DEFAULT 0'),
                ('content_hash', 'TEXT')
            ]
            
            existing_columns = []
            missing_columns = []
            
            for col_name, col_def in new_columns:
                if check_column_exists('medical_documents', col_name):
                    existing_columns.append(col_name)
                else:
                    missing_columns.append((col_name, col_def))
            
            print(f"✅ Existing columns: {existing_columns}")
            print(f"➕ Missing columns: {[col[0] for col in missing_columns]}")
            print()
            
            if not missing_columns:
                print("🎉 Database is already up to date!")
                return
            
            # Add missing columns
            print("📝 Adding missing columns...")
            for col_name, col_def in missing_columns:
                sql = f"ALTER TABLE medical_documents ADD COLUMN {col_name} {col_def}"
                print(f"  🔧 Adding {col_name}...")
                conn.execute(text(sql))
                logger.info(f"Added column: {col_name}")
            
            # Commit the changes
            conn.commit()
            print("✅ Columns added successfully!")
            print()
            
            # Update existing documents with default values
            print("🔄 Updating existing documents with default values...")
            
            # Set processing_type to VECTORIZED for existing docs
            update_processing_sql = """
                UPDATE medical_documents 
                SET processing_type = 'vectorized'
                WHERE processing_type IS NULL
            """
            conn.execute(text(update_processing_sql))
            
            # Set vectorization_status to COMPLETED for existing docs with content
            update_status_sql = """
                UPDATE medical_documents 
                SET vectorization_status = 'completed'
                WHERE content IS NOT NULL AND vectorization_status IS NULL
            """
            conn.execute(text(update_status_sql))
            
            # Set chunks_count to 1 for existing docs (estimate)
            update_chunks_sql = """
                UPDATE medical_documents 
                SET chunks_count = 1
                WHERE content IS NOT NULL AND chunks_count IS NULL
            """
            conn.execute(text(update_chunks_sql))
            
            # Generate content_hash for existing documents
            print("  🔑 Generating content hashes for existing documents...")
            
            # Get existing documents
            select_docs_sql = "SELECT id, content FROM medical_documents WHERE content IS NOT NULL"
            result = conn.execute(text(select_docs_sql))
            docs = result.fetchall()
            
            import hashlib
            for doc_id, content in docs:
                if content:
                    content_hash = hashlib.sha256(content.encode()).hexdigest()
                    update_hash_sql = "UPDATE medical_documents SET content_hash = :hash WHERE id = :id"
                    conn.execute(text(update_hash_sql), {"hash": content_hash, "id": doc_id})
            
            conn.commit()
            print(f"  ✅ Updated {len(docs)} existing documents")
            print()
            
            # Show migration summary
            print("📊 MIGRATION SUMMARY:")
            count_sql = "SELECT COUNT(*) as total FROM medical_documents"
            total_docs = conn.execute(text(count_sql)).fetchone()[0]
            print(f"  📄 Total documents: {total_docs}")
            
            if total_docs > 0:
                # Count by processing type
                vectorized_sql = "SELECT COUNT(*) FROM medical_documents WHERE processing_type = 'vectorized'"
                vectorized_count = conn.execute(text(vectorized_sql)).fetchone()[0]
                print(f"  🔍 Vectorized documents: {vectorized_count}")
                
                # Show sample
                sample_sql = "SELECT id, title, processing_type, vectorization_status FROM medical_documents LIMIT 3"
                samples = conn.execute(text(sample_sql)).fetchall()
                print(f"  📋 Sample documents:")
                for sample in samples:
                    print(f"    ID: {sample[0]}, Title: {sample[1][:30]}..., Type: {sample[2]}")
            
            print()
            print("🎉 DATABASE MIGRATION COMPLETED SUCCESSFULLY!")
            print()
            print("🚀 NEXT STEPS:")
            print("  1. ✅ Database schema updated")
            print("  2. 📤 Upload documents with new processing types:")
            print("     • COMPLETE - Store full document content")
            print("     • BOTH - Store content + create vectors")
            print("  3. 🧪 Test hybrid context functionality")
            print()
            
    except Exception as e:
        logger.error(f"❌ Migration failed: {str(e)}")
        raise

def verify_migration():
    """Verify that the migration was successful"""
    print("🔍 VERIFYING MIGRATION...")
    print("-" * 40)
    
    try:
        # Check that all new columns exist
        required_columns = [
            'processing_type',
            'original_filename', 
            'vectorization_status',
            'chunks_count',
            'content_hash'
        ]
        
        all_exist = True
        for col in required_columns:
            exists = check_column_exists('medical_documents', col)
            status = "✅" if exists else "❌"
            print(f"  {status} {col}")
            if not exists:
                all_exist = False
        
        if all_exist:
            print("\n🎉 All required columns exist!")
            
            # Test enum values
            db = next(get_db())
            
            # Test that we can query with new columns
            try:
                count = db.query(MedicalDocument).count()
                print(f"✅ Can query documents: {count} total")
                
                # Test enum values work
                from app.db.models import ProcessingTypeEnum, VectorizationStatusEnum
                print(f"✅ ProcessingTypeEnum values: {[e.value for e in ProcessingTypeEnum]}")
                print(f"✅ VectorizationStatusEnum values: {[e.value for e in VectorizationStatusEnum]}")
                
                return True
                
            except Exception as e:
                print(f"❌ Error querying with new schema: {e}")
                return False
        else:
            print("\n❌ Some columns are missing!")
            return False
            
    except Exception as e:
        print(f"❌ Verification failed: {e}")
        return False

if __name__ == "__main__":
    print("🔧 ENHANCED DOCUMENT CONTEXT MIGRATION")
    print("=" * 60)
    print()
    
    try:
        # Run migration
        migrate_database()
        
        # Verify migration
        if verify_migration():
            print("\n🎉 MIGRATION SUCCESSFUL!")
            print("Ready for enhanced document context functionality!")
        else:
            print("\n❌ MIGRATION VERIFICATION FAILED!")
            sys.exit(1)
            
    except Exception as e:
        print(f"\n❌ MIGRATION FAILED: {e}")
        sys.exit(1) 