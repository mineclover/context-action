/**
 * @fileoverview Auto HMR System
 * 개발 환경에서 Store와 ActionRegister에 자동으로 HMR 지원을 추가하는 시스템
 * 사용자가 별도 설정 없이도 HMR이 자동으로 활성화됨
 */

import type { IStore } from '../stores/core/types';
import type { ActionRegister, ActionPayloadMap } from '@context-action/core-dev';
import { StoreHMRWrapper } from './store-hmr-support';
import { hmrStateManager } from './hmr-state-manager';

/**
 * HMR 환경 감지
 */
function isHMREnvironment(): boolean {
  return (
    typeof window !== 'undefined' &&
    process.env.NODE_ENV === 'development' &&
    ((import.meta as any).hot || (typeof module !== 'undefined' && (module as any)?.hot))
  );
}

/**
 * 자동 HMR Store 래핑 맵 (중복 래핑 방지)
 */
const autoWrappedStores = new Map<IStore, StoreHMRWrapper>();

/**
 * Store에 자동으로 HMR 지원 추가
 * 개발 환경에서만 활성화되며, 기본 설정으로 동작
 */
export function autoEnableStoreHMR<T>(store: IStore<T>): IStore<T> {
  // 프로덕션 환경이나 HMR 미지원 환경에서는 원본 반환
  if (!isHMREnvironment()) {
    return store;
  }

  // 이미 래핑된 Store는 중복 래핑 방지
  if (autoWrappedStores.has(store)) {
    return autoWrappedStores.get(store)!.getStore();
  }

  // 자동 HMR 래핑 (최적화된 기본 설정)
  const wrapper = new StoreHMRWrapper(store, {
    autoBackup: true,
    backupInterval: 5000, // 5초로 증가 (무한 백업 방지)
    enableLogging: process.env.NODE_ENV === 'development', // 개발 환경에서만 로깅
    validator: (value) => value !== null && value !== undefined
  });

  autoWrappedStores.set(store, wrapper);
  return wrapper.getStore();
}

/**
 * ActionRegister에 자동으로 HMR 지원 추가
 * 현재는 ActionRegister HMR이 복잡하므로 Store만 자동화
 */
export function autoEnableActionRegisterHMR<T extends ActionPayloadMap>(actionRegister: ActionRegister<T>): ActionRegister<T> {
  // 프로덕션 환경에서는 원본 반환
  if (!isHMREnvironment()) {
    return actionRegister;
  }

  // ActionRegister HMR은 핸들러 팩토리 패턴이 필요하므로
  // 현재는 자동화하지 않고 수동 설정 유지
  return actionRegister;
}

/**
 * 개발 도구 자동 활성화
 * HMR Dashboard를 자동으로 렌더링
 */
export function shouldAutoEnableHMRTools(): boolean {
  return isHMREnvironment();
}

/**
 * 자동 HMR 통계 (디버깅용)
 */
export function getAutoHMRStats() {
  if (!isHMREnvironment()) {
    return { enabled: false, wrappedStores: 0 };
  }

  return {
    enabled: true,
    wrappedStores: autoWrappedStores.size,
    globalStats: hmrStateManager.getStats()
  };
}

/**
 * 자동 HMR 정리 (테스트용)
 */
export function clearAutoHMR(): void {
  if (!isHMREnvironment()) return;
  
  autoWrappedStores.forEach(wrapper => wrapper.cleanup());
  // WeakMap은 자동으로 정리됨
}