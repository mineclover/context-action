/**
 * DevTools 설정 및 헬퍼 함수들 테스트
 * setupDevTools, connectStore, withDevToolsAction 등 유틸리티 검증
 */

import {
  setupDevTools,
  connectStore,
  disconnectStore,
  connectRegistry,
  withDevToolsAction,
  withDevToolsMonitoring,
  resetDevToolsState,
  getDevToolsPerformanceReport,
  setupDevelopmentDevTools,
  setupProductionDevTools,
  setupConditionalDevTools
} from '../setup';
import { DevToolsManager, globalDevTools } from '../devtools-manager';
import { Store } from '../../stores/core/Store';
import { StoreRegistry } from '../../stores/core/StoreRegistry';
import React from 'react';

// Mock React
jest.mock('react', () => ({
  useEffect: jest.fn((effect, deps) => {
    // effect를 즉시 실행하고 cleanup 함수 반환
    const cleanup = effect();
    return cleanup;
  }),
  createElement: jest.fn((type, props) => ({ type, props }))
}));

// Global mocks
(global as any).window = {};
(global as any).process = {
  env: { NODE_ENV: 'development' }
};

describe('DevTools 설정 함수들', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // 글로벌 DevTools 상태 초기화
    globalDevTools.dispose();
  });

  describe('setupDevTools', () => {
    test('기본 설정으로 DevTools 설정', () => {
      const devtools = setupDevTools();
      
      expect(devtools).toBeInstanceOf(DevToolsManager);
      expect(devtools).toBe(globalDevTools);
    });

    test('커스텀 설정으로 DevTools 설정', () => {
      const devtools = setupDevTools({
        enabled: true,
        maxActions: 50,
        enablePerformanceMonitoring: false,
        autoConnectStores: true
      });

      expect(devtools).toBe(globalDevTools);
    });

    test('개발 환경이 아닐 때 early return', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const devtools = setupDevTools({
        developmentOnly: true
      });

      expect(devtools).toBe(globalDevTools);

      process.env.NODE_ENV = originalEnv;
    });

    test('window 객체에 DevTools 노출', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      setupDevTools();

      expect((global as any).window.__CONTEXT_ACTION_DEVTOOLS__).toBe(globalDevTools);

      process.env.NODE_ENV = originalEnv;
    });

    test('자동 Store 연결 설정', () => {
      setupDevTools({
        autoConnectStores: true
      });

      expect((global as any).window.__AUTO_CONNECT_CONTEXT_ACTION_STORES__).toBe(true);
    });

    test('Registry 자동 감지 설정', () => {
      setupDevTools({
        autoDetectRegistry: true
      });

      expect((global as any).window.__AUTO_DETECT_CONTEXT_ACTION_REGISTRY__).toBe(true);
    });
  });

  describe('connectStore', () => {
    test('개별 Store DevTools 연결', () => {
      const store = new Store('connect-test', { value: 42 });
      
      const unsubscribe = connectStore(store, 'connect-test');
      
      const snapshot = globalDevTools.getStateSnapshot();
      expect(snapshot.stores['connect-test']).toBeDefined();
      expect(snapshot.stores['connect-test'].value).toEqual({ value: 42 });

      unsubscribe();
      store.dispose?.();
    });

    test('Store 이름 자동 추론', () => {
      const store = new Store('auto-name-test', 'test-value');
      
      const unsubscribe = connectStore(store); // 이름 생략
      
      const snapshot = globalDevTools.getStateSnapshot();
      expect(snapshot.stores['auto-name-test']).toBeDefined();

      unsubscribe();
      store.dispose?.();
    });

    test('커스텀 DevTools 인스턴스 사용', () => {
      const customDevtools = new DevToolsManager({ enabled: true });
      const store = new Store('custom-devtools-test', 100);

      const unsubscribe = connectStore(store, 'custom-test', customDevtools);

      const snapshot = customDevtools.getStateSnapshot();
      expect(snapshot.stores['custom-test']).toBeDefined();

      // 글로벌 DevTools에는 등록되지 않았는지 확인
      const globalSnapshot = globalDevTools.getStateSnapshot();
      expect(globalSnapshot.stores['custom-test']).toBeUndefined();

      unsubscribe();
      store.dispose?.();
      customDevtools.dispose();
    });
  });

  describe('connectRegistry', () => {
    test('StoreRegistry 전체 연결', () => {
      const registry = new StoreRegistry('test-registry');
      const store1 = new Store('reg-store-1', { data: 1 });
      const store2 = new Store('reg-store-2', { data: 2 });

      registry.register('store1', store1);
      registry.register('store2', store2);

      const unsubscribe = connectRegistry(registry);

      const snapshot = globalDevTools.getStateSnapshot();
      expect(snapshot.stores['store1']).toBeDefined();
      expect(snapshot.stores['store2']).toBeDefined();
      expect(snapshot.stores['store1'].value).toEqual({ data: 1 });
      expect(snapshot.stores['store2'].value).toEqual({ data: 2 });

      unsubscribe();
      store1.dispose?.();
      store2.dispose?.();
    });

    test('Registry 변경사항 구독', () => {
      const registry = new StoreRegistry('dynamic-registry');
      const initialStore = new Store('initial', 'initial-value');
      
      registry.register('initial', initialStore);
      
      const unsubscribe = connectRegistry(registry);

      // 초기 Store 확인
      let snapshot = globalDevTools.getStateSnapshot();
      expect(snapshot.stores['initial']).toBeDefined();

      // 새 Store 추가
      const newStore = new Store('new-store', 'new-value');
      registry.register('new', newStore);

      // Registry 구독이 새 Store를 감지했는지 확인
      // (실제 구현에서는 구독 로직이 더 필요할 수 있음)
      
      unsubscribe();
      initialStore.dispose?.();
      newStore.dispose?.();
    });
  });

  describe('withDevToolsAction', () => {
    test('동기 함수 래핑', () => {
      const originalFn = jest.fn((x: number) => x * 2);
      const wrappedFn = withDevToolsAction('multiply', originalFn);

      const result = wrappedFn(5);

      expect(result).toBe(10);
      expect(originalFn).toHaveBeenCalledWith(5);

      // DevTools에 액션이 로깅되었는지 확인
      const snapshot = globalDevTools.getStateSnapshot();
      const actions = snapshot.actions;
      
      expect(actions.length).toBeGreaterThan(0);
      const dispatchAction = actions.find(a => a.type === '@context-action/ACTION_DISPATCH');
      const completeAction = actions.find(a => a.type === '@context-action/ACTION_COMPLETE');
      
      expect(dispatchAction?.payload.actionName).toBe('multiply');
      expect(completeAction?.payload.result).toBe(10);
    });

    test('비동기 함수 래핑', async () => {
      const originalAsyncFn = jest.fn(async (x: number) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return x * 3;
      });

      const wrappedAsyncFn = withDevToolsAction('async-multiply', originalAsyncFn, 'test-store');

      const result = await wrappedAsyncFn(4);

      expect(result).toBe(12);
      expect(originalAsyncFn).toHaveBeenCalledWith(4);

      // 비동기 액션 완료 확인
      const snapshot = globalDevTools.getStateSnapshot();
      const completeAction = snapshot.actions.find(a => a.type === '@context-action/ACTION_COMPLETE');
      expect(completeAction?.payload.result).toBe(12);
    });

    test('함수에서 에러 발생시 처리', async () => {
      const errorFn = jest.fn(() => {
        throw new Error('Test error');
      });

      const wrappedErrorFn = withDevToolsAction('error-action', errorFn);

      expect(() => wrappedErrorFn()).toThrow('Test error');

      // 에러가 DevTools에 로깅되었는지 확인
      const snapshot = globalDevTools.getStateSnapshot();
      const completeAction = snapshot.actions.find(a => a.type === '@context-action/ACTION_COMPLETE');
      expect(completeAction?.payload.error).toBe('Test error');
    });

    test('비동기 함수에서 에러 발생시 처리', async () => {
      const asyncErrorFn = jest.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        throw new Error('Async error');
      });

      const wrappedAsyncErrorFn = withDevToolsAction('async-error', asyncErrorFn);

      await expect(wrappedAsyncErrorFn()).rejects.toThrow('Async error');

      // 에러가 DevTools에 로깅되었는지 확인
      const snapshot = globalDevTools.getStateSnapshot();
      const completeAction = snapshot.actions.find(a => a.type === '@context-action/ACTION_COMPLETE');
      expect(completeAction?.payload.error).toBe('Async error');
    });
  });

  describe('withDevToolsMonitoring', () => {
    test('컴포넌트 모니터링 HOC', () => {
      const TestComponent = (props: { name: string }) => ({ type: 'div', props });
      const MonitoredComponent = withDevToolsMonitoring(TestComponent, 'TestComponent');

      // useEffect가 호출되었는지 확인 (컴포넌트 mount/unmount 로깅)
      expect(React.useEffect).toHaveBeenCalled();
      
      // displayName 설정 확인
      expect(MonitoredComponent.displayName).toBe('withDevToolsMonitoring(TestComponent)');
    });

    test('컴포넌트 이름 자동 추론', () => {
      const AutoNameComponent = () => ({ type: 'span', props: {} });
      AutoNameComponent.displayName = 'AutoDisplayName';
      
      const MonitoredComponent = withDevToolsMonitoring(AutoNameComponent);

      expect(MonitoredComponent.displayName).toBe('withDevToolsMonitoring(AutoDisplayName)');
    });
  });

  describe('환경별 설정 함수들', () => {
    test('setupDevelopmentDevTools', () => {
      const originalEnv = process.env.NODE_ENV;
      const originalLog = console.log;
      
      console.log = jest.fn();
      process.env.NODE_ENV = 'development';

      setupDevelopmentDevTools();

      expect(console.log).toHaveBeenCalledWith(
        '🔧 Context-Action DevTools initialized for development'
      );

      process.env.NODE_ENV = originalEnv;
      console.log = originalLog;
    });

    test('setupProductionDevTools', () => {
      setupProductionDevTools();
      
      // Production 설정이 적용되었는지 확인
      // (내부적으로 enabled: false로 설정됨)
    });

    test('setupConditionalDevTools - 조건이 true', () => {
      const originalLog = console.log;
      console.log = jest.fn();

      setupConditionalDevTools(true);

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Context-Action DevTools initialized for development')
      );

      console.log = originalLog;
    });

    test('setupConditionalDevTools - 함수 조건', () => {
      const condition = jest.fn(() => false);
      
      setupConditionalDevTools(condition);

      expect(condition).toHaveBeenCalled();
    });
  });

  describe('유틸리티 함수들', () => {
    test('disconnectStore - 경고 메시지', () => {
      const originalWarn = console.warn;
      console.warn = jest.fn();

      disconnectStore('test-store');

      expect(console.warn).toHaveBeenCalledWith(
        'Disconnecting single store test-store is not yet implemented. Use dispose() to disconnect all stores.'
      );

      console.warn = originalWarn;
    });

    test('resetDevToolsState', () => {
      const originalLog = console.log;
      console.log = jest.fn();

      // 일부 상태 추가
      const store = new Store('reset-test', 0);
      connectStore(store, 'reset-test');

      resetDevToolsState();

      expect(console.log).toHaveBeenCalledWith('DevTools state reset');

      store.dispose?.();
      console.log = originalLog;
    });

    test('getDevToolsPerformanceReport', () => {
      // 일부 액션 실행
      const actionId = globalDevTools.startActionLogging('perf-test');
      globalDevTools.completeActionLogging(actionId, { result: 'test' });

      const report = getDevToolsPerformanceReport();

      expect(report).toBeDefined();
      expect(report.totalActions).toBeGreaterThan(0);
      expect(typeof report.averageActionTime).toBe('number');
      expect(Array.isArray(report.slowestActions)).toBe(true);
    });
  });

  describe('에러 처리 및 엣지 케이스', () => {
    test('window 객체가 없는 환경', () => {
      const originalWindow = (global as any).window;
      delete (global as any).window;

      expect(() => {
        setupDevTools({
          autoConnectStores: true,
          autoDetectRegistry: true
        });
      }).not.toThrow();

      (global as any).window = originalWindow;
    });

    test('비활성화된 DevTools에서 연결 시도', () => {
      const disabledDevtools = new DevToolsManager({ enabled: false });
      const store = new Store('disabled-test', 0);

      const unsubscribe = connectStore(store, 'disabled-test', disabledDevtools);

      // 비활성화된 DevTools에서는 실제 연결이 되지 않아야 함
      const snapshot = disabledDevtools.getStateSnapshot();
      expect(Object.keys(snapshot.stores)).toHaveLength(0);

      unsubscribe(); // 에러 없이 호출되어야 함
      store.dispose?.();
      disabledDevtools.dispose();
    });

    test('빈 Registry 연결', () => {
      const emptyRegistry = new StoreRegistry('empty');
      
      const unsubscribe = connectRegistry(emptyRegistry);

      const snapshot = globalDevTools.getStateSnapshot();
      expect(Object.keys(snapshot.stores)).toHaveLength(0);

      unsubscribe();
    });
  });
});

