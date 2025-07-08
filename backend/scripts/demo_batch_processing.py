#!/usr/bin/env python3
"""
Demo Script for Batch Processing Service
Demonstrates the complete workflow of bulk document upload and processing
"""

import asyncio
import sys
import os
import tempfile
from pathlib import Path
from datetime import datetime

# Add the parent directory to the path to import app modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.db.models import ProcessingTypeEnum, Doctor, Patient, GenderEnum
from app.services.batch_processing_service import BatchProcessingService


def create_demo_pdfs(output_dir: Path) -> list:
    """Create demo PDF files with TecSalud naming convention"""
    
    demo_files = [
        "3000003799_GARZA TIJERINA, MARIA ESTHER_6001467010_CONS.pdf",
        "3000003800_LOPEZ MARTINEZ, CARLOS EDUARDO_6001467011_LAB.pdf",
        "3000003801_RODRIGUEZ SANCHEZ, ANA LUCIA_6001467012_HIST.pdf",
        "3000003802_FERNANDEZ GARCIA, PEDRO ANTONIO_6001467013_IMG.pdf",
        "invalid_filename.pdf"  # This will fail parsing
    ]
    
    created_files = []
    
    for filename in demo_files:
        file_path = output_dir / filename
        
        # Create mock PDF content
        content = f"""
        TECSALUD - TECNOLÓGICO DE MONTERREY
        =====================================
        
        Documento: {filename}
        Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
        
        CONTENIDO DEL DOCUMENTO MÉDICO
        
        Paciente: {filename.split('_')[1] if '_' in filename else 'Nombre no disponible'}
        
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
        Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
        Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
        
        DIAGNÓSTICO:
        - Evaluación médica general
        - Estado de salud estable
        - Seguimiento recomendado
        
        OBSERVACIONES:
        Este es un documento de demostración para el sistema de procesamiento 
        masivo de expedientes médicos de TecSalud.
        
        Dr. Juan Pérez
        Medicina General
        Ced. Prof. 12345678
        """.strip()
        
        # Write file
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        created_files.append(str(file_path))
        print(f"📄 Created demo file: {filename}")
    
    return created_files


def create_sample_patients(db_session):
    """Create sample patients and doctor for demo"""
    
    # Create doctor if not exists
    doctor = db_session.query(Doctor).filter_by(email="demo@tecsalud.mx").first()
    if not doctor:
        doctor = Doctor(
            email="demo@tecsalud.mx",
            name="Dr. Juan Pérez",
            specialty="Medicina General",
            license_number="12345678",
            phone="555-1234"
        )
        db_session.add(doctor)
        db_session.commit()
        db_session.refresh(doctor)
        print(f"👨‍⚕️ Created doctor: {doctor.name}")
    
    # Create sample patient (one that will match)
    existing_patient = db_session.query(Patient).filter_by(
        medical_record_number="3000003799"
    ).first()
    
    if not existing_patient:
        patient = Patient(
            medical_record_number="3000003799",
            name="GARZA TIJERINA, MARIA ESTHER",
            birth_date="1980-01-15",
            gender=GenderEnum.FEMALE,
            doctor_id=doctor.id
        )
        db_session.add(patient)
        db_session.commit()
        print(f"👤 Created patient: {patient.name}")
    
    return doctor


