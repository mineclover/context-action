# 프로덕션 디버깅 마이그레이션 가이드

Context-Action 프레임워크 애플리케이션에서 고급 디버깅 패턴 구현을 위한 제안-마이그레이션 프로세스입니다.

## 전제조건

**필수 설정**: 이 가이드는 설정된 설정 패턴을 기반으로 합니다. 먼저 기본 컨텍스트를 구성하세요:

- **[기본 액션 설정](../setup/basic-action-setup.md)** - 디버깅 액션이 포함된 액션 컨텍스트 구성
- **[기본 스토어 설정](../setup/basic-store-setup.md)** - 디버그 상태 관리를 위한 스토어 컨텍스트 구성
- **[다중 컨텍스트 설정](../setup/multi-context-setup.md)** - 다중 컨텍스트가 필요한 복잡한 디버깅 시나리오

**제안된 개선사항**: 고급 타입 정의 및 모니터링 기능은 **[디버그 스토어 타입 제안](../proposals/debug-store-types.md)**을 참조하세요.

## 📋 마이그레이션 프로세스

1. [핵심 이슈 마이그레이션](#핵심-이슈-마이그레이션)
2. [모니터링 통합](#모니터링-통합)  
3. [복구 패턴 구현](#복구-패턴-구현)
4. [테스팅 인프라 설정](#테스팅-인프라-설정)
5. [일반적인 시나리오 솔루션](#일반적인-시나리오-솔루션)

---

## 핵심 이슈 마이그레이션

### 임시적에서 체계적 디버깅으로 마이그레이션

**현재 문제**: 개발 팀 간 일관되지 않은 디버깅 접근 방식.

**마이그레이션 전략**: Context-Action 프레임워크 컨벤션을 사용하여 디버깅 패턴을 표준화합니다.

### ⚠️ 액션 핸들러 등록 패턴

**문제**: 일관되지 않은 핸들러 등록으로 디버깅이 어려움.

**설정 통합**: [기본 액션 설정](../setup/basic-action-setup.md) 네이밍 컨벤션을 따름:

```tsx
// ✅ 표준: 설정 기반 액션 패턴 사용
import { useEventHandler } from '../actions/EventActions';

// 기본 액션 설정에서 - EventActions 패턴
interface DebugEventActions {
  updateResults: { data: any; debugInfo?: { timestamp: number; source: string } };
  trackError: { error: Error; context: string };
  logPerformance: { operation: string; duration: number };
}

const updateResultsHandler = useCallback(async (payload) => {
  const { data, debugInfo } = payload;
  
  // 디버그 정보가 제공된 경우 로그
  if (debugInfo && process.env.NODE_ENV === 'development') {
    console.log(`[${debugInfo.timestamp}] Update from: ${debugInfo.source}`);
  }
  
  resultStore.setValue(data);
}, [resultStore]);

useEventHandler('updateResults', updateResultsHandler);
```

**마이그레이션 명령**: `grep -rn "useActionHandler" src/ | grep -v "useCallback"`

### 🔄 경쟁 상태 방지 패턴

**문제**: 동시 작업으로 인한 상태 불일치.

**설정 통합**: [기본 스토어 설정](../setup/basic-store-setup.md) 패턴 사용:

```tsx
// ✅ 표준: 스토어 설정 컨벤션 따름
import { useUIStore, useUIStoreManager } from '../stores/UIStores';

// 기본 스토어 설정에서 - UIStores 패턴
const {  
  Provider: DebugUIStoreProvider,
  useStore: useDebugUIStore,
  useStoreManager: useDebugUIStoreManager
} = createStoreContext('DebugUI', {
  operationState: {
    initialValue: {
      isProcessing: false,
      currentOperation: null as string | null,
      operationQueue: [] as string[]
    },
    strategy: 'shallow' as const
  },
  debugMetrics: {
    initialValue: {
      operationCount: 0,
      averageTime: 0,
      errorCount: 0
    },
    strategy: 'shallow' as const
  }
});

const criticalActionHandler = useCallback(async (payload) => {
  const operationStore = useDebugUIStore('operationState');
  const currentState = operationStore.getValue();
  
  if (currentState.isProcessing) {
    // 무시하는 대신 작업을 큐에 추가
    operationStore.update(prev => ({
      ...prev,
      operationQueue: [...prev.operationQueue, payload.operationId]
    }));
    return;
  }
  
  const startTime = performance.now();
  operationStore.setValue({
    isProcessing: true,
    currentOperation: payload.operationId,
    operationQueue: currentState.operationQueue
  });
  
  try {
    await performCriticalOperation(payload);
    
    // 메트릭 업데이트
    const duration = performance.now() - startTime;
    const metricsStore = useDebugUIStore('debugMetrics');
    metricsStore.update(prev => ({
      operationCount: prev.operationCount + 1,
      averageTime: (prev.averageTime * prev.operationCount + duration) / (prev.operationCount + 1),
      errorCount: prev.errorCount
    }));
  } catch (error) {
    // 오류 처리 및 메트릭 업데이트
    const metricsStore = useDebugUIStore('debugMetrics');
    metricsStore.update(prev => ({ ...prev, errorCount: prev.errorCount + 1 }));
    throw error;
  } finally {
    operationStore.setValue({
      isProcessing: false,
      currentOperation: null,
      operationQueue: currentState.operationQueue
    });
  }
}, []);

// ✅ 표준: 컴포넌트가 네이밍 컨벤션을 따름
function DebugActionButton() {
  const operationStore = useDebugUIStore('operationState');
  const metricsStore = useDebugUIStore('debugMetrics');
  const operationState = useStoreValue(operationStore);
  const metrics = useStoreValue(metricsStore);
  const dispatch = useEventDispatch();
  
  return (
    <div>
      <button
        onClick={() => dispatch('criticalAction', { operationId: Date.now().toString() })}
        disabled={operationState.isProcessing}
      >
        {operationState.isProcessing 
          ? `⏳ Processing ${operationState.currentOperation}...` 
          : 'Execute Action'
        }
      </button>
      <div>Operations: {metrics.operationCount} | Errors: {metrics.errorCount}</div>
    </div>
  );
}
```

### 🔧 라이프사이클 관리 패턴

**문제**: 컴포넌트 라이프사이클과 디버깅 상태 관리 간의 충돌.

**설정 통합**: [RefContext 설정](../setup/ref-context-setup.md) 컨벤션을 따름:

```tsx
// ✅ 표준: ref context 설정 패턴 사용
import { useRefHandler } from '../contexts/RefContext';
import { useDebugUIStore } from '../stores/DebugUIStores';

function DebugComponent({ componentId }: { componentId: string }) {
  const elementRef = useRefHandler(componentId);
  const lifecycleStore = useDebugUIStore('lifecycle');
  
  useEffect(() => {
    // 디버깅을 위한 컴포넌트 라이프사이클 추적
    lifecycleStore.update(prev => ({
      ...prev,
      mountedComponents: {
        ...prev.mountedComponents,
        [componentId]: {
          mountTime: Date.now(),
          refStatus: 'mounting',
          debugInfo: { source: 'useEffect' }
        }
      }
    }));
    
    return () => {
      // 언마운팅 추적
      lifecycleStore.update(prev => ({
        ...prev,
        mountedComponents: {
          ...prev.mountedComponents,
          [componentId]: {
            ...prev.mountedComponents[componentId],
            unmountTime: Date.now(),
            refStatus: 'unmounting'
          }
        }
      }));
    };
  }, [componentId, lifecycleStore]);
  
  // React가 DOM을 처리하고, 액션이 비즈니스 로직 처리
  return <div ref={elementRef.setRef} data-debug-id={componentId} />;
}

// ✅ 표준: 액션 핸들러가 네이밍 컨벤션을 따름
const cleanupComponentHandler = useCallback(async ({ componentId }) => {
  const lifecycleStore = useDebugUIStore('lifecycle');
  const currentState = lifecycleStore.getValue();
  
  if (currentState.mountedComponents[componentId]) {
    // 먼저 라이프사이클 상태 업데이트
    lifecycleStore.update(prev => ({
      ...prev,
      mountedComponents: {
        ...prev.mountedComponents,
        [componentId]: {
          ...prev.mountedComponents[componentId],
          refStatus: 'cleaned',
          cleanupTime: Date.now()
        }
      }
    }));
    
    // 선택사항: 디버깅이 필요한 경우 ref 상태 정리
    const elementRef = useRefHandler(componentId);
    if (elementRef.target) {
      console.log(`[Debug] Cleaning up ref for ${componentId}`);
      elementRef.setRef(null);
    }
  }
}, []);

useEventHandler('cleanupComponent', cleanupComponentHandler);
```

---

## 모니터링 통합

### 체계적인 상태 모니터링 마이그레이션

**현재 문제**: 컴포넌트 전반에 흩어진 모니터링 로직.

**마이그레이션 전략**: 설정된 스토어 패턴을 사용하여 모니터링을 중앙화합니다.

### 📊 모니터링 스토어 통합

**설정 통합**: [기본 스토어 설정](../setup/basic-store-setup.md) 타입 패턴을 따름:

```tsx
// ✅ 표준: 스토어 설정 타입 컨벤션을 따름
interface MonitoringStores {
  actionLog: {
    entries: Array<{
      id: string;
      timestamp: number;
      actionType: string;
      payload?: any;
      duration?: number;
    }>;
    maxEntries: number;
    isEnabled: boolean;
  };
  errorTracking: {
    errors: Array<{
      id: string;
      timestamp: number;
      message: string;
      stack?: string;
      context: string;
    }>;
    totalCount: number;
    resolvedCount: number;
  };
  performanceMetrics: {
    operations: Record<string, {
      totalCalls: number;
      averageTime: number;
      lastCall: number;
    }>;
    memoryUsage: number;
    renderCount: number;
  };
}

// 스토어 설정 패턴 사용
const {
  Provider: MonitoringStoreProvider,
  useStore: useMonitoringStore,
  useStoreManager: useMonitoringStoreManager
} = createStoreContext('Monitoring', {
  actionLog: {
    initialValue: {
      entries: [],
      maxEntries: 50,
      isEnabled: process.env.NODE_ENV === 'development'
    },
    strategy: 'shallow' as const
  },
  errorTracking: {
    initialValue: {
      errors: [],
      totalCount: 0,
      resolvedCount: 0
    },
    strategy: 'shallow' as const
  },
  performanceMetrics: {
    initialValue: {
      operations: {},
      memoryUsage: 0,
      renderCount: 0
    },
    strategy: 'shallow' as const
  }
});

// 액션 핸들러가 네이밍 컨벤션을 따름
const logActionHandler = useCallback(async ({ actionType, payload, duration }) => {
  const actionLogStore = useMonitoringStore('actionLog');
  const currentLog = actionLogStore.getValue();
  
  if (!currentLog.isEnabled) return;
  
  const logEntry = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    actionType,
    payload: process.env.NODE_ENV === 'development' ? payload : undefined,
    duration
  };
  
  actionLogStore.update(prev => ({
    ...prev,
    entries: [
      ...prev.entries.slice(-(prev.maxEntries - 1)),
      logEntry
    ]
  }));
}, []);

useEventHandler('logAction', logActionHandler);
```

### 🔍 디버그 유틸리티 통합

**설정 통합**: 프레임워크 컨벤션을 따르는 유틸리티 함수들:

```tsx
// ✅ 표준: 네이밍 컨벤션을 따르는 디버그 유틸리티
interface StateLogger<T> {
  storeName: string;
  logCurrent: () => void;
  logChange: (action: string) => (after: T) => void;
  logHistory: () => void;
  exportSnapshot: () => { storeName: string; value: T; timestamp: number };
}

// 설정의 스토어 매니저 패턴을 따름
const createDebugStateLogger = <T>(
  storeName: string, 
  store: Store<T>,
  monitoringManager: ReturnType<typeof useMonitoringStoreManager>
): StateLogger<T> => {
  return {
    storeName,
    logCurrent: () => {
      const value = store.getValue();
      console.log(`[${storeName}] Current:`, value);
      
      // 모니터링 스토어에 로그
      const actionLogStore = monitoringManager.getStore('actionLog');
      const logEntry = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actionType: 'STATE_LOG',
        payload: { storeName, operation: 'logCurrent' }
      };
      
      actionLogStore.update(prev => ({
        ...prev,
        entries: [...prev.entries.slice(-49), logEntry]
      }));
    },
    logChange: (action: string) => {
      const before = store.getValue();
      return (after: T) => {
        console.log(`[${storeName}] ${action}:`, { before, after });
        
        // 상태 변경 추적
        const performanceStore = monitoringManager.getStore('performanceMetrics');
        performanceStore.update(prev => ({
          ...prev,
          operations: {
            ...prev.operations,
            [`${storeName}_${action}`]: {
              totalCalls: (prev.operations[`${storeName}_${action}`]?.totalCalls || 0) + 1,
              averageTime: 0, // 실제 타이밍에서 계산됨
              lastCall: Date.now()
            }
          }
        }));
      };
    },
    logHistory: () => {
      const actionLogStore = monitoringManager.getStore('actionLog');
      const logs = actionLogStore.getValue().entries
        .filter(entry => entry.payload?.storeName === storeName);
      console.table(logs);
    },
    exportSnapshot: () => ({
      storeName,
      value: store.getValue(),
      timestamp: Date.now()
    })
  };
};

// 적절한 타이핑과 함께 사용
const userStoreLogger = createDebugStateLogger(
  'user',
  userStore,
  monitoringManager
);
```


---

## 복구 패턴 구현

### 오류 복구 마이그레이션

**현재 문제**: 액션 핸들러 전반에 일관되지 않은 오류 처리.

**마이그레이션 전략**: 액션 컨텍스트 컨벤션을 사용하여 복구 패턴을 표준화합니다.

### 🔄 복구 액션 패턴

**설정 통합**: [기본 액션 설정](../setup/basic-action-setup.md) 오류 처리 패턴을 따름:

```tsx
// ✅ 표준: 설정 컨벤션을 따르는 복구 액션
interface RecoveryActions {
  executeWithRetry: {
    operation: string;
    payload: any;
    maxRetries?: number;
    backoffStrategy?: 'linear' | 'exponential';
  };
  recordFailure: {
    operation: string;
    error: Error;
    attempt: number;
  };
  resetErrorState: {
    operation?: string; // 특정 작업 또는 전체 리셋
  };
}

const executeWithRetryHandler = useCallback(async ({
  operation,
  payload,
  maxRetries = 3,
  backoffStrategy = 'exponential'
}) => {
  const errorTrackingStore = useMonitoringStore('errorTracking');
  const performanceStore = useMonitoringStore('performanceMetrics');
  
  let attempt = 0;
  const startTime = performance.now();
  
  while (attempt < maxRetries) {
    try {
      const result = await performOperation(operation, payload);
      
      // 성공적인 복구 추적
      const duration = performance.now() - startTime;
      performanceStore.update(prev => ({
        ...prev,
        operations: {
          ...prev.operations,
          [operation]: {
            totalCalls: (prev.operations[operation]?.totalCalls || 0) + 1,
            averageTime: duration,
            lastCall: Date.now()
          }
        }
      }));
      
      return result;
    } catch (error) {
      attempt++;
      
      // 실패 시도 기록
      const dispatch = useEventDispatch();
      dispatch('recordFailure', { operation, error, attempt });
      
      if (attempt >= maxRetries) {
        // 최종 실패 - 오류 추적에 로그
        errorTrackingStore.update(prev => ({
          ...prev,
          errors: [
            ...prev.errors,
            {
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              message: error.message,
              stack: error.stack,
              context: `${operation} failed after ${maxRetries} attempts`
            }
          ],
          totalCount: prev.totalCount + 1
        }));
        throw error;
      }
      
      // 전략에 따른 지연 계산
      const delay = backoffStrategy === 'exponential'
        ? 100 * Math.pow(2, attempt - 1)
        : 100 * attempt;
        
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}, []);

const recordFailureHandler = useCallback(async ({ operation, error, attempt }) => {
  const actionLogStore = useMonitoringStore('actionLog');
  
  actionLogStore.update(prev => ({
    ...prev,
    entries: [
      ...prev.entries.slice(-49),
      {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actionType: 'RETRY_FAILURE',
        payload: {
          operation,
          error: error.message,
          attempt,
          context: 'auto-retry'
        }
      }
    ]
  }));
}, []);

// 네이밍 컨벤션을 따르는 핸들러 등록
useEventHandler('executeWithRetry', executeWithRetryHandler);
useEventHandler('recordFailure', recordFailureHandler);
```


---

## 테스팅 인프라 설정

### 테스팅 컴포넌트 통합

**현재 문제**: 체계적인 스트레스 테스팅 기능 없이 수동 테스팅.

**마이그레이션 전략**: 프레임워크 패턴을 따르는 재사용 가능한 테스팅 컴포넌트를 생성합니다.

### 🎯 스트레스 테스팅 컴포넌트 패턴

**설정 통합**: 컴포넌트 및 액션 패턴을 따름:

```tsx
// ✅ 표준: 프레임워크 컨벤션을 따르는 스트레스 테스팅
interface StressTestingStores {
  testState: {
    isActive: boolean;
    testType: 'actions' | 'renders' | 'state-changes' | 'mixed';
    interval: number;
    actionCount: number;
    errorCount: number;
    startTime?: number;
  };
  testResults: {
    totalActions: number;
    successfulActions: number;
    failedActions: number;
    averageResponseTime: number;
    peakMemoryUsage: number;
  };
}

const {
  Provider: StressTestStoreProvider,
  useStore: useStressTestStore,
  useStoreManager: useStressTestStoreManager
} = createStoreContext('StressTest', {
  testState: {
    initialValue: {
      isActive: false,
      testType: 'mixed' as const,
      interval: 100,
      actionCount: 0,
      errorCount: 0
    },
    strategy: 'shallow' as const
  },
  testResults: {
    initialValue: {
      totalActions: 0,
      successfulActions: 0,
      failedActions: 0,
      averageResponseTime: 0,
      peakMemoryUsage: 0
    },
    strategy: 'shallow' as const
  }
});

// 스트레스 테스팅을 위한 액션 핸들러
const startStressTestHandler = useCallback(async ({ testType, interval }) => {
  const testStateStore = useStressTestStore('testState');
  
  testStateStore.setValue({
    isActive: true,
    testType,
    interval,
    actionCount: 0,
    errorCount: 0,
    startTime: Date.now()
  });
}, []);

const executeTestActionHandler = useCallback(async ({ actionType }) => {
  const testStateStore = useStressTestStore('testState');
  const resultsStore = useStressTestStore('testResults');
  const dispatch = useEventDispatch();
  
  const startTime = performance.now();
  
  try {
    // 테스트 액션 실행
    switch (actionType) {
      case 'updateUser':
        dispatch('updateUser', { id: 'test', name: `User${Date.now()}` });
        break;
      case 'toggleModal':
        dispatch('showModal', { modalType: 'test', data: {} });
        break;
      case 'dataOperation':
        dispatch('executeWithRetry', { operation: 'testOp', payload: {} });
        break;
      default:
        dispatch('logAction', { actionType, payload: {} });
    }
    
    const duration = performance.now() - startTime;
    
    // 테스트 결과 업데이트
    resultsStore.update(prev => ({
      totalActions: prev.totalActions + 1,
      successfulActions: prev.successfulActions + 1,
      failedActions: prev.failedActions,
      averageResponseTime: (prev.averageResponseTime * prev.totalActions + duration) / (prev.totalActions + 1),
      peakMemoryUsage: Math.max(prev.peakMemoryUsage, (performance as any).memory?.usedJSHeapSize || 0)
    }));
    
    testStateStore.update(prev => ({ ...prev, actionCount: prev.actionCount + 1 }));
  } catch (error) {
    resultsStore.update(prev => ({
      ...prev,
      totalActions: prev.totalActions + 1,
      failedActions: prev.failedActions + 1
    }));
    
    testStateStore.update(prev => ({ ...prev, errorCount: prev.errorCount + 1 }));
  }
}, []);

// 스트레스 테스트 핸들러 등록
useEventHandler('startStressTest', startStressTestHandler);
useEventHandler('executeTestAction', executeTestActionHandler);

// 스트레스 테스팅 컴포넌트
function StressTestController({ children }: { children: ReactNode }) {
  const testStateStore = useStressTestStore('testState');
  const resultsStore = useStressTestStore('testResults');
  const testState = useStoreValue(testStateStore);
  const results = useStoreValue(resultsStore);
  const dispatch = useEventDispatch();
  
  useEffect(() => {
    if (!testState.isActive) return;
    
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const actions = ['updateUser', 'toggleModal', 'dataOperation'];
        const randomAction = actions[Math.floor(Math.random() * actions.length)];
        dispatch('executeTestAction', { actionType: randomAction });
      }
    }, testState.interval);
    
    return () => clearInterval(interval);
  }, [testState.isActive, testState.interval, dispatch]);
  
  return (
    <div>
      <div>
        <button 
          onClick={() => 
            testState.isActive 
              ? testStateStore.setValue({ ...testState, isActive: false })
              : dispatch('startStressTest', { testType: 'mixed', interval: 100 })
          }
        >
          {testState.isActive ? '🛑 Stop' : '🎯 Start'} Stress Test
        </button>
        
        {testState.isActive && (
          <div>
            Actions: {testState.actionCount} | Errors: {testState.errorCount}
            | Avg Response: {results.averageResponseTime.toFixed(2)}ms
          </div>
        )}
      </div>
      
      {children}
    </div>
  );
}
```

---

## 일반적인 시나리오 솔루션

### 시나리오 기반 디버깅 마이그레이션

**현재 문제**: 체계적인 이슈 해결 대신 반응적 디버깅.

**마이그레이션 전략**: 일반적인 시나리오에 대한 표준화된 디버깅 패턴을 제공합니다.

### 🔍 리렌더링 디버깅 패턴

**설정 통합**: [기본 스토어 설정](../setup/basic-store-setup.md)의 스토어 접근 패턴을 따름:

```tsx
// ✅ 표준: 네이밍 컨벤션을 따르는 디버깅 컴포넌트
function RenderDebuggingComponent({ storeKey }: { storeKey: string }) {
  // 적절한 스토어 접근 패턴 사용
  const debugStore = useMonitoringStore('performanceMetrics');
  const userStore = useUserStore('profile'); // 기본 스토어 설정에서
  const userProfile = useStoreValue(userStore);
  
  // 디버깅을 위한 렌더 사이클 추적
  const renderCount = useRef(0);
  const lastValue = useRef(userProfile);
  
  useEffect(() => {
    renderCount.current += 1;
    
    // 렌더 정보 로그
    console.log(`[Render Debug] Component rendered #${renderCount.current}`);
    console.log(`[Render Debug] Value changed:`, {
      previous: lastValue.current,
      current: userProfile,
      equal: lastValue.current === userProfile,
      deepEqual: JSON.stringify(lastValue.current) === JSON.stringify(userProfile)
    });
    
    // 디버그 메트릭 업데이트
    debugStore.update(prev => ({
      ...prev,
      renderCount: prev.renderCount + 1
    }));
    
    lastValue.current = userProfile;
  });
  
  // 디버깅과 함께 스토어 업데이트 테스트
  const testStoreUpdate = useCallback(() => {
    console.log('[Store Debug] Before update:', userStore.getValue());
    
    // 새로운 객체 참조로 업데이트
    const newProfile = {
      ...userStore.getValue(),
      timestamp: Date.now(),
      debugInfo: { updateSource: 'testButton', renderCount: renderCount.current }
    };
    
    userStore.setValue(newProfile);
    console.log('[Store Debug] After update:', userStore.getValue());
    
    // 구독이 작동하는지 확인
    setTimeout(() => {
      console.log('[Store Debug] Subscription check:', {
        storeValue: userStore.getValue(),
        componentValue: userProfile,
        renderCount: renderCount.current
      });
    }, 0);
  }, [userStore, userProfile]);
  
  return (
    <div style={{ border: '1px solid #ccc', padding: '1rem', margin: '1rem' }}>
      <h3>Render Debug Info</h3>
      <div>Render Count: {renderCount.current}</div>
      <div>Current Profile: {JSON.stringify(userProfile)}</div>
      <div>Store Direct: {JSON.stringify(userStore.getValue())}</div>
      <button onClick={testStoreUpdate}>Test Store Update</button>
      
      <details>
        <summary>Debug Details</summary>
        <pre>{JSON.stringify({
          renderCount: renderCount.current,
          hasSubscription: !!userProfile,
          storeEquals: userProfile === userStore.getValue(),
          timestamp: Date.now()
        }, null, 2)}</pre>
      </details>
    </div>
  );
}
```

### 🔍 액션 핸들러 디버깅 패턴

**설정 통합**: [기본 액션 설정](../setup/basic-action-setup.md) 핸들러 패턴을 따름:

```tsx
// ✅ 표준: 설정 컨벤션을 따르는 액션 디버깅
function ActionDebuggingComponent() {
  const actionLogStore = useMonitoringStore('actionLog');
  const errorTrackingStore = useMonitoringStore('errorTracking');
  const dispatch = useEventDispatch();
  
  // 포괄적인 로깅을 갖춘 디버그 액션 핸들러
  const debugTestActionHandler = useCallback(async (payload) => {
    const startTime = performance.now();
    const actionId = crypto.randomUUID();
    
    console.log(`[Action Debug] Handler started:`, {
      actionId,
      actionType: 'debugTestAction',
      payload,
      timestamp: Date.now()
    });
    
    // 모니터링 스토어에 로그
    actionLogStore.update(prev => ({
      ...prev,
      entries: [
        ...prev.entries.slice(-49),
        {
          id: actionId,
          timestamp: Date.now(),
          actionType: 'DEBUG_TEST_ACTION',
          payload: { ...payload, debug: 'handler-start' }
        }
      ]
    }));
    
    try {
      // 일부 비즈니스 로직 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 테스트를 위한 상태 업데이트
      const userStore = useUserStore('profile');
      userStore.update(prev => ({
        ...prev,
        lastAction: {
          type: 'debugTestAction',
          timestamp: Date.now(),
          payload
        }
      }));
      
      const duration = performance.now() - startTime;
      console.log(`[Action Debug] Handler completed:`, {
        actionId,
        duration: `${duration.toFixed(2)}ms`,
        success: true
      });
      
      // 성공 로그
      actionLogStore.update(prev => ({
        ...prev,
        entries: [
          ...prev.entries.slice(-49),
          {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            actionType: 'DEBUG_TEST_ACTION_SUCCESS',
            payload: { actionId, duration },
            duration
          }
        ]
      }));
      
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`[Action Debug] Handler error:`, {
        actionId,
        duration: `${duration.toFixed(2)}ms`,
        error: error.message,
        stack: error.stack
      });
      
      // 추적 스토어에 오류 로그
      errorTrackingStore.update(prev => ({
        ...prev,
        errors: [
          ...prev.errors,
          {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            message: error.message,
            stack: error.stack,
            context: `debugTestAction handler (actionId: ${actionId})`
          }
        ],
        totalCount: prev.totalCount + 1
      }));
      
      throw error; // 오류 전파를 유지하기 위해 다시 throw
    }
  }, [actionLogStore, errorTrackingStore]);
  
  // 디버그 핸들러 등록
  useEventHandler('debugTestAction', debugTestActionHandler);
  
  // 디버깅과 함께 디스패치 테스트
  const testActionDispatch = useCallback(() => {
    const dispatchPayload = {
      test: true,
      timestamp: Date.now(),
      debugInfo: {
        source: 'testButton',
        userAgent: navigator.userAgent
      }
    };
    
    console.log('[Action Debug] About to dispatch:', {
      actionType: 'debugTestAction',
      payload: dispatchPayload
    });
    
    // 디스패치 시도 로그
    actionLogStore.update(prev => ({
      ...prev,
      entries: [
        ...prev.entries.slice(-49),
        {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          actionType: 'DEBUG_DISPATCH_ATTEMPT',
          payload: { actionType: 'debugTestAction', ...dispatchPayload }
        }
      ]
    }));
    
    dispatch('debugTestAction', dispatchPayload);
  }, [dispatch, actionLogStore]);
  
  return (
    <div style={{ border: '1px solid #ccc', padding: '1rem', margin: '1rem' }}>
      <h3>Action Debug Component</h3>
      <button onClick={testActionDispatch}>Test Action Dispatch</button>
      
      <ActionLogViewer />
    </div>
  );
}

// 액션 로그 보기를 위한 헬퍼 컴포넌트
function ActionLogViewer() {
  const actionLogStore = useMonitoringStore('actionLog');
  const actionLog = useStoreValue(actionLogStore);
  
  return (
    <details>
      <summary>Action Log ({actionLog.entries.length})</summary>
      <div style={{ maxHeight: '200px', overflow: 'auto', fontSize: '12px' }}>
        {actionLog.entries.slice(-10).map(entry => (
          <div key={entry.id} style={{ borderBottom: '1px solid #eee', padding: '4px' }}>
            <strong>{entry.actionType}</strong> - {new Date(entry.timestamp).toLocaleTimeString()}
            {entry.duration && <span> ({entry.duration.toFixed(2)}ms)</span>}
            <br />
            <code>{JSON.stringify(entry.payload || {})}</code>
          </div>
        ))}
      </div>
    </details>
  );
}
```

---

## 프로바이더 설정 통합

**완전한 프로바이더 설정**: 모든 디버깅 기능을 통합:

```tsx
// ✅ 표준: 완전한 디버깅 프로바이더 설정
import { composeProviders } from '@context-action/react';

const DebugProviders = composeProviders([
  MonitoringStoreProvider,
  StressTestStoreProvider,
  EventActionProvider  // 기본 액션 설정에서
]);

function DebugApp() {
  return (
    <DebugProviders>
      <StressTestController>
        <RenderDebuggingComponent storeKey="profile" />
        <ActionDebuggingComponent />
        <AppContent />
      </StressTestController>
    </DebugProviders>
  );
}
```

---

## 마이그레이션 체크리스트

### ✅ 설정 통합 (목표: 90%+ 준수)
- [ ] 모든 디버깅 패턴이 설정된 설정 가이드를 참조함
- [ ] 액션 핸들러가 기본 액션 설정 네이밍 컨벤션을 따름
- [ ] 스토어 패턴이 기본 스토어 설정 타입 정의를 따름
- [ ] 프로바이더 구성이 권장 패턴을 사용함
- [ ] 컴포넌트 네이밍이 프레임워크 컨벤션을 따름

### ✅ 타입 정의 구조화
- [ ] 디버그 전용 타입을 [디버그 스토어 타입 제안](../proposals/debug-store-types.md)으로 이동
- [ ] 기존 패턴 타입을 재정의하지 않고 확장
- [ ] 디버깅 기능 전반에서 인터페이스 일관성 유지
- [ ] 프레임워크 타입과의 적절한 TypeScript 통합

### ✅ 패턴 표준화
- [ ] 일관된 네이밍 컨벤션 (예: `useDebugStore`, `DebugStoreProvider`)
- [ ] ActionPayloadMap을 따르는 표준 액션 페이로드 구조
- [ ] 모든 핸들러에서 통일된 오류 처리 패턴
- [ ] 일관된 스토어 구성 전략

### ✅ 문서화 개선
- [ ] 설정 가이드 참조를 포함한 명확한 전제조건 섹션
- [ ] 새로운 패턴 도입보다는 마이그레이션 중심 콘텐츠
- [ ] 기존 컨벤션을 따르는 향상된 코드 예제
- [ ] 기존 패턴 생태계와의 더 나은 통합

---

## 📚 관련 패턴

**전제조건 (필수)**:
- **[기본 액션 설정](../setup/basic-action-setup.md)** - 디버그 액션을 위한 기반
- **[기본 스토어 설정](../setup/basic-store-setup.md)** - 디버그 상태 관리를 위한 기반
- **[다중 컨텍스트 설정](../setup/multi-context-setup.md)** - 복잡한 디버깅 시나리오

**고급 패턴**:
- **[실시간 상태 접근](../async/real-time-state-access.md)** - 디버그 핸들러에서 최신 상태 접근
- **[고급 액션 패턴](../action/advanced-patterns.md)** - 복잡한 디버깅 액션 패턴
- **[타임아웃 보호](../async/timeout-protection.md)** - 디버그 안전 타임아웃 처리

**개선 제안**:
- **[디버그 스토어 타입 제안](../proposals/debug-store-types.md)** - 고급 디버깅 타입 정의

---

## 💡 마이그레이션 성공 기준

### ✅ 임시적에서 체계적으로 (60% → 90%+)
1. **표준화된 패턴**: 모든 디버깅이 프레임워크 컨벤션을 따름
2. **설정 통합**: 설정된 설정 가이드에 대한 명확한 참조
3. **타입 안전성**: 디버그 기능에 대한 포괄적인 TypeScript 커버리지
4. **성능**: 디버그 기능이 프로덕션 성능에 영향을 주지 않음
5. **유지보수성**: 디버그 코드가 애플리케이션 코드와 동일한 품질 기준을 따름

### ✅ 구현 우선순위
1. **높은 우선순위**: 핵심 이슈 패턴 (경쟁 상태, 핸들러 등록)
2. **중간 우선순위**: 모니터링 및 복구 패턴
3. **낮은 우선순위**: 스트레스 테스팅 및 고급 디버깅 유틸리티