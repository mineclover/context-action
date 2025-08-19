
/**
 * Action payload mapping interface for type-safe action dispatching
 * 
 * Defines the mapping between action names and their corresponding payload types.
 * This interface serves as the foundation for type-safe action handling throughout
 * the Context-Action framework.
 * 
 * @example Basic Action Mapping
 * ```typescript
 * interface AppActions extends ActionPayloadMap {
 *   updateUser: { id: string; name: string; email: string }
 *   deleteUser: { id: string }
 *   resetUser: void  // Actions without payload
 *   fetchUsers: { page: number; limit: number }
 *   toggleTheme: { theme: 'light' | 'dark' }
 * }
 * ```
 * 
 * @example Usage with ActionRegister
 * ```typescript
 * const register = new ActionRegister<AppActions>()
 * 
 * // Type-safe handler registration
 * register.register('updateUser', async (payload, controller) => {
 *   // payload is automatically typed as { id: string; name: string; email: string }
 *   await userService.update(payload.id, payload)
 * })
 * 
 * // Type-safe dispatch
 * await register.dispatch('updateUser', {
 *   id: '123',
 *   name: 'John Doe',
 *   email: 'john@example.com'
 * })
 * ```
 * 
 * @public
 */
export interface ActionPayloadMap {
  [actionName: string]: unknown;
}

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
  /** Abort the pipeline execution with an optional reason */
  abort(reason?: string): void;
  
  /** Modify the payload that will be passed to subsequent handlers */
  modifyPayload(modifier: (payload: T) => T): void;
  
  /** Get the current payload */
  getPayload(): T;
  
  /** Jump to a specific priority level in the pipeline */
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
) => R | Promise<R>;

/**
 * Handler configuration interface for controlling handler behavior within the pipeline
 * 
 * Comprehensive configuration options that control how handlers are executed,
 * including priority, timing controls, validation, metadata, and advanced features
 * like retries and dependencies.
 * 
 * @example Basic Handler Configuration
 * ```typescript
 * register.register('searchUsers', searchHandler, {
 *   priority: 100,                    // Execute before lower priority handlers
 *   debounce: 300,                   // Wait 300ms after last call
 *   throttle: 1000,                  // Limit to once per second
 *   tags: ['search', 'user'],        // Categorization tags
 *   category: 'query',               // Logical grouping
 *   description: 'Search users by query',
 *   once: false                      // Can be executed multiple times
 * })
 * ```
 * 
 * @example Advanced Configuration
 * ```typescript
 * register.register('processPayment', paymentHandler, {
 *   priority: 200,
 *   timeout: 5000,                   // 5 second timeout
 *   retries: 3,                      // Retry up to 3 times on failure
 *   environment: 'production',       // Only in production
 *   dependencies: ['validateCard'],  // Requires validateCard handler
 *   conflicts: ['refundPayment'],    // Cannot coexist with refund handler
 *   validation: (payload) => payload.amount > 0 && payload.currency,
 *   metrics: {
 *     collectTiming: true,
 *     collectErrors: true,
 *     customMetrics: { paymentProvider: 'stripe' }
 *   }
 * })
 * ```
 * 
 * @example Conditional Handler
 * ```typescript
 * register.register('debugLog', debugHandler, {
 *   priority: 10,
 *   condition: () => process.env.NODE_ENV === 'development',
 *   tags: ['debug', 'logging'],
 *   category: 'development'
 * })
 * ```
 * 
 * @public
 */
export interface HandlerConfig {
  /** Priority level (higher numbers execute first). Default: 0 */
  priority?: number;
  
  /** Unique identifier for the handler. Auto-generated if not provided */
  id?: string;
  
  /** Whether to wait for async handlers to complete. Default: false */
  blocking?: boolean;
  
  /** Whether this handler should run once and then be removed. Default: false */
  once?: boolean;
  
  /** Condition function to determine if handler should run */
  condition?: () => boolean;
  
  /** Debounce delay in milliseconds */
  debounce?: number;
  
  /** Throttle delay in milliseconds */
  throttle?: number;
  
  /** Validation function that must return true for handler to execute */
  validation?: (payload: any) => boolean;
  
  /** Mark this handler as middleware */
  middleware?: boolean;
  
  // New metadata fields
  /** Tags for categorizing and filtering handlers */
  tags?: string[];
  
  /** Category for grouping related handlers */
  category?: string;
  
  /** Human-readable description of what this handler does */
  description?: string;
  
  /** Version identifier for this handler */
  version?: string;
  
  /** How to handle the result from this handler */
  returnType?: 'value' | 'merge' | 'collect';
  
  /** Timeout for this specific handler in milliseconds */
  timeout?: number;
  
  /** Number of retries if handler fails */
  retries?: number;
  
  /** Other handler IDs that this handler depends on */
  dependencies?: string[];
  
  /** Handler IDs that conflict with this handler */
  conflicts?: string[];
  
  /** Environment where this handler should run */
  environment?: 'development' | 'production' | 'test';
  
  /** Feature flag to control handler availability */
  feature?: string;
  
  /** Metrics collection configuration */
  metrics?: {
    /** Whether to collect timing information */
    collectTiming?: boolean;
    
    /** Whether to collect error information */
    collectErrors?: boolean;
    
    /** Custom metrics to collect */
    customMetrics?: Record<string, any>;
  };
  