async def demo_batch_workflow():
    """Demonstrate the complete batch processing workflow"""
    
    print("🚀 TecSalud Batch Processing Demo")
    print("=" * 50)
    
    # Initialize service and database
    batch_service = BatchProcessingService()
    db = SessionLocal()
    
    try:
        # Setup demo data
        print("\n📋 Setting up demo data...")
        doctor = create_sample_patients(db)
        
        # Create demo files
        demo_dir = Path(tempfile.mkdtemp(prefix="tecsalud_demo_"))
        print(f"\n📁 Demo directory: {demo_dir}")
        
        demo_files = create_demo_pdfs(demo_dir)
        print(f"✅ Created {len(demo_files)} demo files")
        
        # Step 1: Create batch upload session
        print("\n🎯 Step 1: Creating batch upload session...")
        session_id = await batch_service.create_batch_upload_session(
            uploaded_by="admin@tecsalud.mx",
            processing_type=ProcessingTypeEnum.BOTH,
            db=db
        )
        print(f"✅ Session created: {session_id}")
        
        # Step 2: Simulate file upload (create mock UploadFile objects)
        print("\n📤 Step 2: Simulating file uploads...")
        
        # Mock file uploads for demo
        from unittest.mock import Mock, AsyncMock
        from fastapi import UploadFile
        
        mock_files = []
        for file_path in demo_files:
            with open(file_path, 'rb') as f:
                content = f.read()
            
            mock_file = Mock(spec=UploadFile)
            mock_file.filename = Path(file_path).name
            mock_file.read = AsyncMock(return_value=content)
            mock_files.append(mock_file)
        
        upload_result = await batch_service.upload_files_to_session(
            session_id=session_id,
            files=mock_files,
            db=db
        )
        
        print(f"✅ Uploaded {upload_result['total_files']} files")
        print(f"📊 Parsing success rate: {upload_result['parsing_success_rate']:.1%}")
        
        # Display uploaded files info
        print("\n📋 Uploaded files:")
        for file_info in upload_result['uploaded_files']:
            status = "✅ Parsed" if file_info['parsed'] else "❌ Parse failed"
            print(f"  {status}: {file_info['filename']}")
            if file_info['parsed']:
                print(f"    Patient: {file_info['patient_name']}")
                print(f"    ID: {file_info['patient_id']}")
        
        # Display failed files
        if upload_result['failed_files']:
            print("\n❌ Failed files:")
            for failed_file in upload_result['failed_files']:
                print(f"  {failed_file['filename']}: {failed_file['error']}")
        
        # Step 3: Get initial status
        print("\n📊 Step 3: Checking initial status...")
        status = await batch_service.get_batch_status(session_id=session_id, db=db)
        print(f"Status: {status['status']}")
        print(f"Total files: {status['total_files']}")
        
        # Step 4: Process batch
        print("\n⚙️ Step 4: Processing batch...")
        print("This may take a moment for file processing, patient matching, and vectorization...")
        
        start_time = datetime.now()
        result = await batch_service.process_batch_upload(
            session_id=session_id,
            db=db
        )
        processing_time = (datetime.now() - start_time).total_seconds()
        
        print(f"\n🎉 Processing completed in {processing_time:.2f} seconds!")
        print(f"Status: {result.status}")
        print(f"Total files: {result.total_files}")
        print(f"Processed: {result.processed_files}")
        print(f"Failed: {result.failed_files}")
        print(f"Created patients: {result.created_patients}")
        print(f"Matched patients: {result.matched_patients}")
        print(f"Review required: {result.review_required}")
        
        # Step 5: Get final status with details
        print("\n📋 Step 5: Final status details...")
        final_status = await batch_service.get_batch_status(session_id=session_id, db=db)
        
        print(f"\nProcessing Summary:")
        print(f"  Session ID: {final_status['session_id']}")
        print(f"  Uploaded by: {final_status['uploaded_by']}")
        print(f"  Processing type: {final_status['processing_type']}")
        print(f"  Started: {final_status['started_at']}")
        print(f"  Completed: {final_status['completed_at']}")
        
        print(f"\nFile Details:")
        for i, file_detail in enumerate(final_status['files'], 1):
            print(f"  {i}. {file_detail['filename']}")
            print(f"     Patient matching: {file_detail['patient_matching_status']}")
            print(f"     Processing: {file_detail['processing_status']}")
            if file_detail['matching_confidence']:
                print(f"     Confidence: {file_detail['matching_confidence']:.2%}")
            if file_detail['review_required']:
                print(f"     ⚠️ Requires admin review")
            if file_detail['error_message']:
                print(f"     ❌ Error: {file_detail['error_message']}")
            print()
        
        # Step 6: Check files requiring review
        print("\n🔍 Step 6: Files requiring admin review...")
        review_files = await batch_service.get_files_requiring_review(
            session_id=session_id,
            db=db
        )
        
        if review_files:
            print(f"Found {len(review_files)} files requiring review:")
            for review_file in review_files:
                print(f"  📄 {review_file['filename']}")
                print(f"     Patient: {review_file['parsed_patient_name']}")
                print(f"     Confidence: {review_file['matching_confidence']:.2%}")
                print(f"     Status: {review_file['patient_matching_status']}")
                if review_file['error_message']:
                    print(f"     Error: {review_file['error_message']}")
                print()
        else:
            print("✅ No files require admin review")
        
        # Step 7: Database verification
        print("\n🗄️ Step 7: Database verification...")
        
        # Check created documents
        from app.db.models import MedicalDocument, BatchUpload as BatchUploadModel
        
        batch_upload = db.query(BatchUploadModel).filter_by(session_id=session_id).first()
        documents = db.query(MedicalDocument).join(
            BatchUploadModel.batch_files
        ).filter(
            BatchUploadModel.id == batch_upload.id
        ).all()
        
        print(f"📄 Created {len(documents)} medical documents:")
        for doc in documents:
            print(f"  - ID: {doc.id}, Patient: {doc.patient_id}, Type: {doc.document_type}")
            print(f"    Processing: {doc.processing_type}, Status: {doc.vectorization_status}")
            print(f"    Chunks: {doc.chunks_count}, Hash: {doc.content_hash[:10]}...")
            print()
        
        # Step 8: Cleanup demo
        print("\n🧹 Step 8: Cleaning up demo...")
        await batch_service.cleanup_batch_session(session_id=session_id, db=db)
        
        # Remove demo files
        import shutil
        shutil.rmtree(demo_dir)
        print(f"✅ Cleaned up demo directory: {demo_dir}")
        
        print("\n🎉 Demo completed successfully!")
        print("\nKey Features Demonstrated:")
        print("✅ Batch session creation")
        print("✅ Bulk file upload with TecSalud filename parsing")
        print("✅ Patient matching with confidence scoring")
        print("✅ Parallel document processing")
        print("✅ Dual processing (vectorized + complete storage)")
        print("✅ Admin review workflow for low-confidence matches")
        print("✅ Error handling and recovery")
        print("✅ Progress tracking and status monitoring")
        print("✅ Database integration with new models")
        print("✅ Cleanup and resource management")
        
    except Exception as e:
        print(f"\n❌ Demo failed: {str(e)}")
        import traceback
        traceback.print_exc()
        
    finally:
        db.close()


