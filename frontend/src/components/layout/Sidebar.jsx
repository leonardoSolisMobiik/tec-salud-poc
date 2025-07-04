import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  MessageSquare, 
  FileText, 
  LayoutDashboard,
  Stethoscope,
  User,
  Calendar,
  Phone,
  Mail
} from 'lucide-react';
import { PatientSearch } from '../medical/PatientSearch';
import { RecentPatients } from '../medical/RecentPatients';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useUIStore } from '../../stores/uiStore';
import { useMedicalStore } from '../../stores/medicalStore';

// Styled Components
const SidebarContainer = styled(motion.div)`
  width: ${props => props.collapsed ? '60px' : '320px'};
  height: 100vh;
  background: ${props => props.theme.colors.background.secondary};
  border-right: 1px solid ${props => props.theme.colors.border.light};
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  position: relative;
  overflow: hidden;

  @media (max-width: ${props => props.theme.breakpoints.tablet}) {
    position: fixed;
    top: 0;
    left: ${props => props.sidebarCollapsed ? '-320px' : '0'};
    width: 320px;
    z-index: 1000;
    box-shadow: ${props => props.sidebarCollapsed ? 'none' : '2px 0 10px rgba(0, 0, 0, 0.1)'};
  }
`;

const SidebarHeader = styled.div`
  padding: ${props => props.theme.spacing.lg};
  border-bottom: 1px solid ${props => props.theme.colors.border.light};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  min-height: 80px;
  position: relative;
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  flex: 1;
  min-width: 0;
`;

const LogoIcon = styled.div`
  width: 40px;
  height: 40px;
  background: ${props => props.theme.colors.primary.main};
  border-radius: ${props => props.theme.borderRadius.md};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
`;

const LogoText = styled.div`
  flex: 1;
  opacity: ${props => props.collapsed ? '0' : '1'};
  transform: ${props => props.collapsed ? 'translateX(-10px)' : 'translateX(0)'};
  transition: all 0.3s ease;
  pointer-events: ${props => props.collapsed ? 'none' : 'auto'};
`;

const LogoTitle = styled.h1`
  font-size: ${props => props.theme.typography.fontSize.lg};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  color: ${props => props.theme.colors.text.primary};
  margin: 0;
`;

const LogoSubtitle = styled.p`
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.text.secondary};
  margin: 0;
  opacity: ${props => props.collapsed ? '0' : '1'};
  transition: opacity 0.3s ease;
`;

const ToggleButton = styled(Button)`
  position: absolute;
  top: 50%;
  right: ${props => props.theme.spacing.sm};
  transform: translateY(-50%);
  padding: ${props => props.theme.spacing.xs};
  min-width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${props => props.theme.colors.background.primary};
  border: 1px solid ${props => props.theme.colors.border.light};
  
  &:hover {
    background: ${props => props.theme.colors.primary.light};
    border-color: ${props => props.theme.colors.primary.main};
  }

  @media (max-width: ${props => props.theme.breakpoints.tablet}) {
    display: none;
  }
`;

const NavigationSection = styled.div`
  padding: ${props => props.theme.spacing.md} ${props => props.collapsed ? props.theme.spacing.sm : props.theme.spacing.lg};
  border-bottom: 1px solid ${props => props.theme.colors.border.light};
`;

const NavButton = styled(Button)`
  width: 100%;
  justify-content: ${props => props.collapsed ? 'center' : 'flex-start'};
  padding: ${props => props.collapsed ? props.theme.spacing.sm : `${props.theme.spacing.sm} ${props.theme.spacing.md}`};
  margin-bottom: ${props => props.theme.spacing.xs};
  
  ${props => props.active && `
    background: ${props.theme.colors.primary.light};
    color: ${props.theme.colors.primary.main};
    border-color: ${props.theme.colors.primary.main};
  `}
`;

const NavIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
`;

const NavText = styled.span`
  margin-left: ${props => props.theme.spacing.sm};
  opacity: ${props => props.collapsed ? '0' : '1'};
  transform: ${props => props.collapsed ? 'translateX(-10px)' : 'translateX(0)'};
  transition: all 0.3s ease;
  white-space: nowrap;
  overflow: hidden;
`;

const SearchSection = styled.div`
  margin-bottom: ${props => props.theme.spacing.md};
  opacity: ${props => props.collapsed ? '0' : '1'};
  transform: ${props => props.collapsed ? 'translateX(-20px)' : 'translateX(0)'};
  transition: all 0.3s ease;
  pointer-events: ${props => props.collapsed ? 'none' : 'auto'};
`;

const PatientsSection = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0 ${props => props.collapsed ? '0' : props.theme.spacing.lg} ${props => props.theme.spacing.lg};
  opacity: ${props => props.collapsed ? '0' : '1'};
  transform: ${props => props.collapsed ? 'translateX(-20px)' : 'translateX(0)'};
  transition: all 0.3s ease;
  pointer-events: ${props => props.collapsed ? 'none' : 'auto'};
`;

const SectionTitle = styled.h2`
  font-size: ${props => props.theme.typography.fontSize.md};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  color: ${props => props.theme.colors.text.primary};
  margin: 0 0 ${props => props.theme.spacing.md} 0;
  opacity: ${props => props.collapsed ? '0' : '1'};
  transition: opacity 0.3s ease;
`;

const PatientInfo = styled.div`
  flex: 1;
  min-width: 0;
  opacity: ${props => props.collapsed ? '0' : '1'};
  transition: opacity 0.3s ease;
`;

