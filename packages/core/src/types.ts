

export interface ActionPayloadMap {
  [actionName: string]: unknown;
}

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

export type ActionHandler<T = any> = (
  payload: T,
  controller: PipelineController<T>
) => void | Promise<void>;

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

export interface HandlerRegistration<T = any> {
  handler: ActionHandler<T>;
  config: Required<HandlerConfig>;
  id: string;
}

export type ExecutionMode = 'sequential' | 'parallel' | 'race';

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

export interface ActionRegisterConfig {
  /** Name identifier for this ActionRegister instance */
  name?: string;
}

export interface DispatchOptions {
  /** Debounce delay in milliseconds - wait for this delay after last call */
  debounce?: number;
  
  /** Throttle delay in milliseconds - limit execution to once per this period */
  throttle?: number;
  
  /** Execution mode override for this specific dispatch */
  executionMode?: ExecutionMode;
}

export type UnregisterFunction = () => void;

export interface ActionDispatcher<T extends ActionPayloadMap> {
  /** Dispatch an action without payload */
  <K extends keyof T>(action: T[K] extends void ? K : never): Promise<void>;
  
  /** Dispatch an action with payload */
  <K extends keyof T>(action: K, payload: T[K]): Promise<void>;
}



