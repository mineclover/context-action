/**
 * @fileoverview Legacy StoreProvider - For example app compatibility only
 * @deprecated Use Context Store Pattern (createContextStorePattern) instead
 */

import { StoreRegistry } from '@context-action/react';
import { createContext, type ReactNode, useContext, useRef } from 'react';

/**
 * @deprecated Use Context Store Pattern instead
 */
export interface StoreContextType {
  registry: StoreRegistry;
}

/**
 * @deprecated Use Context Store Pattern instead
 */
const StoreContext = createContext<StoreContextType | null>(null);

/**
 * @deprecated Use Context Store Pattern instead
 */
export interface StoreProviderProps {
  children: ReactNode;
  registry?: StoreRegistry;
}

/**
 * @deprecated This is only for example app compatibility.
 * Use createContextStorePattern instead for new code.
 */
export function StoreProvider({ children, registry }: StoreProviderProps) {
  const registryRef = useRef<StoreRegistry>();

  if (!registryRef.current) {
    registryRef.current = registry || new StoreRegistry();
  }

  const contextValue: StoreContextType = {
    registry: registryRef.current,
  };

  return (
    <StoreContext.Provider value={contextValue}>
      {children}
    </StoreContext.Provider>
  );
}

/**
 * @deprecated Use Context Store Pattern instead
 */
export function useStoreRegistry(): StoreRegistry {
  const context = useContext(StoreContext);

  if (!context) {
    throw new Error(
      'useStoreRegistry must be used within a StoreProvider. ' +
        'Consider using Context Store Pattern instead.'
    );
  }

  return context.registry;
}
