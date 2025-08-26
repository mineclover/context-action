import React, { useCallback, useState } from 'react';
import { useDemoRef } from '../../../hooks/useDemoRef';

export function ConditionalPatternDemo() {
  const conditionalElement = useDemoRef('conditional');
  const [logs, setLogs] = useState<string[]>([]);
  const [isMounted, setIsMounted] = useState(true);
  
  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  }, []);
  
  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const testConditionalExecution = useCallback(() => {
    addLog('🔍 조건부 실행 시도...');
    
    const result = conditionalElement.executeIfMounted(() => {
      // 마운트된 경우에만 실행
      addLog('✅ 조건부 실행 성공!');
      conditionalElement.target!.style.backgroundColor = '#3b82f6';
      conditionalElement.target!.textContent = '✅ 조건부 실행 완료!';
      return 'success';
    });
    
    if (result === undefined) {
      addLog('⚠️  요소가 마운트되지 않아 실행되지 않음');
    } else {
      addLog(`🎯 실행 결과: ${result}`);
    }
  }, [conditionalElement, addLog]);
  
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
    if (conditionalElement.isMounted) {
      addLog('🚫 강제 언마운트 (setRef(null))');
      conditionalElement.setRef(null as any);
    }
  }, [conditionalElement, addLog]);

  const codeExample = `// executeIfMounted 패턴: 조건부 실행
const handleClick = useCallback(() => {
  const result = element.executeIfMounted(() => {
    // 마운트된 경우에만 실행
    element.target!.style.backgroundColor = '#3b82f6';
    return 'success';
  });
  
  if (result === undefined) {
    console.log('요소가 마운트되지 않음');
  }
}, [element]);`;

  return (
    <div className="p-4 border rounded-lg bg-blue-50">
      <h3 className="text-lg font-bold mb-3">2. 조건부 실행 패턴</h3>
      <p className="text-sm text-gray-600 mb-3">
        마운트 상태를 확인하고 조건부로 실행하는 패턴
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
            onClick={testConditionalExecution}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            🔍 조건부 실행 테스트
          </button>
          
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
            disabled={!conditionalElement.isMounted}
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
            <div>isMounted: {conditionalElement.isMounted ? '✅' : '❌'}</div>
            <div>hasTarget: {conditionalElement.target ? '✅' : '❌'}</div>
          </div>
          <div className="p-2 bg-white rounded border">
            <div className="font-medium">React 상태</div>
            <div>컴포넌트 마운트: {isMounted ? '✅' : '❌'}</div>
            <div>실행 가능: {conditionalElement.isMounted ? '✅' : '❌'}</div>
          </div>
        </div>
        
        {isMounted && (
          <div 
            ref={conditionalElement.setRef}
            className="p-4 border-2 border-dashed border-blue-300 rounded text-center min-h-[80px] flex items-center justify-center"
          >
            🔍 조건부 실행 테스트 요소 (실행 가능)
          </div>
        )}
        
        {!isMounted && (
          <div className="p-4 border-2 border-dashed border-gray-300 rounded text-center min-h-[80px] flex items-center justify-center text-gray-500">
            언마운트된 상태 (executeIfMounted 실행 불가)
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