# Guía de Experiencia de Usuario e Interacción
# ASISTENTE VIRTUAL PARA EXPEDIENTES CLÍNICOS - TEC SALUD

**Versión:** 1.0  
**Fecha:** 17 de Junio de 2025  
**Preparado para:** Equipo de Diseño y Desarrollo  

## Índice

1. [Introducción](#1-introducción)
2. [Modelo Mental y Principios de Interacción](#2-modelo-mental-y-principios-de-interacción)
3. [Flujos de Interacción Principales](#3-flujos-de-interacción-principales)
4. [Diagramas de Flujo Conversacional](#4-diagramas-de-flujo-conversacional)
5. [Microinteracciones y Feedback](#5-microinteracciones-y-feedback)
6. [Escenarios de Uso Detallados](#6-escenarios-de-uso-detallados)
7. [Consideraciones de Usabilidad](#7-consideraciones-de-usabilidad)
8. [Pruebas de Interacción Recomendadas](#8-pruebas-de-interacción-recomendadas)

## 1. Introducción

Este documento describe en detalle la experiencia de usuario (UX) y los patrones de interacción para el Asistente Virtual para Expedientes Clínicos de TecSalud. A diferencia de las especificaciones visuales o técnicas, este documento se centra en cómo los médicos interactúan con el sistema y cómo el sistema responde a estas interacciones, basándose específicamente en el flujo de trabajo del Dr. Solis.

### 1.1 Propósito

El propósito de este documento es proporcionar una guía clara sobre:

- Cómo funciona la interacción entre el médico y el Asistente Virtual (Copiloto)
- Los diferentes flujos conversacionales y sus resultados
- Las respuestas del sistema a acciones específicas del usuario médico
- Las microinteracciones y feedback visual durante el uso clínico
- Los escenarios de uso más comunes en el contexto médico y cómo se desarrollan

### 1.2 Audiencia

Este documento está dirigido a:

- Diseñadores UX/UI que necesitan entender los flujos de interacción médica
- Desarrolladores que implementarán la funcionalidad del asistente virtual
- Testers que verificarán el comportamiento correcto del sistema en contexto clínico
- Stakeholders médicos que necesitan comprender la experiencia del usuario final

## 2. Modelo Mental y Principios de Interacción

### 2.1 Modelo Mental

El Asistente Virtual para Expedientes Clínicos funciona como un **copiloto médico inteligente** que proporciona acceso instantáneo y contextualizado al historial clínico de 11 años almacenado en formato PDF. El modelo mental clave para el médico es:

> "El Copiloto es mi asistente personal que conoce perfectamente el historial de cada paciente y puede responder cualquier pregunta específica sobre su expediente, mostrándome exactamente dónde encontró la información."

Este modelo de **copiloto médico confiable** es fundamental para entender cómo los médicos interactuarán con el sistema, esperando respuestas precisas, verificables y contextualizadas.

### 2.2 Principios de Interacción

#### 2.2.1 Contexto Activo Único

- **Modo Paciente Activo**: El sistema mantiene un contexto único de paciente activo durante toda la sesión
- **Modo Sin Contexto**: Estado inicial donde no hay paciente seleccionado, limitando las funcionalidades disponibles

#### 2.2.2 Transparencia y Verificabilidad

- Todas las respuestas incluyen referencias específicas a documentos fuente
- Los badges clickeables permiten verificación inmediata de información
- El visor lateral proporciona acceso directo a la página exacta del expediente
- La trazabilidad completa asegura confianza en la información proporcionada

#### 2.2.3 Eficiencia en el Flujo de Trabajo

- Búsqueda con autocompletado para localización rápida de pacientes
- Pacientes recientes para acceso inmediato a casos en seguimiento
- Comandos de voz hands-free para operación durante consultas
- Respuestas en menos de 4 segundos para mantener el ritmo clínico

#### 2.2.4 Feedback Visual Inmediato

- Cambios de color en cabecera para indicar contexto activo
- Toast notifications para confirmar acciones importantes
- Indicadores de carga y procesamiento para gestionar expectativas
- Feedback visual específico para comandos de voz

#### 2.2.5 Seguridad y Cumplimiento

- Autenticación con Azure AD integrada con sistemas existentes
- Controles de acceso granulares por especialidad médica
- Audit trail automático de todas las interacciones
- Gestión especial de expedientes VIP y casos sensibles

## 3. Flujos de Interacción Principales

### 3.1 Flujo de Inicio de Sesión y Dashboard

**Objetivo**: Proporcionar acceso seguro y personalizado al sistema con información relevante inmediata

1. **Estado Inicial**:
   - Pantalla de login con integración Azure AD
   - Campos de autenticación familiares para el usuario
   - Branding de TecSalud y diseño médico profesional

2. **Autenticación con Microsoft ID**:
   - El médico ingresa sus credenciales corporativas
   - Sistema valida contra Azure Active Directory
   - Ejemplo de credenciales:
     ```
     Usuario: dr.solis@tecsalud.mx
     Contraseña: [Contraseña corporativa]
     ```

3. **Respuesta del Usuario**:
   - El usuario puede:
     - Ingresar credenciales correctas
     - Ingresar credenciales incorrectas
     - Cancelar el proceso de login
     - Solicitar recuperación de contraseña

4. **Comportamiento del Sistema**:
   - Si las credenciales son correctas, redirige al dashboard personalizado
   - Si las credenciales son incorrectas, muestra mensaje de error específico
   - Si se cancela, mantiene la pantalla de login
   - Si solicita recuperación, redirige al flujo de Azure AD correspondiente

### 3.2 Flujo de Selección de Paciente

**Objetivo**: Permitir localización rápida y activación de contexto de paciente específico

1. **Disparador**:
   - Médico necesita consultar información de un paciente específico

2. **Búsqueda Visual con Autocompletado**:
   - Médico comienza a escribir en el buscador prominente
   - Sistema procesa entrada en tiempo real (< 500ms)
   - Muestra sugerencias basadas en nombre, apellido, o número de expediente

3. **Presentación de Resultados**:
   - Lista de pacientes coincidentes con información básica
   - Ejemplo de resultado:
     ```
     Julio Gómez Martínez
     37 años • Expediente: 12345
     Última consulta: 15 Jun 2025
     ```

4. **Respuesta del Usuario**:
   - El usuario puede:
     - Hacer click en un paciente específico
     - Continuar escribiendo para refinar búsqueda
     - Seleccionar de pacientes recientes
     - Cancelar la búsqueda

5. **Comportamiento del Sistema**:
   - Si selecciona paciente, activa contexto visual y muestra confirmación
   - Si continúa escribiendo, actualiza resultados en tiempo real
   - Si selecciona de recientes, activa contexto inmediatamente
   - Si cancela, mantiene estado sin contexto activo

### 3.3 Flujo de Consulta Conversacional

**Objetivo**: Proporcionar respuestas precisas y verificables sobre el expediente del paciente activo

1. **Disparador**:
   - Médico tiene paciente activo y necesita información específica

2. **Entrada de Consulta**:
   - Médico escribe pregunta en lenguaje natural en el chat del Copiloto
   - Sistema procesa consulta usando NLP médico especializado
   - Valida que hay contexto de paciente activo

3. **Procesamiento y Respuesta**:
   - Sistema busca en expediente del paciente activo únicamente
   - Genera respuesta estructurada con información relevante
   - Ejemplo de respuesta:
     ```
     Los laboratorios de colesterol del último año muestran:
     
     • Colesterol total: 245 mg/dL (15 Mar 2025)
     • LDL: 165 mg/dL (15 Mar 2025) 
     • HDL: 42 mg/dL (15 Mar 2025)
     • Triglicéridos: 190 mg/dL (15 Mar 2025)
     
     [lab_colesterol_mar2025.pdf · pág 4]
     ```

4. **Respuesta del Usuario**:
   - El usuario puede:
     - Hacer click en el badge para ver documento fuente
     - Hacer pregunta de seguimiento
     - Cambiar de paciente
     - Usar comando especial (/nota)

5. **Comportamiento del Sistema**:
   - Si hace click en badge, abre visor lateral en página específica
   - Si hace pregunta de seguimiento, mantiene contexto y responde
   - Si cambia paciente, actualiza contexto y confirma visualmente
   - Si usa comando especial, ejecuta función correspondiente

### 3.4 Flujo de Verificación de Fuentes

**Objetivo**: Permitir verificación inmediata de información proporcionada por el Copiloto

1. **Disparador**:
   - Médico hace click en badge de referencia en respuesta del Copiloto

2. **Apertura de Visor Lateral**:
   - Sistema abre visor PDF en panel lateral derecho
   - Navega automáticamente a la página específica referenciada
   - Mantiene chat visible para preservar contexto

3. **Navegación en Documento**:
   - Médico puede deslizar/scroll para ver páginas adyacentes
   - Zoom in/out para mejor legibilidad
   - Búsqueda dentro del documento si es necesario
   - Ejemplo de navegación:
     ```
     Página 4 de 12 - lab_colesterol_mar2025.pdf
     [Contenido del laboratorio visible]
     ```

4. **Respuesta del Usuario**:
   - El usuario puede:
     - Revisar información y confirmar datos
     - Navegar a otras páginas del documento
     - Cerrar visor y volver al chat
     - Hacer nueva pregunta basada en lo visto

5. **Comportamiento del Sistema**:
   - Si revisa información, mantiene visor abierto
   - Si navega páginas, actualiza indicador de página actual
   - Si cierra visor (botón ⤫), retorna al chat preservando conversación
   - Si hace nueva pregunta, cierra visor automáticamente y procesa consulta

### 3.5 Flujo de Cambio de Paciente por Voz

**Objetivo**: Permitir cambio de contexto hands-free durante consultas médicas

1. **Disparador**:
   - Médico necesita cambiar de paciente sin usar las manos

2. **Comando de Voz**:
   - Médico dice: "Copiloto, cambia al paciente Carlos Gómez"
   - Sistema reconoce comando y extrae nombre del paciente
   - Busca paciente en base de datos

3. **Confirmación Verbal del Sistema**:
   - Sistema responde con síntesis de voz clara
   - Ejemplo de confirmación:
     ```
     "¿Confirmas cambiar al paciente Carlos Gómez, 46 años, ID 12345?"
     ```

4. **Respuesta del Usuario**:
   - El usuario puede:
     - Confirmar con "Sí" o "Confirmar"
     - Cancelar con "No" o "Cancelar"
     - No responder (timeout 30 segundos)
     - Corregir con nuevo nombre

5. **Comportamiento del Sistema**:
   - Si confirma, ejecuta cambio con feedback visual (parpadeo verde 3s)
   - Si cancela, mantiene paciente actual y confirma verbalmente
   - Si no responde, cancela automáticamente y notifica
   - Si corrige, procesa nuevo comando de cambio

## 4. Diagramas de Flujo Conversacional

### 4.1 Flujo de Inicio de Sesión y Dashboard

```
┌─────────────────┐
│ Pantalla Login  │
│ Azure AD        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Autenticación   │
│ Credenciales    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Validación      │
│ Azure AD        │
└────────┬────────┘
         │
    ┌────┴─────┬────────────┐
    │          │            │
    ▼          ▼            ▼
┌─────────┐ ┌────────┐ ┌─────────┐
│Éxito    │ │Error   │ │Timeout  │
│         │ │        │ │         │
└────┬────┘ └────┬───┘ └────┬────┘
     │           │          │
     ▼           ▼          ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│Dashboard│ │Mensaje  │ │Reintento│
│Personal │ │Error    │ │Login    │
└────┬────┘ └─────────┘ └─────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│ Dashboard: "¡Buen día, Dr. Solis!"          │
│ • Buscador prominente                       │
│ • 5 pacientes recientes                     │
└─────────────────────────────────────────────┘
```

### 4.2 Flujo de Selección y Contexto de Paciente

```
┌─────────────────┐
│ Dashboard       │
│ Sin contexto    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Búsqueda        │
│ "Gómez"         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Autocompletado  │
│ Resultados      │
└────────┬────────┘
         │
    ┌────┴─────┬────────────┐
    │          │            │
    ▼          ▼            ▼
┌─────────┐ ┌────────┐ ┌─────────┐
│Click    │ │Refinar │ │Cancelar │
│Julio G. │ │Búsqueda│ │         │
└────┬────┘ └────┬───┘ └────┬────┘
     │           │          │
     ▼           ▼          ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│Contexto │ │Nuevos   │ │Dashboard│
│Activo   │ │Resultado│ │Original │
└────┬────┘ └─────────┘ └─────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│ Cabecera azul: "Julio Gómez (37 a)"        │
│ Toast: "Contexto activo: Julio Gómez (37a)"│
└─────────────────────────────────────────────┘
```

### 4.3 Flujo de Consulta Conversacional

```
┌─────────────────┐
│ Contexto Activo │
│ Julio Gómez     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Consulta Chat   │
│ "Laboratorios   │
│ colesterol"     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Procesamiento   │
│ NLP + Búsqueda  │
└────────┬────────┘
         │
    ┌────┴─────┐
    │          │
    ▼          ▼
┌─────────┐ ┌────────┐
│Encontrado│ │No Encon│
│         │ │trado   │
└────┬────┘ └────┬───┘
     │           │
     ▼           ▼
┌─────────┐ ┌─────────┐
│Respuesta│ │Mensaje  │
│+ Badge  │ │"No hay  │
│         │ │info"    │
└────┬────┘ └─────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│ Respuesta estructurada                      │
│ [lab.pdf · pág 4] ← Badge clickeable        │
└─────────────────────────────────────────────┘
```

## 5. Microinteracciones y Feedback

### 5.1 Feedback de Contexto Activo

#### 5.1.1 Activación de Contexto de Paciente

**Disparador**: Usuario selecciona un paciente específico

**Comportamiento**:
1. Cabecera cambia inmediatamente a color azul tenue (#E3F2FD)
2. Información del paciente aparece con transición suave (300ms)
3. Toast notification desliza desde arriba con mensaje de confirmación
4. Toast permanece visible 4 segundos con fade-out gradual
5. Buscador se limpia automáticamente

**Propósito**: Confirmar visualmente que el contexto ha cambiado y evitar confusiones entre pacientes

#### 5.1.2 Cambio de Contexto por Voz

**Disparador**: Comando de voz confirmado exitosamente

**Comportamiento**:
1. Cabecera parpadea en verde (#4CAF50) durante exactamente 3 segundos
2. Información del nuevo paciente se actualiza con transición
3. Síntesis de voz confirma: "Contexto cambiado a [Nombre del paciente]"
4. Toast notification aparece con nuevo contexto
5. Chat se limpia para nuevo contexto

**Propósito**: Proporcionar feedback visual y auditivo claro para comandos hands-free

#### 5.1.3 Error de Contexto

**Disparador**: Usuario intenta hacer consulta sin paciente activo

**Comportamiento**:
1. Mensaje de error aparece en chat con color de alerta (#FF5722)
2. Buscador se resalta con borde pulsante
3. Sugerencia aparece: "Selecciona un paciente para comenzar"
4. Lista de pacientes recientes se expande automáticamente

**Propósito**: Guiar al usuario hacia la acción correcta sin frustración

### 5.2 Feedback de Procesamiento

#### 5.2.1 Procesamiento de Consulta

**Disparador**: Usuario envía pregunta al Copiloto

**Comportamiento al Procesar**:
1. Indicador de "escribiendo" aparece inmediatamente
2. Puntos animados muestran progreso (⋯ → ⋯⋯ → ⋯⋯⋯)
3. Contador de tiempo discreto aparece después de 2 segundos
4. Barra de progreso sutil si excede 3 segundos

**Comportamiento al Completar**:
1. Indicador desaparece con fade-out
2. Respuesta aparece con animación de escritura (typewriter effect)
3. Badges aparecen con pequeño bounce al final
4. Scroll automático para mantener respuesta visible

**Propósito**: Gestionar expectativas y mantener engagement durante procesamiento

#### 5.2.2 Carga de Visor PDF

**Disparador**: Usuario hace click en badge de referencia

**Comportamiento**:
1. Visor lateral se desliza desde la derecha (400ms ease-out)
2. Skeleton loader muestra estructura mientras carga
3. Página específica se resalta con overlay sutil al cargar
4. Indicador de página actual aparece en esquina superior

**Propósito**: Proporcionar feedback inmediato y orientación espacial

### 5.3 Feedback de Búsqueda

#### 5.3.1 Autocompletado en Tiempo Real

**Disparador**: Usuario escribe en buscador de pacientes

**Comportamiento**:
1. Dropdown aparece después del segundo carácter
2. Resultados se actualizan con debounce de 300ms
3. Coincidencias se resaltan en texto (bold)
4. Máximo 5 resultados con scroll si hay más
5. Navegación con teclado (↑↓) disponible

**Propósito**: Facilitar localización rápida sin sobrecarga visual

#### 5.3.2 Selección de Resultado

**Disparador**: Usuario hace click o presiona Enter en resultado

**Comportamiento**:
1. Resultado seleccionado se resalta momentáneamente
2. Dropdown se cierra con animación suave
3. Contexto se activa inmediatamente
4. Feedback visual de contexto activo se ejecuta

**Propósito**: Confirmar selección y transición fluida al nuevo contexto

### 5.4 Feedback de Comandos de Voz

#### 5.4.1 Reconocimiento de Comando

**Disparador**: Sistema detecta palabra clave "Copiloto"

**Comportamiento**:
1. Indicador de micrófono aparece en esquina
2. Pulso visual sutil indica que está escuchando
3. Transcripción en tiempo real aparece discretamente
4. Timeout visual después de 5 segundos sin comando

**Propósito**: Confirmar que el sistema está procesando comando de voz

#### 5.4.2 Confirmación Verbal Requerida

**Disparador**: Sistema requiere confirmación para comando de voz

**Comportamiento**:
1. Síntesis de voz reproduce pregunta de confirmación
2. Indicador visual muestra que espera respuesta
3. Opciones "Sí/No" aparecen discretamente en pantalla
4. Countdown visual de 30 segundos para timeout

**Propósito**: Asegurar precisión en comandos críticos como cambio de paciente

## 6. Escenarios de Uso Detallados

### 6.1 Escenario: Consulta Matutina del Dr. Solis

**Contexto**: Dr. Solis llega a su consultorio a las 8:00 AM y necesita revisar el primer paciente del día

**Flujo de Interacción**:

1. **Llegada al Consultorio**
   - Dr. Solis abre su navegador y navega a la aplicación
   - Ve la pantalla de login familiar con branding de TecSalud
   - Ingresa sus credenciales corporativas (dr.solis@tecsalud.mx)

2. **Dashboard Personalizado**
   - Sistema lo saluda: "¡Buen día, Dr. Solis!"
   - Ve sus 5 pacientes más recientes en cards elegantes
   - Buscador prominente está listo en la esquina superior
   - Recuerda que debe revisar a Julio Gómez

3. **Búsqueda de Paciente**
   - Comienza a escribir "Gómez" en el buscador
   - Autocompletado aparece inmediatamente con opciones
   - Ve "Julio Gómez Martínez, 37 años" en los resultados
   - Hace click en el resultado

4. **Activación de Contexto**
   - Cabecera cambia a azul tenue mostrando "Julio Gómez (37 a)"
   - Toast aparece: "Contexto activo: Julio Gómez (37 a)"
   - Chat del Copiloto está listo para consultas

5. **Primera Consulta**
   - Escribe: "Resúmeme los laboratorios de colesterol del último año"
   - Copiloto procesa en 3 segundos
   - Recibe respuesta estructurada con valores específicos
   - Ve badge clickeable: "[lab_colesterol_mar2025.pdf · pág 4]"

### 6.2 Escenario: Verificación de Información Crítica

**Contexto**: Dr. Solis necesita verificar información antes de tomar decisión de tratamiento

**Flujo de Interacción**:

1. **Consulta Específica**
   - Con Julio Gómez activo, pregunta sobre medicamentos actuales
   - Copiloto responde con lista de medicamentos y dosis
   - Incluye badge: "[receta_actual.pdf · pág 2]"

2. **Verificación en Fuente**
   - Hace click en el badge de referencia
   - Visor lateral se desliza desde la derecha
   - PDF se abre directamente en página 2
   - Ve la receta original con letra del médico anterior

3. **Navegación en Documento**
   - Desliza hacia arriba para ver fecha de prescripción
   - Confirma que medicamento fue prescrito hace 6 meses
   - Zoom para leer mejor la dosis específica

4. **Retorno al Chat**
   - Hace click en botón "⤫" para cerrar visor
   - Regresa automáticamente al chat
   - Contexto de conversación se mantiene intacto

5. **Consulta de Seguimiento**
   - Pregunta: "¿Ha tenido efectos secundarios con este medicamento?"
   - Copiloto busca en notas de seguimiento
   - Proporciona información de visitas posteriores

### 6.3 Escenario: Cambio de Paciente Hands-Free

**Contexto**: Dr. Solis está examinando físicamente a un paciente y necesita consultar información de otro

**Flujo de Interacción**:

1. **Situación Hands-Free**
   - Dr. Solis está realizando examen físico
   - Necesita información de Carlos Gómez para comparación
   - No puede usar teclado o mouse

2. **Comando de Voz**
   - Dice claramente: "Copiloto, cambia al paciente Carlos Gómez"
   - Sistema reconoce comando y busca en base de datos
   - Encuentra coincidencia única

3. **Confirmación del Sistema**
   - Síntesis de voz responde: "¿Confirmas cambiar al paciente Carlos Gómez, 46 años, ID 12345?"
   - Dr. Solis puede ver información en pantalla discretamente
   - Opciones "Sí/No" aparecen visualmente

4. **Confirmación del Usuario**
   - Dr. Solis responde: "Sí"
   - Sistema procesa confirmación inmediatamente

5. **Ejecución del Cambio**
   - Cabecera parpadea verde durante 3 segundos
   - Información cambia a Carlos Gómez
   - Síntesis de voz confirma: "Contexto cambiado a Carlos Gómez"
   - Dr. Solis puede continuar con consulta verbal

## 7. Consideraciones de Usabilidad

### 7.1 Accesibilidad

#### 7.1.1 Accesibilidad Visual

- Contraste mínimo 4.5:1 para todo el texto según WCAG 2.1 AA
- Soporte para zoom hasta 200% sin pérdida de funcionalidad
- Indicadores visuales claros para contexto activo (no solo color)
- Texto alternativo para todos los elementos interactivos

#### 7.1.2 Accesibilidad Auditiva

- Subtítulos opcionales para síntesis de voz
- Indicadores visuales para feedback auditivo
- Comandos de voz con alternativas de teclado
- Notificaciones visuales para confirmaciones verbales

#### 7.1.3 Accesibilidad Motora

- Navegación completa por teclado
- Áreas de click mínimas de 44px según guidelines móviles
- Comandos de voz para operación hands-free
- Timeouts configurables para usuarios con limitaciones

### 7.2 Responsive Design

#### 7.2.1 Desktop (1920x1080+)

En pantallas de escritorio:
- Visor lateral de PDFs ocupa 40% del ancho de pantalla
- Chat principal mantiene 60% para conversación cómoda
- Dashboard muestra 5 pacientes recientes en grid 5x1
- Buscador mantiene posición fija en esquina superior derecha

#### 7.2.2 Tablet (768px - 1024px)

En tablets:
- Visor PDF se convierte en modal overlay completo
- Chat ocupa ancho completo con navegación por tabs
- Dashboard muestra pacientes recientes en grid 2x3
- Buscador se centra en parte superior

#### 7.2.3 Mobile (< 768px)

En dispositivos móviles:
- Interfaz completamente adaptada a navegación táctil
- Visor PDF en modal fullscreen con controles táctiles
- Dashboard con lista vertical de pacientes recientes
- Comandos de voz priorizados para entrada de datos

### 7.3 Rendimiento y Eficiencia

#### 7.3.1 Tiempos de Respuesta

- Autocompletado de búsqueda: < 500ms
- Respuestas del Copiloto: < 4 segundos
- Apertura de visor PDF: < 2 segundos
- Cambio de contexto: < 1 segundo

#### 7.3.2 Optimización de Carga

- Lazy loading para PDFs no visualizados
- Caché inteligente para pacientes recientes
- Preload de información básica de pacientes frecuentes
- Compresión de respuestas del Copiloto

#### 7.3.3 Gestión de Memoria

- Límite de PDFs abiertos simultáneamente (máximo 3)
- Limpieza automática de caché después de 30 minutos inactivo
- Optimización de imágenes en expedientes
- Gestión eficiente de historial de conversaciones

## 8. Pruebas de Interacción Recomendadas

### 8.1 Pruebas de Flujo Principal

#### 8.1.1 Prueba de Login y Dashboard

**Objetivo**: Verificar experiencia de inicio de sesión y personalización

**Pasos**:
1. Acceder a URL de aplicación
2. Ingresar credenciales válidas de Azure AD
3. Verificar mensaje de bienvenida personalizado
4. Confirmar presencia de buscador y pacientes recientes
5. Validar responsive design en diferentes dispositivos

**Criterios de Éxito**:
- Login exitoso en < 3 segundos
- Mensaje personalizado correcto
- 5 pacientes recientes visibles
- Buscador funcional y prominente

#### 8.1.2 Prueba de Búsqueda y Contexto

**Objetivo**: Validar búsqueda de pacientes y activación de contexto

**Pasos**:
1. Escribir nombre parcial en buscador
2. Verificar autocompletado en tiempo real
3. Seleccionar paciente de resultados
4. Confirmar cambio visual de cabecera
5. Validar toast de confirmación

**Criterios de Éxito**:
- Autocompletado en < 500ms
- Resultados relevantes y precisos
- Cambio visual inmediato
- Toast visible 4 segundos

#### 8.1.3 Prueba de Consulta Conversacional

**Objetivo**: Verificar funcionalidad del Copiloto y respuestas

**Pasos**:
1. Con paciente activo, escribir consulta médica
2. Verificar tiempo de respuesta
3. Confirmar presencia de badges en respuesta
4. Hacer click en badge para abrir PDF
5. Verificar navegación a página correcta

**Criterios de Éxito**:
- Respuesta en < 4 segundos
- Información específica del paciente activo
- Badges clickeables funcionales
- PDF abre en página exacta

### 8.2 Pruebas de Comandos de Voz

#### 8.2.1 Prueba de Reconocimiento

**Objetivo**: Validar reconocimiento de comandos de voz

**Pasos**:
1. Decir comando: "Copiloto, cambia al paciente [nombre]"
2. Verificar reconocimiento de comando
3. Confirmar solicitud de confirmación verbal
4. Responder "Sí" para confirmar
5. Validar cambio de contexto

**Criterios de Éxito**:
- Reconocimiento preciso del comando
- Confirmación verbal clara
- Cambio de contexto exitoso
- Feedback visual apropiado

#### 8.2.2 Prueba de Manejo de Errores

**Objetivo**: Verificar comportamiento con comandos incorrectos

**Pasos**:
1. Decir comando con nombre inexistente
2. Verificar manejo de error
3. Intentar comando sin palabra clave "Copiloto"
4. Probar timeout sin confirmación
5. Validar mensajes de error apropiados

**Criterios de Éxito**:
- Errores manejados graciosamente
- Mensajes de error claros
- Sistema mantiene estado estable
- Opciones de recuperación disponibles

### 8.3 Pruebas de Usabilidad

#### 8.3.1 Prueba con Usuarios Médicos

**Objetivo**: Validar usabilidad con usuarios reales

**Metodología**:
- 5 médicos de diferentes especialidades
- Tareas específicas del flujo del Dr. Solis
- Observación directa y think-aloud protocol
- Métricas de tiempo y errores

**Métricas Clave**:
- Tiempo para completar primera consulta
- Número de errores en cambio de contexto
- Satisfacción con comandos de voz
- Confianza en información proporcionada

#### 8.3.2 Prueba de Accesibilidad

**Objetivo**: Verificar cumplimiento de estándares de accesibilidad

**Herramientas**:
- WAVE (Web Accessibility Evaluation Tool)
- axe DevTools
- Lighthouse Accessibility Audit
- Pruebas manuales con lectores de pantalla

**Criterios de Evaluación**:
- Cumplimiento WCAG 2.1 AA
- Navegación por teclado completa
- Contraste de colores apropiado
- Texto alternativo para elementos visuales

---

**Versión:** 1.0  
**Estado:** Completo para implementación  
**Próxima revisión:** Después de pruebas con usuarios médicos

