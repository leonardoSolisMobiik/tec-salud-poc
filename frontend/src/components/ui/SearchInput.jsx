import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const SearchContainer = styled.div`
  position: relative;
  width: 100%;
`;

const SearchInputField = styled.input`
  width: 100%;
  height: 38px;
  padding: 0 16px;
  background: ${props => props.theme.colors.background.primary};
  border: 1px solid ${props => props.theme.colors.gray[300]};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.text.primary};
  outline: none;
  transition: all 0.2s ease;
  
  &:focus {
    border-color: ${props => props.theme.colors.primary.blue};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.primary.blue}20;
  }
  
  &:hover {
    border-color: ${props => props.theme.colors.gray[400]};
  }
  
  &::placeholder {
    color: ${props => props.theme.colors.text.disabled};
  }
`;

const SearchIconWrapper = styled.div`
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: ${props => props.theme.colors.text.disabled};
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  
  svg {
    width: 16px;
    height: 16px;
    display: block;
  }
`;

const SearchButton = styled(motion.button)`
  width: 38px;
  min-height: 38px;
  border-radius: ${props => props.theme.borderRadius.md};
  background: linear-gradient(135deg, ${props => props.theme.colors.primary.blue} 0%, ${props => props.theme.colors.primary.blueDark} 100%);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  box-shadow: 0 2px 8px ${props => props.theme.colors.primary.blue}30;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    transform: translate(-50%, -50%);
    transition: width 0.6s, height 0.6s;
  }
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px ${props => props.theme.colors.primary.blue}40;
    
    &::before {
      width: 50px;
      height: 50px;
    }
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 6px ${props => props.theme.colors.primary.blue}30;
  }
  
  svg {
    width: 18px;
    height: 18px;
    stroke-width: 2.5;
    z-index: 1;
  }
`;

export const SearchInput = ({ value, onChange, placeholder = "Buscar...", ...props }) => {
  return (
    <SearchContainer>
      <SearchInputField
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        {...props}
      />
    </SearchContainer>
  );
};

export default SearchInput;