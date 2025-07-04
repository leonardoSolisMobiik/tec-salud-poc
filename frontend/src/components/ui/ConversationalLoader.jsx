import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { HeartIcon, BrainIcon, DNAIcon, AIThinkingIcon } from './icons/MedicalIcons';

// Heartbeat animation
const heartbeat = keyframes`
  0%, 100% { transform: scale(1); }
  14% { transform: scale(1.3); }
  28% { transform: scale(1); }
  42% { transform: scale(1.3); }
  70% { transform: scale(1); }
`;

// DNA helix animation
const dnaHelix = keyframes`
  0% { transform: rotateY(0deg); }
  100% { transform: rotateY(360deg); }
`;

// Brain synapse animation
const synapse = keyframes`
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.1); }
`;

// Thinking dots animation
const thinkingDots = keyframes`
  0%, 80%, 100% { opacity: 0; transform: scale(0.8); }
  40% { opacity: 1; transform: scale(1); }
`;

// Container
const LoaderContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.lg};
  background: ${props => props.theme.colors.background.primary};
  border-radius: ${props => props.theme.borderRadius.xl};
  border: 1px solid ${props => props.theme.colors.gray[200]};
  box-shadow: ${props => props.theme.shadows.md};
  max-width: 400px;
  margin: 0 auto;
`;

// Animation container
const AnimationContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  position: relative;
`;

// Heartbeat loader
const HeartbeatLoader = styled.div`
  animation: ${heartbeat} 1.5s ease-in-out infinite;
  color: ${props => props.theme.colors.medical.success};
  
  svg {
    filter: drop-shadow(0 0 8px ${props => props.theme.colors.medical.success}40);
  }
`;

// DNA helix loader
const DNALoader = styled.div`
  animation: ${dnaHelix} 3s linear infinite;
  color: ${props => props.theme.colors.primary.blue};
  
  svg {
    filter: drop-shadow(0 0 8px ${props => props.theme.colors.primary.blue}40);
  }
`;

// Brain synapse loader
const BrainLoader = styled.div`
  animation: ${synapse} 2s ease-in-out infinite;
  color: ${props => props.theme.colors.primary.blueDark};
  
  svg {
    filter: drop-shadow(0 0 8px ${props => props.theme.colors.primary.blueDark}40);
  }
`;

// Thinking dots
const ThinkingDots = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.xs};
  
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${props => props.theme.colors.primary.blue};
    animation: ${thinkingDots} 1.4s ease-in-out infinite both;
    
    &:nth-child(1) { animation-delay: -0.32s; }
    &:nth-child(2) { animation-delay: -0.16s; }
    &:nth-child(3) { animation-delay: 0s; }
  }
`;

// Message text
const MessageText = styled(motion.div)`
  text-align: center;
  color: ${props => props.theme.colors.text.secondary};
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  line-height: 1.4;
  min-height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
`;

// Particles container
const ParticlesContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
  border-radius: ${props => props.theme.borderRadius.xl};
`;

// Floating particle
const Particle = styled(motion.div)`
  position: absolute;
  width: 4px;
  height: 4px;
  background: ${props => props.color || props.theme.colors.primary.blue};
  border-radius: 50%;
  opacity: 0.6;
`;

// Predefined messages for different contexts
const MEDICAL_MESSAGES = {
  diagnostic: [
    "Analizando síntomas y antecedentes...",
    "Consultando base de conocimiento médico...",
    "Evaluando diagnósticos diferenciales...",
    "Preparando recomendaciones clínicas..."
  ],
  document: [
    "Procesando documentos médicos...",
    "Extrayendo información relevante...",
    "Correlacionando datos clínicos...",
    "Organizando resultados..."
  ],
  search: [
    "Buscando en historial médico...",
    "Indexando registros del paciente...",
    "Filtrando información relevante...",
    "Preparando resultados de búsqueda..."
  ],
  general: [
    "Procesando tu consulta...",
    "Accediendo a base de conocimiento...",
    "Generando respuesta personalizada...",
    "Casi listo para responder..."
  ]
};

const LOADER_TYPES = {
  heartbeat: { component: HeartbeatLoader, icon: HeartIcon, duration: 1500 },
  dna: { component: DNALoader, icon: DNAIcon, duration: 3000 },
  brain: { component: BrainLoader, icon: BrainIcon, duration: 2000 },
  thinking: { component: 'div', icon: AIThinkingIcon, duration: 1400 }
};

// Floating particles animation
const generateParticles = (count = 8) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 3 + Math.random() * 2,
    color: i % 2 === 0 ? '#2196F3' : '#4CAF50'
  }));
};

export const ConversationalLoader = ({ 
  type = 'general', 
  loaderType = 'heartbeat',
  showParticles = true,
  customMessages = null,
  duration = null 
}) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [particles] = useState(() => generateParticles());
  
  const messages = customMessages || MEDICAL_MESSAGES[type] || MEDICAL_MESSAGES.general;
  const LoaderConfig = LOADER_TYPES[loaderType] || LOADER_TYPES.heartbeat;
  const LoaderComponent = LoaderConfig.component;
  const IconComponent = LoaderConfig.icon;
  
  useEffect(() => {
    if (messages.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }, duration || 2500);
    
    return () => clearInterval(interval);
  }, [messages.length, duration]);

  return (
    <LoaderContainer
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
    >
      {showParticles && (
        <ParticlesContainer>
          {particles.map((particle) => (
            <Particle
              key={particle.id}
              color={particle.color}
              initial={{ 
                x: `${particle.x}%`, 
                y: `${particle.y}%`,
                opacity: 0,
                scale: 0
              }}
              animate={{
                y: [particle.y + '%', (particle.y - 20) + '%', particle.y + '%'],
                opacity: [0, 0.6, 0],
                scale: [0, 1, 0]
              }}
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          ))}
        </ParticlesContainer>
      )}
      
      <AnimationContainer>
        {loaderType === 'thinking' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <IconComponent size="32px" />
            <ThinkingDots>
              <div className="dot" />
              <div className="dot" />
              <div className="dot" />
            </ThinkingDots>
          </div>
        ) : (
          <LoaderComponent>
            <IconComponent size="48px" />
          </LoaderComponent>
        )}
      </AnimationContainer>
      
      <MessageText
        key={currentMessageIndex}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        {messages[currentMessageIndex]}
      </MessageText>
    </LoaderContainer>
  );
};

// Simplified loader for inline use
export const InlineLoader = ({ size = 'sm', type = 'heartbeat' }) => {
  const sizes = {
    sm: '16px',
    md: '24px',
    lg: '32px'
  };
  
  const LoaderConfig = LOADER_TYPES[type] || LOADER_TYPES.heartbeat;
  const LoaderComponent = LoaderConfig.component;
  const IconComponent = LoaderConfig.icon;
  
  return (
    <LoaderComponent style={{ display: 'inline-flex' }}>
      <IconComponent size={sizes[size]} />
    </LoaderComponent>
  );
};

export default ConversationalLoader;