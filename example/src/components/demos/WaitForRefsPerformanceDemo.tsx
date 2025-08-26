/**
 * RefContext 패턴 데모
 * 
 * 새로운 패턴들:
 * 1. onMount 트리거 - 마운트 시점에 실행
 * 2. executeIfMounted - 조건부 마운트 검증 후 실행  
 * 3. waitForRefs - 지연 마운트 시나리오에 최적화
 */

import { useEffect, useState, useCallback } from 'react';
import { createRefContext, createStoreContext, useStoreValue } from '@context-action/react';

type DemoRefs = {
  onMountElement: HTMLDivElement;
  conditionalElement: HTMLDivElement;
  delayedElement: HTMLDivElement;
};

// RefContext for DOM elements
const {
  Provider: DemoProvider,
  useRefHandler: useDemoRef,
  useWaitForRefs
} = createRefContext<DemoRefs>('Demo');

// Store pattern for demo state
const {
  Provider: DemoStoreProvider,
  useStore: useDemoStore
} = createStoreContext('RefPatternDemo', {
  // onMount 패턴 관련
  onMountLog: { initialValue: [] as string[] },
  onMountElement: { initialValue: null as HTMLDivElement | null },
  
  // executeIfMounted 패턴 관련
  conditionalLog: { initialValue: [] as string[] },
  conditionalTestResults: { initialValue: [] as string[] },
  
  // waitForRefs 패턴 관련 (지연 마운트)
  delayedLog: { initialValue: [] as string[] },
  delayedMountTimer: { initialValue: null as number | null },
  delayedElement: { initialValue: null as HTMLDivElement | null },
  isDelayedMounted: { initialValue: false }
});

