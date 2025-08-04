/**
 * @fileoverview React HMR Integration Hooks
 * React 컴포넌트에서 쉽게 사용할 수 있는 HMR 지원 훅들
 * 기존 코드를 전혀 건드리지 않고 HMR 기능을 추가
 */

import { useEffect, useRef, useMemo, useCallback } from 'react';
import type { ActionRegister, ActionPayloadMap } from '@context-action/core-dev';
import type { IStore } from '../stores/core/types';
import { StoreHMRWrapper, enableStoreHMR, type StoreHMRConfig } from './store-hmr-support';
// HMR 타입과 클래스를 직접 재정의 (core 패키지와의 의존성 분리)
export interface ActionRegisterHMRConfig {
  autoBackup?: boolean;
  autoRestore?: boolean;
  enableLogging?: boolean;
  handlerFactories?: Map<string, () => any>;
}
import { LogArtHelpers } from '@context-action/logger';

/**
 * React HMR 설정
 */
export interface ReactHMRConfig {
  /** Store HMR 설정 */
  store?: StoreHMRConfig;
  /** ActionRegister HMR 설정 */
  actionRegister?: ActionRegisterHMRConfig;
  /** HMR 로그 출력 */
  enableLogging?: boolean;
}

/**
 * Store HMR 훅 결과
 */
export interface UseStoreHMRResult<T> {
  /** HMR이 적용된 Store (원본과 동일한 API) */
  store: IStore<T>;
  /** HMR 래퍼 인스턴스 (고급 기능용) */
  hmrWrapper: StoreHMRWrapper<T>;
  /** 수동 백업 실행 */
  backup: () => void;
  /** 수동 복원 실행 */
  restore: () => boolean;
  /** 복원 여부 확인 */
  wasRestored: boolean;
}

/**
 * 간단한 ActionRegister HMR 래퍼 (React 전용)
 */
class SimpleActionRegisterHMRWrapper<T extends ActionPayloadMap> {
  private actionRegister: ActionRegister<T>;
  private handlerFactories = new Map<string, () => any>();
  private wasRestored = false;

  constructor(actionRegister: ActionRegister<T>) {
    this.actionRegister = actionRegister;
  }

  registerHandlerFactory<K extends keyof T>(
    action: K, 
    handlerId: string, 
    factory: () => any
  ): void {
    const key = `${String(action)}#${handlerId}`;
    this.handlerFactories.set(key, factory);
  }

  getActionRegister(): ActionRegister<T> {
    return this.actionRegister;
  }

  wasRestoredFromHMR(): boolean {
    return this.wasRestored;
  }

  getHandlerCount(): number {
    return this.handlerFactories.size;
  }
}

/**
 * ActionRegister HMR 훅 결과
 */
export interface UseActionRegisterHMRResult<T extends ActionPayloadMap> {
  /** HMR이 적용된 ActionRegister (원본과 동일한 API) */
  actionRegister: ActionRegister<T>;
  /** HMR 래퍼 인스턴스 (고급 기능용) */
  hmrWrapper: SimpleActionRegisterHMRWrapper<T>;
  /** 핸들러 팩토리 등록 */
  registerHandlerFactory: <K extends keyof T>(
    action: K, 
    handlerId: string, 
    factory: () => any
  ) => void;
  /** 복원 여부 확인 */
  wasRestored: boolean;
  /** 등록된 핸들러 수 조회 */
  handlerCount: number;
}

/**
 * Store에 HMR 지원을 추가하는 React 훅
 * 
 * @param store - HMR을 적용할 Store 인스턴스
 * @param config - HMR 설정
 * @returns HMR이 적용된 Store와 관련 유틸리티
 * 
 * @example
 * ```tsx
 * const userStore = createStore('user', { name: '', email: '' });
 * const { store: hmrUserStore, backup, restore, wasRestored } = useStoreHMR(userStore, {
 *   autoBackup: true,
 *   backupInterval: 1000
 * });
 * 
 * // 기존과 동일하게 사용
 * const userValue = useStoreValue(hmrUserStore);
 * ```
 */
export function useStoreHMR<T>(
  store: IStore<T>, 
  config: StoreHMRConfig = {}
): UseStoreHMRResult<T> {
  const hmrWrapperRef = useRef<StoreHMRWrapper<T> | null>(null);
  
  // HMR 래퍼 생성 (한 번만)
  if (!hmrWrapperRef.current) {
    hmrWrapperRef.current = enableStoreHMR(store, {
      enableLogging: process.env.NODE_ENV === 'development',
      ...config
    });
    
    if (config.enableLogging !== false && process.env.NODE_ENV === 'development') {
      console.info(LogArtHelpers.store.start(`useStoreHMR 활성화: ${store.name}`));
    }
  }
  
  const hmrWrapper = hmrWrapperRef.current;
  
  // 정리 함수
  useEffect(() => {
    return () => {
      if (hmrWrapper) {
        hmrWrapper.cleanup();
      }
    };
  }, [hmrWrapper]);
  
  // 안정적인 API 반환
  const result = useMemo((): UseStoreHMRResult<T> => ({
    store: hmrWrapper.getStore(),
    hmrWrapper,
    backup: () => hmrWrapper.backup(),
    restore: () => hmrWrapper.restore(),
    wasRestored: hmrWrapper.wasRestored()
  }), [hmrWrapper]);
  
  return result;
}

