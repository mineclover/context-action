import { useCallback, useMemo, useRef, useState } from 'react';
import { CodeBlock } from '@/components/ui';
import { useDemoRef } from '../../../hooks/useDemoRef';

export function MemoizationPatternDemo() {
  const memoTestRef = useDemoRef('memoTest');
  const [logs, setLogs] = useState<string[]>([]);
  const [isMountToggled, setIsMountToggled] = useState(true);
  const [functionCallCount, setFunctionCallCount] = useState(0);
  const callCountRef = useRef(0);

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // 빈 deps 배열이지만 항상 최신 값을 반환하는 메모이제이션 함수
  const memoizedCheckFunction = useCallback(() => {
    // useRef를 통해 최신 카운트를 관리 (클로저 문제 해결)
    callCountRef.current += 1;
    setFunctionCallCount(callCountRef.current);

    const isMounted = memoTestRef.isMounted;
    const isWaiting = memoTestRef.isWaitingForMount;
    const target = memoTestRef.target;

    addLog(
      `🔍 메모이제이션 함수 호출 #${callCountRef.current}: isMounted=${isMounted}, hasTarget=${!!target}`
    );
    addLog(`💡 함수 참조는 동일하지만 RefContext 값은 최신! (지연 평가)`);

    return { isMounted, isWaiting, hasTarget: !!target };
  }, []); // 빈 deps - 함수 자체는 재생성되지 않음

  // useMemo로 포착된 요소 객체 (최초 렌더링 시점에만 포착)
  const capturedElement = useMemo(() => {
    addLog('📸 useMemo로 요소 객체 포착 (최초 렌더링 시점)');
    return memoTestRef;
  }, []); // 빈 deps - 최초 렌더링에서만 실행

  const testMemoizedFunction = useCallback(() => {
    addLog('🧪 메모이제이션 함수 테스트 시작...');
    const result = memoizedCheckFunction();
    addLog(`✅ 결과: ${JSON.stringify(result)}`);
  }, [memoizedCheckFunction, addLog]);

  const testCapturedVsDirect = useCallback(() => {
    addLog('🆚 포착된 객체 vs 직접 접근 비교...');

    const directIsMounted = memoTestRef.isMounted;
    const capturedIsMounted = capturedElement.isMounted;

    addLog(`직접 접근: isMounted=${directIsMounted}`);
    addLog(`포착된 객체: isMounted=${capturedIsMounted}`);

    if (directIsMounted === capturedIsMounted) {
      addLog('✅ 두 값이 동일함 - 지연 평가가 정상 동작!');
    } else {
      addLog('❌ 값이 다름 - 예상치 못한 동작');
    }
  }, [memoTestRef, capturedElement, addLog]);

  const toggleMount = useCallback(() => {
    setIsMountToggled((prev) => !prev);
    addLog(isMountToggled ? '🔄 요소 언마운트...' : '🔄 요소 재마운트...');
  }, [isMountToggled, addLog]);

  const forceUnmount = useCallback(() => {
    if (memoTestRef.isMounted) {
      addLog('🚫 강제 언마운트 (setRef(null))');
      memoTestRef.setRef(null as any);
    }
  }, [memoTestRef, addLog]);

  const resetCounters = useCallback(() => {
    callCountRef.current = 0;
    setFunctionCallCount(0);
    addLog('🔄 호출 카운터 리셋됨');
  }, [addLog]);

  const codeExample = `// 메모이제이션된 함수에서 최신 값 접근 + 카운터
const callCountRef = useRef(0);

const memoizedCheck = useCallback(() => {
  // useRef로 클로저 문제 해결 (카운터)
  callCountRef.current += 1;
  
  return {
    isMounted: element.isMounted,       // 항상 최신 상태 (지연 평가)
    isWaiting: element.isWaitingForMount, // 항상 최신 상태 (지연 평가)
    hasTarget: !!element.target,        // 항상 최신 상태 (지연 평가)
    callCount: callCountRef.current     // 증가하는 카운터
  };
}, []); // 빈 deps - 함수 참조는 동일하지만 내부 값은 최신!

// useMemo로 포착된 객체도 지연 평가로 최신 값 반환
const capturedElement = useMemo(() => element, []); // 최초 렌더링에서만 포착
console.log(capturedElement.isMounted); // 항상 최신 상태! (지연 평가)`;

  return (
    <div className="p-4 border rounded-lg bg-purple-50">
      <h3 className="text-lg font-bold mb-3">
        4. 메모이제이션과 지연 평가 테스트
      </h3>
      <p className="text-sm text-gray-600 mb-3">
        RefContext 속성이 메모이제이션 함수에서도 최신 값을 반환하는지 확인
      </p>

      {/* 코드 예제 */}
      <details className="mb-3">
        <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800">
          📋 코드 예제 보기
        </summary>
        <CodeBlock size="sm">
          <code>{codeExample}</code>
        </CodeBlock>
      </details>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={toggleMount}
            className={`px-4 py-2 text-white rounded ${
              isMountToggled
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {isMountToggled ? '🔄 언마운트' : '🔄 재마운트'}
          </button>

          <button
            onClick={forceUnmount}
            disabled={!memoTestRef.isMounted}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
          >
            🚫 강제 언마운트
          </button>

          <button
            onClick={testMemoizedFunction}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            🧪 메모이제이션 함수 테스트
          </button>

          <button
            onClick={testCapturedVsDirect}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            🆚 포착된 객체 vs 직접 접근
          </button>

          <button
            onClick={resetCounters}
            className="px-3 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
          >
            🔄 카운터 리셋
          </button>

          <button
            onClick={clearLogs}
            className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
          >
            로그 지우기
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="p-2 bg-white rounded border">
            <div className="font-medium">RefContext 상태</div>
            <div>isMounted: {memoTestRef.isMounted ? '✅' : '❌'}</div>
            <div>hasTarget: {memoTestRef.target ? '✅' : '❌'}</div>
            <div>React 마운트: {isMountToggled ? '✅' : '❌'}</div>
          </div>
          <div className="p-2 bg-white rounded border">
            <div className="font-medium">메모이제이션 함수</div>
            <div>호출 횟수: {functionCallCount}</div>
            <div>함수 참조: 동일 유지</div>
            <div>deps 배열: []</div>
          </div>
          <div className="p-2 bg-white rounded border">
            <div className="font-medium">포착된 객체</div>
            <div>생성: 최초 렌더링</div>
            <div>값: 지연 평가 ✨</div>
            <div>캐시: useMemo</div>
          </div>
        </div>

        {isMountToggled && (
          <div
            ref={memoTestRef.setRef}
            className="p-4 border-2 border-dashed border-purple-300 rounded text-center min-h-[80px] flex items-center justify-center"
          >
            🧪 메모이제이션 테스트 요소 (마운트됨)
          </div>
        )}

        <div className="text-xs space-y-1 max-h-40 overflow-y-auto bg-white p-2 rounded border">
          {logs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
          {logs.length === 0 && <div className="text-gray-400">로그 없음</div>}
        </div>
      </div>
    </div>
  );
}
