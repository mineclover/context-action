
/**
 * 액션 이름과 해당 페이로드 타입 간의 매핑을 정의하는 TypeScript 인터페이스입니다.
 * 
 * @implements {action-payload-map}
 * @memberof core-concepts
 * 
 * @example
 * ```typescript
 * interface AppActions extends ActionPayloadMap {
 *   updateUser: { id: string; name: string; email: string };
 *   deleteUser: { id: string };
 *   resetUser: void; // No payload required
 * }
 * ```
 */
export interface ActionPayloadMap {
  [actionName: string]: unknown;
}

/**
 * 액션 핸들러에게 제공되는 파이프라인 실행 흐름 관리 및 페이로드 수정을 위한 인터페이스입니다.
 * 
 * @implements {pipeline-controller}
 * @memberof core-concepts
 * 
 * @example
 * ```typescript
 * register('processData', async (payload, controller) => {
 *   // 입력 검증
 *   if (!payload.isValid) {
 *     controller.abort('Invalid payload');
 *     return;
 *   }
 *   
 *   // 페이로드 변형
 *   controller.modifyPayload(data => ({ 
 *     ...data, 
 *     processed: true,
 *     timestamp: Date.now()
 *   }));
 *   
 *   // 다음 핸들러로 진행
 *   controller.next();
 * });
 * ```
 */
export interface PipelineController<T = any, R = void> {
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
 * 파이프라인 내에서 특정 액션을 처리하는 함수로, 비즈니스 로직과 스토어 상호작용을 담당합니다.
 * 
 * @implements {action-handler}
 * @memberof core-concepts
 * 
 * @example
 * ```typescript
 * const updateUserHandler: ActionHandler<{id: string, name: string}> = async (payload, controller) => {
 *   // 스토어에서 현재 상태 읽기
 *   const currentUser = userStore.getValue();
 *   
 *   // 비즈니스 로직 실행
 *   const updatedUser = { ...currentUser, ...payload };
 *   
 *   // 스토어 상태 업데이트
 *   userStore.setValue(updatedUser);
 *   
 *   // 파이프라인 계속 진행
 *   controller.next();
 * };
 * ```
 */
export type ActionHandler<T = any, R = void> = (
  payload: T,
  controller: PipelineController<T, R>
) => R | Promise<R>;

/**
 * 파이프라인 내에서 액션 핸들러의 동작을 제어하는 설정 옵션들입니다.
 * 
 * @implements {handler-configuration}
 * @memberof core-concepts
 * 
 * @example
 * ```typescript
 * register('searchUser', searchHandler, {
 *   priority: 100,          // 높은 우선순위로 먼저 실행
 *   debounce: 300,          // 300ms 디바운싱
 *   blocking: true,         // 완료까지 대기
 *   validation: (payload) => payload.query.length > 2
 * });
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

export interface HandlerRegistration<T = any, R = void> {
  handler: ActionHandler<T, R>;
  config: Required<HandlerConfig>;
  id: string;
}

export type ExecutionMode = 'sequential' | 'parallel' | 'race';

export interface PipelineContext<T = any, R = void> {
  action: string;
  payload: T;
  handlers: HandlerRegistration<T, R>[];
  aborted: boolean;
  abortReason?: string;
  currentIndex: number;
  jumpToPriority?: number;
  executionMode: ExecutionMode;
  
  // New result collection fields
  results: R[];
  terminated: boolean;
  terminationResult?: R;
}

export interface ActionRegisterConfig {
  /** Name identifier for this ActionRegister instance */
  name?: string;
  
  /** Registry-specific configuration options */
  registry?: {
    /** Debug mode for registry operations */
    debug?: boolean;
    
    /** Auto-cleanup configuration for one-time handlers */
    autoCleanup?: boolean;
    
    /** Maximum number of handlers per action */
    maxHandlers?: number;
    
    /** Default execution mode for actions */
    defaultExecutionMode?: ExecutionMode;
  };
}

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
 * Result of pipeline execution containing detailed execution information
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

export type UnregisterFunction = () => void;

export interface ActionDispatcher<T extends ActionPayloadMap> {
  /** Dispatch an action without payload */
  <K extends keyof T>(action: T[K] extends void ? K : never, options?: DispatchOptions): Promise<void>;
  
  /** Dispatch an action with payload */
  <K extends keyof T>(action: K, payload: T[K], options?: DispatchOptions): Promise<void>;
}

/**
 * Registry information interface for ActionRegister introspection
 * 
 * Similar to DeclarativeStoreRegistry pattern for consistent registry management
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
 * Handler statistics for registry monitoring
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



