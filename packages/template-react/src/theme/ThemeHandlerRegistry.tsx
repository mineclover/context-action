import { useCallback, useEffect } from 'react';
import { applyThemeToDocument, createBrandTheme, type ThemeMode } from './theme-contract';
import { useThemeActionCommandHandler, useThemeStore } from './ThemeContext';

export function ThemeHandlerRegistry() {
  const themeStore = useThemeStore('currentTheme');

  useEffect(() => {
    applyThemeToDocument(themeStore.getValue());
  }, [themeStore]);

  useThemeActionCommandHandler(
    'setThemeMode',
    useCallback(
      (mode: ThemeMode) => {
        const nextTheme = createBrandTheme('astryx-brand', mode);
        themeStore.setValue(nextTheme);
        applyThemeToDocument(nextTheme);
      },
      [themeStore]
    ),
    { id: 'theme-set-mode-command' }
  );

  useThemeActionCommandHandler(
    'toggleTheme',
    useCallback(() => {
      const current = themeStore.getValue();
      const nextMode: ThemeMode = current.mode === 'light' ? 'dark' : 'light';
      const nextTheme = createBrandTheme('astryx-brand', nextMode);
      themeStore.setValue(nextTheme);
      applyThemeToDocument(nextTheme);
    }, [themeStore]),
    { id: 'theme-toggle-command' }
  );

  return null;
}
