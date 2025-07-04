# Análisis del Flujo de Usuario del Dr. Solis

## Requerimientos Funcionales Específicos Identificados

### **Escena 1: Llegada al consultorio**
**Requerimientos identificados:**
- Autenticación con Microsoft ID (Azure AD)
- Pantalla de bienvenida minimalista personalizada
- Buscador prominente en esquina superior
- Lista de "Pacientes recientes" (5 pacientes)

### **Escena 2: Primer paciente vía buscador visual**
**Requerimientos identificados:**
- Buscador con autocompletado en tiempo real
- Cambio visual de cabecera (color azul tenue)
- Mostrar foto del paciente, nombre y edad
- Toast notification de contexto activo
- Formato específico: "Contexto activo: [Nombre] ([Edad] a)"

### **Escena 3: Consulta rápida con el Copiloto**
**Requerimientos identificados:**
- Chat conversacional llamado "Copiloto"
- Respuestas en menos de 4 segundos
- Badges clickeables con referencias a documentos
- Formato de badge: "[documento.pdf · pág X]"
- Visor lateral de PDFs
- Apertura directa en página específica

### **Escena 4: Verificación y confianza**
**Requerimientos identificados:**
- Navegación dentro del PDF (deslizar)
- Botón de cierre del visor "⤫"
- Retorno automático al chat

### **Escena 5: Cambio de paciente por voz (hands-free)**
**Requerimientos identificados:**
- Comando de voz: "Copiloto, cambia al paciente [nombre]"
- Confirmación verbal con datos del paciente
- Respuesta de confirmación del usuario
- Cambio visual de cabecera (parpadeo verde 3 segundos)

### **Escena 6: Seguimiento y cierre**
**Requerimientos identificados:**
- Comando especial "/nota" para notas clínicas
- Avatar de usuario clickeable
- Opción "Cerrar sesión"
- Audit trail automático de preguntas y documentos abiertos

---

## Nuevos Módulos Funcionales Identificados

### **Módulo: Interfaz de Usuario Avanzada**
1. **Dashboard personalizado con bienvenida**
2. **Buscador visual con autocompletado**
3. **Gestión de pacientes recientes**
4. **Sistema de contexto visual (cabecera dinámica)**
5. **Toast notifications**

### **Módulo: Copiloto Conversacional**
1. **Chat con nombre "Copiloto"**
2. **Respuestas con badges clickeables**
3. **Referencias automáticas a documentos fuente**
4. **Comandos especiales (/nota, etc.)**

### **Módulo: Visor de Documentos**
1. **Visor lateral de PDFs**
2. **Navegación directa a páginas específicas**
3. **Controles de navegación dentro del PDF**

### **Módulo: Comandos de Voz**
1. **Reconocimiento de voz para cambio de paciente**
2. **Confirmaciones verbales**
3. **Feedback visual de cambios**

### **Módulo: Audit Trail Avanzado**
1. **Registro automático de todas las interacciones**
2. **Tracking de documentos abiertos**
3. **Historial de preguntas por sesión**

---

## Historias de Usuario Adicionales Necesarias

### **HU-023: Dashboard Personalizado**
**Como** Dr. Solis  
**Quiero** ver una pantalla de bienvenida personalizada con mi nombre  
**Para** tener una experiencia personalizada al iniciar mi jornada  

### **HU-024: Pacientes Recientes**
**Como** Dr. Solis  
**Quiero** ver mis 5 pacientes más recientes en el dashboard  
**Para** acceder rápidamente a casos que estoy siguiendo  

### **HU-025: Buscador con Autocompletado**
**Como** Dr. Solis  
**Quiero** un buscador que autocomplete mientras escribo  
**Para** encontrar pacientes rápidamente con mínimo esfuerzo  

### **HU-026: Contexto Visual Activo**
**Como** Dr. Solis  
**Quiero** ver claramente qué paciente está activo con cambios visuales  
**Para** evitar confusiones entre pacientes  

### **HU-027: Toast de Confirmación**
**Como** Dr. Solis  
**Quiero** recibir confirmación visual cuando cambio de paciente  
**Para** estar seguro del contexto activo  

### **HU-028: Copiloto con Badges**
**Como** Dr. Solis  
**Quiero** que las respuestas incluyan badges clickeables a documentos  
**Para** verificar la fuente de la información fácilmente  

### **HU-029: Visor Lateral de PDFs**
**Como** Dr. Solis  
**Quiero** ver PDFs en un visor lateral que abra en la página exacta  
**Para** verificar información sin perder el contexto del chat  

### **HU-030: Comandos de Voz**
**Como** Dr. Solis  
**Quiero** cambiar de paciente usando comandos de voz  
**Para** mantener las manos libres durante la consulta  

### **HU-031: Comandos Especiales**
**Como** Dr. Solis  
**Quiero** usar comandos como "/nota" para funciones específicas  
**Para** acceder rápidamente a funcionalidades comunes  

### **HU-032: Audit Trail Automático**
**Como** administrador  
**Quiero** que se registren automáticamente todas las interacciones  
**Para** cumplir con requerimientos de auditoría médica

