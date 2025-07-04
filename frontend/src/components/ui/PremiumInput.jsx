import React, { useState, useRef } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

// Glow pulse animation
const glowPulse = keyframes`
  0%, 100% {
    box-shadow: 0 0 0 0 ${props => props.theme.colors.primary.blue}40;
  }
  50% {
    box-shadow: 0 0 0 4px ${props => props.theme.colors.primary.blue}20;
  }
`;

// Input container with premium styling
const InputContainer = styled(motion.div)`
  position: relative;
  width: ${props => props.fullWidth ? '100%' : 'auto'};
`;

// Styled input with medical theme
const StyledInput = styled.input`
  width: 100%;
  position: relative;
  z-index: 1;
  padding: ${props => {
    const sizes = {
      sm: `${props.theme.spacing.xs} ${props.theme.spacing.sm}`,
      md: `${props.theme.spacing.sm} ${props.theme.spacing.md}`,
      lg: `${props.theme.spacing.md} ${props.theme.spacing.lg}`
    };
    return sizes[props.$size || 'md'];
  }};
  
  padding-left: ${props => props.$hasIcon ? '42px' : props.theme.spacing.md};
  padding-right: ${props => props.$hasAction ? '100px' : props.theme.spacing.md};
  
  font-family: ${props => props.theme.typography.fontFamily.primary};
  font-size: ${props => {
    const sizes = {
      sm: props.theme.typography.fontSize.sm,
      md: props.theme.typography.fontSize.base,
      lg: props.theme.typography.fontSize.lg
    };
    return sizes[props.$size || 'md'];
  }};
  
  background: ${props => props.theme.colors.background.primary};
  border: 2px solid ${props => props.theme.colors.gray[300]};
  border-radius: ${props => props.theme.borderRadius.lg};
  color: ${props => props.theme.colors.text.primary};
  
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
  
  /* Focus state with medical blue glow */
  &:focus {
    border-color: ${props => props.theme.colors.primary.blue};
    background: ${props => props.theme.colors.background.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.primary.blue}20;
    
    ${props => props.$animated && css`
      animation: ${glowPulse} 2s ease-in-out infinite;
    `}
  }
  
  /* Hover state */
  &:hover:not(:disabled):not(:focus) {
    border-color: ${props => props.theme.colors.gray[400]};
    background: ${props => props.theme.colors.gray[50]};
  }
  
  /* Disabled state */
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: ${props => props.theme.colors.gray[100]};
  }
  
  /* Error state */
  ${props => props.$error && css`
    border-color: ${props => props.theme.colors.medical.error};
    
    &:focus {
      border-color: ${props => props.theme.colors.medical.error};
      box-shadow: 0 0 0 3px ${props => props.theme.colors.medical.error}20;
    }
  `}
  
  /* Success state */
  ${props => props.$success && css`
    border-color: ${props => props.theme.colors.medical.success};
    
    &:focus {
      border-color: ${props => props.theme.colors.medical.success};
      box-shadow: 0 0 0 3px ${props => props.theme.colors.medical.success}20;
    }
  `}
  
  /* Loading state */
  ${props => props.$isLoading && css`
    padding-right: 40px;
  `}
  
  &::placeholder {
    color: ${props => props.theme.colors.text.disabled};
    font-weight: ${props => props.theme.typography.fontWeight.regular};
  }
`;

// Icon wrapper
const IconWrapper = styled.div`
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: ${props => props.theme.colors.text.disabled};
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 2;
  width: 16px;
  height: 16px;
  
  svg {
    width: 100%;
    height: 100%;
    display: block;
  }
`;

// Action button wrapper
const ActionWrapper = styled.div`
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
`;

