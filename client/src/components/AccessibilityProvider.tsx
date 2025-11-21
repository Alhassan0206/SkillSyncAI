import { useEffect } from 'react';
import { useAccessibility } from '@/hooks/use-accessibility';

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  useAccessibility();

  useEffect(() => {
    // Enable keyboard navigation
    const handleKeyboardNavigation = (e: KeyboardEvent) => {
      // Tab key for focus management
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-nav-active');
      }
    };

    const handleMouseDown = () => {
      document.body.classList.remove('keyboard-nav-active');
    };

    window.addEventListener('keydown', handleKeyboardNavigation);
    window.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('keydown', handleKeyboardNavigation);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return <>{children}</>;
}
