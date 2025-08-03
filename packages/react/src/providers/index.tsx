/**
 * @fileoverview Provider components exports - React context providers
 * @implements mvvm-pattern
 * @implements view-layer
 * @implements separation-of-concerns
 * @memberof api-terms
 * @since 1.0.0
 * 
 * React Provider components for setting up Context-Action framework contexts.
 * Includes StoreProvider for store context and convenience components for
 * common provider combinations.
 */

import React from 'react';

// === MAIN PROVIDERS ===
// Core provider components
export { StoreProvider } from './StoreProvider';

// Re-export ActionProvider from actions for convenience
export { ActionProvider } from '../actions';

// === COMBINED PROVIDERS ===
// Convenience components for common combinations
export const AppProviders = ({ children }: { children: React.ReactNode }) => (
  <StoreProvider>
    <ActionProvider>
      {children}
    </ActionProvider>
  </StoreProvider>
);

// === PROVIDER TYPES ===
// TypeScript types for provider props
export type { StoreProviderProps } from './StoreProvider';
export type { ActionProviderProps } from '../actions/ActionProvider';