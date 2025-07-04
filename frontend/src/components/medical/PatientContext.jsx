import React from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useMedicalStore } from '../../stores/medicalStore.js';
import { useUIStore } from '../../stores/uiStore.js';
import { getPatientInitials } from '../../data/mockPatients.js';
import { PremiumButton } from '../ui/PremiumButton.jsx';

// Container del contexto del paciente
const ContextContainer = styled(motion.div)`
  background: ${props => props.theme.colors.patient.active};
  border: 1px solid ${props => props.theme.colors.patient.activeBorder};
  border-radius: ${props => props.theme.borderRadius.xl};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.lg};
  
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  
  box-shadow: ${props => props.theme.shadows.sm};
  
  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
    margin-bottom: ${props => props.theme.spacing.md};
    gap: ${props => props.theme.spacing.sm};
  }
`;

// Avatar del paciente activo
const ActiveAvatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${props => props.theme.colors.primary.blue} 0%, ${props => props.theme.colors.primary.blueDark} 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  font-size: ${props => props.theme.typography.fontSize.base};
  flex-shrink: 0;
  box-shadow: ${props => props.theme.shadows.sm};
  
  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    width: 40px;
    height: 40px;
    font-size: ${props => props.theme.typography.fontSize.sm};
  }
`;

// Información del paciente activo
const PatientInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const PatientName = styled.h2`
  font-size: ${props => props.theme.typography.fontSize.lg};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: 2px;
  line-height: ${props => props.theme.typography.lineHeight.tight};
  
  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    font-size: ${props => props.theme.typography.fontSize.base};
  }
`;

const PatientDetails = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.text.secondary};
  
  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    flex-direction: column;
    align-items: flex-start;
    gap: ${props => props.theme.spacing.xs};
  }
`;

const PatientDetail = styled.span`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  
  &.expediente {
    font-family: ${props => props.theme.typography.fontFamily.mono};
    background: ${props => props.theme.colors.background.primary};
    padding: 2px ${props => props.theme.spacing.xs};
    border-radius: ${props => props.theme.borderRadius.sm};
    font-size: ${props => props.theme.typography.fontSize.xs};
  }
`;

// Indicador de estado activo
const ActiveIndicator = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.theme.colors.medical.success};
  flex-shrink: 0;
  
  /* Animación de pulso */
  animation: pulse 2s infinite;
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.7;
      transform: scale(1.2);
    }
  }
`;

// Botones de acción
const ActionsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  flex-shrink: 0;
  
  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    flex-direction: column;
    gap: ${props => props.theme.spacing.xs};
  }
`;

// Indicador de comando de voz activo
const VoiceIndicator = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  background: ${props => props.theme.colors.patient.voiceActive};
  border-radius: ${props => props.theme.borderRadius.pill};
  font-size: ${props => props.theme.typography.fontSize.xs};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  color: white;
`;

const VoicePulse = styled.div`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: white;
  animation: voicePulse 1s ease-in-out infinite;
  
  @keyframes voicePulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.5;
      transform: scale(1.5);
    }
  }
`;

// Iconos
// Icons with micro-animations
const CloseIcon = () => (
  <motion.svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
    whileHover={{ rotate: 90 }}
    transition={{ duration: 0.2 }}
  >
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </motion.svg>
);

const MicIcon = () => (
  <motion.svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.95 }}
  >
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </motion.svg>
);

export const PatientContext = () => {
  const { activePatient, clearActivePatient, isVoiceListening } = useMedicalStore();
  const { showInfoToast } = useUIStore();

  const handleClearPatient = () => {
    clearActivePatient();
    showInfoToast('Contexto de paciente limpiado', 3000);
  };

  const handleVoiceCommand = () => {
    showInfoToast('Comando de voz: "Copiloto, cambia al paciente [nombre]"', 5000);
  };

  if (!activePatient) {
    return null;
  }

  return (
    <AnimatePresence>
      <ContextContainer
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={isVoiceListening ? 'voice-active' : ''}
      >
        <ActiveIndicator />
        
        <ActiveAvatar>
          {getPatientInitials(activePatient.name)}
        </ActiveAvatar>
        
        <PatientInfo>
          <PatientName>{activePatient.name}</PatientName>
          <PatientDetails>
            <PatientDetail>
              {activePatient.age} años
            </PatientDetail>
            <PatientDetail>
              {activePatient.specialty}
            </PatientDetail>
            <PatientDetail className="expediente">
              {activePatient.expediente}
            </PatientDetail>
          </PatientDetails>
        </PatientInfo>
        
        <ActionsContainer>
          {isVoiceListening && (
            <VoiceIndicator
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <VoicePulse />
              Escuchando...
            </VoiceIndicator>
          )}
          
          <PremiumButton
            variant="glass"
            size="sm"
            onClick={handleVoiceCommand}
            title="Comando de voz para cambiar paciente"
            icon={<MicIcon />}
            showRipple={true}
          >
            Voz
          </PremiumButton>
          
          <PremiumButton
            variant="glass"
            size="sm"
            onClick={handleClearPatient}
            title="Limpiar contexto del paciente"
            icon={<CloseIcon />}
            showRipple={true}
          >
            Limpiar
          </PremiumButton>
        </ActionsContainer>
      </ContextContainer>
    </AnimatePresence>
  );
};

export default PatientContext;