// onMount 패턴 데모 컴포넌트
function OnMountPatternDemo() {
  const onMountRef = useDemoRef('onMountElement');
  const onMountLogStore = useDemoStore('onMountLog');
  const onMountElementStore = useDemoStore('onMountElement');
  
  const log = useStoreValue(onMountLogStore);
  const element = useStoreValue(onMountElementStore);
  
  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    onMountLogStore.update(prev => [...prev, `[${timestamp}] ${message}`]);
  }, [onMountLogStore]);
  
  // onMount 콜백 등록
  useEffect(() => {
    const cleanup = onMountRef.onMount((target) => {
      addLog(`🎯 onMount 트리거! 요소가 마운트됨: ${target.tagName}`);
      target.style.backgroundColor = '#10b981';
      target.textContent = '✅ onMount로 설정됨!';
      onMountElementStore.setValue(target);
    });
    
    return cleanup;
  }, [onMountRef, addLog, onMountElementStore]);
  
  const [showElement, setShowElement] = useState(false);
  
  return (
    <div className="p-4 border rounded-lg bg-blue-50">
      <h3 className="text-lg font-bold mb-3">1. onMount 트리거 패턴</h3>
      <p className="text-sm text-gray-600 mb-3">
        요소가 마운트되는 시점에 자동으로 실행되는 트리거
      </p>
      
      <div className="space-y-3">
        <button
          onClick={() => setShowElement(!showElement)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {showElement ? '요소 언마운트' : '요소 마운트'}
        </button>
        
        {showElement && (
          <div
            ref={onMountRef.setRef}
            className="p-4 border-2 rounded transition-all duration-300"
          >
            마운트되면 onMount가 실행됩니다
          </div>
        )}
        
        <div className="text-sm">
          <strong>로그:</strong>
          <div className="max-h-32 overflow-y-auto bg-gray-100 p-2 rounded">
            {log.length === 0 ? '아직 로그가 없습니다' : log.map((entry, i) => (
              <div key={i} className="text-xs">{entry}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// executeIfMounted 패턴 데모 컴포넌트
function ConditionalPatternDemo() {
  const conditionalRef = useDemoRef('conditionalElement');
  const conditionalLogStore = useDemoStore('conditionalLog');
  const testResultsStore = useDemoStore('conditionalTestResults');
  
  const log = useStoreValue(conditionalLogStore);
  const testResults = useStoreValue(testResultsStore);
  
  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    conditionalLogStore.update(prev => [...prev, `[${timestamp}] ${message}`]);
  }, [conditionalLogStore]);
  
  const [showElement, setShowElement] = useState(true); // 기본적으로 마운트됨
  
  // executeIfMounted 테스트 함수들
  const testExecuteIfMounted = useCallback(() => {
    const result = conditionalRef.executeIfMounted((target) => {
      const text = target.textContent || '';
      const newText = `✅ 조건부 실행됨! (${Date.now() % 1000})`;
      target.textContent = newText;
      target.style.backgroundColor = '#10b981';
      return newText;
    });
    
    if (result !== null) {
      addLog(`✅ executeIfMounted 성공: ${result}`);
      testResultsStore.update(prev => [...prev, `성공: ${result}`]);
    } else {
      addLog(`❌ executeIfMounted 실패: 요소가 마운트되지 않음`);
      testResultsStore.update(prev => [...prev, '실패: 요소가 마운트되지 않음']);
    }
  }, [conditionalRef, addLog, testResultsStore]);
  
  const clearResults = useCallback(() => {
    conditionalLogStore.setValue([]);
    testResultsStore.setValue([]);
  }, [conditionalLogStore, testResultsStore]);
  
  return (
    <div className="p-4 border rounded-lg bg-green-50">
      <h3 className="text-lg font-bold mb-3">2. executeIfMounted 조건부 패턴</h3>
      <p className="text-sm text-gray-600 mb-3">
        요소가 마운트되었는지 검증한 후 조건부로 실행
      </p>
      
      <div className="space-y-3">
        <div className="space-x-2">
          <button
            onClick={() => setShowElement(!showElement)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            {showElement ? '요소 언마운트' : '요소 마운트'}
          </button>
          
          <button
            onClick={testExecuteIfMounted}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            executeIfMounted 테스트
          </button>
          
          <button
            onClick={clearResults}
            className="px-2 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
          >
            클리어
          </button>
        </div>
        
        {showElement && (
          <div
            ref={conditionalRef.setRef}
            className="p-4 border-2 rounded bg-white"
          >
            조건부 실행 대상 요소
          </div>
        )}
        
        <div className="text-sm">
          <strong>실행 로그:</strong>
          <div className="max-h-32 overflow-y-auto bg-gray-100 p-2 rounded">
            {log.length === 0 ? '아직 로그가 없습니다' : log.map((entry, i) => (
              <div key={i} className="text-xs">{entry}</div>
            ))}
          </div>
        </div>
        
        <div className="text-sm">
          <strong>테스트 결과:</strong>
          <div className="max-h-24 overflow-y-auto bg-gray-100 p-2 rounded">
            {testResults.length === 0 ? '아직 결과가 없습니다' : testResults.map((result, i) => (
              <div key={i} className="text-xs">{result}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// waitForRefs 지연 마운트 패턴 데모 컴포넌트
function DelayedMountPatternDemo() {
  const delayedLogStore = useDemoStore('delayedLog');
  const isDelayedMountedStore = useDemoStore('isDelayedMounted');
  const delayedMountTimerStore = useDemoStore('delayedMountTimer');
  
  const waitForRefs = useWaitForRefs();
  const delayedRef = useDemoRef('delayedElement');
  
  const log = useStoreValue(delayedLogStore);
  const isDelayedMounted = useStoreValue(isDelayedMountedStore);
  const delayedMountTimer = useStoreValue(delayedMountTimerStore);
  
  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    delayedLogStore.update(prev => [...prev, `[${timestamp}] ${message}`]);
  }, [delayedLogStore]);
  
  // 지연된 마운트 시뮬레이션
  const startDelayedMount = useCallback(() => {
    if (delayedMountTimer) {
      clearTimeout(delayedMountTimer);
    }
    
    isDelayedMountedStore.setValue(false);
    addLog('🕒 5초 후 마운트 예정...');
    
    const timer = setTimeout(() => {
      isDelayedMountedStore.setValue(true);
      addLog('🎯 지연된 요소가 마운트됨!');
      delayedMountTimerStore.setValue(null);
    }, 5000);
    
    delayedMountTimerStore.setValue(timer);
  }, [delayedMountTimer, isDelayedMountedStore, addLog, delayedMountTimerStore]);
  
  // waitForRefs를 사용한 지연 마운트 대기 (성공 시나리오)
  const testWaitForDelayedMount = useCallback(async () => {
    try {
      addLog('⏳ waitForRefs로 지연 마운트 대기 시작... (10초 타임아웃)');
      const startTime = Date.now();
      
      // 10초 타임아웃으로 대기 - 지연 마운트는 5초이므로 성공할 것
      const refs = await waitForRefs(10000, 'delayedElement');
      
      const duration = Date.now() - startTime;
      addLog(`✅ waitForRefs 완료! (${duration}ms 소요)`);
      
      // 마운트된 요소 조작
      refs.delayedElement.style.backgroundColor = '#10b981';
      refs.delayedElement.textContent = `✅ waitForRefs로 대기 완료! (${duration}ms)`;
      
    } catch (error) {
      const duration = Date.now() - Date.now();
      addLog(`❌ waitForRefs 타임아웃: ${error} (${duration}ms)`);
    }
  }, [waitForRefs, addLog]);
  
  // waitForRefs 타임아웃 테스트 (실패 시나리오)
  const testWaitForTimeout = useCallback(async () => {
    try {
      addLog('⏳ waitForRefs 타임아웃 테스트... (3초 타임아웃, 5초 지연)');
      const startTime = Date.now();
      
      // 3초 타임아웃으로 대기 - 지연 마운트는 5초이므로 실패할 것
      await waitForRefs(3000, 'delayedElement');
      
      // 이 코드는 실행되지 않을 것
      addLog('✅ 예상치 못한 성공...');
      
    } catch (error) {
      const duration = Date.now() - Date.now();
      addLog(`❌ 예상된 타임아웃: ${error}`);
      addLog('💡 이것은 정상적인 동작입니다 - 타임아웃이 지연보다 짧을 때');
    }
  }, [waitForRefs, addLog]);
  
  const clearDelayedLog = useCallback(() => {
    delayedLogStore.setValue([]);
  }, [delayedLogStore]);
  
  const cancelDelayedMount = useCallback(() => {
    if (delayedMountTimer) {
      clearTimeout(delayedMountTimer);
      delayedMountTimerStore.setValue(null);
      addLog('⏹️ 지연 마운트가 취소됨');
    }
  }, [delayedMountTimer, delayedMountTimerStore, addLog]);
  
  const unmountDelayedElement = useCallback(() => {
    if (isDelayedMounted) {
      isDelayedMountedStore.setValue(false);
      addLog('🔻 지연된 요소가 언마운트됨');
    }
  }, [isDelayedMounted, isDelayedMountedStore, addLog]);
  
  return (
    <div className="p-4 border rounded-lg bg-yellow-50">
      <h3 className="text-lg font-bold mb-3">3. waitForRefs 지연 마운트 패턴</h3>
      <p className="text-sm text-gray-600 mb-3">
        마운트가 보장되지만 지연되는 상황에서 waitForRefs 활용
      </p>
      
      <div className="space-y-3">
        <div className="space-x-2">
          <button
            onClick={startDelayedMount}
            disabled={!!delayedMountTimer}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
          >
            5초 후 지연 마운트 시작
          </button>
          
          <button
            onClick={testWaitForDelayedMount}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            waitForRefs 성공 테스트
          </button>
          
          <button
            onClick={testWaitForTimeout}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            waitForRefs 타임아웃 테스트
          </button>
          
          <button
            onClick={cancelDelayedMount}
            disabled={!delayedMountTimer}
            className="px-2 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm disabled:opacity-50"
          >
            취소
          </button>
          
          <button
            onClick={unmountDelayedElement}
            disabled={!isDelayedMounted}
            className="px-2 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm disabled:opacity-50"
          >
            언마운트
          </button>
          
          <button
            onClick={clearDelayedLog}
            className="px-2 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
          >
            로그 클리어
          </button>
        </div>
        
        {delayedMountTimer && (
          <div className="p-2 bg-yellow-200 rounded text-sm">
            ⏳ 지연 마운트 대기 중... ({Math.ceil((5000 - (Date.now() % 5000)) / 1000)}초 남음)
          </div>
        )}
        
        {isDelayedMounted && (
          <div
            ref={delayedRef.setRef}
            className="p-4 border-2 rounded bg-white"
          >
            지연된 마운트 요소 - waitForRefs 테스트 대상
          </div>
        )}
        
        <div className="text-sm">
          <strong>지연 마운트 로그:</strong>
          <div className="max-h-32 overflow-y-auto bg-gray-100 p-2 rounded">
            {log.length === 0 ? '아직 로그가 없습니다' : log.map((entry, i) => (
              <div key={i} className="text-xs">{entry}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 메인 데모 컴포넌트
function WaitForRefsPerformanceDemo() {
  return (
    <DemoProvider>
      <DemoStoreProvider>
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">RefContext 패턴 데모</h1>
            <p className="text-gray-600">
              onMount 트리거, executeIfMounted 조건부 실행, waitForRefs 지연 마운트 패턴
            </p>
          </div>
          
          <div className="grid gap-6">
            <OnMountPatternDemo />
            <ConditionalPatternDemo />
            <DelayedMountPatternDemo />
          </div>
          
          <div className="mt-8 p-4 bg-gray-100 rounded-lg">
            <h3 className="font-bold mb-2">패턴 사용 가이드</h3>
            <ul className="text-sm space-y-1 text-gray-700">
              <li><strong>onMount:</strong> 요소 마운트 시점에 자동 실행이 필요할 때 (이벤트 기반)</li>
              <li><strong>executeIfMounted:</strong> 마운트 여부를 확인하고 조건부 실행할 때 (현재 상태 기반)</li>
              <li><strong>waitForRefs:</strong> 마운트가 보장되지만 지연되는 상황에서 사용 (Promise 기반)</li>
            </ul>
            <div className="mt-3 p-3 bg-blue-50 rounded text-sm">
              <strong>💡 waitForRefs 활용 팁:</strong>
              <ul className="mt-1 space-y-1">
                <li>• 성공 테스트: 타임아웃이 지연 시간보다 긴 경우</li>
                <li>• 타임아웃 테스트: 타임아웃이 지연 시간보다 짧은 경우</li>
                <li>• 언마운트로 완전한 생명주기 테스트 가능</li>
              </ul>
            </div>
          </div>
        </div>
      </DemoStoreProvider>
    </DemoProvider>
  );
}

export { WaitForRefsPerformanceDemo };
export default WaitForRefsPerformanceDemo;