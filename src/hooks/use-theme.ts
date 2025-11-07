import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    // 1. Tenta carregar do localStorage
    const storedTheme = localStorage.getItem('theme') as Theme;
    if (storedTheme) return storedTheme;

    // 2. Tenta carregar a preferência do sistema
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    // 3. Padrão para light
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(currentTheme => (currentTheme === 'light' ? 'dark' : 'light'));
  };

  return { theme, toggleTheme };
};

export default useTheme;