const SidebarFooter = styled.div`
  padding: ${props => props.theme.spacing.lg};
  border-top: 1px solid ${props => props.theme.colors.border.light};
  background: ${props => props.theme.colors.background.primary};
  opacity: ${props => props.collapsed ? '0' : '1'};
  transition: opacity 0.3s ease;
`;

const FooterText = styled.p`
  font-size: ${props => props.theme.typography.fontSize.xs};
  color: ${props => props.theme.colors.text.muted};
  text-align: center;
  margin: 0;
  opacity: ${props => props.collapsed ? '0' : '1'};
  transition: opacity 0.3s ease;
`;

const SelectedPatientCard = styled.div`
  padding: ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.primary.light};
  border: 1px solid ${props => props.theme.colors.primary.main};
  border-radius: ${props => props.theme.borderRadius.md};
  margin-bottom: ${props => props.theme.spacing.md};
`;

const PatientName = styled.h3`
  font-size: ${props => props.theme.typography.fontSize.md};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  color: ${props => props.theme.colors.primary.dark};
  margin: 0 0 ${props => props.theme.spacing.xs} 0;
`;

const PatientDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.text.secondary};
`;

const PatientDetail = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
`;

const CollapsedPatientIndicator = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${props => props.theme.colors.primary.main};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  font-size: ${props => props.theme.typography.fontSize.sm};
`;

// Navigation items
const navigationItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    view: 'dashboard'
  },
  {
    id: 'chat',
    label: 'Asistente IA',
    icon: MessageSquare,
    view: 'chat'
  },
  {
    id: 'documents',
    label: 'Documentos',
    icon: FileText,
    view: 'documents'
  }
];

export const Sidebar = () => {
  const { 
    sidebarCollapsed,
    sidebarCollapsedDesktop,
    setSidebarCollapsed,
    toggleSidebarDesktop,
    isMobile,
    isTablet,
    activeView,
    setActiveView
  } = useUIStore();
  
  const { selectedPatient } = useMedicalStore();

  // Determine if sidebar should be collapsed
  const isCollapsed = isMobile || isTablet ? false : sidebarCollapsedDesktop;

  const handleToggle = () => {
    if (isMobile || isTablet) {
      setSidebarCollapsed(!sidebarCollapsed);
    } else {
      toggleSidebarDesktop();
    }
  };

  const handleNavigation = (view) => {
    setActiveView(view);
  };

  const getPatientInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <SidebarContainer
      collapsed={isCollapsed}
      sidebarCollapsed={sidebarCollapsed}
      initial={false}
      animate={{
        width: isCollapsed ? '60px' : '320px'
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      <SidebarHeader>
        <LogoContainer>
          <LogoIcon>
            <Stethoscope size={24} />
          </LogoIcon>
          <LogoText collapsed={isCollapsed}>
            <LogoTitle>TecSalud</LogoTitle>
            <LogoSubtitle collapsed={isCollapsed}>
              Asistente Virtual Médico
            </LogoSubtitle>
          </LogoText>
        </LogoContainer>
        
        {!isMobile && !isTablet && (
          <ToggleButton
            variant="outline"
            size="sm"
            onClick={handleToggle}
          >
            {isCollapsed ? (
              <ChevronRight size={16} />
            ) : (
              <ChevronLeft size={16} />
            )}
          </ToggleButton>
        )}
      </SidebarHeader>

      <NavigationSection collapsed={isCollapsed}>
        {navigationItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <NavButton
              key={item.id}
              variant="outline"
              active={activeView === item.view}
              onClick={() => handleNavigation(item.view)}
              collapsed={isCollapsed}
            >
              <NavIcon>
                <IconComponent size={20} />
              </NavIcon>
              <NavText collapsed={isCollapsed}>
                {item.label}
              </NavText>
            </NavButton>
          );
        })}
      </NavigationSection>

      {!isCollapsed && (
        <>
          {selectedPatient && (
            <div style={{ padding: '16px' }}>
              <SelectedPatientCard>
                <PatientName>{selectedPatient.name}</PatientName>
                <PatientDetails>
                  <PatientDetail>
                    <User size={14} />
                    {selectedPatient.age} años, {selectedPatient.gender}
                  </PatientDetail>
                  {selectedPatient.phone && (
                    <PatientDetail>
                      <Phone size={14} />
                      {selectedPatient.phone}
                    </PatientDetail>
                  )}
                  {selectedPatient.email && (
                    <PatientDetail>
                      <Mail size={14} />
                      {selectedPatient.email}
                    </PatientDetail>
                  )}
                  {selectedPatient.last_visit && (
                    <PatientDetail>
                      <Calendar size={14} />
                      Última visita: {new Date(selectedPatient.last_visit).toLocaleDateString()}
                    </PatientDetail>
                  )}
                </PatientDetails>
              </SelectedPatientCard>
            </div>
          )}

          <SearchSection collapsed={isCollapsed}>
            <PatientSearch />
          </SearchSection>

          <PatientsSection collapsed={isCollapsed}>
            <SectionTitle collapsed={isCollapsed}>
              Pacientes Recientes
            </SectionTitle>
            <RecentPatients />
          </PatientsSection>

          <SidebarFooter collapsed={isCollapsed}>
            <FooterText collapsed={isCollapsed}>
              TecSalud v2.0 - Asistente Virtual con IA
            </FooterText>
          </SidebarFooter>
        </>
      )}

      {isCollapsed && selectedPatient && (
        <div style={{ position: 'relative', height: '60px', margin: '8px 0' }}>
          <CollapsedPatientIndicator>
            {getPatientInitials(selectedPatient.name)}
          </CollapsedPatientIndicator>
        </div>
      )}
    </SidebarContainer>
  );
};

