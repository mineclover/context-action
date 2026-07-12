
/**
 * Action payload mapping interface for type-safe action dispatching
 * 
 * Defines the mapping between action names and their corresponding payload types.
 * This interface serves as the foundation for type-safe action handling throughout
 * the Context-Action framework.
 * 
 * @see https://mineclover.github.io/context-action/en/guide/patterns/action/type-system
 * 
 * @public
 */
/**
 * Marker type for action payload maps.
 *
 * Deliberately does not declare a string index signature: adding one would
 * widen `keyof` to `string | number` and make unknown action names compile.
 * Applications extend this type from an interface with literal action keys.
 */
export type ActionPayloadMap = object;

/**
 * Strict action payload map that prevents certain problematic types
 */
export type StrictActionPayloadMap = {
  readonly [K in string]: Exclude<unknown, Function | symbol>;
};

/**
 * Brand type utilities for enhanced type safety
 */
declare const __brand: unique symbol;

/**
 * Creates a branded type for nominal typing
 */
export type Brand<T, B extends string> = T & { readonly [__brand]: B };

/**
 * Branded action key for type safety
 */
export type ActionKey<T extends string = string> = Brand<T, 'ActionKey'>;

/**
 * Branded store identifier for type safety
 */
export type StoreId<T extends string = string> = Brand<T, 'StoreId'>;

/**
 * Branded handler identifier for type safety
 */
export type HandlerId<T extends string = string> = Brand<T, 'HandlerId'>;

/**
 * Creates an action key with type branding
 */
export function createActionKey<T extends string>(key: T): ActionKey<T> {
  return key as ActionKey<T>;
}

/**
 * Creates a store ID with type branding
 */
export function createStoreId<T extends string>(id: T): StoreId<T> {
  return id as StoreId<T>;
}

/**
 * Creates a handler ID with type branding
 */
export function createHandlerId<T extends string>(id: T): HandlerId<T> {
  return id as HandlerId<T>;
}

/**
 * Valid result strategies for type safety
 */
export type ValidResultStrategy = 'first' | 'last' | 'all' | 'merge' | 'custom';

/**
 * Advanced type utilities for result processing with strict constraints
 */
export type ResultStrategyType<Strategy extends ValidResultStrategy, R> =
  Strategy extends 'all'
    ? readonly R[]
    : Strategy extends 'first' | 'last'
      ? R | undefined
      : Strategy extends 'merge' | 'custom'
        ? R
        : never;

/**
 * Infer result type based on strategy and collect options
 */
export type InferResultType<
  R,
  Options extends { strategy?: string; collect?: boolean } | undefined
> = Options extends { strategy: infer Strategy }
  ? Strategy extends ValidResultStrategy
    ? ResultStrategyType<Strategy, R>
    : R
  : Options extends { collect: true }
    ? readonly R[]
    : R;

/**
 * Advanced type-level utilities for Context-Action framework
 */
export namespace TypeUtils {
  /**
   * Extracts payload type for a specific action
   */
  export type ExtractPayload<T extends ActionPayloadMap, K extends keyof T> = T[K];

  /**
   * Ensures all values in an object are of the same type
   */
  export type Homogeneous<T, U> = {
    readonly [K in keyof T]: U;
  };

  /**
   * Makes specific properties required
   */
  export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

  /**
   * Makes specific properties optional
   */
  export type PartialFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

  /**
   * Deep readonly type for immutable structures
   */
  export type DeepReadonly<T> = {
    readonly [P in keyof T]: T[P] extends (infer U)[]
      ? readonly DeepReadonly<U>[]
      : T[P] extends readonly (infer U)[]
        ? readonly DeepReadonly<U>[]
        : T[P] extends Record<string, unknown>
          ? DeepReadonly<T[P]>
          : T[P];
  };

  /**
   * Strict non-nullable type
   */
  export type NonNullable<T> = T extends null | undefined ? never : T;