// Loading spinner
const LoadingSpinner = styled(motion.div)`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  
  &::after {
    content: '';
    display: block;
    width: 16px;
    height: 16px;
    border: 2px solid ${props => props.theme.colors.gray[300]};
    border-radius: 50%;
    border-top-color: ${props => props.theme.colors.primary.blue};
    animation: spin 0.8s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

// Floating label
const FloatingLabel = styled(motion.label)`
  position: absolute;
  left: ${props => props.$hasIcon ? '40px' : '16px'};
  top: 50%;
  transform: translateY(-50%);
  color: ${props => props.theme.colors.text.secondary};
  font-size: ${props => props.theme.typography.fontSize.base};
  font-weight: ${props => props.theme.typography.fontWeight.regular};
  pointer-events: none;
  transition: all 0.2s ease;
  background: ${props => props.theme.colors.background.primary};
  padding: 0 ${props => props.theme.spacing.xs};
  
  ${props => (props.$isFocused || props.$hasValue) && css`
    top: 0;
    font-size: ${props => props.theme.typography.fontSize.xs};
    color: ${props => props.$isFocused ? props.theme.colors.primary.blue : props.theme.colors.text.secondary};
  `}
`;

// Character counter
const CharCounter = styled.div`
  position: absolute;
  right: 12px;
  bottom: -20px;
  font-size: ${props => props.theme.typography.fontSize.xs};
  color: ${props => props.theme.colors.text.secondary};
  
  ${props => props.$error && css`
    color: ${props => props.theme.colors.medical.error};
  `}
`;

// Helper text
const HelperText = styled(motion.div)`
  margin-top: ${props => props.theme.spacing.xs};
  font-size: ${props => props.theme.typography.fontSize.xs};
  color: ${props => props.$error 
    ? props.theme.colors.medical.error 
    : props.$success 
      ? props.theme.colors.medical.success 
      : props.theme.colors.text.secondary
  };
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
`;

// Premium input component
export const PremiumInput = React.forwardRef(({
  label,
  placeholder,
  value,
  onChange,
  onFocus,
  onBlur,
  onKeyPress,
  type = 'text',
  size = 'md',
  fullWidth = true,
  icon,
  actionButton,
  error = false,
  success = false,
  helperText,
  maxLength,
  showCharCount = false,
  animated = true,
  isLoading = false,
  disabled = false,
  className,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [localValue, setLocalValue] = useState(value || '');
  const inputRef = ref || useRef(null);
  
  const handleFocus = (e) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };
  
  const handleBlur = (e) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };
  
  const handleChange = (e) => {
    const newValue = e.target.value;
    if (maxLength && newValue.length > maxLength) return;
    
    setLocalValue(newValue);
    if (onChange) onChange(e);
  };
  
  const hasValue = value !== undefined ? value : localValue;
  
  return (
    <div style={{ width: fullWidth ? '100%' : 'auto' }}>
      <InputContainer
        fullWidth={fullWidth}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={className}
      >
        {icon && <IconWrapper>{icon}</IconWrapper>}
      
      <StyledInput
          ref={inputRef}
          type={type}
          value={value !== undefined ? value : localValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyPress={onKeyPress}
          placeholder={!label ? placeholder : ''}
          $size={size}
          $hasIcon={!!icon}
          $hasAction={!!actionButton}
          $error={error}
          $success={success}
          $animated={animated}
          $isLoading={isLoading}
          disabled={disabled || isLoading}
          {...props}
        />
        
        {label && (
          <FloatingLabel
            $isFocused={isFocused}
            $hasValue={!!hasValue}
            $hasIcon={!!icon}
          >
            {label}
          </FloatingLabel>
        )}
        
        {isLoading && (
          <LoadingSpinner
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          />
        )}
        
        {actionButton && !isLoading && (
          <ActionWrapper>
            {actionButton}
          </ActionWrapper>
        )}
        
        {showCharCount && maxLength && (
          <CharCounter $error={hasValue?.length > maxLength * 0.9}>
            {hasValue?.length || 0} / {maxLength}
          </CharCounter>
        )}
      </InputContainer>
      
      {helperText && (
        <HelperText
          $error={error}
          $success={success}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          style={{ marginTop: '4px' }}
        >
          {helperText}
        </HelperText>
      )}
    </div>
  );
});

PremiumInput.displayName = 'PremiumInput';

export default PremiumInput;