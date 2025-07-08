# TecSalud - Asistente Virtual Médico con IA

## 🏥 Descripción del Proyecto

TecSalud es una aplicación completa de asistente virtual médico que integra **Azure OpenAI (GPT-4o/4o-mini)** con una base de datos vectorial **Chroma** para proporcionar consultas médicas inteligentes, análisis de expedientes clínicos y gestión avanzada de documentos médicos.

### 🚀 Arquitectura Renovada
- **Frontend**: **Angular 19** con **Bamboo Design System** de Tecnológico de Monterrey
- **Backend**: **FastAPI** con sistema de agentes especializados
- **Base de Datos**: **SQLite** con **ChromaDB** para búsqueda semántica
- **IA**: **Azure OpenAI** con modelos GPT-4o/4o-mini y embeddings text-embedding-3-large

## 🌟 Características Principales

### 🤖 Inteligencia Artificial Avanzada
- **GPT-4o**: Análisis médicos complejos y diagnósticos profundos
- **GPT-4o-mini**: Consultas rápidas y respuestas eficientes
- **Tool Calling**: Funciones especializadas para tareas médicas específicas
- **Agentes Especializados**: Sistema de agentes para diferentes tipos de consultas

### 🧠 Sistema de Agentes Médicos Especializados
- **Medical Coordinator**: Coordinador principal con enrutamiento inteligente
- **Diagnostic Agent**: Análisis diagnósticos complejos con GPT-4o
- **Document Analysis Agent**: Análisis profundo de documentos médicos
- **Quick Response Agent**: Respuestas rápidas con GPT-4o-mini
- **Search Agent**: Búsqueda semántica especializada

### 📊 Procesamiento Híbrido de Documentos
- **Vectorización Semántica**: Búsqueda ultrarrápida (< 100ms)
- **Almacenamiento Completo**: Preservación de documentos originales
- **Procesamiento Híbrido**: Combinación inteligente de ambos métodos
- **Administración Masiva**: Carga automática de expedientes TecSalud

### 🎨 Interfaz Angular + Bamboo
- **Angular 19**: Framework moderno y robusto
- **Bamboo Design System**: Consistencia con estándares de TecSalud
- **Responsive Design**: Optimizado para desktop y tablet
- **Streaming UI**: Respuestas en tiempo real con loading animado

### 🔧 Funcionalidades Administrativas
- **Admin Bulk Upload**: Carga masiva de expedientes con parsing automático
- **Patient Matching**: Coincidencia inteligente de pacientes existentes
- **Processing Types**: Selección de tipo de procesamiento por documento
- **Review Interface**: Interfaz para revisar coincidencias dudosas

## 🏗️ Arquitectura del Sistema

### Backend (FastAPI)
```
backend/
├── app/
│   ├── agents/                    # Agentes especializados de IA
│   │   ├── medical_coordinator.py   # Coordinador principal
│   │   ├── diagnostic_agent.py      # Diagnósticos complejos
│   │   ├── document_analysis_agent.py # Análisis de documentos
│   │   ├── quick_response_agent.py   # Respuestas rápidas
│   │   └── search_agent.py          # Búsqueda semántica
│   ├── api/                       # Endpoints REST
│   │   ├── endpoints/
│   │   │   ├── chat.py             # Chat médico con streaming
│   │   │   ├── patients.py         # Gestión de pacientes
│   │   │   ├── documents.py        # Gestión de documentos
│   │   │   ├── admin_bulk_upload.py # Carga masiva admin
│   │   │   └── health.py           # Health checks
│   │   └── routes.py              # Configuración de rutas
│   ├── core/                      # Configuración central
│   │   ├── config.py              # Configuración del sistema
│   │   ├── database.py            # Base de datos SQLite
│   │   └── logging.py             # Sistema de logs
│   ├── models/                    # Modelos Pydantic
│   │   ├── chat.py                # Modelos de chat
│   │   └── medical.py             # Modelos médicos
│   ├── services/                  # Servicios principales
│   │   ├── azure_openai_service.py      # Azure OpenAI
│   │   ├── chroma_service.py            # ChromaDB
│   │   └── enhanced_document_service.py # Contexto híbrido
│   └── utils/                     # Utilidades
│       └── exceptions.py          # Excepciones personalizadas
├── data/                          # Datos persistentes
│   ├── tecsalud.db               # Base de datos SQLite
│   ├── vectordb/                 # ChromaDB
│   └── pdfs/                     # Documentos almacenados
├── main.py                       # Aplicación principal
└── requirements.txt              # Dependencias Python
```

