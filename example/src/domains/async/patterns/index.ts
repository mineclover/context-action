/**
 * Async domain patterns
 * Centralized async pattern implementations and utilities
 */

import { createRefContext } from '@context-action/react';
import type { RefTarget } from '@context-action/react';
import { delay, timeout, retry, withFallback } from '../../shared/services';
import type { WaitForRefsConfig, AsyncPatternConfig } from '../../shared/types';

// Async Ref Context - for DOM element management and coordination
export const {
  Provider: AsyncRefProvider,
  useRefHandler: useAsyncRefHandler,
  useWaitForRefs: useAsyncWaitForRefs,
  useGetAllRefs: useAsyncGetAllRefs,
} = createRefContext<Record<string, RefTarget>>('AsyncDemo');

// Timeout Protection Patterns
// Basic timeout with simple rejection
export function basicTimeout<T>(
  promise: Promise<T>, 
  timeoutMs: number,
  timeoutMessage?: string
): Promise<T> {
  return timeout(promise, timeoutMs);
}

// Progressive timeout with increasing delays
export async function progressiveTimeout<T>(
  operation: () => Promise<T>,
  config: {
    initialTimeout: number;
    maxTimeout: number;
    timeoutMultiplier: number;
    maxRetries: number;
  }
): Promise<T> {
  let currentTimeout = config.initialTimeout;
  let attempt = 0;
  
  while (attempt <= config.maxRetries) {
    try {
      return await timeout(
        operation(),
        Math.min(currentTimeout, config.maxTimeout)
      );
    } catch (error) {
      attempt++;
      
      if (attempt > config.maxRetries) {
        throw error;
      }
      
      // Wait before retry with exponential backoff
      await delay(currentTimeout / 2);
      currentTimeout *= config.timeoutMultiplier;
    }
  }
  
  throw new Error('Max retries exceeded');
}

  // Adaptive timeout based on historical performance
  private static performanceHistory = new Map<string, number[]>();
  
  static async adaptiveTimeout<T>(
    operation: () => Promise<T>,
    operationName: string,
    config: {
      minTimeout: number;
      maxTimeout: number;
      performanceMultiplier: number;
      maxRetries: number;
    }
  ): Promise<T> {
    const history = TimeoutProtectionService.performanceHistory.get(operationName) || [];
    
    // Calculate adaptive timeout based on history
    let adaptiveTimeout: number;
    if (history.length === 0) {
      adaptiveTimeout = config.minTimeout;
    } else {
      const avgDuration = history.reduce((sum, duration) => sum + duration, 0) / history.length;
      adaptiveTimeout = Math.max(
        config.minTimeout,
        Math.min(config.maxTimeout, avgDuration * config.performanceMultiplier)
      );
    }

    const startTime = performance.now();
    
    try {
      const result = await timeout(operation(), adaptiveTimeout);
      
      // Record successful timing
      const duration = performance.now() - startTime;
      history.push(duration);
      
      // Keep only recent history
      if (history.length > 10) {
        history.shift();
      }
      TimeoutProtectionService.performanceHistory.set(operationName, history);
      
      return result;
    } catch (error) {
      // On timeout, try with increased timeout
      if (config.maxRetries > 0) {
        return TimeoutProtectionService.adaptiveTimeout(
          operation,
          operationName,
          { ...config, maxRetries: config.maxRetries - 1, minTimeout: adaptiveTimeout * 1.5 }
        );
      }
      throw error;
    }
  }
}

// Circuit Breaker Pattern for async operations
export class CircuitBreakerService {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private maxFailures: number = 5,
    private resetTimeoutMs: number = 60000
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeoutMs) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
        this.failures = 0;
      }
      
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();
      
      if (this.failures >= this.maxFailures) {
        this.state = 'OPEN';
      }
      
      throw error;
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    };
  }

  reset() {
    this.state = 'CLOSED';
    this.failures = 0;
    this.lastFailureTime = 0;
  }
}

// Real-time State Access Patterns
// Safe state access that avoids closure traps
export function createStateAccessor<T>(getState: () => T) {
  return {
    // Get current state at the moment of call
    getCurrentState: getState,
    
    // Execute callback with current state
    withCurrentState: <R>(callback: (state: T) => R): R => {
      return callback(getState());
    },
    
    // Async operation with current state
    withCurrentStateAsync: async <R>(callback: (state: T) => Promise<R>): Promise<R> => {
      return callback(getState());
    }
  };
}

