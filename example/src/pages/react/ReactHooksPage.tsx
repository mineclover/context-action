import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  ActionRegister,
  ActionPayloadMap,
  ActionProvider,
  useActionDispatch,
  useActionRegister,
  createContextStorePattern,
  useStoreValue,

} from '@context-action/react';
import { StoreProvider } from '../../legacy/StoreProvider';
import { LogLevel } from '@context-action/logger';
import { PageWithLogMonitor, useActionLoggerWithToast } from '../../components/LogMonitor/';

// React Hooks 최적화 액션 맵
interface HooksOptimizationMap extends ActionPayloadMap {
  updateCounter: { increment: number };
  updateList: { items: string[] };
  heavyCalculation: { numbers: number[] };
  conditionalHandler: { enabled: boolean; data: any };
  dynamicHandler: { handlerType: string; payload: any };
  memoryIntensive: { size: number };
  rerenderTrigger: void;
}

/**
 * React Hooks 최적화 데모용 Context Store 패턴
 * 메모이제이션과 성능 최적화 예제를 위한 Store 격리 시스템
 * 
 * @implements store-registry
 * @implements performance-optimization
 * @implements store-integration-pattern
 * @memberof core-concepts
 * @example
 * // React Hooks 최적화를 위한 Context Store 패턴
 * const HooksStores = createContextStorePattern('ReactHooks');
 * 
 * // 컴포넌트에서 Store 사용
 * const calculationStore = HooksStores.useStore('calculation', { result: 0, computeTime: 0 });
 * const memoryStore = HooksStores.useStore('memory', { objects: 0, allocatedMB: 0 });
 * @since 1.0.0
 */
const HooksStores = createContextStorePattern('ReactHooks');

// 무거운 계산 시뮬레이션
const heavyComputation = (numbers: number[]): { result: number; computeTime: number } => {
  const startTime = performance.now();
  
  // 의도적으로 무거운 계산
  let result = 0;
  for (let i = 0; i < numbers.length; i++) {
    for (let j = 0; j < 1000; j++) {
      result += Math.sqrt(numbers[i] * j);
    }
  }
  
  const computeTime = performance.now() - startTime;
  return { result: Math.round(result), computeTime };
};

// 메모이제이션 데모
function MemoizationDemo() {
  const [trigger, setTrigger] = useState(0);
  const [inputSize, setInputSize] = useState(100);
  
  const calculationStore = HooksStores.useStore('calculation', { result: 0, computeTime: 0 });
  const calculationResult = useStoreValue(calculationStore);
  
  // useMemo를 사용한 무거운 계산 최적화
  const expensiveNumbers = useMemo(() => {
    console.log('🔄 Generating expensive numbers array');
    return Array.from({ length: inputSize }, (_, i) => i + 1);
  }, [inputSize]);
  
  // 액션 핸들러 등록
  useEffect(() => {
    const unsubscribe = hooksActionRegister.register('heavyCalculation', ({ numbers }, controller) => {
      const result = heavyComputation(numbers);
      calculationStore.setValue(result);
      controller.next();
    });
    
    return unsubscribe;
  }, [calculationStore]);

  // useCallback을 사용한 함수 최적화
  const handleCalculation = useCallback(() => {
    hooksActionRegister.dispatch('heavyCalculation', { numbers: expensiveNumbers });
  }, [expensiveNumbers]);
  
  const handleTriggerRerender = useCallback(() => {
    setTrigger(prev => prev + 1);
    hooksActionRegister.dispatch('rerenderTrigger');
  }, []);
  
  return (
    <div className="demo-card">
      <h3>React Memoization</h3>
      <p>useMemo와 useCallback을 사용한 성능 최적화 데모</p>
      
      <div className="optimization-controls">
        <div className="control-group">
          <label>Array Size:</label>
          <input
            type="range"
            min="50"
            max="500"
            value={inputSize}
            onChange={(e) => setInputSize(Number(e.target.value))}
            className="range-input"
          />
          <span>{inputSize}</span>
        </div>
        
        <div className="button-group">
          <button onClick={handleCalculation} className="btn btn-primary">
            Run Heavy Calculation
          </button>
          <button onClick={handleTriggerRerender} className="btn btn-secondary">
            Trigger Re-render ({trigger})
          </button>
        </div>
      </div>
      
      <div className="calculation-result">
        <div className="result-item">
          <strong>Result:</strong> {calculationResult?.result.toLocaleString() ?? 'Computing...'}
        </div>
        <div className="result-item">
          <strong>Compute Time:</strong> {calculationResult?.computeTime.toFixed(2) ?? '0'}ms
        </div>
      </div>
    </div>
  );
}

