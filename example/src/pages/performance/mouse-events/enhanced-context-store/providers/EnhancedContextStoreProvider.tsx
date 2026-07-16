import React from 'react';
import {
  MouseActionProvider,
  MouseRefProvider,
  MouseStoreProvider,
} from '../contexts/EnhancedContextStoreContexts';
import { EnhancedContextStoreHandlerRegistry } from '../handlers/EnhancedContextStoreHandlerRegistry';

/**
 * Canonical provider composition for the enhanced context-store usecase.
 * Action → Store → Ref → Handler Registry.
 */
export function EnhancedContextStoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MouseActionProvider>
      <MouseStoreProvider>
        <MouseRefProvider>
          <EnhancedContextStoreHandlerRegistry>
            {children}
          </EnhancedContextStoreHandlerRegistry>
        </MouseRefProvider>
      </MouseStoreProvider>
    </MouseActionProvider>
  );
}
