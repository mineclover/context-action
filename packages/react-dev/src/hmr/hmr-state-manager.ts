/**
 * @fileoverview Global HMR State Manager
 * Hot Module Replacement시 Store와 ActionRegister 상태를 전역으로 보존/복원하는 시스템
 * 기존 코드 로직을 전혀 건드리지 않고 외부에서 상태를 관리
 */

import { LogArtHelpers } from '@context-action/logger';

/**
 * HMR 저장될 Store 상태 인터페이스
 */
export interface HMRStoreState {
  name: string;
  value: any;
  metadata?: {
    createdAt: number;
    lastUpdated: number;
    version?: string;
  };
}

/**
 * HMR 저장될 ActionRegister 핸들러 정보
 */
export interface HMRHandlerInfo {
  action: string;
  handlerId: string;
  priority: number;
  blocking: boolean;
  once: boolean;
  registeredAt: number;
}

/**
 * HMR 전역 상태 구조
 */
export interface HMRGlobalState {
  stores: Map<string, HMRStoreState>;
  actionHandlers: Map<string, HMRHandlerInfo[]>; // action name -> handlers
  registries: Map<string, string[]>; // registry name -> store names
  hmrId: string; // HMR 세션 ID
  lastUpdate: number;
}

/**
 * 전역 HMR 상태 키
 */
const HMR_GLOBAL_KEY = '__CONTEXT_ACTION_HMR_STATE__';

/**
 * HMR 지원 여부 확인
 */
function isHMREnabled(): boolean {
  return (
    typeof window !== 'undefined' &&
    process.env.NODE_ENV === 'development' &&
    ((import.meta as any).hot || (typeof module !== 'undefined' && (module as any)?.hot))
  );
}

/**
 * 현재 HMR 세션 ID 생성
 */
function generateHMRId(): string {
  return `hmr_${Date.now()}_${Math.random().toString(36).substring(2)}`;
}

/**
 * Global HMR State Manager 클래스
 * 기존 Store/ActionRegister 로직을 건드리지 않고 외부에서 상태 관리
 */
export class HMRStateManager {
  private static instance: HMRStateManager | null = null;
  private hmrId: string;
  private isEnabled: boolean;

  private constructor() {
    this.hmrId = generateHMRId();
    this.isEnabled = isHMREnabled();
    
    if (this.isEnabled) {
      this.initializeGlobalState();
      console.info(LogArtHelpers.store.start(`HMR State Manager 초기화 (ID: ${this.hmrId})`));
    }
  }

  /**
   * 싱글톤 인스턴스 가져오기
   */
  static getInstance(): HMRStateManager {
    if (!HMRStateManager.instance) {
      HMRStateManager.instance = new HMRStateManager();
    }
    return HMRStateManager.instance;
  }

  /**
   * 전역 상태 초기화
   */
  private initializeGlobalState(): void {
    if (!this.isEnabled) return;

    const global = window as any;
    if (!global[HMR_GLOBAL_KEY]) {
      global[HMR_GLOBAL_KEY] = {
        stores: new Map<string, HMRStoreState>(),
        actionHandlers: new Map<string, HMRHandlerInfo[]>(),
        registries: new Map<string, string[]>(),
        hmrId: this.hmrId,
        lastUpdate: Date.now()
      } as HMRGlobalState;
      
      console.info(LogArtHelpers.store.info('HMR 전역 상태 저장소 생성'));
    } else {
      console.info(LogArtHelpers.store.info('기존 HMR 전역 상태 발견 - 복원 준비'));
    }
  }

  /**
   * 전역 상태 가져오기
   */
  private getGlobalState(): HMRGlobalState | null {
    if (!this.isEnabled) return null;
    return (window as any)[HMR_GLOBAL_KEY] || null;
  }

  /**
   * Store 상태 저장
   */
  saveStoreState(storeName: string, value: any, metadata?: any): void {
    if (!this.isEnabled) return;

    const globalState = this.getGlobalState();
    if (!globalState) return;

    const storeState: HMRStoreState = {
      name: storeName,
      value: this.serializeValue(value),
      metadata: {
        createdAt: metadata?.createdAt || Date.now(),
        lastUpdated: Date.now(),
        version: metadata?.version
      }
    };

    globalState.stores.set(storeName, storeState);
    globalState.lastUpdate = Date.now();
    
    console.debug(LogArtHelpers.store.debug(`Store 상태 저장: ${storeName}`, { value }));
  }

  /**
   * Store 상태 복원
   */
  restoreStoreState(storeName: string): any | null {
    if (!this.isEnabled) return null;

    const globalState = this.getGlobalState();
    if (!globalState) return null;

    const storeState = globalState.stores.get(storeName);
    if (!storeState) return null;

    const restoredValue = this.deserializeValue(storeState.value);
    console.info(LogArtHelpers.store.info(`Store 상태 복원: ${storeName}`));
    
    return restoredValue;
  }

