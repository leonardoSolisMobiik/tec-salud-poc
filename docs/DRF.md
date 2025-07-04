# Documento de Requerimientos Funcionales (DRF) - ACTUALIZADO
# ASISTENTE VIRTUAL PARA EXPEDIENTES CLÍNICOS - TEC SALUD

**Versión:** 2.0  
**Fecha:** 17 de Junio, 2025  
**Proyecto:** Asistente Virtual para Expedientes Clínicos  
**Cliente:** Tec Salud  
**Actualización:** Incorpora flujo específico del Dr. Solis

---

## 1. Introducción

### 1.1 Propósito del Documento

Este documento define los requerimientos funcionales actualizados para el Sistema de Asistente Virtual para Expedientes Clínicos de Tec Salud, incorporando el flujo de usuario específico del Dr. Solis que define la experiencia de usuario deseada para la Fase 1. 

**ACTUALIZACIÓN v2.0:** Se han incorporado requerimientos funcionales específicos basados en el flujo de usuario detallado del Dr. Solis, que incluye elementos como dashboard personalizado, buscador visual, sistema de contexto activo, copiloto conversacional, visor lateral de PDFs, comandos de voz, y audit trail automático.

El documento se fundamenta en los hallazgos del documento de descubrimiento del proyecto y ahora incluye especificaciones detalladas de la experiencia de usuario que debe proporcionar el sistema en su implementación de producción.

### 1.2 Alcance del Sistema Actualizado

El Sistema de Asistente Virtual para Expedientes Clínicos implementará una experiencia de usuario específicamente diseñada para optimizar el flujo de trabajo médico, basada en el caso de uso del Dr. Solis. 

**Experiencia de Usuario Objetivo:**
- Dashboard personalizado con bienvenida por nombre
- Buscador visual con autocompletado en tiempo real
- Sistema de contexto activo con feedback visual
- Copiloto conversacional con respuestas en <4 segundos
- Visor lateral de PDFs con navegación directa a páginas
- Comandos de voz para operación hands-free
- Audit trail automático de todas las interacciones

**Fase 1 - Aplicación Web Independiente (Julio - Agosto 2025):**
- **Dashboard Personalizado:** Pantalla de bienvenida con nombre del médico y pacientes recientes
- **Buscador Visual Avanzado:** Autocompletado en tiempo real con resultados instantáneos
- **Sistema de Contexto Activo:** Cabecera dinámica con colores y toast notifications
- **Copiloto Conversacional:** Chat inteligente con badges clickeables y referencias a documentos
- **Visor Lateral de PDFs:** Apertura directa en páginas específicas con navegación fluida
- **Comandos de Voz:** Cambio de paciente hands-free con confirmaciones verbales
- **Comandos Especiales:** Funciones rápidas como "/nota" para documentación clínica
- **Audit Trail Automático:** Registro completo de interacciones y documentos consultados

---

## 2. Descripción General Actualizada

### 2.1 Contexto del Sistema

El sistema opera en el contexto específico del flujo de trabajo médico diario, ejemplificado por el caso de uso del Dr. Solis. El sistema debe integrarse seamlessly en la rutina médica, desde el inicio de sesión hasta el cierre de la jornada, proporcionando una experiencia fluida y eficiente.

**Flujo de Trabajo Objetivo:**
1. **Inicio de Jornada:** Autenticación con Microsoft ID y dashboard personalizado
2. **Selección de Paciente:** Búsqueda visual con autocompletado y contexto activo
3. **Consulta de Información:** Copiloto conversacional con respuestas verificables
4. **Verificación de Fuentes:** Visor lateral de PDFs con navegación directa
5. **Cambio de Paciente:** Comandos de voz hands-free con confirmaciones
6. **Documentación:** Comandos especiales para notas clínicas
7. **Cierre de Sesión:** Audit trail automático de toda la actividad

### 2.2 Funciones Principales Actualizadas

Las funciones principales han sido refinadas para alinearse con el flujo específico del Dr. Solis:

1. **Dashboard Personalizado con Pacientes Recientes** *(Fase 1)*: Pantalla de bienvenida personalizada que muestra los 5 pacientes más recientes del médico para acceso rápido.