  /**
   * Type-safe key extraction
   */
  export type KeysOfType<T, U> = {
    [K in keyof T]: T[K] extends U ? K : never;
  }[keyof T];

  /**
   * Function parameter extraction
   */
  export type Parameters<T> = T extends (...args: infer P) => unknown ? P : never;

  /**
   * Function return type extraction
   */
  export type ReturnType<T> = T extends (...args: unknown[]) => infer R ? R : never;

  /**
   * Promise unwrapping
   */
  export type Awaited<T> = T extends Promise<infer U> ? U : T;
}

/**
 * Utility type to extract action names from ActionPayloadMap
 * 
 * @template T - The ActionPayloadMap interface
 * @example
 * ```typescript
 * type MyActions = ActionNames<AppActions> // 'updateUser' | 'deleteUser' | 'resetUser'
 * ```
 */
export type ActionNames<T extends ActionPayloadMap> = keyof T;

/**
 * Utility type to extract payload type for a specific action
 * 
 * @template T - The ActionPayloadMap interface  
 * @template K - The action name
 * @example
 * ```typescript
 * type UpdateUserPayload = ActionPayload<AppActions, 'updateUser'>
 * // { id: string; name: string; email: string }
 * ```
 */
export type ActionPayload<T extends ActionPayloadMap, K extends keyof T> = T[K];

/**
 * Pipeline controller interface for managing execution flow and payload modification
 * 
 * Provides action handlers with powerful control over the action pipeline execution,
 * including the ability to abort execution, modify payloads, jump to specific priorities,
 * and manage results. This is the primary interface for implementing business logic
 * within action handlers.
 * 
 * @template T - The payload type for this action
 * @template R - The result type for this action
 * 
 * @example Basic Pipeline Control
 * ```typescript
 * register.register('validateAndProcess', async (payload, controller) => {
 *   // Input validation
 *   if (!payload.email.includes('@')) {
 *     controller.abort('Invalid email format')
 *     return
 *   }
 *   
 *   // Process and modify payload for next handlers
 *   controller.modifyPayload(data => ({
 *     ...data,
 *     processed: true,
 *     timestamp: Date.now(),
 *     normalized: data.email.toLowerCase()
 *   }))
 *   
 *   // Set intermediate result
 *   controller.setResult({ validated: true, userId: payload.id })
 * })
 * ```
 * 
 * @example Early Return with Result
 * ```typescript
 * register.register('checkCache', async (payload, controller) => {
 *   const cached = await cache.get(payload.key)
 *   
 *   if (cached) {
 *     // Return early and skip remaining handlers
 *     controller.return({ source: 'cache', data: cached })
 *     return
 *   }
 *   
 *   // Continue to next handlers if not cached
 * })
 * ```
 * 
 * @example Priority Jumping
 * ```typescript
 * register.register('securityCheck', async (payload, controller) => {
 *   if (payload.requiresElevatedPermissions) {
 *     // Jump to high-priority security handlers
 *     controller.jumpToPriority(1000)
 *   }
 * }, { priority: 50 })
 * ```
 * 
 * @public
 */
export interface PipelineController<T = any, R = void> {
  /**
   * Signal for the current dispatch lifecycle.
   *
   * Handlers should observe this signal when they can stop cooperatively. It is
   * aborted by caller cancellation, timeout, provider teardown, or registry
   * shutdown.
   */
  readonly signal?: AbortSignal;

  /** Abort the pipeline execution with an optional reason */
  abort(reason?: string): void;
  
  /** Modify the payload that will be passed to subsequent handlers */
  modifyPayload(modifier: (payload: T) => T): void;
  
  /** Get the current payload */
  getPayload(): T;

