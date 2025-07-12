# 🧹 Database Cleanup Scripts

Scripts para limpiar la base de datos TecSalud y empezar desde cero con pacientes nuevos.

## 📋 **Scripts Disponibles**

### 🚀 **Script Rápido**
```bash
cd backend
./scripts/quick_clean.sh
```
- ✅ **Automático**: No requiere confirmación
- ✅ **Rápido**: Limpia todo en segundos
- ✅ **Seguro**: Preserva doctores y configuración

### 🛠️ **Script Interactivo**
```bash
cd backend
python scripts/clean_database.py
```
- ✅ **Confirmación**: Requiere escribir "YES"
- ✅ **Detallado**: Muestra estadísticas antes/después
- ✅ **Logs**: Información completa del proceso

## 🗑️ **Qué se Elimina**

| Tabla | Descripción |
|-------|-------------|
| `patients` | Todos los pacientes |
| `medical_documents` | Documentos médicos |
| `vital_signs` | Signos vitales |
| `diagnoses` | Diagnósticos |
| `treatments` | Tratamientos |
| `patient_interactions` | Interacciones |
| `batch_uploads` | Cargas masivas |
| `batch_files` | Archivos de lotes |
| ChromaDB | Vectores de documentos |

## ✅ **Qué se Preserva**

- ✅ **Doctores** (incluyendo Dr. Sistema)
- ✅ **Configuración del sistema**
- ✅ **Estructura de base de datos**
- ✅ **Colecciones ChromaDB** (vacías)

## 🎯 **Cuándo Usar**

### **Antes de Probar TecSalud**
```bash
# 1. Limpiar base de datos
./scripts/quick_clean.sh

# 2. Subir archivos TecSalud
# Frontend: Selecciona "Documento Completo"
# Sube: 3000128494_ALANIS VILLAGRAN, MARIA DE LOS ANGELES_2003091464_EMER.pdf

# 3. Verificar nuevos pacientes creados
```

### **Desarrollo y Testing**
```bash
# Reset rápido para cada ciclo de pruebas
./scripts/quick_clean.sh
```

## 📝 **Ejemplo de Uso**

```bash
# Estado inicial: 20 pacientes, 63 documentos
./scripts/quick_clean.sh

# ✅ Estado final: 0 pacientes, 0 documentos
# ✅ Listo para crear pacientes desde filenames TecSalud

# Ahora sube archivos con nombres como:
# 3000128494_ALANIS VILLAGRAN, MARIA DE LOS ANGELES_2003091464_EMER.pdf
```

## ⚠️ **Importante**

- **NO hay undo**: Los datos eliminados no se pueden recuperar
- **Backup**: Considera hacer backup antes si tienes datos importantes
- **Testing**: Ideal para entornos de desarrollo y testing
- **Producción**: ⚠️ NO usar en producción sin backup

## 🔧 **Resolución de Problemas**

### Error: "Virtual environment not found"
```bash
cd backend
source venv/bin/activate
python scripts/clean_database.py
```

### Error: "Permission denied"
```bash
chmod +x scripts/quick_clean.sh
chmod +x scripts/clean_database.py
```

### Error: "Module not found"
```bash
cd backend
pip install -r requirements.txt
```

## 🎉 **Después de la Limpieza**

La base de datos está lista para:
1. **Crear pacientes automáticamente** desde filenames TecSalud
2. **Probar el sistema de matching** de pacientes
3. **Verificar almacenamiento dual** (vectorizado + completo)
4. **Testing limpio** sin datos previos

¡Perfecto para desarrollar y probar el sistema TecSalud! 🚀 