2. **Buscador Visual con Autocompletado** *(Fase 1)*: Sistema de búsqueda avanzado que autocompleta en tiempo real mientras el usuario escribe, proporcionando resultados instantáneos.

3. **Sistema de Contexto Activo Visual** *(Fase 1)*: Gestión visual del paciente activo con cambios de color en la cabecera, toast notifications, y feedback visual claro.

4. **Copiloto Conversacional Avanzado** *(Fase 1)*: Interfaz de chat inteligente llamada "Copiloto" que proporciona respuestas en menos de 4 segundos con badges clickeables a documentos fuente.

5. **Visor Lateral de PDFs Integrado** *(Fase 1)*: Visor de documentos que se abre lateralmente y navega directamente a páginas específicas referenciadas en las respuestas del copiloto.

6. **Comandos de Voz Hands-Free** *(Fase 1)*: Capacidad de cambiar de paciente usando comandos de voz con confirmaciones verbales para operación sin usar las manos.

7. **Comandos Especiales de Productividad** *(Fase 1)*: Comandos rápidos como "/nota" para acceder a funcionalidades específicas de documentación médica.

8. **Audit Trail Automático Completo** *(Fase 1)*: Registro automático de todas las preguntas, respuestas, documentos consultados y cambios de contexto durante la sesión.

---

## 3. Módulos Funcionales Actualizados

### 3.1 Dashboard y Experiencia de Bienvenida *(NUEVO)*

El módulo de Dashboard proporciona la experiencia inicial personalizada que establece el contexto para toda la sesión de trabajo del médico.

#### 3.1.1 Pantalla de Bienvenida Personalizada *(Fase 1)*

La pantalla de bienvenida debe mostrar un saludo personalizado utilizando el nombre del médico autenticado, creando una experiencia familiar y profesional. El diseño debe ser minimalista y elegante, siguiendo principios de diseño moderno.

**Requerimientos específicos:**
- Mensaje de bienvenida: "¡Buen día, Dr. [Apellido]!"
- Diseño minimalista con tipografía clara
- Carga rápida (< 2 segundos)
- Responsive para diferentes tamaños de pantalla

#### 3.1.2 Lista de Pacientes Recientes *(Fase 1)*

El sistema debe mantener y mostrar una lista de los 5 pacientes más recientes consultados por el médico, proporcionando acceso rápido a casos en seguimiento activo.

**Requerimientos específicos:**
- Mostrar exactamente 5 pacientes recientes
- Información visible: Nombre completo, edad, última consulta
- Ordenamiento por fecha de última consulta (más reciente primero)
- Click directo para activar contexto del paciente
- Actualización automática cuando se consulta un nuevo paciente

#### 3.1.3 Buscador Prominente *(Fase 1)*

El buscador debe estar ubicado prominentemente en la esquina superior de la interfaz, siendo fácilmente accesible y visualmente destacado.

**Requerimientos específicos:**
- Ubicación fija en esquina superior
- Placeholder text: "Buscar paciente..."
- Icono de búsqueda visible
- Autocompletado en tiempo real
- Resultados instantáneos mientras se escribe

### 3.2 Sistema de Contexto Activo Visual *(NUEVO)*

Este módulo gestiona la representación visual del paciente activo y proporciona feedback claro sobre el contexto actual de trabajo.

#### 3.2.1 Cabecera Dinámica de Paciente *(Fase 1)*

La cabecera debe cambiar dinámicamente para reflejar el paciente activo, proporcionando información visual clara y constante.

**Requerimientos específicos:**
- Cambio de color a azul tenue cuando se selecciona paciente
- Mostrar foto del paciente (si disponible)
- Mostrar nombre completo y edad
- Formato: "[Nombre Completo] ([Edad] a)"
- Persistencia durante toda la sesión con ese paciente

#### 3.2.2 Toast Notifications de Contexto *(Fase 1)*

El sistema debe mostrar notificaciones toast para confirmar cambios de contexto y proporcionar feedback inmediato al usuario.

**Requerimientos específicos:**
- Toast al seleccionar paciente: "Contexto activo: [Nombre] ([Edad] a)"
- Duración de 3-5 segundos
- Posicionamiento no intrusivo
- Animación suave de entrada y salida
- Color verde para confirmaciones exitosas