  /**
   * Jump to a specific priority level in the pipeline
   *
   * ⚠️ **WARNING**: Backward jumps (to higher priority handlers) can cause infinite loops!
   * Always use with a `condition` in the target handler to prevent re-execution.
   *
   * The system will automatically abort after 10 jumps (configurable) to prevent infinite loops.
   *
   * @param priority - The priority level to jump to (finds first handler with priority <= this value)
   *
   * @example Safe retry pattern with condition
   * ```typescript
   * let retryCount = 0;
   *
   * register.register('process', (payload, controller) => {
   *   retryCount++;
   *   if (shouldRetry() && retryCount < 3) {
   *     controller.jumpToPriority(100); // Jump back to validation
   *   }
   * }, { priority: 50 });
   *
   * register.register('validate', (payload) => {
   *   // Validation logic
   * }, {
   *   priority: 100,
   *   condition: () => retryCount === 0 // Only run on first attempt
   * });
   * ```
   */
  jumpToPriority(priority: number): void;
  
  // New result handling methods
  /** Return a result and terminate the pipeline */
  return(result: R): void;
  
  /** Set a result but continue pipeline execution */
  setResult(result: R): void;
  
  /** Get all results from previously executed handlers */
  getResults(): R[];
  
  /** Merge current result with previous results using a custom merger function */
  mergeResult(merger: (previousResults: R[], currentResult: R) => R): void;
}

/**
 * Action handler function type for processing actions within the pipeline
 * 
 * Defines the signature for action handler functions that contain the business logic
 * for processing specific actions. Handlers follow the Store Integration Pattern:
 * 1. Read current state from stores
 * 2. Execute business logic
 * 3. Update stores with new state
 * 
 * @template T - The payload type for this action
 * @template R - The return type for this handler
 * 
 * @param payload - The action payload data
 * @param controller - Pipeline controller for managing execution flow
 * 
 * @returns The result value or Promise resolving to result
 * 
 * @example Store Integration Pattern
 * ```typescript
 * const updateUserHandler: ActionHandler<{id: string, name: string, email: string}> = 
 *   async (payload, controller) => {
 *     // 1. Read current state from stores
 *     const currentUser = userStore.getValue()
 *     const settings = settingsStore.getValue()
 *     
 *     // 2. Execute business logic
 *     if (!settings.allowUserUpdates) {
 *       controller.abort('User updates are disabled')
 *       return
 *     }
 *     
 *     const updatedUser = {
 *       ...currentUser,
 *       ...payload,
 *       updatedAt: new Date().toISOString()
 *     }
 *     
 *     // 3. Update stores
 *     userStore.setValue(updatedUser)
 *     
 *     // Set result for other handlers or components
 *     controller.setResult({ success: true, user: updatedUser })
 *   }
 * ```
 * 
 * @example Async Handler with Error Handling
 * ```typescript
 * const saveUserHandler: ActionHandler<UserData, SaveResult> = 
 *   async (payload, controller) => {
 *     try {
 *       const result = await userService.save(payload)
 *       
 *       // Update local store with server response
 *       userStore.setValue(result.user)
 *       
 *       return { success: true, userId: result.user.id }
 *     } catch (error) {
 *       controller.abort(`Save failed: ${error.message}`)
 *       return { success: false, error: error.message }
 *     }
 *   }
 * ```
 * 
 * @public
 */
export type ActionHandler<T = any, R = void> = (
  payload: T,
  controller: PipelineController<T, R>
) => R | Promise<R> | void | Promise<void>;

/**
 * Handler configuration interface for controlling handler behavior within the pipeline
 * 
 * Configuration options that control how handlers are executed,
 * including priority, timing controls, and execution behavior.
 * 
 * @example Basic Handler Configuration
 * ```typescript
 * register.register('searchUsers', searchHandler, {
 *   priority: 100,                    // Execute before lower priority handlers
 *   debounce: 300,                   // Wait 300ms after last call
 *   throttle: 1000,                  // Limit to once per second
 *   once: false                      // Can be executed multiple times
 * })
 * ```
 * 
 * @example Production Handler
 * ```typescript
 * register.register('processPayment', paymentHandler, {
 *   priority: 200,
 *   blocking: true,                  // Wait for completion
 *   id: 'payment-handler'           // Custom ID
 * })
 * ```
 * 
 * @public
 */
