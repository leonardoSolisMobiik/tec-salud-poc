# 📚 Guía de Vectorización de Expedientes Médicos

Sistema para vectorizar expedientes médicos y agregarlos al motor de búsqueda inteligente de TecSalud.

## 🎯 Opciones Disponibles

### 1. 📤 API Individual (Subir 1 archivo)
### 2. 🔄 Script en Lote (Subir múltiples archivos)
### 3. 🌐 Frontend Web (Próximamente)

---

## 📤 **Opción 1: API Individual**

### Endpoint: `POST /api/v1/documents/upload`

```bash
curl -X POST "http://localhost:8000/api/v1/documents/upload" \
  -F "file=@expediente_paciente.pdf" \
  -F "patient_id=PAT001" \
  -F "document_type=expediente_medico" \
  -F "title=Expediente Juan Pérez"
```

### Ejemplo con Python:
```python
import requests

url = "http://localhost:8000/api/v1/documents/upload"
files = {"file": open("expediente.pdf", "rb")}
data = {
    "patient_id": "PAT001",
    "document_type": "laboratorio",
    "title": "Laboratorios Enero 2024"
}

response = requests.post(url, files=files, data=data)
print(response.json())
```

---

## 🔄 **Opción 2: Script de Vectorización en Lote**

### Preparación:

1. **Instalar dependencias adicionales:**
```bash
cd backend
pip install -r scripts/requirements_vectorization.txt
```

2. **Organizar documentos:**
```
mi_directorio_expedientes/
├── expediente_andrea_perez.pdf
├── laboratorios_arturo_herrera.docx
├── radiologia_pedro_morales.pdf
├── subcarpeta/
│   ├── mas_documentos.pdf
│   └── estudios_especiales.txt
```

3. **Crear mapeo de pacientes (opcional):**
```bash
cp scripts/patient_mapping_example.json mi_mapeo_pacientes.json
# Editar mi_mapeo_pacientes.json con tus datos
```

### Uso Básico:

```bash
cd backend
python scripts/vectorize_documents.py /ruta/a/mis/expedientes
```

### Uso Avanzado:

```bash
python scripts/vectorize_documents.py \
    /ruta/a/mis/expedientes \
    --mapping mi_mapeo_pacientes.json \
    --type "expediente_medico" \
    --verify
```

### Parámetros:

- `directory`: Directorio con documentos (requerido)
- `--mapping`: Archivo JSON con mapeo filename → patient_id
- `--type`: Tipo de documento por defecto (`expediente_medico`)
- `--verify`: Ejecutar verificación después del procesamiento

### Salida:

```
🚀 Iniciando vectorización masiva...
📁 Encontrados 25 archivos para procesar
✅ Procesado: expediente_andrea_perez.pdf -> DOC_PAT001_1704732123_a1b2c3d4
✅ Procesado: laboratorios_arturo.docx -> DOC_PAT002_1704732124_e5f6g7h8
📊 Progreso: 10 procesados, 0 errores

📊 RESUMEN DE VECTORIZACIÓN
============================================================
Total de archivos: 25
Procesados exitosamente: 24
Errores: 1
Omitidos: 0
Tiempo total: 45.32s
Tiempo promedio por archivo: 1.81s

📄 Resumen detallado guardado en: vectorization_summary_1704732123.json
```

---

## 📋 **Formatos Soportados**

| Formato | Extensión | Extracción | Calidad |
|---------|-----------|------------|---------|
| PDF | `.pdf` | PyPDF2 | ⭐⭐⭐⭐ |
| Word | `.docx` | python-docx | ⭐⭐⭐⭐⭐ |
| Word Legacy | `.doc` | Limitado | ⭐⭐ |
| Texto Plano | `.txt` | Nativo | ⭐⭐⭐⭐⭐ |

---

## 🎯 **Tipos de Documento Recomendados**

```json
{
  "expediente_medico": "Expediente completo del paciente",
  "laboratorio": "Resultados de laboratorio",
  "radiologia": "Estudios radiológicos",
  "consulta": "Notas de consulta médica",
  "cirugia": "Reportes quirúrgicos",
  "farmacia": "Prescripciones y medicamentos",
  "enfermeria": "Notas de enfermería",
  "especialidad": "Consultas de especialistas"
}
```

---

## 🔍 **Verificar Vectorización**

### Búsqueda de Prueba:
```bash
curl "http://localhost:8000/api/v1/documents/search" \
  -H "Content-Type: application/json" \
  -d '{"query": "diabetes", "limit": 5}'
```

### Ver Documentos por Paciente:
```bash
curl "http://localhost:8000/api/v1/documents/?patient_id=PAT001"
```

