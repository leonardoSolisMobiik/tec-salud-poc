# Criterios de Aceptación Detallados - TecSalud
## Especificaciones Técnicas y Casos de Prueba

**Versión:** 1.0  
**Fecha:** 2025-01-07  
**Proyecto:** TecSalud - Angular + Bamboo + Azure OpenAI

---

## 📋 Índice de Criterios Detallados

1. [Médicos y Personal Médico](#-médicos-y-personal-médico)
2. [Administradores de Expedientes](#-administradores-de-expedientes)
3. [Administradores del Sistema](#-administradores-del-sistema)
4. [Criterios Técnicos Generales](#-criterios-técnicos-generales)

---

## 👩‍⚕️ Médicos y Personal Médico

### **HU-MED-001**: Consulta Médica Básica

#### Criterios de Aceptación:
- [ ] **AC-001**: El usuario puede escribir una consulta médica en texto libre
- [ ] **AC-002**: El sistema responde en menos de 3 segundos para consultas básicas
- [ ] **AC-003**: Las respuestas incluyen información médica precisa y referencias
- [ ] **AC-004**: El sistema identifica automáticamente el tipo de consulta (diagnóstica, informativa, etc.)
- [ ] **AC-005**: Se registra un log de auditoría por cada consulta médica

#### Casos de Prueba:
```gherkin
Escenario: Consulta médica básica exitosa
  Dado que soy un médico autenticado
  Cuando escribo "¿Cuáles son los síntomas de diabetes tipo 2?"
  Y presiono enviar
  Entonces veo una respuesta médica precisa en menos de 3 segundos
  Y la respuesta incluye síntomas principales de diabetes tipo 2
  Y se registra la consulta en el log de auditoría

Escenario: Consulta con contexto de paciente
  Dado que tengo un paciente seleccionado con diabetes
  Cuando pregunto "¿Qué medicamentos recomiendas?"
  Entonces la respuesta considera el historial médico del paciente
  Y incluye recomendaciones personalizadas
```

#### Especificaciones Técnicas:
- **Frontend**: Angular component con Bamboo input
- **Backend**: POST `/api/v1/chat/medical`
- **IA**: GPT-4o-mini para consultas rápidas
- **Tiempo respuesta**: < 3 segundos
- **Tokens máximos**: 512 para respuestas básicas

---

### **HU-MED-003**: Chat con Streaming en Tiempo Real

#### Criterios de Aceptación:
- [ ] **AC-001**: Las respuestas aparecen palabra por palabra en tiempo real
- [ ] **AC-002**: El primer token llega en menos de 50ms
- [ ] **AC-003**: El usuario puede interrumpir la respuesta en cualquier momento
- [ ] **AC-004**: Se muestra un indicador visual de "escribiendo"
- [ ] **AC-005**: La respuesta completa se guarda una vez terminada

#### Casos de Prueba:
```gherkin
Escenario: Streaming de respuesta larga
  Dado que hago una consulta compleja sobre diagnóstico diferencial
  Cuando el sistema comienza a responder
  Entonces veo el primer token en menos de 50ms
  Y las palabras aparecen progresivamente
  Y puedo detener la respuesta con botón "Stop"

Escenario: Interrupción de streaming
  Dado que una respuesta larga está siendo generada
  Cuando presiono el botón "Stop"
  Entonces el streaming se detiene inmediatamente
  Y puedo hacer una nueva consulta
```

#### Especificaciones Técnicas:
- **Frontend**: Server-Sent Events (SSE) con Angular
- **Backend**: POST `/api/v1/chat/medical/stream`
- **Protocolo**: SSE con chunks JSON
- **Buffer**: Streaming token por token
- **Timeout**: 30 segundos máximo por respuesta

---

### **HU-MED-005**: Búsqueda de Pacientes

#### Criterios de Aceptación:
- [ ] **AC-001**: Búsqueda funciona con nombre parcial (mínimo 3 caracteres)
- [ ] **AC-002**: Búsqueda por ID médico exacto
- [ ] **AC-003**: Búsqueda por número de expediente
- [ ] **AC-004**: Resultados aparecen con debouncing de 300ms
- [ ] **AC-005**: Máximo 10 resultados por búsqueda
- [ ] **AC-006**: Resultados ordenados por relevancia

#### Casos de Prueba:
```gherkin
Escenario: Búsqueda por nombre parcial
  Dado que estoy en la búsqueda de pacientes
  Cuando escribo "Mar"
  Y espero 300ms
  Entonces veo pacientes con nombre que contenga "Mar"
  Y están ordenados por relevancia
  Y máximo 10 resultados

Escenario: Búsqueda por ID exacto
  Dado que conozco el ID del paciente "PAT001"
  Cuando escribo "PAT001"
  Entonces veo exactamente el paciente con ID PAT001
```

#### Especificaciones Técnicas:
- **Frontend**: Angular reactive forms con debounce
- **Backend**: GET `/api/v1/patients/search?q={query}`
- **Database**: SQLite con índices en nombre, ID, expediente
- **Performance**: < 100ms respuesta de búsqueda
- **Algoritmo**: LIKE query con relevancia scoring

---

### **HU-MED-009**: Búsqueda Semántica en Expedientes

#### Criterios de Aceptación:
- [ ] **AC-001**: Búsqueda funciona con lenguaje natural
- [ ] **AC-002**: Resultados incluyen documentos relevantes con score de confianza
- [ ] **AC-003**: Tiempo de respuesta < 100ms
- [ ] **AC-004**: Resultados incluyen extractos/snippets relevantes
- [ ] **AC-005**: Filtrado por paciente activo
- [ ] **AC-006**: Máximo 20 resultados por búsqueda

#### Casos de Prueba:
```gherkin
Escenario: Búsqueda semántica exitosa
  Dado que tengo un paciente activo con expedientes
  Cuando busco "problemas cardiovasculares"
  Entonces veo documentos relacionados con corazón
  Y cada resultado tiene un score de confianza
  Y incluye snippets relevantes
  Y la respuesta llega en menos de 100ms

Escenario: Búsqueda sin resultados
  Dado que busco "procedimiento inexistente"
  Cuando no hay documentos relacionados
  Entonces veo mensaje "No se encontraron documentos relevantes"
  Y sugerencias de búsquedas alternativas
```

#### Especificaciones Técnicas:
- **Frontend**: Angular search component con Bamboo
- **Backend**: GET `/api/v1/documents/search`
- **Vector DB**: ChromaDB con embeddings Azure OpenAI
- **Embedding Model**: text-embedding-3-large
- **Similarity**: Cosine similarity > 0.7
- **Results**: Top 20 con metadata

---

## 📂 Administradores de Expedientes

### **HU-EXP-001**: Carga Masiva de Expedientes TecSalud

#### Criterios de Aceptación:
- [ ] **AC-001**: Soporte para múltiples archivos simultáneos (hasta 100)
- [ ] **AC-002**: Drag & drop functionality
- [ ] **AC-003**: Validación de formatos (PDF, DOC, DOCX, TXT)
- [ ] **AC-004**: Tamaño máximo 50MB por archivo
- [ ] **AC-005**: Progreso visible para cada archivo
- [ ] **AC-006**: Capacidad de cancelar uploads individuales

#### Casos de Prueba:
```gherkin
Escenario: Carga masiva exitosa
  Dado que tengo 10 archivos PDF válidos
  Cuando los arrastro a la zona de carga
  Entonces todos los archivos se suben exitosamente
  Y veo progreso individual para cada archivo
  Y recibo confirmación de carga completa

Escenario: Archivo inválido en lote
  Dado que cargo 5 PDFs válidos y 1 archivo TXT inválido
  Cuando inicia la carga
  Entonces los 5 PDFs se procesan correctamente
  Y el archivo inválido muestra error específico
  Y puedo continuar con los archivos válidos
```

#### Especificaciones Técnicas:
- **Frontend**: Angular drag-drop con progress bars
- **Backend**: POST `/api/v1/admin/bulk-upload`
- **Storage**: Local filesystem con backup
- **Validation**: File type, size, format validation
- **Concurrency**: 5 archivos simultáneos máximo
- **Timeout**: 300 segundos por archivo

---

### **HU-EXP-003**: Parsing Automático de Archivos TecSalud

#### Criterios de Aceptación:
- [ ] **AC-001**: Reconoce formato: `ID_APELLIDO APELLIDO, NOMBRE_NUM_TIPO.ext`
- [ ] **AC-002**: Extrae ID del paciente correctamente
- [ ] **AC-003**: Separa apellidos paterno y materno
- [ ] **AC-004**: Identifica nombre(s) del paciente
- [ ] **AC-005**: Reconoce número de expediente
- [ ] **AC-006**: Identifica tipo de documento (CONS, EMER, LAB, etc.)
- [ ] **AC-007**: Maneja errores de formato gracefully

#### Casos de Prueba:
```gherkin
Escenario: Parsing exitoso de archivo TecSalud
  Dado el archivo "3000003799_GARZA TIJERINA, MARIA ESTHER_6001467010_CONS.pdf"
  Cuando se procesa el nombre del archivo
  Entonces extrae ID: "3000003799"
  Y apellido paterno: "GARZA"
  Y apellido materno: "TIJERINA"
  Y nombre: "MARIA ESTHER"
  Y número expediente: "6001467010"
  Y tipo documento: "CONS"

Escenario: Archivo con formato incorrecto
  Dado el archivo "documento_sin_formato.pdf"
  Cuando se intenta procesar
  Entonces muestra error "Formato de archivo no reconocido"
  Y permite ingreso manual de datos
```

#### Especificaciones Técnicas:
- **Backend**: `tecsalud_filename_parser.py`
- **Regex Pattern**: `^(\d+)_([A-ZÁÉÍÓÚÑ\s]+),\s([A-ZÁÉÍÓÚÑ\s]+)_(\d+)_([A-Z]{3,4})\.(pdf|docx?|txt)$`
- **Validation**: Strict format checking
- **Fallback**: Manual entry for invalid formats
- **Error Handling**: Graceful degradation

---

### **HU-EXP-005**: Matching Inteligente de Pacientes

#### Criterios de Aceptación:
- [ ] **AC-001**: Matching por ID exacto (100% confianza)
- [ ] **AC-002**: Matching fuzzy por nombre completo (80%+ confianza)
- [ ] **AC-003**: Matching por número de expediente
- [ ] **AC-004**: Score de confianza para cada match
- [ ] **AC-005**: Múltiples candidatos cuando confianza < 90%
- [ ] **AC-006**: Creación automática si no hay matches > 70%

#### Casos de Prueba:
```gherkin
Escenario: Match exacto por ID
  Dado que existe paciente con ID "3000003799"
  Cuando proceso archivo con mismo ID
  Entonces hace match con 100% confianza
  Y asocia documento automáticamente

Escenario: Match fuzzy por nombre
  Dado que existe "GARCÍA LÓPEZ, JUAN CARLOS"
  Cuando proceso "GARCIA LOPEZ, JUAN CARLOS" (sin acentos)
  Entonces encuentra match con 95% confianza
  Y asocia documento automáticamente

Escenario: Múltiples candidatos
  Dado que existen "GARCÍA, JUAN" y "GARCÍA, JUANA"
  Cuando proceso "GARCIA, JUAN"
  Entonces muestra ambos candidatos
  Y solicita confirmación manual
```

#### Especificaciones Técnicas:
- **Backend**: `patient_matching_service.py`
- **Algorithm**: Levenshtein distance + exact ID matching
- **Confidence Thresholds**:
  - Exact ID: 100%
  - Fuzzy name: 70-99%
  - Expediente number: 95%
- **Auto-create**: < 70% confidence
- **Manual review**: 70-89% confidence

---

## 🔧 Administradores del Sistema

### **HU-ADM-003**: Dashboard de Salud del Sistema

#### Criterios de Aceptación:
- [ ] **AC-001**: Estado de backend FastAPI (UP/DOWN)
- [ ] **AC-002**: Estado de Azure OpenAI (conexión y límites)
- [ ] **AC-003**: Estado de ChromaDB (conexión y espacio)
- [ ] **AC-004**: Estado de base de datos SQLite
- [ ] **AC-005**: Métricas de uso en tiempo real
- [ ] **AC-006**: Alertas automáticas por problemas

#### Casos de Prueba:
```gherkin
Escenario: Todos los servicios funcionando
  Dado que accedo al dashboard de salud
  Cuando todos los servicios están operativos
  Entonces veo estado "UP" para todos los servicios
  Y métricas actuales de uso
  Y tiempo de respuesta promedio

Escenario: Servicio caído
  Dado que Azure OpenAI no responde
  Cuando accedo al dashboard
  Entonces veo estado "DOWN" para Azure OpenAI
  Y alerta roja en el dashboard
  Y detalles del error específico
```

#### Especificaciones Técnicas:
- **Frontend**: Angular dashboard con Bamboo charts
- **Backend**: GET `/api/v1/health/detailed`
- **Monitoring**: Health checks cada 30 segundos
- **Alerts**: Real-time con WebSockets
- **Metrics**: Response times, usage stats, resource utilization

---

## 🔬 Criterios Técnicos Generales

### **Performance Requirements**

#### API Response Times:
```yaml
Endpoints de Chat:
  - Quick queries: < 1 segundo
  - Complex analysis: < 5 segundos
  - Streaming first token: < 50ms

Endpoints de Búsqueda:
  - Patient search: < 100ms
  - Semantic search: < 200ms
  - Document retrieval: < 500ms

Endpoints de Carga:
  - File upload: < 5 segundos por archivo
  - Batch processing: Progreso cada 2 segundos
```

#### Concurrency Limits:
```yaml
Usuario Individual:
  - Consultas simultáneas: 3 máximo
  - Uploads simultáneos: 5 máximo

Sistema Global:
  - Usuarios concurrentes: 100
  - Consultas por minuto: 1000
  - Uploads por hora: 10000
```

### **Security Requirements**

#### Authentication & Authorization:
- [ ] JWT tokens con expiración de 8 horas
- [ ] Refresh tokens para sesiones extendidas
- [ ] Role-based access control (RBAC)
- [ ] Rate limiting por usuario y endpoint

#### Data Protection:
- [ ] Encriptación HTTPS/TLS 1.3 obligatoria
- [ ] Sanitización de input en todos los endpoints
- [ ] Logs de auditoría para acciones médicas
- [ ] Anonimización de datos en logs

#### Medical Compliance:
- [ ] Cumplimiento HIPAA para datos médicos
- [ ] Retención de logs por 7 años
- [ ] Backup cifrado de datos sensibles
- [ ] Acceso trazable para auditorías

### **Usability Requirements**

#### Angular Frontend:
```yaml
Responsive Design:
  - Desktop: 1024px+ (layout completo)
  - Tablet: 768-1023px (sidebar colapsible)
  - Mobile: < 768px (nav drawer)

Bamboo Integration:
  - Tokens de diseño TecSalud
  - Componentes accessibility compliant
  - Theme switching (light/dark)
  - RTL support preparado

User Experience:
  - Loading states para todas las acciones
  - Error boundaries con retry options
  - Offline detection y handling
  - Progressive Web App features
```

#### Accessibility (WCAG 2.1 AA):
- [ ] Keyboard navigation completa
- [ ] Screen reader compatibility
- [ ] Color contrast ratio > 4.5:1
- [ ] Focus indicators visibles
- [ ] Skip links para navegación
- [ ] Alt text para imágenes e iconos

### **Data Validation Rules**

#### Patient Data:
```yaml
ID Format:
  - Pattern: ^\d{10}$
  - Required: true
  - Unique: true

Names:
  - Pattern: ^[A-ZÁÉÍÓÚÑ\s]{2,50}$
  - Required: true
  - Sanitization: trim, uppercase

Expediente Number:
  - Pattern: ^\d{10}$
  - Required: false
  - Unique: per patient

Phone:
  - Pattern: ^\+?52\s?\d{2}\s?\d{4}-?\d{4}$
  - Required: false
  - Format: Mexican format
```

#### File Validation:
```yaml
Supported Formats:
  - PDF: application/pdf
  - Word: application/vnd.openxmlformats-officedocument.wordprocessingml.document
  - Text: text/plain

Size Limits:
  - Individual file: 50MB
  - Batch total: 500MB
  - Daily quota per user: 2GB

Content Validation:
  - Virus scanning: ClamAV
  - Magic number verification
  - Content type matching extension
```

### **Error Handling Standards**

#### HTTP Status Codes:
```yaml
Success Responses:
  - 200: OK - Standard success
  - 201: Created - Resource created
  - 202: Accepted - Async processing started

Client Errors:
  - 400: Bad Request - Invalid input
  - 401: Unauthorized - Auth required
  - 403: Forbidden - Insufficient permissions
  - 404: Not Found - Resource doesn't exist
  - 429: Too Many Requests - Rate limited

Server Errors:
  - 500: Internal Server Error - Unexpected error
  - 502: Bad Gateway - External service error
  - 503: Service Unavailable - Temporary unavailable
```

#### Error Response Format:
```json
{
  "error": {
    "code": "PATIENT_NOT_FOUND",
    "message": "El paciente con ID 1234567890 no existe",
    "details": {
      "searched_id": "1234567890",
      "suggestions": ["1234567891", "1234567892"]
    },
    "timestamp": "2025-01-07T12:00:00Z",
    "request_id": "req_abc123"
  }
}
```

### **Testing Requirements**

#### Unit Testing:
- [ ] Coverage mínima: 80%
- [ ] Testing de servicios críticos: 95%
- [ ] Mocking de dependencias externas
- [ ] Pruebas de edge cases y errores

#### Integration Testing:
- [ ] API endpoints con base de datos real
- [ ] Azure OpenAI integration tests
- [ ] ChromaDB vector operations
- [ ] File upload and processing flows

#### E2E Testing:
- [ ] User journeys completos
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsive testing
- [ ] Performance testing bajo carga

#### Security Testing:
- [ ] Penetration testing trimestral
- [ ] Vulnerability scanning automático
- [ ] SQL injection testing
- [ ] XSS protection verification

---

## 📊 Métricas y KPIs

### **Business Metrics**
```yaml
User Adoption:
  - Daily Active Users (DAU)
  - Weekly Active Users (WAU)
  - Feature adoption rates
  - User retention rate

System Performance:
  - Average response time
  - System uptime percentage
  - Error rate by endpoint
  - User satisfaction score

Medical Impact:
  - Consultas resueltas por médico/día
  - Tiempo promedio de consulta
  - Precisión de respuestas IA
  - Documentos procesados/día
```

### **Technical Metrics**
```yaml
Infrastructure:
  - CPU utilization
  - Memory usage
  - Disk space utilization
  - Network bandwidth

Application:
  - Request throughput (req/sec)
  - Database query performance
  - Cache hit rates
  - File processing times

AI Services:
  - Azure OpenAI API calls/minute
  - Token consumption rate
  - Model response accuracy
  - Vector search performance
```

---

**Documento creado por:** Sistema TecSalud Development Team  
**Última actualización:** 2025-01-07  
**Próxima revisión:** Cada release (1 semana) 