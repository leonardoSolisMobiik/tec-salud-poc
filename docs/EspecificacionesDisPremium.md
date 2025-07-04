# Especificaciones de Diseño Premium
# ASISTENTE VIRTUAL PARA EXPEDIENTES CLÍNICOS - TEC SALUD

**Versión:** 1.0  
**Fecha:** 17 de Junio de 2025  
**Preparado para:** Equipo de Diseño y Desarrollo  

## Índice

1. [Introducción](#1-introducción)
2. [Stack Tecnológico Recomendado](#2-stack-tecnológico-recomendado)
3. [Arquitectura de Componentes](#3-arquitectura-de-componentes)
4. [Filosofía de Diseño](#4-filosofía-de-diseño)
5. [Guía de Estilo Visual](#5-guía-de-estilo-visual)
6. [Componentes UI Base](#6-componentes-ui-base)
7. [Microinteracciones y Animaciones](#7-microinteracciones-y-animaciones)
8. [Consideraciones Técnicas](#8-consideraciones-técnicas)

## 1. Introducción

Este documento proporciona las especificaciones de diseño para la creación del Asistente Virtual para Expedientes Clínicos de TecSalud, una aplicación web médica premium para acceso inteligente a historial clínico. El enfoque de diseño se inspira en los principios estéticos de Karolis Kosas y Apple's Human Interface Guidelines, priorizando minimalismo refinado, atención meticulosa al detalle y experiencia visual sofisticada adaptada al contexto médico profesional.

### 1.1 Propósito del Prototipo React

El prototipo en React debe ilustrar de manera clara y convincente:

- La interfaz de usuario con un enfoque minimalista y premium adaptado al entorno médico
- La experiencia conversacional refinada con el Copiloto médico inteligente
- La presentación elegante de información clínica y referencias a expedientes
- La interacción fluida y natural entre el dashboard, búsqueda, chat y visor de PDFs
- El sistema de contexto visual que mantiene claridad sobre el paciente activo

### 1.2 Ventajas del Enfoque Elegido

Desarrollar en React + Vite ofrece ventajas significativas:

- **Reutilización para el proyecto real**: El código desarrollado servirá como base para la implementación final
- **Componentes modulares**: Facilita mantener la consistencia visual y funcional en contexto médico
- **Gestión de estado eficiente**: Ideal para simular interacciones conversacionales y contexto de paciente
- **Transiciones y animaciones avanzadas**: Permite implementar las microinteracciones al estilo Kosas/Apple
- **Mantenibilidad**: Estructura clara y separación de responsabilidades para equipo médico-técnico

### 1.3 Audiencia Objetivo

Este documento está dirigido al equipo de diseño y desarrollo responsable de crear la aplicación React del asistente virtual médico. Se asume familiaridad con React, principios de diseño UI/UX de alto nivel, desarrollo frontend moderno y consideraciones específicas de aplicaciones médicas.

## 2. Stack Tecnológico Recomendado

### 2.1 Base del Proyecto

**Vite** es la herramienta recomendada para inicializar el proyecto por las siguientes razones:

- **Rendimiento superior**: Tiempos de compilación significativamente más rápidos que Create React App
- **Configuración simplificada**: Menos complejidad inicial con opciones de personalización médica
- **HMR ultrarrápido**: Hot Module Replacement casi instantáneo para flujo de trabajo eficiente
- **Optimizaciones modernas**: Soporte nativo para ES modules y optimizaciones de producción

**Configuración inicial recomendada:**

```bash
# Inicializar proyecto con Vite + TypeScript
npm create vite@latest tecsalud-copiloto -- --template react-ts

# Instalar dependencias
cd tecsalud-copiloto
npm install
```

### 2.2 Estilos y Diseño Visual

**Styled Components** es la biblioteca recomendada para implementar los estilos Kosas/Apple adaptados al contexto médico:

- **Estilos a nivel de componente**: Perfecto para el enfoque modular de React
- **Props dinámicas**: Facilita implementar variantes y estados visuales médicos
- **Theming avanzado**: Ideal para mantener consistencia en la paleta médica profesional
- **Soporte para animaciones**: Integración fluida con transiciones y keyframes
- **Estilos globales**: Permite definir reset CSS y estilos base médicos consistentes

**Configuración recomendada:**

```bash
# Instalar Styled Components y tipos para TypeScript
npm install styled-components
npm install --save-dev @types/styled-components
```

**Ejemplo de implementación médica:**

```tsx
// Botón médico con estilo Kosas/Apple
import styled from 'styled-components';

const MedicalButton = styled.button<{ variant?: 'primary' | 'secondary' | 'emergency' }>`
  height: 44px;
  padding: 0 24px;
  border-radius: 22px; // Forma de píldora característica
  font-family: 'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 16px;
  font-weight: 500;
  transition: all 200ms ease-out;
  border: none;
  cursor: pointer;
  
  ${props => props.variant === 'primary' && `
    background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(33, 150, 243, 0.4);
    }
  `}
  
  ${props => props.variant === 'emergency' && `
    background: linear-gradient(135deg, #F44336 0%, #D32F2F 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
  `}
`;
```

### 2.3 Gestión de Estado

**Zustand** es recomendado para gestión de estado por su simplicidad y eficiencia:

```bash
npm install zustand
```

**Store para contexto médico:**

```tsx
import { create } from 'zustand';

interface Patient {
  id: string;
  name: string;
  age: number;
  lastVisit: string;
}

interface MedicalStore {
  activePatient: Patient | null;
  recentPatients: Patient[];
  chatHistory: Message[];
  setActivePatient: (patient: Patient) => void;
  addMessage: (message: Message) => void;
}

const useMedicalStore = create<MedicalStore>((set) => ({
  activePatient: null,
  recentPatients: [],
  chatHistory: [],
  setActivePatient: (patient) => set({ activePatient: patient }),
  addMessage: (message) => set((state) => ({ 
    chatHistory: [...state.chatHistory, message] 
  })),
}));
```

### 2.4 Componentes UI Adicionales

**Framer Motion** para animaciones sofisticadas:

```bash
npm install framer-motion
```

**React PDF Viewer** para visualización de expedientes:

```bash
npm install @react-pdf-viewer/core @react-pdf-viewer/default-layout
```

**React Speech Kit** para comandos de voz:

```bash
npm install react-speech-kit
```

## 3. Arquitectura de Componentes

### 3.1 Estructura de Carpetas

```
src/
├── components/
│   ├── layout/
│   │   ├── Dashboard.tsx
│   │   ├── Header.tsx
│   │   └── Sidebar.tsx
│   ├── medical/
│   │   ├── PatientSearch.tsx
│   │   ├── PatientContext.tsx
│   │   ├── Copilot.tsx
│   │   └── PDFViewer.tsx
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Toast.tsx
│   │   └── Badge.tsx
│   └── animations/
│       ├── FadeIn.tsx
│       ├── SlideIn.tsx
│       └── Pulse.tsx
├── hooks/
│   ├── usePatientSearch.ts
│   ├── useVoiceCommands.ts
│   └── useCopilot.ts
├── stores/
│   ├── medicalStore.ts
│   └── uiStore.ts
├── styles/
│   ├── theme.ts
│   ├── globalStyles.ts
│   └── medicalTheme.ts
└── utils/
    ├── medicalHelpers.ts
    └── voiceRecognition.ts
```

### 3.2 Componentes Principales

#### 3.2.1 Dashboard Component

```tsx
import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { PatientSearch } from '../medical/PatientSearch';
import { RecentPatients } from '../medical/RecentPatients';

const DashboardContainer = styled(motion.div)`
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafb 0%, #f1f5f9 100%);
  padding: 24px;
`;

const WelcomeMessage = styled.h1`
  font-size: 32px;
  font-weight: 300;
  color: #1a202c;
  margin-bottom: 32px;
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
`;

export const Dashboard: React.FC = () => {
  return (
    <DashboardContainer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <WelcomeMessage>¡Buen día, Dr. Solis!</WelcomeMessage>
      <PatientSearch />
      <RecentPatients />
    </DashboardContainer>
  );
};
```

#### 3.2.2 Patient Context Component

```tsx
import React from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useMedicalStore } from '../../stores/medicalStore';

const ContextHeader = styled(motion.div)<{ isActive: boolean }>`
  height: 80px;
  background: ${props => props.isActive 
    ? 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)' 
    : 'transparent'};
  border-radius: 16px;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  transition: all 300ms ease-out;
  margin-bottom: 16px;
`;

const PatientInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const PatientAvatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 24px;
  background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 18px;
`;

const PatientDetails = styled.div`
  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #1a202c;
  }
  
  p {
    margin: 4px 0 0 0;
    font-size: 14px;
    color: #64748b;
  }
`;

export const PatientContext: React.FC = () => {
  const { activePatient } = useMedicalStore();
  
  return (
    <AnimatePresence>
      {activePatient && (
        <ContextHeader
          isActive={!!activePatient}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
        >
          <PatientInfo>
            <PatientAvatar>
              {activePatient.name.split(' ').map(n => n[0]).join('')}
            </PatientAvatar>
            <PatientDetails>
              <h3>{activePatient.name}</h3>
              <p>{activePatient.age} años • ID: {activePatient.id}</p>
            </PatientDetails>
          </PatientInfo>
        </ContextHeader>
      )}
    </AnimatePresence>
  );
};
```

#### 3.2.3 Copilot Chat Component

```tsx
import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useCopilot } from '../../hooks/useCopilot';
import { Badge } from '../ui/Badge';

const ChatContainer = styled.div`
  background: white;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  padding: 24px;
  height: 600px;
  display: flex;
  flex-direction: column;
`;

const ChatHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f1f5f9;
`;

const CopilotIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 14px;
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 2px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 2px;
  }
`;

const Message = styled(motion.div)<{ isUser: boolean }>`
  margin-bottom: 16px;
  display: flex;
  justify-content: ${props => props.isUser ? 'flex-end' : 'flex-start'};
`;

const MessageBubble = styled.div<{ isUser: boolean }>`
  max-width: 80%;
  padding: 12px 16px;
  border-radius: 18px;
  background: ${props => props.isUser 
    ? 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)' 
    : '#f8fafc'};
  color: ${props => props.isUser ? 'white' : '#1a202c'};
  font-size: 14px;
  line-height: 1.5;
`;

const InputContainer = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
`;

const ChatInput = styled.input`
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 24px;
  font-size: 14px;
  outline: none;
  transition: all 200ms ease-out;
  
  &:focus {
    border-color: #2196F3;
    box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
  }
  
  &::placeholder {
    color: #94a3b8;
  }
`;

const SendButton = styled.button`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 200ms ease-out;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
  }
`;

export const Copilot: React.FC = () => {
  const [input, setInput] = useState('');
  const { messages, sendMessage, isLoading } = useCopilot();
  
  const handleSend = () => {
    if (input.trim()) {
      sendMessage(input);
      setInput('');
    }
  };
  
  return (
    <ChatContainer>
      <ChatHeader>
        <CopilotIcon>AI</CopilotIcon>
        <h3>Copiloto</h3>
      </ChatHeader>
      
      <MessagesContainer>
        {messages.map((message, index) => (
          <Message
            key={index}
            isUser={message.isUser}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <MessageBubble isUser={message.isUser}>
              {message.text}
              {message.badges && (
                <div style={{ marginTop: '8px' }}>
                  {message.badges.map((badge, i) => (
                    <Badge key={i} onClick={() => badge.onClick()}>
                      {badge.text}
                    </Badge>
                  ))}
                </div>
              )}
            </MessageBubble>
          </Message>
        ))}
      </MessagesContainer>
      
      <InputContainer>
        <ChatInput
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pregunta sobre el expediente del paciente..."
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        />
        <SendButton onClick={handleSend}>
          →
        </SendButton>
      </InputContainer>
    </ChatContainer>
  );
};
```

## 4. Filosofía de Diseño

### 4.1 Principios Fundamentales

#### 4.1.1 Minimalismo Médico Funcional

El diseño adopta un enfoque minimalista que prioriza la funcionalidad médica sin sacrificar la elegancia visual. Cada elemento tiene un propósito específico en el flujo de trabajo médico, eliminando distracciones innecesarias que podrían interferir con la toma de decisiones clínicas críticas.

**Características clave:**
- Espacios en blanco generosos para reducir fatiga visual durante largas jornadas
- Jerarquía visual clara que prioriza información médica crítica
- Paleta de colores calmante pero profesional
- Tipografía legible optimizada para lectura de información médica

#### 4.1.2 Claridad Contextual

La interfaz mantiene claridad absoluta sobre el contexto del paciente activo, evitando errores médicos por confusión de información. El sistema visual refuerza constantemente qué paciente está siendo consultado.

**Implementación:**
- Cabecera dinámica con información del paciente activo
- Códigos de color consistentes para diferentes estados
- Feedback visual inmediato para cambios de contexto
- Separación visual clara entre diferentes secciones de información

#### 4.1.3 Eficiencia Profesional

El diseño optimiza para la eficiencia del flujo de trabajo médico, reduciendo el número de clicks y tiempo necesario para acceder a información crítica.

**Características:**
- Accesos directos a funciones frecuentes
- Autocompletado inteligente en búsquedas
- Comandos de voz para operación hands-free
- Navegación intuitiva que sigue patrones médicos establecidos

### 4.2 Inspiración Visual

#### 4.2.1 Estética Karolis Kosas

- **Geometría limpia**: Formas simples y proporciones matemáticamente precisas
- **Transiciones suaves**: Animaciones que guían la atención sin distraer
- **Profundidad sutil**: Uso de sombras y gradientes para crear jerarquía visual
- **Atención al detalle**: Microinteracciones que mejoran la experiencia

#### 4.2.2 Principios Apple Human Interface

- **Claridad**: Texto legible, iconos reconocibles, funcionalidad obvia
- **Deferencia**: La interfaz ayuda a entender y interactuar con contenido médico
- **Profundidad**: Capas visuales y movimiento realista proporcionan significado

## 5. Guía de Estilo Visual

### 5.1 Paleta de Colores

#### 5.1.1 Colores Primarios

```css
/* Azul Médico Principal */
--primary-blue: #2196F3;
--primary-blue-dark: #1976D2;
--primary-blue-light: #E3F2FD;

/* Azul Contexto Activo */
--context-blue: #E3F2FD;
--context-blue-border: #BBDEFB;

/* Verde Confirmación */
--success-green: #4CAF50;
--success-green-light: #E8F5E8;

/* Rojo Emergencia/Alerta */
--emergency-red: #F44336;
--emergency-red-light: #FFEBEE;
```

#### 5.1.2 Colores Neutros

```css
/* Grises Profesionales */
--gray-50: #f8fafc;
--gray-100: #f1f5f9;
--gray-200: #e2e8f0;
--gray-300: #cbd5e1;
--gray-400: #94a3b8;
--gray-500: #64748b;
--gray-600: #475569;
--gray-700: #334155;
--gray-800: #1e293b;
--gray-900: #0f172a;

/* Texto */
--text-primary: #1a202c;
--text-secondary: #64748b;
--text-muted: #94a3b8;
```

#### 5.1.3 Colores de Estado

```css
/* Estados de Información */
--info-blue: #3B82F6;
--info-blue-light: #EFF6FF;

/* Estados de Advertencia */
--warning-yellow: #F59E0B;
--warning-yellow-light: #FFFBEB;

/* Estados de Éxito */
--success-green: #10B981;
--success-green-light: #ECFDF5;
```

### 5.2 Tipografía

#### 5.2.1 Familia de Fuentes

```css
/* Fuente Principal - San Francisco Pro */
--font-primary: 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

/* Fuente Display - Para títulos */
--font-display: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

/* Fuente Monospace - Para IDs y códigos */
--font-mono: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', monospace;
```

#### 5.2.2 Escala Tipográfica

```css
/* Títulos */
--text-4xl: 36px; /* Título principal dashboard */
--text-3xl: 30px; /* Títulos de sección */
--text-2xl: 24px; /* Subtítulos importantes */
--text-xl: 20px;  /* Títulos de componentes */
--text-lg: 18px;  /* Nombres de pacientes */

/* Texto de contenido */
--text-base: 16px;  /* Texto principal */
--text-sm: 14px;    /* Texto secundario */
--text-xs: 12px;    /* Metadatos y labels */

/* Pesos de fuente */
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### 5.3 Espaciado y Layout

#### 5.3.1 Sistema de Espaciado

```css
/* Espaciado base de 4px */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
--space-24: 96px;
```

#### 5.3.2 Border Radius

```css
/* Radios de borde */
--radius-sm: 6px;   /* Elementos pequeños */
--radius-md: 8px;   /* Elementos medianos */
--radius-lg: 12px;  /* Cards y contenedores */
--radius-xl: 16px;  /* Contenedores principales */
--radius-2xl: 20px; /* Elementos destacados */
--radius-full: 9999px; /* Botones píldora */
```

#### 5.3.3 Sombras

```css
/* Sombras sutiles */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
--shadow-lg: 0 8px 25px rgba(0, 0, 0, 0.08);
--shadow-xl: 0 20px 40px rgba(0, 0, 0, 0.1);

/* Sombras de color */
--shadow-blue: 0 4px 12px rgba(33, 150, 243, 0.3);
--shadow-green: 0 4px 12px rgba(76, 175, 80, 0.3);
--shadow-red: 0 4px 12px rgba(244, 67, 54, 0.3);
```

## 6. Componentes UI Base

### 6.1 Botones

#### 6.1.1 Botón Primario

```tsx
const PrimaryButton = styled.button`
  height: 44px;
  padding: 0 24px;
  border-radius: 22px;
  background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
  border: none;
  color: white;
  font-family: var(--font-primary);
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 200ms ease-out;
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(33, 150, 243, 0.4);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;
```

#### 6.1.2 Botón Secundario

```tsx
const SecondaryButton = styled.button`
  height: 44px;
  padding: 0 24px;
  border-radius: 22px;
  background: white;
  border: 1px solid #e2e8f0;
  color: #475569;
  font-family: var(--font-primary);
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 200ms ease-out;
  
  &:hover {
    border-color: #2196F3;
    color: #2196F3;
    box-shadow: 0 4px 12px rgba(33, 150, 243, 0.15);
  }
`;
```

### 6.2 Inputs y Formularios

#### 6.2.1 Input de Búsqueda

```tsx
const SearchInput = styled.input`
  width: 100%;
  height: 48px;
  padding: 0 20px 0 48px;
  border: 1px solid #e2e8f0;
  border-radius: 24px;
  font-size: 16px;
  font-family: var(--font-primary);
  background: white;
  transition: all 200ms ease-out;
  
  &::placeholder {
    color: #94a3b8;
  }
  
  &:focus {
    outline: none;
    border-color: #2196F3;
    box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 20px;
`;
```

### 6.3 Cards y Contenedores

#### 6.3.1 Patient Card

```tsx
const PatientCard = styled(motion.div)`
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
  cursor: pointer;
  transition: all 200ms ease-out;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    border-color: #2196F3;
  }
`;

const PatientName = styled.h3`
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a202c;
`;

const PatientMeta = styled.p`
  margin: 0;
  font-size: 14px;
  color: #64748b;
`;
```

### 6.4 Toast Notifications

```tsx
const ToastContainer = styled(motion.div)`
  position: fixed;
  top: 24px;
  right: 24px;
  background: white;
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border-left: 4px solid #4CAF50;
  z-index: 1000;
  max-width: 400px;
`;

const ToastMessage = styled.p`
  margin: 0;
  font-size: 14px;
  color: #1a202c;
  font-weight: 500;
`;

export const Toast: React.FC<{ message: string; onClose: () => void }> = ({ 
  message, 
  onClose 
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);
  
  return (
    <ToastContainer
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ duration: 0.3 }}
    >
      <ToastMessage>{message}</ToastMessage>
    </ToastContainer>
  );
};
```

## 7. Microinteracciones y Animaciones

### 7.1 Transiciones de Página

```tsx
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 }
};

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.5
};

export const PageTransition: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => (
  <motion.div
    initial="initial"
    animate="in"
    exit="out"
    variants={pageVariants}
    transition={pageTransition}
  >
    {children}
  </motion.div>
);
```

### 7.2 Animaciones de Contexto

```tsx
const contextVariants = {
  inactive: { 
    backgroundColor: "transparent",
    scale: 1 
  },
  active: { 
    backgroundColor: "#E3F2FD",
    scale: 1.02,
    transition: { duration: 0.3 }
  },
  voiceConfirm: {
    backgroundColor: ["#E3F2FD", "#4CAF50", "#E3F2FD"],
    transition: { 
      duration: 3,
      times: [0, 0.5, 1],
      ease: "easeInOut"
    }
  }
};

export const AnimatedContextHeader = styled(motion.div)`
  /* Estilos base */
`;
```

### 7.3 Animaciones de Chat

```tsx
const messageVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.3, ease: "easeOut" }
  }
};

const typingVariants = {
  typing: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};
```

### 7.4 Hover States Sofisticados

```tsx
const HoverCard = styled(motion.div)`
  cursor: pointer;
  
  &:hover {
    .card-content {
      transform: translateY(-2px);
    }
    
    .card-shadow {
      opacity: 1;
      transform: scale(1.05);
    }
  }
`;

const CardShadow = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #2196F3, #1976D2);
  border-radius: inherit;
  opacity: 0;
  transform: scale(0.95);
  transition: all 300ms ease-out;
  z-index: -1;
  filter: blur(20px);
`;
```

## 8. Consideraciones Técnicas

### 8.1 Optimización de Rendimiento

#### 8.1.1 Lazy Loading

```tsx
// Lazy loading para componentes pesados
const PDFViewer = lazy(() => import('./PDFViewer'));
const VoiceCommands = lazy(() => import('./VoiceCommands'));

// Uso con Suspense
<Suspense fallback={<LoadingSpinner />}>
  <PDFViewer />
</Suspense>
```

#### 8.1.2 Memoización

```tsx
// Memoización de componentes costosos
const PatientList = memo(({ patients }: { patients: Patient[] }) => {
  return (
    <div>
      {patients.map(patient => (
        <PatientCard key={patient.id} patient={patient} />
      ))}
    </div>
  );
});

// Memoización de valores calculados
const searchResults = useMemo(() => {
  return patients.filter(patient => 
    patient.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
}, [patients, searchTerm]);
```

### 8.2 Accesibilidad

#### 8.2.1 ARIA Labels

```tsx
const SearchInput = styled.input.attrs({
  'aria-label': 'Buscar paciente por nombre',
  'aria-describedby': 'search-help',
  role: 'searchbox'
})`
  /* estilos */
`;

const PatientCard = styled.div.attrs({
  role: 'button',
  tabIndex: 0,
  'aria-label': (props) => `Seleccionar paciente ${props.patient.name}`
})`
  /* estilos */
`;
```

#### 8.2.2 Navegación por Teclado

```tsx
const useKeyboardNavigation = (items: any[], onSelect: (item: any) => void) => {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < items.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
          break;
        case 'Enter':
          if (selectedIndex >= 0) {
            onSelect(items[selectedIndex]);
          }
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, selectedIndex, onSelect]);
  
  return selectedIndex;
};
```

### 8.3 Responsive Design

#### 8.3.1 Breakpoints

```tsx
const breakpoints = {
  mobile: '768px',
  tablet: '1024px',
  desktop: '1440px'
};

const ResponsiveContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  
  @media (min-width: ${breakpoints.tablet}) {
    grid-template-columns: 1fr 1fr;
  }
  
  @media (min-width: ${breakpoints.desktop}) {
    grid-template-columns: 2fr 1fr;
  }
`;
```

#### 8.3.2 Mobile-First Approach

```tsx
const MobileFirstComponent = styled.div`
  /* Mobile styles (default) */
  padding: 16px;
  font-size: 14px;
  
  /* Tablet and up */
  @media (min-width: 768px) {
    padding: 24px;
    font-size: 16px;
  }
  
  /* Desktop and up */
  @media (min-width: 1024px) {
    padding: 32px;
    font-size: 18px;
  }
`;
```

### 8.4 Testing

#### 8.4.1 Component Testing

```tsx
// Ejemplo de test para PatientCard
import { render, screen, fireEvent } from '@testing-library/react';
import { PatientCard } from './PatientCard';

test('renders patient information correctly', () => {
  const patient = {
    id: '123',
    name: 'Julio Gómez',
    age: 37,
    lastVisit: '2025-06-15'
  };
  
  render(<PatientCard patient={patient} onSelect={jest.fn()} />);
  
  expect(screen.getByText('Julio Gómez')).toBeInTheDocument();
  expect(screen.getByText('37 años')).toBeInTheDocument();
});

test('calls onSelect when clicked', () => {
  const onSelect = jest.fn();
  const patient = { id: '123', name: 'Test', age: 30, lastVisit: '2025-06-15' };
  
  render(<PatientCard patient={patient} onSelect={onSelect} />);
  
  fireEvent.click(screen.getByRole('button'));
  expect(onSelect).toHaveBeenCalledWith(patient);
});
```

---

**Versión:** 1.0  
**Estado:** Completo para implementación  
**Stack:** React + Vite + TypeScript + Styled Components  
**Próxima revisión:** Después de implementación del prototipo

