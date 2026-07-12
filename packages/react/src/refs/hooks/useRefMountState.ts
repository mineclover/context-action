/**
 * @fileoverview Hook for subscribing to ref mount state changes
 * 
 * Provides reactive subscription to isMounted state changes using useSyncExternalStore
 */

import { useEffect, useSyncExternalStore, useCallback, useRef } from 'react';
import type { InternalRefState } from './useRefMount';

/**
 * Hook that subscribes to ref mount state changes using useSyncExternalStore
 * Returns reactive isMounted state that triggers re-renders
 */
export function useRefMountState<T>(refState: InternalRefState<T>): {
  isMounted: boolean;
  isWaitingForMount: boolean;
  mountedTarget: T | null;
} {
  // Subscribe function for useSyncExternalStore
  const subscribe = useCallback((callback: () => void) => {
    if (!refState) return () => {};
    
    // Add listener to refState
    refState.listeners.add(callback);
    
    // Return cleanup function
    return () => {
      refState.listeners.delete(callback);
    };
  }, [refState]);
  
  // Cached snapshot reference - React 18 compatibility
  const cachedSnapshotRef = useRef<{
    isMounted: boolean;
    isWaitingForMount: boolean;
    mountedTarget: T | null;
  } | undefined>(undefined);

  // Get snapshot function for current state with caching
  const getSnapshot = useCallback(() => {
    if (!refState) {
      const snapshot = {
        isMounted: false,
        isWaitingForMount: false,
        mountedTarget: null as T | null
      };
      cachedSnapshotRef.current = snapshot;
      return snapshot;
    }
    
    const isWaitingForMount = !refState.isMounted && refState.mountPromise !== null;
    
    const newSnapshot = {
      isMounted: refState.isMounted,
      isWaitingForMount,
      mountedTarget: refState.isMounted ? refState.target : null as T | null
    };
    
    // Cache comparison to prevent infinite loops
    if (cachedSnapshotRef.current &&
        cachedSnapshotRef.current.isMounted === newSnapshot.isMounted &&
        cachedSnapshotRef.current.isWaitingForMount === newSnapshot.isWaitingForMount &&
        cachedSnapshotRef.current.mountedTarget === newSnapshot.mountedTarget) {
      return cachedSnapshotRef.current;
    }
    
    cachedSnapshotRef.current = newSnapshot;
    return newSnapshot;
  }, [refState]);
  
  // Server snapshot (for SSR) - cached static reference
  const serverSnapshotRef = useRef({
    isMounted: false,
    isWaitingForMount: false,
    mountedTarget: null as T | null
  });
  
  const getServerSnapshot = useCallback(() => {
    return serverSnapshotRef.current;
  }, []);
  
  // Use React's useSyncExternalStore for reactive subscriptions
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Hook that provides a callback when mount state changes
 * Uses useSyncExternalStore internally for consistent behavior
 */
export function useOnMountStateChange<T>(
  refState: InternalRefState<T>,
  callback: (mounted: boolean, target: T | null) => void
): void {
  // Get the current mount state using our reactive hook
  const { isMounted, mountedTarget } = useRefMountState(refState);
  
  // Use a stable callback to avoid unnecessary re-subscriptions
  const stableCallback = useCallback(callback, [callback]);
  
  // Call the callback when mount state changes
  useEffect(() => {
    stableCallback(isMounted, mountedTarget);
  }, [isMounted, mountedTarget, stableCallback]);
}

/**
 * Hook that returns a stable function to check current mount state
 * Useful for event handlers and callbacks
 */
export function useRefMountChecker<T>(refState: InternalRefState<T>) {
  return useCallback(() => {
    return {
      isMounted: refState.isMounted,
      isWaitingForMount: !refState.isMounted && refState.mountPromise !== null,
      target: refState.target
    };
  }, [refState]);
}
