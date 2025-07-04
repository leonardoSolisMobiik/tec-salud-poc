import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  /* Reset y base */
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  html {
    font-size: 16px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  body {
    font-family: ${props => props.theme.typography.fontFamily.primary};
    font-size: ${props => props.theme.typography.fontSize.base};
    line-height: ${props => props.theme.typography.lineHeight.normal};
    color: ${props => props.theme.colors.text.primary};
    background-color: ${props => props.theme.colors.background.secondary};
    overflow-x: hidden;
  }
  
  /* Tipografía médica */
  h1, h2, h3, h4, h5, h6 {
    font-family: ${props => props.theme.typography.fontFamily.display};
    font-weight: ${props => props.theme.typography.fontWeight.semibold};
    line-height: ${props => props.theme.typography.lineHeight.tight};
    color: ${props => props.theme.colors.text.primary};
  }
  
  h1 {
    font-size: ${props => props.theme.typography.fontSize['3xl']};
    font-weight: ${props => props.theme.typography.fontWeight.light};
  }
  
  h2 {
    font-size: ${props => props.theme.typography.fontSize['2xl']};
  }
  
  h3 {
    font-size: ${props => props.theme.typography.fontSize.xl};
  }
  
  p {
    margin-bottom: ${props => props.theme.spacing.md};
    color: ${props => props.theme.colors.text.secondary};
  }
  
  /* Enlaces médicos */
  a {
    color: ${props => props.theme.colors.primary.blue};
    text-decoration: none;
    transition: color ${props => props.theme.transitions.fast};
    
    &:hover {
      color: ${props => props.theme.colors.primary.blueDark};
    }
  }
  
  /* Botones base */
  button {
    font-family: inherit;
    cursor: pointer;
    border: none;
    outline: none;
    transition: all ${props => props.theme.transitions.normal};
    
    &:focus-visible {
      box-shadow: ${props => props.theme.shadows.glow};
    }
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
  
  /* Inputs médicos */
  input, textarea, select {
    font-family: inherit;
    font-size: inherit;
    border: 1px solid ${props => props.theme.colors.gray[300]};
    border-radius: ${props => props.theme.borderRadius.md};
    transition: all ${props => props.theme.transitions.fast};
    
    &:focus {
      outline: none;
      border-color: ${props => props.theme.colors.primary.blue};
      box-shadow: ${props => props.theme.shadows.glow};
    }
    
    &::placeholder {
      color: ${props => props.theme.colors.text.muted};
    }
  }
  
  /* Scrollbars médicos */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  
  ::-webkit-scrollbar-track {
    background: ${props => props.theme.colors.gray[100]};
    border-radius: ${props => props.theme.borderRadius.sm};
  }
  
  ::-webkit-scrollbar-thumb {
    background: ${props => props.theme.colors.gray[300]};
    border-radius: ${props => props.theme.borderRadius.sm};
    
    &:hover {
      background: ${props => props.theme.colors.gray[400]};
    }
  }
  
  /* Selección de texto */
  ::selection {
    background: ${props => props.theme.colors.primary.blueLight};
    color: ${props => props.theme.colors.primary.blueDark};
  }
  
  /* Animaciones médicas */
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }
  
  @keyframes voicePulse {
    0%, 100% {
      background-color: ${props => props.theme.colors.patient.active};
    }
    50% {
      background-color: ${props => props.theme.colors.patient.voiceActive};
    }
  }

  @keyframes blink {
    0%, 50% {
      opacity: 1;
    }
    51%, 100% {
      opacity: 0;
    }
  }
  
  /* Clases de utilidad médica */
  .fade-in {
    animation: fadeIn 0.3s ease-out;
  }
  
  .slide-in {
    animation: slideIn 0.3s ease-out;
  }
  
  .pulse {
    animation: pulse 2s infinite;
  }
  
  .voice-active {
    animation: voicePulse 1s ease-in-out 3;
  }
  
  /* Estados de carga médicos */
  .loading {
    position: relative;
    overflow: hidden;
    
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.4),
        transparent
      );
      animation: shimmer 1.5s infinite;
    }
  }
  
  @keyframes shimmer {
    0% {
      left: -100%;
    }
    100% {
      left: 100%;
    }
  }
  
  /* Responsive médico */
  @media (max-width: ${props => props.theme.breakpoints.tablet}) {
    html {
      font-size: 14px;
    }
    
    h1 {
      font-size: ${props => props.theme.typography.fontSize['2xl']};
    }
    
    h2 {
      font-size: ${props => props.theme.typography.fontSize.xl};
    }
  }
  
  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    html {
      font-size: 14px;
    }
    
    body {
      padding: 0;
    }
  }
  
  /* Accesibilidad médica */
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
  
  /* Focus visible para navegación por teclado */
  .js-focus-visible :focus:not(.focus-visible) {
    outline: none;
  }
  
  .focus-visible {
    outline: 2px solid ${props => props.theme.colors.primary.blue};
    outline-offset: 2px;
  }
  
  /* Ocultar marca "Made with Manus" - Versión agresiva */
  [data-manus-branding],
  .manus-branding,
  iframe[src*="manus"],
  div[style*="manus"],
  div[style*="position: fixed"][style*="bottom"][style*="right"],
  div[style*="position:fixed"][style*="bottom"][style*="right"],
  button[style*="position: fixed"],
  a[href*="manus.space"]:not([href*="bvilwere"]) {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
    position: absolute !important;
    left: -9999px !important;
    top: -9999px !important;
    width: 0 !important;
    height: 0 !important;
    pointer-events: none !important;
    z-index: -1 !important;
  }
  
  /* Ocultar elementos específicos en esquina inferior derecha */
  body > div:last-child:not(#root) {
    display: none !important;
  }
  
  /* Ocultar cualquier elemento con z-index alto en esquina */
  div[style*="z-index: 999"],
  div[style*="z-index:999"],
  div[style*="z-index: 9999"],
  div[style*="z-index:9999"] {
    display: none !important;
  }
`;

