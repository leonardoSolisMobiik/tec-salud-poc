import React from 'react';
import styled, { css, keyframes } from 'styled-components';
import { motion } from 'framer-motion';

// Ripple effect animation
const ripple = keyframes`
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(4);
    opacity: 0;
  }
`;

// Shine effect animation
const shine = keyframes`
  0% {
    transform: translateX(-100%) translateY(-100%) rotate(30deg);
  }
  100% {
    transform: translateX(100%) translateY(100%) rotate(30deg);
  }
`;

// Base button with premium styling
const StyledButton = styled(motion.button)`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => {
    const sizes = {
      sm: `${props.theme.spacing.xs} ${props.theme.spacing.sm}`,
      md: `${props.theme.spacing.sm} ${props.theme.spacing.md}`,
      lg: `${props.theme.spacing.md} ${props.theme.spacing.lg}`,
      xl: `${props.theme.spacing.lg} ${props.theme.spacing.xl}`
    };
    return sizes[props.$size || 'md'];
  }};
  
  font-family: ${props => props.theme.typography.fontFamily.primary};
  font-size: ${props => {
    const sizes = {
      sm: props.theme.typography.fontSize.xs,
      md: props.theme.typography.fontSize.sm,
      lg: props.theme.typography.fontSize.base,
      xl: props.theme.typography.fontSize.lg
    };
    return sizes[props.$size || 'md'];
  }};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  
  border: none;
  border-radius: ${props => props.theme.borderRadius.lg};
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-decoration: none;
  white-space: nowrap;
  user-select: none;
  
  /* Variant styles */
  ${props => {
    const variants = {
      primary: css`
        background: linear-gradient(135deg, 
          ${props.theme.colors.primary.blue} 0%, 
          ${props.theme.colors.primary.blueDark} 100%
        );
        color: white;
        box-shadow: 0 4px 15px ${props.theme.colors.primary.blue}30;
        
        &:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px ${props.theme.colors.primary.blue}40;
          background: linear-gradient(135deg, 
            ${props.theme.colors.primary.blueDark} 0%, 
            ${props.theme.colors.primary.blue} 100%
          );
        }
      `,
      secondary: css`
        background: ${props.theme.colors.background.primary};
        color: ${props.theme.colors.primary.blue};
        border: 2px solid ${props.theme.colors.primary.blue};
        
        &:hover:not(:disabled) {
          background: ${props.theme.colors.primary.blueLight};
          transform: translateY(-1px);
          box-shadow: 0 4px 12px ${props.theme.colors.primary.blue}20;
        }
      `,
      ghost: css`
        background: transparent;
        color: ${props.theme.colors.text.primary};
        
        &:hover:not(:disabled) {
          background: ${props.theme.colors.gray[100]};
          color: ${props.theme.colors.primary.blue};
        }
      `,
      danger: css`
        background: linear-gradient(135deg, 
          ${props.theme.colors.medical.error} 0%, 
          #c62828 100%
        );
        color: white;
        box-shadow: 0 4px 15px ${props.theme.colors.medical.error}30;
        
        &:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px ${props.theme.colors.medical.error}40;
        }
      `,
      success: css`
        background: linear-gradient(135deg, 
          ${props.theme.colors.medical.success} 0%, 
          #388e3c 100%
        );
        color: white;
        box-shadow: 0 4px 15px ${props.theme.colors.medical.success}30;
        
        &:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px ${props.theme.colors.medical.success}40;
        }
      `,
      glass: css`
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: ${props.theme.colors.text.primary};
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        
        &:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.15);
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
        }
      `
    };
    
    return variants[props.$variant || 'primary'];
  }}
  
  /* Shape variants */
  ${props => props.$shape === 'pill' && css`
    border-radius: ${props.theme.borderRadius.pill};
  `}
  
  ${props => props.$shape === 'square' && css`
    border-radius: ${props.theme.borderRadius.sm};
  `}
  
  /* Full width */
  ${props => props.$fullWidth && css`
    width: 100%;
  `}
  
  /* Disabled state */
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: none !important;
  }
  
  /* Focus state */
  &:focus-visible {
    outline: 2px solid ${props => props.theme.colors.primary.blue};
    outline-offset: 2px;
  }
  
  /* Active state */
  &:active:not(:disabled) {
    transform: scale(0.98);
  }
  
  /* Loading state */
  ${props => props.$isLoading && css`
    color: transparent;
    pointer-events: none;
    
    &::after {
      content: '';
      position: absolute;
      width: 16px;
      height: 16px;
      top: 50%;
      left: 50%;
      margin-left: -8px;
      margin-top: -8px;
      border: 2px solid white;
      border-radius: 50%;
      border-top-color: transparent;
      animation: spin 0.8s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `}
`;

// Ripple effect container
const RippleContainer = styled.span`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  border-radius: inherit;
  pointer-events: none;
`;

// Ripple circle
const Ripple = styled.span`
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  animation: ${ripple} 0.6s ease-out;
  transform: scale(0);
`;

// Shine effect overlay
const ShineOverlay = styled.span`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  border-radius: inherit;
  pointer-events: none;
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(
      45deg,
      transparent 30%,
      rgba(255, 255, 255, 0.3) 50%,
      transparent 70%
    );
    transform: translateX(-100%) translateY(-100%) rotate(30deg);
  }
`;

// Icon wrapper
const IconWrapper = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: ${props => {
      const sizes = {
        sm: '14px',
        md: '16px',
        lg: '20px',
        xl: '24px'
      };
      return sizes[props.$size || 'md'];
    }};
    height: ${props => {
      const sizes = {
        sm: '14px',
        md: '16px',
        lg: '20px',
        xl: '24px'
      };
      return sizes[props.$size || 'md'];
    }};
  }
