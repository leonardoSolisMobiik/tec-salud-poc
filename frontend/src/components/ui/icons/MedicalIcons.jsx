import React from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';

// Base icon wrapper with animations
const IconWrapper = styled(motion.div)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${props => props.size || '20px'};
  height: ${props => props.size || '20px'};
  color: ${props => props.color || 'currentColor'};
  
  svg {
    width: 100%;
    height: 100%;
    transition: all 0.2s ease;
  }
  
  &:hover svg {
    transform: scale(1.1);
  }
`;

// Animated icon variants
const iconVariants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  hover: { scale: 1.1, rotate: [0, -10, 10, 0] },
  tap: { scale: 0.95 }
};

const pulseVariants = {
  animate: {
    scale: [1, 1.2, 1],
    opacity: [1, 0.7, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

// Medical Icons
export const StethoscopeIcon = ({ size = "20px", color, animated = false, ...props }) => (
  <IconWrapper 
    size={size} 
    color={color}
    variants={animated ? iconVariants : {}}
    initial="initial"
    animate="animate"
    whileHover="hover"
    whileTap="tap"
    {...props}
  >
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 2a2 2 0 0 0-2 2v6.5a0.5 0.5 0 0 1-1 0V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V4a2 2 0 0 1 2-2h2z"/>
      <path d="M7 8v8a4 4 0 0 0 8 0v-8"/>
      <circle cx="20" cy="16" r="2"/>
      <path d="M15 16h-2"/>
    </svg>
  </IconWrapper>
);

export const HeartIcon = ({ size = "20px", color, animated = false, pulse = false, ...props }) => (
  <IconWrapper 
    size={size} 
    color={color}
    variants={pulse ? pulseVariants : (animated ? iconVariants : {})}
    initial="initial"
    animate="animate"
    whileHover="hover"
    whileTap="tap"
    {...props}
  >
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  </IconWrapper>
);

export const BrainIcon = ({ size = "20px", color, animated = false, ...props }) => (
  <IconWrapper 
    size={size} 
    color={color}
    variants={animated ? iconVariants : {}}
    initial="initial"
    animate="animate"
    whileHover="hover"
    whileTap="tap"
    {...props}
  >
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5a3 3 0 1 0-5.997.142 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588 4 4 0 0 0 7.636 2.106 3.2 3.2 0 0 0 .164-.546c.071-.264.132-.538.132-.82a3 3 0 1 0-5.997-.142 4 4 0 0 0-2.526-5.77 4 4 0 0 0-.556-6.588 4 4 0 0 0-7.636-2.106 3.2 3.2 0 0 0-.164.546c-.071.264-.132.538-.132.82"/>
    </svg>
  </IconWrapper>
);

export const MicroscopeIcon = ({ size = "20px", color, animated = false, ...props }) => (
  <IconWrapper 
    size={size} 
    color={color}
    variants={animated ? iconVariants : {}}
    initial="initial"
    animate="animate"
    whileHover="hover"
    whileTap="tap"
    {...props}
  >
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 18h8"/>
      <path d="M3 22h18"/>
      <path d="M14 22a7 7 0 1 0 0-14h-1"/>
      <path d="M9 14h2"/>
      <path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z"/>
      <path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3"/>
    </svg>
  </IconWrapper>
);

export const DNAIcon = ({ size = "20px", color, animated = false, ...props }) => (
  <IconWrapper 
    size={size} 
    color={color}
    variants={animated ? iconVariants : {}}
    initial="initial"
    animate="animate"
    whileHover="hover"
    whileTap="tap"
    {...props}
  >
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 15c6.667-6 13.333 0 20-6"/>
      <path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993"/>
      <path d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993"/>
      <path d="M17 6.1c.586.464 1.227.928 2 1.3"/>
      <path d="M5 17.9c-.586-.464-1.227-.928-2-1.3"/>
      <path d="M3 9c6.667 6 13.333 0 20 6"/>
    </svg>
  </IconWrapper>
);

export const PillIcon = ({ size = "20px", color, animated = false, ...props }) => (
  <IconWrapper 
    size={size} 
    color={color}
    variants={animated ? iconVariants : {}}
    initial="initial"
    animate="animate"
    whileHover="hover"
    whileTap="tap"
    {...props}
  >
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.5 20.5 21 10a3.5 3.5 0 0 0-5-5l-10.5 10.5"/>
      <path d="M13.5 6.5 17 10"/>
      <path d="M10.5 7.5 14 11"/>
      <path d="M16 16H3a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2z"/>
    </svg>
  </IconWrapper>
);

export const ShieldIcon = ({ size = "20px", color, animated = false, ...props }) => (
  <IconWrapper 
    size={size} 
    color={color}
    variants={animated ? iconVariants : {}}
    initial="initial"
    animate="animate"
    whileHover="hover"
    whileTap="tap"
    {...props}
  >
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="M9 12l2 2 4-4"/>
    </svg>
  </IconWrapper>
);

export const ActivityIcon = ({ size = "20px", color, animated = false, ...props }) => (
  <IconWrapper 
    size={size} 
    color={color}
    variants={animated ? iconVariants : {}}
    initial="initial"
    animate="animate"
    whileHover="hover"
    whileTap="tap"
    {...props}
  >
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
    </svg>
  </IconWrapper>
);

// Premium AI Icons
export const AIThinkingIcon = ({ size = "20px", color, ...props }) => (
  <IconWrapper 
    size={size} 
    color={color}
    variants={pulseVariants}
    animate="animate"
    {...props}
  >
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 8V4H8"/>
      <rect width="16" height="12" x="4" y="8" rx="2"/>
      <path d="M2 14h2"/>
      <path d="M20 14h2"/>
      <path d="M15 13v2"/>
      <path d="M9 13v2"/>
    </svg>
  </IconWrapper>
);

export const SparkleIcon = ({ size = "20px", color, animated = false, ...props }) => (
  <IconWrapper 
    size={size} 
    color={color}
    variants={animated ? iconVariants : {}}
    initial="initial"
    animate="animate"
    whileHover="hover"
    whileTap="tap"
    {...props}
  >
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-3.01L12 0z"/>
    </svg>
  </IconWrapper>
);

// Medical status icons
export const CheckCircleIcon = ({ size = "20px", color, animated = false, ...props }) => (
  <IconWrapper 
    size={size} 
    color={color}
    variants={animated ? iconVariants : {}}
    initial="initial"
    animate="animate"
    whileHover="hover"
    whileTap="tap"
    {...props}
  >
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22,4 12,14.01 9,11.01"/>
    </svg>
  </IconWrapper>
);

export const AlertTriangleIcon = ({ size = "20px", color, animated = false, ...props }) => (
  <IconWrapper 
    size={size} 
    color={color}
    variants={animated ? iconVariants : {}}
    initial="initial"
    animate="animate"
    whileHover="hover"
    whileTap="tap"
    {...props}
  >
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  </IconWrapper>
);

export const InfoIcon = ({ size = "20px", color, animated = false, ...props }) => (
  <IconWrapper 
    size={size} 
    color={color}
    variants={animated ? iconVariants : {}}
    initial="initial"
    animate="animate"
    whileHover="hover"
    whileTap="tap"
    {...props}
  >
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  </IconWrapper>
);