import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createStore, useStoreValue } from '@context-action/react';
import { setGlobalComparisonOptions } from '@context-action/react';
import { ErrorBoundary } from './ErrorBoundary';
import { PageWithLogMonitor, useActionLoggerWithToast } from '../../components/LogMonitor/';

// 메모리 효율적인 무한 루프 제어 설정
const THROTTLE_INTERVAL = 100; // 100ms마다 렌더링 허용
const MEMORY_CLEANUP_INTERVAL = 1000; // 1초마다 메모리 정리
const MAX_HISTORY_SIZE = 50; // 최대 렌더링 히스토리 크기
const RENDER_BATCH_SIZE = 5; // 한 번에 처리할 렌더링 수

// 참조 안정한 Throttled 렌더링 카운터 훅 (useMemo로 참조 안정화)
function useThrottledRenderCounter(name: string) {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());
  const renderHistory = useRef<number[]>([]);
  const lastDisplayUpdate = useRef(0);
  const hasLoggedStop = useRef(false);
  
  // 실제 렌더링될 때마다 카운트 증가
  renderCount.current += 1;
  const now = Date.now();
  
  // Throttling 계산
  const timeSinceLastRender = now - lastRenderTime.current;
  let displayCount = lastDisplayUpdate.current;
  let renderRate = 0;
  let memoryUsage = 0;
  
  if (timeSinceLastRender >= THROTTLE_INTERVAL) {
    displayCount = renderCount.current;
    lastDisplayUpdate.current = renderCount.current;
    lastRenderTime.current = now;
    
    // 렌더링 히스토리 업데이트
    renderHistory.current.push(now);
    if (renderHistory.current.length > MAX_HISTORY_SIZE) {
      renderHistory.current = renderHistory.current.slice(-MAX_HISTORY_SIZE);
    }
    
    // 렌더링 속도 계산
    const recentHistory = renderHistory.current.filter(time => now - time < 1000);
    renderRate = recentHistory.length;
  }
  
  // 메모리 사용량 계산
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    memoryUsage = Math.round(memory.usedJSHeapSize / 1024 / 1024);
  }
  
  // 계산된 값들
  const actualCount = renderCount.current;
  const isThrottled = actualCount > displayCount + RENDER_BATCH_SIZE;
  
  // 안전 장치 (로깅만)
  if (actualCount > 50 && !hasLoggedStop.current) {
    console.error(`🚨 THROTTLED STOP: ${name} exceeded 50 renders!`);
    hasLoggedStop.current = true;
  }
  
  // 로깅 (첫 5회만, 의존성 완전 제거)
  // useEffect를 사용하지 않고 직접 로깅으로 변경
  if (actualCount <= 5) {
    console.log(`🔄 ${name} rendered: ${actualCount} times (displayed: ${displayCount}, rate: ${renderRate}/s)`);
  }
  
  // 🎯 핵심: useMemo로 객체 참조 안정화
  // 실제 값이 변경될 때만 새 객체 생성
  return useMemo(() => ({
    actualCount,
    displayCount,
    renderRate,
    memoryUsage,
    isThrottled
  }), [actualCount, displayCount, renderRate, memoryUsage, isThrottled]);
}

// 데이터 패턴 타입 정의
type DataPattern = 
  | 'primitive'
  | 'simple-object'
  | 'nested-object'
  | 'array-simple'
  | 'array-complex'
  | 'mixed-complex'
  | 'changing-shape'
  | 'large-object';

