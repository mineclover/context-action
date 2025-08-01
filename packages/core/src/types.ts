/**
 * @fileoverview Core type definitions for Context-Action framework
 * Provides type-safe action pipeline management with Store integration
 */

import type { Logger, LogLevel } from '@context-action/logger';

/**
 * Base interface for defining action payload mappings
 * @implements action-payload-map
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
 * @template T - The type of the payload being processed
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
 * @implements action-handler
 * @memberof core-concepts
 */
export type ActionHandler<T = any> = (
  payload: T,
  controller: PipelineController<T>
) => void | Promise<void>;

/**
 * @implements handler-configuration
 * @memberof core-concepts
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
 */
export type ExecutionMode = 'sequential' | 'parallel' | 'race';

/**
 * @implements pipeline-context
 * @memberof api-terms
 * @internal
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
 */
export type UnregisterFunction = () => void;

/**
 * @implements action-dispatcher
 * @memberof api-terms
 */
export interface ActionDispatcher<T extends ActionPayloadMap> {
  /** Dispatch an action without payload */
  <K extends keyof T>(action: T[K] extends void ? K : never): Promise<void>;
  
  /** Dispatch an action with payload */
  <K extends keyof T>(action: K, payload: T[K]): Promise<void>;
}

/**
 * Performance metrics for action execution
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
 */
export interface ActionRegisterEvents<T extends ActionPayloadMap = ActionPayloadMap> {
  /** Emitted before action dispatch */
  'action:start': { action: keyof T; payload: any };
  
  /** Emitted after successful action completion */
  'action:complete': { action: keyof T; payload: any; metrics: ActionMetrics };
  
  /** Emitted when action is aborted */
  'action:abort': { action: keyof T; payload: any; reason?: string };
  
  /** Emitted when action encounters an error */
  'action:error': { action: keyof T; payload: any; error: Error };
  
  /** Emitted when handler is registered */
  'handler:register': { action: keyof T; handlerId: string; config: HandlerConfig };
  
  /** Emitted when handler is unregistered */
  'handler:unregister': { action: keyof T; handlerId: string };
}

/**
 * Event handler type for ActionRegister events
 */
export type EventHandler<T = any> = (data: T) => void;

/**
 * Simple event emitter interface
 */
export interface EventEmitter<T extends Record<string, any> = Record<string, any>> {
  on<K extends keyof T>(event: K, handler: EventHandler<T[K]>): UnregisterFunction;
  emit<K extends keyof T>(event: K, data: T[K]): void;
  off<K extends keyof T>(event: K, handler: EventHandler<T[K]>): void;
  removeAllListeners(event?: keyof T): void;
}