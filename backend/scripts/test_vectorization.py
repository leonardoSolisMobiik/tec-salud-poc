#!/usr/bin/env python3
"""
Script de Prueba para Vectorización de Documentos
Crea documentos de ejemplo y demuestra la vectorización
"""

import asyncio
import tempfile
import json
from pathlib import Path
import sys

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from app.services.chroma_service import chroma_service

async def create_test_documents():
    """Crear documentos de prueba para vectorización"""
    
    # Crear directorio temporal
    temp_dir = tempfile.mkdtemp(prefix="tecsalud_test_")
    temp_path = Path(temp_dir)
    
    print(f"📁 Creando documentos de prueba en: {temp_path}")
    
    # Documento 1: Expediente médico
    doc1_content = """
    EXPEDIENTE MÉDICO - PACIENTE: ANDREA PÉREZ GARCÍA
    
    Fecha: 15 de Enero 2024
    Edad: 24 años
    Género: Femenino
    
    MOTIVO DE CONSULTA:
    Paciente acude por dolor abdominal de 3 días de evolución, localizado en epigastrio,
    de intensidad moderada a severa, acompañado de náuseas y vómito.
    
    ANTECEDENTES:
    - Sin antecedentes patológicos de importancia
    - No alergias conocidas
    - No medicamentos crónicos
    
    EXPLORACIÓN FÍSICA:
    - Signos vitales estables
    - Abdomen: dolor a la palpación en epigastrio
    - Resto de exploración sin alteraciones
    
    PLAN:
    - Laboratorios: BH, QS, amilasa, lipasa
    - USG abdominal
    - Analgesia sintomática
    - Dieta blanda
    
    DIAGNÓSTICO PRESUNTIVO:
    Dolor abdominal epigástrico, descartar pancreatitis aguda
    """
    
    # Documento 2: Laboratorios
    doc2_content = """
    LABORATORIOS CLÍNICOS - ARTURO HERRERA SÁNCHEZ
    
    Fecha: 20 de Enero 2024
    Paciente: 36 años, masculino
    
    BIOMETRÍA HEMÁTICA:
    - Hemoglobina: 14.2 g/dL (Normal: 13.5-17.5)
    - Hematocrito: 42% (Normal: 41-53%)
    - Leucocitos: 8,500/μL (Normal: 4,500-11,000)
    - Plaquetas: 280,000/μL (Normal: 150,000-450,000)
    
    QUÍMICA SANGUÍNEA:
    - Glucosa: 95 mg/dL (Normal: 70-100)
    - Creatinina: 1.0 mg/dL (Normal: 0.7-1.3)
    - BUN: 15 mg/dL (Normal: 7-20)
    - Colesterol total: 180 mg/dL (Deseable: <200)
    - Triglicéridos: 120 mg/dL (Normal: <150)
    
    INTERPRETACIÓN:
    Resultados de laboratorio dentro de parámetros normales.
    Control en 6 meses para seguimiento.
    """
    
    # Documento 3: Cardiología
    doc3_content = """
    CONSULTA DE CARDIOLOGÍA - PEDRO PÉREZ MORALES
    
    Fecha: 25 de Enero 2024
    Paciente: 30 años, masculino
    
    MOTIVO DE CONSULTA:
    Dolor precordial atípico de 2 semanas de evolución
    
    ANTECEDENTES:
    - Hipertensión arterial diagnosticada hace 1 año
    - Tratamiento: Losartán 50mg/día
    - Padre con infarto del miocardio a los 55 años
    
    EXPLORACIÓN CARDIOVASCULAR:
    - FC: 72 lpm, regular
    - TA: 130/85 mmHg
    - Ruidos cardiacos rítmicos, sin soplos
    - Pulsos periféricos presentes y simétricos
    
    ELECTROCARDIOGRAMA:
    Ritmo sinusal, FC 72 lpm, sin alteraciones agudas
    
    PLAN:
    - Ecocardiograma transtorácico
    - Prueba de esfuerzo
    - Continuar antihipertensivo
    - Control en 4 semanas
    
    DIAGNÓSTICO:
    Dolor torácico atípico en paciente hipertenso
    Descartar cardiopatía isquémica
    """
    
    # Crear archivos
    documents = [
        ("expediente_andrea_perez.txt", doc1_content),
        ("laboratorios_arturo_herrera.txt", doc2_content),
        ("cardiologia_pedro_morales.txt", doc3_content)
    ]
    
    for filename, content in documents:
        file_path = temp_path / filename
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Creado: {filename}")
    
    # Crear archivo de mapeo
    mapping = {
        "expediente_andrea_perez.txt": "PAT001",
        "laboratorios_arturo_herrera.txt": "PAT002", 
        "cardiologia_pedro_morales.txt": "PAT003"
    }
    
    mapping_file = temp_path / "patient_mapping.json"
    with open(mapping_file, 'w', encoding='utf-8') as f:
        json.dump(mapping, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Creado mapeo: {mapping_file}")
    
    return temp_path, mapping_file

async def test_vectorization():
    """Probar la vectorización de documentos"""
    
    print("🧪 PRUEBA DE VECTORIZACIÓN DE DOCUMENTOS")
    print("=" * 50)
    
    # Crear documentos de prueba
    temp_dir, mapping_file = await create_test_documents()
    
    # Inicializar Chroma
    print("\n🔧 Inicializando servicios...")
    try:
        await chroma_service.initialize()
        print("✅ Chroma inicializado correctamente")
    except Exception as e:
        print(f"❌ Error inicializando Chroma: {e}")
        return
    
    # Importar el vectorizador
    try:
        from vectorize_documents import DocumentVectorizer
        vectorizer = DocumentVectorizer()
        await vectorizer.initialize()
        print("✅ Vectorizador inicializado")
    except Exception as e:
        print(f"❌ Error importando vectorizador: {e}")
        print("💡 Asegúrate de ejecutar desde el directorio backend/")
        return
    
    # Ejecutar vectorización
    print(f"\n🔄 Vectorizando documentos desde: {temp_dir}")
    try:
        summary = await vectorizer.vectorize_directory(
            directory_path=str(temp_dir),
            patient_mapping_file=str(mapping_file),
            document_type="test_document"
        )
        
        print("\n📊 RESULTADOS:")
        print(f"Total procesados: {summary['processed']}")
        print(f"Errores: {summary['errors']}")
        print(f"Tiempo: {summary['elapsed_time']}")
        
    except Exception as e:
        print(f"❌ Error en vectorización: {e}")
        return
    
    # Verificar vectorización
    print("\n🔍 Verificando vectorización...")
    try:
        verification = await vectorizer.verify_vectorization("dolor abdominal")
        print(f"Documentos en colección: {verification.get('total_documents', 'Error')}")
        print(f"Resultados de búsqueda: {verification.get('test_search_results', 'Error')}")
        
        # Mostrar algunos resultados
        sample_results = verification.get('sample_results', [])
        if sample_results:
            print("\n📋 Ejemplos de resultados:")
            for i, result in enumerate(sample_results[:2], 1):
                print(f"{i}. Paciente: {result['patient_id']}")
                print(f"   Score: {result['score']:.3f}")
                print(f"   Preview: {result['preview']}")
                print()
        
    except Exception as e:
        print(f"❌ Error en verificación: {e}")
    
    # Probar búsquedas específicas
    print("\n🔍 Probando búsquedas temáticas...")
    test_queries = [
        "dolor abdominal",
        "laboratorios normales", 
        "hipertensión arterial",
        "electrocardiograma"
    ]
    
    for query in test_queries:
        try:
            results = await chroma_service.search_documents(
                query=query,
                n_results=3
            )
            
            relevant_results = [r for r in results if r.get('score', 0) > 0.7]
            print(f"• '{query}': {len(relevant_results)} resultados relevantes")
            
        except Exception as e:
            print(f"• '{query}': Error - {e}")
    
    # Limpiar archivos temporales
    print(f"\n🧹 Limpiando archivos temporales: {temp_dir}")
    import shutil
    shutil.rmtree(temp_dir)
    
    print("\n✅ PRUEBA COMPLETADA")
    print("\n💡 Para vectorizar tus expedientes reales:")
    print(f"   python scripts/vectorize_documents.py /ruta/a/tus/documentos")

if __name__ == "__main__":
    asyncio.run(test_vectorization()) 