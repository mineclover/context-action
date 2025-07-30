import { Logger, LogLevel, ConsoleLogger, OtelConsoleLogger, OtelContext, getLogLevelFromEnv, createOtelContextFromPayload } from './logger';

/**
 * Controller object provided to action handlers for pipeline management
 * @template T - The type of the payload being processed
 */
export type PipelineController<T = any> = {
  /** Continue to the next handler in the pipeline */
  next: () => void;
  /** Abort the pipeline execution with an optional reason */
  abort: (reason?: string) => void;
  /** Modify the payload that will be passed to subsequent handlers */
  modifyPayload: (modifier: (payload: T) => T) => void;
};

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
export type HandlerConfig = {
  /** Priority level (higher numbers execute first). Default: 0 */
  priority?: number;
  /** Unique identifier for the handler. Auto-generated if not provided */
  id?: string;
  /** Whether to wait for async handlers to complete. Default: false */
  blocking?: boolean;
};

/**
 * Base interface for defining action payload mappings
 * @example
 * ```typescript
 * interface MyActions extends ActionPayloadMap {
 *   increment: void;
 *   setCount: number;
 *   updateUser: { id: string; name: string };
 * }
 * ```
 */
export interface ActionPayloadMap {
  // Extensible structure for action definitions
  // 'actionName': PayloadType;
}

/**
 * Configuration options for ActionRegister
 */
export interface ActionRegisterConfig {
  /** Custom logger implementation. Defaults to ConsoleLogger */
  logger?: Logger;
  /** Log level for the logger. Defaults to ERROR if not provided */
  logLevel?: LogLevel;
  /** OpenTelemetry context for tracing */
  otelContext?: OtelContext;
  /** Whether to use OTEL-aware logger. Defaults to false */
  useOtel?: boolean;
}

/**
 * Core action pipeline management system
 * @template T - Action payload map defining available actions and their payload types
 * @example
 * ```typescript
 * interface AppActions extends ActionPayloadMap {
 *   increment: void;
 *   setCount: number;
 * }
 * 
 * const actionRegister = new ActionRegister<AppActions>();
 * 
 * // Register handlers
 * actionRegister.register('increment', () => console.log('Incremented'));
 * actionRegister.register('setCount', (count) => console.log(`Count: ${count}`));
 * 
 * // Dispatch actions
 * await actionRegister.dispatch('increment');
 * await actionRegister.dispatch('setCount', 42);
 * ```
 */
export class ActionRegister<T extends ActionPayloadMap = ActionPayloadMap> {
  private pipelines = new Map<keyof T, Map<string, {
    handler: ActionHandler<any>;
    config: HandlerConfig;
  }>>();
  
  private atomSetters = new Map<string, Function>();
  private handlerCounter = 0;
  public readonly logger: Logger;

  constructor(config?: ActionRegisterConfig) {
    // 환경변수에서 로그 레벨 가져오기
    const envLogLevel = getLogLevelFromEnv();
    
    // 설정에서 로그 레벨 가져오기 (환경변수보다 우선)
    const configLogLevel = config?.logLevel ?? envLogLevel;
    
    // 커스텀 로거가 있으면 사용, OTEL 사용 설정이 있으면 OTEL 로거 사용, 없으면 기본 콘솔 로거 사용
    if (config?.logger) {
      this.logger = config.logger;
    } else if (config?.useOtel) {
      this.logger = new OtelConsoleLogger(configLogLevel);
    } else {
      this.logger = new ConsoleLogger(configLogLevel);
    }
    
    // OTEL 컨텍스트 설정
    if (config?.otelContext && this.logger instanceof OtelConsoleLogger) {
      this.logger.setContext(config.otelContext);
    }
    
    this.logger.debug('ActionRegister initialized', { 
      logLevel: configLogLevel,
      useOtel: config?.useOtel ?? false,
      hasOtelContext: !!config?.otelContext
    });
  }

