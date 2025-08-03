/**
 * @fileoverview Store HMR Support Module
 * 기존 Store 클래스를 전혀 건드리지 않고 외부에서 HMR 지원을 추가하는 모듈
 * Store 인스턴스를 감시하고 상태 변경시 자동으로 백업, HMR시 복원
 */

import type { IStore } from '../core/types';
import { hmrStateManager } from './hmr-state-manager';
import { LogArtHelpers } from '@context-action/logger';

/**
 * Store HMR 설정
 */
export interface StoreHMRConfig {
  /** 자동 백업 활성화 */
  autoBackup?: boolean;
  /** 백업 간격 (ms) */
  backupInterval?: number;
  /** 복원시 검증 함수 */
  validator?: (value: any) => boolean;
  /** HMR 로그 출력 */
  enableLogging?: boolean;
}

/**
 * Store HMR 래퍼 클래스
 * 기존 Store를 감싸서 HMR 기능을 추가하되, 원본 Store 로직은 전혀 건드리지 않음
 */
export class StoreHMRWrapper<T = any> {
  private store: IStore<T>;
  private storeName: string;
  private config: Required<StoreHMRConfig>;
  private backupTimer: NodeJS.Timeout | null = null;
  private lastBackupValue: any = null;
  private isRestored = false;
  private skipNextBackup = false; // 복원 직후 백업 스킵

  constructor(store: IStore<T>, config: StoreHMRConfig = {}) {
    this.store = store;
    this.storeName = store.name;
    this.config = {
      autoBackup: config.autoBackup ?? true,
      backupInterval: config.backupInterval ?? 3000, // 3초마다 백업 (무한 리프레시 방지)
      validator: config.validator ?? (() => true),
      enableLogging: config.enableLogging ?? (process.env.NODE_ENV === 'development')
    };

    this.initialize();
  }

  /**
   * HMR 지원 초기화
   */
  private initialize(): void {
    // 1. 초기 백업 값 설정 (복원 전 현재 값으로)
    this.lastBackupValue = this.deepClone(this.store.getValue());

    // 2. 기존 상태가 있으면 복원 시도
    this.tryRestore();

    // 3. 복원 후 백업 값 다시 동기화 (무한 백업 방지)
    this.lastBackupValue = this.deepClone(this.store.getValue());

    // 4. 자동 백업 시작
    if (this.config.autoBackup) {
      this.startAutoBackup();
    }

    // 5. HMR 이벤트 리스너 등록
    this.setupHMRListeners();

    if (this.config.enableLogging) {
      console.info(LogArtHelpers.store.start(`Store HMR 지원 활성화: ${this.storeName}`));
    }
  }

  /**
   * 기존 상태 복원 시도
   */
  private tryRestore(): void {
    const restoredValue = hmrStateManager.restoreStoreState(this.storeName);
    
    if (restoredValue !== null && this.config.validator(restoredValue)) {
      try {
        // Store의 setValue 메서드를 호출하여 상태 복원
        if ('setValue' in this.store && typeof this.store.setValue === 'function') {
          (this.store as any).setValue(restoredValue);
          this.isRestored = true;
          this.skipNextBackup = true; // 복원 직후 첫 번째 백업 스킵
          
          if (this.config.enableLogging) {
            console.info(LogArtHelpers.store.info(`Store 상태 복원 성공: ${this.storeName}`));
          }
        }
      } catch (error) {
        if (this.config.enableLogging) {
          console.warn(LogArtHelpers.store.error(`Store 상태 복원`, `복원 실패: ${error}`));
        }
      }
    }
  }

  /**
   * 자동 백업 시작
   */
  private startAutoBackup(): void {
    this.backupTimer = setInterval(() => {
      this.performBackup();
    }, this.config.backupInterval);
  }

  /**
   * 백업 수행
   */
  private performBackup(): void {
    try {
      // 복원 직후 첫 번째 백업은 스킵
      if (this.skipNextBackup) {
        this.skipNextBackup = false;
        if (this.config.enableLogging) {
          console.debug(LogArtHelpers.store.debug(`Store 백업 스킵: ${this.storeName} (복원 직후)`));
        }
        return;
      }

      const currentValue = this.store.getValue();
      
      // 값이 변경된 경우에만 백업
      if (!this.isValueSame(currentValue, this.lastBackupValue)) {
        hmrStateManager.saveStoreState(this.storeName, currentValue, {
          createdAt: Date.now(),
          version: '1.0.0'
        });
        
        this.lastBackupValue = this.deepClone(currentValue);
        
        if (this.config.enableLogging) {
          console.debug(LogArtHelpers.store.debug(`Store 백업 완료: ${this.storeName} (변경 감지됨)`));
        }
      } else {
        if (this.config.enableLogging) {
          console.debug(LogArtHelpers.store.debug(`Store 백업 스킵: ${this.storeName} (변경 없음)`));
        }
      }
    } catch (error) {
      if (this.config.enableLogging) {
        console.warn(LogArtHelpers.store.error(`Store 백업`, `백업 실패: ${error}`));
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
        this.performBackup(); // 모듈 폐기 전 마지막 백업
        this.cleanup();
      });

      (import.meta as any).hot.accept(() => {
        // 새 모듈 수락시 자동으로 tryRestore가 호출됨
      });
    }

