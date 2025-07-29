// 타입 정의
export type PipelineController<T = any> = {
  next: () => void;
  abort: (reason?: string) => void;
  modifyPayload: (modifier: (payload: T) => T) => void;
};

export type ActionHandler<T = any> = (
  payload: T,
  controller: PipelineController<T>
) => void | Promise<void>;

export type HandlerConfig = {
  priority?: number;
  id?: string;
  blocking?: boolean;
};

// 선언적 타입 정의를 위한 인터페이스
export interface ActionPayloadMap {
  // 확장 가능한 구조
  // 'actionName': PayloadType;
}

// Action Register 클래스
export class ActionRegister<T extends ActionPayloadMap = ActionPayloadMap> {
  private pipelines = new Map<keyof T, Map<string, {
    handler: ActionHandler<any>;
    config: HandlerConfig;
  }>>();
  
  private atomSetters = new Map<string, Function>();

  // 파이프라인에 핸들러 등록
  register<K extends keyof T>(
    action: K,
    handler: ActionHandler<T[K]>,
    config: HandlerConfig = {}
  ): () => void {
    if (!this.pipelines.has(action)) {
      this.pipelines.set(action, new Map());
    }
    
    const pipeline = this.pipelines.get(action)!;
    const handlerId = config.id || `handler_${Date.now()}_${Math.random()}`;
    
    // 중복 등록 방지
    if (pipeline.has(handlerId)) {
      console.warn(`Handler with id ${handlerId} already exists`);
      return () => {};
    }
    
    pipeline.set(handlerId, { handler, config });
    
    // 우선순위로 정렬
    this.sortPipeline(action);
    
    // unregister 함수 반환
    return () => {
      pipeline.delete(handlerId);
    };
  }

  // Atom setter 등록
  registerAtomSetter(name: string, setter: Function) {
    this.atomSetters.set(name, setter);
  }

  // 파이프라인 실행 - void 타입을 위한 오버로드
  async dispatch<K extends keyof T>(
    action: T[K] extends void ? K : never
  ): Promise<void>;
  async dispatch<K extends keyof T>(
    action: K,
    payload: T[K]
  ): Promise<void>;
  async dispatch<K extends keyof T>(
    action: K,
    payload?: T[K]
  ): Promise<void> {
    const pipeline = this.pipelines.get(action);
    
    if (!pipeline || pipeline.size === 0) {
      console.warn(`No handlers registered for action: ${String(action)}`);
      return;
    }
    
    let modifiedPayload = payload as T[K];
    const handlers = Array.from(pipeline.values());
    
    for (const { handler, config } of handlers) {
      let shouldContinue = true;
      
      const controller: PipelineController<T[K]> = {
        next: () => { shouldContinue = true; },
        abort: (reason) => {
          shouldContinue = false;
          console.log(`Pipeline aborted: ${reason}`);
        },
        modifyPayload: (modifier) => {
          modifiedPayload = modifier(modifiedPayload);
        }
      };
      
      try {
        if (config.blocking) {
          await handler(modifiedPayload, controller);
        } else {
          handler(modifiedPayload, controller);
        }
        
        if (!shouldContinue) break;
      } catch (error) {
        console.error(`Error in pipeline handler:`, error);
        if (config.blocking) throw error;
      }
    }
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
  }
}