#### 3.2.3 Feedback Visual de Cambios *(Fase 1)*

El sistema debe proporcionar feedback visual claro cuando se realizan cambios de contexto, especialmente para comandos de voz.

**Requerimientos específicos:**
- Parpadeo verde de la cabecera durante 3 segundos en cambios por voz
- Transiciones suaves entre contextos
- Indicadores visuales de carga durante cambios
- Confirmación visual de comandos de voz ejecutados

### 3.3 Copiloto Conversacional Avanzado *(ACTUALIZADO)*

El módulo del Copiloto ha sido refinado para proporcionar una experiencia conversacional específica con características avanzadas de referenciación y verificación.

#### 3.3.1 Interfaz de Chat "Copiloto" *(Fase 1)*

La interfaz de chat debe ser identificada específicamente como "Copiloto" y proporcionar una experiencia conversacional natural y eficiente.

**Requerimientos específicos:**
- Nombre visible: "Copiloto"
- Respuestas en menos de 4 segundos
- Interfaz de chat moderna y limpia
- Historial de conversación por paciente
- Indicadores de escritura/procesamiento

#### 3.3.2 Badges Clickeables de Referencias *(Fase 1)*

Las respuestas del copiloto deben incluir badges clickeables que referencien documentos específicos y páginas exactas.

**Requerimientos específicos:**
- Formato de badge: "[documento.pdf · pág X]"
- Badges clickeables que abren el visor lateral
- Navegación directa a la página específica
- Múltiples badges por respuesta cuando sea relevante
- Estilo visual distintivo para badges

#### 3.3.3 Comandos Especiales *(Fase 1)*

El copiloto debe reconocer y procesar comandos especiales para funcionalidades específicas de productividad médica.

**Requerimientos específicos:**
- Comando "/nota" para crear notas clínicas
- Reconocimiento automático de comandos (inician con "/")
- Respuesta específica para cada tipo de comando
- Ayuda contextual para comandos disponibles
- Validación de permisos para comandos específicos

### 3.4 Visor Lateral de PDFs *(NUEVO)*

Este módulo proporciona capacidades avanzadas de visualización de documentos integradas con el flujo conversacional.

#### 3.4.1 Apertura Lateral Automática *(Fase 1)*

El visor debe abrirse lateralmente cuando se hace click en badges de referencia, sin interrumpir el flujo de la conversación.

**Requerimientos específicos:**
- Apertura lateral (no modal)
- Navegación directa a página específica
- Carga rápida del documento
- Mantenimiento del contexto del chat
- Redimensionamiento automático

#### 3.4.2 Navegación Dentro del PDF *(Fase 1)*

El visor debe proporcionar controles de navegación fluidos para revisar el documento completo.

**Requerimientos específicos:**
- Deslizamiento/scroll para navegar páginas
- Zoom in/out para mejor legibilidad
- Búsqueda dentro del documento
- Marcadores de página actual
- Navegación rápida por páginas

#### 3.4.3 Botón de Cierre Específico *(Fase 1)*

El visor debe incluir un botón de cierre específico que retorne al usuario al contexto del chat.

**Requerimientos específicos:**
- Botón con símbolo "⤫"
- Posición fija y visible
- Cierre inmediato sin confirmación
- Retorno automático al chat
- Preservación del estado de la conversación

### 3.5 Comandos de Voz Hands-Free *(NUEVO)*

Este módulo implementa capacidades de reconocimiento de voz para operación sin usar las manos durante consultas médicas.

#### 3.5.1 Reconocimiento de Comandos de Cambio *(Fase 1)*

El sistema debe reconocer comandos específicos para cambiar de paciente usando voz.

**Requerimientos específicos:**
- Comando: "Copiloto, cambia al paciente [nombre]"
- Reconocimiento de voz en español
- Tolerancia a variaciones en pronunciación
- Activación por palabra clave "Copiloto"
- Procesamiento en tiempo real

#### 3.5.2 Confirmaciones Verbales *(Fase 1)*

El sistema debe proporcionar confirmaciones verbales antes de ejecutar cambios de contexto por voz.

