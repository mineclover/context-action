/**
 * Context-Action Design Context: ThemeContext
 * 
 * Context-Action Store/Action 아키텍처 기반 테마 관리 프로바이더.
 * Astryx CSS 변수를 HTML root에 동기화합니다.
 */

import { createActionContext, createStoreContext, useStoreValue } from '@context-action/react';
import React, { useEffect, useCallback, type ReactNode } from 'react';
import { createBrandTheme, type BrandTheme, type ThemeMode } from './theme-contract';

export interface ThemeActions {
  setThemeMode: ThemeMode;
  toggleTheme: void;
}

export interface ThemeStores {
  currentTheme: BrandTheme;
}

export const {
  Provider: ThemeActionProvider,
  useActionDispatch: useThemeActionDispatch,
  useActionHandler: useThemeActionHandler,
} = createActionContext<ThemeActions>('ThemeActions');

export const {
  Provider: ThemeStoreProvider,
  useStore: useThemeStore,
} = createStoreContext<ThemeStores>('ThemeStores', {
  currentTheme: createBrandTheme('astryx-brand', 'light'),
});

function ThemeEffectSync() {
  const themeStore = useThemeStore('currentTheme');
  const currentTheme = useStoreValue(themeStore);

  // CSS 변수들을 document.documentElement에 동기화
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', currentTheme.mode);
    for (const [key, val] of Object.entries(currentTheme.tokens)) {
      root.style.setProperty(key, val);
    }
  }, [currentTheme]);

  // Action 핸들러 등록
  useThemeActionHandler(
    'setThemeMode',
    useCallback(
      (mode: ThemeMode) => {
        themeStore.setValue(createBrandTheme('astryx-brand', mode));
      },
      [themeStore]
    )
  );

  useThemeActionHandler(
    'toggleTheme',
    useCallback(() => {
      const current = themeStore.getValue();
      const nextMode = current.mode === 'light' ? 'dark' : 'light';
      themeStore.setValue(createBrandTheme('astryx-brand', nextMode));
    }, [themeStore])
  );

  return null;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeActionProvider>
      <ThemeStoreProvider>
        <ThemeEffectSync />
        {children}
      </ThemeStoreProvider>
    </ThemeActionProvider>
  );
}
