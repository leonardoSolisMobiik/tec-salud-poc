import React from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../stores/uiStore.js';

// Container para los toasts
const ToastContainer = styled.div`
  position: fixed;
  top: ${props => props.theme.spacing.lg};
  right: ${props => props.theme.spacing.lg};
  z-index: ${props => props.theme.zIndex.toast};
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
  max-width: 400px;
  
  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    top: ${props => props.theme.spacing.md};
    right: ${props => props.theme.spacing.md};
    left: ${props => props.theme.spacing.md};
    max-width: none;
  }
`;

// Toast individual
const ToastWrapper = styled(motion.div)`
  background: ${props => props.theme.colors.background.primary};
  border-radius: ${props => props.theme.borderRadius.xl};
  box-shadow: ${props => props.theme.shadows.lg};
  border-left: 4px solid ${props => {
    switch (props.type) {
      case 'success': return props.theme.colors.medical.success;
      case 'error': return props.theme.colors.medical.error;
      case 'warning': return props.theme.colors.medical.warning;
      default: return props.theme.colors.primary.blue;
    }
  }};
  
  padding: ${props => props.theme.spacing.md};
  display: flex;
  align-items: flex-start;
  gap: ${props => props.theme.spacing.sm};
  min-width: 300px;
  
  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    min-width: auto;
    width: 100%;
  }
`;

const IconWrapper = styled.div`
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => {
    switch (props.type) {
      case 'success': return props.theme.colors.medical.success;
      case 'error': return props.theme.colors.medical.error;
      case 'warning': return props.theme.colors.medical.warning;
      default: return props.theme.colors.primary.blue;
    }
  }};
`;

const Content = styled.div`
  flex: 1;
  min-width: 0;
`;

const Message = styled.div`
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  color: ${props => props.theme.colors.text.primary};
  line-height: ${props => props.theme.typography.lineHeight.normal};
  margin-bottom: 2px;
`;

const Timestamp = styled.div`
  font-size: ${props => props.theme.typography.fontSize.xs};
  color: ${props => props.theme.colors.text.muted};
`;

const CloseButton = styled.button`
  flex-shrink: 0;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: ${props => props.theme.colors.text.muted};
  transition: color ${props => props.theme.transitions.fast};
  
  &:hover {
    color: ${props => props.theme.colors.text.primary};
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const ProgressBar = styled(motion.div)`
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  background: ${props => {
    switch (props.type) {
      case 'success': return props.theme.colors.medical.success;
      case 'error': return props.theme.colors.medical.error;
      case 'warning': return props.theme.colors.medical.warning;
      default: return props.theme.colors.primary.blue;
    }
  }};
  border-radius: 0 0 ${props => props.theme.borderRadius.xl} ${props => props.theme.borderRadius.xl};
`;

// Iconos para cada tipo de toast
const getToastIcon = (type) => {
  switch (type) {
    case 'success':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 12l2 2 4-4"/>
          <circle cx="12" cy="12" r="10"/>
        </svg>
      );
    case 'error':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      );
    case 'warning':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
          <path d="M12 9v4"/>
          <path d="m12 17 .01 0"/>
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="m9 12 2 2 4-4"/>
        </svg>
      );
  }
};

// Formatear timestamp
const formatTimestamp = (timestamp) => {
  return timestamp.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Componente Toast individual
const Toast = ({ toast, onClose }) => {
  const { id, message, type, duration, timestamp } = toast;
  
  return (
    <ToastWrapper
      type={type}
      initial={{ opacity: 0, x: 300, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.9 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      layout
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      <IconWrapper type={type}>
        {getToastIcon(type)}
      </IconWrapper>
      
      <Content>
        <Message>{message}</Message>
        <Timestamp>{formatTimestamp(timestamp)}</Timestamp>
      </Content>
      
      <CloseButton onClick={() => onClose(id)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </CloseButton>
      
      {duration > 0 && (
        <ProgressBar
          type={type}
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: duration / 1000, ease: "linear" }}
        />
      )}
    </ToastWrapper>
  );
};

// Componente principal ToastProvider
export const ToastProvider = () => {
  const { toasts, removeToast } = useUIStore();
  
  return (
    <ToastContainer>
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            toast={toast}
            onClose={removeToast}
          />
        ))}
      </AnimatePresence>
    </ToastContainer>
  );
};

export default ToastProvider;