/**
 * ActionRegister에 HMR 지원을 추가하는 React 훅
 * 
 * @param actionRegister - HMR을 적용할 ActionRegister 인스턴스
 * @param config - HMR 설정
 * @returns HMR이 적용된 ActionRegister와 관련 유틸리티
 * 
 * @example
 * ```tsx
 * const actionRegister = new ActionRegister<MyActions>();
 * const { 
 *   actionRegister: hmrActionRegister, 
 *   registerHandlerFactory,
 *   wasRestored 
 * } = useActionRegisterHMR(actionRegister, {
 *   autoBackup: true,
 *   autoRestore: true
 * });
 * 
 * // 핸들러 팩토리 등록 (HMR 복원용)
 * registerHandlerFactory('updateUser', 'main-handler', () => updateUserHandler);
 * 
 * // 기존과 동일하게 사용
 * hmrActionRegister.register('updateUser', updateUserHandler, { id: 'main-handler' });
 * ```
 */
export function useActionRegisterHMR<T extends ActionPayloadMap>(
  actionRegister: ActionRegister<T>, 
  config: ActionRegisterHMRConfig = {}
): UseActionRegisterHMRResult<T> {
  const hmrWrapperRef = useRef<SimpleActionRegisterHMRWrapper<T> | null>(null);
  
  // HMR 래퍼 생성 (한 번만)
  if (!hmrWrapperRef.current) {
    hmrWrapperRef.current = new SimpleActionRegisterHMRWrapper(actionRegister);
    
    if (config.enableLogging !== false && process.env.NODE_ENV === 'development') {
      console.info(LogArtHelpers.core.start('useActionRegisterHMR 활성화 (간단 버전)'));
    }
  }
  
  const hmrWrapper = hmrWrapperRef.current;
  
  // 핸들러 팩토리 등록 함수
  const registerHandlerFactory = useCallback(<K extends keyof T>(
    action: K, 
    handlerId: string, 
    factory: () => any
  ) => {
    hmrWrapper.registerHandlerFactory(action, handlerId, factory);
  }, [hmrWrapper]);
  
  // 안정적인 API 반환
  const result = useMemo((): UseActionRegisterHMRResult<T> => ({
    actionRegister: hmrWrapper.getActionRegister(),
    hmrWrapper,
    registerHandlerFactory,
    wasRestored: hmrWrapper.wasRestoredFromHMR(),
    handlerCount: hmrWrapper.getHandlerCount()
  }), [hmrWrapper, registerHandlerFactory]);
  
  return result;
}

/**
 * Store와 ActionRegister를 함께 HMR 지원하는 통합 훅
 * 
 * @param store - HMR을 적용할 Store 인스턴스
 * @param actionRegister - HMR을 적용할 ActionRegister 인스턴스
 * @param config - 통합 HMR 설정
 * @returns 통합 HMR 결과
 * 
 * @example
 * ```tsx
 * const userStore = createStore('user', { name: '', email: '' });
 * const actionRegister = new ActionRegister<UserActions>();
 * 
 * const { 
 *   store: hmrUserStore, 
 *   actionRegister: hmrActionRegister,
 *   registerHandlerFactory 
 * } = useIntegratedHMR(userStore, actionRegister, {
 *   enableLogging: true
 * });
 * 
 * // 핸들러 팩토리 등록
 * registerHandlerFactory('updateUser', 'main', () => updateUserHandler);
 * 
 * // 기존과 동일하게 사용
 * const user = useStoreValue(hmrUserStore);
 * hmrActionRegister.register('updateUser', updateUserHandler, { id: 'main' });
 * ```
 */
