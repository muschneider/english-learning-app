'use client';

import { useEffect } from 'react';
import { useProgressStore } from '../store/progress';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const darkMode = useProgressStore((s) => s.darkMode);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return <>{children}</>;
}
