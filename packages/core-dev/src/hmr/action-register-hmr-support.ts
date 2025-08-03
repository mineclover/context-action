/**
 * @fileoverview ActionRegister HMR Support Module
 * 기존 ActionRegister 클래스를 전혀 건드리지 않고 외부에서 HMR 지원을 추가하는 모듈
 * ActionRegister 인스턴스를 감시하고 핸들러 등록/해제시 자동으로 백업, HMR시 복원
 */

import type { ActionRegister, ActionPayloadMap, ActionHandler, HandlerConfig } from '../index.js';
import { LogArtHelpers } from '@context-action/logger';

/**
 * HMR 저장될 핸들러 정보 (core에서 독립적으로 정의)
 */
interface HMRHandlerInfo {
  action: string;
  handlerId: string;
  priority: number;
  blocking: boolean;
  once: boolean;
  registeredAt: number;
  // 핸들러 함수는 직렬화할 수 없으므로 제외
}

/**
 * ActionRegister HMR 설정
 */
export interface ActionRegisterHMRConfig {
  /** 자동 핸들러 백업 활성화 */
  autoBackup?: boolean;
  /** 복원시 핸들러 재등록 시도 */
  autoRestore?: boolean;
  /** HMR 로그 출력 */
  enableLogging?: boolean;
  /** 핸들러 복원 시 사용할 팩토리 함수들 */
  handlerFactories?: Map<string, () => ActionHandler<any>>;
}

/**
 * HMR 지원을 위한 전역 상태 (core 패키지 독립)
 */
class CoreHMRStateManager {
  private static instance: CoreHMRStateManager | null = null;
  private globalKey = '__CONTEXT_ACTION_CORE_HMR_STATE__';
  private isEnabled: boolean;

  private constructor() {
    this.isEnabled = (
      typeof window !== 'undefined' &&
      process.env.NODE_ENV === 'development' &&
      ((import.meta as any).hot || (module as any)?.hot)
    );
    
    if (this.isEnabled) {
      this.initializeGlobalState();
    }
  }

  static getInstance(): CoreHMRStateManager {
    if (!CoreHMRStateManager.instance) {
      CoreHMRStateManager.instance = new CoreHMRStateManager();
    }
    return CoreHMRStateManager.instance;
  }

  private initializeGlobalState(): void {
    if (!this.isEnabled) return;

    const global = window as any;
    if (!global[this.globalKey]) {
      global[this.globalKey] = {
        actionHandlers: new Map<string, HMRHandlerInfo[]>(),
        lastUpdate: Date.now()
      };
    }
  }

  private getGlobalState(): any {
    if (!this.isEnabled) return null;
    return (window as any)[this.globalKey] || null;
  }

  saveHandler(action: string, handlerId: string, config: any): void {
    if (!this.isEnabled) return;

    const globalState = this.getGlobalState();
    if (!globalState) return;

    const handlerInfo: HMRHandlerInfo = {
      action,
      handlerId,
      priority: config.priority || 0,
      blocking: config.blocking || false,
      once: config.once || false,
      registeredAt: Date.now()
    };

    if (!globalState.actionHandlers.has(action)) {
      globalState.actionHandlers.set(action, []);
    }
    
    const handlers = globalState.actionHandlers.get(action)!;
    const existingIndex = handlers.findIndex((h: HMRHandlerInfo) => h.handlerId === handlerId);
    if (existingIndex >= 0) {
      handlers[existingIndex] = handlerInfo;
    } else {
      handlers.push(handlerInfo);
    }

    globalState.lastUpdate = Date.now();
  }

  restoreHandlers(action: string): HMRHandlerInfo[] {
    if (!this.isEnabled) return [];

    const globalState = this.getGlobalState();
    if (!globalState) return [];

    return globalState.actionHandlers.get(action) || [];
  }

  getAllActions(): string[] {
    if (!this.isEnabled) return [];

    const globalState = this.getGlobalState();
    if (!globalState) return [];

    return Array.from(globalState.actionHandlers.keys());
  }

  clearAll(): void {
    if (!this.isEnabled) return;

    const global = window as any;
    if (global[this.globalKey]) {
      delete global[this.globalKey];
    }
  }
}

const coreHMRManager = CoreHMRStateManager.getInstance();

/**
 * ActionRegister HMR 래퍼 클래스
 * 기존 ActionRegister를 감싸서 HMR 기능을 추가하되, 원본 ActionRegister 로직은 전혀 건드리지 않음
 */
export class ActionRegisterHMRWrapper<T extends ActionPayloadMap = ActionPayloadMap> {
  private actionRegister: ActionRegister<T>;
  private config: Required<ActionRegisterHMRConfig>;
  private registeredHandlers = new Map<string, Set<string>>(); // action -> handler IDs
  private handlerFactories: Map<string, () => ActionHandler<any>>;
  private isRestored = false;

  constructor(actionRegister: ActionRegister<T>, config: ActionRegisterHMRConfig = {}) {
    this.actionRegister = actionRegister;
    this.handlerFactories = config.handlerFactories || new Map();
    this.config = {
      autoBackup: config.autoBackup ?? true,
      autoRestore: config.autoRestore ?? true,
      enableLogging: config.enableLogging ?? (process.env.NODE_ENV === 'development'),
      handlerFactories: this.handlerFactories
    };

    this.initialize();
  }

  /**
   * HMR 지원 초기화
   */
  private initialize(): void {
    // 1. 기존 핸들러 복원 시도
    if (this.config.autoRestore) {
      this.tryRestoreHandlers();
    }

    // 2. HMR 이벤트 리스너 등록
    this.setupHMRListeners();

    if (this.config.enableLogging) {
      console.info(LogArtHelpers.core.start('ActionRegister HMR 지원 활성화'));
    }
  }