`;

// Premium button component
export const PremiumButton = React.forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  shape = 'default',
  fullWidth = false,
  isLoading = false,
  showRipple = true,
  showShine = false,
  icon,
  iconPosition = 'left',
  onClick,
  disabled,
  className,
  ...props
}, ref) => {
  const [ripples, setRipples] = React.useState([]);
  
  const handleClick = (e) => {
    if (showRipple && !disabled && !isLoading) {
      const rect = e.currentTarget.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      const newRipple = {
        x,
        y,
        size,
        id: Date.now()
      };
      
      setRipples([...ripples, newRipple]);
      
      setTimeout(() => {
        setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
      }, 600);
    }
    
    if (onClick && !disabled && !isLoading) {
      onClick(e);
    }
  };
  
  return (
    <StyledButton
      ref={ref}
      $variant={variant}
      $size={size}
      $shape={shape}
      $fullWidth={fullWidth}
      $isLoading={isLoading}
      disabled={disabled || isLoading}
      onClick={handleClick}
      className={className}
      whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
      {...props}
    >
      {icon && iconPosition === 'left' && (
        <IconWrapper $size={size}>{icon}</IconWrapper>
      )}
      
      {!isLoading && children}
      
      {icon && iconPosition === 'right' && (
        <IconWrapper $size={size}>{icon}</IconWrapper>
      )}
      
      {showRipple && (
        <RippleContainer>
          {ripples.map(ripple => (
            <Ripple
              key={ripple.id}
              style={{
                left: ripple.x,
                top: ripple.y,
                width: ripple.size,
                height: ripple.size
              }}
            />
          ))}
        </RippleContainer>
      )}
      
      {showShine && !disabled && !isLoading && (
        <ShineOverlay 
          onMouseEnter={(e) => {
            const el = e.currentTarget.querySelector('::before');
            if (el) {
              el.style.animation = `${shine} 0.5s ease-in-out`;
            }
          }}
        />
      )}
    </StyledButton>
  );
});

PremiumButton.displayName = 'PremiumButton';

export default PremiumButton;