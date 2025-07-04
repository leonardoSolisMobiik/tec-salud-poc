"""
Seed Database with Dummy Data
Script to populate the database with test data for TecSalud
"""

import asyncio
import random
from datetime import datetime, timedelta, date
from sqlalchemy.orm import Session

from app.core.database import SessionLocal, engine
from app.db.models import (
    Base, Doctor, Patient, PatientInteraction, VitalSign, 
    MedicalDocument, Diagnosis, Treatment,
    GenderEnum, BloodTypeEnum, DocumentTypeEnum, StatusEnum
)


# Mexican names for realistic data
FIRST_NAMES_MALE = [
    "Carlos", "José", "Juan", "Miguel", "Luis", "Fernando", "Alejandro",
    "Ricardo", "Eduardo", "Roberto", "Antonio", "Francisco", "Javier",
    "Arturo", "Daniel", "Pedro", "Jorge", "Raúl", "Alberto", "Sergio"
]

FIRST_NAMES_FEMALE = [
    "María", "Ana", "Laura", "Patricia", "Carmen", "Rosa", "Daniela",
    "Sofía", "Andrea", "Gabriela", "Alejandra", "Mariana", "Claudia",
    "Elena", "Beatriz", "Lucía", "Isabel", "Victoria", "Mónica", "Adriana"
]

LAST_NAMES = [
    "García", "Rodríguez", "Martínez", "Hernández", "López", "González",
    "Pérez", "Sánchez", "Ramírez", "Torres", "Flores", "Rivera", "Gómez",
    "Díaz", "Cruz", "Morales", "Reyes", "Jiménez", "Ruiz", "Herrera"
]

# Medical conditions for variety
CONDITIONS = [
    "Hipertensión arterial", "Diabetes tipo 2", "Asma bronquial",
    "Gastritis crónica", "Migraña", "Artritis reumatoide",
    "Hipotiroidismo", "Ansiedad generalizada", "Lumbalgia crónica",
    "Rinitis alérgica", "Reflujo gastroesofágico", "Fibromialgia"
]

# Common medications
MEDICATIONS = [
    "Metformina 850mg", "Losartán 50mg", "Omeprazol 20mg",
    "Paracetamol 500mg", "Ibuprofeno 400mg", "Atorvastatina 20mg",
    "Levotiroxina 100mcg", "Salbutamol inhalador", "Sertralina 50mg",
    "Loratadina 10mg", "Amoxicilina 500mg", "Diclofenaco 50mg"
]


def generate_phone():
    """Generate Mexican phone number"""
    return f"52{random.randint(1000000000, 9999999999)}"


def generate_email(name):
    """Generate email from name"""
    domains = ["gmail.com", "hotmail.com", "outlook.com", "yahoo.com"]
    clean_name = name.lower().replace(" ", ".")
    return f"{clean_name}@{random.choice(domains)}"


def generate_address():
    """Generate Mexican address"""
    streets = ["Reforma", "Juárez", "Independencia", "Revolución", "Hidalgo"]
    colonies = ["Centro", "Roma Norte", "Polanco", "Condesa", "Del Valle"]
    cities = ["CDMX", "Guadalajara", "Monterrey", "Puebla", "Querétaro"]
    
    return f"Calle {random.choice(streets)} {random.randint(1, 999)}, Col. {random.choice(colonies)}, {random.choice(cities)}"


def create_doctor(db: Session):
    """Create the main doctor"""
    doctor = Doctor(
        email="dr.solis@tecsalud.mx",
        name="Dr. Leonardo Solis",
        specialty="Medicina Interna",
        license_number="MED123456",
        phone=generate_phone()
    )
    db.add(doctor)
    db.commit()
    db.refresh(doctor)
    return doctor


def create_patients(db: Session, doctor: Doctor, count: int = 20):
    """Create dummy patients"""
    patients = []
    
    for i in range(count):
        # Randomly choose gender
        is_male = random.choice([True, False])
        
        if is_male:
            first_name = random.choice(FIRST_NAMES_MALE)
            gender = GenderEnum.MALE
        else:
            first_name = random.choice(FIRST_NAMES_FEMALE)
            gender = GenderEnum.FEMALE
        
        last_name = f"{random.choice(LAST_NAMES)} {random.choice(LAST_NAMES)}"
        full_name = f"{first_name} {last_name}"
        
        # Generate birth date (ages 18-85)
        age = random.randint(18, 85)
        birth_date = date.today() - timedelta(days=age*365 + random.randint(0, 364))
        
        # Random status
        status = random.choice(list(StatusEnum))
        
        patient = Patient(
            medical_record_number=f"EXP-{2024000 + i}",
            name=full_name,
            birth_date=birth_date,
            gender=gender,
            blood_type=random.choice(list(BloodTypeEnum)),
            phone=generate_phone(),
            email=generate_email(full_name),
            address=generate_address(),
            emergency_contact=f"{random.choice(FIRST_NAMES_MALE + FIRST_NAMES_FEMALE)} {random.choice(LAST_NAMES)} - {generate_phone()}",
            insurance_number=f"INS{random.randint(100000, 999999)}",
            status=status,
            doctor_id=doctor.id
        )
        
        db.add(patient)
        patients.append(patient)
    
    db.commit()
    return patients