async def demo_api_workflow():
    """Demonstrate API workflow using curl commands"""
    
    print("\n📡 API Workflow Demo")
    print("=" * 30)
    print("Here are the curl commands to test the API:")
    print()
    
    print("1️⃣ Create batch session:")
    print('curl -X POST "http://localhost:8000/api/v1/documents/batch/create-session" \\')
    print('  -H "Content-Type: application/json" \\')
    print('  -d \'{"processing_type": "both", "uploaded_by": "admin@tecsalud.mx"}\'')
    print()
    
    print("2️⃣ Upload files to session:")
    print('curl -X POST "http://localhost:8000/api/v1/documents/batch/{session_id}/upload" \\')
    print('  -F "files=@3000003799_GARZA TIJERINA, MARIA ESTHER_6001467010_CONS.pdf" \\')
    print('  -F "files=@3000003800_LOPEZ MARTINEZ, CARLOS EDUARDO_6001467011_LAB.pdf"')
    print()
    
    print("3️⃣ Start processing:")
    print('curl -X POST "http://localhost:8000/api/v1/documents/batch/{session_id}/process"')
    print()
    
    print("4️⃣ Check status:")
    print('curl -X GET "http://localhost:8000/api/v1/documents/batch/{session_id}/status"')
    print()
    
    print("5️⃣ Get files requiring review:")
    print('curl -X GET "http://localhost:8000/api/v1/documents/batch/{session_id}/review"')
    print()
    
    print("6️⃣ Get processing types:")
    print('curl -X GET "http://localhost:8000/api/v1/documents/batch/processing-types"')
    print()
    
    print("7️⃣ Cleanup session:")
    print('curl -X DELETE "http://localhost:8000/api/v1/documents/batch/{session_id}/cleanup"')
    print()


def demo_performance_metrics():
    """Show performance metrics and recommendations"""
    
    print("\n📊 Performance Metrics & Recommendations")
    print("=" * 45)
    print()
    
    print("🎯 Expected Performance:")
    print("  • File upload: ~50-100 files/minute")
    print("  • Filename parsing: ~1000 files/second")
    print("  • Patient matching: ~200 files/second")
    print("  • Document processing: ~10-20 files/second")
    print("  • Vectorization: ~5-10 files/second")
    print()
    
    print("⚙️ Configuration Recommendations:")
    print("  • max_parallel_files: 5-10 (adjust based on server capacity)")
    print("  • Database connection pool: 20-50 connections")
    print("  • Upload file size limit: 10MB per file")
    print("  • Session timeout: 24 hours")
    print()
    
    print("📈 Scaling Recommendations:")
    print("  • Use Redis for session state in production")
    print("  • Implement file chunking for large uploads")
    print("  • Add monitoring with Prometheus/Grafana")
    print("  • Use background tasks with Celery for heavy processing")
    print("  • Implement file storage with S3/MinIO")
    print()
    
    print("🔒 Security Considerations:")
    print("  • Validate file types and content")
    print("  • Implement rate limiting")
    print("  • Use HTTPS for file uploads")
    print("  • Audit all admin actions")
    print("  • Encrypt sensitive data at rest")


def main():
    """Main demo function"""
    
    print("TecSalud Batch Processing Service Demo")
    print("====================================")
    print()
    print("This demo showcases the complete workflow for bulk document processing:")
    print("• TecSalud filename parsing")
    print("• Patient matching with fuzzy logic")
    print("• Dual document processing (vectorized + complete)")
    print("• Admin review workflow")
    print("• Progress tracking and monitoring")
    print()
    
    choice = input("Choose demo mode:\n1. Full workflow demo\n2. API commands demo\n3. Performance metrics\n4. All\nEnter choice (1-4): ")
    
    if choice in ['1', '4']:
        asyncio.run(demo_batch_workflow())
    
    if choice in ['2', '4']:
        asyncio.run(demo_api_workflow())
    
    if choice in ['3', '4']:
        demo_performance_metrics()
    
    print("\n✨ Demo complete! Check the implementation in:")
    print("  • backend/app/services/batch_processing_service.py")
    print("  • backend/app/api/endpoints/batch_documents.py")
    print("  • backend/tests/test_batch_processing_service.py")


if __name__ == "__main__":
    main() 