import React, { useCallback, useState, useRef, useEffect } from 'react';
import { createActionContext, createStoreContext, useStoreValue } from '@context-action/react';
import { useRerenderMonitor } from '../hooks/useRerenderMonitor';
import { SafeModeWrapper } from './SafeModeWrapper';

// Action types
interface ComparisonActions {
  increment: void;
  decrement: void;
  reset: void;
  complexCalculation: { multiplier: number };
  heavyOperation: { dataSize: number };
  memoryIntensiveTask: void;
}

// Store types
interface ComparisonStore {
  counter: number;
  calcResult: number;
  heavyData: number[];
  processedResults: { id: number; value: number; timestamp: number }[];
  memoryLeakData: any[];
}

// Create contexts with comparison suffix
const {
  Provider: MemoizedActionProvider,
  useActionDispatch: useMemoizedAction,
  useActionHandler: useMemoizedActionHandler,
} = createActionContext<ComparisonActions>('MemoizedComparison');

const {
  Provider: NonMemoizedActionProvider,
  useActionDispatch: useNonMemoizedAction,
  useActionHandler: useNonMemoizedActionHandler,
} = createActionContext<ComparisonActions>('NonMemoizedComparison');

const {
  Provider: ComparisonStoreProvider,
  useStore: useComparisonStore,
} = createStoreContext('ComparisonStore', {
  memoized: { 
    counter: 0, 
    calcResult: 0, 
    heavyData: [],
    processedResults: [],
    memoryLeakData: []
  },
  nonMemoized: { 
    counter: 0, 
    calcResult: 0,
    heavyData: [],
    processedResults: [],
    memoryLeakData: []
  },
});

// 성능 문제를 위한 헬퍼 함수들 (브라우저 안전)
const performHeavyCalculation = (size: number): number[] => {
  const safeSize = Math.min(size, 100); // 최대 100개로 제한
  const result: number[] = [];
  for (let i = 0; i < safeSize; i++) {
    // 의도적으로 무거운 계산 (하지만 안전한 수준)
    let value = i;
    for (let j = 0; j < 500; j++) { // 1000에서 500으로 감소
      value = Math.sqrt(value * Math.PI) + Math.sin(value);
    }
    result.push(value);
  }
  return result;
};

const createMemoryLeakData = () => {
  // 적당한 크기의 객체들 생성 (브라우저 안전)
  return Array.from({ length: 100 }, (_, i) => ({
    id: i,
    data: new Array(100).fill(0).map(() => Math.random()),
    timestamp: Date.now(),
    largeString: 'x'.repeat(1000), // 10KB에서 1KB로 감소
  }));
};

const processLargeDataSet = (data: number[]): { id: number; value: number; timestamp: number }[] => {
  return data.map((value, index) => ({
    id: index,
    value: value * Math.PI + Math.sqrt(value),
    timestamp: Date.now(),
  }));
};

