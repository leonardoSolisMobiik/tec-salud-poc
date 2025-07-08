#!/usr/bin/env python3
"""
Database Migration Script: Add Dual Processing Support
Adds new fields to MedicalDocument and creates BatchUpload/BatchFile tables
"""

import sys
import os
import sqlite3
from datetime import datetime
from pathlib import Path

# Add the parent directory to the path to import app modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import get_settings
from app.core.database import SessionLocal, engine
from app.db.models import Base, MedicalDocument, BatchUpload, BatchFile
from sqlalchemy import text, inspect


def check_column_exists(table_name: str, column_name: str, connection) -> bool:
    """Check if a column exists in a table"""
    try:
        inspector = inspect(connection)
        columns = inspector.get_columns(table_name)
        return any(col['name'] == column_name for col in columns)
    except Exception:
        return False


def check_table_exists(table_name: str, connection) -> bool:
    """Check if a table exists"""
    try:
        inspector = inspect(connection)
        tables = inspector.get_table_names()
        return table_name in tables
    except Exception:
        return False


def migrate_medical_documents(connection):
    """Add new fields to medical_documents table"""
    print("🔄 Migrating medical_documents table...")
    
    # List of new columns to add
    new_columns = [
        ("processing_type", "TEXT NOT NULL DEFAULT 'vectorized'"),
        ("original_filename", "TEXT"),
        ("vectorization_status", "TEXT NOT NULL DEFAULT 'pending'"),
        ("chunks_count", "INTEGER DEFAULT 0"),
        ("content_hash", "TEXT")
    ]
    
    for column_name, column_def in new_columns:
        if not check_column_exists("medical_documents", column_name, connection):
            sql = f"ALTER TABLE medical_documents ADD COLUMN {column_name} {column_def}"
            connection.execute(text(sql))
            print(f"  ✅ Added column: {column_name}")
        else:
            print(f"  ⚠️  Column already exists: {column_name}")


def create_batch_tables(connection):
    """Create new batch upload tables"""
    print("🔄 Creating batch upload tables...")
    
    # Create batch_uploads table
    if not check_table_exists("batch_uploads", connection):
        batch_uploads_sql = """
        CREATE TABLE batch_uploads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL UNIQUE,
            uploaded_by TEXT NOT NULL,
            total_files INTEGER DEFAULT 0,
            processed_files INTEGER DEFAULT 0,
            failed_files INTEGER DEFAULT 0,
            processing_type TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            error_message TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            started_at TIMESTAMP,
            completed_at TIMESTAMP
        );
        """
        connection.execute(text(batch_uploads_sql))
        connection.execute(text("CREATE INDEX idx_batch_uploads_session_id ON batch_uploads(session_id);"))
        connection.execute(text("CREATE INDEX idx_batch_uploads_status ON batch_uploads(status);"))
        print("  ✅ Created batch_uploads table")
    else:
        print("  ⚠️  Table already exists: batch_uploads")
    
    # Create batch_files table
    if not check_table_exists("batch_files", connection):
        batch_files_sql = """
        CREATE TABLE batch_files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            batch_upload_id INTEGER NOT NULL,
            original_filename TEXT NOT NULL,
            file_path TEXT NOT NULL,
            file_size INTEGER NOT NULL,
            content_hash TEXT NOT NULL,
            parsed_patient_id TEXT,
            parsed_patient_name TEXT,
            parsed_document_number TEXT,
            parsed_document_type TEXT,
            patient_matching_status TEXT NOT NULL DEFAULT 'pending',
            matched_patient_id INTEGER,
            matching_confidence REAL,
            matching_details TEXT,
            processing_status TEXT NOT NULL DEFAULT 'pending',
            medical_document_id INTEGER,
            error_message TEXT,
            review_required BOOLEAN DEFAULT 0,
            reviewed_by TEXT,
            reviewed_at TIMESTAMP,
            review_notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            processed_at TIMESTAMP,
            FOREIGN KEY (batch_upload_id) REFERENCES batch_uploads(id),
            FOREIGN KEY (matched_patient_id) REFERENCES patients(id),
            FOREIGN KEY (medical_document_id) REFERENCES medical_documents(id)
        );
        """
        connection.execute(text(batch_files_sql))
        connection.execute(text("CREATE INDEX idx_batch_files_batch_upload_id ON batch_files(batch_upload_id);"))
        connection.execute(text("CREATE INDEX idx_batch_files_matching_status ON batch_files(patient_matching_status);"))
        connection.execute(text("CREATE INDEX idx_batch_files_processing_status ON batch_files(processing_status);"))
        connection.execute(text("CREATE INDEX idx_batch_files_review_required ON batch_files(review_required);"))
        print("  ✅ Created batch_files table")
    else:
        print("  ⚠️  Table already exists: batch_files")


def verify_migration(connection):
    """Verify that the migration was successful"""
    print("🔍 Verifying migration...")
    
    # Check medical_documents columns
    expected_columns = [
        "processing_type", "original_filename", "vectorization_status", 
        "chunks_count", "content_hash"
    ]
    
    for column in expected_columns:
        if check_column_exists("medical_documents", column, connection):
            print(f"  ✅ medical_documents.{column} exists")
        else:
            print(f"  ❌ medical_documents.{column} missing")
            return False
    
    # Check batch tables
    for table in ["batch_uploads", "batch_files"]:
        if check_table_exists(table, connection):
            print(f"  ✅ {table} table exists")
        else:
            print(f"  ❌ {table} table missing")
            return False
    
    return True


def main():
    """Main migration function"""
    print("🚀 Starting dual processing migration...")
    print(f"📅 Migration date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    try:
        # Get database connection
        settings = get_settings()
        db_path = Path(settings.DATABASE_PATH)
        print(f"📁 Database path: {db_path}")
        
        # Create backup
        backup_path = db_path.with_suffix(f".backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db")
        if db_path.exists():
            import shutil
            shutil.copy2(db_path, backup_path)
            print(f"💾 Backup created: {backup_path}")
        
        # Run migration
        with engine.connect() as connection:
            transaction = connection.begin()
            
            try:
                # Run migrations
                migrate_medical_documents(connection)
                create_batch_tables(connection)
                
                # Verify migration
                if verify_migration(connection):
                    transaction.commit()
                    print("✅ Migration completed successfully!")
                else:
                    transaction.rollback()
                    print("❌ Migration verification failed - rolled back")
                    sys.exit(1)
                    
            except Exception as e:
                transaction.rollback()
                print(f"❌ Migration failed: {e}")
                sys.exit(1)
        
        print("🎉 Dual processing migration completed!")
        
    except Exception as e:
        print(f"💥 Fatal error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main() 