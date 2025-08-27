/**
 * DevTools 설정 및 연결 헬퍼들
 */

import React from 'react';
import { Store } from '../stores/core/Store';
import { StoreRegistry } from '../stores/core/StoreRegistry';
import type { IStore } from '../stores/core/types';
import { DevToolsManager, globalDevTools, DevToolsConfig } from './devtools-manager';

export interface DevToolsSetupOptions extends DevToolsConfig {
  /** 자동으로 모든 Store 연결 여부 */
  autoConnectStores?: boolean;
  /** Store Registry 자동 감지 */
  autoDetectRegistry?: boolean;
}

/**
 * DevTools 초기 설정
 */
export function setupDevTools(options: DevToolsSetupOptions = {}): DevToolsManager {
  const { autoConnectStores, autoDetectRegistry, ...config } = options;

  // 글로벌 DevTools 설정 업데이트
  globalDevTools.updateConfig(config);

  // 개발 환경이 아니면 early return
  if (config.developmentOnly !== false && process.env.NODE_ENV !== 'development') {
    return globalDevTools;
  }

  // 자동 Store 연결 설정
  if (autoConnectStores) {
    setupAutoStoreConnection();
  }

  // Registry 자동 감지 설정
  if (autoDetectRegistry) {
    setupAutoRegistryDetection();
  }

  // 글로벌 DevTools 객체를 window에 노출 (개발 환경에서만)
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    (window as any).__CONTEXT_ACTION_DEVTOOLS__ = globalDevTools;
  }

  return globalDevTools;
}

/**
 * 특정 Store를 DevTools에 연결
 */
export function connectStore<T>(
  store: Store<T> | IStore<T>, 
  storeName?: string,
  _devtools: DevToolsManager = globalDevTools
): () => void {
  return _devtools.registerStore(store as Store<T>, storeName);
}

/**
 * Store를 DevTools에서 연결 해제
 */
export function disconnectStore(
  storeName: string,
  _devtools: DevToolsManager = globalDevTools
): void {
  // 실제로는 DevToolsManager에 unregisterStore 메서드가 public이어야 함
  // 현재는 dispose를 통해 모든 연결을 해제하는 방식
  console.warn(`Disconnecting single store ${storeName} is not yet implemented. Use dispose() to disconnect all stores.`);
}

/**
 * StoreRegistry를 DevTools에 연결
 */
export function connectRegistry(
  registry: StoreRegistry,
  devtools: DevToolsManager = globalDevTools
): () => void {
  const unsubscribers: Array<() => void> = [];

  // 현재 등록된 모든 Store들 연결
  const allStores = registry.getAllStores();
  allStores.forEach((_store, _name) => {
    const unsubscribe = connectStore(_store, _name, devtools);
    unsubscribers.push(unsubscribe);
  });

  // Registry 변경사항 구독 (새로운 Store가 추가될 때)
  const registryUnsubscribe = registry.subscribe(() => {
    const currentStores = registry.getAllStores();
    // 새로 추가된 Store들을 감지하고 연결
    currentStores.forEach((_store, _name) => {
      // 실제 구현에서는 이미 연결된 Store인지 확인하는 로직 필요
    });
  });

  unsubscribers.push(registryUnsubscribe);

  return () => {
    unsubscribers.forEach(unsub => unsub());
  };
}

/**
 * 자동 Store 연결 설정
 * Store가 생성될 때마다 자동으로 DevTools에 연결
 */
function setupAutoStoreConnection(): void {
  // Store 생성자를 intercept하는 방식으로 구현 가능
  // 실제로는 Store 클래스에 DevTools 연결 로직을 추가하는 것이 더 나을 수 있음
  
  if (typeof window !== 'undefined') {
    (window as any).__AUTO_CONNECT_CONTEXT_ACTION_STORES__ = true;
  }
}

/**
 * Registry 자동 감지 설정
 */
function setupAutoRegistryDetection(): void {
  // 글로벌 Registry가 생성될 때 자동으로 감지하는 로직
  if (typeof window !== 'undefined') {
    (window as any).__AUTO_DETECT_CONTEXT_ACTION_REGISTRY__ = true;
  }
}

/**
 * Action 디스패치를 DevTools에서 추적하기 위한 래퍼
 */
export function withDevToolsAction<T extends (...args: any[]) => any>(
  actionName: string,
  actionFn: T,
  storeName?: string
): T {
  return ((...args: Parameters<T>): ReturnType<T> => {
    const actionId = globalDevTools.startActionLogging(actionName, args[0], storeName);
    
    try {
      const result = actionFn(...args);
      
      // Promise인 경우 비동기 처리
      if (result && typeof result.then === 'function') {
        return result
          .then((value: any) => {
            globalDevTools.completeActionLogging(actionId, value);
            return value;
          })
          .catch((error: Error) => {
            globalDevTools.completeActionLogging(actionId, undefined, error);
            throw error;
          });
      }
      
      // 동기 결과
      globalDevTools.completeActionLogging(actionId, result);
      return result;
    } catch (error) {
      globalDevTools.completeActionLogging(actionId, undefined, error as Error);
      throw error;
    }
  }) as T;
}

/**
 * HOC: 컴포넌트를 DevTools 모니터링으로 래핑
 */
export function withDevToolsMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  const WrappedComponent = (props: P) => {
    React.useEffect(() => {
      const name = componentName || Component.displayName || Component.name;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`DevTools: Component ${name} mounted`);
      }
      
      return () => {
        if (process.env.NODE_ENV === 'development') {
          console.log(`DevTools: Component ${name} unmounted`);
        }
      };
    }, []);

    return React.createElement(Component, props);
  };

  WrappedComponent.displayName = `withDevToolsMonitoring(${componentName || Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * DevTools 상태 리셋
 */
export function resetDevToolsState(): void {
  globalDevTools.dispose();
  
  // 새로운 인스턴스 생성은 현재 구조상 어려우므로
  // 상태만 초기화하는 메서드가 필요할 수 있음
  console.log('DevTools state reset');
}

/**
 * DevTools 성능 리포트 가져오기
 */
export function getDevToolsPerformanceReport() {
  return globalDevTools.generatePerformanceReport();
}

/**
 * 개발 환경 전용 DevTools 설정
 */
export function setupDevelopmentDevTools(): void {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  setupDevTools({
    enabled: true,
    enablePerformanceMonitoring: true,
    enableStoreLogging: true,
    enableActionLogging: true,
    enableTimeTravel: true,
    connectToReduxDevTools: true,
    autoConnectStores: true,
    autoDetectRegistry: true,
    developmentOnly: true
  });

  console.log('🔧 Context-Action DevTools initialized for development');
}

/**
 * 프로덕션 환경용 최소한의 DevTools 설정
 */
export function setupProductionDevTools(): void {
  setupDevTools({
    enabled: false,
    enablePerformanceMonitoring: false,
    enableStoreLogging: false,
    enableActionLogging: false,
    enableTimeTravel: false,
    connectToReduxDevTools: false,
    developmentOnly: true
  });
}

/**
 * 조건부 DevTools 설정
 */
export function setupConditionalDevTools(condition: boolean | (() => boolean)): void {
  const shouldEnable = typeof condition === 'function' ? condition() : condition;
  
  if (shouldEnable) {
    setupDevelopmentDevTools();
  } else {
    setupProductionDevTools();
  }
}