// Memoized component - using useCallback
function MemoizedHandlerComponent() {
  const store = useComparisonStore('memoized');
  const value = useStoreValue(store);
  const dispatch = useMemoizedAction();
  const { renderCount, renderRate } = useRerenderMonitor('Memoized');
  
  // ✅ Memoized handlers with useCallback + 지연 평가
  const handleIncrement = useCallback(async () => {
    // 지연 평가: 실행 시점에 현재 값을 가져옴
    const current = store.getValue();
    store.setValue({ ...current, counter: current.counter + 1 });
  }, []); // 빈 의존성 배열로 함수를 완전히 메모이제이션
  
  const handleDecrement = useCallback(async () => {
    // 지연 평가: 실행 시점에 현재 값을 가져옴
    const current = store.getValue();
    store.setValue({ ...current, counter: current.counter - 1 });
  }, []); // 빈 의존성 배열
  
  const handleReset = useCallback(async () => {
    // 지연 평가로 안전한 초기화
    store.setValue({ 
      counter: 0, 
      calcResult: 0,
      heavyData: [],
      processedResults: [],
      memoryLeakData: []
    });
  }, []); // 빈 의존성 배열
  
  const handleCalculation = useCallback(async (payload: { multiplier: number }) => {
    // 지연 평가: 실행 시점에 현재 값을 가져옴
    const current = store.getValue();
    const result = current.counter * payload.multiplier;
    store.setValue({ ...current, calcResult: result });
  }, []); // 빈 의존성 배열

  // ✅ 메모이제이션된 계산 함수 - 한 번만 생성되고 재사용
  const expensiveCalculator = useCallback((baseValue: number) => {
    console.log('💰 Memoized: Expensive calculation');
    return Array.from({ length: baseValue * 100 }, (_, i) => 
      Math.pow(i + baseValue, 2) + Math.sqrt(baseValue)
    );
  }, []); // 빈 의존성 배열로 완전히 메모이제이션

  // ✅ 메모이제이션된 무거운 연산 - 지연 평가로 현재 상태 접근
  const handleHeavyOperation = useCallback(async (payload: { dataSize: number }) => {
    console.log('🔄 Memoized: Heavy operation executing...');
    // 지연 평가: 실행 시점에 현재 값을 가져옴
    const current = store.getValue();
    
    // 현재 데이터 크기 체크 (브라우저 보호)
    if (current.heavyData.length > 5000) {
      console.warn('🚨 Memoized: Heavy data 한계 도달! 더 이상 추가하지 않습니다.');
      return;
    }
    
    const safeDataSize = Math.min(payload.dataSize, 30); // 동일한 제한
    const result = expensiveCalculator(safeDataSize); // ✅ 메모이제이션된 함수 재사용
    
    store.setValue({ 
      ...current, 
      heavyData: [...current.heavyData, ...result], // 동일한 누적 로직
      processedResults: [...current.processedResults, ...result.map((v, i) => ({ id: i, value: v, timestamp: Date.now() }))]
    });
  }, [expensiveCalculator]); // expensiveCalculator에 의존

  // ✅ 메모이제이션된 메모리 데이터 생성 함수
  const memoryDataGenerator = useCallback(() => {
    console.log('💾 Memoized: Memory data generator');
    return createMemoryLeakData(); // 동일한 데이터 생성 함수 사용
  }, []); // 빈 의존성 배열로 함수 메모이제이션

  // ✅ 메모이제이션된 메모리 집약적 작업 - 지연 평가
  const handleMemoryTask = useCallback(async () => {
    console.log('🔄 Memoized: Memory task executing...');
    // 지연 평가: 실행 시점에 현재 값을 가져옴
    const current = store.getValue();
    
    // 현재 메모리 데이터 크기 체크 (브라우저 보호)
    if (current.memoryLeakData.length > 5000) {
      console.warn('🚨 Memoized: 메모리 한계 도달! 더 이상 추가하지 않습니다.');
      return;
    }
    
    const newMemoryData = memoryDataGenerator(); // ✅ 메모이제이션된 생성 함수 사용
    
    store.setValue({ 
      ...current, 
      memoryLeakData: [...current.memoryLeakData, ...newMemoryData] // 동일한 누적 로직
    });
  }, [memoryDataGenerator]); // memoryDataGenerator에 의존
  
  // Register handlers with memoization
  useMemoizedActionHandler('increment', handleIncrement);
  useMemoizedActionHandler('decrement', handleDecrement);
  useMemoizedActionHandler('reset', handleReset);
  useMemoizedActionHandler('complexCalculation', handleCalculation);
  useMemoizedActionHandler('heavyOperation', handleHeavyOperation);
  useMemoizedActionHandler('memoryIntensiveTask', handleMemoryTask);
  
  return (
    <div className="p-4 border-2 border-green-500 rounded-lg bg-green-50">
      <h3 className="text-lg font-bold mb-2 text-green-700">
        ✅ Memoized Handlers
      </h3>
      
      <div className="mb-3 text-sm">
        <div className="flex justify-between">
          <span>Render Count:</span>
          <span className="font-mono font-bold">{renderCount}</span>
        </div>
        <div className="flex justify-between">
          <span>Render Rate:</span>
          <span className={`font-mono font-bold ${renderRate > 5 ? 'text-yellow-600' : 'text-green-600'}`}>
            {renderRate.toFixed(1)}/sec
          </span>
        </div>
      </div>
      
      <div className="mb-3 p-2 bg-white rounded text-xs space-y-1">
        <div>Counter: {value.counter}</div>
        <div>Calc Result: {value.calcResult}</div>
        <div>Heavy Data: {value.heavyData.length} items</div>
        <div>Processed: {value.processedResults.length} results</div>
        <div>Memory Data: {value.memoryLeakData.length} objects</div>
      </div>
      
      <div className="flex gap-2 flex-wrap text-sm">
        <button
          onClick={() => dispatch('increment')}
          className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
        >
          +1
        </button>
        <button
          onClick={() => dispatch('decrement')}
          className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
        >
          -1
        </button>
        <button
          onClick={() => dispatch('complexCalculation', { multiplier: 10 })}
          className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Calc
        </button>
        <button
          onClick={() => dispatch('heavyOperation', { dataSize: 20 })}
          className="px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          Heavy
        </button>
        <button
          onClick={() => dispatch('memoryIntensiveTask')}
          className="px-2 py-1 bg-orange-600 text-white rounded hover:bg-orange-700"
        >
          Memory
        </button>
        <button
          onClick={() => dispatch('reset')}
          className="px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

// Non-memoized component - without useCallback
function NonMemoizedHandlerComponent() {
  const store = useComparisonStore('nonMemoized');
  const value = useStoreValue(store);
  const dispatch = useNonMemoizedAction();
  const { renderCount, renderRate } = useRerenderMonitor('NonMemoized');
  
  // ❌ Non-memoized handlers - created on every render
  const handleIncrement = async () => {
    const current = store.getValue();
    store.setValue({ ...current, counter: current.counter + 1 });
  };
  
  const handleDecrement = async () => {
    const current = store.getValue();
    store.setValue({ ...current, counter: current.counter - 1 });
  };
  
  const handleReset = async () => {
    const current = store.getValue();
    store.setValue({ 
      counter: 0, 
      calcResult: 0,
      heavyData: [],
      processedResults: [],
      memoryLeakData: []
    });
  };
  
  const handleCalculation = async (payload: { multiplier: number }) => {
    const current = store.getValue();
    const result = current.counter * payload.multiplier;
    store.setValue({ ...current, calcResult: result });
  };

  // ❌ 메모이제이션 없는 무거운 연산 - 렌더링마다 새로운 함수 생성
  const handleHeavyOperation = async (payload: { dataSize: number }) => {
    console.log('💥 Non-Memoized: Heavy operation executing (EVERY RENDER)...');
    const current = store.getValue();
    
    // 현재 데이터 크기 체크 (브라우저 보호) - 동일한 한계값
    if (current.heavyData.length > 5000) {
      console.warn('🚨 Non-Memoized: Heavy data 한계 도달! 더 이상 추가하지 않습니다.');
      return;
    }
    
    // ❌ 매번 새로운 계산 함수 생성 (동일한 로직이지만 매번 재정의)
    const expensiveCalculator = (baseValue: number) => {
      console.log('💸 Non-Memoized: Expensive calculation EVERY RENDER!');
      return Array.from({ length: baseValue * 100 }, (_, i) => 
        Math.pow(i + baseValue, 2) + Math.sqrt(baseValue)
      );
    }; // 💥 이 함수는 매번 새로 생성됨!
    
    const safeDataSize = Math.min(payload.dataSize, 30); // 최대 30으로 제한
    const result = expensiveCalculator(safeDataSize); // 매번 재생성된 함수 호출
    
    store.setValue({ 
      ...current, 
      heavyData: [...current.heavyData, ...result], // 동일한 누적 로직
      processedResults: [...current.processedResults, ...result.map((v, i) => ({ id: i, value: v, timestamp: Date.now() }))]
    });
  };

  // ❌ 메모이제이션 없는 메모리 집약적 작업 - 메모리 누수 유발
  const handleMemoryTask = async () => {
    console.log('💥 Non-Memoized: Memory leak task executing (EVERY RENDER)...');
    const current = store.getValue();
    
    // 현재 메모리 데이터 크기 체크 (브라우저 보호)
    if (current.memoryLeakData.length > 5000) {
      console.warn('🚨 메모리 한계 도달! 더 이상 추가하지 않습니다.');
      return;
    }
    
    // ❌ 매번 새로운 메모리 데이터 생성 함수 정의 (동일한 로직이지만 매번 재정의)
    const memoryDataGenerator = () => {
      console.log('💸 Non-Memoized: Memory data generator EVERY RENDER!');
      return createMemoryLeakData(); // 동일한 데이터 생성 함수 사용
    }; // 💥 이 함수도 매번 새로 생성됨!
    
    const newMemoryData = memoryDataGenerator(); // 매번 재생성된 함수 호출
    
    store.setValue({ 
      ...current, 
      memoryLeakData: [...current.memoryLeakData, ...newMemoryData] // 동일한 누적 로직
    });
  };
  
  // Register handlers without memoization - causes re-registration on every render
  useNonMemoizedActionHandler('increment', handleIncrement);
  useNonMemoizedActionHandler('decrement', handleDecrement);
  useNonMemoizedActionHandler('reset', handleReset);
  useNonMemoizedActionHandler('complexCalculation', handleCalculation);
  useNonMemoizedActionHandler('heavyOperation', handleHeavyOperation);
  useNonMemoizedActionHandler('memoryIntensiveTask', handleMemoryTask);
  
  return (
    <div className="p-4 border-2 border-red-500 rounded-lg bg-red-50">
      <h3 className="text-lg font-bold mb-2 text-red-700">
        ❌ Non-Memoized Handlers
      </h3>
      
      <div className="mb-3 text-sm">
        <div className="flex justify-between">
          <span>Render Count:</span>
          <span className="font-mono font-bold">{renderCount}</span>
        </div>
        <div className="flex justify-between">
          <span>Render Rate:</span>
          <span className={`font-mono font-bold ${renderRate > 10 ? 'text-red-600' : renderRate > 5 ? 'text-yellow-600' : 'text-green-600'}`}>
            {renderRate.toFixed(1)}/sec
          </span>
        </div>
      </div>
      
      <div className="mb-3 p-2 bg-white rounded text-xs space-y-1">
        <div>Counter: {value.counter}</div>
        <div>Calc Result: {value.calcResult}</div>
        <div className={`${value.heavyData.length > 5000 ? 'text-red-600 font-bold' : value.heavyData.length > 2000 ? 'text-yellow-600 font-bold' : ''}`}>
          Heavy Data: {value.heavyData.length} items
          {value.heavyData.length > 5000 && ' 🚨 BLOCKED!'}
          {value.heavyData.length > 2000 && value.heavyData.length <= 5000 && ' 🔥 HEAVY!'}
        </div>
        <div>Processed: {value.processedResults.length} results</div>
        <div className={`${value.memoryLeakData.length > 1000 ? 'text-red-600 font-bold' : value.memoryLeakData.length > 500 ? 'text-yellow-600 font-bold' : ''}`}>
          Memory Data: {value.memoryLeakData.length} objects
          {value.memoryLeakData.length > 5000 && ' 🚨 BLOCKED!'}
          {value.memoryLeakData.length > 1000 && value.memoryLeakData.length <= 5000 && ' 🔥 LEAK!'}
          {value.memoryLeakData.length > 500 && value.memoryLeakData.length <= 1000 && ' ⚠️ WARNING'}
        </div>
      </div>
      
      <div className="flex gap-2 flex-wrap text-sm">
        <button
          onClick={() => dispatch('increment')}
          className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
        >
          +1
        </button>
        <button
          onClick={() => dispatch('decrement')}
          className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
        >
          -1
        </button>
        <button
          onClick={() => dispatch('complexCalculation', { multiplier: 10 })}
          className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Calc
        </button>
        <button
          onClick={() => dispatch('heavyOperation', { dataSize: 50 })}
          className="px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          Heavy
        </button>
        <button
          onClick={() => dispatch('memoryIntensiveTask')}
          className="px-2 py-1 bg-orange-600 text-white rounded hover:bg-orange-700"
        >
          Memory
        </button>
        <button
          onClick={() => dispatch('reset')}
          className="px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

// Wrapper components that handle auto-update internally
function MemoizedWrapperWithAutoUpdate({ 
  autoUpdate, 
  updateInterval 
}: { 
  autoUpdate: boolean; 
  updateInterval: number; 
}) {
  const dispatch = useMemoizedAction();
  
  return (
    <>
      <MemoizedAutoUpdater 
        dispatch={dispatch} 
        isActive={autoUpdate} 
        interval={updateInterval} 
      />
      <SafeModeWrapper
        componentName="MemoizedHandler"
        maxRenderRate={15}
        checkInterval={1000}
      >
        <MemoizedHandlerComponent />
      </SafeModeWrapper>
    </>
  );
}

function NonMemoizedWrapperWithAutoUpdate({ 
  autoUpdate, 
  updateInterval 
}: { 
  autoUpdate: boolean; 
  updateInterval: number; 
}) {
  const dispatch = useNonMemoizedAction();
  
  return (
    <>
      <NonMemoizedAutoUpdater 
        dispatch={dispatch} 
        isActive={autoUpdate} 
        interval={updateInterval} 
      />
      <SafeModeWrapper
        componentName="NonMemoizedHandler"
        maxRenderRate={15}
        checkInterval={1000}
      >
        <NonMemoizedHandlerComponent />
      </SafeModeWrapper>
    </>
  );
}

// Auto-update component for Memoized
function MemoizedAutoUpdater({ dispatch, isActive, interval }: { 
  dispatch: ReturnType<typeof useMemoizedAction>; 
  isActive: boolean; 
  interval: number;
}) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        const random = Math.random();
        if (random < 0.25) {
          dispatch('increment');
        } else if (random < 0.5) {
          dispatch('decrement');
        } else if (random < 0.75) {
          dispatch('complexCalculation', { multiplier: Math.floor(Math.random() * 20) });
        } else {
          dispatch('heavyOperation', { dataSize: Math.floor(Math.random() * 50) + 10 });
        }
      }, interval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, interval, dispatch]);
  
  return null;
}