  /**
   * Action 핸들러 정보 저장
   */
  saveActionHandler(action: string, handlerId: string, config: any): void {
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
    // 동일한 handlerId가 있으면 교체, 없으면 추가
    const existingIndex = handlers.findIndex(h => h.handlerId === handlerId);
    if (existingIndex >= 0) {
      handlers[existingIndex] = handlerInfo;
    } else {
      handlers.push(handlerInfo);
    }

    globalState.lastUpdate = Date.now();
    console.debug(LogArtHelpers.core.debug(`Action 핸들러 저장: ${action}#${handlerId}`));
  }

  /**
   * Action 핸들러 목록 복원
   */
  restoreActionHandlers(action: string): HMRHandlerInfo[] {
    if (!this.isEnabled) return [];

    const globalState = this.getGlobalState();
    if (!globalState) return [];

    const handlers = globalState.actionHandlers.get(action) || [];
    if (handlers.length > 0) {
      console.info(LogArtHelpers.core.info(`Action 핸들러 복원: ${action} (${handlers.length}개)`));
    }
    
    return handlers;
  }

  /**
   * StoreRegistry 정보 저장
   */
  saveRegistry(registryName: string, storeNames: string[]): void {
    if (!this.isEnabled) return;

    const globalState = this.getGlobalState();
    if (!globalState) return;

    globalState.registries.set(registryName, [...storeNames]);
    globalState.lastUpdate = Date.now();
    
    console.debug(LogArtHelpers.store.debug(`Registry 저장: ${registryName}`, { storeNames }));
  }

  /**
   * StoreRegistry 정보 복원
   */
  restoreRegistry(registryName: string): string[] {
    if (!this.isEnabled) return [];

    const globalState = this.getGlobalState();
    if (!globalState) return [];

    const storeNames = globalState.registries.get(registryName) || [];
    if (storeNames.length > 0) {
      console.info(LogArtHelpers.store.info(`Registry 복원: ${registryName} (${storeNames.length}개 Store)`));
    }
    
    return storeNames;
  }

  /**
   * 전체 상태 정리 (개발 도구용)
   */
  clearAll(): void {
    if (!this.isEnabled) return;

    const global = window as any;
    if (global[HMR_GLOBAL_KEY]) {
      delete global[HMR_GLOBAL_KEY];
      console.info(LogArtHelpers.store.info('HMR 전역 상태 완전 정리'));
    }
  }

  /**
   * HMR 통계 정보
   */
  getStats(): { stores: number; actions: number; registries: number; enabled: boolean } {
    if (!this.isEnabled) {
      return { stores: 0, actions: 0, registries: 0, enabled: false };
    }

    const globalState = this.getGlobalState();
    if (!globalState) {
      return { stores: 0, actions: 0, registries: 0, enabled: true };
    }

    return {
      stores: globalState.stores.size,
      actions: globalState.actionHandlers.size,
      registries: globalState.registries.size,
      enabled: true
    };
  }

  /**
   * 값 직렬화 (안전한 JSON 변환)
   */
  private serializeValue(value: any): any {
    try {
      // 이미 원시 값이거나 plain object인 경우 그대로 반환
      if (value === null || value === undefined || typeof value !== 'object') {
        return value;
      }
      
      // Date 객체 처리
      if (value instanceof Date) {
        return { __type: 'Date', value: value.toISOString() };
      }
      
      // 배열 처리
      if (Array.isArray(value)) {
        return value.map(item => this.serializeValue(item));
      }
      
      // 일반 객체 처리
      const serialized: any = {};
      for (const [key, val] of Object.entries(value)) {
        serialized[key] = this.serializeValue(val);
      }
      return serialized;
    } catch (error) {
      console.warn(LogArtHelpers.store.error('값 직렬화', '직렬화 실패, 원본 반환'));
      return value;
    }
  }

  /**
   * 값 역직렬화
   */
  private deserializeValue(value: any): any {
    try {
      if (value === null || value === undefined || typeof value !== 'object') {
        return value;
      }
      
      // Date 객체 복원
      if (value.__type === 'Date') {
        return new Date(value.value);
      }
      
      // 배열 처리
      if (Array.isArray(value)) {
        return value.map(item => this.deserializeValue(item));
      }
      
      // 일반 객체 처리
      const deserialized: any = {};
      for (const [key, val] of Object.entries(value)) {
        deserialized[key] = this.deserializeValue(val);
      }
      return deserialized;
    } catch (error) {
      console.warn(LogArtHelpers.store.error('값 역직렬화', '역직렬화 실패, 원본 반환'));
      return value;
    }
  }
}

/**
 * HMR State Manager 싱글톤 인스턴스
 */
export const hmrStateManager = HMRStateManager.getInstance();