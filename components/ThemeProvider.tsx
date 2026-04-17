'use client';

import { useEffect } from 'react';
import { useMoodStore } from '@/store/useMoodStore';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themePreference = useMoodStore((state) => state.theme);

  useEffect(() => {
    const applyTheme = () => {
      document.documentElement.classList.remove('theme-morning', 'theme-afternoon', 'theme-evening', 'theme-night');
      
      let themeToApply = '';

      if (themePreference === 'system') {
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 12) {
          themeToApply = 'theme-morning';
        } else if (hour >= 12 && hour < 18) {
          themeToApply = 'theme-afternoon';
        } else if (hour >= 18 && hour < 22) {
          themeToApply = 'theme-evening';
        } else {
          themeToApply = 'theme-night';
        }
      } else if (themePreference === 'light') {
        themeToApply = 'theme-morning'; // Use morning as the default light theme
      } else if (themePreference === 'dark') {
        themeToApply = 'theme-night'; // Use night as the default dark theme
      }

      if (themeToApply) {
        document.documentElement.classList.add(themeToApply);
      }
    };

    applyTheme();

    // Re-apply if time changes (only relevant for system, but safe to run periodically)
    const interval = setInterval(applyTheme, 60000);
    return () => clearInterval(interval);
  }, [themePreference]);

  return <>{children}</>;
}
