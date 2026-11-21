/**
 * Astryx Theme Contract & Theme Definitions
 */

import { brandSemanticsLight, brandSemanticsDark, type CompanySemantics } from './semantics';
import { toAstryxTokens } from './astryx-mapping';

export type ThemeMode = 'light' | 'dark';

export interface BrandTheme {
  name: string;
  mode: ThemeMode;
  semantics: CompanySemantics;
  tokens: Record<string, string>;
}

export function createBrandTheme(name: string, mode: ThemeMode): BrandTheme {
  const semantics = mode === 'dark' ? brandSemanticsDark : brandSemanticsLight;
  return {
    name,
    mode,
    semantics,
    tokens: toAstryxTokens(semantics),
  };
}

export function applyThemeToDocument(theme: BrandTheme): void {
  if (typeof document === 'undefined') {
    return;
  }
  const root = document.documentElement;
  root.setAttribute('data-theme', theme.mode);
  for (const [key, val] of Object.entries(theme.tokens)) {
    root.style.setProperty(key, val);
  }
}