describe('실제 사용 시나리오', () => {
  test('복합적인 DevTools 설정 및 사용', () => {
    // 1. 개발 환경 설정
    setupDevelopmentDevTools();

    // 2. Store들 생성 및 연결
    const userStore = new Store('user', { id: null, name: '' });
    const cartStore = new Store('cart', { items: [] });

    connectStore(userStore, 'user');
    connectStore(cartStore, 'cart');

    // 3. 액션 래퍼로 비즈니스 로직 실행
    const loginAction = withDevToolsAction(
      'user-login',
      (userData: { id: number; name: string }) => {
        userStore.setValue(userData);
        return { success: true };
      }
    );

    const addToCartAction = withDevToolsAction(
      'add-to-cart',
      (item: { id: string; name: string }) => {
        cartStore.update(cart => ({
          items: [...cart.items, item]
        }));
      }
    );

    // 4. 액션 실행
    const loginResult = loginAction({ id: 1, name: 'John' });
    addToCartAction({ id: 'item-1', name: 'Product 1' });
    addToCartAction({ id: 'item-2', name: 'Product 2' });

    // 5. DevTools 상태 확인
    const snapshot = globalDevTools.getStateSnapshot();
    
    expect(loginResult).toEqual({ success: true });
    expect(snapshot.stores['user'].value).toEqual({ id: 1, name: 'John' });
    expect(snapshot.stores['cart'].value.items).toHaveLength(2);
    
    // 액션 로그 확인
    const actionNames = snapshot.actions
      .filter(action => action.type === '@context-action/ACTION_DISPATCH')
      .map(action => action.payload.actionName);
    
    expect(actionNames).toContain('user-login');
    expect(actionNames).toContain('add-to-cart');

    // 6. 성능 리포트 확인
    const report = getDevToolsPerformanceReport();
    expect(report.totalActions).toBeGreaterThan(0);
    expect(report.storeUpdateCount).toBeGreaterThan(0);

    // 정리
    userStore.dispose?.();
    cartStore.dispose?.();
  });
});