export function useIntegratedHMR<T, A extends ActionPayloadMap>(
  store: IStore<T>, 
  actionRegister: ActionRegister<A>,
  config: ReactHMRConfig = {}
) {
  const storeHMR = useStoreHMR(store, config.store);
  const actionRegisterHMR = useActionRegisterHMR(actionRegister, config.actionRegister);
  
  return {
    // Store 관련
    store: storeHMR.store,
    storeHMR: storeHMR.hmrWrapper,
    backupStore: storeHMR.backup,
    restoreStore: storeHMR.restore,
    storeWasRestored: storeHMR.wasRestored,
    
    // ActionRegister 관련
    actionRegister: actionRegisterHMR.actionRegister,
    actionRegisterHMR: actionRegisterHMR.hmrWrapper,
    registerHandlerFactory: actionRegisterHMR.registerHandlerFactory,
    actionRegisterWasRestored: actionRegisterHMR.wasRestored,
    handlerCount: actionRegisterHMR.handlerCount,
  };
}

/**
 * 여러 Store에 대해 HMR을 일괄 적용하는 훅
 * 
 * @param stores - HMR을 적용할 Store 배열
 * @param config - Store HMR 설정
 * @returns HMR이 적용된 Store 배열과 관련 유틸리티
 * 
 * @example
 * ```tsx
 * const stores = [userStore, cartStore, settingsStore];
 * const { hmrStores, backupAll, restoreAll, stats } = useMultiStoreHMR(stores, {
 *   autoBackup: true,
 *   backupInterval: 2000
 * });
 * 
 * // 개별 Store 사용
 * const [hmrUserStore, hmrCartStore, hmrSettingsStore] = hmrStores;
 * const user = useStoreValue(hmrUserStore);
 * ```
 */
export function useMultiStoreHMR(
  stores: IStore[], 
  config: StoreHMRConfig = {}
) {
  const hmrWrappersRef = useRef<StoreHMRWrapper[]>([]);
  
  // HMR 래퍼들 생성 (한 번만)
  if (hmrWrappersRef.current.length === 0) {
    hmrWrappersRef.current = stores.map(store => 
      enableStoreHMR(store, {
        enableLogging: process.env.NODE_ENV === 'development',
        ...config
      })
    );
    
    if (config.enableLogging !== false && process.env.NODE_ENV === 'development') {
      console.info(LogArtHelpers.store.start(`useMultiStoreHMR 활성화: ${stores.length}개 Store`));
    }
  }
  
  const hmrWrappers = hmrWrappersRef.current;
  
  // 정리 함수
  useEffect(() => {
    return () => {
      hmrWrappers.forEach(wrapper => wrapper.cleanup());
    };
  }, [hmrWrappers]);
  
  // 유틸리티 함수들
  const backupAll = useCallback(() => {
    hmrWrappers.forEach(wrapper => wrapper.backup());
  }, [hmrWrappers]);
  
  const restoreAll = useCallback(() => {
    return hmrWrappers.map(wrapper => wrapper.restore());
  }, [hmrWrappers]);
  
  const getStats = useCallback(() => {
    return {
      totalStores: hmrWrappers.length,
      restoredStores: hmrWrappers.filter(wrapper => wrapper.wasRestored()).length,
      storeNames: hmrWrappers.map(wrapper => wrapper.getStore().name)
    };
  }, [hmrWrappers]);
  
  // 안정적인 API 반환
  const result = useMemo(() => ({
    hmrStores: hmrWrappers.map(wrapper => wrapper.getStore()),
    hmrWrappers,
    backupAll,
    restoreAll,
    stats: getStats()
  }), [hmrWrappers, backupAll, restoreAll, getStats]);
  
  return result;
}

/**
 * HMR 개발 도구 훅
 * 개발 시 HMR 상태를 모니터링하고 디버깅하는 데 유용
 * 
 * @param config - HMR 설정
 * @returns HMR 개발 도구 API
 * 
 * @example
 * ```tsx
 * const { stats, clearAll, isEnabled, logs } = useHMRDevTools({
 *   enableLogging: true
 * });
 * 
 * // 개발 도구 UI에서 사용
 * <div>
 *   <p>HMR 활성화: {isEnabled ? '예' : '아니오'}</p>
 *   <p>Store 수: {stats.stores}</p>
 *   <p>Action 수: {stats.actions}</p>
 *   <button onClick={clearAll}>전체 정리</button>
 * </div>
 * ```
 */
export function useHMRDevTools(config: { enableLogging?: boolean } = {}) {
  const { hmrStateManager } = require('./hmr-state-manager');
  
  const stats = useMemo(() => {
    return hmrStateManager.getStats();
  }, []);
  
  const clearAll = useCallback(() => {
    hmrStateManager.clearAll();
    if (config.enableLogging) {
      console.info(LogArtHelpers.store.info('HMR 개발 도구: 전체 상태 정리'));
    }
  }, [config.enableLogging]);
  
  const isEnabled = useMemo(() => {
    return stats.enabled;
  }, [stats.enabled]);
  
  return {
    stats,
    clearAll,
    isEnabled,
    // 향후 확장: 로그 히스토리, 상태 검사 등
  };
}