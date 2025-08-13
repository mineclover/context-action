/**
 * Mouse Events Context - Simplified
 */

import React, { createContext, useContext, ReactNode } from 'react';

interface MouseEventsContextValue {
  position: { x: number; y: number };
  movement: { isMoving: boolean };
  clicks: { count: number };
  computed: { velocity: number };
}

const MouseEventsContext = createContext<MouseEventsContextValue | null>(null);

export function MouseEventsProvider({ children }: { children: ReactNode }) {
  const value: MouseEventsContextValue = {
    position: { x: 0, y: 0 },
    movement: { isMoving: false },
    clicks: { count: 0 },
    computed: { velocity: 0 }
  };

  return (
    <MouseEventsContext.Provider value={value}>
      {children}
    </MouseEventsContext.Provider>
  );
}

export function useMouseEventsContext() {
  const context = useContext(MouseEventsContext);
  if (!context) {
    throw new Error('useMouseEventsContext must be used within MouseEventsProvider');
  }
  return context;
}

export default MouseEventsContext;