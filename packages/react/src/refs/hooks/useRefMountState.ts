/**
 * @fileoverview Hook for subscribing to ref mount state changes
 * 
 * Provides reactive subscription to isMounted state changes
 */

import { useEffect, useState, useCallback } from 'react';
import type { InternalRefState } from './useRefMount';

/**
 * Hook that subscribes to ref mount state changes
 * Returns reactive isMounted state that triggers re-renders
 */
export function useRefMountState<T>(refState: InternalRefState<T>): {
  isMounted: boolean;
  isWaitingForMount: boolean;
  mountedTarget: T | null;
} {
  // Reactive state for mount status
  const [isMounted, setIsMounted] = useState(refState.isMounted);
  const [mountedTarget, setMountedTarget] = useState<T | null>(refState.isMounted ? refState.target : null);
  
  useEffect(() => {
    // Initialize state
    setIsMounted(refState.isMounted);
    setMountedTarget(refState.isMounted ? refState.target : null);
    
    // Create listener
    const listener = () => {
      setIsMounted(refState.isMounted);
      setMountedTarget(refState.isMounted ? refState.target : null);
    };
    
    // Add listener to refState
    refState.listeners.add(listener);
    
    // Cleanup
    return () => {
      refState.listeners.delete(listener);
    };
  }, [refState]);
  
  const isWaitingForMount = !isMounted && refState.mountPromise !== null;
  
  return {
    isMounted,
    isWaitingForMount,
    mountedTarget
  };
}

/**
 * Hook that provides a callback when mount state changes
 */
export function useOnMountStateChange<T>(
  refState: InternalRefState<T>,
  callback: (mounted: boolean, target: T | null) => void
): void {
  useEffect(() => {
    // Create listener
    const listener = () => {
      callback(refState.isMounted, refState.target);
    };
    
    // Add listener
    refState.listeners.add(listener);
    
    // Call initially if mounted
    if (refState.isMounted && refState.target) {
      callback(true, refState.target);
    }
    
    // Cleanup
    return () => {
      refState.listeners.delete(listener);
    };
  }, [refState, callback]);
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