export interface HandlerConfig<T = unknown> {
  /** Priority level (higher numbers execute first). Default: 0 */
  priority?: number;
  
  /** Unique identifier for the handler. Auto-generated if not provided */
  id?: string;
  
  /** Whether to wait for async handlers to complete. Default: false */
  blocking?: boolean;
  
  /** Whether this handler should run once and then be removed. Default: false */
  once?: boolean;
  
  /** Debounce delay in milliseconds */
  debounce?: number;
  
  /** Throttle delay in milliseconds */
  throttle?: number;
  
  /** Replace existing handler with same ID. Default: false for backward compatibility */
  replaceExisting?: boolean;
  
  /** Cleanup function to call when handler is unregistered */
  cleanup?: () => void;

  /** Condition function to determine if handler should execute. Default: always execute */
  condition?: (payload: T) => boolean;
}


/**
 * Internal handler registration container
 * 
 * Contains the registered handler function along with its complete configuration
 * and unique identifier. This is used internally by ActionRegister to manage
 * the handler pipeline.
 * 
 * @template T - The payload type for this handler
 * @template R - The return type for this handler
 * 
 * @internal
 */
export interface HandlerRegistration<T = any, R = void> {
  /** The handler function */
  handler: ActionHandler<T, R>;
  
  /** Complete handler configuration with all defaults applied */
  config: Required<HandlerConfig<T>>;
  
  /** Unique identifier for this handler registration */
  id: string;
}

/**
 * Execution mode for action handler pipeline
 * 
 * Determines how multiple handlers for the same action are executed:
 * - `sequential`: Handlers execute one after another in priority order
 * - `parallel`: All handlers execute simultaneously
 * - `race`: First handler to complete wins; other started handlers keep running
 *   and remain tracked until they settle
 * 
 * @example
 * ```typescript
 * // Sequential execution (default)
 * register.setActionExecutionMode('updateUser', 'sequential')
 * 
 * // Parallel execution for independent operations
 * register.setActionExecutionMode('logEvent', 'parallel')
 * 
 * // Race execution for fastest response
 * register.setActionExecutionMode('fetchData', 'race')
 * ```
 * 
 * @public
 */
export type ExecutionMode = 'sequential' | 'parallel' | 'race';

/**
 * Internal pipeline execution context
 * 
 * Contains the state and metadata for a single action pipeline execution.
 * This includes the action payload, registered handlers, execution progress,
 * and result collection.
 * 
 * @template T - The payload type for this execution
 * @template R - The result type for this execution
 * 
 * @internal
 */
export interface PipelineContext<T = any, R = void> {
  /** The action name being executed */
  action: string;
  
  /** The payload for this execution */
  payload: T;
  
  /** Handlers to execute in this pipeline */
  handlers: HandlerRegistration<T, R>[];

  /** Registrations whose handler functions were actually invoked */
  executedHandlers?: HandlerRegistration<T, R>[];

  /** Defer once-handler removal to the outer retry lifecycle */
  deferOnceCleanup?: boolean;

  /** Effective signal shared with controllers for cooperative cancellation */
  signal?: AbortSignal;

  /** Track handler work that may outlive the exposed dispatch promise */
  trackHandlerPromise?<V>(promise: Promise<V>): Promise<V>;
  
  /** Whether execution has been aborted */
  aborted: boolean;
  
  /** Reason for abortion if aborted */
  abortReason: string | undefined;
  
  /** Current handler index being executed */
  currentIndex: number;
  
  /** Priority level to jump to (if requested) */
  jumpToPriority: number | undefined;

  /** Counter for jump operations to detect potential infinite loops */
  jumpCount?: number;

  /** Maximum allowed jumps before aborting (to prevent infinite loops) */
  maxJumps?: number;

  /** Execution mode for this pipeline */
  executionMode: ExecutionMode;
  
  /** Results collected from handlers */
  results: R[];
  
  /** Whether execution was terminated early */
  terminated: boolean;
  
