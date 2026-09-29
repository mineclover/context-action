/**
 * Astryx Theme Contract & Theme Definitions
 */

import { brandPrimitives } from './primitives';
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

export const defaultTheme = createBrandTheme('astryx-brand-default', 'light');