### Frontend (Angular + Bamboo)
```
frontend-angular/
├── src/
│   ├── app/
│   │   ├── core/                 # Servicios principales
│   │   │   ├── services/
│   │   │   │   ├── api.service.ts        # Cliente HTTP
│   │   │   │   ├── streaming.service.ts  # Streaming SSE
│   │   │   │   └── ui-state.service.ts   # Estado UI
│   │   │   └── models/           # Modelos TypeScript
│   │   │       ├── patient.model.ts      # Pacientes
│   │   │       └── chat.model.ts         # Chat
│   │   ├── features/             # Características principales
│   │   │   ├── medical-chat/     # Chat médico
│   │   │   ├── patient-management/ # Gestión pacientes
│   │   │   ├── admin-bulk-upload/  # Carga masiva admin
│   │   │   └── document-viewer/    # Visualización documentos
│   │   ├── shared/               # Componentes compartidos
│   │   │   ├── bamboo.module.ts  # Módulo Bamboo
│   │   │   └── components/       # Componentes comunes
│   │   └── app.component.ts      # Componente principal
│   ├── environments/             # Configuración entornos
│   └── styles.scss              # Estilos globales
├── package.json                  # Dependencias Node.js
└── angular.json                  # Configuración Angular
```

## 🛠️ Instalación y Configuración

### Prerrequisitos
- **Docker** y **Docker Compose** (recomendado)
- **Node.js 18+** (para desarrollo local)
- **Python 3.11+** (para desarrollo local)
- **Angular CLI** (`npm install -g @angular/cli`)
- **Cuenta Azure OpenAI** con modelos GPT-4o/4o-mini

### Instalación con Docker (Recomendado)

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd tecsalud-fullstack
   ```

2. **Configurar variables de entorno**
   ```bash
   # Crear archivo .env con tus credenciales
   cat > .env << EOF
   AZURE_OPENAI_API_KEY=tu_api_key_aqui
   AZURE_OPENAI_ENDPOINT=https://tu-recurso.openai.azure.com/
   AZURE_OPENAI_API_VERSION=2024-02-01
   AZURE_OPENAI_GPT4O_DEPLOYMENT=gpt-4o
   AZURE_OPENAI_GPT4O_MINI_DEPLOYMENT=gpt-4o-mini
   AZURE_OPENAI_EMBEDDING_DEPLOYMENT=text-embedding-3-large
   EOF
   ```

3. **Iniciar servicios**
   ```bash
   docker-compose up -d
   ```

4. **Acceder a la aplicación**
   - **Frontend Angular**: http://localhost:4200
   - **Backend API**: http://localhost:8000
   - **Documentación API**: http://localhost:8000/docs
   - **ChromaDB**: http://localhost:8001

### Instalación Local para Desarrollo

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configurar variables de entorno
export AZURE_OPENAI_API_KEY="tu_api_key"
export AZURE_OPENAI_ENDPOINT="https://tu-recurso.openai.azure.com/"

# Iniciar servidor
python main.py
```

#### Frontend Angular
```bash
cd frontend-angular
npm install

# Iniciar servidor de desarrollo
ng serve --port 4200 --proxy-config proxy.conf.json
```

## 🔧 Configuración de Azure OpenAI

### Modelos Requeridos
1. **GPT-4o** - Análisis médicos complejos y diagnósticos
2. **GPT-4o-mini** - Consultas rápidas y respuestas eficientes
3. **text-embedding-3-large** - Embeddings para búsqueda semántica

### Variables de Entorno Completas
```env
# Azure OpenAI
AZURE_OPENAI_API_KEY=tu_api_key_aqui
AZURE_OPENAI_ENDPOINT=https://tu-recurso.openai.azure.com/
AZURE_OPENAI_API_VERSION=2024-02-01
AZURE_OPENAI_GPT4O_DEPLOYMENT=gpt-4o
AZURE_OPENAI_GPT4O_MINI_DEPLOYMENT=gpt-4o-mini
AZURE_OPENAI_EMBEDDING_DEPLOYMENT=text-embedding-3-large

# Base de datos
DATABASE_URL=sqlite:///./data/tecsalud.db
CHROMA_PERSIST_DIRECTORY=./data/vectordb

# Entorno
ENVIRONMENT=development
DEBUG=true
```

