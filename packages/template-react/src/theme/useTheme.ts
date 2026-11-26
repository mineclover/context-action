import { useStoreValue } from '@context-action/react';
import { useCallback } from 'react';
import { useThemeActionDispatch, useThemeStore } from './ThemeContext';
import type { ThemeMode } from './theme-contract';

export function useTheme() {
  const themeStore = useThemeStore('currentTheme');
  const currentTheme = useStoreValue(themeStore);
  const dispatch = useThemeActionDispatch();

  const setThemeMode = useCallback(
    (mode: ThemeMode) => dispatch('setThemeMode', mode),
    [dispatch]
  );

  const toggleTheme = useCallback(() => dispatch('toggleTheme'), [dispatch]);

  return {
    currentTheme,
    setThemeMode,
    toggleTheme,
  };
}
