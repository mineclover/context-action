/**
 * Mouse Events Context - Real Context-Action Integration
 *
 * Using @context-action/react's Action Context Pattern for complete
 * store and action management with type safety.
 */

import { LogLevel } from '@context-action/logger';
import {
  ActionPayloadMap,
  createActionContext,
  createDeclarativeStorePattern,
  Store,
  useStoreValue,
} from '@context-action/react';
import React, { ReactNode } from 'react';

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
 * Create the Mouse Events Context using Action Only + Store Only patterns
 * Actions handle business logic, stores manage state separately
 */
const MouseEventsActions = createActionContext<MouseActions>({
  name: 'MouseEvents-actions',
});

const MouseEventsStores = createDeclarativeStorePattern('MouseEvents-stores', {
  position: { initialValue: { x: 0, y: 0 } as MousePosition },
  movement: {
    initialValue: {
      isMoving: false,
      lastMoveTime: null,
      moveCount: 0,
      velocity: 0,
      path: [],
      previous: null,
    } as MouseMovement
  },
  clicks: {
    initialValue: {
      count: 0,
      history: [],
    } as MouseClicks
  },
  computed: {
    initialValue: {
      validPath: [],
      recentClickCount: 0,
      averageVelocity: 0,
      totalEvents: 0,
      activityStatus: 'idle' as const,
      hasActivity: false,
    } as MouseComputed
  },
  state: {
    initialValue: {
      current: { x: 0, y: 0 },
      isInsideArea: false,
    } as MouseState
  },
});

// ============================================================================
// Provider Component
// ============================================================================

export function MouseEventsProvider({ children }: { children: ReactNode }) {
  return (
    <MouseEventsActions.Provider>
      <MouseEventsStores.Provider registryId="mouse-events">
        {children}
      </MouseEventsStores.Provider>
    </MouseEventsActions.Provider>
  );
}

// ============================================================================
// Custom Hooks
// ============================================================================

/**
 * Get mouse events stores with type safety
 */
export function useMouseEventsStore(
  storeName: 'position'
): Store<MousePosition>;
export function useMouseEventsStore(
  storeName: 'movement'
): Store<MouseMovement>;
export function useMouseEventsStore(storeName: 'clicks'): Store<MouseClicks>;
export function useMouseEventsStore(
  storeName: 'computed'
): Store<MouseComputed>;
export function useMouseEventsStore(storeName: 'state'): Store<MouseState>;
export function useMouseEventsStore(storeName: string): Store<any> {
  return MouseEventsStores.useStore(storeName as any);
}

/**
 * Get action dispatcher for mouse events
 */
export function useMouseEventsActionDispatch() {
  return MouseEventsActions.useActionDispatch();
}

/**
 * Get action register for mouse events
 */
export function useMouseEventsActionRegister() {
  return MouseEventsActions.useActionRegister();
}

/**
 * Register a mouse event action handler
 */
export function useMouseEventsActionHandler(
  action: keyof MouseActions,
  handler: (payload: any, controller: any) => void | Promise<void>,
  config?: any
) {
  MouseEventsActions.useActionHandler(action, handler, config);
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
  const validPath = movement.path.filter((p) => p.x !== 0 || p.y !== 0);
  const recentClickCount = clicks.history.filter(
    (c) => Date.now() - c.timestamp < 5000
  ).length;

  const averageVelocity = movement.path.length > 0 ? movement.velocity : 0;

  const totalEvents = movement.moveCount + clicks.count;

  const activityStatus: 'idle' | 'active' | 'moving' = movement.isMoving
    ? 'moving'
    : totalEvents > 0
      ? 'active'
      : 'idle';

  const hasActivity = totalEvents > 0;

  return {
    validPath,
    recentClickCount,
    averageVelocity,
    totalEvents,
    activityStatus,
    hasActivity,
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
    hasActivity: computed.hasActivity,
  };
}

// ============================================================================
// Export Context Components
// ============================================================================

export { MouseEventsActions, MouseEventsStores };

// Re-export commonly used hooks from the framework
export { useStoreValue };