### Información de la Colección:
```python
import asyncio
from app.services.chroma_service import chroma_service

async def check_collection():
    await chroma_service.initialize()
    info = await chroma_service.get_collection_info()
    print(f"Documentos en la colección: {info['document_count']}")

asyncio.run(check_collection())
```

---

## 🎛️ **Configuración Avanzada**

### Variables de Entorno (.env):

```env
# Vector Database
CHROMA_PERSIST_DIRECTORY=./data/vectordb
CHROMA_COLLECTION_NAME=expedientes_medicos

# Azure OpenAI (para embeddings)
AZURE_OPENAI_API_KEY=tu_api_key
AZURE_OPENAI_ENDPOINT=https://tu-endpoint.openai.azure.com/
EMBEDDING_DEPLOYMENT_NAME=text-embedding-3-large

# Documentos
MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_DIRECTORY=./data/pdfs
```

### Personalizar Chunking:

```python
# En chroma_service.py, método _chunk_document
chunk_size = 1000  # Caracteres por chunk
overlap = 200      # Solapamiento entre chunks
```

---

## 🚨 **Solución de Problemas**

### Error: "No module named 'PyPDF2'"
```bash
pip install PyPDF2 python-docx
```

### Error: "Chroma service not initialized"
```bash
# Verificar que el directorio de Chroma existe
ls -la data/vectordb/
# Si no existe, crear:
mkdir -p data/vectordb
```

### Error: "Azure OpenAI service error"
```bash
# Verificar variables de entorno
echo $AZURE_OPENAI_API_KEY
echo $AZURE_OPENAI_ENDPOINT
```

### Documentos no aparecen en búsquedas:
1. **Verificar procesamiento:**
   ```bash
   tail -f vectorization.log
   ```

2. **Probar búsqueda directa:**
   ```python
   # Buscar por document_id específico
   curl "http://localhost:8000/api/v1/documents/DOC_PAT001_..."
   ```

3. **Verificar embeddings:**
   ```python
   # Los embeddings deben generarse automáticamente
   # Si hay errores, revisar conexión Azure OpenAI
   ```

---

## 📊 **Monitoreo y Logs**

### Logs de Vectorización:
```bash
tail -f vectorization.log
```

### Logs del Sistema:
```bash
tail -f logs/tecsalud.log
```

### Métricas de Performance:
- **Tiempo promedio**: 1-3 segundos por documento
- **Throughput**: 20-60 documentos por minuto
- **Tamaño de chunks**: ~1000 caracteres + 200 overlap

---

## 🔄 **Actualización y Mantenimiento**

### Re-vectorizar Documentos:
```bash
# Eliminar documento existente
curl -X DELETE "http://localhost:8000/api/v1/documents/DOC_ID"

# Volver a procesar
python scripts/vectorize_documents.py nueva_version/
```

### Backup de Vector Database:
```bash
# Copia de seguridad
cp -r data/vectordb data/vectordb_backup_$(date +%Y%m%d)
```

### Limpiar Colección:
```python
# ⚠️ CUIDADO: Elimina todos los documentos
from app.services.chroma_service import chroma_service
import asyncio

async def reset_collection():
    await chroma_service.initialize()
    chroma_service.client.delete_collection("expedientes_medicos")
    print("Colección eliminada")

# Solo si estás seguro:
# asyncio.run(reset_collection())
```

---

## 🎯 **Mejores Prácticas**

1. **Nombrado de Archivos:**
   - Usar nombres descriptivos: `expediente_juan_perez_2024.pdf`
   - Incluir ID de paciente en el nombre cuando sea posible
   - Evitar caracteres especiales: `&`, `#`, espacios múltiples

2. **Organización:**
   - Agrupar por paciente o por tipo de documento
   - Usar subdirectorios para organización
   - Mantener estructura consistente

3. **Metadatos:**
   - Crear mapeo detallado patient_id ↔ filename
   - Usar tipos de documento específicos
   - Incluir fechas en nombres de archivo cuando sea relevante

4. **Performance:**
   - Procesar en lotes de 50-100 documentos
   - Ejecutar vectorización en horarios de baja actividad
   - Monitorear uso de memoria y CPU

5. **Seguridad:**
   - Verificar que documentos no contengan información sensible expuesta
   - Usar patient_id en lugar de nombres reales cuando sea posible
   - Configurar backup automático de la vector database

---

## 📞 **Soporte**

Si encuentras problemas:

1. **Revisar logs**: `vectorization.log` y `logs/tecsalud.log`
2. **Verificar dependencias**: `pip list | grep -E "(PyPDF2|docx|chroma)"`
3. **Probar conexiones**: Azure OpenAI y Chroma DB
4. **Ejecutar verificación**: `--verify` en el script

**¡El sistema está listo para vectorizar tus expedientes médicos!** 🚀 