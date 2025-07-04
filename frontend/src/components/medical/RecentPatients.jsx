import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useMedicalStore } from '../../stores/medicalStore.js';
import { useUIStore } from '../../stores/uiStore.js';
import { getPatientInitials, formatLastVisit } from '../../data/mockPatients.js';

// Container de pacientes recientes
const RecentContainer = styled.div`
  width: 100%;
  max-width: 800px;
  padding: 0 ${props => props.theme.spacing.xs}; // Padding horizontal pequeño
  padding-bottom: ${props => props.theme.spacing.sm}; // Espacio extra para evitar cortes
`;

// Lista de pacientes (adaptable para sidebar y vista principal)
const PatientsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
  width: 100%;
  
  /* Para vista principal (más ancho) usar grid */
  ${props => props.$isWideView && `
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: ${props.theme.spacing.md};
    
    @media (max-width: ${props.theme.breakpoints.mobile}) {
      grid-template-columns: 1fr;
      gap: ${props.theme.spacing.sm};
    }
  `}
`;

// Card de paciente with premium styling
const PatientCard = styled(motion.div)`
  background: ${props => props.theme.colors.background.primary};
  border-radius: ${props => props.theme.borderRadius.xl};
  padding: ${props => props.$compact ? props.theme.spacing.md : props.theme.spacing.lg};
  border: 2px solid ${props => props.theme.colors.gray[200]};
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 100%;
  box-sizing: border-box;
  
  display: flex;
  align-items: center;
  gap: ${props => props.$compact ? props.theme.spacing.sm : props.theme.spacing.md};
  
  transition: all ${props => props.theme.transitions.medium};
  
  /* Modo compacto para sidebar */
  ${props => props.$compact && `
    min-height: auto;
    flex-direction: row;
    align-items: center;
  `}
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      135deg,
      ${props => props.theme.colors.primary.blue}05 0%,
      transparent 50%,
      ${props => props.theme.colors.primary.blue}05 100%
    );
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover {
    box-shadow: ${props => props.theme.shadows.medical};
    transform: ${props => props.$compact ? 'translateY(-2px)' : 'translateY(-4px) scale(1.01)'};
    border-color: ${props => props.theme.colors.primary.blue}60;
    
    &::before {
      opacity: 1;
    }
  }
  
  &:active {
    transform: translateY(-1px);
  }
