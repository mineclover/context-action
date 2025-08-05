/**
 * @fileoverview Core type definitions for Context-Action framework
 * @implements type-safety
 * @implements compile-time-validation 
 * @implements architecture-terms
 * @implements interface-naming
 * @implements function-naming
 * @implements constant-naming
 * @memberof core-concepts
 * @version 1.0.0
 * 
 * Provides comprehensive type definitions for the Context-Action framework's
 * action pipeline management and Store integration systems. Ensures type safety
 * across all framework components and enables compile-time validation.
 * 
 * Key Type Categories:
 * - Action payload mappings for type-safe dispatch
 * - Pipeline control interfaces for handler flow management
 * - Execution modes and configuration types
 * - Event system types for reactive programming
 * - Performance and metrics types for monitoring
 */

import type { Logger, LogLevel } from '@context-action/logger';

/**
 * Base interface for defining action payload mappings
 * @implements action-payload-map
 * @implements type-safety
 * @implements compile-time-validation
 * @memberof core-concepts
 * @since 1.0.0
 * 
 * Maps action names to their corresponding payload types for type-safe dispatch
 * 
 * @example
 * ```typescript
 * interface MyActions extends ActionPayloadMap {
 *   increment: void;
 *   setCount: number;
 *   updateUser: { id: string; name: string };
 *   deleteUser: { id: string };
 * }
 * ```
 */
export interface ActionPayloadMap {
  [actionName: string]: unknown;
}

/**
 * Controller object provided to action handlers for pipeline management
 * @implements pipeline-controller
 * @memberof core-concepts
 * @since 1.0.0
 * 
 * Provides methods for controlling pipeline flow and payload modification
 * 
 * @template T The type of the payload being processed
 */
export interface PipelineController<T = any> {
  /** Continue to the next handler in the pipeline */
  next(): void;
  
  /** Abort the pipeline execution with an optional reason */
  abort(reason?: string): void;
  
  /** Modify the payload that will be passed to subsequent handlers */
  modifyPayload(modifier: (payload: T) => T): void;
  
  /** Get the current payload */
  getPayload(): T;
  
  /** Jump to a specific priority level in the pipeline */
  jumpToPriority(priority: number): void;
}

/**
 * Action handler function type for processing actions in the pipeline
 * @implements action-handler
 * @memberof core-concepts
 * @since 1.0.0
 * 
 * Function signature for handlers that process specific actions within the pipeline.
 * Handlers receive the action payload and a controller for managing pipeline flow.
 * 
 * @template T The type of the payload this handler processes
 * @param payload - The action payload data
 * @param controller - Pipeline controller for flow management
 * @returns void or Promise<void> for async operations
 * 
 * @example
 * ```typescript
 * const userUpdateHandler: ActionHandler<{id: string, name: string}> = 
 *   async (payload, controller) => {
 *     // Validate payload
 *     if (!payload.id) {
 *       controller.abort('User ID is required');
 *       return;
 *     }
 *     
 *     // Update user store
 *     const user = userStore.getValue();
 *     userStore.setValue({ ...user, ...payload });
 *   };
 * ```
 */
export type ActionHandler<T = any> = (
  payload: T,
  controller: PipelineController<T>
) => void | Promise<void>;

/**
 * Configuration options for action handlers
 * @implements handler-configuration
 * @memberof core-concepts
 * @since 1.0.0
 * 
 * Defines behavior and execution characteristics for action handlers in the pipeline.
 * Supports priority-based execution, conditional execution, and performance optimizations.
 * 
 * @example
 * ```typescript
 * const config: HandlerConfig = {
 *   priority: 10,        // Higher priority runs first
 *   id: 'userValidator', // Unique identifier
 *   blocking: true,      // Wait for async completion
 *   once: false,         // Run multiple times
 *   condition: () => isLoggedIn(), // Conditional execution
 *   debounce: 500,       // Debounce delay in ms
 *   throttle: 1000,      // Throttle interval in ms
 *   validation: (payload) => payload?.id != null
 * };
 * ```
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
}

/**
 * Internal handler registration data
 * @internal
 */