// Prevent race conditions with state-based guards
export function createOperationGuard<T>(
  getState: () => T,
  guardCondition: (state: T) => boolean,
  operation: (state: T) => Promise<void>
) {
  let isRunning = false;
  
  return async (): Promise<boolean> => {
    const currentState = getState();
    
    if (isRunning || !guardCondition(currentState)) {
      return false;
    }
    
    isRunning = true;
    
    try {
      await operation(currentState);
      return true;
    } finally {
      isRunning = false;
    }
  };
}

// Wait-then-Execute Patterns
// Wait for multiple refs to be available
export async function waitForMultipleRefs(
  refKeys: string[],
  waitForRefs: (key: string) => Promise<void>,
  config?: WaitForRefsConfig
): Promise<void> {
  const promises = refKeys.map(key => 
    timeout(
      waitForRefs(key),
      config?.maxWaitTime || 5000
    )
  );
  
  await Promise.all(promises);
}

// Sequential ref operations
export async function sequentialRefOperations(
  operations: Array<{
    refKey: string;
    operation: (element: HTMLElement) => void | Promise<void>;
  }>,
  waitForRefs: (key: string) => Promise<void>,
  getRefTarget: (key: string) => HTMLElement | null,
  config?: WaitForRefsConfig
): Promise<void> {
  for (const { refKey, operation } of operations) {
    await timeout(
      waitForRefs(refKey),
      config?.maxWaitTime || 5000
    );
    
    const element = getRefTarget(refKey);
    if (!element) {
      throw new Error(`Element not found for ref: ${refKey}`);
    }
    
    await operation(element);
  }
}

// Conditional await with fallback
export async function conditionalAwait<T>(
  condition: () => boolean,
  asyncOperation: () => Promise<T>,
  fallbackOperation?: () => T | Promise<T>,
  config?: AsyncPatternConfig
): Promise<T> {
  if (condition()) {
    try {
      return await timeout(
        asyncOperation(),
        config?.timeout || 5000
      );
    } catch (error) {
      if (fallbackOperation && config?.fallback) {
        config.fallback();
        return await fallbackOperation();
      }
      throw error;
    }
  } else {
    if (fallbackOperation) {
      return await fallbackOperation();
    }
    throw new Error('Condition not met and no fallback provided');
  }
}

// Async Performance Monitoring
export class AsyncPerformanceMonitor {
  private metrics = new Map<string, {
    calls: number;
    totalDuration: number;
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
    errors: number;
    successRate: number;
  }>();

  async monitor<T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const duration = performance.now() - startTime;
      
      this.updateMetrics(operationName, duration, true);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.updateMetrics(operationName, duration, false);
      throw error;
    }
  }

  private updateMetrics(operationName: string, duration: number, success: boolean): void {
    const current = this.metrics.get(operationName) || {
      calls: 0,
      totalDuration: 0,
      avgDuration: 0,
      minDuration: Infinity,
      maxDuration: 0,
      errors: 0,
      successRate: 0
    };

    const updated = {
      calls: current.calls + 1,
      totalDuration: current.totalDuration + duration,
      avgDuration: (current.totalDuration + duration) / (current.calls + 1),
      minDuration: Math.min(current.minDuration, duration),
      maxDuration: Math.max(current.maxDuration, duration),
      errors: current.errors + (success ? 0 : 1),
      successRate: ((current.calls + 1) - (current.errors + (success ? 0 : 1))) / (current.calls + 1) * 100
    };

    this.metrics.set(operationName, updated);
  }

  getMetrics(operationName?: string) {
    if (operationName) {
      return this.metrics.get(operationName);
    }
    return Object.fromEntries(this.metrics);
  }

  clearMetrics(operationName?: string): void {
    if (operationName) {
      this.metrics.delete(operationName);
    } else {
      this.metrics.clear();
    }
  }
}

// Export instances for shared usage
export const asyncPerformanceMonitor = new AsyncPerformanceMonitor();
export const createCircuitBreaker = (maxFailures?: number, resetTimeoutMs?: number) => 
  new CircuitBreakerService(maxFailures, resetTimeoutMs);

// Async Hook Patterns
export function useAsyncOperation<T>(
  operation: () => Promise<T>,
  config?: AsyncPatternConfig
) {
  return {
    execute: async () => {
      try {
        if (config?.timeout) {
          return await timeout(operation(), config.timeout);
        }
        return await operation();
      } catch (error) {
        if (config?.onError) {
          config.onError(error as Error);
        }
        if (config?.fallback) {
          config.fallback();
        }
        throw error;
      }
    },
    
    executeWithRetry: (maxRetries: number = 3, delayMs: number = 1000) =>
      retry(operation, maxRetries, delayMs),
      
    executeWithFallback: (fallback: () => Promise<T> | T) =>
      withFallback(operation, fallback)
  };
}