    // Webpack HMR 지원
    if (typeof module !== 'undefined' && (module as any)?.hot) {
      (module as any).hot.dispose(() => {
        this.performBackup();
        this.cleanup();
      });

      (module as any).hot.accept();
    }
  }

  /**
   * 수동 백업
   */
  backup(): void {
    this.performBackup();
  }

  /**
   * 수동 복원
   */
  restore(): boolean {
    this.tryRestore();
    return this.isRestored;
  }

  /**
   * Store 인스턴스 가져오기 (원본 그대로)
   */
  getStore(): IStore<T> {
    return this.store;
  }

  /**
   * 복원 상태 확인
   */
  wasRestored(): boolean {
    return this.isRestored;
  }

  /**
   * 정리
   */
  cleanup(): void {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
      this.backupTimer = null;
    }
  }

  /**
   * 값 비교 - HMR 최적화된 안전한 비교
   * JSON 직렬화 가능한 값에 대해서는 빠른 string 비교 사용
   */
  private isValueSame(a: any, b: any): boolean {
    // 참조가 같으면 즉시 true
    if (Object.is(a, b)) {
      return true;
    }

    // null/undefined 처리
    if (a == null || b == null) {
      return a === b;
    }

    // 원시 타입 처리
    if (typeof a !== 'object' || typeof b !== 'object') {
      return a === b;
    }

    try {
      // JSON 직렬화 가능한 객체의 경우 문자열 비교 (가장 안전하고 빠름)
      const aStr = JSON.stringify(a);
      const bStr = JSON.stringify(b);
      return aStr === bStr;
    } catch (error) {
      // JSON 직렬화 실패시 깊은 비교로 fallback
      return this.deepEquals(a, b);
    }
  }

  /**
   * 깊은 비교 fallback (JSON 직렬화 실패시)
   */
  private deepEquals(a: any, b: any): boolean {
    // 타입이 다르면 false
    if (typeof a !== typeof b) {
      return false;
    }

    // Date 객체 처리
    if (a instanceof Date && b instanceof Date) {
      return a.getTime() === b.getTime();
    }

    // RegExp 객체 처리
    if (a instanceof RegExp && b instanceof RegExp) {
      return a.toString() === b.toString();
    }

    // 배열 처리
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((item, index) => this.deepEquals(item, b[index]));
    }

    // 배열과 객체 타입 불일치
    if (Array.isArray(a) || Array.isArray(b)) {
      return false;
    }

    // 객체 처리
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);

    if (aKeys.length !== bKeys.length) return false;

    return aKeys.every(key => 
      bKeys.includes(key) && this.deepEquals(a[key], b[key])
    );
  }

  /**
   * 깊은 복사 - 안전한 JSON 기반 복사 with fallback
   */
  private deepClone(value: any): any {
    if (value === null || typeof value !== 'object') return value;
    
    try {
      // JSON 직렬화 가능한 경우 가장 안전한 방법
      return JSON.parse(JSON.stringify(value));
    } catch (error) {
      // JSON 직렬화 실패시 수동 복사 (Date, function 등)
      if (value instanceof Date) return new Date(value.getTime());
      if (Array.isArray(value)) return value.map(item => this.deepClone(item));
      
      const cloned: any = {};
      for (const [key, val] of Object.entries(value)) {
        cloned[key] = this.deepClone(val);
      }
      return cloned;
    }
  }
}

/**
 * Store HMR 지원 활성화 헬퍼 함수
 * 기존 Store를 감싸서 HMR 기능을 추가
 */
export function enableStoreHMR<T>(
  store: IStore<T>, 
  config?: StoreHMRConfig
): StoreHMRWrapper<T> {
  return new StoreHMRWrapper(store, config);
}

/**
 * 여러 Store에 대해 HMR 지원 일괄 활성화
 */
export function enableStoresHMR(
  stores: IStore[], 
  config?: StoreHMRConfig
): StoreHMRWrapper[] {
  return stores.map(store => enableStoreHMR(store, config));
}

/**
 * Store HMR 상태 정보
 */
export interface StoreHMRStats {
  totalStores: number;
  backedUpStores: number;
  restoredStores: number;
}

/**
 * 전체 Store HMR 통계
 */
export function getStoreHMRStats(): StoreHMRStats {
  const stats = hmrStateManager.getStats();
  
  return {
    totalStores: stats.stores,
    backedUpStores: stats.stores, // 현재는 백업된 Store 수와 동일
    restoredStores: 0 // 실제 추적하려면 별도 카운터 필요
  };
}