# HISTORIAS DE USUARIO MVP - TecSalud

**Asistente Virtual Médico con IA - Versión MVP**

- **Versión:** 3.0 Consolidada
- **Fecha:** 2025-01-07
- **Proyecto:** TecSalud - Angular + Bamboo + Azure OpenAI

## 📑 ÍNDICE

1. [Médicos y Personal Médico](#médicos-y-personal-médico) (HU-MED-001 a HU-MED-016)
2. [Administradores del Sistema](#administradores-del-sistema) (HU-ADM-001 a HU-ADM-007)
3. [Administradores de Expedientes](#administradores-de-expedientes) (HU-EXP-001 a HU-EXP-014)
4. [IT y DevOps](#it-y-devops) (HU-DEV-001 a HU-DEV-007)
5. [Supervisores y Directores Médicos](#supervisores-y-directores-médicos) (HU-SUP-001 a HU-SUP-005)
6. [Historias de Usuario Futuras](#historias-de-usuario-futuras) (HU-FUT-001 a HU-FUT-010)

## 🚫 HISTORIAS ELIMINADAS DEL MVP

### Eliminadas por Vectorización
- **HU-MED-009:** Búsqueda Semántica en Expedientes ❌
- **HU-EXP-002:** Selección de Tipo de Procesamiento ❌

### Eliminadas por Limitaciones de Conocimiento
- **HU-MED-002:** Análisis Diagnóstico Avanzado ❌ (requiere fuentes médicas especializadas)

---

## 👨‍⚕️ MÉDICOS Y PERSONAL MÉDICO

### HU-MED-001: Consulta Médica Básica ✅ ACTUALIZADA

**Historia de Usuario:** Como médico, quiero hacer consultas médicas rápidas al asistente IA, para obtener información general y análisis de los expedientes de mis pacientes con referencias precisas a los documentos.

#### Reglas de Negocio
- **RN-MED-001:** Todas las consultas deben logearse para auditoría
- **RN-MED-002:** Solo conocimiento general del modelo
- **RN-MED-003:** Respuestas máximo 2000 caracteres
- **RN-MED-004:** Incluir disclaimer que no reemplaza criterio médico profesional
- **RN-MED-006:** Acceso solo a expedientes del paciente seleccionado
- **RN-MED-007:** **NUEVO:** Referencias automáticas a documentos cuando aplique

#### Precondiciones
- **PC-MED-001:** Médico autenticado con credenciales válidas
- **PC-MED-002:** Médico con rol "Médico" en el sistema
- **PC-MED-003:** Azure OpenAI disponible y respondiendo
- **PC-MED-004:** Sesión no expirada (timeout 8 horas)
- **PC-MED-005:** Paciente seleccionado para consultas con contexto
- **PC-MED-006:** **NUEVO:** Contenido OCR disponible para referencias

#### Criterios de Aceptación
- **AC-MED-001:** Respuesta en <5 segundos el 95% de las veces
- **AC-MED-002:** Streaming en tiempo real progresivo
- **AC-MED-003:** Botón "Detener generación" funcional
- **AC-MED-005:** Indicador visual de procesamiento
- **AC-MED-007:** Disclaimer en primera consulta por sesión
- **AC-MED-008:** Solo acceso a documentos del paciente activo
- **AC-MED-009:** **NUEVO:** Referencias automáticas incluidas en respuestas
- **AC-MED-010:** **NUEVO:** Pastillitas de preguntas rápidas visibles

#### Postcondiciones
- **PostC-MED-001:** Consulta registrada en auditoría
- **PostC-MED-002:** Contador de consultas diarias actualizado
- **PostC-MED-003:** Timestamp para métricas de performance
- **PostC-MED-004:** Consulta disponible en historial médico
- **PostC-MED-005:** Acceso a expediente registrado por paciente
- **PostC-MED-006:** **NUEVO:** Referencias a documentos registradas

---

### HU-MED-003: Chat con Streaming en Tiempo Real

**Historia de Usuario:** Como médico, quiero ver las respuestas del asistente IA aparecer en tiempo real mientras se generan, para no perder tiempo esperando y poder interrumpir si es necesario.

#### Reglas de Negocio
- **RN-MED-020:** Streaming debe iniciar en <5 segundos
- **RN-MED-021:** Capacidad de interrumpir en cualquier momento
- **RN-MED-022:** Preservar respuesta parcial al interrumpir
- **RN-MED-023:** Indicador visual de estado de generación
- **RN-MED-024:** Timeout máximo 30 segundos para streaming

#### Precondiciones
- **PC-MED-020:** Conexión estable a internet
- **PC-MED-021:** WebSocket o Server-Sent Events habilitados
- **PC-MED-022:** Sesión de chat activa
- **PC-MED-023:** Azure OpenAI con streaming habilitado

#### Criterios de Aceptación
- **AC-MED-020:** Primer token visible en <5 segundos
- **AC-MED-021:** Texto aparece palabra por palabra suavemente
- **AC-MED-022:** Botón "Detener" siempre visible durante generación
- **AC-MED-023:** Respuesta parcial se guarda al detener
- **AC-MED-025:** Manejo de errores durante streaming

#### Postcondiciones
- **PostC-MED-020:** Respuesta completa o parcial guardada
- **PostC-MED-021:** Tiempo de streaming registrado
- **PostC-MED-022:** Estado de interrupción (si aplica) registrado
- **PostC-MED-023:** Métricas de streaming actualizadas

---

### HU-MED-004: Contexto de Paciente Automático ✅ MODIFICADA

**Historia de Usuario:** Como médico, quiero que el sistema use automáticamente el contexto del paciente seleccionado en mis consultas, para obtener respuestas basadas únicamente en el expediente de ese paciente.

#### Reglas de Negocio
- **RN-MED-030:** Contexto automático solo con paciente seleccionado
- **RN-MED-031:** **MODIFICADO:** Solo documentos del paciente seleccionado disponibles
- **RN-MED-032:** Indicador visual de contexto activo
- **RN-MED-033:** Posibilidad de hacer consultas generales sin contexto
- **RN-MED-035:** **NUEVO:** Prohibido acceso a documentos de otros pacientes, con el paciente corriente

#### Precondiciones
- **PC-MED-030:** Paciente seleccionado en sistema
- **PC-MED-031:** Permisos de acceso al expediente del paciente específico
- **PC-MED-032:** Documentos del paciente disponibles
- **PC-MED-033:** Contexto no expirado

#### Criterios de Aceptación
- **AC-MED-030:** Contexto aplicado automáticamente a consultas
- **AC-MED-031:** Indicador visual de paciente activo
- **AC-MED-032:** Botón para cambiar/quitar contexto
- **AC-MED-033:** Consultas incluyen datos relevantes del paciente
- **AC-MED-034:** Opción de consulta general sin contexto
- **AC-MED-035:** Aviso al cambiar de paciente
- **AC-MED-036:** **NUEVO:** Bloqueo de acceso a documentos de otros pacientes

#### Postcondiciones
- **PostC-MED-030:** Contexto de paciente registrado en consulta
- **PostC-MED-031:** Historial vinculado al paciente específico
- **PostC-MED-032:** Métricas de uso de contexto actualizadas
- **PostC-MED-033:** Última actividad con paciente actualizada
- **PostC-MED-034:** **NUEVO:** Acceso restringido documentado

---

### HU-MED-005: Búsqueda de Pacientes

**Historia de Usuario:** Como médico, quiero buscar pacientes por nombre para acceder rápidamente a su información médica.

#### Reglas de Negocio
- **RN-MED-040:** Solo médicos pueden buscar pacientes
- **RN-MED-041:** Búsqueda case-insensitive con búsqueda parcial
- **RN-MED-042:** Máximo 100 resultados por búsqueda
- **RN-MED-043:** Resultados ordenados por relevancia y fecha
- **RN-MED-044:** Cada búsqueda debe logearse para auditoría

#### Precondiciones
- **PC-MED-040:** Médico autenticado con credenciales válidas
- **PC-MED-041:** Permisos de lectura sobre expedientes
- **PC-MED-042:** Base de datos de pacientes disponible
- **PC-MED-043:** Término de búsqueda mínimo 2 caracteres

#### Criterios de Aceptación
- **AC-MED-040:** Búsqueda completa en <2 segundos
- **AC-MED-041:** Búsqueda por nombre, apellidos
- **AC-MED-042:** Resultados muestran: nombre, ID
- **AC-MED-043:** Términos de búsqueda resaltados en resultados
- **AC-MED-044:** Mensaje "Sin resultados" si no hay coincidencias
- **AC-MED-045:** Selección de paciente por clic
- **AC-MED-046:** Limpieza de búsqueda anterior

#### Postcondiciones
- **PostC-MED-040:** Búsqueda registrada en log de auditoría
- **PostC-MED-041:** Lista de pacientes recientes actualizada
- **PostC-MED-042:** Contexto activo establecido si se selecciona paciente
- **PostC-MED-043:** Métricas de búsqueda actualizadas

---

### HU-MED-006: Selección de Contexto de Paciente

**Historia de Usuario:** Como médico, quiero seleccionar un paciente activo para consultas, para que todas mis preguntas al asistente IA tengan el contexto médico adecuado.

#### Reglas de Negocio
- **RN-MED-050:** Solo un paciente activo por sesión de médico
- **RN-MED-051:** Contexto permanece hasta cambio manual
- **RN-MED-052:** Datos del paciente cargados al seleccionar
- **RN-MED-053:** Indicador visual de paciente activo
- **RN-MED-054:** Confirmación al cambiar de paciente

#### Precondiciones
- **PC-MED-050:** Paciente existente en sistema
- **PC-MED-051:** Médico con permisos sobre el paciente
- **PC-MED-052:** Datos del paciente accesibles
- **PC-MED-053:** Sesión médica activa

#### Criterios de Aceptación
- **AC-MED-050:** Selección de paciente en <2 segundos
- **AC-MED-051:** Datos del paciente visibles inmediatamente
- **AC-MED-052:** Indicador claro de paciente activo
- **AC-MED-053:** Botón para cambiar paciente siempre visible
- **AC-MED-054:** Confirmación antes de cambiar contexto
- **AC-MED-055:** Opción de limpiar contexto completamente

#### Postcondiciones
- **PostC-MED-050:** Contexto de paciente establecido en sesión
- **PostC-MED-051:** Datos del paciente cargados en memoria
- **PostC-MED-052:** Registro de selección para auditoría
- **PostC-MED-053:** Interfaz actualizada con información del paciente

---

### HU-MED-007: Historial de Interacciones

**Historia de Usuario:** Como médico, quiero ver el historial de mis consultas anteriores con cada paciente, para dar continuidad al tratamiento y evitar repetir preguntas.

#### Reglas de Negocio
- **RN-MED-060:** Historial agrupado por paciente
- **RN-MED-061:** Consultas ordenadas cronológicamente
- **RN-MED-062:** Historial disponible de la sesión activa

#### Precondiciones
- **PC-MED-060:** Médico autenticado
- **PC-MED-061:** Consultas previas existentes de la sesión
- **PC-MED-062:** Permisos de acceso al historial de la sesión

#### Criterios de Aceptación
- **AC-MED-060:** Historial carga en <2 segundos
- **AC-MED-061:** Consultas agrupadas por fecha

#### Postcondiciones
- **PostC-MED-060:** Acceso al historial registrado de la sesión
- **PostC-MED-061:** Métricas de uso del historial actualizadas
- **PostC-MED-063:** Última visualización del historial actualizada

---

### HU-MED-008: Información Completa del Paciente ✅ SIMPLIFICADA

**Historia de Usuario:** Como médico, quiero acceder a toda la información del paciente seleccionado (documentos, historial básico), para tomar decisiones médicas informadas.

#### Reglas de Negocio
- **RN-MED-070:** Información completa solo para médicos autorizados
- **RN-MED-071:** **SIMPLIFICADO:** Solo documentos completos (no vectorizados)
- **RN-MED-072:** Historial de documentos del paciente
- **RN-MED-073:** Alertas de información crítica visible
- **RN-MED-074:** Acceso registrado para auditoría
- **RN-MED-075:** **NUEVO:** Acceso estricto solo al paciente seleccionado

#### Precondiciones
- **PC-MED-070:** Médico con permisos sobre el paciente específico
- **PC-MED-071:** Paciente seleccionado en sistema
- **PC-MED-072:** Documentos del paciente disponibles
- **PC-MED-073:** **SIMPLIFICADO:** Información del paciente actualizada (no vectorizada)

#### Criterios de Aceptación
- **AC-MED-070:** Información completa en <5 segundos
- **AC-MED-071:** Documentos organizados cronológicamente
- **AC-MED-072:** Alertas críticas destacadas visualmente
- **AC-MED-073:** **MODIFICADO:** Lista de documentos completos navegable
- **AC-MED-074:** Información de contacto y emergencia visible
- **AC-MED-075:** **NUEVO:** Solo documentos del paciente seleccionado

#### Postcondiciones
- **PostC-MED-070:** Acceso a información registrado
- **PostC-MED-071:** Última consulta de información actualizada
- **PostC-MED-072:** Métricas de uso de información actualizadas
- **PostC-MED-073:** Alertas críticas marcadas como vistas
- **PostC-MED-074:** **NUEVO:** Acceso por paciente específico documentado

---

### HU-MED-010: Análisis de Documentos Específicos ✅ ACTUALIZADA

**Historia de Usuario:** Como médico, quiero solicitar al asistente IA que analice documentos específicos del paciente seleccionado, para obtener resúmenes e interpretaciones con referencias exactas a las secciones analizadas.

#### Reglas de Negocio
- **RN-MED-090:** Análisis solo de documentos del paciente seleccionado
- **RN-MED-092:** Análisis basado en conocimiento general del modelo
- **RN-MED-093:** Referencias específicas al documento
- **RN-MED-094:** Análisis registrado para auditoría
- **RN-MED-095:** Prohibido análisis de documentos de otros pacientes
- **RN-MED-096:** **NUEVO:** Referencias automáticas a páginas/secciones específicas

#### Precondiciones
- **PC-MED-090:** Documento específico del paciente seleccionado
- **PC-MED-091:** Permisos de análisis sobre el documento
- **PC-MED-092:** Documento disponible completo
- **PC-MED-093:** Azure OpenAI disponible para análisis
- **PC-MED-094:** **NUEVO:** Contenido OCR procesado y disponible

#### Criterios de Aceptación
- **AC-MED-090:** Análisis completo en <20 segundos
- **AC-MED-091:** Resumen ejecutivo del documento
- **AC-MED-092:** Análisis basado en conocimiento general
- **AC-MED-093:** Referencias específicas a páginas/secciones
- **AC-MED-094:** Opción de análisis más detallado
- **AC-MED-095:** Confirmación de que es documento del paciente activo
- **AC-MED-096:** **NUEVO:** Enlaces directos a secciones citadas

#### Postcondiciones
- **PostC-MED-090:** Análisis registrado con documento específico
- **PostC-MED-091:** Resumen disponible para futuras consultas
- **PostC-MED-092:** Documento marcado como analizado
- **PostC-MED-093:** Análisis vinculado al paciente específico
- **PostC-MED-094:** **NUEVO:** Referencias a secciones documentadas

---

### HU-MED-011: Acceso a Documentos Completos ✅ MANTENIDA

**Historia de Usuario:** Como médico, quiero acceder a documentos médicos completos del paciente seleccionado, para revisar detalles específicos que requieren el contexto completo.

#### Reglas de Negocio
- **RN-MED-100:** Acceso completo solo al paciente seleccionado
- **RN-MED-101:** Documentos mostrados en formato original
- **RN-MED-102:** Navegación dentro del documento habilitada
- **RN-MED-104:** **NUEVO:** Acceso estricto solo al paciente activo

#### Precondiciones
- **PC-MED-100:** Médico con permisos sobre el paciente seleccionado
- **PC-MED-101:** Documento disponible del paciente activo
- **PC-MED-102:** Formato de documento compatible
- **PC-MED-103:** Almacenamiento de documentos operativo

#### Criterios de Aceptación
- **AC-MED-100:** Documento completo carga en <10 segundos
- **AC-MED-101:** Formato original preservado
- **AC-MED-102:** Navegación por páginas funcional
- **AC-MED-103:** Búsqueda de texto dentro del documento
- **AC-MED-105:** **MODIFICADO:** Acceso solo a documentos del paciente activo

#### Postcondiciones
- **PostC-MED-100:** Acceso a documento registrado por paciente
- **PostC-MED-101:** Tiempo de visualización tracked
- **PostC-MED-102:** Descargas registradas si aplica
- **PostC-MED-103:** **NUEVO:** Acceso documentado por paciente específico

---

### HU-MED-013: Respuestas con Referencias

**Historia de Usuario:** Como médico, quiero que las respuestas del asistente incluyan referencias a documentos específicos del paciente, para verificar la información y profundizar si es necesario.

#### Reglas de Negocio
- **RN-MED-120:** Referencias automáticas a documentos relevantes
- **RN-MED-121:** Enlaces directos a secciones específicas
- **RN-MED-122:** Máximo 10 referencias por respuesta
- **RN-MED-123:** Referencias ordenadas por relevancia
- **RN-MED-124:** Validación de acceso a documentos referenciados

#### Precondiciones
- **PC-MED-120:** Documentos indexados y disponibles
- **PC-MED-121:** Sistema de referencias configurado
- **PC-MED-122:** Permisos de acceso a documentos
- **PC-MED-123:** Contexto de paciente establecido

#### Criterios de Aceptación
- **AC-MED-120:** Referencias incluidas automáticamente
- **AC-MED-121:** Enlaces funcionan correctamente
- **AC-MED-122:** Nombres de documentos descriptivos
- **AC-MED-123:** Fechas y tipos de documento visibles
- **AC-MED-124:** Acceso directo a sección específica
- **AC-MED-125:** Indicador si referencia no disponible

#### Postcondiciones
- **PostC-MED-120:** Referencias registradas con respuesta
- **PostC-MED-121:** Clics en referencias tracked
- **PostC-MED-122:** Métricas de utilidad de referencias
- **PostC-MED-123:** Documentos referenciados marcados como consultados

---

### HU-MED-014: Interfaz Responsive

**Historia de Usuario:** Como médico que usa diferentes dispositivos, quiero que la interfaz se adapte a tablets, laptops y monitores, para trabajar cómodamente desde cualquier dispositivo en el hospital.

#### Reglas de Negocio
- **RN-MED-130:** Soporte para dispositivos móviles, tablets y desktop
- **RN-MED-131:** Funcionalidad completa en todos los dispositivos
- **RN-MED-132:** Navegación optimizada por tipo de dispositivo
- **RN-MED-133:** Tiempo de carga optimizado para móviles
- **RN-MED-134:** Experiencia consistente entre dispositivos

#### Precondiciones
- **PC-MED-130:** Dispositivo con navegador compatible
- **PC-MED-131:** Conexión a internet estable
- **PC-MED-132:** Resolución mínima 320px width
- **PC-MED-133:** JavaScript habilitado

#### Criterios de Aceptación
- **AC-MED-130:** Adaptación automática a tamaño de pantalla
- **AC-MED-131:** Navegación optimizada por dispositivo
- **AC-MED-132:** Textos legibles sin zoom
- **AC-MED-133:** Botones y elementos touch-friendly
- **AC-MED-134:** Carga rápida en dispositivos móviles <3s
- **AC-MED-135:** Funcionalidad completa en todos los dispositivos

#### Postcondiciones
- **PostC-MED-130:** Tipo de dispositivo registrado
- **PostC-MED-131:** Métricas de uso por dispositivo
- **PostC-MED-132:** Performance por dispositivo tracked
- **PostC-MED-133:** Experiencia de usuario evaluada por dispositivo

---

### HU-MED-015: Pastillitas de Preguntas Rápidas ✅ NUEVA

**Historia de Usuario:** Como médico, quiero ver pastillitas con preguntas rápidas arriba del chat, para hacer consultas comunes rápidamente sin tener que escribir.

#### Reglas de Negocio
- **RN-MED-150:** Máximo 8 pastillitas visibles simultáneamente
- **RN-MED-151:** Preguntas contextuales según el paciente seleccionado
- **RN-MED-153:** Rotación de preguntas si hay más de 8
- **RN-MED-154:** Analytics de uso de pastillitas

#### Precondiciones
- **PC-MED-150:** Médico autenticado en el sistema
- **PC-MED-151:** Interfaz de chat disponible
- **PC-MED-152:** Preguntas configuradas en el sistema
- **PC-MED-153:** Contexto de paciente disponible (opcional)

#### Criterios de Aceptación
- **AC-MED-150:** Pastillitas visibles arriba del input de chat
- **AC-MED-151:** Clic en pastillita rellena automáticamente el input
- **AC-MED-152:** Preguntas contextuales si hay paciente seleccionado
- **AC-MED-153:** Preguntas generales si no hay paciente
- **AC-MED-154:** Rotación automática de pastillitas cada 10 segundos
- **AC-MED-155:** Botón "Más preguntas" para ver todas
- **AC-MED-156:** Respuesta inmediata al hacer clic

#### Postcondiciones
- **PostC-MED-150:** Uso de pastillita registrado en analytics
- **PostC-MED-151:** Pregunta enviada automáticamente al asistente
- **PostC-MED-152:** Métricas de pastillitas más usadas actualizadas
- **PostC-MED-153:** Contexto aplicado si corresponde

---

## 🛠️ ADMINISTRADORES DEL SISTEMA

### HU-ADM-001: Gestión de Usuarios Médicos

**Historia de Usuario:** Como administrador del sistema, quiero crear, modificar y desactivar cuentas de médicos, para controlar el acceso al sistema médico.

#### Reglas de Negocio
- **RN-ADM-001:** Solo administradores pueden gestionar usuarios
- **RN-ADM-002:** Validación de credenciales médicas requerida
- **RN-ADM-003:** Desactivación suave preservando historial
- **RN-ADM-004:** Notificación automática de cambios de cuenta
- **RN-ADM-005:** Auditoría completa de cambios de usuarios

#### Precondiciones
- **PC-ADM-001:** Administrador con rol "SysAdmin"
- **PC-ADM-002:** Sistema de gestión de usuarios operativo
- **PC-ADM-003:** Datos válidos del médico disponibles
- **PC-ADM-004:** Servicios de notificación funcionando

#### Criterios de Aceptación
- **AC-ADM-001:** Creación de usuario en <5 segundos
- **AC-ADM-002:** Validación de email único
- **AC-ADM-003:** Generación automática de contraseña temporal
- **AC-ADM-004:** Notificación por email al nuevo usuario
- **AC-ADM-005:** Desactivación sin pérdida de datos
- **AC-ADM-006:** Búsqueda y filtrado de usuarios

#### Postcondiciones
- **PostC-ADM-001:** Usuario creado/modificado en directorio
- **PostC-ADM-002:** Notificación enviada
- **PostC-ADM-003:** Cambio registrado en auditoría
- **PostC-ADM-004:** Métricas de usuarios actualizadas

---

### HU-ADM-002: Asignación de Roles y Permisos

**Historia de Usuario:** Como administrador del sistema, quiero asignar diferentes roles (médico general, especialista, administrador), para controlar qué funcionalidades puede usar cada usuario.

#### Reglas de Negocio
- **RN-ADM-010:** Roles predefinidos y configurables
- **RN-ADM-011:** Permisos granulares por funcionalidad
- **RN-ADM-012:** Cambios de rol requieren aprobación
- **RN-ADM-013:** Roles temporales con fecha de expiración
- **RN-ADM-014:** Herencia de permisos por jerarquía

#### Precondiciones
- **PC-ADM-010:** Sistema de roles configurado
- **PC-ADM-011:** Usuario existente en el sistema
- **PC-ADM-012:** Permisos de administración validados
- **PC-ADM-013:** Matriz de permisos actualizada

#### Criterios de Aceptación
- **AC-ADM-010:** Asignación de rol en <3 segundos
- **AC-ADM-011:** Visualización clara de permisos por rol
- **AC-ADM-012:** Cambios efectivos inmediatamente
- **AC-ADM-013:** Notificación al usuario sobre cambios
- **AC-ADM-014:** Roles temporales con alertas de expiración
- **AC-ADM-015:** Reporte de permisos por usuario

#### Postcondiciones
- **PostC-ADM-010:** Rol asignado en sistema de autenticación
- **PostC-ADM-011:** Permisos actualizados en tiempo real
- **PostC-ADM-012:** Cambio registrado para auditoría
- **PostC-ADM-013:** Usuario notificado del cambio

---

### HU-ADM-003: Dashboard de Salud del Sistema

**Historia de Usuario:** Como administrador del sistema, quiero ver el estado de salud de todos los servicios (Backend, Azure OpenAI, ChromaDB), para detectar y resolver problemas rápidamente.

#### Reglas de Negocio
- **RN-ADM-020:** Dashboard actualizado cada 30 segundos
- **RN-ADM-021:** Servicios críticos con SLA >99%
- **RN-ADM-022:** Alertas automáticas por fallos
- **RN-ADM-023:** Historial de métricas por 30 días
- **RN-ADM-024:** Acceso restringido a administradores

#### Precondiciones
- **PC-ADM-020:** Administrador con rol "SysAdmin"
- **PC-ADM-021:** Servicios de monitoreo ejecutándose
- **PC-ADM-022:** Health checks configurados
- **PC-ADM-023:** Base de datos de métricas accesible

#### Criterios de Aceptación
- **AC-ADM-020:** Status de servicios visible
- **AC-ADM-021:** Tiempo de respuesta promedio mostrado
- **AC-ADM-022:** Usuarios activos en tiempo real
- **AC-ADM-023:** Gráficos de tendencias 24h
- **AC-ADM-024:** Alertas con niveles de severidad
- **AC-ADM-025:** Export de métricas CSV
- **AC-ADM-026:** Actualización automática sin reload

#### Postcondiciones
- **PostC-ADM-020:** Acceso registrado para auditoría
- **PostC-ADM-021:** Métricas de uso del dashboard
- **PostC-ADM-022:** Alertas marcadas como vistas
- **PostC-ADM-023:** Estado del sistema documentado

---

### HU-ADM-004: Monitoreo de Performance

**Historia de Usuario:** Como administrador del sistema, quiero ver métricas de rendimiento del sistema (tiempo de respuesta, uso de recursos), para optimizar el performance y planificar escalabilidad.

#### Reglas de Negocio
- **RN-ADM-030:** Métricas en tiempo real y históricas
- **RN-ADM-031:** Umbrales configurables de alertas
- **RN-ADM-032:** Reportes automatizados semanales
- **RN-ADM-033:** Correlación entre métricas
- **RN-ADM-034:** Proyecciones de crecimiento

#### Precondiciones
- **PC-ADM-030:** Sistema de métricas configurado
- **PC-ADM-031:** Agentes de monitoreo instalados
- **PC-ADM-032:** Base de datos de métricas operativa
- **PC-ADM-033:** Herramientas de análisis disponibles

#### Criterios de Aceptación
- **AC-ADM-030:** Métricas actualizadas cada minuto
- **AC-ADM-031:** Dashboards por servicio específico
- **AC-ADM-032:** Alertas configurables por umbral
- **AC-ADM-033:** Gráficos de tendencias personalizables
- **AC-ADM-034:** Reportes exportables
- **AC-ADM-035:** Comparación entre períodos

#### Postcondiciones
- **PostC-ADM-030:** Métricas recolectadas continuamente
- **PostC-ADM-031:** Alertas enviadas según configuración
- **PostC-ADM-032:** Reportes generados automáticamente
- **PostC-ADM-033:** Datos históricos preservados

---

### HU-ADM-005: Logs y Auditoría

**Historia de Usuario:** Como administrador del sistema, quiero acceder a logs detallados de consultas médicas y actividad del sistema, para auditoría, troubleshooting y compliance.

#### Reglas de Negocio
- **RN-ADM-040:** Logs completos por 12 meses
- **RN-ADM-041:** Información sensible encriptada
- **RN-ADM-042:** Acceso restringido y registrado
- **RN-ADM-043:** Búsqueda avanzada disponible
- **RN-ADM-044:** Exportación controlada de logs

#### Precondiciones
- **PC-ADM-040:** Sistema de logging configurado
- **PC-ADM-041:** Permisos de auditoría validados
- **PC-ADM-042:** Almacenamiento de logs disponible
- **PC-ADM-043:** Herramientas de búsqueda operativas

#### Criterios de Aceptación
- **AC-ADM-040:** Búsqueda de logs en <10 segundos
- **AC-ADM-041:** Filtros por fecha, usuario, tipo
- **AC-ADM-042:** Visualización de logs estructurados
- **AC-ADM-043:** Exportación a múltiples formatos
- **AC-ADM-044:** Correlación entre eventos
- **AC-ADM-045:** Alertas por patrones anómalos

#### Postcondiciones
- **PostC-ADM-040:** Consulta de logs registrada
- **PostC-ADM-041:** Exportaciones tracked
- **PostC-ADM-042:** Métricas de uso de auditoría
- **PostC-ADM-043:** Compliance reportado

---

### HU-ADM-006: Configuración de Azure OpenAI

**Historia de Usuario:** Como administrador del sistema, quiero configurar y monitorear la conexión con Azure OpenAI, para asegurar que el servicio de IA funcione correctamente.

#### Reglas de Negocio
- **RN-ADM-050:** Configuración encriptada y segura
- **RN-ADM-051:** Monitoreo de quotas y límites
- **RN-ADM-053:** Logs de uso detallados
- **RN-ADM-054:** Alertas por consumo excesivo

#### Precondiciones
- **PC-ADM-050:** Cuenta Azure OpenAI válida
- **PC-ADM-051:** Permisos de administración Azure
- **PC-ADM-052:** Configuración de red apropiada
- **PC-ADM-053:** Herramientas de monitoreo instaladas

#### Criterios de Aceptación
- **AC-ADM-050:** Configuración en interfaz gráfica
- **AC-ADM-051:** Test de conectividad disponible
- **AC-ADM-052:** Monitoreo de tokens utilizados
- **AC-ADM-053:** Alertas por límites de quota
- **AC-ADM-054:** Métricas de performance API
- **AC-ADM-055:** Backup de configuración automático

#### Postcondiciones
- **PostC-ADM-050:** Configuración almacenada seguramente
- **PostC-ADM-051:** Conexión establecida y monitoreada
- **PostC-ADM-052:** Métricas de uso recolectadas
- **PostC-ADM-053:** Alertas configuradas

---

### HU-ADM-007: Configuración de Base de Datos

**Historia de Usuario:** Como administrador del sistema, quiero gestionar la configuración de la base de datos, para mantener la integridad y performance de los datos.

#### Reglas de Negocio
- **RN-ADM-060:** Configuración con validation automática
- **RN-ADM-061:** Backups automáticos configurados
- **RN-ADM-062:** Monitoreo de performance BD
- **RN-ADM-063:** Índices optimizados automáticamente
- **RN-ADM-064:** Configuración replicada entre ambientes

#### Precondiciones
- **PC-ADM-060:** Base de datos instalada y operativa
- **PC-ADM-061:** Permisos de administración BD
- **PC-ADM-062:** Herramientas de gestión disponibles
- **PC-ADM-063:** Configuración de red apropiada

#### Criterios de Aceptación
- **AC-ADM-060:** Interfaz de configuración intuitiva
- **AC-ADM-061:** Validación automática de cambios
- **AC-ADM-062:** Aplicación de cambios sin downtime
- **AC-ADM-063:** Monitoreo de performance BD
- **AC-ADM-064:** Backups programados
- **AC-ADM-065:** Rollback de configuración disponible

#### Postcondiciones
- **PostC-ADM-060:** Configuración aplicada y validada
- **PostC-ADM-061:** Cambios registrados en auditoría
- **PostC-ADM-062:** Performance monitoreada
- **PostC-ADM-063:** Backup de configuración creado

---

## 📋 ADMINISTRADORES DE EXPEDIENTES (CONSOLIDADO)

### HU-EXP-001: Carga de Expedientes TecSalud ✅ ACTUALIZADA

**Historia de Usuario:** Como administrador de expedientes, quiero cargar expedientes médicos de TecSalud con procesamiento OCR automático, para que estén disponibles como documentos completos y contenido textual para los médicos.

#### Reglas de Negocio
- **RN-EXP-001:** Máximo 50 archivos por carga (reducido para MVP)
- **RN-EXP-002:** Formatos: PDF
- **RN-EXP-003:** Tamaño máximo 50MB por archivo
- **RN-EXP-004:** Naming convention: [ID_PACIENTE][TIPO][FECHA]
- **RN-EXP-006:** Solo almacenamiento de documentos completos
- **RN-EXP-007:** Procesamiento OCR automático obligatorio

#### Precondiciones
- **PC-EXP-001:** Administrador con rol "Admin_Expedientes"
- **PC-EXP-002:** Servicio de almacenamiento operativo
- **PC-EXP-004:** **NUEVO:** Servicio OCR disponible
- **PC-EXP-005:** **NUEVO:** Base de datos para contenido textual

#### Criterios de Aceptación
- **AC-EXP-001:** Drag & drop múltiples archivos
- **AC-EXP-002:** Progress bar individual por archivo
- **AC-EXP-003:** Cancelación individual sin afectar otros
- **AC-EXP-004:** Validación antes de procesamiento
- **AC-EXP-005:** Preview de metadatos básicos
- **AC-EXP-006:** Reporte de éxito/errores
- **AC-EXP-007:** Procesamiento secuencial (no paralelo)
- **AC-EXP-008:** Detección de duplicados
- **AC-EXP-009:** **NUEVO:** OCR automático para cada documento
- **AC-EXP-010:** **NUEVO:** Indicador de progreso OCR
- **AC-EXP-011:** **NUEVO:** Calidad OCR mostrada en reporte

#### Postcondiciones
- **PostC-EXP-001:** Documentos en Azure Blob Storage
- **PostC-EXP-002:** Perfiles de pacientes actualizados
- **PostC-EXP-003:** Log de auditoría generado
- **PostC-EXP-004:** Notificación con reporte enviada
- **PostC-EXP-005:** **NUEVO:** Contenido OCR almacenado en BD
- **PostC-EXP-006:** **NUEVO:** Documentos indexados para búsqueda

---

### HU-EXP-003: Parsing Automático de Archivos ✅ SIMPLIFICADA

**Historia de Usuario:** Como administrador de expedientes, quiero que el sistema extraiga automáticamente metadatos básicos desde nombres de archivos TecSalud, para organizar documentos por paciente.

#### Reglas de Negocio
- **RN-EXP-020:** Parsing basado en convención TecSalud
- **RN-EXP-021:** Validación de formato de nombre
- **RN-EXP-022:** Extracción de ID, tipo, fecha
- **RN-EXP-023:** **SIMPLIFICADO:** Solo metadatos básicos (no vectorización)
- **RN-EXP-024:** Validación de datos extraídos

#### Precondiciones
- **PC-EXP-020:** Archivos con naming convention TecSalud
- **PC-EXP-021:** Sistema de parsing configurado
- **PC-EXP-022:** Base de datos de pacientes disponible
- **PC-EXP-023:** **SIMPLIFICADO:** Validadores de metadatos operativos

#### Criterios de Aceptación
- **AC-EXP-020:** Parsing automático al cargar archivo
- **AC-EXP-021:** Mostrar metadatos extraídos para confirmación
- **AC-EXP-022:** Validación de ID de paciente
- **AC-EXP-023:** Fecha extraída y validada
- **AC-EXP-024:** Tipo de documento identificado
- **AC-EXP-025:** **SIMPLIFICADO:** Asociación directa con paciente

#### Postcondiciones
- **PostC-EXP-020:** Metadatos extraídos y validados
- **PostC-EXP-021:** Archivo asociado con paciente correcto
- **PostC-EXP-022:** **SIMPLIFICADO:** Métricas de parsing actualizadas
- **PostC-EXP-023:** Documento disponible para médicos del paciente

---

### HU-EXP-004: Interfaz Drag & Drop

**Historia de Usuario:** Como administrador de expedientes, quiero arrastrar y soltar archivos para cargar documentos, para tener una experiencia de usuario intuitiva y rápida.

#### Reglas de Negocio
- **RN-EXP-030:** Soporte para múltiples archivos simultáneos
- **RN-EXP-031:** Validación inmediata al drop
- **RN-EXP-032:** Indicadores visuales claros
- **RN-EXP-033:** Prevención de duplicados
- **RN-EXP-034:** Límites de tamaño y cantidad

#### Precondiciones
- **PC-EXP-030:** Navegador con soporte HTML5
- **PC-EXP-031:** JavaScript habilitado
- **PC-EXP-032:** Archivos en formato compatible
- **PC-EXP-033:** Permisos de carga validados

#### Criterios de Aceptación
- **AC-EXP-030:** Área de drop claramente identificada
- **AC-EXP-031:** Feedback visual durante drag
- **AC-EXP-032:** Validación inmediata al drop
- **AC-EXP-033:** Lista de archivos pre-carga
- **AC-EXP-034:** Opción de remover archivos antes de procesar
- **AC-EXP-035:** Fallback a selección tradicional

#### Postcondiciones
- **PostC-EXP-030:** Archivos preparados para procesamiento
- **PostC-EXP-031:** Validaciones iniciales completadas
- **PostC-EXP-032:** Métricas de usabilidad actualizadas
- **PostC-EXP-033:** Interfaz lista para procesamiento

---

### HU-EXP-005: Matching Inteligente de Pacientes

**Historia de Usuario:** Como administrador de expedientes, quiero que el sistema identifique automáticamente pacientes existentes, para evitar duplicados y mantener historiales consolidados.

#### Reglas de Negocio
- **RN-EXP-040:** Matching por múltiples campos
- **RN-EXP-041:** Score de confianza calculado
- **RN-EXP-042:** Threshold configurable para auto-match
- **RN-EXP-043:** Revisión manual para casos dudosos
- **RN-EXP-044:** Registro de decisiones de matching

#### Precondiciones
- **PC-EXP-040:** Base de datos de pacientes disponible
- **PC-EXP-041:** Algoritmo de matching configurado
- **PC-EXP-042:** Datos del paciente extraídos
- **PC-EXP-043:** Servicios de matching operativos

#### Criterios de Aceptación
- **AC-EXP-040:** Matching automático en <5 segundos
- **AC-EXP-041:** Score de confianza visible
- **AC-EXP-042:** Múltiples candidatos mostrados
- **AC-EXP-043:** Comparación lado a lado
- **AC-EXP-044:** Decisión manual registrada
- **AC-EXP-045:** Creación de nuevo paciente si no match

#### Postcondiciones
- **PostC-EXP-040:** Paciente identificado o creado
- **PostC-EXP-041:** Decisión de matching registrada
- **PostC-EXP-042:** Métricas de matching actualizadas
- **PostC-EXP-043:** Documento asociado con paciente correcto

---

### HU-EXP-007: Creación Automática de Pacientes Nuevos

**Historia de Usuario:** Como administrador de expedientes, quiero que el sistema cree automáticamente perfiles para pacientes nuevos, para agilizar el proceso de ingreso de expedientes.

#### Reglas de Negocio
- **RN-EXP-060:** Creación automática si no hay match
- **RN-EXP-061:** Datos mínimos requeridos validados
- **RN-EXP-062:** ID único generado automáticamente
- **RN-EXP-063:** Perfil marcado como "pendiente validación"
- **RN-EXP-064:** Notificación de nuevos pacientes

#### Precondiciones
- **PC-EXP-060:** No match encontrado en sistema
- **PC-EXP-061:** Datos mínimos extraídos del documento
- **PC-EXP-062:** Sistema de IDs configurado
- **PC-EXP-063:** Base de datos de pacientes disponible

#### Criterios de Aceptación
- **AC-EXP-060:** Creación automática en <3 segundos
- **AC-EXP-061:** ID único generado y validado
- **AC-EXP-062:** Perfil con datos básicos poblado
- **AC-EXP-063:** Estado "pendiente validación" asignado
- **AC-EXP-064:** Notificación automática generada
- **AC-EXP-065:** Documento asociado inmediatamente

#### Postcondiciones
- **PostC-EXP-060:** Nuevo paciente creado en sistema
- **PostC-EXP-061:** Documento asociado con paciente nuevo
- **PostC-EXP-062:** Notificación enviada a supervisores
- **PostC-EXP-063:** Métricas de nuevos pacientes actualizadas

---

### HU-EXP-009: Estado de Procesamiento en Tiempo Real

**Historia de Usuario:** Como administrador de expedientes, quiero ver el estado de procesamiento de cada archivo en tiempo real, para monitorear el progreso y detectar errores.

#### Reglas de Negocio
- **RN-EXP-080:** Progreso actualizado cada 5 segundos
- **RN-EXP-081:** Estimación de tiempo restante
- **RN-EXP-082:** Alertas por errores o fallos
- **RN-EXP-083:** Posibilidad de pausar/reanudar
- **RN-EXP-084:** Logs detallados de procesamiento

#### Precondiciones
- **PC-EXP-080:** Carga masiva en progreso
- **PC-EXP-081:** Sistema de monitoreo operativo
- **PC-EXP-082:** WebSocket o polling configurado
- **PC-EXP-083:** Logs de procesamiento disponibles

#### Criterios de Aceptación
- **AC-EXP-080:** Progress bar global y por archivo
- **AC-EXP-081:** Estimación de tiempo restante
- **AC-EXP-082:** Lista de archivos procesados/pendientes
- **AC-EXP-083:** Alertas por errores inmediatas
- **AC-EXP-084:** Opción de pausar/reanudar
- **AC-EXP-085:** Logs detallados accesibles

#### Postcondiciones
- **PostC-EXP-080:** Progreso monitoreado continuamente
- **PostC-EXP-081:** Errores registrados y reportados
- **PostC-EXP-082:** Métricas de performance actualizadas
- **PostC-EXP-083:** Estado final documentado

---

### HU-EXP-010: Reporte de Resultados de Carga

**Historia de Usuario:** Como administrador de expedientes, quiero ver un reporte detallado después de cada carga masiva, para verificar que todos los documentos se procesaron correctamente.

#### Reglas de Negocio
- **RN-EXP-100:** Reportes por período configurable
- **RN-EXP-101:** Métricas de éxito/fallo incluidas
- **RN-EXP-102:** Análisis de performance por tipo
- **RN-EXP-103:** Exportación a múltiples formatos
- **RN-EXP-104:** Distribución automática a stakeholders

#### Precondiciones
- **PC-EXP-100:** Datos de cargas disponibles
- **PC-EXP-101:** Sistema de reportes configurado
- **PC-EXP-102:** Métricas recolectadas
- **PC-EXP-103:** Templates de reportes definidos

#### Criterios de Aceptación
- **AC-EXP-100:** Reportes generados automáticamente
- **AC-EXP-101:** Métricas clave incluidas
- **AC-EXP-102:** Gráficos y visualizaciones
- **AC-EXP-103:** Exportación PDF/Excel disponible
- **AC-EXP-104:** Distribución automática configurada
- **AC-EXP-105:** Reportes históricos accesibles

#### Postcondiciones
- **PostC-EXP-100:** Reportes generados y distribuidos
- **PostC-EXP-101:** Métricas documentadas
- **PostC-EXP-102:** Análisis de tendencias disponible
- **PostC-EXP-103:** Mejoras identificadas y documentadas

---

### HU-EXP-011: Manejo de Errores de Procesamiento

**Historia de Usuario:** Como administrador de expedientes, quiero ver detalles de archivos que fallaron en el procesamiento, para corregir problemas y reprocesar documentos.

#### Reglas de Negocio
- **RN-EXP-090:** Reintentos automáticos hasta 3 veces
- **RN-EXP-091:** Escalation manual después de fallos
- **RN-EXP-092:** Categorización de tipos de error
- **RN-EXP-093:** Queue de reintentos programados
- **RN-EXP-094:** Notificación de fallos persistentes

#### Precondiciones
- **PC-EXP-090:** Archivos con errores de procesamiento
- **PC-EXP-091:** Sistema de reintentos configurado
- **PC-EXP-092:** Categorización de errores definida
- **PC-EXP-093:** Queue de procesamiento operativa

#### Criterios de Aceptación
- **AC-EXP-090:** Lista de archivos fallidos clara
- **AC-EXP-091:** Tipo de error mostrado
- **AC-EXP-092:** Opción de reintento manual
- **AC-EXP-093:** Reintentos automáticos programados
- **AC-EXP-094:** Logs detallados de errores
- **AC-EXP-095:** Notificación de fallos persistentes

#### Postcondiciones
- **PostC-EXP-090:** Errores categorizados y registrados
- **PostC-EXP-091:** Reintentos programados o ejecutados
- **PostC-EXP-092:** Métricas de errores actualizadas
- **PostC-EXP-093:** Fallos persistentes escalados

---

### HU-EXP-012: Carga Individual de Documentos

**Historia de Usuario:** Como administrador de expedientes, quiero cargar documentos individuales cuando sea necesario, para manejar casos especiales o documentos urgentes.

#### Reglas de Negocio
- **RN-EXP-110:** Tipos predefinidos y personalizables
- **RN-EXP-111:** Configuración de procesamiento por tipo
- **RN-EXP-112:** Validación de cambios antes de aplicar
- **RN-EXP-113:** Versionado de configuraciones
- **RN-EXP-114:** Impacto en documentos existentes evaluado

#### Precondiciones
- **PC-EXP-110:** Sistema de configuración operativo
- **PC-EXP-111:** Permisos de administración validados
- **PC-EXP-112:** Backup de configuración actual
- **PC-EXP-113:** Documentos existentes catalogados

#### Criterios de Aceptación
- **AC-EXP-110:** Interfaz de configuración intuitiva
- **AC-EXP-111:** Tipos de documento editables
- **AC-EXP-112:** Configuración de procesamiento por tipo
- **AC-EXP-113:** Validación antes de aplicar cambios
- **AC-EXP-114:** Versionado de configuraciones
- **AC-EXP-115:** Rollback disponible

#### Postcondiciones
- **PostC-EXP-110:** Configuración actualizada y aplicada
- **PostC-EXP-111:** Cambios registrados en auditoría
- **PostC-EXP-112:** Documentos existentes re-categorizados si necesario
- **PostC-EXP-113:** Métricas de configuración actualizadas

---

### HU-EXP-014: Procesamiento OCR de Documentos ✅ NUEVA

**Historia de Usuario:** Como administrador de expedientes, quiero que el sistema extraiga automáticamente el contenido de texto de los documentos usando OCR, para que el asistente pueda analizar el contenido textual.

#### Reglas de Negocio
- **RN-EXP-130:** OCR automático para PDF e imágenes
- **RN-EXP-131:** Contenido OCR almacenado en base de datos
- **RN-EXP-132:** Backup del documento original siempre preservado
- **RN-EXP-133:** Validación de calidad del OCR
- **RN-EXP-134:** Reintento automático si OCR falla

#### Precondiciones
- **PC-EXP-130:** Documento cargado en el sistema
- **PC-EXP-131:** Servicio OCR disponible (Azure Document Intelligence)
- **PC-EXP-132:** Base de datos para contenido textual operativa
- **PC-EXP-133:** Espacio de almacenamiento suficiente

#### Criterios de Aceptación
- **AC-EXP-130:** OCR automático al cargar documento
- **AC-EXP-131:** Contenido extraído almacenado en BD
- **AC-EXP-132:** Indicador de calidad del OCR
- **AC-EXP-133:** Opción de revisión manual si calidad baja
- **AC-EXP-134:** Preservación de formato original
- **AC-EXP-135:** Tiempo de procesamiento <2 minutos por documento
- **AC-EXP-136:** Reintento automático hasta 3 veces si falla

#### Postcondiciones
- **PostC-EXP-130:** Contenido textual disponible para consultas
- **PostC-EXP-131:** Métricas de calidad OCR registradas
- **PostC-EXP-132:** Documento marcado como procesado
- **PostC-EXP-133:** Contenido indexado para búsqueda

---

## 🔧 IT Y DEVOPS

### HU-DEV-001: Despliegue con Docker

**Historia de Usuario:** Como ingeniero DevOps, quiero desplegar el sistema completo usando Docker, para tener un ambiente consistente y reproducible.

#### Reglas de Negocio
- **RN-DEV-001:** Contenedores con configuración inmutable
- **RN-DEV-002:** Servicios independientes y escalables
- **RN-DEV-003:** Secrets management integrado
- **RN-DEV-004:** Health checks obligatorios
- **RN-DEV-005:** Logs centralizados

#### Precondiciones
- **PC-DEV-001:** Docker soportado
- **PC-DEV-002:** Archivos de configuración disponibles
- **PC-DEV-003:** Secrets configurados correctamente
- **PC-DEV-004:** Recursos del sistema suficientes

#### Criterios de Aceptación
- **AC-DEV-001:** Deploy completo
- **AC-DEV-002:** Todos los servicios healthy al inicio
- **AC-DEV-003:** Configuración via variables de entorno
- **AC-DEV-004:** Rollback en caso de fallo
- **AC-DEV-005:** Monitoreo de containers operativo
- **AC-DEV-006:** Logs accesibles desde un punto central

#### Postcondiciones
- **PostC-DEV-001:** Sistema completo desplegado y operativo
- **PostC-DEV-002:** Monitoreo activo de todos los servicios
- **PostC-DEV-003:** Logs siendo recolectados centralmente
- **PostC-DEV-004:** Métricas de deployment registradas

---

### HU-DEV-002: CI/CD Pipeline

**Historia de Usuario:** Como ingeniero DevOps, quiero configurar pipelines de CI/CD para testing y deployment automático, para asegurar calidad y acelerar releases.

#### Reglas de Negocio
- **RN-DEV-010:** Tests automáticos obligatorios (unit test)
- **RN-DEV-011:** Deployment automático solo con tests
- **RN-DEV-012:** Environments separados (dev, staging, prod)
- **RN-DEV-013:** Rollback en caso de fallo
- **RN-DEV-014:** Notificaciones de deployment

#### Precondiciones
- **PC-DEV-010:** Repository con código fuente
- **PC-DEV-011:** CI/CD platform configurado
- **PC-DEV-012:** Tests automatizados disponibles
- **PC-DEV-013:** Ambientes target configurados

#### Criterios de Aceptación
- **AC-DEV-010:** Pipeline ejecutable
- **AC-DEV-011:** Tests unitarios
- **AC-DEV-012:** Deployment automático a staging
- **AC-DEV-013:** Approval manual para producción
- **AC-DEV-014:** Rollback ejecutable

#### Postcondiciones
- **PostC-DEV-010:** Pipeline configurado y operativo
- **PostC-DEV-011:** Deployments automáticos funcionando
- **PostC-DEV-012:** Métricas de pipeline recolectadas
- **PostC-DEV-013:** Historial de deployments disponible

---

### HU-DEV-003: Monitoreo de Infraestructura

**Historia de Usuario:** Como ingeniero DevOps, quiero monitorear el uso de recursos y performance del sistema, para optimizar costos y asegurar disponibilidad.

#### Reglas de Negocio
- **RN-DEV-020:** Monitoreo 24/7 de recursos críticos con herramientas de Azure
- **RN-DEV-021:** Alertas automáticas por umbrales
- **RN-DEV-022:** Métricas históricas por 90 días

#### Precondiciones
- **PC-DEV-020:** Herramientas de monitoreo instaladas
- **PC-DEV-021:** Agentes en todos los servicios
- **PC-DEV-022:** Configuración de alertas definida
- **PC-DEV-023:** Dashboards configurados

#### Criterios de Aceptación
- **AC-DEV-020:** Métricas actualizadas
- **AC-DEV-021:** Alertas enviadas en
- **AC-DEV-022:** Dashboards accesibles 24/7
- **AC-DEV-023:** Métricas: CPU, memoria, disco, red

#### Postcondiciones
- **PostC-DEV-020:** Monitoreo continuo activo
- **PostC-DEV-021:** Alertas configuradas y funcionales
- **PostC-DEV-022:** Métricas históricas preservadas

---

### HU-DEV-004: Backup Automático de Datos

**Historia de Usuario:** Como ingeniero DevOps, quiero que se hagan backups automáticos de la base de datos y documentos, para proteger la información médica crítica.

#### Reglas de Negocio
- **RN-DEV-030:** Backups diarios automáticos
- **RN-DEV-031:** Retención por 7 años (compliance médico)
- **RN-DEV-032:** Backups encriptados en tránsito y reposo
- **RN-DEV-033:** Verificación de integridad automática

#### Precondiciones
- **PC-DEV-030:** Herramientas de backup instaladas
- **PC-DEV-031:** Almacenamiento suficiente disponible
- **PC-DEV-032:** Credenciales de acceso configuradas
- **PC-DEV-033:** Programación de backups definida

#### Criterios de Aceptación
- **AC-DEV-030:** Backup completo diario automático
- **AC-DEV-031:** Verificación de integridad exitosa
- **AC-DEV-032:** Notificación de éxito/fallo

#### Postcondiciones
- **PostC-DEV-030:** Backup completado y verificado
- **PostC-DEV-031:** Notificación de status enviada
- **PostC-DEV-032:** Métricas de backup actualizadas
- **PostC-DEV-033:** Logs de backup preservados

---

### HU-DEV-006: Implementación de HTTPS y SSL

**Historia de Usuario:** Como ingeniero DevOps, quiero implementar HTTPS en todo el sistema, para proteger la transmisión de datos médicos sensibles.

#### Reglas de Negocio
- **RN-DEV-050:** HTTPS obligatorio para toda comunicación
- **RN-DEV-051:** Certificados SSL válidos
- **RN-DEV-052:** Redirección automática HTTP a HTTPS
- **RN-DEV-053:** HSTS headers configurados
- **RN-DEV-054:** Certificados monitoreados por expiración

#### Precondiciones
- **PC-DEV-050:** Certificados SSL válidos disponibles
- **PC-DEV-051:** Configuración de web servers
- **PC-DEV-052:** DNS configurado correctamente
- **PC-DEV-053:** Load balancers configurados

#### Criterios de Aceptación
- **AC-DEV-050:** Todo el tráfico sobre HTTPS
- **AC-DEV-051:** Certificados válidos y confiables
- **AC-DEV-052:** Redirección automática funcional
- **AC-DEV-053:** Headers de seguridad configurados
- **AC-DEV-054:** Alertas por expiración de certificados

#### Postcondiciones
- **PostC-DEV-050:** Comunicación completamente encriptada
- **PostC-DEV-051:** Certificados monitoreados
- **PostC-DEV-052:** Métricas de seguridad actualizadas

---

### HU-DEV-007: Gestión de Secretos

**Historia de Usuario:** Como ingeniero DevOps, quiero gestionar API keys y secretos usando herramientas seguras, para evitar exposición accidental de credenciales.

#### Reglas de Negocio
- **RN-DEV-060:** Secretos nunca en código fuente
- **RN-DEV-062:** Acceso auditado y controlado
- **RN-DEV-063:** Encriptación en reposo y tránsito
- **RN-DEV-064:** Principio de menor privilegio

#### Precondiciones
- **PC-DEV-060:** Herramienta de gestión de secretos instalada
- **PC-DEV-061:** Policies de acceso definidas
- **PC-DEV-062:** Integración con aplicaciones configurada

#### Criterios de Aceptación
- **AC-DEV-060:** Todos los secretos en vault seguro
- **AC-DEV-061:** Acceso programático desde aplicaciones
- **AC-DEV-063:** Auditoría de acceso a secretos
- **AC-DEV-065:** Backup de secretos encriptado

#### Postcondiciones
- **PostC-DEV-060:** Secretos gestionados centralmente
- **PostC-DEV-061:** Acceso controlado
- **PostC-DEV-063:** Métricas de seguridad actualizadas

---

## 👥 SUPERVISORES Y DIRECTORES MÉDICOS

### HU-SUP-001: Dashboard Ejecutivo

**Historia de Usuario:** Como director médico, quiero ver un dashboard con métricas de uso del sistema por departamento, para evaluar adopción y ROI del sistema.

#### Reglas de Negocio
- **RN-SUP-001:** Solo directores/supervisores acceden
- **RN-SUP-002:** Datos anonimizados sin identificar médicos
- **RN-SUP-003:** Métricas actualizadas diariamente 6:00 AM
- **RN-SUP-004:** Historial de 12 meses para tendencias
- **RN-SUP-005:** Departamentos ven solo sus métricas

#### Precondiciones
- **PC-SUP-001:** Usuario con rol "Director" o "Supervisor"
- **PC-SUP-002:** Usuario asignado a departamento
- **PC-SUP-003:** Servicio de analytics operativo
- **PC-SUP-004:** Datos actualizados disponibles

#### Criterios de Aceptación
- **AC-SUP-001:** Métricas por departamento: consultas/día, usuarios activos, tiempo promedio
- **AC-SUP-002:** Comparación con período anterior
- **AC-SUP-003:** Top 10 consultas más frecuentes
- **AC-SUP-004:** Métricas de satisfaction de usuarios
- **AC-SUP-005:** Filtros por rango de fechas
- **AC-SUP-006:** Reportes exportables PDF/Excel
- **AC-SUP-007:** Alertas por anomalías en uso

#### Postcondiciones
- **PostC-SUP-001:** Acceso registrado para auditoría
- **PostC-SUP-002:** Contador de visualizaciones actualizado
- **PostC-SUP-003:** Reportes generados guardados
- **PostC-SUP-004:** Métricas de uso del dashboard actualizadas

---

### HU-SUP-002: Reportes de Consultas IA

**Historia de Usuario:** Como supervisor médico, quiero ver reportes de tipos de consultas más frecuentes al asistente IA, para identificar necesidades de capacitación médica.

#### Reglas de Negocio
- **RN-SUP-010:** Consultas categorizadas automáticamente en base a pastillas
- **RN-SUP-011:** Reportes semanales y mensuales

#### Precondiciones
- **PC-SUP-010:** Sistema de categorización operativo en base a pastillas
- **PC-SUP-011:** Datos de consultas disponibles
- **PC-SUP-012:** Herramientas de análisis configuradas
- **PC-SUP-013:** Permisos de acceso a analytics

#### Criterios de Aceptación
- **AC-SUP-010:** Categorización de consultas visible
- **AC-SUP-012:** Comparación entre períodos
- **AC-SUP-013:** Identificación de temas recurrentes

#### Postcondiciones
- **PostC-SUP-010:** Reportes generados y distribuidos
- **PostC-SUP-011:** Recomendaciones documentadas
- **PostC-SUP-012:** Métricas de análisis actualizadas
- **PostC-SUP-013:** Acciones de seguimiento registradas

---

*Documento generado el 2025-01-07 para TecSalud MVP v3.0*

