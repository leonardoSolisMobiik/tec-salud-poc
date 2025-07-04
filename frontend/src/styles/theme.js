// Tema médico premium inspirado en Karolis Kosas y Apple
export const theme = {
  colors: {
    // Colores primarios médicos
    primary: {
      blue: '#2196F3',
      blueLight: '#E3F2FD',
      blueDark: '#1976D2',
    },
    
    // Colores de estado médico
    medical: {
      success: '#4CAF50',
      warning: '#FF9800',
      error: '#F44336',
      emergency: '#D32F2F',
      info: '#2196F3',
    },
    
    // Grises profesionales
    gray: {
      50: '#f8fafb',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
    
    // Colores de texto
    text: {
      primary: '#1a202c',
      secondary: '#64748b',
      muted: '#94a3b8',
      inverse: '#ffffff',
    },
    
    // Fondos
    background: {
      primary: '#ffffff',
      secondary: '#f8fafb',
      tertiary: '#f1f5f9',
      overlay: 'rgba(0, 0, 0, 0.5)',
    },
    
    // Contexto del paciente
    patient: {
      active: '#E3F2FD',
      activeBorder: '#BBDEFB',
      voiceActive: '#4CAF50',
    },
  },
  
  // Tipografía médica profesional
  typography: {
    fontFamily: {
      primary: "'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      display: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      mono: "'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', monospace",
    },
    
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '32px',
      '4xl': '40px',
    },
    
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  
  // Espaciado consistente
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
  },
  
  // Bordes y radios
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '20px',
    pill: '9999px',
  },
  
  // Sombras médicas profesionales
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.07)',
    lg: '0 8px 25px rgba(0, 0, 0, 0.08)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.1)',
    medical: '0 8px 32px rgba(0, 0, 0, 0.08)',
    glow: '0 0 0 3px rgba(33, 150, 243, 0.1)',
  },
  
  // Transiciones suaves
  transitions: {
    fast: '150ms ease-out',
    normal: '200ms ease-out',
    slow: '300ms ease-out',
    bounce: '300ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
  
  // Z-index para layering
  zIndex: {
    dropdown: 10,
    modal: 50,
    toast: 100,
    tooltip: 200,
  },
  
  // Breakpoints responsive
  breakpoints: {
    mobile: '768px',
    tablet: '1024px',
    desktop: '1200px',
  },
};

// Tema para styled-components
export const styledTheme = theme;

export default theme;