**Requerimientos específicos:**
- Respuesta: "¿Confirmas cambiar al paciente [Nombre], [Edad] a, ID [número]?"
- Síntesis de voz clara y natural
- Espera de confirmación del usuario
- Timeout si no hay respuesta (30 segundos)
- Cancelación automática si no se confirma

#### 3.5.3 Ejecución de Cambios por Voz *(Fase 1)*

Una vez confirmado, el sistema debe ejecutar el cambio de contexto con feedback visual apropiado.

**Requerimientos específicos:**
- Confirmación del usuario: "Sí" o "Confirmar"
- Cambio inmediato de contexto
- Feedback visual: parpadeo verde 3 segundos
- Toast de confirmación
- Actualización de cabecera dinámica

### 3.6 Audit Trail Automático Avanzado *(ACTUALIZADO)*

El módulo de auditoría ha sido expandido para capturar automáticamente todas las interacciones del flujo de trabajo médico.

#### 3.6.1 Registro de Preguntas y Respuestas *(Fase 1)*

El sistema debe registrar automáticamente todas las consultas realizadas y respuestas proporcionadas.

**Requerimientos específicos:**
- Timestamp preciso de cada consulta
- Texto completo de pregunta y respuesta
- Paciente asociado a cada consulta
- Médico que realizó la consulta
- Duración de procesamiento de respuesta

#### 3.6.2 Tracking de Documentos Consultados *(Fase 1)*

El sistema debe registrar todos los documentos PDF abiertos y páginas consultadas.

**Requerimientos específicos:**
- Nombre del documento abierto
- Páginas específicas visualizadas
- Tiempo de visualización por página
- Zoom y acciones dentro del PDF
- Secuencia de navegación en documentos

#### 3.6.3 Registro de Cambios de Contexto *(Fase 1)*

El sistema debe registrar todos los cambios de paciente y método utilizado.

**Requerimientos específicos:**
- Paciente anterior y nuevo
- Método de cambio (click, voz, búsqueda)
- Timestamp del cambio
- Confirmaciones requeridas
- Duración de sesión por paciente

#### 3.6.4 Comandos de Voz y Especiales *(Fase 1)*

El sistema debe registrar el uso de comandos de voz y comandos especiales.

**Requerimientos específicos:**
- Comandos de voz ejecutados
- Comandos especiales utilizados (/nota, etc.)
- Éxito/fallo de reconocimiento de voz
- Confirmaciones verbales
- Acciones resultantes de comandos

---

## 4. Flujos Funcionales Específicos

### 4.1 Flujo Completo del Dr. Solis *(NUEVO)*

Este flujo define la experiencia completa desde el inicio hasta el cierre de sesión.

#### 4.1.1 Escena 1: Llegada al Consultorio
1. **Autenticación:** Login con Microsoft ID
2. **Bienvenida:** Pantalla personalizada "¡Buen día, Dr. Solis!"
3. **Dashboard:** Visualización de buscador y 5 pacientes recientes
4. **Estado:** Sistema listo para consultas

#### 4.1.2 Escena 2: Selección de Paciente
1. **Búsqueda:** Usuario teclea "Gómez"
2. **Autocompletado:** Sistema muestra opciones en tiempo real
3. **Selección:** Click en "Julio Gómez"
4. **Activación:** Cabecera cambia a azul tenue
5. **Confirmación:** Toast "Contexto activo: Julio Gómez (37 a)"

#### 4.1.3 Escena 3: Consulta con Copiloto
1. **Pregunta:** "Resúmeme los laboratorios de colesterol del último año"
2. **Procesamiento:** Respuesta en <4 segundos
3. **Respuesta:** Información con badge "lab.pdf · pág 4"
4. **Verificación:** Click en badge abre visor lateral en página 4

#### 4.1.4 Escena 4: Verificación de Fuentes
1. **Navegación:** Deslizamiento en PDF para verificar datos
2. **Confirmación:** Validación de información mostrada
3. **Cierre:** Click en botón "⤫"
4. **Retorno:** Vuelta automática al chat

#### 4.1.5 Escena 5: Cambio por Voz
1. **Comando:** "Copiloto, cambia al paciente Carlos Gómez"
2. **Confirmación:** "¿Confirmas cambiar al paciente Carlos Gómez, 46 a, ID 12345?"
3. **Respuesta:** "Sí"
4. **Ejecución:** Parpadeo verde 3 segundos, nuevo contexto activo

