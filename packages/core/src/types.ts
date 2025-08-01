/**
 * @fileoverview Core type definitions for Context-Action framework
 * Provides type-safe action pipeline management with Store integration
 */

/**
 * Base interface for defining action payload mappings
 * 
 * @implements {ActionPayloadMap}
 * @memberof ApiTerms
 * @since 1.0.0
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
  [actionName: string]: any;
}

/**
 * Controller object provided to action handlers for pipeline management
 * 
 * @implements {PipelineController}
 * @memberof core-concepts
 * @since 1.0.0
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
}

/**
 * Action handler function that processes actions in the pipeline
 * @template T - The type of the payload
 * @param payload - The data passed to the handler
 * @param controller - Pipeline controller for flow management
 * @returns void or Promise<void> for async handlers
 */
export type ActionHandler<T = any> = (
  payload: T,
  controller: PipelineController<T>
) => void | Promise<void>;

/**
 * Configuration options for action handlers
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
 * Pipeline execution context
 * @internal
 */
export interface PipelineContext<T = any> {
  action: string;
  payload: T;
  handlers: HandlerRegistration<T>[];
  aborted: boolean;
  abortReason?: string;
  currentIndex: number;
}

/**
 * Logger interface for customizable logging
 */
export interface Logger {
  trace(message: string, data?: any): void;
  debug(message: string, data?: any): void;
  info(message: string, data?: any): void;
  warn(message: string, data?: any): void;
  error(message: string, error?: any): void;
}

/**
 * Log levels for filtering log output
 */
export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  NONE = 5
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
}

/**
 * Unregister function returned by register method
 */
export type UnregisterFunction = () => void;

/**
 * Action dispatch overloads for type safety
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