// 조건부 핸들러 등록 데모
function ConditionalHandlerDemo() {
  const [handlerEnabled, setHandlerEnabled] = useState(true);
  const [actionCount, setActionCount] = useState(0);
  const [handlerRegistrations, setHandlerRegistrations] = useState(0);
  
  // 조건부 핸들러 등록 최적화
  useEffect(() => {
    if (!handlerEnabled) {
      return; // 핸들러가 비활성화되면 등록하지 않음
    }
    
    console.log('🔗 Registering conditional handler');
    setHandlerRegistrations(prev => prev + 1);
    
    const unsubscribe = hooksActionRegister.register('conditionalHandler', ({ enabled, data }, controller) => {
      if (enabled) {
        setActionCount(prev => prev + 1);
        console.log('✅ Conditional handler executed:', data);
      }
      controller.next();
    });
    
    return () => {
      console.log('🔓 Unregistering conditional handler');
      unsubscribe();
    };
  }, [handlerEnabled]); // handlerEnabled가 변경될 때만 재등록
  
  const handleToggleHandler = useCallback(() => {
    setHandlerEnabled(prev => !prev);
  }, []);
  
  const handleTriggerAction = useCallback(() => {
    hooksActionRegister.dispatch('conditionalHandler', { 
      enabled: handlerEnabled, 
      data: `Action at ${new Date().toLocaleTimeString()}` 
    });
  }, [handlerEnabled]);
  
  return (
    <div className="demo-card">
      <h3>Conditional Handler Registration</h3>
      <p>필요할 때만 핸들러를 등록하여 메모리와 성능을 최적화</p>
      
      <div className="handler-status">
        <div className="status-item">
          <strong>Handler Enabled:</strong>
          <span className={handlerEnabled ? 'enabled' : 'disabled'}>
            {handlerEnabled ? '✅ Yes' : '❌ No'}
          </span>
        </div>
        <div className="status-item">
          <strong>Handler Registrations:</strong>
          <span>{handlerRegistrations}</span>
        </div>
        <div className="status-item">
          <strong>Actions Processed:</strong>
          <span>{actionCount}</span>
        </div>
      </div>
      
      <div className="button-group">
        <button onClick={handleToggleHandler} className="btn btn-warning">
          {handlerEnabled ? 'Disable Handler' : 'Enable Handler'}
        </button>
        <button onClick={handleTriggerAction} className="btn btn-primary">
          Trigger Action
        </button>
      </div>
    </div>
  );
}

