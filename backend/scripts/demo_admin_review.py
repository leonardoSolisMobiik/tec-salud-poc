#!/usr/bin/env python3
"""
Interactive Demo for Admin Review Interface
Shows how to use the admin review functionality with realistic scenarios
"""

import asyncio
import sys
import json
import uuid
from datetime import datetime
from pathlib import Path

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.models import (
    Base, Doctor, Patient, BatchUpload, BatchFile,
    BatchUploadStatusEnum, PatientMatchingStatusEnum, VectorizationStatusEnum,
    ProcessingTypeEnum, DocumentTypeEnum, GenderEnum
)
from app.services.admin_review_service import (
    AdminReviewService, AdminDecision, AdminDecisionEnum
)


class AdminReviewDemo:
    """Interactive demo for admin review interface"""
    
    def __init__(self):
        # Setup database
        self.engine = create_engine("sqlite:///demo_admin_review.db")
        Base.metadata.create_all(bind=self.engine)
        Session = sessionmaker(bind=self.engine)
        self.session = Session()
        
        # Create admin review service
        self.admin_service = AdminReviewService()
        
        # Mock external dependencies
        self.admin_service._read_file_content = self._mock_read_file_content
        self.admin_service._vectorize_document = self._mock_vectorize_document
        
        # Setup demo data
        self.setup_demo_data()
    
    async def _mock_read_file_content(self, file_path):
        """Mock file content reading"""
        return f"Contenido del documento médico desde {file_path}"
    
    async def _mock_vectorize_document(self, document_id, content, db):
        """Mock document vectorization"""
        print(f"  📊 Vectorización simulada para documento ID: {document_id}")
        await asyncio.sleep(0.1)  # Simulate processing
    
    def setup_demo_data(self):
        """Setup demo data for testing"""
        
        # Create doctor
        doctor = Doctor(
            email="admin@tecsalud.mx",
            name="Dr. María González",
            specialty="Medicina General",
            license_number="MG123456",
            phone="555-0123"
        )
        self.session.add(doctor)
        
        # Create existing patients
        patients = [
            Patient(
                medical_record_number="3000003799",
                name="GARZA TIJERINA, MARIA ESTHER",
                birth_date="1980-01-15",
                gender=GenderEnum.FEMALE,
                doctor_id=1
            ),
            Patient(
                medical_record_number="3000003800",
                name="LOPEZ MARTINEZ, CARLOS EDUARDO",
                birth_date="1975-05-20",
                gender=GenderEnum.MALE,
                doctor_id=1
            ),
            Patient(
                medical_record_number="3000003801",
                name="RODRIGUEZ SANCHEZ, ANA LUCIA",
                birth_date="1985-03-10",
                gender=GenderEnum.FEMALE,
                doctor_id=1
            )
        ]
        
        for patient in patients:
            self.session.add(patient)
        
        # Create batch upload session
        self.batch_upload = BatchUpload(
            session_id=str(uuid.uuid4()),
            uploaded_by="admin@tecsalud.mx",
            processing_type=ProcessingTypeEnum.BOTH,
            status=BatchUploadStatusEnum.PROCESSING,
            total_files=5,
            processed_files=2,
            files_with_errors=0
        )
        self.session.add(self.batch_upload)
        
        self.session.commit()
        
        # Create batch files with different scenarios
        self.create_demo_batch_files()
    
    def create_demo_batch_files(self):
        """Create demo batch files with different review scenarios"""
        
        # Scenario 1: High confidence match - could be auto-approved
        high_confidence_details = {
            "algorithm": "fuzzy_match",
            "confidence": 0.95,
            "suggestions": [
                {
                    "patient_id": 1,
                    "similarity": 0.95,
                    "name": "GARZA TIJERINA, MARIA ESTHER",
                    "match_reasons": ["Exact ID match", "High name similarity"]
                }
            ]
        }
        
        batch_file1 = BatchFile(
            batch_upload_id=self.batch_upload.id,
            original_filename="3000003799_GARZA TIJERINA, MARIA ESTHER_6001467010_CONS.pdf",
            file_path="/tmp/demo_file1.pdf",
            file_size=1024000,
            content_hash="hash1",
            parsed_patient_id="3000003799",
            parsed_patient_name="GARZA TIJERINA, MARIA ESTHER",
            parsed_document_number="6001467010",
            parsed_document_type="CONS",
            patient_matching_status=PatientMatchingStatusEnum.REVIEW_REQUIRED,
            matched_patient_id=1,
            matching_confidence=0.95,
            matching_details=json.dumps(high_confidence_details),
            processing_status=VectorizationStatusEnum.PENDING,
            review_required=True
        )
        
        # Scenario 2: Medium confidence match - needs admin review
        medium_confidence_details = {
            "algorithm": "fuzzy_match",
            "confidence": 0.78,
            "suggestions": [
                {
                    "patient_id": 2,
                    "similarity": 0.78,
                    "name": "LOPEZ MARTINEZ, CARLOS EDUARDO",
                    "match_reasons": ["Similar name pattern", "Different ID"]
                },
                {
                    "patient_id": 3,
                    "similarity": 0.65,
                    "name": "RODRIGUEZ SANCHEZ, ANA LUCIA",
                    "match_reasons": ["Partial name match"]
                }
            ]
        }
        
        batch_file2 = BatchFile(
            batch_upload_id=self.batch_upload.id,
            original_filename="3000003802_LOPEZ MARTINEZ, CARLOS_6001467011_LAB.pdf",
            file_path="/tmp/demo_file2.pdf",
            file_size=856000,
            content_hash="hash2",
            parsed_patient_id="3000003802",
            parsed_patient_name="LOPEZ MARTINEZ, CARLOS",
            parsed_document_number="6001467011",
            parsed_document_type="LAB",
            patient_matching_status=PatientMatchingStatusEnum.REVIEW_REQUIRED,
            matched_patient_id=2,
            matching_confidence=0.78,
            matching_details=json.dumps(medium_confidence_details),
            processing_status=VectorizationStatusEnum.PENDING,
            review_required=True
        )
        
        # Scenario 3: Parsing error - filename doesn't match TecSalud pattern
        batch_file3 = BatchFile(
            batch_upload_id=self.batch_upload.id,
            original_filename="documento_medico_sin_formato.pdf",
            file_path="/tmp/demo_file3.pdf",
            file_size=512000,
            content_hash="hash3",
            parsed_patient_id=None,
            parsed_patient_name=None,
            parsed_document_number=None,
            parsed_document_type=None,
            patient_matching_status=PatientMatchingStatusEnum.PENDING,
            matched_patient_id=None,
            matching_confidence=None,
            matching_details=None,
            processing_status=VectorizationStatusEnum.PENDING,
            review_required=True,
            error_message="No se pudo parsear el nombre del archivo - no coincide con el patrón TecSalud"
        )
        
        # Scenario 4: Processing error - document processing failed
        batch_file4 = BatchFile(
            batch_upload_id=self.batch_upload.id,
            original_filename="3000003803_MORALES HERRERA, JOSE ANTONIO_6001467012_IMG.pdf",
            file_path="/tmp/demo_file4.pdf",
            file_size=2048000,
            content_hash="hash4",
            parsed_patient_id="3000003803",
            parsed_patient_name="MORALES HERRERA, JOSE ANTONIO",
            parsed_document_number="6001467012",
            parsed_document_type="IMG",
            patient_matching_status=PatientMatchingStatusEnum.NEW_PATIENT,
            matched_patient_id=None,
            matching_confidence=None,
            matching_details=None,
            processing_status=VectorizationStatusEnum.FAILED,
            review_required=True,
            error_message="Error al procesar el documento - archivo PDF corrupto"
        )
        
        # Scenario 5: Low confidence match - multiple candidates
        low_confidence_details = {
            "algorithm": "fuzzy_match",
            "confidence": 0.55,
            "suggestions": [
                {
                    "patient_id": 1,
                    "similarity": 0.55,
                    "name": "GARZA TIJERINA, MARIA ESTHER",
                    "match_reasons": ["Partial name match"]
                },
                {
                    "patient_id": 3,
                    "similarity": 0.52,
                    "name": "RODRIGUEZ SANCHEZ, ANA LUCIA",
                    "match_reasons": ["Similar surnames"]
                }
            ]
        }
        
        batch_file5 = BatchFile(
            batch_upload_id=self.batch_upload.id,
            original_filename="3000003804_GARZA RODRIGUEZ, MARIA CARMEN_6001467013_EMER.pdf",
            file_path="/tmp/demo_file5.pdf",
            file_size=1536000,
            content_hash="hash5",
            parsed_patient_id="3000003804",
            parsed_patient_name="GARZA RODRIGUEZ, MARIA CARMEN",
            parsed_document_number="6001467013",
            parsed_document_type="EMER",
            patient_matching_status=PatientMatchingStatusEnum.REVIEW_REQUIRED,
            matched_patient_id=1,
            matching_confidence=0.55,
            matching_details=json.dumps(low_confidence_details),
            processing_status=VectorizationStatusEnum.PENDING,
            review_required=True
        )
        
        # Add all batch files
        for batch_file in [batch_file1, batch_file2, batch_file3, batch_file4, batch_file5]:
            self.session.add(batch_file)
        
        self.session.commit()
        
        # Update batch upload statistics
        self.batch_upload.files_requiring_review = 5
        self.session.commit()
    
    def print_banner(self):
        """Print demo banner"""
        print("\n" + "="*80)
        print("🏥 TECSALUD - INTERFAZ DE REVISIÓN ADMINISTRATIVA")
        print("   Sistema de Gestión de Documentos Médicos")
        print("="*80)
        print(f"📋 Sesión de procesamiento: {self.batch_upload.session_id}")
        print(f"👤 Administrador: {self.batch_upload.uploaded_by}")
        print(f"⚙️  Tipo de procesamiento: {self.batch_upload.processing_type}")
        print("="*80)
    
    async def show_pending_reviews(self):
        """Show pending review cases"""
        print("\n📋 CASOS PENDIENTES DE REVISIÓN")
        print("-" * 50)
        
        review_cases = await self.admin_service.get_pending_reviews(
            session_id=self.batch_upload.session_id,
            db=self.session
        )
        
        if not review_cases:
            print("✅ No hay casos pendientes de revisión")
            return
        
        for i, case in enumerate(review_cases, 1):
            print(f"\n{i}. 📄 {case.filename}")
            print(f"   🆔 Archivo ID: {case.batch_file_id}")
            print(f"   👤 Paciente: {case.parsed_patient_name or 'No identificado'}")
            print(f"   📋 Expediente: {case.parsed_patient_id or 'No identificado'}")
            print(f"   📊 Tipo: {case.parsed_document_type or 'Desconocido'}")
            print(f"   🎯 Confianza: {case.matching_confidence:.2%}" if case.matching_confidence else "   🎯 Confianza: N/A")
            print(f"   ⚠️  Prioridad: {case.review_priority.upper()}")
            print(f"   🏷️  Categoría: {case.review_category}")
            
            if case.error_message:
                print(f"   ❌ Error: {case.error_message}")
            
            if case.suggested_matches:
                print(f"   🔍 Coincidencias sugeridas: {len(case.suggested_matches)}")
                for j, match in enumerate(case.suggested_matches[:2], 1):
                    print(f"      {j}. {match.get('name', 'N/A')} (ID: {match.get('patient_id', 'N/A')})")
    
    async def show_statistics(self):
        """Show review statistics"""
        print("\n📊 ESTADÍSTICAS DE REVISIÓN")
        print("-" * 50)
        
        stats = await self.admin_service.get_review_statistics(
            session_id=self.batch_upload.session_id,
            db=self.session
        )
        
        print(f"📁 Total de archivos: {stats['total_files']}")
        print(f"⏳ Requieren revisión: {stats['review_required']}")
        print(f"✅ Revisiones completadas: {stats['completed_reviews']}")
        print(f"📈 Porcentaje de revisión: {stats['review_percentage']:.1f}%")
        
        print("\n🏷️  POR CATEGORÍA:")
        for category, count in stats['categories'].items():
            if count > 0:
                category_names = {
                    'patient_match': 'Coincidencia de pacientes',
                    'parsing_error': 'Error de parseo',
                    'processing_error': 'Error de procesamiento',
                    'other': 'Otros'
                }
                print(f"   {category_names.get(category, category)}: {count}")
        
        print("\n🚥 POR PRIORIDAD:")
        for priority, count in stats['priorities'].items():
            if count > 0:
                priority_names = {
                    'high': 'Alta',
                    'medium': 'Media',
                    'low': 'Baja'
                }
                print(f"   {priority_names.get(priority, priority)}: {count}")
    
    async def interactive_review(self):
        """Interactive review process"""
        print("\n🔍 REVISIÓN INTERACTIVA")
        print("-" * 50)
        
        review_cases = await self.admin_service.get_pending_reviews(
            session_id=self.batch_upload.session_id,
            db=self.session
        )
        
        if not review_cases:
            print("✅ No hay casos pendientes de revisión")
            return
        
        for case in review_cases:
            print(f"\n📄 REVISANDO: {case.filename}")
            print(f"👤 Paciente: {case.parsed_patient_name or 'No identificado'}")
            print(f"📋 Expediente: {case.parsed_patient_id or 'No identificado'}")
            print(f"🎯 Confianza: {case.matching_confidence:.2%}" if case.matching_confidence else "🎯 Confianza: N/A")
            print(f"⚠️  Prioridad: {case.review_priority.upper()}")
            print(f"🏷️  Categoría: {case.review_category}")
            
            if case.error_message:
                print(f"❌ Error: {case.error_message}")
            
            # Show suggested matches
            if case.suggested_matches:
                print(f"\n🔍 Coincidencias sugeridas:")
                for i, match in enumerate(case.suggested_matches, 1):
                    print(f"   {i}. {match.get('name', 'N/A')} (ID: {match.get('patient_id', 'N/A')})")
                    print(f"      Similitud: {match.get('similarity', 0):.2%}")
            
            # Show decision options
            print(f"\n📋 OPCIONES DE DECISIÓN:")
            print("1. ✅ Aprobar coincidencia")
            print("2. ❌ Rechazar coincidencia (crear nuevo paciente)")
            print("3. 🔧 Coincidencia manual")
            print("4. ⏭️  Saltar archivo")
            print("5. 🔄 Reintentar procesamiento")
            print("6. 🗑️  Eliminar archivo")
            print("7. ⏭️  Continuar con siguiente")
            
            choice = input("\nSeleccione una opción (1-7): ").strip()
            
            if choice == "1":
                await self.approve_match(case.batch_file_id)
            elif choice == "2":
                await self.reject_match(case.batch_file_id)
            elif choice == "3":
                await self.manual_match(case.batch_file_id)
            elif choice == "4":
                await self.skip_file(case.batch_file_id)
            elif choice == "5":
                await self.retry_processing(case.batch_file_id)
            elif choice == "6":
                await self.delete_file(case.batch_file_id)
            elif choice == "7":
                continue
            else:
                print("❌ Opción no válida")
                continue
            
            print("-" * 50)
    
    async def approve_match(self, batch_file_id):
        """Approve a patient match"""
        decision = AdminDecision(
            decision=AdminDecisionEnum.APPROVE_MATCH,
            admin_notes="Aprobado por administrador en demo interactiva",
            reviewed_by="admin_demo"
        )
        
        result = await self.admin_service.process_admin_decision(
            batch_file_id=batch_file_id,
            decision=decision,
            db=self.session
        )
        
        if result["success"]:
            print(f"✅ {result['message']}")
            print(f"   👤 Paciente ID: {result['patient_id']}")
            print(f"   📄 Documento ID: {result['document_id']}")
        else:
            print(f"❌ {result['message']}")
    
    async def reject_match(self, batch_file_id):
        """Reject match and create new patient"""
        decision = AdminDecision(
            decision=AdminDecisionEnum.REJECT_MATCH,
            admin_notes="Rechazado por administrador - crear nuevo paciente",
            reviewed_by="admin_demo"
        )
        
        result = await self.admin_service.process_admin_decision(
            batch_file_id=batch_file_id,
            decision=decision,
            db=self.session
        )
        
        if result["success"]:
            print(f"✅ {result['message']}")
            print(f"   👤 Nuevo paciente ID: {result['patient_id']}")
            print(f"   📄 Documento ID: {result['document_id']}")
        else:
            print(f"❌ {result['message']}")
    
    async def manual_match(self, batch_file_id):
        """Manual patient matching"""
        print("\n🔍 BÚSQUEDA DE PACIENTES")
        search_query = input("Ingrese nombre o ID del paciente: ").strip()
        
        if not search_query:
            print("❌ Búsqueda cancelada")
            return
        
        # Simple search in existing patients
        patients = self.session.query(Patient).filter(
            Patient.name.like(f"%{search_query}%")
        ).all()
        
        if not patients:
            print("❌ No se encontraron pacientes")
            return
        
        print(f"\n📋 Pacientes encontrados:")
        for i, patient in enumerate(patients, 1):
            print(f"   {i}. {patient.name} (ID: {patient.id}, Exp: {patient.medical_record_number})")
        
        try:
            choice = int(input("\nSeleccione paciente (número): ").strip())
            if 1 <= choice <= len(patients):
                selected_patient = patients[choice - 1]
                
                decision = AdminDecision(
                    decision=AdminDecisionEnum.MANUAL_MATCH,
                    selected_patient_id=selected_patient.id,
                    admin_notes=f"Coincidencia manual con {selected_patient.name}",
                    reviewed_by="admin_demo"
                )
                
                result = await self.admin_service.process_admin_decision(
                    batch_file_id=batch_file_id,
                    decision=decision,
                    db=self.session
                )
                
                if result["success"]:
                    print(f"✅ {result['message']}")
                    print(f"   👤 Paciente ID: {result['patient_id']}")
                    print(f"   📄 Documento ID: {result['document_id']}")
                else:
                    print(f"❌ {result['message']}")
            else:
                print("❌ Selección no válida")
        except ValueError:
            print("❌ Selección no válida")
    
    async def skip_file(self, batch_file_id):
        """Skip processing a file"""
        reason = input("Motivo para saltar el archivo (opcional): ").strip()
        
        decision = AdminDecision(
            decision=AdminDecisionEnum.SKIP_FILE,
            admin_notes=reason or "Saltado por administrador",
            reviewed_by="admin_demo"
        )
        
        result = await self.admin_service.process_admin_decision(
            batch_file_id=batch_file_id,
            decision=decision,
            db=self.session
        )
        
        if result["success"]:
            print(f"✅ {result['message']}")
        else:
            print(f"❌ {result['message']}")
    
    async def retry_processing(self, batch_file_id):
        """Retry processing a file"""
        decision = AdminDecision(
            decision=AdminDecisionEnum.RETRY_PROCESSING,
            admin_notes="Reintento solicitado por administrador",
            reviewed_by="admin_demo"
        )
        
        result = await self.admin_service.process_admin_decision(
            batch_file_id=batch_file_id,
            decision=decision,
            db=self.session
        )
        
        if result["success"]:
            print(f"✅ {result['message']}")
            if result.get('document_id'):
                print(f"   📄 Documento ID: {result['document_id']}")
        else:
            print(f"❌ {result['message']}")
    
    async def delete_file(self, batch_file_id):
        """Delete a file from batch"""
        confirm = input("¿Está seguro de eliminar este archivo? (y/N): ").strip().lower()
        
        if confirm == 'y':
            decision = AdminDecision(
                decision=AdminDecisionEnum.DELETE_FILE,
                admin_notes="Eliminado por administrador",
                reviewed_by="admin_demo"
            )
            
            result = await self.admin_service.process_admin_decision(
                batch_file_id=batch_file_id,
                decision=decision,
                db=self.session
            )
            
            if result["success"]:
                print(f"✅ {result['message']}")
            else:
                print(f"❌ {result['message']}")
        else:
            print("❌ Eliminación cancelada")
    
    async def bulk_approve_demo(self):
        """Demonstrate bulk approval"""
        print("\n🚀 APROBACIÓN MASIVA")
        print("-" * 50)
        print("Esta función aprueba automáticamente coincidencias con alta confianza")
        
        threshold = input("Ingrese umbral de confianza (0.8-1.0, default 0.9): ").strip()
        try:
            threshold = float(threshold) if threshold else 0.9
            if not 0.8 <= threshold <= 1.0:
                threshold = 0.9
        except ValueError:
            threshold = 0.9
        
        result = await self.admin_service.bulk_approve_high_confidence_matches(
            session_id=self.batch_upload.session_id,
            confidence_threshold=threshold,
            db=self.session
        )
        
        print(f"\n✅ Aprobación masiva completada:")
        print(f"   🎯 Umbral de confianza: {threshold:.1%}")
        print(f"   ✅ Archivos aprobados: {result['approved_count']}")
        print(f"   ❌ Archivos fallidos: {result['failed_count']}")
    
    async def main_menu(self):
        """Main interactive menu"""
        while True:
            print("\n🎛️  MENÚ PRINCIPAL")
            print("-" * 30)
            print("1. 📋 Ver casos pendientes")
            print("2. 📊 Ver estadísticas")
            print("3. 🔍 Revisión interactiva")
            print("4. 🚀 Aprobación masiva")
            print("5. 🔄 Actualizar datos")
            print("6. 🚪 Salir")
            
            choice = input("\nSeleccione una opción (1-6): ").strip()
            
            if choice == "1":
                await self.show_pending_reviews()
            elif choice == "2":
                await self.show_statistics()
            elif choice == "3":
                await self.interactive_review()
            elif choice == "4":
                await self.bulk_approve_demo()
            elif choice == "5":
                print("🔄 Actualizando datos...")
                await asyncio.sleep(1)
                print("✅ Datos actualizados")
            elif choice == "6":
                print("👋 ¡Hasta luego!")
                break
            else:
                print("❌ Opción no válida")
    
    async def run(self):
        """Run the interactive demo"""
        self.print_banner()
        await self.main_menu()
        
        # Cleanup
        self.session.close()
        print("\n🧹 Limpieza completada")


async def main():
    """Main function"""
    demo = AdminReviewDemo()
    await demo.run()


if __name__ == "__main__":
    asyncio.run(main()) 