// 메모리 효율적인 데이터 패턴 생성기
function generateDataPattern(pattern: DataPattern, iteration: number = 0) {
  switch (pattern) {
    case 'primitive':
      // 원시 값은 변경되지 않아야 reference 비교에서 렌더링 방지
      // 느린 간격으로만 변경 (10초마다 한 번씩)
      const slowChange = Math.floor(iteration / 200); // 200회마다 변경 (약 10초)
      return `stable-value-${slowChange % 10}`; // 0-9 순환
    
    case 'simple-object':
      // 단순 객체도 적당한 간격으로 변경
      const mediumChange = Math.floor(iteration / 50); // 50회마다 변경 (약 2.5초)
      return {
        id: `item-${mediumChange % 20}`,
        name: 'Test Item',
        active: mediumChange % 2 === 0,
        count: mediumChange % 100
      };
    
    case 'nested-object':
      return {
        user: {
          id: `user-${iteration % 50}`,
          profile: {
            name: `User ${iteration % 10}`,
            settings: {
              theme: iteration % 2 === 0 ? 'light' : 'dark',
              notifications: iteration % 3 === 0,
            }
          }
        },
        metadata: {
          version: `1.${iteration % 10}.0`,
          timestamp: Math.floor(iteration / 100) // 덜 자주 변경
        }
      };
    
    case 'array-simple':
      return ['item1', 'item2', `item${iteration % 10}`, 'item4'];
    
    case 'array-complex':
      return [
        { id: 1, name: 'First' },
        { id: 2, name: 'Second' },
        { id: iteration % 20, name: `Dynamic-${iteration % 20}` },
        { id: 4, name: 'Fourth' }
      ];
    
    case 'mixed-complex':
      return {
        primitive: `value-${iteration % 50}`,
        array: [1, 2, iteration % 30],
        nested: {
          deep: {
            value: `nested-${iteration % 20}`,
            list: ['a', 'b', `c-${iteration % 15}`]
          }
        },
        timestamp: Math.floor(Date.now() / 1000) // 초 단위로 변경
      };
    
    case 'changing-shape':
      const shapeChange = Math.floor(iteration / 30); // 30회마다 변경
      const base = { id: shapeChange % 20, name: 'Base' };
      if (shapeChange % 3 === 0) return { ...base, extra: 'property' };
      if (shapeChange % 3 === 1) return { ...base, different: 'field', nested: { value: shapeChange % 10 } };
      return base;
    
    case 'large-object':
      const large: any = { id: iteration % 100 };
      // 메모리 효율을 위해 크기 제한
      for (let i = 0; i < 20; i++) {
        large[`field_${i}`] = `value_${i}_${iteration % 50}`;
      }
      return large;
    
    default:
      return `default-${iteration % 100}`;
  }
}

// 데이터 패턴 정보
const DATA_PATTERN_INFO = {
  primitive: { name: '원시 값', desc: 'String (10초마다 변경)', strategy: 'reference' },
  'simple-object': { name: '단순 객체', desc: '1레벨 프로퍼티 (2.5초마다 변경)', strategy: 'shallow' },
  'nested-object': { name: '중첩 객체', desc: '제한된 깊이', strategy: 'deep' },
  'array-simple': { name: '단순 배열', desc: '순환 값 사용', strategy: 'shallow' },
  'array-complex': { name: '복잡 배열', desc: '제한된 크기', strategy: 'deep' },
  'mixed-complex': { name: '혼합 복잡', desc: '시간 기반 변경', strategy: 'deep' },
  'changing-shape': { name: '변화하는 구조', desc: '순환 패턴', strategy: 'deep' },
  'large-object': { name: '큰 객체', desc: '20개 프로퍼티 (제한)', strategy: 'shallow' }
} as const;

