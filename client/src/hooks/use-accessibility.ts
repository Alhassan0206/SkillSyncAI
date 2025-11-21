import { useEffect, useState } from 'react';

export function useAccessibility() {
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Check for high contrast preference
    const contrastMedia = window.matchMedia('(prefers-contrast: more)');
    setHighContrast(contrastMedia.matches);

    // Check for reduced motion preference
    const motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(motionMedia.matches);

    const handleContrastChange = (e: MediaQueryListEvent) => {
      setHighContrast(e.matches);
      document.documentElement.classList.toggle('high-contrast', e.matches);
    };

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
      document.documentElement.classList.toggle('reduce-motion', e.matches);
    };

    contrastMedia.addEventListener('change', handleContrastChange);
    motionMedia.addEventListener('change', handleMotionChange);

    // Apply initial classes
    document.documentElement.classList.toggle('high-contrast', highContrast);
    document.documentElement.classList.toggle('reduce-motion', reducedMotion);

    return () => {
      contrastMedia.removeEventListener('change', handleContrastChange);
      motionMedia.removeEventListener('change', handleMotionChange);
    };
  }, []);

  return { highContrast, reducedMotion };
}