`;

// Avatar del paciente with pulse animation
const PatientAvatar = styled(motion.div)`
  width: ${props => props.$compact ? '40px' : '56px'};
  height: ${props => props.$compact ? '40px' : '56px'};
  border-radius: 50%;
  background: linear-gradient(135deg, ${props => props.theme.colors.primary.blue} 0%, ${props => props.theme.colors.primary.blueDark} 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  font-size: ${props => props.$compact ? props.theme.typography.fontSize.sm : props.theme.typography.fontSize.lg};
  flex-shrink: 0;
  box-shadow: ${props => props.theme.shadows.sm};
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    top: -4px;
    left: -4px;
    right: -4px;
    bottom: -4px;
    border-radius: 50%;
    background: linear-gradient(135deg, ${props => props.theme.colors.primary.blue}40 0%, ${props => props.theme.colors.primary.blueDark}40 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
`;

// Información del paciente
const PatientInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const PatientName = styled.h3`
  font-size: ${props => props.$compact ? props.theme.typography.fontSize.sm : props.theme.typography.fontSize.base};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: ${props => props.$compact ? '2px' : props.theme.spacing.xs};
  line-height: ${props => props.theme.typography.lineHeight.tight};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const PatientDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const PatientDetail = styled.span`
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.text.secondary};
  
  &.age {
    font-weight: ${props => props.theme.typography.fontWeight.medium};
  }
  
  &.last-visit {
    color: ${props => props.theme.colors.text.muted};
  }
`;

// Badge de estado with hover effect
const StatusBadge = styled(motion.span)`
  display: inline-flex;
  align-items: center;
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.pill};
  font-size: ${props => props.theme.typography.fontSize.xs};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  transition: all 0.2s ease;
  
  background: ${props => {
    switch (props.status) {
      case 'Activo':
        return `${props.theme.colors.medical.success}15`;
      case 'Seguimiento':
        return `${props.theme.colors.primary.blue}15`;
      case 'Control':
        return `${props.theme.colors.medical.warning}15`;
      case 'Embarazo':
        return `${props.theme.colors.medical.info}15`;
      case 'Post-operatorio':
        return `${props.theme.colors.medical.error}15`;
      default:
        return props.theme.colors.gray[100];
    }
  }};
  
  color: ${props => {
    switch (props.status) {
      case 'Activo':
        return props.theme.colors.medical.success;
      case 'Seguimiento':
        return props.theme.colors.primary.blue;
      case 'Control':
        return '#e65100';
      case 'Embarazo':
        return props.theme.colors.medical.info;
      case 'Post-operatorio':
        return props.theme.colors.medical.error;
      default:
        return props.theme.colors.text.secondary;
    }
  }};
`;

// Estado vacío
const EmptyState = styled.div`
  text-align: center;
  padding: ${props => props.theme.spacing.xl};
  color: ${props => props.theme.colors.text.muted};
`;

const EmptyIcon = styled.div`
  width: 64px;
  height: 64px;
  margin: 0 auto ${props => props.theme.spacing.md};
  border-radius: 50%;
  background: ${props => props.theme.colors.gray[100]};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.colors.text.muted};
  
  svg {
    width: 32px;
    height: 32px;
  }
`;

// Premium animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  hover: {
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: "easeInOut"
    }
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1
    }
  }
};

export const RecentPatients = ({ patients = [], compact = false, isWideView = false }) => {
  const { setActivePatient } = useMedicalStore();
  const { showToast } = useUIStore();

  const handlePatientSelect = (patient) => {
    setActivePatient(patient);
    showToast(
      `Contexto activo: ${patient.name} (${patient.age} años)`,
      'success'
    );
  };

  if (!patients || patients.length === 0) {
    return (
      <RecentContainer>
        <EmptyState>
          <EmptyIcon>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </EmptyIcon>
          <p>No hay pacientes recientes</p>
        </EmptyState>
      </RecentContainer>
    );
  }

  return (
    <RecentContainer>
      <PatientsList
        as={motion.div}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        $isWideView={isWideView}
      >
        {patients.map((patient) => (
          <PatientCard
            key={patient.id}
            variants={cardVariants}
            onClick={() => handlePatientSelect(patient)}
            whileHover="hover"
            whileTap="tap"
            $compact={compact}
          >
            <PatientAvatar
              $compact={compact}
              whileHover={{ 
                scale: compact ? 1.05 : 1.1,
                rotate: compact ? [0, -3, 3, 0] : [0, -5, 5, 0],
                transition: { duration: 0.3 }
              }}
            >
              {getPatientInitials(patient.name)}
            </PatientAvatar>
            
            <PatientInfo>
              <PatientName $compact={compact}>{patient.name}</PatientName>
              <PatientDetails>
                <PatientDetail className="age">
                  {patient.age} años{!compact && ` • ${patient.specialty}`}
                </PatientDetail>
                {!compact && (
                  <PatientDetail className="last-visit">
                    Última visita: {formatLastVisit(patient.lastVisit)}
                  </PatientDetail>
                )}
                {!compact && (
                  <motion.div 
                    style={{ marginTop: '8px' }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <StatusBadge 
                      status={patient.status}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {patient.status}
                    </StatusBadge>
                  </motion.div>
                )}
              </PatientDetails>
            </PatientInfo>
          </PatientCard>
        ))}
      </PatientsList>
    </RecentContainer>
  );
};

export default RecentPatients;

