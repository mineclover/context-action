/**
 * Context-Action Design Context: ThemeContext
 *
 * Context-Action Store/Action 아키텍처 기반 테마 관리 프로바이더.
 * Astryx CSS 변수 동기화는 ThemeHandlerRegistry에서 처리합니다.
 */

import { type ActionPayloadMap, createActionContext, createStoreContext } from '@context-action/react';
import type { ReactNode } from 'react';
import { ThemeHandlerRegistry } from './ThemeHandlerRegistry';
import { createBrandTheme, type BrandTheme, type ThemeMode } from './theme-contract';

export interface ThemeActions extends ActionPayloadMap {
  setThemeMode: ThemeMode;
  toggleTheme: void;
}

export interface ThemeStores {
  currentTheme: BrandTheme;
}

export const {
  Provider: ThemeActionProvider,
  useActionDispatch: useThemeActionDispatch,
  useActionCommandHandler: useThemeActionCommandHandler,
} = createActionContext<ThemeActions>('ThemeActions');

export const {
  Provider: ThemeStoreProvider,
  useStore: useThemeStore,
} = createStoreContext<ThemeStores>('ThemeStores', {
  currentTheme: createBrandTheme('astryx-brand', 'light'),
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeActionProvider>
      <ThemeStoreProvider>
        <ThemeHandlerRegistry />
        {children}
      </ThemeStoreProvider>
    </ThemeActionProvider>
  );
}
