/**
 * @fileoverview React integration helpers for ActionRegister
 * 
 * Provides React-specific utilities and hooks for seamless integration
 * with React components and lifecycle management.
 * 
 * Note: This file provides utilities for React integration but does not
 * have direct React dependencies. Import React types externally when used.
 */

// ActionRegister is intentionally erased in the diagnostics helper because
// it aggregates handlers from an arbitrary application action map.
// biome-ignore-all lint/suspicious/noExplicitAny: heterogeneous action maps are erased only at this runtime inspection boundary.

import type { 
  ActionPayloadMap, 
  ActionHandler, 
  HandlerConfig,
  UnregisterFunction
} from './types.js';
import type { ActionRegister } from './ActionRegister.js';

/**
 * 🔧 Create action handler registration configuration for React components
 * 
 * Creates a configuration object that can be used with React's useEffect to properly
 * register and unregister action handlers with lifecycle management and cleanup.
 * This is NOT a hook - it's a factory function for React hook integration.
 * 
 * @template T - ActionPayloadMap type
 * @template K - Action key type
 * 
 * @param registry - ActionRegister instance
 * @param action - Action name to register handler for
 * @param handler - Handler function (should be memoized with useCallback)
 * @param config - Handler configuration
 * 
 * @returns Configuration object with register/unregister functions
 * 
 * @example Basic Usage with useEffect
 * ```tsx
 * import { useCallback, useEffect } from 'react';
 * import { createActionHandler } from '@context-action/core/react-helpers';
 * 
 * function MyComponent() {
 *   const registry = useActionRegister();
 *   
 *   const handleUserUpdate = useCallback(async (payload, controller) => {
 *     // Handler logic here
 *   }, []);
 *   
 *   useEffect(() => {
 *     const { register, unregister } = createActionHandler(
 *       registry,
 *       'updateUser',
 *       handleUserUpdate,
 *       { priority: 10 }
 *     );
 *     
 *     const cleanup = register();
 *     return () => {
 *       cleanup();
 *       unregister();
 *     };
 *   }, [registry, handleUserUpdate]);
 * }
 * ```
 * 
 * @example With Automatic Cleanup
 * ```tsx
 * const [userId, setUserId] = useState('123');
 * 
 * const handleUserUpdate = useCallback(async (payload, controller) => {
 *   console.log('Updating user:', userId, payload);
 * }, [userId]);
 * 
 * useEffect(() => {
 *   const handlerManager = createActionHandler(
 *     registry,
 *     'updateUser',
 *     handleUserUpdate,
 *     { priority: 10 }
 *   );
 *   
 *   // Simplified registration with automatic cleanup
 *   return handlerManager.registerWithCleanup();
 * }, [registry, handleUserUpdate, userId]);
 * ```
 * 
 * @public
 */
export function createActionHandler<T extends ActionPayloadMap, K extends keyof T>(
  registry: ActionRegister<T>,
  action: K,
  handler: ActionHandler<T[K]>,
  config?: HandlerConfig<T[K]>
): {
  register: () => UnregisterFunction;
  unregister: () => void;
  registerWithCleanup: () => () => void;
  config: Required<HandlerConfig<T[K]>>;
} {
  // Inline React-optimized handler configuration
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 5);
  
  const finalConfig: Required<HandlerConfig<T[K]>> = {
    priority: config?.priority ?? 0,
    id: config?.id || `react_${String(action)}_${timestamp}_${random}`,
    blocking: config?.blocking ?? false,
    once: config?.once ?? false,
    debounce: config?.debounce ?? undefined,
    throttle: config?.throttle ?? undefined,
    // React-optimized defaults
    replaceExisting: true, // Always replace in React (handles HMR/remounting)
  } as Required<HandlerConfig<T[K]>>;
  let currentUnregister: UnregisterFunction | undefined;
  let isRegistered = false;
  
  return {
    /**
     * Register the handler and return cleanup function
     */
    register(): UnregisterFunction {
      if (isRegistered && currentUnregister) {
        // Clean up previous registration
        currentUnregister();
      }
      
      currentUnregister = registry.register(action, handler, finalConfig);
      isRegistered = true;
      
      return currentUnregister;
    },
    
    /**
     * Unregister the handler if currently registered
     */
    unregister(): void {
      if (isRegistered && currentUnregister) {
        currentUnregister();
        currentUnregister = undefined;
        isRegistered = false;
      }
    },
    
    /**
     * Register and return cleanup function (React useEffect pattern)
     */
    registerWithCleanup(): () => void {
      const unregisterFn = this.register();
      
      return () => {
        unregisterFn();
        this.unregister();
      };
    },
    
    config: finalConfig
  };
}


