import React, { useCallback, useEffect, useState } from 'react';
import { useDemoRef } from '../../../hooks/useDemoRef';

export function OnMountPatternDemo() {
  const interactiveElement = useDemoRef('interactive');
  const [logs, setLogs] = useState<string[]>([]);
  const [isMounted, setIsMounted] = useState(true);
  
  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  }, []);
  
  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // onMount 콜백으로 마운트 시 자동 실행
  useEffect(() => {
    const unregister = interactiveElement.onMount((target: HTMLDivElement) => {
      addLog('🎯 onMount 콜백 실행됨!');
      target.style.backgroundColor = '#10b981';
      target.textContent = '✅ onMount로 초기화 완료!';
    });
    
    return unregister; // 컴포넌트 언마운트 시 정리
  }, [interactiveElement, addLog]);
  
  const toggleMount = useCallback(() => {
    if (isMounted) {
      addLog('🔄 요소 언마운트...');
      setIsMounted(false);
    } else {
      addLog('🔄 요소 재마운트...');
      setIsMounted(true);
    }
  }, [isMounted, addLog]);

  const forceUnmount = useCallback(() => {
    if (interactiveElement.isMounted) {
      addLog('🚫 강제 언마운트 (setRef(null))');
      interactiveElement.setRef(null as any);
    }
  }, [interactiveElement, addLog]);

  const codeExample = `// onMount 패턴: 마운트 시 자동 실행
useEffect(() => {
  const unregister = element.onMount((target) => {
    // 마운트 시 자동 실행되는 코드
    target.style.backgroundColor = '#10b981';
    target.textContent = '✅ 초기화 완료!';
  });
  
  return unregister; // 정리 함수 반환
}, [element]);`;

  return (
    <div className="p-4 border rounded-lg bg-green-50">
      <h3 className="text-lg font-bold mb-3">1. onMount 패턴</h3>
      <p className="text-sm text-gray-600 mb-3">
        마운트 시 자동으로 실행되는 콜백 패턴 (권장)
      </p>
      
      {/* 코드 예제 */}
      <details className="mb-3">
        <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800">
          📋 코드 예제 보기
        </summary>
        <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-x-auto">
          <code>{codeExample}</code>
        </pre>
      </details>
      
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={toggleMount}
            className={`px-4 py-2 text-white rounded ${
              isMounted ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {isMounted ? '🔄 언마운트' : '🔄 재마운트'}
          </button>
          
          <button
            onClick={forceUnmount}
            disabled={!interactiveElement.isMounted}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
          >
            🚫 강제 언마운트
          </button>
          
          <button
            onClick={clearLogs}
            className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
          >
            로그 지우기
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="p-2 bg-white rounded border">
            <div className="font-medium">RefContext 상태</div>
            <div>isMounted: {interactiveElement.isMounted ? '✅' : '❌'}</div>
            <div>hasTarget: {interactiveElement.target ? '✅' : '❌'}</div>
          </div>
          <div className="p-2 bg-white rounded border">
            <div className="font-medium">React 상태</div>
            <div>컴포넌트 마운트: {isMounted ? '✅' : '❌'}</div>
          </div>
        </div>
        
        {isMounted && (
          <div 
            ref={interactiveElement.setRef}
            className="p-4 border-2 border-dashed border-green-300 rounded text-center min-h-[80px] flex items-center justify-center"
          >
            🎯 onMount 테스트 요소 (마운트됨)
          </div>
        )}
        
        {!isMounted && (
          <div className="p-4 border-2 border-dashed border-gray-300 rounded text-center min-h-[80px] flex items-center justify-center text-gray-500">
            언마운트된 상태 (onMount 콜백 대기 중)
          </div>
        )}
        
        <div className="text-xs space-y-1 max-h-32 overflow-y-auto bg-white p-2 rounded border">
          {logs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
          {logs.length === 0 && <div className="text-gray-400">로그 없음</div>}
        </div>
      </div>
    </div>
  );
}