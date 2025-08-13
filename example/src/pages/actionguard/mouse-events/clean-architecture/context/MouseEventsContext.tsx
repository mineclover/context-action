/**
 * Mouse Events Context - Real Context-Action Integration
 * 
 * Using @context-action/react's Action Context Pattern for complete
 * store and action management with type safety.
 */

import React, { ReactNode } from 'react';
import { 
  createActionContextPattern,
  ActionPayloadMap,
  useStoreValue,
  Store
} from '@context-action/react';
import { LogLevel } from '@context-action/logger';

// ============================================================================
// Types
// ============================================================================

export interface MousePosition {
  x: number;
  y: number;
}

export interface MouseMovement {
  isMoving: boolean;
  lastMoveTime: number | null;
  moveCount: number;
  velocity: number;
  path: MousePosition[];
  previous: MousePosition | null;
}

export interface MouseClicks {
  count: number;
  history: Array<{
    x: number;
    y: number;
    timestamp: number;
    button: number;
  }>;
}

export interface MouseComputed {
  validPath: MousePosition[];
  recentClickCount: number;
  averageVelocity: number;
  totalEvents: number;
  activityStatus: 'idle' | 'active' | 'moving';
  hasActivity: boolean;
}

export interface MouseState {
  current: MousePosition;
  isInsideArea: boolean;
}

// ============================================================================
// Action Types
// ============================================================================

export interface MouseActions extends ActionPayloadMap {
  // Mouse movement actions
  mouseMove: { 
    x: number; 
    y: number; 
    timestamp: number;
  };
  
  moveStart: {
    position: MousePosition;
    timestamp: number;
  };
  
  moveEnd: {
    position: MousePosition;
    timestamp: number;
  };
  
  updateMouseMetrics: {
    position: MousePosition;
    timestamp: number;
  };
  
  // Mouse click actions
  mouseClick: {
    x: number;
    y: number;
    button: number;
    timestamp: number;
  };
  
  // Mouse area actions
  mouseEnter: {
    x: number;
    y: number;
    timestamp: number;
  };
  
  mouseLeave: {
    x: number;
    y: number;
    timestamp: number;
  };
  
  // Reset action
  resetMouseState: void;
}

// ============================================================================
// Context Creation
// ============================================================================

/**
 * Create the Mouse Events Context using Action Context Pattern
 * This provides both store management and action dispatching
 */
const MouseEventsContext = createActionContextPattern<MouseActions>('MouseEvents', {
  logLevel: LogLevel.ERROR, // Set to DEBUG for development
  debug: false
});

// ============================================================================
// Provider Component
// ============================================================================

export function MouseEventsProvider({ children }: { children: ReactNode }) {
  return (
    <MouseEventsContext.Provider registryId="mouse-events">
      {children}
    </MouseEventsContext.Provider>
  );
}

// ============================================================================
// Custom Hooks
// ============================================================================

/**
 * Get or create a mouse events store
 */
export function useMouseEventsStore(storeName: 'position'): Store<MousePosition>;
export function useMouseEventsStore(storeName: 'movement'): Store<MouseMovement>;
export function useMouseEventsStore(storeName: 'clicks'): Store<MouseClicks>;
export function useMouseEventsStore(storeName: 'computed'): Store<MouseComputed>;
export function useMouseEventsStore(storeName: 'state'): Store<MouseState>;
export function useMouseEventsStore(storeName: string): Store<any> {
  const initialValues = {
    position: { x: 0, y: 0 },
    movement: {
      isMoving: false,
      lastMoveTime: null,
      moveCount: 0,
      velocity: 0,
      path: [],
      previous: null
    },
    clicks: {
      count: 0,
      history: []
    },
    computed: {
      validPath: [],
      recentClickCount: 0,
      averageVelocity: 0,
      totalEvents: 0,
      activityStatus: 'idle' as const,
      hasActivity: false
    },
    state: {
      current: { x: 0, y: 0 },
      isInsideArea: false
    }
  };
  
  return MouseEventsContext.useStore(
    storeName,
    initialValues[storeName as keyof typeof initialValues] || {},
    {
      strategy: storeName === 'computed' ? 'shallow' : 'reference',
      debug: false
    }
  );
}

/**
 * Get action dispatcher for mouse events
 */
export function useMouseEventsActionDispatch() {
  return MouseEventsContext.useAction();
}

/**
 * Get action register for mouse events
 */
export function useMouseEventsActionRegister() {
  return MouseEventsContext.useActionRegister();
}

/**
 * Register a mouse event action handler
 */
export function useMouseEventsActionHandler(
  action: keyof MouseActions,
  handler: (payload: any, controller: any) => void | Promise<void>,
  config?: any
) {
  MouseEventsContext.useActionHandler(action, handler, config);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Update computed values from stores
 */
export function updateComputedValuesFromStores(
  movement: MouseMovement,
  clicks: MouseClicks
): MouseComputed {
  const validPath = movement.path.filter(p => p.x !== 0 || p.y !== 0);
  const recentClickCount = clicks.history.filter(
    c => Date.now() - c.timestamp < 5000
  ).length;
  
  const averageVelocity = movement.path.length > 0
    ? movement.velocity
    : 0;
  
  const totalEvents = movement.moveCount + clicks.count;
  
  const activityStatus: 'idle' | 'active' | 'moving' = 
    movement.isMoving ? 'moving' :
    totalEvents > 0 ? 'active' : 'idle';
  
  const hasActivity = totalEvents > 0;
  
  return {
    validPath,
    recentClickCount,
    averageVelocity,
    totalEvents,
    activityStatus,
    hasActivity
  };
}

/**
 * Aggregate mouse events state from all stores
 */
export function aggregateMouseEventsState(
  position: MousePosition,
  movement: MouseMovement,
  clicks: MouseClicks,
  computed: MouseComputed
) {
  return {
    mousePosition: position,
    previousPosition: movement.previous || { x: 0, y: 0 },
    isInsideArea: true, // This should be tracked separately
    isMoving: movement.isMoving,
    moveCount: movement.moveCount,
    clickCount: clicks.count,
    mouseVelocity: movement.velocity,
    lastMoveTime: movement.lastMoveTime,
    movePath: movement.path,
    clickHistory: clicks.history,
    validPath: computed.validPath,
    recentClickCount: computed.recentClickCount,
    averageVelocity: computed.averageVelocity,
    totalEvents: computed.totalEvents,
    activityStatus: computed.activityStatus,
    hasActivity: computed.hasActivity
  };
}

// ============================================================================
// Export Context Components
// ============================================================================

export default MouseEventsContext;

// Re-export commonly used hooks from the framework
export { useStoreValue };