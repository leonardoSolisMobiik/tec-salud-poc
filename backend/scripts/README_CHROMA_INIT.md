# 🚀 Script de Inicialización de ChromaDB

Script dedicado para inicializar y gestionar las colecciones de ChromaDB en TecSalud.

## 📋 **Funcionalidades**

### ✅ **Inicialización**
- Crear colecciones por defecto de TecSalud
- Verificar conexión con ChromaDB
- Configurar embeddings automáticamente

### 🔍 **Gestión**
- Listar colecciones existentes
- Obtener información detallada de colecciones
- Verificar estado de todas las colecciones
- Eliminar colecciones específicas

### 🔄 **Mantenimiento**
- Recrear colecciones desde cero
- Backup automático antes de eliminar
- Logs detallados de operaciones

---

## 🛠️ **Uso del Script**

### **Inicialización Básica**
```bash
cd backend
python scripts/init_chroma_collections.py
```

### **Inicialización con Recreación**
```bash
python scripts/init_chroma_collections.py --recreate
```

### **Listar Colecciones**
```bash
python scripts/init_chroma_collections.py --action list
```

### **Información de Colección Específica**
```bash
python scripts/init_chroma_collections.py --action info --collection expedientes_medicos
```

### **Verificar Estado General**
```bash
python scripts/init_chroma_collections.py --action verify
```

### **Eliminar Colección (⚠️ Cuidado)**
```bash
python scripts/init_chroma_collections.py --action delete --collection nombre_coleccion
```

### **Recrear Todas las Colecciones (⚠️ Cuidado)**
```bash
python scripts/init_chroma_collections.py --action recreate
```

---

## 📚 **Colecciones por Defecto**

El script crea automáticamente estas colecciones:

| Colección | Propósito | Contenido |
|-----------|-----------|-----------|
| `expedientes_medicos` | Principal | Expedientes completos de pacientes |
| `laboratorios_clinicos` | Laboratorios | Resultados de análisis clínicos |
| `imagenes_medicas` | Imágenes | Reportes de radiología y estudios |
| `consultas_medicas` | Consultas | Notas de consulta médica |
| `documentos_administrativos` | Admin | Documentos administrativos |

---

## 🔧 **Configuración**

### **Variables de Entorno** (`.env`)
```env
# ChromaDB Configuration
CHROMA_PERSIST_DIRECTORY=./data/vectordb
CHROMA_COLLECTION_NAME=expedientes_medicos

# Azure OpenAI (para embeddings)
AZURE_OPENAI_API_KEY=tu_api_key
AZURE_OPENAI_ENDPOINT=https://tu-endpoint.openai.azure.com/
EMBEDDING_DEPLOYMENT_NAME=text-embedding-3-large
```

### **Dependencias**
```bash
pip install chromadb openai python-dotenv
```

---

## 📊 **Ejemplos de Salida**

### **Inicialización Exitosa**
```
🚀 Inicializando colecciones por defecto...
✅ Servicio ChromaDB inicializado correctamente
🏗️ Creando colección: expedientes_medicos
✅ Colección 'expedientes_medicos' creada exitosamente
🏗️ Creando colección: laboratorios_clinicos
✅ Colección 'laboratorios_clinicos' creada exitosamente

📋 Resumen de inicialización:
✅ expedientes_medicos: creada
✅ laboratorios_clinicos: creada
✅ imagenes_medicas: creada
✅ consultas_medicas: creada
✅ documentos_administrativos: creada
🎉 Operación completada exitosamente
```

### **Listado de Colecciones**
```
📚 Colecciones disponibles (5):
1. expedientes_medicos
2. laboratorios_clinicos
3. imagenes_medicas
4. consultas_medicas
5. documentos_administrativos
```

### **Información Detallada**
```
📊 Información de la colección 'expedientes_medicos':
Documentos: 150
Embedding Function: AzureOpenAIEmbeddingFunction
Metadata: {'description': 'TecSalud medical documents collection - expedientes_medicos'}
```

