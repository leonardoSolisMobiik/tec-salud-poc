import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

// Container del spinner
const SpinnerWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.md};
  
  ${props => props.fullScreen && `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${props.theme.colors.background.overlay};
    z-index: ${props.theme.zIndex.modal};
  `}
  
  ${props => props.centered && `
    min-height: 200px;
  `}
`;

// Spinner circular médico
const CircularSpinner = styled(motion.div)`
  width: ${props => {
    switch (props.size) {
      case 'sm': return '20px';
      case 'lg': return '48px';
      case 'xl': return '64px';
      default: return '32px';
    }
  }};
  height: ${props => {
    switch (props.size) {
      case 'sm': return '20px';
      case 'lg': return '48px';
      case 'xl': return '64px';
      default: return '32px';
    }
  }};
  
  border: ${props => {
    const width = props.size === 'sm' ? '2px' : props.size === 'lg' ? '4px' : '3px';
    return `${width} solid ${props.theme.colors.gray[200]}`;
  }};
  border-top: ${props => {
    const width = props.size === 'sm' ? '2px' : props.size === 'lg' ? '4px' : '3px';
    return `${width} solid ${props.theme.colors.primary.blue}`;
  }};
  border-radius: 50%;
`;

// Spinner de puntos médicos
const DotsSpinner = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.xs};
  align-items: center;
`;

const Dot = styled(motion.div)`
  width: ${props => {
    switch (props.size) {
      case 'sm': return '6px';
      case 'lg': return '12px';
      default: return '8px';
    }
  }};
  height: ${props => {
    switch (props.size) {
      case 'sm': return '6px';
      case 'lg': return '12px';
      default: return '8px';
    }
  }};
  background: ${props => props.theme.colors.primary.blue};
  border-radius: 50%;
`;

// Spinner de pulso médico (como monitor cardíaco)
const PulseSpinner = styled(motion.div)`
  width: ${props => {
    switch (props.size) {
      case 'sm': return '20px';
      case 'lg': return '48px';
      default: return '32px';
    }
  }};
  height: ${props => {
    switch (props.size) {
      case 'sm': return '20px';
      case 'lg': return '48px';
      default: return '32px';
    }
  }};
  background: ${props => props.theme.colors.medical.success};
  border-radius: 50%;
`;

// Texto de carga
const LoadingText = styled.div`
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.text.secondary};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  text-align: center;
  max-width: 200px;
`;

// Animaciones
const spinAnimation = {
  animate: {
    rotate: 360,
  },
  transition: {
    duration: 1,
    repeat: Infinity,
    ease: "linear",
  },
};

const dotsAnimation = {
  animate: {
    y: [0, -8, 0],
  },
  transition: {
    duration: 0.6,
    repeat: Infinity,
    ease: "easeInOut",
  },
};

const pulseAnimation = {
  animate: {
    scale: [1, 1.2, 1],
    opacity: [1, 0.7, 1],
  },
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: "easeInOut",
  },
};

// Componente principal LoadingSpinner
export const LoadingSpinner = ({
  type = 'circular',
  size = 'md',
  text,
  fullScreen = false,
  centered = false,
  className,
}) => {
  const renderSpinner = () => {
    switch (type) {
      case 'dots':
        return (
          <DotsSpinner>
            {[0, 1, 2].map((index) => (
              <Dot
                key={index}
                size={size}
                {...dotsAnimation}
                transition={{
                  ...dotsAnimation.transition,
                  delay: index * 0.2,
                }}
              />
            ))}
          </DotsSpinner>
        );
      
      case 'pulse':
        return (
          <PulseSpinner
            size={size}
            {...pulseAnimation}
          />
        );
      
      case 'circular':
      default:
        return (
          <CircularSpinner
            size={size}
            {...spinAnimation}
          />
        );
    }
  };

  return (
    <SpinnerWrapper
      fullScreen={fullScreen}
      centered={centered}
      className={className}
    >
      {renderSpinner()}
      {text && <LoadingText>{text}</LoadingText>}
    </SpinnerWrapper>
  );
};

// Spinner específico para búsqueda médica
export const SearchSpinner = ({ size = 'sm' }) => (
  <LoadingSpinner
    type="dots"
    size={size}
    text="Buscando en expedientes..."
  />
);

// Spinner específico para procesamiento del copiloto
export const CopilotSpinner = ({ size = 'md' }) => (
  <LoadingSpinner
    type="pulse"
    size={size}
    text="Copiloto analizando..."
  />
);

// Spinner de pantalla completa
export const FullScreenSpinner = ({ text = "Cargando..." }) => (
  <LoadingSpinner
    type="circular"
    size="lg"
    text={text}
    fullScreen={true}
  />
);

export default LoadingSpinner;