  /** Result from terminated execution */
  terminationResult: R | undefined;
}

/**
 * Configuration options for ActionRegister initialization
 * 
 * Provides comprehensive configuration options for customizing ActionRegister
 * behavior including debugging, execution modes, and cleanup policies.
 * 
 * @example Basic Configuration
 * ```typescript
 * const register = new ActionRegister<AppActions>({
 *   name: 'UserActionRegister',
 *   registry: {
 *     debug: true,
 *     defaultExecutionMode: 'sequential'
 *   }
 * })
 * ```
 * 
 * @example Development Configuration
 * ```typescript
 * const devRegister = new ActionRegister<AppActions>({
 *   name: 'DevRegister',
 *   registry: {
 *     debug: process.env.NODE_ENV === 'development',
 *     autoCleanup: true,
 *     defaultExecutionMode: 'parallel'
 *   }
 * })
 * ```
 * 
 * @public
 */
export interface ActionRegisterConfig {
  /** Name identifier for this ActionRegister instance */
  name?: string;
  
  /** Registry-specific configuration options */
  registry?: {
    /** Debug mode for registry operations - enables detailed logging */
    debug?: boolean;

    /** Auto-cleanup configuration for one-time handlers */
    autoCleanup?: boolean;

    /** Default execution mode for actions */
    defaultExecutionMode?: ExecutionMode;

    /** Use concurrency queue for thread safety. Default: true */
    useConcurrencyQueue?: boolean;

    /** Maximum number of handlers per action. Default: 1000. Use Infinity to disable limit (not recommended) */
    maxHandlersPerAction?: number;

    /** Global error handler for unhandled errors */
    errorHandler?: (error: Error, context: unknown) => void | Promise<void>;

    // ---- Zod Schema Validation Options (optional) ----

    /**
     * Action schema map for runtime payload validation
     * When provided, enables Zod-based validation on dispatch
     * @see ActionSchemaMap from './action-schema'
     */
    schema?: import('./action-schema').ActionSchemaMap;

    /**
     * Enable/disable validation on dispatch
     * Default: true when schema is provided
     */
    validateOnDispatch?: boolean;

    /**
     * Validation mode when schema validation fails
     * - 'strict': throw ActionValidationError (default)
     * - 'warn': console.warn and continue execution
     * - 'silent': ignore validation errors silently
     */
    validationMode?: 'strict' | 'warn' | 'silent';
  };
}

/**
 * Comprehensive dispatch options for controlling action execution
 * 
 * Provides fine-grained control over how actions are dispatched and executed,
 * including timing controls, handler filtering, result processing, and abort handling.
 * 
 * @example Basic Dispatch Options
 * ```typescript
 * await register.dispatch('searchUsers', { query: 'john' }, {
 *   debounce: 300,     // Wait 300ms after last call
 *   throttle: 1000,    // Limit to once per second
 *   executionMode: 'parallel'
 * })
 * ```
 * 
 * @example Handler Filtering
 * ```typescript
 * await register.dispatch('updateUser', userData, {
 *   filter: {
 *     tags: ['validation', 'business-logic'],  // Only these tags
 *     excludeCategory: 'analytics',            // Skip analytics handlers
 *     environment: 'production'                // Production handlers only
 *   }
 * })
 * ```
 * 
 * @example Result Collection
 * ```typescript
 * const result = await register.dispatchWithResult('processOrder', order, {
 *   result: {
 *     collect: true,
 *     strategy: 'merge',
 *     maxResults: 5,
 *     merger: (results) => results.reduce((acc, curr) => ({ ...acc, ...curr }), {})
 *   }
 * })
 * ```
 * 
 * @example Abort Control
 * ```typescript
 * const controller = new AbortController()
 * 
 * // Auto-abort with custom controller
 * await register.dispatch('longRunningTask', data, {
 *   autoAbort: {
 *     enabled: true,
 *     allowHandlerAbort: true,
 *     onControllerCreated: (ctrl) => {
 *       setTimeout(() => ctrl.abort('Timeout'), 5000)
 *     }
 *   }
 * })
 * ```
 * 
 * @public
 */