### **Verificación de Estado**
```
🔍 Verificando estado de colecciones...
📊 expedientes_medicos: 150 documentos
📊 laboratorios_clinicos: 75 documentos
📊 imagenes_medicas: 45 documentos
📊 consultas_medicas: 200 documentos
📊 documentos_administrativos: 30 documentos

🔍 Estado de las colecciones:
Total: 5
Estado general: healthy
```

---

## 🚨 **Solución de Problemas**

### **Error: "No se pudo inicializar el servicio ChromaDB"**
```bash
# Verificar directorio de ChromaDB
ls -la data/vectordb/

# Verificar permisos
chmod 755 data/vectordb/

# Verificar variables de entorno
echo $CHROMA_PERSIST_DIRECTORY
```

### **Error: "Cliente ChromaDB no disponible"**
```bash
# Reinstalar ChromaDB
pip uninstall chromadb
pip install chromadb

# Verificar versión
pip show chromadb
```

### **Error: "Azure OpenAI service error"**
```bash
# Verificar configuración de Azure OpenAI
echo $AZURE_OPENAI_API_KEY
echo $AZURE_OPENAI_ENDPOINT
echo $EMBEDDING_DEPLOYMENT_NAME
```

---

## 🔄 **Operaciones Comunes**

### **Inicialización Desde Cero**
```bash
# 1. Eliminar directorio existente
rm -rf data/vectordb/

# 2. Crear directorio nuevo
mkdir -p data/vectordb

# 3. Ejecutar inicialización
python scripts/init_chroma_collections.py
```

### **Backup de Colecciones**
```bash
# Crear backup
cp -r data/vectordb data/vectordb_backup_$(date +%Y%m%d_%H%M%S)

# Verificar backup
ls -la data/vectordb_backup_*
```

### **Verificación Post-Inicialización**
```bash
# Verificar estado
python scripts/init_chroma_collections.py --action verify

# Probar búsqueda
curl -X POST "http://localhost:8000/api/v1/documents/search" \
  -H "Content-Type: application/json" \
  -d '{"query": "test", "limit": 1}'
```

---

## 📝 **Logs y Monitoreo**

### **Archivo de Log**
- **Ubicación**: `backend/chroma_init.log`
- **Contenido**: Todas las operaciones de inicialización
- **Rotación**: Manual (eliminar cuando sea necesario)

### **Monitoreo en Tiempo Real**
```bash
# Seguir logs durante inicialización
tail -f chroma_init.log

# Verificar logs del sistema
tail -f logs/tecsalud.log
```

---

## ⚠️ **Precauciones**

### **Antes de Eliminar Colecciones**
- ✅ Crear backup completo
- ✅ Verificar que no hay procesos usando la colección
- ✅ Confirmar que tienes los documentos originales

### **Antes de Recrear**
- ✅ Parar el servidor backend
- ✅ Hacer backup de `data/vectordb/`
- ✅ Verificar espacio en disco suficiente

### **En Producción**
- 🚫 No ejecutar `--recreate` sin planeación
- 🚫 No eliminar colecciones en horarios activos
- ✅ Siempre hacer backup antes de cambios

---

## 🔗 **Scripts Relacionados**

- **`vectorize_documents.py`**: Agregar documentos a las colecciones
- **`test_vectorization.py`**: Probar la vectorización
- **`README_VECTORIZATION.md`**: Guía completa de vectorización

---

## 💡 **Casos de Uso Comunes**

### **Nuevo Ambiente de Desarrollo**
```bash
# Setup inicial completo
python scripts/init_chroma_collections.py
python scripts/test_vectorization.py
```

### **Migración de Datos**
```bash
# Backup + recreación
cp -r data/vectordb data/vectordb_backup
python scripts/init_chroma_collections.py --action recreate
python scripts/vectorize_documents.py /path/to/documents
```

### **Mantenimiento Rutinario**
```bash
# Verificación semanal
python scripts/init_chroma_collections.py --action verify
```

---

**¡Las colecciones de ChromaDB están listas para TecSalud!** 🎉 