import React, { useEffect } from 'react';
import styled, { ThemeProvider } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { theme } from '../../styles/theme.js';
import { GlobalStyles } from '../../styles/globalStyles.js';
import { useUIStore } from '../../stores/uiStore.js';
import { ToastProvider } from '../ui/Toast.jsx';
import { VoiceAssistant } from '../voice/VoiceAssistant.jsx';

// Layout principal con grid de 3 paneles
const LayoutContainer = styled.div`
  display: grid;
  grid-template-columns: ${props => {
    if (props.sidebarCollapsedDesktop) {
      return props.pdfOpen ? '60px 1fr 400px' : '60px 1fr 0';
    }
    return props.pdfOpen ? '300px 1fr 400px' : '300px 1fr 0';
  }};
  height: 100vh;
  overflow: hidden;
  background: ${props => props.theme.colors.background.secondary};
  
  transition: grid-template-columns ${props => props.theme.transitions.slow};
  
  @media (max-width: ${props => props.theme.breakpoints.tablet}) {
    grid-template-columns: ${props => props.sidebarCollapsed ? '0 1fr' : '280px 1fr'};
  }
  
  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`;

// Panel izquierdo - Pacientes y navegación
const LeftPanel = styled(motion.aside)`
  width: 100%;
  background: ${props => props.theme.colors.background.primary};
  border-right: 1px solid ${props => props.theme.colors.gray[200]};
  overflow-y: auto;
  overflow-x: hidden;
  
  @media (max-width: ${props => props.theme.breakpoints.tablet}) {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    width: 280px;
    z-index: ${props => props.theme.zIndex.dropdown};
    transform: translateX(${props => props.isOpen ? '0' : '-100%'});
    transition: transform ${props => props.theme.transitions.slow};
    box-shadow: ${props => props.isOpen ? props.theme.shadows.lg : 'none'};
  }
  
  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    width: 100%;
    max-width: 320px;
  }
`;

// Panel central - Chat y contenido principal
const MainContent = styled.main`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: ${props => props.theme.colors.background.secondary};
  position: relative;
  
  /* Ancho máximo para el contenido central */
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  padding: 0 ${props => props.theme.spacing.lg};
  
  @media (max-width: ${props => props.theme.breakpoints.tablet}) {
    padding: 0 ${props => props.theme.spacing.md};
  }
  
  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    padding: 0 ${props => props.theme.spacing.sm};
  }
`;

// Panel derecho - Visor de PDFs
const RightPanel = styled(motion.aside)`
  width: 400px;
  background: ${props => props.theme.colors.background.primary};
  border-left: 1px solid ${props => props.theme.colors.gray[200]};
  display: flex;
  flex-direction: column;
  overflow: hidden;
  
  @media (max-width: ${props => props.theme.breakpoints.tablet}) {
    position: fixed;
    right: 0;
    top: 0;
    bottom: 0;
    z-index: ${props => props.theme.zIndex.modal};
    width: 100%;
    max-width: 400px;
    box-shadow: ${props => props.theme.shadows.xl};
  }
  
  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    width: 100%;
    max-width: none;
  }
`;

// Overlay para móvil/tablet
const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${props => props.theme.colors.background.overlay};
  z-index: ${props => props.theme.zIndex.dropdown - 1};
  
  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    display: none;
  }
`;

// Botón para toggle del sidebar en móvil
const MobileMenuButton = styled.button`
  position: fixed;
  top: ${props => props.theme.spacing.md};
  left: ${props => props.theme.spacing.md};
  z-index: ${props => props.theme.zIndex.modal + 1};
  
  width: 44px;
  height: 44px;
  border-radius: ${props => props.theme.borderRadius.xl};
  background: ${props => props.theme.colors.background.primary};
  border: 1px solid ${props => props.theme.colors.gray[200]};
  box-shadow: ${props => props.theme.shadows.md};
  
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  
  color: ${props => props.theme.colors.text.primary};
  transition: all ${props => props.theme.transitions.fast};
  
  &:hover {
    background: ${props => props.theme.colors.gray[50]};
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
  
  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    display: none;
  }
`;

// Componente Layout principal
export const Layout = ({ 
  children, 
  leftPanel, 
  rightPanel,
  showMobileMenu = true 
}) => {
  const {
    sidebarCollapsed,
    sidebarCollapsedDesktop,
    setSidebarCollapsed,
    pdfViewer,
  } = useUIStore();

  const handleOverlayClick = () => {
    setSidebarCollapsed(true);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      
      <LayoutContainer
        sidebarCollapsed={sidebarCollapsed}
        sidebarCollapsedDesktop={sidebarCollapsedDesktop}
        pdfOpen={pdfViewer.isOpen}
      >
        {/* Panel Izquierdo */}
        <AnimatePresence>
          {!sidebarCollapsed && (
            <LeftPanel
              isOpen={!sidebarCollapsed}
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {leftPanel}
            </LeftPanel>
          )}
        </AnimatePresence>

        {/* Contenido Principal */}
        <MainContent>
          {children}
        </MainContent>

        {/* Panel Derecho - PDF Viewer */}
        <AnimatePresence>
          {pdfViewer.isOpen && (
            <RightPanel
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {rightPanel}
            </RightPanel>
          )}
        </AnimatePresence>

        {/* Overlay para móvil */}
        <AnimatePresence>
          {!sidebarCollapsed && (
            <Overlay
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleOverlayClick}
            />
          )}
        </AnimatePresence>

        {/* Botón de menú móvil */}
        {showMobileMenu && sidebarCollapsed && (
          <MobileMenuButton onClick={toggleSidebar}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </MobileMenuButton>
        )}
      </LayoutContainer>

      {/* Sistema de notificaciones */}
      <ToastProvider />
      
      {/* Asistente de voz flotante */}
      <VoiceAssistant />
    </ThemeProvider>
  );
};

export default Layout;