export interface DispatchOptions {
  /** Debounce delay in milliseconds - wait for this delay after last call */
  debounce?: number;
  
  /** Throttle delay in milliseconds - limit execution to once per this period */
  throttle?: number;
  
  /** Execution mode override for this specific dispatch */
  executionMode?: ExecutionMode;
  
  /** Abort signal for cancelling the dispatch */
  signal?: AbortSignal;
  
  /** Bypass queue and execute immediately */
  immediate?: boolean;
  
  /** Priority in dispatch queue (higher = earlier execution) */
  queuePriority?: number;
  
  /**
   * Wall-clock timeout in milliseconds, including queue wait and retry delay.
   * Rejects with ActionTimeoutError and aborts the dispatch signal.
   */
  timeout?: number;
  
  /** Retry configuration for error recovery */
  retryOnError?: {
    /** Maximum total attempts, including the initial attempt. Minimum: 1 */
    maxAttempts: number;
    /** Delay between retries in milliseconds */
    delay: number;
  };
  
  /** Auto-abort options for automatic AbortController management */
  autoAbort?: {
    /** Create and manage AbortController automatically */
    enabled: boolean;
    
    /** Provide access to the created AbortController */
    onControllerCreated?: (controller: AbortController) => void;
    
    /** Enable pipeline abort trigger from handlers */
    allowHandlerAbort?: boolean;
  };
  
  /** Handler filtering options */
  filter?: {
    /** Only execute handlers with these IDs */
    handlerIds?: string[];
    
    /** Exclude handlers with these IDs */
    excludeHandlerIds?: string[];
    
    /** Priority-based filtering */
    priority?: {
      /** Minimum priority threshold */
      min?: number;
      /** Maximum priority threshold */
      max?: number;
    };
    
    /** Custom filter function */
    custom?: (config: Required<HandlerConfig>) => boolean;
  };
  
  /** Result collection and processing options */
  result?: {
    /** How to handle multiple results */
    strategy?: 'first' | 'last' | 'all' | 'merge' | 'custom';
    
    /** Custom result merger function (used with 'merge' or 'custom' strategy) */
    merger?: <R>(results: Array<R | undefined>) => R;
    
    /** Whether to collect results from all handlers */
    collect?: boolean;
    
    /** Maximum number of results to collect */
    maxResults?: number;
    
    /** Include errors in results */
    includeErrors?: boolean;
  };
}

/**
 * Comprehensive result of pipeline execution with detailed execution information
 * 
 * Contains complete information about the pipeline execution including success status,
 * results, handler details, and any errors that occurred.
 * 
 * @template R - The result type for this execution
 * 
 * @example Basic Result Handling
 * ```typescript
 * const result = await register.dispatchWithResult('updateUser', userData)
 * 
 * if (result.success) {
 *   console.log(`Execution completed in ${result.execution.duration}ms`)
 *   console.log(`${result.execution.handlersExecuted} handlers executed`)
 * } else {
 *   console.error('Execution failed:', result.abortReason)
 * }
 * ```
 * 
 * @example Advanced Result Processing
 * ```typescript
 * const result = await register.dispatchWithResult('processOrder', order, {
 *   result: { collect: true, strategy: 'all' }
 * })
 * 
 * // Access all handler results - now properly typed
 * result.successResults.forEach((handlerResult, index) => {
 *   console.log(`Handler ${index} result:`, handlerResult)
 * })
 * 
 * // Check individual handler performance
 * result.handlers.forEach(handler => {
 *   if (handler.duration && handler.duration > 1000) {
 *     console.warn(`Slow handler ${handler.id}: ${handler.duration}ms`)
 *   }
 * })
 * ```
 * 
 * @public
 */
export interface ExecutionResult<R = void> {
  /** Whether the execution completed successfully */
  success: boolean;
  
  /** Whether the execution was aborted */
  aborted: boolean;
  