export interface HandlerRegistration<T = any> {
  handler: ActionHandler<T>;
  config: Required<HandlerConfig>;
  id: string;
}

/**
 * Execution modes for action pipeline
 * @implements execution-mode
 * @memberof core-concepts
 * @since 1.0.0
 * 
 * Defines how handlers are executed within the action pipeline.
 * Each mode provides different execution strategies for various use cases.
 * 
 * - `sequential`: Execute handlers one after another (default)
 * - `parallel`: Execute all handlers simultaneously 
 * - `race`: Execute handlers simultaneously, use first completed result
 * 
 * @example
 * ```typescript
 * const register = new ActionRegister({ 
 *   defaultExecutionMode: 'parallel' 
 * });
 * 
 * // Or set per action
 * register.setExecutionMode('validateUser', 'sequential');
 * register.setExecutionMode('fetchData', 'race');
 * ```
 */
export type ExecutionMode = 'sequential' | 'parallel' | 'race';

/**
 * Internal execution context for action pipeline processing
 * @implements pipeline-context
 * @memberof api-terms
 * @internal
 * @since 1.0.0
 * 
 * Maintains state during action pipeline execution including current payload,
 * handler queue, execution status, and flow control information.
 * 
 * @template T The type of the payload being processed
 * 
 * @example
 * ```typescript
 * // Internal usage in ActionRegister
 * const context: PipelineContext<UserPayload> = {
 *   action: 'updateUser',
 *   payload: { id: '123', name: 'John' },
 *   handlers: registeredHandlers,
 *   aborted: false,
 *   currentIndex: 0,
 *   executionMode: 'sequential'
 * };
 * ```
 */
export interface PipelineContext<T = any> {
  action: string;
  payload: T;
  handlers: HandlerRegistration<T>[];
  aborted: boolean;
  abortReason?: string;
  currentIndex: number;
  jumpToPriority?: number;
  executionMode: ExecutionMode;
}

/**
 * Configuration options for ActionRegister
 * @implements actionregister-configuration
 * @memberof api-terms
 * @since 1.0.0
 * 
 * Defines configuration options for ActionRegister instances, including
 * logging setup, debugging options, and default execution behavior.
 * 
 * @example
 * ```typescript
 * const config: ActionRegisterConfig = {
 *   logger: createLogger(LogLevel.DEBUG),
 *   logLevel: LogLevel.INFO,
 *   name: 'UserActions',
 *   debug: true,
 *   defaultExecutionMode: 'sequential'
 * };
 * 
 * const actionRegister = new ActionRegister(config);
 * ```
 */
export interface ActionRegisterConfig {
  /** Custom logger implementation. Defaults to ConsoleLogger */
  logger?: Logger;
  
  /** Log level for filtering output. Defaults to ERROR */
  logLevel?: LogLevel;
  
  /** Name identifier for this ActionRegister instance */
  name?: string;
  
  /** Whether to enable debug mode with additional logging */
  debug?: boolean;
  
  /** Default execution mode for actions. Defaults to 'sequential' */
  defaultExecutionMode?: ExecutionMode;
}

/**
 * Unregister function returned by register method
 * @implements cleanup-function
 * @memberof api-terms
 * @since 1.0.0
 * 
 * Function type for unregistering action handlers from the pipeline.
 * Returned by the register method to provide cleanup capability.
 * 
 * @example
 * ```typescript
 * const unregister = actionRegister.register('updateUser', handler);
 * 
 * // Later, remove the handler
 * unregister();
 * ```
 */
export type UnregisterFunction = () => void;

/**
 * Type-safe action dispatcher interface
 * @implements action-dispatcher
 * @memberof api-terms
 * @since 1.0.0
 * 
 * Provides overloaded function signatures for dispatching actions with proper
 * type checking. Supports both actions with payloads and void actions.
 * 
 * @template T Action payload map defining available actions
 * 
 * @example
 * ```typescript
 * interface AppActions extends ActionPayloadMap {
 *   increment: void;
 *   setCount: number;
 *   updateUser: { id: string; name: string };
 * }
 * 
 * const dispatch: ActionDispatcher<AppActions> = actionRegister.dispatch;
 * 
 * // Type-safe dispatching
 * await dispatch('increment');              // No payload required
 * await dispatch('setCount', 42);          // Number payload required
 * await dispatch('updateUser', { id: '1', name: 'John' }); // Object payload
 * ```
 */