  /** Custom metadata for this handler */
  metadata?: Record<string, any>;
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
  config: Required<HandlerConfig>;
  
  /** Unique identifier for this handler registration */
  id: string;
}

/**
 * Execution mode for action handler pipeline
 * 
 * Determines how multiple handlers for the same action are executed:
 * - `sequential`: Handlers execute one after another in priority order
 * - `parallel`: All handlers execute simultaneously
 * - `race`: First handler to complete wins, others are cancelled
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
  
  /** Whether execution has been aborted */
  aborted: boolean;
  
  /** Reason for abortion if aborted */
  abortReason?: string;
  
  /** Current handler index being executed */
  currentIndex: number;
  
  /** Priority level to jump to (if requested) */
  jumpToPriority?: number;
  
  /** Execution mode for this pipeline */
  executionMode: ExecutionMode;
  
  /** Results collected from handlers */
  results: R[];
  
  /** Whether execution was terminated early */
  terminated: boolean;
  
  /** Result from terminated execution */
  terminationResult?: R;
}

/**
 * Configuration options for ActionRegister initialization
 * 
 * Provides comprehensive configuration options for customizing ActionRegister
 * behavior including debugging, handler limits, execution modes, and cleanup policies.
 * 
 * @example Basic Configuration
 * ```typescript
 * const register = new ActionRegister<AppActions>({
 *   name: 'UserActionRegister',
 *   registry: {
 *     debug: true,
 *     maxHandlers: 20,
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
 *     maxHandlers: 50,
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
    
    /** Maximum number of handlers per action (prevents memory leaks) */
    maxHandlers?: number;
    
    /** Default execution mode for actions */
    defaultExecutionMode?: ExecutionMode;
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
    /** Only execute handlers with these tags */
    tags?: string[];
    
    /** Only execute handlers in this category */
    category?: string;
    
    /** Only execute handlers with these IDs */
    handlerIds?: string[];
    
    /** Exclude handlers with these tags */
    excludeTags?: string[];
    
    /** Exclude handlers in this category */
    excludeCategory?: string;
    
    /** Exclude handlers with these IDs */
    excludeHandlerIds?: string[];
    
    /** Only execute handlers matching this environment */
    environment?: 'development' | 'production' | 'test';
    
    /** Only execute handlers with this feature flag enabled */
    feature?: string;
    
    /** Custom filter function */
    custom?: (config: Required<HandlerConfig>) => boolean;
  };
  
  /** Result collection and processing options */
  result?: {
    /** How to handle multiple results */
    strategy?: 'first' | 'last' | 'all' | 'merge' | 'custom';
    
    /** Custom result merger function (used with 'merge' or 'custom' strategy) */
    merger?: <R>(results: R[]) => R;
    
    /** Whether to collect results from all handlers */
    collect?: boolean;
    
    /** Timeout for result collection */
    timeout?: number;
    
    /** Maximum number of results to collect */
    maxResults?: number;
  };
}

/**
 * Comprehensive result of pipeline execution with detailed execution information
 * 
 * Contains complete information about the pipeline execution including success status,
 * results, timing metrics, handler details, and any errors that occurred.
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
 * // Access all handler results
 * result.results.forEach((handlerResult, index) => {
 *   console.log(`Handler ${index} result:`, handlerResult)
 * })
 * 
 * // Check individual handler performance
 * result.handlers.forEach(handler => {
 *   if (handler.duration > 1000) {
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
  abortReason?: string;
  
  /** Whether the execution was terminated early via controller.return() */
  terminated: boolean;
  
  /** Final result based on result strategy */
  result?: R;
  
  /** All individual handler results */
  results: R[];
  
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
    
    /** Handler execution duration in milliseconds */
    duration?: number;
    
    /** Result returned by this handler */
    result?: R;
    
    /** Error thrown by this handler if any */
    error?: Error;
    
    /** Custom metadata for this handler */
    metadata?: Record<string, any>;
  }>;
  
  /** Errors that occurred during execution */
  errors: Array<{
    /** ID of the handler that caused the error */
    handlerId: string;
    
    /** The error that occurred */
    error: Error;
    
    /** Timestamp when the error occurred */
    timestamp: number;
  }>;
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
 * // No payload required
 * await dispatch('resetApp')
 * 
 * // Payload required and type-checked
 * await dispatch('updateUser', { id: '123', name: 'John' })
 * ```
 * 
 * @public
 */
export interface ActionDispatcher<T extends ActionPayloadMap> {
  /** Dispatch an action without payload */
  <K extends keyof T>(action: T[K] extends void ? K : never, options?: DispatchOptions): Promise<void>;
  
  /** Dispatch an action with payload */
  <K extends keyof T>(action: K, payload: T[K], options?: DispatchOptions): Promise<void>;
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
 * including handler organization, execution metrics, and performance data.
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
  
  /** Handler configurations grouped by priority */
  handlersByPriority: Array<{
    priority: number;
    handlers: Array<{
      id: string;
      tags: string[];
      category?: string;
      description?: string;
      version?: string;
    }>;
  }>;
  
  /** Execution statistics */
  executionStats?: {
    /** Total number of executions */
    totalExecutions: number;
    
    /** Average execution duration in milliseconds */
    averageDuration: number;
    
    /** Success rate percentage */
    successRate: number;
    
    /** Error count */
    errorCount: number;
  };
}