  /** Reason for abortion if aborted */
  abortReason: string | undefined;
  
  /** Whether the execution was terminated early via controller.return() */
  terminated: boolean;

  /** Runtime payload validation outcome when a schema was configured */
  validation?: {
    passed: boolean;
    errors: string[];
  };
  
  /** Final result based on result strategy - only present for non-void results */
  result: R | R[] | undefined;
  
  /** 🔧 Type safety fix: Separate successful results from failed ones */
  /** All successful handler results (guaranteed non-undefined) */
  successResults: R[];
  
  /** All handler results including undefined from failed handlers (legacy compatibility) */
  results: Array<R | undefined>;
  
  /** Failed handler results with error context */
  failedResults: Array<{
    handlerId: string;
    error: Error;
    expectedType: string;
  }>;
  
  /** Execution metadata */
  execution: {
    /** Total execution duration in milliseconds */
    duration: number;
    
    /** Number of handlers that were executed */
    handlersExecuted: number;
    
    /** Number of handlers that were skipped */
    handlersSkipped: number;
    
    /** Number of handlers that failed */
    handlersFailed: number;
    
    /** Execution start timestamp */
    startTime: number;
    
    /** Execution end timestamp */
    endTime: number;
  };
  
  /** Detailed information about each handler */
  handlers: Array<{
    /** Handler unique identifier */
    id: string;
    
    /** Whether this handler was executed */
    executed: boolean;
    
    /** Handler execution duration in milliseconds (only present if executed) */
    duration: number | undefined;
    
    /** Result returned by this handler - properly typed for success/failure */
    result: R | undefined;
    
    /** Error thrown by this handler if any */
    error: Error | undefined;
    
    /** Custom metadata for this handler */
    metadata: Record<string, any> | undefined;
  }>;
  
  /** Errors that occurred during execution */
  errors: HandlerError[];
}

/**
 * Handler error information for unified error handling
 * 
 * @public
 */
export interface HandlerError {
  handlerId: string;
  error: Error;
  timestamp: number;
  severity: 'blocking' | 'non-blocking';
}

/**
 * Function type for unregistering action handlers
 * 
 * Returned by the register method to allow removal of specific handlers.
 * Calling this function removes the handler from the action pipeline.
 * 
 * @example
 * ```typescript
 * const unregister = register.register('updateUser', userHandler)
 * 
 * // Later, remove the handler
 * unregister()
 * ```
 * 
 * @public
 */
export type UnregisterFunction = () => void;

/**
 * Helper types for better ActionDispatcher type safety
 */
type VoidActions<T extends ActionPayloadMap> = {
  [K in keyof T]: T[K] extends void | undefined ? K : never
}[keyof T];

type PayloadActions<T extends ActionPayloadMap> = {
  [K in keyof T]: T[K] extends void | undefined ? never : K
}[keyof T];

/**
 * Type-safe dispatchWithResult interface
 * 
 * Provides type-safe method overloads for dispatchWithResult operations
 * that maintain payload type checking while returning ExecutionResult.
 * 
 * @template T - The action payload map interface
 */
export interface ActionDispatcherWithResult<T extends ActionPayloadMap> {
  /** Dispatch an action that doesn't require a payload and get result */
  <K extends VoidActions<T>, R = any>(
    action: K,
    options?: DispatchOptions
  ): Promise<ExecutionResult<R>>;
  
  /** Dispatch an action with optional payload parameter and get result */
  <K extends VoidActions<T>, R = any>(
    action: K,
    payload?: undefined,
    options?: DispatchOptions
  ): Promise<ExecutionResult<R>>;
  
  /** Dispatch an action that requires a payload and get result */
  <K extends PayloadActions<T>, R = any>(
    action: K,
    payload: T[K],
    options?: DispatchOptions
  ): Promise<ExecutionResult<R>>;
}

