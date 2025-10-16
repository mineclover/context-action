import { useEffect, useState, useCallback } from 'react';
import { createRefContext } from '@context-action/react';

// RefContext 생성
const DemoRefs = createRefContext<{
  container: HTMLDivElement;
  display: HTMLDivElement;
}>('DemoRefs');

/**
 * 반응형 마운트 상태 패턴 데모
 * 
 * useRefMountState를 사용한 진짜 반응형 마운트 상태 관리
 */
export function ReactiveRefMountPattern() {
  // ✅ 올바른 패턴: useRefMountState로 반응형 마운트 상태 구독
  const containerRef = DemoRefs.useRefHandler('container');
  const containerMountState = DemoRefs.useRefMountState('container');
  const { isMounted, mountedTarget } = containerMountState;
  
  const [logs, setLogs] = useState<string[]>([]);
  const [showElement, setShowElement] = useState(true);
  
  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  }, []);
  
  // 반응형 마운트 상태에 따른 효과
  useEffect(() => {
    if (isMounted && mountedTarget) {
      addLog('✅ Container mounted (reactive state)');
      mountedTarget.style.backgroundColor = '#10b981';
      mountedTarget.style.border = '2px solid #059669';
    } else {
      addLog('❌ Container unmounted (reactive state)');
    }
  }, [isMounted, mountedTarget, addLog]);
  
  // ❌ 잘못된 패턴 예시 (비교용)
  const [manualMountState, setManualMountState] = useState(false);
  
  useEffect(() => {
    const unregister = containerRef.onMount(() => {
      addLog('⚠️ onMount callback fired (manual pattern)');
      setManualMountState(true);
    });
    
    // ❌ 문제: unregister는 콜백 등록만 해제하고, 언마운트 상태 업데이트는 안 함
    return () => {
      unregister();
      // 수동으로 false 설정 필요 (놓치기 쉬움)
      setManualMountState(false);
    };
  }, [containerRef, addLog]);
  
  const toggleElement = () => {
    setShowElement(prev => !prev);
  };
  
  const clearLogs = () => {
    setLogs([]);
  };
  
  return (
    <DemoRefs.Provider>
      <div className="p-6 border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50">
        <h3 className="text-lg font-bold mb-3">🎯 Reactive Mount State Pattern</h3>
        <p className="text-sm text-gray-600 mb-4">
          useRefMountState를 사용한 진짜 반응형 마운트 상태 관리
        </p>
        
        {/* 상태 비교 */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 bg-green-100 rounded">
            <h4 className="font-semibold text-green-800 mb-2">✅ 반응형 패턴</h4>
            <div className="text-sm space-y-1">
              <div>isMounted: {isMounted ? '✅ true' : '❌ false'}</div>
              <div>mountedTarget: {mountedTarget ? '✅ exists' : '❌ null'}</div>
              <div className="text-xs text-green-600 mt-2">
                자동으로 마운트/언마운트 감지
              </div>
            </div>
          </div>
          
          <div className="p-3 bg-yellow-100 rounded">
            <h4 className="font-semibold text-yellow-800 mb-2">⚠️ 수동 패턴</h4>
            <div className="text-sm space-y-1">
              <div>manualState: {manualMountState ? '✅ true' : '❌ false'}</div>
              <div className="text-xs text-yellow-600 mt-2">
                언마운트 시 수동으로 false 설정 필요
              </div>
            </div>
          </div>
        </div>
        
        {/* 컨트롤 버튼 */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={toggleElement}
            className={`px-4 py-2 text-white rounded ${
              showElement ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {showElement ? '🔄 Unmount' : '🔄 Mount'}
          </button>
          
          <button
            onClick={clearLogs}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded"
          >
            Clear Logs
          </button>
        </div>
        
        {/* 타겟 엘리먼트 */}
        {showElement && (
          <div
            ref={containerRef.setRef}
            className="p-4 border-2 border-dashed border-blue-300 rounded bg-white text-center"
          >
            📦 Container Element (ref target)
          </div>
        )}
        
        {!showElement && (
          <div className="p-4 border-2 border-dashed border-gray-300 rounded bg-gray-50 text-center text-gray-500">
            Element unmounted - waiting for mount...
          </div>
        )}
        
        {/* 로그 */}
        <div className="mt-4 p-3 bg-white rounded border max-h-40 overflow-y-auto">
          <h4 className="font-semibold mb-2 text-sm">Event Logs:</h4>
          <div className="text-xs space-y-1 font-mono">
            {logs.map((log, i) => (
              <div key={i} className={
                log.includes('reactive') ? 'text-green-600' :
                log.includes('manual') ? 'text-yellow-600' :
                'text-gray-600'
              }>
                {log}
              </div>
            ))}
            {logs.length === 0 && <div className="text-gray-400">No logs yet...</div>}
          </div>
        </div>
        
        {/* 코드 예제 */}
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800">
            📋 코드 예제 보기
          </summary>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="font-semibold text-green-700 mb-2">✅ 올바른 패턴</h5>
              <pre className="p-3 bg-green-50 rounded text-xs overflow-x-auto">
                <code>{`// 반응형 마운트 상태 구독
const mountState = useRefMountState('container');
const { isMounted, mountedTarget } = mountState;

useEffect(() => {
  if (isMounted && mountedTarget) {
    // 마운트됨 - 자동 감지
    console.log('Mounted!');
  } else {
    // 언마운트됨 - 자동 감지
    console.log('Unmounted!');
  }
}, [isMounted, mountedTarget]);`}</code>
              </pre>
            </div>
            
            <div>
              <h5 className="font-semibold text-yellow-700 mb-2">⚠️ 피해야 할 패턴</h5>
              <pre className="p-3 bg-yellow-50 rounded text-xs overflow-x-auto">
                <code>{`// 수동 상태 관리 (문제 있음)
const [mounted, setMounted] = useState(false);

useEffect(() => {
  const unregister = ref.onMount(() => {
    setMounted(true); // 마운트만 처리
  });
  
  return () => {
    unregister();
    // ❌ 언마운트 시 false 설정 누락 가능
    setMounted(false); // 수동으로 추가 필요
  };
}, [ref]);`}</code>
              </pre>
            </div>
          </div>
        </details>
      </div>
    </DemoRefs.Provider>
  );
}