def create_medical_history(db: Session, patients: list):
    """Create medical history for patients"""
    
    for patient in patients:
        # Add some vital signs
        for _ in range(random.randint(1, 5)):
            days_ago = random.randint(0, 365)
            vital_sign = VitalSign(
                patient_id=patient.id,
                systolic_bp=random.randint(110, 140),
                diastolic_bp=random.randint(70, 90),
                heart_rate=random.randint(60, 90),
                temperature=round(random.uniform(36.0, 37.5), 1),
                respiratory_rate=random.randint(12, 20),
                oxygen_saturation=random.randint(95, 100),
                weight=round(random.uniform(50, 100), 1),
                height=random.randint(150, 190),
                measured_at=datetime.now() - timedelta(days=days_ago),
                measured_by="Dr. Leonardo Solis"
            )
            db.add(vital_sign)
        
        # Add diagnoses
        num_diagnoses = random.randint(1, 3)
        patient_conditions = random.sample(CONDITIONS, num_diagnoses)
        
        for condition in patient_conditions:
            diagnosis = Diagnosis(
                patient_id=patient.id,
                description=condition,
                diagnosis_type="primary",
                confidence=round(random.uniform(0.7, 0.95), 2),
                diagnosed_by="Dr. Leonardo Solis",
                diagnosed_at=datetime.now() - timedelta(days=random.randint(30, 365)),
                notes=f"Paciente presenta síntomas característicos de {condition}"
            )
            db.add(diagnosis)
            db.flush()  # To get the diagnosis ID
            
            # Add treatment for each diagnosis
            treatment = Treatment(
                patient_id=patient.id,
                diagnosis_id=diagnosis.id,
                treatment_type="medication",
                description=random.choice(MEDICATIONS),
                dosage="1 tableta",
                frequency="Cada 12 horas",
                duration="30 días",
                prescribed_by="Dr. Leonardo Solis",
                prescribed_at=diagnosis.diagnosed_at,
                start_date=diagnosis.diagnosed_at.date(),
                notes="Tomar con alimentos"
            )
            db.add(treatment)
        
        # Add some documents
        doc_types = random.sample(list(DocumentTypeEnum), random.randint(2, 4))
        for doc_type in doc_types:
            document = MedicalDocument(
                patient_id=patient.id,
                document_type=doc_type,
                title=f"{doc_type.value.replace('_', ' ').title()} - {patient.name}",
                content=f"Contenido del documento {doc_type.value} para el paciente {patient.name}",
                created_by="Dr. Leonardo Solis",
                created_at=datetime.now() - timedelta(days=random.randint(0, 180))
            )
            db.add(document)
    
    db.commit()


def create_interactions(db: Session, doctor: Doctor, patients: list):
    """Create patient interactions to simulate recent activity"""
    
    # Select 12 random patients for recent interactions
    recent_patients = random.sample(patients, min(12, len(patients)))
    
    for i, patient in enumerate(recent_patients):
        # Create interactions with varying recency
        # More recent patients have interactions in the last few days
        if i < 5:  # Very recent (last 3 days)
            days_ago = random.randint(0, 3)
        elif i < 8:  # Recent (last week)
            days_ago = random.randint(4, 7)
        else:  # Less recent (last month)
            days_ago = random.randint(8, 30)
        
        # Create 1-3 interactions per patient
        for _ in range(random.randint(1, 3)):
            interaction_type = random.choice(['chat', 'view', 'update'])
            
            interaction = PatientInteraction(
                patient_id=patient.id,
                doctor_id=doctor.id,
                interaction_type=interaction_type,
                interaction_summary=f"Doctor {interaction_type} expediente del paciente {patient.name}",
                duration_seconds=random.randint(60, 1800),  # 1-30 minutes
                created_at=datetime.now() - timedelta(days=days_ago, hours=random.randint(0, 23))
            )
            db.add(interaction)
            
            # Add an extra interaction for very recent patients
            if i < 3 and random.choice([True, False]):
                extra_interaction = PatientInteraction(
                    patient_id=patient.id,
                    doctor_id=doctor.id,
                    interaction_type='chat',
                    interaction_summary=f"Consulta de seguimiento con {patient.name}",
                    duration_seconds=random.randint(300, 900),
                    created_at=datetime.now() - timedelta(hours=random.randint(1, 48))
                )
                db.add(extra_interaction)
    
    db.commit()


def seed_database():
    """Main function to seed the database"""
    print("🌱 Starting database seeding...")
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    print("✅ Tables created")
    
    # Create session
    db = SessionLocal()
    
    try:
        # Check if data already exists
        existing_doctor = db.query(Doctor).first()
        if existing_doctor:
            print("⚠️  Database already contains data. Skipping seed.")
            return
        
        # Create doctor
        doctor = create_doctor(db)
        print(f"✅ Created doctor: {doctor.name}")
        
        # Create patients
        patients = create_patients(db, doctor, 20)
        print(f"✅ Created {len(patients)} patients")
        
        # Create medical history
        create_medical_history(db, patients)
        print("✅ Created medical history (vital signs, diagnoses, treatments, documents)")
        
        # Create interactions
        create_interactions(db, doctor, patients)
        print("✅ Created patient interactions")
        
        print("\n🎉 Database seeding completed successfully!")
        print(f"\nSummary:")
        print(f"- 1 Doctor: {doctor.name}")
        print(f"- {len(patients)} Patients")
        print(f"- Multiple vital signs, diagnoses, treatments, and documents per patient")
        print(f"- Recent interactions to populate 'Pacientes Recientes'")
        
    except Exception as e:
        print(f"❌ Error seeding database: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()