/**
 * Type-safe action dispatcher interface
 * 
 * Provides overloaded dispatch methods that enforce correct payload types
 * based on the action being dispatched. Automatically handles actions
 * that require no payload versus those that do.
 * 
 * @template T - The action payload map interface
 * 
 * @example
 * ```typescript
 * interface AppActions extends ActionPayloadMap {
 *   resetApp: void
 *   updateUser: { id: string; name: string }
 * }
 * 
 * const dispatch: ActionDispatcher<AppActions> = register.dispatch.bind(register)
 * 
 * // No payload required - type-checked
 * await dispatch('resetApp')
 * 
 * // Payload required and type-checked
 * await dispatch('updateUser', { id: '123', name: 'John' })
 * ```
 * 
 * @public
 */
export interface ActionDispatcher<T extends ActionPayloadMap> {
  /** Dispatch an action that doesn't require a payload */
  <K extends VoidActions<T>>(
    action: K,
    options?: DispatchOptions
  ): Promise<void>;
  
  /** Dispatch an action with optional payload parameter */
  <K extends VoidActions<T>>(
    action: K,
    payload?: undefined,
    options?: DispatchOptions
  ): Promise<void>;
  
  /** Dispatch an action that requires a payload */
  <K extends PayloadActions<T>>(
    action: K,
    payload: T[K],
    options?: DispatchOptions
  ): Promise<void>;
}

/**
 * Registry information interface for ActionRegister introspection
 * 
 * Provides comprehensive information about the current state of an ActionRegister
 * instance, including registered actions, handler counts, and execution modes.
 * Similar to DeclarativeStoreRegistry pattern for consistent registry management.
 * 
 * @template T - The action payload map interface
 * 
 * @example
 * ```typescript
 * const info = register.getRegistryInfo()
 * 
 * console.log(`Registry: ${info.name}`)
 * console.log(`Total actions: ${info.totalActions}`)
 * console.log(`Total handlers: ${info.totalHandlers}`)
 * console.log(`Registered actions:`, info.registeredActions)
 * ```
 * 
 * @public
 */
export interface ActionRegistryInfo<T extends ActionPayloadMap> {
  /** Registry name */
  name: string;
  
  /** Total number of registered actions */
  totalActions: number;
  
  /** Total number of registered handlers across all actions */
  totalHandlers: number;
  
  /** List of all registered actions */
  registeredActions: Array<keyof T>;
  
  /** Execution mode settings per action */
  actionExecutionModes: Map<keyof T, ExecutionMode>;
  
  /** Default execution mode */
  defaultExecutionMode: ExecutionMode;
}

/**
 * Handler statistics interface for registry monitoring and debugging
 * 
 * Provides detailed statistics about handlers for a specific action,
 * including handler organization and basic execution data.
 * 
 * @template T - The action payload map interface
 * 
 * @example
 * ```typescript
 * const stats = register.getActionStats('updateUser')
 * 
 * if (stats) {
 *   console.log(`Action: ${stats.action}`)
 *   console.log(`Handler count: ${stats.handlerCount}`)
 *   
 *   stats.handlersByPriority.forEach(group => {
 *     console.log(`Priority ${group.priority}:`, group.handlers.length, 'handlers')
 *   })
 *   
 *   if (stats.executionStats) {
 *     console.log(`Success rate: ${stats.executionStats.successRate}%`)
 *     console.log(`Average duration: ${stats.executionStats.averageDuration}ms`)
 *   }
 * }
 * ```
 * 
 * @public
 */
export interface ActionHandlerStats<T extends ActionPayloadMap> {
  /** Action name */
  action: keyof T;
  
  /** Number of handlers for this action */
  handlerCount: number;
  
  /** Total number of handlers for this action (alias for handlerCount) */
  totalHandlers: number;
  
  /** When the last handler was registered */
  lastRegistered?: Date;
  
  /** Handler configurations grouped by priority */
  handlersByPriority: Array<{
    priority: number;
    handlers: Array<{
      id: string;
    }>;
  }>;
  
  /** Execution statistics - removed in favor of simplified architecture */
  executionStats?: undefined;
}