  /**
   * 핸들러 팩토리 등록
   */
  registerHandlerFactory<K extends keyof T>(
    action: K, 
    handlerId: string, 
    factory: () => ActionHandler<T[K]>
  ): this {
    const key = `${String(action)}#${handlerId}`;
    this.handlerFactories.set(key, factory);
    return this;
  }

  /**
   * 핸들러 등록 (백업 포함)
   */
  register<K extends keyof T>(
    action: K,
    handler: ActionHandler<T[K]>,
    config: HandlerConfig = {}
  ): () => void {
    const handlerId = config.id || `handler_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const finalConfig = { ...config, id: handlerId };

    // 원본 ActionRegister에 등록
    const unregister = this.actionRegister.register(action, handler, finalConfig);

    // HMR 백업 수행
    if (this.config.autoBackup) {
      coreHMRManager.saveHandler(String(action), handlerId, finalConfig);
      
      // 내부 추적
      if (!this.registeredHandlers.has(String(action))) {
        this.registeredHandlers.set(String(action), new Set());
      }
      this.registeredHandlers.get(String(action))!.add(handlerId);

      if (this.config.enableLogging) {
        console.debug(LogArtHelpers.core.debug(`핸들러 등록 및 백업: ${String(action)}#${handlerId}`));
      }
    }

    // 래핑된 unregister 함수 반환
    return () => {
      unregister();
      
      // 내부 추적에서 제거
      const actionHandlers = this.registeredHandlers.get(String(action));
      if (actionHandlers) {
        actionHandlers.delete(handlerId);
        if (actionHandlers.size === 0) {
          this.registeredHandlers.delete(String(action));
        }
      }

      if (this.config.enableLogging) {
        console.debug(LogArtHelpers.core.debug(`핸들러 등록 해제: ${String(action)}#${handlerId}`));
      }
    };
  }

  /**
   * 기존 핸들러 복원 시도
   */
  private tryRestoreHandlers(): void {
    const allActions = coreHMRManager.getAllActions();
    let restoredCount = 0;

    for (const action of allActions) {
      const handlers = coreHMRManager.restoreHandlers(action);
      
      for (const handlerInfo of handlers) {
        const factoryKey = `${action}#${handlerInfo.handlerId}`;
        const factory = this.handlerFactories.get(factoryKey);
        
        if (factory) {
          try {
            const handler = factory();
            const config: HandlerConfig = {
              id: handlerInfo.handlerId,
              priority: handlerInfo.priority,
              blocking: handlerInfo.blocking,
              once: handlerInfo.once
            };

            // 원본 ActionRegister에 복원된 핸들러 등록
            this.actionRegister.register(action as keyof T, handler, config);
            restoredCount++;

            // 내부 추적 업데이트
            if (!this.registeredHandlers.has(action)) {
              this.registeredHandlers.set(action, new Set());
            }
            this.registeredHandlers.get(action)!.add(handlerInfo.handlerId);

          } catch (error) {
            if (this.config.enableLogging) {
              console.warn(LogArtHelpers.core.error(`핸들러 복원`, `복원 실패: ${action}#${handlerInfo.handlerId}`));
            }
          }
        }
      }
    }

    if (restoredCount > 0) {
      this.isRestored = true;
      
      if (this.config.enableLogging) {
        console.info(LogArtHelpers.core.info(`ActionRegister 핸들러 복원 완료: ${restoredCount}개`));
      }
    }
  }

  /**
   * HMR 이벤트 리스너 설정
   */
  private setupHMRListeners(): void {
    // Vite HMR 지원
    if ((import.meta as any).hot) {
      (import.meta as any).hot.dispose(() => {
        // 모듈 폐기 전 현재 상태 백업은 이미 register 시점에 완료됨
        if (this.config.enableLogging) {
          console.info(LogArtHelpers.core.info('ActionRegister HMR dispose'));
        }
      });

      (import.meta as any).hot.accept(() => {
        // 새 모듈 수락시 자동으로 tryRestoreHandlers가 호출됨
        if (this.config.enableLogging) {
          console.info(LogArtHelpers.core.info('ActionRegister HMR accept'));
        }
      });
    }

    // Webpack HMR 지원
    if ((module as any)?.hot) {
      (module as any).hot.dispose(() => {
        if (this.config.enableLogging) {
          console.info(LogArtHelpers.core.info('ActionRegister HMR dispose (Webpack)'));
        }
      });

      (module as any).hot.accept();
    }
  }

  /**
   * 원본 ActionRegister 인스턴스 가져오기
   */
  getActionRegister(): ActionRegister<T> {
    return this.actionRegister;
  }

  /**
   * 복원 상태 확인
   */
  wasRestored(): boolean {
    return this.isRestored;
  }

  /**
   * 현재 등록된 핸들러 수 조회
   */
  getHandlerCount(): number {
    let total = 0;
    for (const handlers of this.registeredHandlers.values()) {
      total += handlers.size;
    }
    return total;
  }

  /**
   * 등록된 액션 목록 조회
   */
  getRegisteredActions(): string[] {
    return Array.from(this.registeredHandlers.keys());
  }
}

/**
 * ActionRegister HMR 지원 활성화 헬퍼 함수
 */
export function enableActionRegisterHMR<T extends ActionPayloadMap>(
  actionRegister: ActionRegister<T>, 
  config?: ActionRegisterHMRConfig
): ActionRegisterHMRWrapper<T> {
  return new ActionRegisterHMRWrapper(actionRegister, config);
}