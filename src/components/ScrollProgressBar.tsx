import { useEffect, useState } from 'react';

/**
 * Barra de progreso de scroll que aparece en la parte superior
 * Mejora la experiencia de usuario mostrando cuánto ha scrolleado
 */
export const ScrollProgressBar = () => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const updateScrollProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    updateScrollProgress(); // Initial call

    return () => window.removeEventListener('scroll', updateScrollProgress);
  }, []);

  return (
    <div 
      className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary z-[60] transition-all duration-300"
      style={{ 
        width: `${scrollProgress}%`,
        opacity: scrollProgress > 0 ? 1 : 0,
        boxShadow: scrollProgress > 0 ? '0 0 10px hsl(var(--primary) / 0.5)' : 'none'
      }}
    />
  );
};
