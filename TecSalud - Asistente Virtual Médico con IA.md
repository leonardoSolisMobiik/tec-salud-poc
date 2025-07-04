# TecSalud - Asistente Virtual Médico con IA

## 🏥 Descripción del Proyecto

TecSalud es una aplicación completa de asistente virtual médico que integra Azure OpenAI (GPT-4o/4o-mini) con una base de datos vectorial Chroma para proporcionar consultas médicas inteligentes, análisis de expedientes clínicos y gestión de documentos médicos.

## 🚀 Características Principales

### 🤖 Inteligencia Artificial Avanzada
- **GPT-4o**: Análisis médicos complejos y diagnósticos profundos
- **GPT-4o-mini**: Consultas rápidas y respuestas eficientes
- **Tool Calling**: Funciones especializadas para tareas médicas específicas
- **Agentes Especializados**: Sistema de agentes para diferentes tipos de consultas

### 🔍 Búsqueda Semántica
- **Chroma Vector Database**: Búsqueda semántica en expedientes médicos
- **Embeddings Inteligentes**: Procesamiento de documentos con Azure OpenAI
- **Contexto de Paciente**: Búsqueda contextual por paciente y tipo de documento

### 📱 Interfaz de Usuario Moderna
- **React + Styled Components**: Interfaz moderna y responsive
- **Sidebar Retráctil**: Navegación optimizada para desktop y móvil
- **Gestión de Estados**: Zustand para manejo eficiente del estado
- **Animaciones Fluidas**: Framer Motion para transiciones suaves

### 📄 Gestión de Documentos
- **Subida de Archivos**: Soporte para PDF, TXT, DOC, DOCX
- **Análisis Automático**: Procesamiento inteligente de documentos médicos
- **Organización por Paciente**: Gestión estructurada de expedientes

## 🏗️ Arquitectura del Sistema

### Backend (FastAPI)
```
backend/
├── app/
│   ├── agents/           # Agentes especializados de IA
│   │   ├── medical_coordinator.py
│   │   ├── diagnostic_agent.py
│   │   ├── quick_response_agent.py
│   │   ├── document_analysis_agent.py
│   │   └── search_agent.py
│   ├── api/              # Endpoints REST
│   │   └── endpoints/
│   │       ├── chat.py
│   │       ├── patients.py
│   │       ├── documents.py
│   │       └── health.py
│   ├── core/             # Configuración central
│   │   ├── config.py
│   │   ├── database.py
│   │   └── logging.py
│   ├── models/           # Modelos Pydantic
│   │   ├── chat.py
│   │   └── medical.py
│   ├── services/         # Servicios principales
│   │   ├── azure_openai_service.py
│   │   └── chroma_service.py
│   └── utils/            # Utilidades
│       └── exceptions.py
├── main.py               # Aplicación principal
└── requirements.txt      # Dependencias
```

### Frontend (React)
```
frontend/
├── src/
│   ├── components/
│   │   ├── layout/       # Componentes de layout
│   │   ├── medical/      # Componentes médicos
│   │   ├── ui/           # Componentes de UI
│   │   └── voice/        # Asistente de voz
│   ├── services/         # Servicios de API
│   ├── stores/           # Gestión de estado
│   ├── styles/           # Estilos y temas
│   └── hooks/            # Hooks personalizados
├── package.json
└── vite.config.js
```

## 🛠️ Instalación y Configuración

### Prerrequisitos
- Docker y Docker Compose
- Node.js 18+ (para desarrollo local)
- Python 3.11+ (para desarrollo local)
- Cuenta de Azure OpenAI con modelos GPT-4o/4o-mini

### Instalación con Docker (Recomendado)

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd tecsalud-fullstack
   ```

2. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   # Editar .env con tus credenciales de Azure OpenAI
   ```

3. **Iniciar servicios**
   ```bash
   docker-compose up -d
   ```

4. **Acceder a la aplicación**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Documentación API: http://localhost:8000/docs
   - Chroma DB: http://localhost:8001

### Instalación Local para Desarrollo

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🔧 Configuración de Azure OpenAI

### Modelos Requeridos
1. **GPT-4o** - Para análisis médicos complejos
2. **GPT-4o-mini** - Para consultas rápidas
3. **text-embedding-3-large** - Para embeddings semánticos

### Variables de Entorno
```env
AZURE_OPENAI_API_KEY=tu_api_key
AZURE_OPENAI_ENDPOINT=https://tu-recurso.openai.azure.com/
AZURE_OPENAI_GPT4O_DEPLOYMENT=gpt-4o
AZURE_OPENAI_GPT4O_MINI_DEPLOYMENT=gpt-4o-mini
AZURE_OPENAI_EMBEDDING_DEPLOYMENT=text-embedding-3-large
```

