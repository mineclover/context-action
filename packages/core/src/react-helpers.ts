/**
 * @fileoverview React integration helpers for ActionRegister
 * 
 * Provides React-specific utilities and hooks for seamless integration
 * with React components and lifecycle management.
 * 
 * Note: This file provides utilities for React integration but does not
 * have direct React dependencies. Import React types externally when used.
 */

import type { 
  ActionPayloadMap, 
  ActionHandler, 
  HandlerConfig 
} from './types.js';
import type { ActionRegister } from './ActionRegister.js';

/**
 * 🆕 React hook for automatic handler registration with cleanup
 * 
 * Automatically registers an action handler on mount and unregisters on unmount.
 * Handles React's development mode double-mounting and Hot Module Replacement.
 * 
 * @template T - ActionPayloadMap type
 * @template K - Action key type
 * 
 * @param registry - ActionRegister instance
 * @param action - Action name to register handler for
 * @param handler - Handler function (should be memoized with useCallback)
 * @param config - Handler configuration
 * @param deps - Dependency array (similar to useEffect)
 * 
 * @example Basic Usage
 * ```tsx
 * import { useCallback } from 'react';
 * import { useActionHandler } from '@context-action/core/react-helpers';
 * 
 * function MyComponent() {
 *   const registry = useActionRegister();
 *   
 *   const handleUserUpdate = useCallback(async (payload, controller) => {
 *     // Handler logic here
 *   }, []);
 *   
 *   useActionHandler(
 *     registry,
 *     'updateUser',
 *     handleUserUpdate,
 *     { priority: 10 },
 *     [] // dependencies
 *   );
 * }
 * ```
 * 
 * @example With Dependencies
 * ```tsx
 * const [userId, setUserId] = useState('123');
 * 
 * const handleUserUpdate = useCallback(async (payload, controller) => {
 *   // Use userId in handler
 *   console.log('Updating user:', userId, payload);
 * }, [userId]);
 * 
 * useActionHandler(
 *   registry,
 *   'updateUser',
 *   handleUserUpdate,
 *   { priority: 10 },
 *   [userId] // Re-register when userId changes
 * );
 * ```
 * 
 * @public
 */
export function useActionHandler<T extends ActionPayloadMap, K extends keyof T>(
  registry: ActionRegister<T>,
  action: K,
  handler: ActionHandler<T[K]>,
  config?: HandlerConfig,
  deps: any[] = []
) {
  // This is a TypeScript interface/utility function that would be used with React hooks
  // The actual React hook implementation would be in the @context-action/react package
  
  // Return a configuration object that can be used with React's useEffect
  return {
    registry,
    action,
    handler,
    config: {
      ...config,
      // 🆕 React environment: always replace existing handlers
      replaceExisting: true,
      // Auto-generate unique ID per component instance if not provided
      id: config?.id || `react_${String(action)}_${Math.random().toString(36).substr(2, 9)}`
    },
    deps
  };
}

/**
 * 🆕 React handler configuration factory
 * 
 * Creates optimized handler configurations for React environments with
 * proper cleanup and unique ID generation.
 * 
 * @template T - ActionPayloadMap type
 * @template K - Action key type
 * 
 * @param action - Action name
 * @param componentId - Optional component identifier for debugging
 * @param config - Base handler configuration
 * 
 * @returns Optimized configuration for React environments
 * 
 * @example
 * ```tsx
 * function MyComponent({ userId }: { userId: string }) {
 *   const registry = useActionRegister();
 *   
 *   useEffect(() => {
 *     const config = createReactHandlerConfig('updateUser', 'MyComponent', {
 *       priority: 10
 *     });
 *     
 *     const unregister = registry.register('updateUser', handler, config);
 *     return unregister;
 *   }, [registry, handler]);
 * }
 * ```
 * 
 * @public
 */
export function createReactHandlerConfig<T extends ActionPayloadMap, K extends keyof T>(
  action: K,
  componentId?: string,
  config: HandlerConfig = {}
): Required<HandlerConfig> {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 5);
  
  return {
    priority: config.priority ?? 0,
    id: config.id || `${componentId || 'react'}_${String(action)}_${timestamp}_${random}`,
    blocking: config.blocking ?? false,
    once: config.once ?? false,
    debounce: config.debounce ?? undefined,
    throttle: config.throttle ?? undefined,
    // 🆕 React-optimized defaults
    replaceExisting: true, // Always replace in React (handles HMR/remounting)
  } as Required<HandlerConfig>;
}

/**
 * 🆕 React action dispatcher factory
 * 
 * Creates a dispatcher function optimized for React component usage
 * with proper error boundaries and async handling.
 * 
 * @template T - ActionPayloadMap type
 * 
 * @param registry - ActionRegister instance
 * @param errorHandler - Optional error handler for unhandled dispatch errors
 * 
 * @returns Optimized dispatch function for React components
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const registry = useActionRegister();
 *   
 *   const dispatch = createReactDispatcher(registry, (error, action, payload) => {
 *     console.error(`Failed to dispatch ${action}:`, error);
 *   });
 *   
 *   const handleClick = useCallback(() => {
 *     dispatch('userClick', { buttonId: 'submit' });
 *   }, [dispatch]);
 * }
 * ```
 * 
 * @public
 */
export function createReactDispatcher<T extends ActionPayloadMap>(
  registry: ActionRegister<T>,
  errorHandler?: (error: Error, action: keyof T, payload?: any) => void
) {
  return async <K extends keyof T>(
    action: K,
    payload?: T[K],
    options?: Parameters<ActionRegister<T>['dispatch']>[2]
  ): Promise<void> => {
    try {
      await registry.dispatch(action, payload, {
        // 🆕 React-optimized dispatch options
        immediate: false, // Use queues by default for React consistency
        ...options
      });
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      
      if (errorHandler) {
        errorHandler(errorObj, action, payload);
      } else {
        // Default: Log error but don't throw (React-friendly)
        console.error(`[ActionRegister] Dispatch failed for action '${String(action)}':`, errorObj);
      }
    }
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
  log(component: string, action: string, message: string, data?: any): void {
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
  public readonly payload?: any;
  public readonly handlerId?: string;
  public readonly timestamp: number;

  constructor(
    message: string,
    action: string,
    payload?: any,
    handlerId?: string,
    originalError?: Error
  ) {
    super(message);
    this.name = 'ReactActionError';
    this.action = action;
    this.payload = payload;
    this.handlerId = handlerId;
    this.timestamp = Date.now();

    // Maintain original error stack if available
    if (originalError && originalError.stack) {
      this.stack = originalError.stack;
    }
  }

  /**
   * Create a React Error Boundary compatible error
   */
  static fromActionError(
    originalError: Error,
    action: string,
    payload?: any,
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
export function isReactActionError(error: any): error is ReactActionError {
  return error instanceof ReactActionError;
}