export interface ActionDispatcher<T extends ActionPayloadMap> {
  /** Dispatch an action without payload */
  <K extends keyof T>(action: T[K] extends void ? K : never): Promise<void>;
  
  /** Dispatch an action with payload */
  <K extends keyof T>(action: K, payload: T[K]): Promise<void>;
}

/**
 * Performance metrics for action execution
 * @implements action-metrics
 * @implements performance-monitoring
 * @memberof api-terms
 * @since 1.0.0
 * 
 * Provides detailed metrics for action execution performance and status.
 * Used for monitoring, debugging, and performance optimization.
 * 
 * @example
 * ```typescript
 * actionRegister.on('action:complete', ({ metrics }) => {
 *   console.log(`Action ${metrics.action} took ${metrics.executionTime}ms`);
 *   console.log(`Success: ${metrics.success}, Handlers: ${metrics.handlerCount}`);
 * });
 * ```
 */
export interface ActionMetrics {
  action: string;
  executionTime: number;
  handlerCount: number;
  success: boolean;
  error?: string;
  timestamp: number;
}

/**
 * Event types emitted by ActionRegister
 * @implements action-events
 * @implements event-driven-architecture
 * @memberof api-terms
 * @since 1.0.0
 * 
 * Defines all event types that can be emitted by ActionRegister instances.
 * Enables reactive programming and monitoring of action lifecycle events.
 * 
 * @template T Action payload map defining available actions
 * 
 * @example
 * ```typescript
 * interface AppActions extends ActionPayloadMap {
 *   updateUser: { id: string; name: string };
 * }
 * 
 * const actionRegister = new ActionRegister<AppActions>();
 * 
 * actionRegister.on('action:start', ({ action, payload }) => {
 *   console.log(`Starting action: ${action}`, payload);
 * });
 * 
 * actionRegister.on('action:complete', ({ action, metrics }) => {
 *   console.log(`Completed: ${action} in ${metrics.executionTime}ms`);
 * });
 * ```
 */
export interface ActionRegisterEvents<T extends ActionPayloadMap = ActionPayloadMap> {
  /** Emitted before action dispatch */
  'action:start': { action: keyof T; payload: any };
  
  /** Emitted after successful action completion */
  'action:complete': { action: keyof T; payload: any; metrics: ActionMetrics };
  
  /** Emitted when action is aborted */
  'action:abort': { action: keyof T; payload: any; reason?: string };
  
  /** Emitted when action encounters an error */
  'action:error': { action: keyof T; payload: any; error: Error; metrics?: ActionMetrics };
  
  /** Emitted when handler is registered */
  'handler:register': { action: keyof T; handlerId: string; config: HandlerConfig };
  
  /** Emitted when handler is unregistered */
  'handler:unregister': { action: keyof T; handlerId: string };
}

/**
 * Event handler type for ActionRegister events
 * @implements event-handler
 * @memberof api-terms
 * @since 1.0.0
 * 
 * Function type for handling events emitted by ActionRegister.
 * 
 * @template T The type of event data
 */
export type EventHandler<T = any> = (data: T) => void;

/**
 * Simple event emitter interface
 * @implements event-emitter
 * @memberof api-terms
 * @since 1.0.0
 * 
 * Basic event emitter interface for ActionRegister event system.
 * Provides methods for subscribing, emitting, and unsubscribing from events.
 * 
 * @template T Record type defining available events and their data types
 */
export interface EventEmitter<T extends Record<string, any> = Record<string, any>> {
  on<K extends keyof T>(event: K, handler: EventHandler<T[K]>): UnregisterFunction;
  emit<K extends keyof T>(event: K, data: T[K]): void;
  off<K extends keyof T>(event: K, handler: EventHandler<T[K]>): void;
  removeAllListeners(event?: keyof T): void;
}