## 📚 Uso de la Aplicación

### 1. **Administración de Documentos**
- **Carga Masiva**: Interfaz admin para procesar múltiples expedientes
- **Parsing Automático**: Extracción de datos de nombres de archivo TecSalud
- **Tipos de Procesamiento**:
  - 🔍 **Vectorizado**: Solo búsqueda semántica
  - 📄 **Completo**: Solo almacenamiento completo
  - ⚡ **Híbrido**: Combinación inteligente (recomendado)

### 2. **Gestión de Pacientes**
- Búsqueda inteligente por nombre, ID o expediente
- Coincidencia automática con pacientes existentes
- Contexto híbrido para consultas médicas

### 3. **Asistente Virtual Médico**
- **Chat Streaming**: Respuestas en tiempo real
- **Agentes Especializados**: Routing automático según tipo de consulta
- **Contexto Híbrido**: Combina vectores semánticos con documentos completos
- **Análisis Diagnóstico**: GPT-4o para casos complejos

### 4. **Procesamiento de Expedientes**
- Formato TecSalud: `ID_APELLIDO APELLIDO, NOMBRE_NUM_TIPO.pdf`
- Extracción automática de datos del paciente
- Procesamiento inteligente con múltiples estrategias

## 🔌 API Endpoints

### Chat Médico
```
POST /api/v1/chat/medical          # Chat médico con agentes
POST /api/v1/chat/medical/stream   # Chat con streaming SSE
POST /api/v1/chat/quick            # Respuestas rápidas
POST /api/v1/chat/analyze          # Análisis médico profundo
```

### Gestión de Pacientes
```
GET    /api/v1/patients            # Listar pacientes
GET    /api/v1/patients/search     # Buscar pacientes
GET    /api/v1/patients/{id}       # Obtener paciente
POST   /api/v1/patients            # Crear paciente
PUT    /api/v1/patients/{id}       # Actualizar paciente
```

### Administración de Documentos
```
POST   /api/v1/admin/bulk-upload           # Carga masiva admin
GET    /api/v1/admin/batch-uploads         # Listar cargas
GET    /api/v1/admin/batch-uploads/{id}    # Estado de carga
POST   /api/v1/documents/upload            # Subir documento individual
GET    /api/v1/documents/search            # Búsqueda semántica
```

### Health Checks
```
GET    /api/v1/health                      # Estado general
GET    /api/v1/health/detailed             # Estado detallado
GET    /api/v1/health/azure-openai         # Estado Azure OpenAI
GET    /api/v1/health/chroma               # Estado ChromaDB
```

## 🎯 Funcionalidades Implementadas

### ✅ Características Completadas
- [x] **Frontend Angular 19** con Bamboo Design System
- [x] **Sistema de Agentes Médicos** con routing inteligente
- [x] **Admin Bulk Upload** con parsing automático TecSalud
- [x] **Processing Types** (Vectorizado/Completo/Híbrido)
- [x] **Patient Matching** inteligente
- [x] **Streaming Chat** con SSE
- [x] **ChromaDB Integration** para búsqueda semántica
- [x] **Contexto Híbrido** (vectores + documentos completos)
- [x] **Database Migration** con nuevas columnas

### 🔄 En Desarrollo
- [ ] **PDF Viewer** integrado
- [ ] **Voice Assistant** con comandos de voz
- [ ] **Authentication System** con JWT
- [ ] **Advanced Analytics** y métricas
- [ ] **Mobile App** con Ionic

## 🧪 Testing

### Backend
```bash
cd backend
pytest tests/ -v --cov=app --cov-report=html
```

### Frontend Angular
```bash
cd frontend-angular
ng test
ng test --code-coverage
ng e2e
```

## 📊 Monitoreo y Logs

### Sistema de Logging
```
backend/logs/
├── tecsalud.log          # Logs generales
├── tecsalud_errors.log   # Errores del sistema
└── medical_audit.log     # Auditoría médica
```

