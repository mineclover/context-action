/**
 * @fileoverview Time Travel Controls Hook
 *
 * React hook for subscribing to TimeTravelStore's undo/redo state.
 * Provides reactive access to canUndo, canRedo, position, and history.
 */

import { useCallback, useDebugValue, useMemo, useRef, useSyncExternalStore } from 'react';
import type { TimelineReader, TimelineWriter } from '../core/contracts';

/** Structural store contract accepted by `useTimeTravelControls` (`TimeTravelStore` or `TimelineBackend`). */
export type TimeTravelControlsStore<T = unknown> = TimelineReader<T> & TimelineWriter;

function formatTimeTravelControlsDebugValue(state: {
  position: number;
  historyLength: number;
  canUndo: boolean;
  canRedo: boolean;
}): string {
  return `${state.position + 1}/${state.historyLength} (undo=${state.canUndo}, redo=${state.canRedo})`;
}

/**
 * Time travel control state (without functions)
 */
interface TimeTravelState {
  canUndo: boolean;
  canRedo: boolean;
  position: number;
  historyLength: number;
}

/**
 * Time travel control state with functions
 */
export interface TimeTravelControlsState extends TimeTravelState {
  /** Undo function */
  undo: (steps?: number) => void;
  /** Redo function */
  redo: (steps?: number) => void;
  /** Go to specific position */
  goTo: (position: number) => void;
  /** Reset to initial state */
  reset: () => void;
}

// Default server-side state (constant to avoid recreation)
const SERVER_SNAPSHOT: TimeTravelState = {
  canUndo: false,
  canRedo: false,
  position: 0,
  historyLength: 1,
};

/**
 * Hook for subscribing to TimeTravelStore's time travel controls
 *
 * @example
 * ```tsx
 * const store = createTimeTravelStore('counter', { count: 0 });
 *
 * function Counter() {
 *   const value = useStoreValue(store);
 *   const { canUndo, canRedo, undo, redo, position, historyLength } = useTimeTravelControls(store);
 *
 *   return (
 *     <div>
 *       <p>Count: {value.count}</p>
 *       <p>Position: {position} / {historyLength - 1}</p>
 *       <button onClick={() => undo()} disabled={!canUndo}>Undo</button>
 *       <button onClick={() => redo()} disabled={!canRedo}>Redo</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useTimeTravelControls<T>(
  store: TimeTravelControlsStore<T>
): TimeTravelControlsState {
  // Cache for getSnapshot result - must return same reference if values haven't changed for this store
  const cacheRef = useRef<{ store: TimeTravelControlsStore<T>; state: TimeTravelState } | null>(null);

  // Subscribe to store changes
  const subscribe = useCallback(
    (callback: () => void) => {
      return store.subscribe(callback);
    },
    [store]
  );

  // Get current time travel state with caching
  const getSnapshot = useCallback((): TimeTravelState => {
    const canUndo = store.canUndo();
    const canRedo = store.canRedo();
    const position = store.getPosition();
    const historyLength = store.getHistoryLength();

    // Return cached value if nothing changed on the same store instance
    const cached = cacheRef.current;
    if (
      cached &&
      cached.store === store &&
      cached.state.canUndo === canUndo &&
      cached.state.canRedo === canRedo &&
      cached.state.position === position &&
      cached.state.historyLength === historyLength
    ) {
      return cached.state;
    }

    // Create and cache new state
    const newState: TimeTravelState = { canUndo, canRedo, position, historyLength };
    cacheRef.current = { store, state: newState };
    return newState;
  }, [store]);

  // Server-side snapshot (constant)
  const getServerSnapshot = useCallback(() => SERVER_SNAPSHOT, []);

  // Use useSyncExternalStore for React integration
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  useDebugValue(state, formatTimeTravelControlsDebugValue);

  // Memoize control functions
  const controls = useMemo(
    () => ({
      undo: (steps?: number) => store.undo(steps),
      redo: (steps?: number) => store.redo(steps),
      goTo: (position: number) => store.goTo(position),
      reset: () => store.reset(),
    }),
    [store]
  );

  return {
    ...state,
    ...controls,
  };
}