  /**
   * Register a handler for an action in the pipeline
   * @param action - The action name to handle
   * @param handler - The handler function to execute
   * @param config - Optional configuration for the handler
   * @returns Unregister function to remove the handler
   * @example
   * ```typescript
   * const unregister = actionRegister.register('increment', () => {
   *   console.log('Incremented!');
   * }, { priority: 10 });
   * 
   * // Later, remove the handler
   * unregister();
   * ```
   */
  register<K extends keyof T>(
    action: K,
    handler: ActionHandler<T[K]>,
    config: HandlerConfig = {}
  ): () => void {
    if (!this.pipelines.has(action)) {
      this.pipelines.set(action, new Map());
      this.logger.debug(`Created new pipeline for action: ${String(action)}`);
    }
    
    const pipeline = this.pipelines.get(action)!;
    const handlerId = config.id || `handler_${++this.handlerCounter}`;
    
    // 중복 등록 방지
    if (pipeline.has(handlerId)) {
      this.logger.warn(`Handler with id ${handlerId} already exists for action: ${String(action)}`);
      return () => {};
    }
    
    pipeline.set(handlerId, { handler, config });
    this.logger.debug(`Registered handler for action: ${String(action)}`, { 
      handlerId, 
      priority: config.priority ?? 0,
      blocking: config.blocking ?? false 
    });
    
    // 우선순위로 정렬
    this.sortPipeline(action);
    
    // unregister 함수 반환
    return () => {
      pipeline.delete(handlerId);
      this.logger.debug(`Unregistered handler: ${handlerId} for action: ${String(action)}`);
    };
  }

  // Atom setter 등록
  registerAtomSetter(name: string, setter: Function) {
    this.atomSetters.set(name, setter);
    this.logger.debug(`Registered atom setter: ${name}`);
  }

  /**
   * Dispatch an action through the pipeline (for actions without payload)
   * @param action - The action to dispatch
   * @returns Promise that resolves when all handlers complete
   */
  async dispatch<K extends keyof T>(
    action: T[K] extends void ? K : never
  ): Promise<void>;
  /**
   * Dispatch an action through the pipeline (for actions with payload)
   * @param action - The action to dispatch
   * @param payload - The payload data to pass to handlers
   * @returns Promise that resolves when all handlers complete
   */
  async dispatch<K extends keyof T>(
    action: K,
    payload: T[K]
  ): Promise<void>;
  /**
   * Internal dispatch implementation
   * @internal
   */
  async dispatch<K extends keyof T>(
    action: K,
    payload?: T[K]
  ): Promise<void> {
    const pipeline = this.pipelines.get(action);
    
    // OTEL 컨텍스트 자동 감지 및 설정
    if (this.logger instanceof OtelConsoleLogger && payload) {
      const otelContext = createOtelContextFromPayload(payload);
      if (otelContext.traceId || otelContext.sessionId) {
        this.logger.setContext(otelContext);
      }
    }
    
    this.logger.debug(`Dispatching action: ${String(action)}`, { payload });
    
    if (!pipeline || pipeline.size === 0) {
      this.logger.warn(`No handlers registered for action: ${String(action)}`);
      return;
    }
    
    let modifiedPayload = payload as T[K];
    const handlers = Array.from(pipeline.values());
    let shouldContinue = true;
    
    this.logger.trace(`Executing pipeline for action: ${String(action)}`, { 
      handlerCount: handlers.length 
    });
    
    for (const { handler, config } of handlers) {
      if (!shouldContinue) break;
      
      const controller: PipelineController<T[K]> = {
        next: () => { shouldContinue = true; },
        abort: (reason) => {
          shouldContinue = false;
          this.logger.warn(`Pipeline aborted: ${reason}`);
        },
        modifyPayload: (modifier) => {
          modifiedPayload = modifier(modifiedPayload);
          this.logger.trace(`Payload modified for action: ${String(action)}`);
        }
      };
      
      try {
        if (config.blocking) {
          await handler(modifiedPayload, controller);
        } else {
          handler(modifiedPayload, controller);
        }
      } catch (error) {
        this.logger.error(`Error in pipeline handler for action: ${String(action)}`, error);
        if (config.blocking) throw error;
      }
    }
    
    this.logger.debug(`Completed dispatching action: ${String(action)}`);
  }

  private sortPipeline<K extends keyof T>(action: K) {
    const pipeline = this.pipelines.get(action);
    if (!pipeline) return;
    
    const sorted = Array.from(pipeline.entries())
      .sort(([, a], [, b]) => {
        const priorityA = a.config.priority ?? 0;
        const priorityB = b.config.priority ?? 0;
        return priorityB - priorityA; // 높은 우선순위가 먼저
      });
    
    pipeline.clear();
    sorted.forEach(([id, data]) => pipeline.set(id, data));
    
    this.logger.trace(`Sorted pipeline for action: ${String(action)}`, {
      handlerCount: sorted.length,
      priorities: sorted.map(([, data]) => data.config.priority ?? 0)
    });
  }
}