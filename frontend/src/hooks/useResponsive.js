import { useState, useEffect } from 'react';

// Breakpoints del tema
const breakpoints = {
  mobile: 768,
  tablet: 1024,
  desktop: 1200,
};

export const useResponsive = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  const [device, setDevice] = useState('desktop');

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setWindowSize({ width, height });
      
      // Determinar tipo de dispositivo
      if (width < breakpoints.mobile) {
        setDevice('mobile');
      } else if (width < breakpoints.tablet) {
        setDevice('tablet');
      } else {
        setDevice('desktop');
      }
    };

    // Configurar listener
    window.addEventListener('resize', handleResize);
    
    // Llamar una vez al inicio
    handleResize();

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    windowSize,
    device,
    isMobile: device === 'mobile',
    isTablet: device === 'tablet',
    isDesktop: device === 'desktop',
    isSmallScreen: device === 'mobile' || device === 'tablet',
  };
};

export default useResponsive;

