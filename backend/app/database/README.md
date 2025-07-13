# Capa de Abstracción de Base de Datos TecSalud

Esta capa proporciona una interfaz unificada para trabajar con tanto SQLite como MongoDB/CosmosDB, permitiendo una migración fluida entre sistemas de base de datos.

## 🔧 Configuración

### Variables de Entorno Requeridas

Agrega estas variables a tu archivo `.env`:

```bash
# Configuración de Base de Datos
# Opciones: "mongodb" o "sqlite" (default: "mongodb")
DATABASE_TYPE=mongodb

# Configuración SQLite (fallback)
DATABASE_URL=sqlite:///./data/tecsalud.db

# Configuración MongoDB/CosmosDB
# Para MongoDB local
MONGODB_CONNECTION_STRING=mongodb://localhost:27017
# Para MongoDB Atlas
# MONGODB_CONNECTION_STRING=mongodb+srv://username:password@cluster.mongodb.net/
# Para CosmosDB con API MongoDB
# MONGODB_CONNECTION_STRING=mongodb://username:password@accountname.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb

MONGODB_DATABASE_NAME=tecsalud
```

### 📋 Colecciones MongoDB

Las siguientes colecciones se crean automáticamente:

- `patients` - Información de pacientes
- `doctors` - Información de doctores
- `medical_documents` - Documentos médicos
- `diagnoses` - Diagnósticos
- `treatments` - Tratamientos
- `vital_signs` - Signos vitales
- `patient_interactions` - Interacciones con pacientes
- `batch_uploads` - Sesiones de carga por lotes
- `batch_files` - Archivos de procesamiento por lotes

## 🚀 Uso

### Inicialización

```python
from app.database.factory import init_database
await init_database()
```

### Obtener Sesión de Base de Datos

```python
from app.core.database import get_db

# En endpoints FastAPI
async def my_endpoint(db = Depends(get_db)):
    # Funciona igual para SQLite y MongoDB
    patients = db.query(Patient).filter_by(status="Activo").all()
```

### Verificar Tipo de Base de Datos

```python
from app.database.factory import DatabaseConfig

if DatabaseConfig.is_mongodb():
    print("Usando MongoDB")
elif DatabaseConfig.is_sqlite():
    print("Usando SQLite")
```

## 🔄 Migración

### De SQLite a MongoDB

1. **Configurar MongoDB**: Asegúrate de que MongoDB esté ejecutándose
2. **Cambiar Variables**: Cambiar `DATABASE_TYPE=mongodb` en `.env`
3. **Migrar Datos**: Usar scripts de migración (próximamente)
4. **Verificar**: Probar la aplicación con MongoDB

### Dual-Write (Transición Gradual)

Durante la migración, puedes ejecutar ambas bases de datos simultáneamente:

1. Mantener SQLite funcionando
2. Configurar MongoDB
3. Implementar dual-write en servicios críticos
4. Migrar datos gradualmente
5. Cambiar a MongoDB completamente

## 📊 Diferencias de Implementación

### SQLite (SQLAlchemy)
- Relaciones manejadas por SQLAlchemy ORM
- Transacciones automáticas
- Joins complejos nativos
- Esquema rígido

### MongoDB
- Referencias manuales entre documentos
- Transacciones opcionales
- Agregaciones para joins
- Esquema flexible

## 🔍 Índices MongoDB

Se crean automáticamente los siguientes índices para optimización:

### Patients
- `medical_record_number` (único)
- `name`
- `doctor_id`

### Medical Documents
- `patient_id`
- `document_type`
- `created_at`
- `content_hash`

### Batch Uploads
- `session_id` (único)
- `uploaded_by`

### Patient Interactions
- `patient_id + created_at` (compuesto)
- `doctor_id`

## ⚠️ Limitaciones Conocidas

1. **Consultas Complejas**: Los joins complejos de SQLAlchemy no se traducen automáticamente a MongoDB
2. **Transacciones**: MongoDB requiere configuración especial para transacciones ACID
3. **Relaciones**: Las relaciones de SQLAlchemy se manejan como referencias en MongoDB
4. **Esquema**: MongoDB permite flexibilidad que SQLite no tiene

## 🛠️ Desarrollo

### Agregar Nuevos Modelos

1. **SQLAlchemy**: Agregar a `app/db/models.py`
2. **MongoDB**: Agregar a `app/models/mongodb/`
3. **Mapeo**: Actualizar la configuración de colecciones en `config.py`

### Testing

```python
# Para testing, configurar base de datos en memoria
DATABASE_TYPE=sqlite
DATABASE_URL=sqlite:///:memory:
```

## 📚 Dependencias Adicionales

```bash
# MongoDB
motor==3.3.2
pymongo==4.6.0
dnspython==2.4.2

# Patient Matching
fuzzywuzzy==0.18.0
python-Levenshtein==0.23.0
```

## 🔧 Troubleshooting

### MongoDB No Conecta
1. Verificar que MongoDB esté ejecutándose
2. Verificar el connection string
3. Verificar credenciales de acceso
4. El sistema fallará a SQLite automáticamente

### Performance Issues
1. Verificar que los índices estén creados
2. Optimizar consultas MongoDB
3. Considerar agregaciones para consultas complejas

### Migración de Datos
1. Usar scripts de migración específicos
2. Verificar integridad de datos después de migración
3. Mantener backup de SQLite durante transición 