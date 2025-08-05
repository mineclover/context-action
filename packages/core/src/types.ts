
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
export type ActionHandler<T = any> = (
  payload: T,
  controller: PipelineController<T>
) => void | Promise<void>;

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
  <K extends keyof T>(action: T[K] extends void ? K : never, options?: DispatchOptions): Promise<void>;
  
  /** Dispatch an action with payload */
  <K extends keyof T>(action: K, payload: T[K], options?: DispatchOptions): Promise<void>;
}