### Health Monitoring
- **Automatic Health Checks**: Monitoreo continuo de servicios
- **Azure OpenAI Status**: Verificación de conectividad
- **ChromaDB Health**: Estado de base de datos vectorial
- **Performance Metrics**: Métricas de rendimiento

## 🔒 Seguridad

### Características de Seguridad
- **CORS** configurado para localhost
- **Input Validation** con Pydantic
- **Rate Limiting** en endpoints críticos
- **Audit Logging** para consultas médicas
- **Secure Headers** en respuestas HTTP

### Consideraciones Médicas
- **HIPAA Compliance** ready
- **Data Encryption** en tránsito
- **Audit Trail** completo
- **Patient Privacy** protegida

## 🚀 Despliegue en Producción

### Docker Compose Producción
```bash
# Usar perfil de producción
docker-compose --profile production up -d

# Con SSL y Nginx
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Variables de Entorno Producción
```env
ENVIRONMENT=production
DEBUG=false
DATABASE_URL=postgresql://user:pass@postgres:5432/tecsalud
CHROMA_PERSIST_DIRECTORY=/app/data/vectordb
```

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name tu-dominio.com;
    
    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location / {
        proxy_pass http://frontend:4200;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🤝 Contribución

### Estructura de Commits
```
feat: Nueva funcionalidad
fix: Corrección de bugs
docs: Documentación
style: Formato de código
refactor: Refactorización
test: Tests
chore: Tareas de mantenimiento
```

### Development Workflow
1. Fork del repositorio
2. Crear rama feature: `git checkout -b feature/nueva-funcionalidad`
3. Commits descriptivos con convención
4. Tests actualizados
5. Pull request con descripción completa

## 📈 Performance

### Métricas de Rendimiento
- **Consultas médicas**: < 3 segundos
- **Búsqueda semántica**: < 100ms
- **Carga de documentos**: < 5 segundos por documento
- **Streaming responses**: < 50ms primer token

### Optimizaciones
- **Lazy Loading** en Angular
- **Connection Pooling** en FastAPI
- **Vector Index** optimizado en ChromaDB
- **Caching** con Redis

## 🌟 Características Técnicas Avanzadas

### Bamboo Design System
- **Tokens de Diseño**: Colores, espaciado, tipografía de TecSalud
- **Componentes Bamboo**: Botones, inputs, cards, navegación
- **Responsive Design**: Breakpoints optimizados
- **Accessibility**: WCAG 2.1 AA compliant

### Sistema de Agentes IA
- **Medical Coordinator**: Enrutamiento inteligente de consultas
- **Function Calling**: Herramientas especializadas
- **Context Strategy**: Múltiples estrategias de contexto
- **Streaming Support**: Respuestas en tiempo real

## 📞 Soporte

### Recursos de Ayuda
- **Documentación API**: http://localhost:8000/docs
- **Logs del Sistema**: `backend/logs/`
- **Health Checks**: http://localhost:8000/api/v1/health
- **GitHub Issues**: Para reportar bugs

### Troubleshooting
```bash
# Verificar servicios
docker-compose ps

# Ver logs
docker-compose logs -f backend
docker-compose logs -f frontend-angular

# Reiniciar servicios
docker-compose restart
```

## 🔄 Roadmap

### Próximas Funcionalidades
- [ ] **Authentication & Authorization** con JWT
- [ ] **PDF Viewer** integrado en Angular
- [ ] **Voice Commands** con Web Speech API
- [ ] **Advanced Analytics** dashboard
- [ ] **Mobile App** con Ionic
- [ ] **Multi-language Support** (ES/EN)
- [ ] **Offline Support** con PWA

### Mejoras Técnicas
- [ ] **Kubernetes** deployment
- [ ] **CI/CD Pipeline** con GitHub Actions
- [ ] **Performance Monitoring** con Grafana
- [ ] **Automated Testing** E2E
- [ ] **Database Migrations** automáticas
- [ ] **Backup Strategy** automatizada

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver `LICENSE` para más detalles.

---

**Desarrollado con ❤️ por el equipo de TecSalud**  
*Asistente Virtual Médico con IA - Angular + Bamboo + Azure OpenAI*