## 📚 Uso de la Aplicación

### 1. Gestión de Pacientes
- Buscar pacientes por nombre, ID o expediente
- Seleccionar paciente para contexto de consultas
- Ver información detallada y timeline médico

### 2. Asistente Virtual
- **Modo Rápido (GPT-4o-mini)**: Consultas simples y respuestas rápidas
- **Modo Análisis (GPT-4o)**: Diagnósticos complejos y análisis profundo
- Contexto automático del paciente seleccionado

### 3. Gestión de Documentos
- Subir documentos médicos (PDF, TXT, DOC, DOCX)
- Búsqueda semántica en expedientes
- Análisis automático de documentos

### 4. Navegación
- **Dashboard**: Vista general y estadísticas
- **Asistente IA**: Chat médico inteligente
- **Documentos**: Gestión de expedientes

## 🔌 API Endpoints

### Chat Médico
- `POST /api/v1/chat/medical` - Chat médico general
- `POST /api/v1/chat/quick` - Consultas rápidas
- `POST /api/v1/chat/analyze` - Análisis médico profundo
- `POST /api/v1/chat/medical/stream` - Chat con streaming

### Pacientes
- `GET /api/v1/patients` - Listar pacientes
- `GET /api/v1/patients/search` - Buscar pacientes
- `GET /api/v1/patients/{id}` - Obtener paciente
- `GET /api/v1/patients/{id}/documents` - Documentos del paciente
- `GET /api/v1/patients/{id}/timeline` - Timeline médico
- `GET /api/v1/patients/{id}/summary` - Resumen del paciente

### Documentos
- `POST /api/v1/documents/upload` - Subir documento
- `POST /api/v1/documents/analyze` - Analizar documento
- `GET /api/v1/documents/{id}` - Obtener documento
- `DELETE /api/v1/documents/{id}` - Eliminar documento
- `POST /api/v1/documents/search` - Búsqueda semántica

### Health Checks
- `GET /api/v1/health` - Estado general
- `GET /api/v1/health/detailed` - Estado detallado
- `GET /api/v1/health/azure-openai` - Estado de Azure OpenAI
- `GET /api/v1/health/chroma` - Estado de Chroma DB

## 🧪 Testing

### Backend
```bash
cd backend
pytest tests/ -v
```

### Frontend
```bash
cd frontend
npm test
```

## 📊 Monitoreo y Logs

### Logs del Sistema
- **Backend**: `backend/logs/tecsalud.log`
- **Errores**: `backend/logs/tecsalud_errors.log`
- **Auditoría Médica**: `backend/logs/medical_audit.log`

### Health Checks
- Monitoreo automático de servicios
- Alertas de estado de Azure OpenAI
- Verificación de conectividad con Chroma

## 🔒 Seguridad

### Características de Seguridad
- Autenticación JWT
- Validación de entrada
- Rate limiting
- Logs de auditoría médica
- CORS configurado
- Headers de seguridad

### Consideraciones Médicas
- Cumplimiento con estándares médicos
- Auditoría de consultas
- Protección de datos de pacientes
- Encriptación de datos sensibles

## 🚀 Despliegue en Producción

### Docker Compose Producción
```bash
docker-compose --profile production up -d
```

### Variables de Entorno Producción
```env
ENVIRONMENT=production
DEBUG=false
DATABASE_URL=postgresql://user:pass@host:5432/db
```

### Nginx Reverse Proxy
- SSL/TLS configurado
- Compresión gzip
- Headers de seguridad
- Proxy para API

## 🤝 Contribución

### Estructura de Commits
- `feat:` Nueva funcionalidad
- `fix:` Corrección de bugs
- `docs:` Documentación
- `style:` Formato de código
- `refactor:` Refactorización
- `test:` Tests

### Pull Requests
1. Fork del repositorio
2. Crear rama feature
3. Commits descriptivos
4. Tests actualizados
5. Documentación actualizada

## 📝 Licencia

Este proyecto está bajo la licencia MIT. Ver `LICENSE` para más detalles.

## 📞 Soporte

Para soporte técnico o consultas:
- Email: soporte@tecsalud.com
- Documentación: http://localhost:8000/docs
- Issues: GitHub Issues

## 🔄 Roadmap

### Próximas Funcionalidades
- [ ] Integración con sistemas hospitalarios
- [ ] Análisis de imágenes médicas
- [ ] Reportes automáticos
- [ ] Notificaciones en tiempo real
- [ ] API móvil
- [ ] Integración con wearables

### Mejoras Técnicas
- [ ] Optimización de performance
- [ ] Caché distribuido
- [ ] Microservicios
- [ ] Kubernetes deployment
- [ ] CI/CD pipeline
- [ ] Monitoring avanzado