// 동적 핸들러 관리 데모
function DynamicHandlerDemo() {
  const [activeHandlers, setActiveHandlers] = useState<Set<string>>(new Set(['type-A']));
  const [actionCounts, setActionCounts] = useState<Record<string, number>>({});
  
  const handlerTypes = ['type-A', 'type-B', 'type-C', 'type-D'];
  
  // 동적 핸들러 등록 최적화
  useEffect(() => {
    const unsubscribers: (() => void)[] = [];
    
    activeHandlers.forEach(handlerType => {
      console.log(`🔗 Registering handler: ${handlerType}`);
      
      const unsubscribe = hooksActionRegister.register('dynamicHandler', ({ handlerType: type, payload }, controller) => {
        if (type === handlerType) {
          setActionCounts(prev => ({
            ...prev,
            [handlerType]: (prev[handlerType] || 0) + 1
          }));
          console.log(`✅ Handler ${handlerType} processed:`, payload);
        }
        controller.next();
      });
      
      unsubscribers.push(unsubscribe);
    });
    
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
      console.log(`🔓 Unregistered ${unsubscribers.length} handlers`);
    };
  }, [activeHandlers]); // activeHandlers가 변경될 때만 재등록
  
  const toggleHandler = useCallback((handlerType: string) => {
    setActiveHandlers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(handlerType)) {
        newSet.delete(handlerType);
      } else {
        newSet.add(handlerType);
      }
      return newSet;
    });
  }, []);
  
  const triggerHandler = useCallback((handlerType: string) => {
    hooksActionRegister.dispatch('dynamicHandler', { 
      handlerType, 
      payload: `Data for ${handlerType} at ${new Date().toLocaleTimeString()}` 
    });
  }, []);
  
  return (
    <div className="demo-card">
      <h3>Dynamic Handler Management</h3>
      <p>필요한 핸들러만 동적으로 등록/해제하여 리소스 최적화</p>
      
      <div className="dynamic-handlers">
        {handlerTypes.map(handlerType => {
          const isActive = activeHandlers.has(handlerType);
          const count = actionCounts[handlerType] || 0;
          
          return (
            <div key={handlerType} className="handler-item">
              <div className="handler-info">
                <span className="handler-name">{handlerType}</span>
                <span className={`handler-status ${isActive ? 'active' : 'inactive'}`}>
                  {isActive ? '🟢 Active' : '🔴 Inactive'}
                </span>
                <span className="handler-count">Count: {count}</span>
              </div>
              <div className="handler-controls">
                <button 
                  onClick={() => toggleHandler(handlerType)}
                  className={`btn btn-small ${isActive ? 'btn-danger' : 'btn-success'}`}
                >
                  {isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button 
                  onClick={() => triggerHandler(handlerType)}
                  className="btn btn-small btn-primary"
                  disabled={!isActive}
                >
                  Trigger
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="handler-summary">
        <strong>Active Handlers:</strong> {activeHandlers.size} / {handlerTypes.length}
      </div>
    </div>
  );
}

// 메모리 최적화 데모
function MemoryOptimizationDemo() {
  const [objectSize, setObjectSize] = useState(1000);
  const [autoCleanup, setAutoCleanup] = useState(true);
  
  const memoryStore = HooksStores.useStore('memory', { allocatedMB: 0, objects: 0 });
  const memoryInfo = useStoreValue(memoryStore);
  const objectsRef = useRef<any[]>([]);
  
  // 메모리 정리 최적화
  useEffect(() => {
    if (!autoCleanup) return;
    
    const cleanupInterval = setInterval(() => {
      if (objectsRef.current.length > 5) {
        const removed = objectsRef.current.splice(0, objectsRef.current.length - 5);
        console.log(`🧹 Auto cleanup: removed ${removed.length} objects`);
        updateMemoryInfo();
      }
    }, 3000);
    
    return () => clearInterval(cleanupInterval);
  }, [autoCleanup]);
  
  const updateMemoryInfo = useCallback(() => {
    const totalObjects = objectsRef.current.length;
    const estimatedMB = (totalObjects * objectSize * 4) / (1024 * 1024); // 대략적 계산
    
    memoryStore.setValue({
      allocatedMB: Math.round(estimatedMB * 100) / 100,
      objects: totalObjects
    });
  }, [objectSize]);
  
  const handleAllocateMemory = useCallback(() => {
    hooksActionRegister.dispatch('memoryIntensive', { size: objectSize });
    
    // 메모리 집약적 객체 생성 시뮬레이션
    const largeObject = new Array(objectSize).fill(0).map((_, i) => ({
      id: i,
      data: Math.random(),
      timestamp: Date.now()
    }));
    
    objectsRef.current.push(largeObject);
    updateMemoryInfo();
  }, [objectSize, updateMemoryInfo]);
  
  const handleCleanupMemory = useCallback(() => {
    objectsRef.current = [];
    updateMemoryInfo();
    console.log('🧹 Manual memory cleanup completed');
  }, [updateMemoryInfo]);
  
  return (
    <div className="demo-card">
      <h3>Memory Optimization</h3>
      <p>메모리 사용량 모니터링과 자동 정리 시스템</p>
      
      <div className="memory-controls">
        <div className="control-group">
          <label>Object Size:</label>
          <input
            type="range"
            min="100"
            max="5000"
            value={objectSize}
            onChange={(e) => setObjectSize(Number(e.target.value))}
            className="range-input"
          />
          <span>{objectSize.toLocaleString()}</span>
        </div>
        
        <div className="control-group">
          <label>
            <input
              type="checkbox"
              checked={autoCleanup}
              onChange={(e) => setAutoCleanup(e.target.checked)}
            />
            Enable Auto Cleanup
          </label>
        </div>
      </div>
      
      <div className="memory-stats">
        <div className="stat-item">
          <strong>Objects:</strong>
          <span>{memoryInfo?.objects ?? 0}</span>
        </div>
        <div className="stat-item">
          <strong>Estimated Memory:</strong>
          <span>{memoryInfo?.allocatedMB ?? 0} MB</span>
        </div>
      </div>
      
      <div className="button-group">
        <button onClick={handleAllocateMemory} className="btn btn-primary">
          Allocate Memory
        </button>
        <button onClick={handleCleanupMemory} className="btn btn-danger">
          Manual Cleanup
        </button>
      </div>
    </div>
  );
}

// ActionRegister 인스턴스 생성
const hooksActionRegister = new ActionRegister<HooksOptimizationMap>();

// React Hooks 설정
function ReactHooksSetup() {
  useEffect(() => {
    const unsubscribers: (() => void)[] = [];
    
    // 카운터, 리스트, 계산 핸들러는 이제 각 컴포넌트에서 개별적으로 등록됩니다.
    // 이 핸들러들은 Context Store 패턴을 사용하는 컴포넌트 내부에서 처리됩니다.
    
    // 메모리 집약적 작업 핸들러
    unsubscribers.push(
      hooksActionRegister.register('memoryIntensive', ({ size }, controller) => {
        console.log(`🧠 Processing memory intensive task: ${size} objects`);
        controller.next();
      })
    );
    
    // 리렌더 트리거 핸들러
    unsubscribers.push(
      hooksActionRegister.register('rerenderTrigger', (_, controller) => {
        console.log('🔄 Re-render triggered');
        controller.next();
      })
    );
    
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, []);
  
  return null;
}

function ReactHooksPage() {
  return (
    <PageWithLogMonitor 
      pageId="react-hooks" 
      title="React Hooks Performance Optimization"
      initialConfig={{ enableToast: true, maxLogs: 100 }}
    >
      <div className="page-container">
        <header className="page-header">
          <h1>React Hooks Performance Optimization</h1>
          <p className="page-description">
            Learn advanced React hooks patterns for optimizing performance in Context-Action applications.
            Discover memoization, conditional handler registration, and memory management techniques.
          </p>
        </header>

        <ActionProvider>
          <StoreProvider>
            <HooksStores.Provider registryId="react-hooks-demo">
              <ReactHooksSetup />
              
              <div className="space-y-6">
                <MemoizationDemo />
                <ConditionalHandlerDemo />
                <DynamicHandlerDemo />
                <MemoryOptimizationDemo />
              
              {/* 최적화 개념 */}
              <div className="demo-card info-card">
                <h3>Performance Optimization Concepts</h3>
                <ul className="concept-list">
                  <li>
                    <strong>useMemo:</strong> 비용이 많이 드는 계산 결과를 메모이제이션
                  </li>
                  <li>
                    <strong>useCallback:</strong> 함수 참조를 안정화하여 불필요한 리렌더 방지
                  </li>
                  <li>
                    <strong>조건부 등록:</strong> 필요할 때만 핸들러를 등록하여 메모리 절약
                  </li>
                  <li>
                    <strong>동적 관리:</strong> 런타임에 핸들러를 추가/제거하여 리소스 최적화
                  </li>
                  <li>
                    <strong>메모리 관리:</strong> 자동 정리 시스템으로 메모리 누수 방지
                  </li>
                </ul>
              </div>
              
              {/* 모범 사례 */}
              <div className="demo-card info-card">
                <h3>Best Practices</h3>
                <ul className="best-practices-list">
                  <li>✓ 의존성 배열을 정확히 지정하여 불필요한 재실행 방지</li>
                  <li>✓ 핸들러 등록/해제를 조건부로 수행하여 메모리 효율성 향상</li>
                  <li>✓ 무거운 계산은 useMemo로 캐싱</li>
                  <li>✓ 이벤트 핸들러는 useCallback으로 최적화</li>
                  <li>✓ 메모리 정리 로직을 useEffect cleanup에서 수행</li>
                  <li>✓ 개발자 도구를 활용한 성능 모니터링</li>
                </ul>
              </div>
            </div>

            {/* 코드 예제 */}
            <div className="code-example">
              <h3>React Hooks Optimization Patterns</h3>
              <pre className="code-block">
{`// 1. useMemo로 무거운 계산 최적화
const expensiveValue = useMemo(() => {
  return heavyComputation(data);
}, [data]); // data가 변경될 때만 재계산

// 2. useCallback으로 핸들러 최적화
const optimizedHandler = useCallback((payload) => {
  dispatch('action', payload);
}, [dispatch]); // dispatch가 변경될 때만 함수 재생성

// 3. 조건부 핸들러 등록
useEffect(() => {
  if (!enabled) return; // 조건이 맞지 않으면 등록하지 않음
  
  const unsubscribe = register('action', handler);
  return unsubscribe;
}, [register, enabled]); // enabled 상태에 따라 등록/해제

// 4. 동적 핸들러 관리
useEffect(() => {
  const unsubscribers = [];
  
  activeHandlers.forEach(type => {
    const unsubscribe = register(type, handlers[type]);
    unsubscribers.push(unsubscribe);
  });
  
  return () => unsubscribers.forEach(fn => fn());
}, [activeHandlers]); // 활성 핸들러 목록 변경 시에만 재등록

// 5. 메모리 정리
useEffect(() => {
  const cleanup = setInterval(() => {
    // 주기적 정리 로직
    cleanupOldData();
  }, 5000);
  
  return () => clearInterval(cleanup);
}, []);`}
              </pre>
              </div>
            </HooksStores.Provider>
          </StoreProvider>
        </ActionProvider>
      </div>
    </PageWithLogMonitor>
  );
}

export default ReactHooksPage;