// Throttled 테스트 컴포넌트 (완전 격리)
function ThrottledTestComponent({ 
  strategy, 
  dataPattern, 
  testId,
  onStatsUpdate 
}: { 
  strategy: 'reference' | 'shallow' | 'deep';
  dataPattern: DataPattern;
  testId: string;
  onStatsUpdate: (testId: string, stats: any) => void;
}) {
  const { logAction, logSystem, logError } = useActionLoggerWithToast();
  const { actualCount, displayCount, renderRate, memoryUsage, isThrottled } = useThrottledRenderCounter(`${strategy}-${dataPattern}`);
  const [iteration, setIteration] = useState(0);
  
  // 완전히 독립적인 스토어 생성 (고유한 이름과 개별 설정)
  const testStore = useMemo(() => {
    // 초기 데이터를 Store 생성 시점에 직접 생성 (useMemo 의존성 제거)
    const initialData = generateDataPattern(dataPattern, 0);
    
    const uniqueStoreName = `throttled-${strategy}-${dataPattern}-${testId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const store = createStore<any>(uniqueStoreName, initialData);
    
    // ✅ 전역 설정 대신 Store별 독립적 설정 사용
    store.setComparisonOptions({ strategy });
    
    return store;
  }, [strategy, dataPattern, testId]); // initialData 의존성 제거
  
  // Store 생성 로깅 (useMemo 외부에서)
  useEffect(() => {
    logSystem(`🔧 Created isolated store: throttled-${strategy}-${dataPattern} with ${strategy} strategy`);
  }, [logSystem, strategy, dataPattern, testId]);
  
  // Store 값 구독 - fallback 로직 제거로 무한 루프 방지
  const storeValue = useStoreValue(testStore);
  
  // 통계 업데이트 (비동기 처리로 무한 루프 방지)
  useEffect(() => {
    // setTimeout을 사용하여 렌더링 사이클 분리
    const timeoutId = setTimeout(() => {
      onStatsUpdate(testId, {
        actualCount,
        displayCount,
        renderRate,
        memoryUsage,
        isThrottled
      });
    }, 0);
    
    return () => clearTimeout(timeoutId);
  }, [testId, onStatsUpdate]); // 자주 변경되는 값들 의존성에서 제거
  
  // 데이터 업데이트 (독립적 상태, throttled)
  const updateData = useCallback(() => {
    requestAnimationFrame(() => {
      const newIteration = iteration + 1;
      setIteration(newIteration);
      const newData = generateDataPattern(dataPattern, newIteration);
      testStore.setValue(newData);
    });
  }, [iteration, dataPattern, testStore]);
  
  // Store 직접 설정 (독립적인 데이터)
  const setStoreValue = useCallback(() => {
    const uniqueIteration = Date.now() % 1000 + Math.random() * 100;
    const newData = generateDataPattern(dataPattern, Math.floor(uniqueIteration));
    testStore.setValue(newData);
  }, [testStore, dataPattern]);
  
  // 자동 업데이트 (독립적인 무한 루프 시뮬레이션)
  const [autoUpdate, setAutoUpdate] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();
  
  useEffect(() => {
    if (autoUpdate) {
      // 각 컴포넌트마다 독립적인 간격 (서로 다른 속도)
      const baseInterval = 50;
      const strategyOffset = { reference: 0, shallow: 10, deep: 20 }[strategy];
      const uniqueInterval = baseInterval + strategyOffset + Math.random() * 20;
      
      intervalRef.current = setInterval(() => {
        setIteration(prev => {
          const newIteration = prev + 1;
          const newData = generateDataPattern(dataPattern, newIteration);
          testStore.setValue(newData);
          return newIteration;
        });
      }, uniqueInterval);
      
      logAction('startAutoUpdate', { strategy, interval: uniqueInterval });
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
        logAction('stopAutoUpdate', { strategy });
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoUpdate, strategy, dataPattern, testStore]);
  
  // 전략별 색상
  const getColors = () => {
    switch (strategy) {
      case 'reference': return 'border-orange-400 bg-orange-50 text-orange-700';
      case 'shallow': return 'border-blue-400 bg-blue-50 text-blue-700';
      case 'deep': return 'border-purple-400 bg-purple-50 text-purple-700';
      default: return 'border-gray-400 bg-gray-50 text-gray-700';
    }
  };
  
  return (
    <div className={`border-2 p-4 rounded-lg ${getColors()} ${isThrottled ? 'ring-2 ring-yellow-300' : ''}`}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-sm uppercase">{strategy}</h3>
        <div className="text-xs">
          {isThrottled && <span className="bg-yellow-200 px-1 rounded">⏱️ THROTTLED</span>}
        </div>
      </div>
      
      <div className="text-xs space-y-2">
        {/* 렌더링 통계 */}
        <div className="bg-white p-2 rounded border">
          <div className="space-y-2 text-xs">
            <div>실제: <strong>{actualCount}</strong></div>
            <div>표시: <strong>{displayCount}</strong></div>
            <div>속도: <strong>{renderRate}/s</strong></div>
            <div>메모리: <strong>{memoryUsage}MB</strong></div>
          </div>
        </div>
        
        {/* 데이터 미리보기 */}
        <div className="bg-white p-2 rounded border">
          <strong>Data Preview:</strong><br/>
          <code className="text-xs">
            {storeValue && typeof storeValue === 'object' 
              ? JSON.stringify(storeValue, null, 1).slice(0, 80) + '...'
              : String(storeValue || 'null')
            }
          </code>
        </div>
        
        {/* 컨트롤 */}
        <div className="flex gap-1 flex-wrap">
          <button 
            onClick={updateData}
            className="bg-white border px-2 py-1 rounded text-xs hover:bg-gray-50"
          >
            Update
          </button>
          <button 
            onClick={setStoreValue}
            className="bg-white border px-2 py-1 rounded text-xs hover:bg-gray-50"
          >
            Set Store
          </button>
          <button 
            onClick={() => setAutoUpdate(!autoUpdate)}
            className={`border px-2 py-1 rounded text-xs ${
              autoUpdate 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {autoUpdate ? '⏹️ Stop' : '▶️ Auto'}
          </button>
        </div>
      </div>
    </div>
  );
}

// 내부 컨텐츠 컴포넌트 (Provider 내부에서 사용)
function ThrottledComparisonContent() {
  const { logAction, logSystem, logError } = useActionLoggerWithToast();
  const [selectedPattern, setSelectedPattern] = useState<DataPattern>('primitive');
  const [testKey, setTestKey] = useState(0);
  const [componentStats, setComponentStats] = useState<Record<string, any>>({});
  const [globalAutoUpdate, setGlobalAutoUpdate] = useState(false);
  const [isolationId] = useState(() => `isolation-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  
  // 통계 업데이트 핸들러
  const handleStatsUpdate = useCallback((testId: string, stats: any) => {
    setComponentStats(prev => ({
      ...prev,
      [testId]: stats
    }));
  }, []);
  
  // 전체 리셋 (완전 격리)
  const resetAll = useCallback(() => {
    setTestKey(prev => prev + 1);
    setComponentStats({});
    setGlobalAutoUpdate(false);
    
    console.clear();
    logAction('resetAllComponents', { isolationId }, { toast: true });
  }, [logAction, isolationId]);
  
  // 패턴 변경
  const changePattern = useCallback((pattern: DataPattern) => {
    setSelectedPattern(pattern);
    setTestKey(prev => prev + 1);
    setComponentStats({});
  }, []);
  
  // 전역 메모리 정리
  const forceGarbageCollection = useCallback(() => {
    if ('gc' in window) {
      (window as any).gc();
      logAction('triggerGarbageCollection', {});
    } else {
      logSystem('⚠️ Manual GC not available - creating temporary memory pressure');
      // 메모리 압박을 만들어 GC 유도
      const temp = new Array(1000000).fill(0);
      temp.length = 0;
    }
  }, [logAction, logSystem]);
  
  const patternInfo = DATA_PATTERN_INFO[selectedPattern];
  const totalRenderRate = Object.values(componentStats).reduce((sum: number, stat: any) => sum + (stat?.renderRate || 0), 0);
  const avgMemoryUsage = Object.values(componentStats).reduce((sum: number, stat: any) => sum + (stat?.memoryUsage || 0), 0) / 3;
  
  return (
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
          <h1 className="text-2xl font-bold text-green-800 mb-2">
            ⏱️ Throttled Infinite Loop Demo
          </h1>
        <p className="text-green-700 text-sm mb-2">
          무한 루프를 메모리 효율적으로 제어하면서 적절한 갱신 주기로 렌더링을 관리합니다.
        </p>
        <div className="text-xs text-green-600 space-x-4">
          <span>🔄 Total Render Rate: <strong>{totalRenderRate}/s</strong></span>
          <span>💾 Avg Memory: <strong>{avgMemoryUsage.toFixed(1)}MB</strong></span>
          <span>⏱️ Throttle: <strong>{THROTTLE_INTERVAL}ms</strong></span>
        </div>
      </div>
      
      {/* 컨트롤 패널 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Data Pattern (Memory Optimized)</label>
            <select 
              value={selectedPattern}
              onChange={(e) => changePattern(e.target.value as DataPattern)}
              className="w-full p-2 border rounded-lg"
            >
              {Object.entries(DATA_PATTERN_INFO).map(([key, info]) => (
                <option key={key} value={key}>
                  {info.name} - {info.desc}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <button 
              onClick={resetAll}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              🔄 Reset All
            </button>
            <button 
              onClick={forceGarbageCollection}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              🗑️ Force GC
            </button>
            <button 
              onClick={() => setGlobalAutoUpdate(!globalAutoUpdate)}
              className={`px-4 py-2 rounded-lg ${
                globalAutoUpdate 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-orange-600 text-white hover:bg-orange-700'
              }`}
            >
              {globalAutoUpdate ? '⏹️ Stop All Auto' : '▶️ Start All Auto'}
            </button>
          </div>
        </div>
        
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm">
            <strong>현재 패턴:</strong> {patternInfo.name} - {patternInfo.desc}<br/>
            <strong>권장 전략:</strong> <span className="font-mono text-blue-600">{patternInfo.strategy}</span><br/>
            <strong>메모리 최적화:</strong> 순환 참조, 크기 제한, 주기적 정리 적용
          </div>
        </div>
      </div>
      
      {/* 성능 정보 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-yellow-800 font-bold mb-2">⚡ Performance Features</h3>
        <div className="space-y-4 text-sm text-yellow-700">
          <div>
            <h4 className="font-medium mb-1">🔒 Complete Isolation</h4>
            <ul className="space-y-1 list-disc list-inside text-xs">
              <li><strong>독립적 Store:</strong> 각 컴포넌트마다 고유한 Store 사용</li>
              <li><strong>개별 설정:</strong> 전역 설정 대신 Store별 비교 옵션</li>
              <li><strong>다른 간격:</strong> Reference(50ms), Shallow(60ms), Deep(70ms)</li>
              <li><strong>스마트 변경:</strong> 원시값(10초), 단순객체(2.5초), 복잡객체(즉시)</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-1">⏱️ Throttling & Memory</h4>
            <ul className="space-y-1 list-disc list-inside text-xs">
              <li>렌더링 표시를 100ms마다 업데이트</li>
              <li>순환 값 사용으로 메모리 절약 (% 연산)</li>
              <li>히스토리 크기 제한 (최대 50개)</li>
              <li>수동 GC 트리거 가능</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* 완전히 격리된 Throttled 테스트 컴포넌트들 */}
      <div className="space-y-4">
        {(['reference', 'shallow', 'deep'] as const).map((strategy) => {
          const uniqueTestId = `${strategy}-${testKey}-${isolationId}`;
          
          return (
            <div key={uniqueTestId}>
              <ErrorBoundary 
                onError={(error, errorInfo) => {
                  logError(`🚨 Error in ${strategy} strategy (${uniqueTestId})`, error);
                }}
              >
                <ThrottledTestComponent
                  strategy={strategy}
                  dataPattern={selectedPattern}
                  testId={uniqueTestId}
                  onStatsUpdate={handleStatsUpdate}
                />
              </ErrorBoundary>
            </div>
          );
        })}
      </div>
      
      {/* 실시간 성능 모니터링 */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">📊 Real-time Performance Monitor</h3>
        <div className="space-y-4">
          {(['reference', 'shallow', 'deep'] as const).map((strategy) => {
            const stats = componentStats[`${strategy}-${testKey}-${isolationId}`] || {};
            
            return (
              <div key={strategy} className="text-sm">
                <h4 className="font-medium mb-2 capitalize">{strategy} Strategy</h4>
                <div className="space-y-1 text-xs bg-white p-2 rounded border">
                  <div>실제 렌더링: <strong>{stats.actualCount || 0}</strong></div>
                  <div>표시 렌더링: <strong>{stats.displayCount || 0}</strong></div>
                  <div>렌더링 속도: <strong>{stats.renderRate || 0}/s</strong></div>
                  <div>메모리 사용: <strong>{stats.memoryUsage || 0}MB</strong></div>
                  <div>Throttled: {stats.isThrottled ? '🟡 YES' : '🟢 NO'}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* 사용 가이드 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-blue-800 font-bold mb-2">🎯 Infinite Loop Control Guide</h3>
        <div className="space-y-4 text-sm text-blue-700">
          <div>
            <h4 className="font-medium mb-1">Auto 모드 사용법</h4>
            <ul className="space-y-1 list-disc list-inside text-xs">
              <li><strong>▶️ Auto 버튼:</strong> 개별 컴포넌트 무한 루프 시작</li>
              <li><strong>Start All Auto:</strong> 모든 컴포넌트 동시 시작</li>
              <li><strong>렌더링 속도:</strong> 초당 렌더링 수 실시간 모니터링</li>
              <li><strong>메모리 관리:</strong> 자동으로 메모리 사용량 제한</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-1">최적화 기법</h4>
            <ul className="space-y-1 list-disc list-inside text-xs">
              <li><strong>Throttling:</strong> 100ms 간격으로 UI 업데이트 제한</li>
              <li><strong>순환 데이터:</strong> % 연산으로 메모리 절약</li>
              <li><strong>배치 처리:</strong> requestAnimationFrame 사용</li>
              <li><strong>GC 유도:</strong> 수동 가비지 컬렉션 트리거</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// 메인 페이지 컴포넌트
export default function ThrottledComparisonPage() {
  return (
    <PageWithLogMonitor pageId="throttled-comparison" title="Throttled Infinite Loop Demo">
      <ThrottledComparisonContent />
    </PageWithLogMonitor>
  );
}