#### 4.1.6 Escena 6: Documentación y Cierre
1. **Comando:** "/nota" para crear nota clínica
2. **Documentación:** Registro de información relevante
3. **Cierre:** Click en avatar → "Cerrar sesión"
4. **Audit:** Registro automático de toda la actividad

---

## 5. Requerimientos de Rendimiento Específicos

### 5.1 Tiempos de Respuesta Críticos
- **Autocompletado de búsqueda:** < 500ms
- **Respuestas del Copiloto:** < 4 segundos
- **Apertura de visor PDF:** < 2 segundos
- **Cambio de contexto:** < 1 segundo
- **Reconocimiento de voz:** < 2 segundos

### 5.2 Experiencia de Usuario
- **Carga inicial del dashboard:** < 3 segundos
- **Transiciones visuales:** Suaves, < 300ms
- **Toast notifications:** 3-5 segundos de duración
- **Feedback visual:** Inmediato (< 100ms)

---

## 6. Historias de Usuario Adicionales

### HU-023: Dashboard Personalizado
**Como** Dr. Solis  
**Quiero** ver una pantalla de bienvenida personalizada con mi nombre  
**Para** tener una experiencia personalizada al iniciar mi jornada  

### HU-024: Pacientes Recientes
**Como** Dr. Solis  
**Quiero** ver mis 5 pacientes más recientes en el dashboard  
**Para** acceder rápidamente a casos que estoy siguiendo  

### HU-025: Buscador con Autocompletado
**Como** Dr. Solis  
**Quiero** un buscador que autocomplete mientras escribo  
**Para** encontrar pacientes rápidamente con mínimo esfuerzo  

### HU-026: Contexto Visual Activo
**Como** Dr. Solis  
**Quiero** ver claramente qué paciente está activo con cambios visuales  
**Para** evitar confusiones entre pacientes  

### HU-027: Toast de Confirmación
**Como** Dr. Solis  
**Quiero** recibir confirmación visual cuando cambio de paciente  
**Para** estar seguro del contexto activo  

### HU-028: Copiloto con Badges
**Como** Dr. Solis  
**Quiero** que las respuestas incluyan badges clickeables a documentos  
**Para** verificar la fuente de la información fácilmente  

### HU-029: Visor Lateral de PDFs
**Como** Dr. Solis  
**Quiero** ver PDFs en un visor lateral que abra en la página exacta  
**Para** verificar información sin perder el contexto del chat  

### HU-030: Comandos de Voz
**Como** Dr. Solis  
**Quiero** cambiar de paciente usando comandos de voz  
**Para** mantener las manos libres durante la consulta  

### HU-031: Comandos Especiales
**Como** Dr. Solis  
**Quiero** usar comandos como "/nota" para funciones específicas  
**Para** acceder rápidamente a funcionalidades comunes  

### HU-032: Audit Trail Automático
**Como** administrador  
**Quiero** que se registren automáticamente todas las interacciones  
**Para** cumplir con requerimientos de auditoría médica  

---

## 7. Criterios de Aceptación del Flujo

### 7.1 Criterios de Éxito del Flujo Completo
- ✅ Autenticación exitosa con Microsoft ID
- ✅ Dashboard personalizado carga en < 3 segundos
- ✅ Buscador autocompleta en < 500ms
- ✅ Contexto visual cambia correctamente
- ✅ Toast notifications aparecen y desaparecen apropiadamente
- ✅ Copiloto responde en < 4 segundos
- ✅ Badges abren visor en página correcta
- ✅ Comandos de voz funcionan con confirmación
- ✅ Audit trail registra toda la actividad
- ✅ Cierre de sesión limpia y completa

### 7.2 Validación de Experiencia de Usuario
- ✅ Flujo intuitivo sin necesidad de capacitación
- ✅ Feedback visual claro en cada acción
- ✅ Operación hands-free funcional
- ✅ Verificación de fuentes seamless
- ✅ Cambio de contexto sin errores
- ✅ Rendimiento consistente durante toda la sesión

---

**Versión:** 2.0  
**Estado:** Actualizado con flujo específico del Dr. Solis  
**Próxima revisión:** Validación con stakeholders técnicos

