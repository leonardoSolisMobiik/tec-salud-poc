import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion } from 'framer-motion';
import { useMedicalStore } from '../../stores/medicalStore.js';
import { useUIStore } from '../../stores/uiStore.js';
import { Button } from '../ui/button.jsx';

// Animaciones de voz
const voicePulse = keyframes`
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.7;
  }
`;

const voiceWave = keyframes`
  0%, 100% {
    height: 4px;
  }
  50% {
    height: 20px;
  }
`;

// Container del componente de voz
const VoiceContainer = styled(motion.div)`
  position: fixed;
  bottom: ${props => props.theme.spacing.xl};
  right: ${props => props.theme.spacing.xl};
  z-index: 1000;
  
  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    bottom: ${props => props.theme.spacing.lg};
    right: ${props => props.theme.spacing.lg};
  }
`;

// Botón de voz flotante
const VoiceButton = styled(Button)`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  box-shadow: ${props => props.theme.shadows.lg};
  
  ${props => props.isListening && `
    animation: ${voicePulse} 1.5s ease-in-out infinite;
    background: ${props.theme.colors.medical.error};
    border-color: ${props.theme.colors.medical.error};
  `}
  
  &:hover {
    transform: scale(1.1);
  }
  
  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    width: 56px;
    height: 56px;
  }
`;

// Indicador visual de ondas de voz
const VoiceWaves = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  gap: 2px;
  
  .wave {
    width: 3px;
    background: white;
    border-radius: 2px;
    animation: ${voiceWave} 0.8s ease-in-out infinite;
    
    &:nth-child(1) { animation-delay: 0s; }
    &:nth-child(2) { animation-delay: 0.1s; }
    &:nth-child(3) { animation-delay: 0.2s; }
    &:nth-child(4) { animation-delay: 0.3s; }
    &:nth-child(5) { animation-delay: 0.4s; }
  }
`;

// Tooltip de instrucciones
const VoiceTooltip = styled(motion.div)`
  position: absolute;
  bottom: 100%;
  right: 0;
  margin-bottom: ${props => props.theme.spacing.md};
  
  background: ${props => props.theme.colors.text.primary};
  color: white;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.lg};
  font-size: ${props => props.theme.typography.fontSize.sm};
  white-space: nowrap;
  
  box-shadow: ${props => props.theme.shadows.md};
  
  &::after {
    content: '';
    position: absolute;
    top: 100%;
    right: ${props => props.theme.spacing.lg};
    border: 6px solid transparent;
    border-top-color: ${props => props.theme.colors.text.primary};
  }
  
  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    right: 50%;
    transform: translateX(50%);
    
    &::after {
      right: 50%;
      transform: translateX(50%);
    }
  }
`;

// Iconos
const MicIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
);

const MicOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="1" y1="1" x2="23" y2="23"/>
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12l1.27-1.27A3 3 0 0 0 15 12V4a3 3 0 0 0-3-3 3 3 0 0 0-3 3v5"/>
    <path d="M17 16.95A7 7 0 0 1 5 12v-2"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
);

export const VoiceAssistant = () => {
  const { isVoiceListening, setVoiceListening } = useMedicalStore();
  const { showInfoToast, showSuccessToast, showErrorToast } = useUIStore();
  const [showTooltip, setShowTooltip] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  // Verificar soporte de Web Speech API
  useEffect(() => {
    const supported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    setIsSupported(supported);
    
    if (!supported) {
      console.warn('Web Speech API no soportada en este navegador');
    }
  }, []);

  // Mostrar tooltip al inicio
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 3000);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleVoiceToggle = () => {
    if (!isSupported) {
      showErrorToast('Comando de voz no soportado en este navegador', 4000);
      return;
    }

    if (isVoiceListening) {
      // Detener escucha
      setVoiceListening(false);
      showInfoToast('Comando de voz desactivado', 2000);
    } else {
      // Iniciar escucha
      setVoiceListening(true);
      showSuccessToast('Escuchando... Di "Copiloto" seguido de tu comando', 4000);
      
      // Simular detección automática después de 5 segundos
      setTimeout(() => {
        if (isVoiceListening) {
          setVoiceListening(false);
          showInfoToast('Tiempo de escucha agotado', 2000);
        }
      }, 5000);
    }
  };

  const handleMouseEnter = () => {
    if (!isVoiceListening) {
      setShowTooltip(true);
    }
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  return (
    <VoiceContainer
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, duration: 0.5, ease: "backOut" }}
    >
      {/* Tooltip */}
      {showTooltip && (
        <VoiceTooltip
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
        >
          {isVoiceListening ? 'Escuchando comando...' : 'Comando de voz'}
        </VoiceTooltip>
      )}
      
      {/* Botón de voz */}
      <VoiceButton
        variant={isVoiceListening ? "danger" : "primary"}
        isListening={isVoiceListening}
        onClick={handleVoiceToggle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        title={isVoiceListening ? 'Detener comando de voz' : 'Activar comando de voz'}
      >
        {isVoiceListening ? (
          <VoiceWaves>
            <div className="wave" />
            <div className="wave" />
            <div className="wave" />
            <div className="wave" />
            <div className="wave" />
          </VoiceWaves>
        ) : (
          <MicIcon />
        )}
      </VoiceButton>
    </VoiceContainer>
  );
};

export default VoiceAssistant;

