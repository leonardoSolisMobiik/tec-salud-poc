import React, { useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useMedicalStore } from '../../stores/medicalStore.js';
import { useUIStore } from '../../stores/uiStore.js';
import { PatientSearch } from '../medical/PatientSearch.jsx';
import { RecentPatients } from '../medical/RecentPatients.jsx';

// Container principal del dashboard
const DashboardContainer = styled(motion.div)`
  min-height: 100vh;
  padding: ${props => props.theme.spacing.xl} 0;
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xl};
  
  @media (max-width: ${props => props.theme.breakpoints.tablet}) {
    padding: ${props => props.theme.spacing.lg} 0;
    gap: ${props => props.theme.spacing.lg};
  }
  
  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    padding: ${props => props.theme.spacing.md} 0;
    gap: ${props => props.theme.spacing.md};
  }
`;

// Sección de bienvenida
const WelcomeSection = styled.div`
  text-align: center;
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const WelcomeMessage = styled(motion.h1)`
  font-family: ${props => props.theme.typography.fontFamily.display};
  font-size: ${props => props.theme.typography.fontSize['3xl']};
  font-weight: ${props => props.theme.typography.fontWeight.light};
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: ${props => props.theme.spacing.md};
  line-height: ${props => props.theme.typography.lineHeight.tight};
  
  @media (max-width: ${props => props.theme.breakpoints.tablet}) {
    font-size: ${props => props.theme.typography.fontSize['2xl']};
  }
  
  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    font-size: ${props => props.theme.typography.fontSize.xl};
  }
`;

const WelcomeSubtext = styled(motion.p)`
  font-size: ${props => props.theme.typography.fontSize.lg};
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: ${props => props.theme.spacing.xl};
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  
  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    font-size: ${props => props.theme.typography.fontSize.base};
    margin-bottom: ${props => props.theme.spacing.lg};
  }
`;

// Sección de búsqueda prominente
const SearchSection = styled(motion.div)`
  display: flex;
  justify-content: center;
  margin-bottom: ${props => props.theme.spacing.xl};
  
  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    margin-bottom: ${props => props.theme.spacing.lg};
  }
`;

const SearchWrapper = styled.div`
  width: 100%;
  max-width: 500px;
  position: relative;
`;

// Sección de pacientes recientes
const RecentSection = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${props => props.theme.spacing.lg};
`;

const SectionTitle = styled.h2`
  font-family: ${props => props.theme.typography.fontFamily.display};
  font-size: ${props => props.theme.typography.fontSize.xl};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  color: ${props => props.theme.colors.text.primary};
  text-align: center;
  
  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    font-size: ${props => props.theme.typography.fontSize.lg};
  }
`;

// Estadísticas rápidas (opcional)
const StatsSection = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.xl};
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  
  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
    margin-bottom: ${props => props.theme.spacing.lg};
  }
`;

const StatCard = styled.div`
  background: ${props => props.theme.colors.background.primary};
  border-radius: ${props => props.theme.borderRadius.xl};
  padding: ${props => props.theme.spacing.lg};
  text-align: center;
  box-shadow: ${props => props.theme.shadows.sm};
  border: 1px solid ${props => props.theme.colors.gray[200]};
  transition: all ${props => props.theme.transitions.fast};
  
  &:hover {
    box-shadow: ${props => props.theme.shadows.md};
    transform: translateY(-2px);
  }
`;

const StatNumber = styled.div`
  font-size: ${props => props.theme.typography.fontSize['2xl']};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  color: ${props => props.theme.colors.primary.blue};
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const StatLabel = styled.div`
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.text.secondary};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
`;

// Animaciones
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

// Obtener saludo según la hora
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return '¡Buenos días';
  if (hour < 18) return '¡Buenas tardes';
  return '¡Buenas noches';
};

// Estadísticas mock
const mockStats = [
  { number: '127', label: 'Pacientes activos' },
  { number: '23', label: 'Consultas hoy' },
  { number: '8', label: 'Pendientes' },
  { number: '95%', label: 'Satisfacción' },
];

export const Dashboard = ({ doctorName = 'Dr. Solís' }) => {
  const { recentPatients } = useMedicalStore();
  const { showSuccessToast } = useUIStore();

  // Mostrar toast de bienvenida al cargar
  useEffect(() => {
    const timer = setTimeout(() => {
      showSuccessToast('Sistema médico iniciado correctamente', 3000);
    }, 1000);

    return () => clearTimeout(timer);
  }, [showSuccessToast]);

  return (
    <DashboardContainer
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Sección de Bienvenida */}
      <WelcomeSection>
        <WelcomeMessage variants={itemVariants}>
          {getGreeting()}, {doctorName}!
        </WelcomeMessage>
        <WelcomeSubtext variants={itemVariants}>
          Bienvenido al Asistente Virtual para Expedientes Clínicos TecSalud.
          Busca pacientes o selecciona uno de los recientes para comenzar.
        </WelcomeSubtext>
      </WelcomeSection>

      {/* Búsqueda Prominente */}
      <SearchSection variants={itemVariants}>
        <SearchWrapper>
          <PatientSearch 
            placeholder="Buscar paciente por nombre, ID o expediente..."
            size="lg"
          />
        </SearchWrapper>
      </SearchSection>

      {/* Estadísticas Rápidas */}
      <StatsSection variants={itemVariants}>
        {mockStats.map((stat, index) => (
          <StatCard key={index}>
            <StatNumber>{stat.number}</StatNumber>
            <StatLabel>{stat.label}</StatLabel>
          </StatCard>
        ))}
      </StatsSection>

      {/* Pacientes Recientes */}
      <RecentSection variants={itemVariants}>
        <SectionTitle>Pacientes Recientes</SectionTitle>
        <RecentPatients patients={recentPatients} />
      </RecentSection>
    </DashboardContainer>
  );
};

export default Dashboard;