// Auto-update component for Non-Memoized
function NonMemoizedAutoUpdater({ dispatch, isActive, interval }: { 
  dispatch: ReturnType<typeof useNonMemoizedAction>; 
  isActive: boolean; 
  interval: number;
}) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        const random = Math.random();
        if (random < 0.25) {
          dispatch('increment');
        } else if (random < 0.5) {
          dispatch('decrement');
        } else if (random < 0.75) {
          dispatch('complexCalculation', { multiplier: Math.floor(Math.random() * 20) });
        } else if (random < 0.9) {
          dispatch('heavyOperation', { dataSize: Math.floor(Math.random() * 100) + 50 });
        } else {
          dispatch('memoryIntensiveTask');
        }
      }, interval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, interval, dispatch]);
  
  return null;
}

// Main comparison demo component
export function HandlerComparisonDemo() {
  const [autoUpdate, setAutoUpdate] = useState(false);
  const [updateInterval, setUpdateInterval] = useState(100);
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">
          useActionHandler Memoization Comparison
        </h2>
        <p className="text-gray-600">
          Compare performance between memoized and non-memoized action handlers
        </p>
      </div>
      
      {/* Control Panel */}
      <div className="p-4 bg-gray-100 rounded-lg">
        <h3 className="font-bold mb-3">🎛️ Performance Test Controls</h3>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoUpdate}
              onChange={(e) => setAutoUpdate(e.target.checked)}
              className="rounded"
            />
            <span>Auto Update</span>
          </label>
          
          <div className="flex items-center gap-2">
            <label>Interval (ms):</label>
            <input
              type="number"
              value={updateInterval}
              onChange={(e) => setUpdateInterval(Number(e.target.value))}
              min={10}
              max={1000}
              step={10}
              className="w-20 px-2 py-1 border rounded"
            />
          </div>
          
          {autoUpdate && (
            <div className="text-sm text-yellow-600 font-medium">
              ⚠️ Auto-updating every {updateInterval}ms
            </div>
          )}
        </div>
      </div>
      
      {/* Comparison Grid */}
      <ComparisonStoreProvider>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Memoized Component */}
          <MemoizedActionProvider>
            <MemoizedWrapperWithAutoUpdate 
              autoUpdate={autoUpdate} 
              updateInterval={updateInterval} 
            />
          </MemoizedActionProvider>
          
          {/* Non-Memoized Component */}
          <NonMemoizedActionProvider>
            <NonMemoizedWrapperWithAutoUpdate 
              autoUpdate={autoUpdate} 
              updateInterval={updateInterval} 
            />
          </NonMemoizedActionProvider>
        </div>
      </ComparisonStoreProvider>
      
      {/* Code Examples */}
      <div className="grid md:grid-cols-2 gap-4 text-sm">
        <div className="p-3 bg-green-50 rounded-lg">
          <h4 className="font-bold text-green-700 mb-2">✅ 스마트 메모이제이션 패턴</h4>
          <pre className="text-xs overflow-x-auto">
{`// ✅ 함수는 메모이제이션 + 데이터는 지연 평가
const handleIncrement = useCallback(async () => {
  const current = store.getValue(); // 🔄 항상 최신 값
  store.setValue({ ...current, counter: current.counter + 1 });
}, []); // 🎯 함수 자체는 재사용 (메모이제이션)

// 복잡한 계산과 메모리 작업 모두 메모이제이션
const expensiveCalculator = useCallback((baseValue) => {
  console.log('💰 Memoized: Expensive calculation');
  return Array.from({length: baseValue * 100}, (_, i) => 
    Math.pow(i + baseValue, 2) + Math.sqrt(baseValue)
  );
}, []); // 계산 로직은 메모이제이션

const memoryDataGenerator = useCallback(() => {
  console.log('💾 Memoized: Memory generator');
  return createMemoryLeakData(); // 동일한 원천 데이터
}, []); // 메모리 생성 함수도 메모이제이션

const handleHeavyOperation = useCallback(async (payload) => {
  const current = store.getValue(); // 🔄 최신 상태
  const result = expensiveCalculator(payload.dataSize); // 🎯 메모된 함수
  store.setValue({ ...current, 
    heavyData: [...current.heavyData, ...result] // 동일한 누적
  });
}, [expensiveCalculator]); // 의존성 명시

// 🚀 결과: 함수 생성 비용 0, 하지만 최신 데이터 접근!`}
          </pre>
        </div>
        
        <div className="p-3 bg-red-50 rounded-lg">
          <h4 className="font-bold text-red-700 mb-2">❌ 비효율적인 패턴</h4>
          <pre className="text-xs overflow-x-auto">
{`// ❌ 렌더링마다 새로운 함수 생성 = 메모리 낭비
const handleIncrement = async () => {
  const current = store.getValue(); // ✓ 최신 값은 가져오지만
  store.setValue({ ...current, counter: current.counter + 1 });
}; // 💥 렌더링마다 새 함수 생성!

// 복잡한 계산과 메모리 작업 모두 매번 새로 정의 (동일한 로직)
const expensiveCalculator = (baseValue) => {
  console.log('💸 Non-Memoized: Expensive calculation EVERY RENDER!');
  return Array.from({length: baseValue * 100}, (_, i) => // 동일한 계산량
    Math.pow(i + baseValue, 2) + Math.sqrt(baseValue)
  );
}; // 💥 이 함수도 매번 새로 생성!

const memoryDataGenerator = () => {
  console.log('💸 Non-Memoized: Memory generator EVERY RENDER!');
  return createMemoryLeakData(); // 동일한 원천 데이터
}; // 💥 메모리 생성 함수도 매번 새로 생성!

const handleHeavyOperation = async (payload) => {
  const current = store.getValue();
  const result = expensiveCalculator(payload.dataSize); // 💸 계산 로직도 재생성
  store.setValue({ ...current, 
    heavyData: [...current.heavyData, ...result] // 동일한 누적
  });
}; // 💥 핸들러도 매번 재생성!

// 💸 결과: 함수 생성 비용 높음 + 핸들러 재등록 + 가비지컬렉션 부하`}
          </pre>
        </div>
      </div>
      
      {/* Performance Impact Summary */}
      <div className="p-4 bg-blue-50 rounded-lg">
        <h3 className="font-bold text-blue-700 mb-2">📊 스마트 메모이제이션 vs 비효율적 패턴</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-green-700">✅ 스마트 메모이제이션의 장점</h4>
              <ul className="text-gray-600 space-y-1 ml-4">
                <li>🎯 <strong>함수 재사용:</strong> 핸들러 함수는 한 번만 생성</li>
                <li>🔄 <strong>지연 평가:</strong> 데이터는 실행 시점에 최신값 획득</li>
                <li>💰 <strong>계산 최적화:</strong> 복잡한 로직도 메모이제이션</li>
                <li>📈 <strong>낮은 렌더링:</strong> 불필요한 재등록 방지</li>
                <li>🧹 <strong>메모리 효율:</strong> 가비지 컬렉션 부하 감소</li>
              </ul>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-red-700">❌ 비효율적 패턴의 문제점</h4>
              <ul className="text-gray-600 space-y-1 ml-4">
                <li>💥 <strong>함수 재생성:</strong> 렌더링마다 모든 함수 새로 생성</li>
                <li>💸 <strong>계산 중복:</strong> 복잡한 로직도 매번 재정의</li>
                <li>📊 <strong>메모리 누수:</strong> 데이터 계속 누적 + 순환참조</li>
                <li>🔥 <strong>높은 렌더링:</strong> 핸들러 재등록으로 성능 저하</li>
                <li>🗑️ <strong>GC 부하:</strong> 대량 객체 생성으로 버벅임</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded">
          <div className="text-sm text-yellow-800">
            <strong>🧪 실험해보기:</strong>
            <div className="mt-2 grid md:grid-cols-2 gap-2">
              <div>
                <strong>1단계:</strong> 기본 버튼들로 차이 체험<br/>
                <strong>2단계:</strong> Heavy 버튼으로 성능 차이 확인<br/>
                <strong>3단계:</strong> Memory 버튼으로 누수 현상 관찰
              </div>
              <div>
                <strong>고급:</strong> Auto Update로 지속적 테스트<br/>
                <strong>관찰:</strong> 🔥 LEAK!, 🚨 BLOCKED! 상태 변화<br/>
                <strong>콘솔:</strong> 실행 로그에서 함수 생성 패턴 확인
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HandlerComparisonDemo;