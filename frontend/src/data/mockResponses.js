// Respuestas mock del copiloto médico
export const mockResponses = {
  // Consultas sobre laboratorios
  "laboratorios colesterol": {
    text: `Los laboratorios de colesterol del último año muestran:

• Colesterol total: 245 mg/dL (15 Mar 2024)
• LDL: 165 mg/dL (15 Mar 2024) 
• HDL: 42 mg/dL (15 Mar 2024)
• Triglicéridos: 190 mg/dL (15 Mar 2024)

Los valores se encuentran elevados, especialmente el LDL. Se recomienda continuar con estatinas y control dietético.`,
    badges: [
      { text: "lab_colesterol_mar2024.pdf · pág 2", document: "lab_colesterol_mar2024.pdf", page: 2 }
    ],
    delay: 2500
  },

  "laboratorios": {
    text: `Últimos laboratorios disponibles:

• Biometría hemática completa (20 Dic 2024)
• Química sanguínea (20 Dic 2024)
• Perfil lipídico (15 Mar 2024)
• Hemoglobina glucosilada (10 Nov 2024)

¿Te interesa algún estudio en particular?`,
    badges: [
      { text: "lab_biometria_dic2024.pdf · pág 1", document: "lab_biometria_dic2024.pdf", page: 1 },
      { text: "lab_quimica_dic2024.pdf · pág 1", document: "lab_quimica_dic2024.pdf", page: 1 }
    ],
    delay: 2000
  },

  // Consultas sobre medicamentos
  "medicamentos": {
    text: `Medicamentos actuales del paciente:

• Enalapril 10mg c/12h - Hipertensión
• Metformina 850mg c/12h - Diabetes
• Atorvastatina 40mg c/24h - Dislipidemia
• Aspirina 100mg c/24h - Cardioprotección

Última actualización: 15 Dic 2024`,
    badges: [
      { text: "receta_dic2024.pdf · pág 1", document: "receta_dic2024.pdf", page: 1 }
    ],
    delay: 1800
  },

  // Consultas sobre diagnósticos
  "diagnóstico": {
    text: `Diagnósticos activos:

**Principal:**
• Diabetes mellitus tipo 2 descompensada

**Secundarios:**
• Hipertensión arterial sistémica
• Dislipidemia mixta
• Neuropatía diabética periférica

Última evaluación: 15 Dic 2024`,
    badges: [
      { text: "nota_medica_dic2024.pdf · pág 1", document: "nota_medica_dic2024.pdf", page: 1 }
    ],
    delay: 2200
  },

  // Consultas sobre estudios de imagen
  "radiografía": {
    text: `Última radiografía de tórax (10 Nov 2024):

• Campos pulmonares limpios
• Silueta cardíaca normal
• Sin infiltrados ni consolidaciones
• Índice cardiotorácico: 0.48

Interpretación: Sin alteraciones agudas.`,
    badges: [
      { text: "rx_torax_nov2024.pdf · pág 1", document: "rx_torax_nov2024.pdf", page: 1 }
    ],
    delay: 2800
  },

  // Consultas sobre signos vitales
  "signos vitales": {
    text: `Signos vitales de la última consulta (15 Dic 2024):

• Tensión arterial: 145/92 mmHg
• Frecuencia cardíaca: 88 lpm
• Temperatura: 36.7°C
• Peso: 74 kg
• IMC: 28.2 kg/m²

Nota: TA ligeramente elevada, ajustar medicación.`,
    badges: [
      { text: "consulta_dic2024.pdf · pág 1", document: "consulta_dic2024.pdf", page: 1 }
    ],
    delay: 1500
  },

  // Comando especial /nota
  "/nota": {
    text: `**Nota clínica rápida iniciada**

Fecha: ${new Date().toLocaleDateString('es-ES')}
Hora: ${new Date().toLocaleTimeString('es-ES')}

Puedes dictar tu nota clínica. Escribe "/guardar" cuando termines.`,
    badges: [],
    delay: 800
  },

  // Respuestas por defecto
  "default": {
    text: `Puedo ayudarte con información sobre:

• Laboratorios y estudios
• Medicamentos actuales
• Diagnósticos y tratamientos
• Signos vitales
• Estudios de imagen
• Notas clínicas (/nota)

¿Qué información necesitas del expediente?`,
    badges: [],
    delay: 1200
  }
};

// Respuestas específicas por paciente
export const patientSpecificResponses = {
  "12345": { // Julio Gómez Martínez
    "presión": {
      text: `Evolución de la presión arterial de Julio:

• 15 Dic: 145/92 mmHg
• 01 Dic: 138/88 mmHg  
• 15 Nov: 142/90 mmHg
• 01 Nov: 150/95 mmHg

Tendencia: Mejoría gradual con tratamiento actual.`,
      badges: [
        { text: "control_pa_dic2024.pdf · pág 1", document: "control_pa_dic2024.pdf", page: 1 }
      ],
      delay: 2000
    }
  },
  
  "12347": { // María González Ruiz
    "glucosa": {
      text: `Control glucémico de María:

• Glucemia en ayunas: 145 mg/dL (15 Dic)
• HbA1c: 8.2% (10 Nov)
• Glucemia postprandial: 210 mg/dL (15 Dic)

Meta: HbA1c <7%. Requiere ajuste de tratamiento.`,
      badges: [
        { text: "control_diabetes_dic2024.pdf · pág 2", document: "control_diabetes_dic2024.pdf", page: 2 }
      ],
      delay: 2300
    }
  }
};

// Función para obtener respuesta del copiloto
export const getCopilotResponse = (message, patientId = null) => {
  const lowerMessage = message.toLowerCase();
  
  // Verificar respuestas específicas del paciente primero
  if (patientId && patientSpecificResponses[patientId]) {
    const patientResponses = patientSpecificResponses[patientId];
    for (const [key, response] of Object.entries(patientResponses)) {
      if (lowerMessage.includes(key)) {
        return response;
      }
    }
  }
  
  // Verificar respuestas generales
  for (const [key, response] of Object.entries(mockResponses)) {
    if (lowerMessage.includes(key)) {
      return response;
    }
  }
  
  // Respuesta por defecto
  return mockResponses.default;
};

// Función para simular delay de respuesta
export const simulateTyping = (delay = 2000) => {
  return new Promise(resolve => setTimeout(resolve, delay));
};

// Mensajes de bienvenida por paciente
export const getWelcomeMessage = (patientName) => {
  return {
    text: `¡Hola! Soy tu Copiloto médico. Tengo acceso al expediente completo de ${patientName}. 

¿En qué puedo ayudarte hoy? Puedo consultar laboratorios, medicamentos, diagnósticos, estudios de imagen y más.`,
    badges: [],
    delay: 1000
  };
};

export default mockResponses;