/**
 * 🆕 React development utilities
 * 
 * Provides debugging and development helpers specifically for React environments.
 */
export const ReactDevUtils = {
  /**
   * Enable detailed React integration debugging
   */
  enableDebugMode(): void {
    if (typeof window !== 'undefined') {
      (window as any).__CONTEXT_ACTION_REACT_DEBUG__ = true;
    }
  },

  /**
   * Disable React integration debugging
   */
  disableDebugMode(): void {
    if (typeof window !== 'undefined') {
      (window as any).__CONTEXT_ACTION_REACT_DEBUG__ = false;
    }
  },

  /**
   * Check if React debug mode is enabled
   */
  isDebugMode(): boolean {
    return typeof window !== 'undefined' && 
           Boolean((window as any).__CONTEXT_ACTION_REACT_DEBUG__);
  },

  /**
   * Log React-specific debugging information
   */
  log(component: string, action: string, message: string, data?: unknown): void {
    if (this.isDebugMode()) {
      console.log(`🎯 [React-ActionRegister] [${component}] ${action}: ${message}`, data || '');
    }
  },

  /**
   * Get React integration statistics
   */
  getStats(registry: ActionRegister<any>): {
    totalHandlers: number;
    reactHandlers: number;
    registryInfo: ReturnType<ActionRegister<any>['getRegistryInfo']>;
  } {
    const registryInfo = registry.getRegistryInfo();
    
    // Count React handlers (handlers with 'react' in their ID)
    let reactHandlers = 0;
    registry.getRegisteredActions().forEach((action: keyof any) => {
      const stats = registry.getActionStats(action);
      if (stats) {
        stats.handlersByPriority.forEach((priorityGroup: any) => {
          priorityGroup.handlers.forEach((handler: any) => {
            if (handler.id.includes('react')) {
              reactHandlers++;
            }
          });
        });
      }
    });

    return {
      totalHandlers: registryInfo.totalHandlers,
      reactHandlers,
      registryInfo
    };
  }
};

/**
 * 🆕 React Error Boundary integration
 * 
 * Utilities for integrating ActionRegister errors with React Error Boundaries.
 */
export class ReactActionError extends Error {
  public readonly action: string;
  public readonly payload?: unknown;
  public readonly handlerId: string | undefined;
  public readonly timestamp: number;

  constructor(
    message: string,
    action: string,
    payload?: unknown,
    handlerId: string | undefined = undefined,
    originalError?: Error
  ) {
    super(message);
    this.name = 'ReactActionError';
    this.action = action;
    this.payload = payload;
    this.handlerId = handlerId;
    this.timestamp = Date.now();

    // Maintain original error stack if available
    if (originalError?.stack) {
      this.stack = originalError.stack;
    }
  }

  /**
   * Create a React Error Boundary compatible error
   */
  static fromActionError(
    originalError: Error,
    action: string,
    payload?: unknown,
    handlerId?: string
  ): ReactActionError {
    return new ReactActionError(
      `Action '${action}' failed: ${originalError.message}`,
      action,
      payload,
      handlerId,
      originalError
    );
  }
}

/**
 * 🆕 Type guard for React Action Errors
 * 
 * @param error - Error to check
 * @returns True if error is a ReactActionError
 */
export function isReactActionError(error: unknown): error is ReactActionError {
  return error instanceof ReactActionError;
}
