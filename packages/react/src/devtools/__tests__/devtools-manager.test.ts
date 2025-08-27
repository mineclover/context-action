/**
 * DevTools 매니저 테스트
 * Store 모니터링, Action 로깅, 성능 측정 등 DevTools 핵심 기능 검증
 */

import { DevToolsManager, globalDevTools } from '../devtools-manager';
import { Store } from '../../stores/core/Store';

// Mock Redux DevTools Extension
const mockDevToolsExtension = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  send: jest.fn(),
  init: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn()
};

// Global mocks
(global as any).window = {
  __REDUX_DEVTOOLS_EXTENSION__: mockDevToolsExtension
};

(global as any).performance = {
  now: jest.fn(() => Date.now()),
  memory: {
    usedJSHeapSize: 1024 * 1024 // 1MB
  }
};

describe('DevToolsManager', () => {
  let devtools: DevToolsManager;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDevToolsExtension.connect.mockReturnValue({
      init: jest.fn(),
      send: jest.fn(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn()
    });

    devtools = new DevToolsManager({
      enabled: true,
      connectToReduxDevTools: true,
      developmentOnly: false
    });
  });

  afterEach(() => {
    devtools.dispose();
  });

  describe('초기화 및 설정', () => {
    test('기본 설정으로 DevTools 생성', () => {
      const devtools = new DevToolsManager();
      
      const snapshot = devtools.getStateSnapshot();
      expect(snapshot.stores).toEqual({});
      expect(snapshot.actions).toEqual([]);
      expect(snapshot.performance.totalActions).toBe(0);
    });

    test('커스텀 설정으로 DevTools 생성', () => {
      const customDevtools = new DevToolsManager({
        enabled: true,
        maxActions: 50,
        enablePerformanceMonitoring: false,
        enableStoreLogging: false
      });

      const snapshot = customDevtools.getStateSnapshot();
      expect(snapshot).toBeDefined();

      customDevtools.dispose();
    });

    test('개발 환경 설정 확인', () => {
      const originalEnv = process.env.NODE_ENV;
      
      // Production 환경
      process.env.NODE_ENV = 'production';
      const prodDevtools = new DevToolsManager({ developmentOnly: true });
      expect(mockDevToolsExtension.connect).not.toHaveBeenCalled();
      prodDevtools.dispose();

      // Development 환경
      process.env.NODE_ENV = 'development';
      const devDevtools = new DevToolsManager({ 
        developmentOnly: true,
        connectToReduxDevTools: true
      });
      expect(mockDevToolsExtension.connect).toHaveBeenCalled();
      devDevtools.dispose();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Store 등록 및 모니터링', () => {
    test('Store 등록과 기본 모니터링', () => {
      const store = new Store('test-store', { count: 0 });
      const unregister = devtools.registerStore(store, 'test-store');

      const snapshot = devtools.getStateSnapshot();
      expect(snapshot.stores['test-store']).toBeDefined();
      expect(snapshot.stores['test-store'].value).toEqual({ count: 0 });
      expect(snapshot.stores['test-store'].version).toBe(0);

      // 정리
      unregister();
      store.dispose?.();
    });

    test('Store 값 변경 모니터링', (done) => {
      const store = new Store('test-store', 10);
      devtools.registerStore(store, 'test-store');

      // Store 변경
      store.setValue(20);

      // 비동기 처리를 위해 약간 대기
      setTimeout(() => {
        const snapshot = devtools.getStateSnapshot();
        expect(snapshot.stores['test-store'].value).toBe(20);
        expect(snapshot.stores['test-store'].version).toBe(1);

        // Action 로그 확인
        const storeUpdateActions = snapshot.actions.filter(
          action => action.type === '@context-action/STORE_UPDATE'
        );
        expect(storeUpdateActions).toHaveLength(1);
        expect(storeUpdateActions[0].payload.storeName).toBe('test-store');
        expect(storeUpdateActions[0].payload.value).toBe(20);

        store.dispose?.();
        done();
      }, 10);
    });

    test('여러 Store 동시 모니터링', () => {
      const userStore = new Store('user-store', { name: 'John' });
      const counterStore = new Store('counter-store', 0);

      devtools.registerStore(userStore, 'user');
      devtools.registerStore(counterStore, 'counter');

      const snapshot = devtools.getStateSnapshot();
      expect(snapshot.stores['user']).toBeDefined();
      expect(snapshot.stores['counter']).toBeDefined();
      expect(snapshot.stores['user'].value).toEqual({ name: 'John' });
      expect(snapshot.stores['counter'].value).toBe(0);

      userStore.dispose?.();
      counterStore.dispose?.();
    });
  });

  describe('Action 로깅', () => {
    test('기본 Action 로깅', () => {
      const actionId = devtools.startActionLogging('test-action', { data: 'test' });
      
      expect(actionId).toBeTruthy();
      
      devtools.completeActionLogging(actionId, { result: 'success' });

      const snapshot = devtools.getStateSnapshot();
      const actions = snapshot.actions;

      expect(actions).toHaveLength(2); // START + COMPLETE
      expect(actions[0].type).toBe('@context-action/ACTION_DISPATCH');
      expect(actions[0].payload.actionName).toBe('test-action');
      expect(actions[1].type).toBe('@context-action/ACTION_COMPLETE');
      expect(actions[1].payload.result).toEqual({ result: 'success' });
    });

    test('에러가 있는 Action 로깅', () => {
      const actionId = devtools.startActionLogging('error-action');
      const error = new Error('Test error');
      
      devtools.completeActionLogging(actionId, undefined, error);

      const snapshot = devtools.getStateSnapshot();
      const completeAction = snapshot.actions.find(
        action => action.type === '@context-action/ACTION_COMPLETE'
      );

      expect(completeAction?.payload.error).toBe('Test error');
    });

    test('성능 모니터링이 포함된 Action 로깅', (done) => {
      const mockPerformanceNow = jest.fn()
        .mockReturnValueOnce(1000) // 시작 시간
        .mockReturnValueOnce(1100); // 끝 시간

      (global.performance.now as jest.Mock) = mockPerformanceNow;

      const actionId = devtools.startActionLogging('perf-action');
      
      setTimeout(() => {
        devtools.completeActionLogging(actionId, { result: 'done' });

        const snapshot = devtools.getStateSnapshot();
        const completeAction = snapshot.actions.find(
          action => action.type === '@context-action/ACTION_COMPLETE'
        );

        expect(completeAction?.duration).toBe(100);
        expect(snapshot.performance.totalActions).toBe(1);
        done();
      }, 50);
    });

    test('Action 히스토리 최대 개수 제한', () => {
      const smallDevtools = new DevToolsManager({ 
        maxActions: 3,
        enabled: true 
      });

      // 5개 액션 로깅 (최대 3개만 유지되어야 함)
      for (let i = 0; i < 5; i++) {
        const actionId = smallDevtools.startActionLogging(`action-${i}`);
        smallDevtools.completeActionLogging(actionId);
      }

      const snapshot = smallDevtools.getStateSnapshot();
      expect(snapshot.actions.length).toBeLessThanOrEqual(3);

      smallDevtools.dispose();
    });
  });

  describe('성능 모니터링', () => {
    test('성능 통계 추적', () => {
      const mockPerformanceNow = jest.fn()
        .mockReturnValueOnce(1000)  // action1 시작
        .mockReturnValueOnce(1050)  // action1 끝 (50ms)
        .mockReturnValueOnce(2000)  // action2 시작  
        .mockReturnValueOnce(2200); // action2 끝 (200ms)

      (global.performance.now as jest.Mock) = mockPerformanceNow;

      const action1Id = devtools.startActionLogging('fast-action');
      devtools.completeActionLogging(action1Id);

      const action2Id = devtools.startActionLogging('slow-action');
      devtools.completeActionLogging(action2Id);

      const snapshot = devtools.getStateSnapshot();
      expect(snapshot.performance.totalActions).toBe(2);
      expect(snapshot.performance.averageActionTime).toBe(125); // (50 + 200) / 2
    });

    test('느린 액션 추적', () => {
      const mockPerformanceNow = jest.fn()
        .mockReturnValueOnce(1000)  // 시작
        .mockReturnValueOnce(1010)  // 끝 (10ms) - 빠른 액션
        .mockReturnValueOnce(2000)  // 시작
        .mockReturnValueOnce(2500); // 끝 (500ms) - 느린 액션

      (global.performance.now as jest.Mock) = mockPerformanceNow;

      const fastId = devtools.startActionLogging('fast');
      devtools.completeActionLogging(fastId);

      const slowId = devtools.startActionLogging('slow');  
      devtools.completeActionLogging(slowId);

      const snapshot = devtools.getStateSnapshot();
      
      // 평균의 2배 이상인 액션은 느린 액션으로 분류
      const avgTime = snapshot.performance.averageActionTime;
      expect(snapshot.performance.slowActions.length).toBeGreaterThan(0);
    });

    test('성능 리포트 생성', () => {
      const store = new Store('perf-store', 0);
      devtools.registerStore(store);

      store.setValue(1);
      store.setValue(2);

      const actionId = devtools.startActionLogging('test-action');
      devtools.completeActionLogging(actionId);

      const report = devtools.generatePerformanceReport();

      expect(report.totalActions).toBe(1);
      expect(report.storeUpdateCount).toBeGreaterThan(0);
      expect(report.memoryUsage).toBe(1024 * 1024); // Mock 값

      store.dispose?.();
    });
  });

  describe('Redux DevTools 연동', () => {
    test('Redux DevTools Extension 연결', () => {
      expect(mockDevToolsExtension.connect).toHaveBeenCalledWith({
        name: 'Context-Action DevTools',
        features: expect.objectContaining({
          jump: true,
          pause: true,
          lock: true
        })
      });
    });

    test('Redux DevTools로 상태 전송', (done) => {
      const mockConnection = {
        init: jest.fn(),
        send: jest.fn(),
        subscribe: jest.fn(),
        unsubscribe: jest.fn()
      };

      mockDevToolsExtension.connect.mockReturnValue(mockConnection);

      const devtools = new DevToolsManager({
        enabled: true,
        connectToReduxDevTools: true
      });

      const store = new Store('redux-test', 100);
      devtools.registerStore(store);

      store.setValue(200);

      setTimeout(() => {
        expect(mockConnection.send).toHaveBeenCalled();
        
        const sendCall = mockConnection.send.mock.calls[0];
        expect(sendCall[0].type).toBe('@context-action/STORE_UPDATE');
        expect(sendCall[1].stores['redux-test'].value).toBe(200);

        devtools.dispose();
        store.dispose?.();
        done();
      }, 10);
    });

    test('Time travel 처리', () => {
      const mockConnection = {
        init: jest.fn(),
        send: jest.fn(),
        subscribe: jest.fn((callback: Function) => {
          // Time travel 메시지 시뮬레이션
          setTimeout(() => {
            callback({
              type: 'DISPATCH',
              payload: { 
                type: 'JUMP_TO_STATE' 
              },
              state: {
                stores: {
                  'test-store': { value: 999, timestamp: Date.now(), version: 5 }
                }
              }
            });
          }, 10);
        }),
        unsubscribe: jest.fn()
      };

      mockDevToolsExtension.connect.mockReturnValue(mockConnection);

      const devtools = new DevToolsManager({
        enabled: true,
        connectToReduxDevTools: true,
        enableTimeTravel: true
      });

      expect(mockConnection.subscribe).toHaveBeenCalled();

      devtools.dispose();
    });
  });

  describe('설정 업데이트', () => {
    test('런타임 설정 변경', () => {
      devtools.updateConfig({
        maxActions: 25,
        enablePerformanceMonitoring: false
      });

      // 설정 변경 후 동작 확인
      const actionId = devtools.startActionLogging('config-test');
      devtools.completeActionLogging(actionId);

      const snapshot = devtools.getStateSnapshot();
      expect(snapshot.actions).toHaveLength(2); // 성능 모니터링 비활성화되어도 로깅은 됨
    });

    test('Redux DevTools 연결 토글', () => {
      const originalConnectValue = mockDevToolsExtension.connect;
      
      devtools.updateConfig({ connectToReduxDevTools: false });
      
      devtools.updateConfig({ connectToReduxDevTools: true });
      expect(mockDevToolsExtension.connect).toHaveBeenCalled();
    });
  });

  describe('연결 관리', () => {
    test('커스텀 DevTools 연결 추가', () => {
      const mockCustomConnection = {
        init: jest.fn(),
        send: jest.fn()
      };

      const removeConnection = devtools.addConnection(mockCustomConnection);

      expect(mockCustomConnection.init).toHaveBeenCalledWith(
        expect.objectContaining({
          stores: {},
          actions: []
        })
      );

      // 연결 제거
      removeConnection();

      // 이후 액션 로깅시 커스텀 연결로는 전송되지 않아야 함
      const actionId = devtools.startActionLogging('after-disconnect');
      devtools.completeActionLogging(actionId);

      expect(mockCustomConnection.send).not.toHaveBeenCalled();
    });

    test('여러 연결 동시 관리', () => {
      const connection1 = { init: jest.fn(), send: jest.fn() };
      const connection2 = { init: jest.fn(), send: jest.fn() };

      devtools.addConnection(connection1);
      devtools.addConnection(connection2);

      const actionId = devtools.startActionLogging('multi-connection');
      devtools.completeActionLogging(actionId);

      expect(connection1.send).toHaveBeenCalled();
      expect(connection2.send).toHaveBeenCalled();
    });
  });

  describe('정리 및 해제', () => {
    test('dispose로 모든 연결 정리', () => {
      const store = new Store('cleanup-test', 0);
      const unregister = devtools.registerStore(store);

      const mockConnection = { init: jest.fn(), send: jest.fn() };
      devtools.addConnection(mockConnection);

      devtools.dispose();

      // dispose 후에는 Store 변경이 모니터링되지 않아야 함
      store.setValue(100);

      const snapshot = devtools.getStateSnapshot();
      expect(Object.keys(snapshot.stores)).toHaveLength(0);

      store.dispose?.();
    });

    test('개별 Store 등록 해제', () => {
      const store1 = new Store('store1', 1);
      const store2 = new Store('store2', 2);

      const unregister1 = devtools.registerStore(store1, 'store1');
      devtools.registerStore(store2, 'store2');

      let snapshot = devtools.getStateSnapshot();
      expect(Object.keys(snapshot.stores)).toHaveLength(2);

      // store1만 등록 해제
      unregister1();

      // store1 변경은 모니터링되지 않아야 함
      store1.setValue(100);
      store2.setValue(200);

      setTimeout(() => {
        snapshot = devtools.getStateSnapshot();
        expect(snapshot.stores['store1']).toBeUndefined();
        expect(snapshot.stores['store2'].value).toBe(200);
      }, 10);

      store1.dispose?.();
      store2.dispose?.();
    });
  });
});

describe('globalDevTools', () => {
  test('싱글톤 인스턴스 접근', () => {
    expect(globalDevTools).toBeInstanceOf(DevToolsManager);
    
    // 동일한 인스턴스인지 확인
    const anotherReference = globalDevTools;
    expect(anotherReference).toBe(globalDevTools);
  });

  test('글로벌 인스턴스로 Store 등록', () => {
    const store = new Store('global-test', { data: 'test' });
    const unregister = globalDevTools.registerStore(store);

    const snapshot = globalDevTools.getStateSnapshot();
    expect(snapshot.stores['global-test']).toBeDefined();

    unregister();
    store.dispose?.();
  });
});

describe('에러 처리', () => {
  test('Redux DevTools 연결 실패 처리', () => {
    const originalConsoleError = console.error;
    console.error = jest.fn();

    // Redux DevTools가 없는 환경 시뮬레이션
    const originalExtension = (global as any).window.__REDUX_DEVTOOLS_EXTENSION__;
    delete (global as any).window.__REDUX_DEVTOOLS_EXTENSION__;

    const devtools = new DevToolsManager({
      enabled: true,
      connectToReduxDevTools: true
    });

    // 에러가 발생해도 DevTools는 정상 작동해야 함
    const store = new Store('error-test', 0);
    const unregister = devtools.registerStore(store);

    store.setValue(1);

    const snapshot = devtools.getStateSnapshot();
    expect(snapshot.stores['error-test'].value).toBe(1);

    // 정리
    unregister();
    store.dispose?.();
    devtools.dispose();

    (global as any).window.__REDUX_DEVTOOLS_EXTENSION__ = originalExtension;
    console.error = originalConsoleError;
  });

  test('연결 전송 실패 처리', () => {
    const originalConsoleWarn = console.warn;
    console.warn = jest.fn();

    const faultyConnection = {
      init: jest.fn(),
      send: jest.fn(() => {
        throw new Error('Connection failed');
      })
    };

    devtools.addConnection(faultyConnection);

    // 연결 전송 실패해도 다른 기능은 정상 작동해야 함
    const actionId = devtools.startActionLogging('faulty-connection');
    devtools.completeActionLogging(actionId);

    expect(console.warn).toHaveBeenCalledWith(
      'Failed to send to DevTools connection:',
      expect.any(Error)
    );

    console.warn = originalConsoleWarn;
  });
});