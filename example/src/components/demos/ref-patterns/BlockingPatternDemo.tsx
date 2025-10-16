import { useCallback, useState } from 'react';
import { useDemoRef, useWaitForDemoRefs } from '../../../hooks/useDemoRef';

export function BlockingPatternDemo() {
  const delayedElement = useDemoRef('delayedElement');
  const waitForRefs = useWaitForDemoRefs();
  const [logs, setLogs] = useState<string[]>([]);
  const [isDelayedMounted, setIsDelayedMounted] = useState(false);
  const [delayedMountTimer, setDelayedMountTimer] = useState<any>(null);

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // 지연된 마운트 시뮬레이션
  const startDelayedMount = useCallback(() => {
    if (delayedMountTimer) {
      clearTimeout(delayedMountTimer as any);
    }

    setIsDelayedMounted(false);
    addLog('🕒 5초 후 마운트 예정...');

    const timer = setTimeout(() => {
      setIsDelayedMounted(true);
      addLog('🎯 지연된 요소가 마운트됨!');
      setDelayedMountTimer(null);
    }, 5000);

    setDelayedMountTimer(timer);
  }, [delayedMountTimer, addLog]);

  // ❌ 잘못된 사용법: 동기적으로 waitForRefs 호출 (블로킹 예시)
  const testWaitForRefsBlocking = useCallback(() => {
    addLog('❌ 블로킹 예시: 동기적 waitForRefs 호출... (UI가 3초간 멈춤)');
    addLog('⚠️  주의: 실제로 UI가 블로킹됩니다!');

    let isComplete = false;
    let result: any = null;

    waitForRefs(5000, 'delayedElement')
      .then((refs: any) => {
        isComplete = true;
        result = refs;
        addLog('🔄 동기적 처리 시도 완료... 하지만 UI가 멈춤');
      })
      .catch((error: any) => {
        isComplete = true;
        addLog(`❌ 동기적 처리 오류: ${error}`);
      });

    // 결과를 기다리기 위해 busy waiting (CPU를 점유하며 UI 블로킹)
    // 블로킹 강도를 줄이기 위해 3초로 단축하고 간헐적으로 yield
    const startTime = Date.now();
    let iterations = 0;
    while (!isComplete && Date.now() - startTime < 3000) {
      iterations++;
      // 1000번마다 잠시 yield하여 완전 블로킹을 방지
      if (iterations % 1000000 === 0) {
        // 짧은 setTimeout으로 이벤트 루프에 제어 양보
        if (Date.now() - startTime > 100) break; // 100ms 후에는 끝냄
      }
      // 빈 루프로 CPU 점유 - UI 블로킹 발생!
      // 이런 식으로 하면 절대 안됨
    }

    const duration = Date.now() - startTime;
    if (isComplete && result) {
      addLog(`⚠️ 동기적 처리가 완료되었지만 UI가 ${duration}ms간 멈췄습니다`);
    } else {
      addLog(`⚠️ 동기적 처리 타임아웃 - UI가 ${duration}ms간 멈췄습니다`);
    }
  }, [waitForRefs, addLog]);

  // ✅ 올바른 사용법: 비동기적으로 waitForRefs 호출 (non-blocking)
  const testWaitForRefsNonBlocking = useCallback(async () => {
    try {
      addLog('✅ Non-blocking 예시: 비동기 waitForRefs 시작...');
      const startTime = Date.now();

      const refs = await waitForRefs(10000, 'delayedElement');

      const duration = Date.now() - startTime;
      addLog(
        `✅ Non-blocking waitForRefs 완료! (${duration}ms, UI 반응성 유지)`
      );

      refs.delayedElement.style.backgroundColor = '#10b981';
      refs.delayedElement.textContent = `✅ Non-blocking 완료! (${duration}ms)`;
    } catch (error) {
      addLog(`❌ Non-blocking waitForRefs 타임아웃: ${error}`);
    }
  }, [waitForRefs, addLog]);

  const cancelDelayedMount = useCallback(() => {
    if (delayedMountTimer) {
      clearTimeout(delayedMountTimer as any);
      setDelayedMountTimer(null);
      addLog('⏹️ 지연 마운트가 취소됨');
    }
  }, [delayedMountTimer, addLog]);

  const blockingCodeExample = `// ❌ 잘못된 사용법: busy waiting으로 UI 블로킹
const handleClick = () => {
  let isComplete = false;
  let result = null;
  
  waitForRefs(5000, 'element').then(refs => {
    isComplete = true;
    result = refs;
  });
  
  // 이렇게 하면 안됨: CPU 점유로 UI 블로킹
  const startTime = Date.now();
  while (!isComplete && Date.now() - startTime < 6000) {
    // 빈 루프 - UI가 멈춤!
  }
};`;

  const nonBlockingCodeExample = `// ✅ 올바른 사용법: async/await로 비동기 처리
const handleClick = async () => {
  try {
    const refs = await waitForRefs(10000, 'element');
    // UI 반응성을 유지하며 처리
    refs.element.style.backgroundColor = '#10b981';
  } catch (error) {
    console.error('타임아웃:', error);
  }
};`;

  return (
    <div className="p-4 border rounded-lg bg-yellow-50">
      <h3 className="text-lg font-bold mb-3">
        3. waitForRefs 블로킹 vs Non-blocking
      </h3>
      <div className="p-3 bg-red-50 border border-red-200 rounded mb-3">
        <p className="text-sm text-red-700 font-medium">
          ⚠️ 주의: 블로킹 예시는 실제로 UI를 3초간 정지시킵니다!
        </p>
        <p className="text-xs text-red-600 mt-1">
          ❌ 잘못된 동기적 사용 (UI 블로킹) vs ✅ 올바른 비동기 사용 (UI 반응성
          유지)
        </p>
      </div>

      {/* 코드 예제 */}
      <details className="mb-3">
        <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800">
          📋 블로킹 코드 예제 보기 (❌ 안티패턴)
        </summary>
        <pre className="mt-2 p-3 bg-red-50 rounded text-xs overflow-x-auto border border-red-200">
          <code>{blockingCodeExample}</code>
        </pre>
      </details>

      <details className="mb-3">
        <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800">
          📋 Non-blocking 코드 예제 보기 (✅ 권장)
        </summary>
        <pre className="mt-2 p-3 bg-green-50 rounded text-xs overflow-x-auto border border-green-200">
          <code>{nonBlockingCodeExample}</code>
        </pre>
      </details>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={startDelayedMount}
            disabled={!!delayedMountTimer}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
          >
            ⏰ 5초 후 지연 마운트 시작
          </button>

          <button
            onClick={testWaitForRefsBlocking}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            title="주의: 실제로 UI가 3초간 멈춥니다!"
          >
            ❌ 블로킹 예시 (UI 3초 정지!)
          </button>

          <button
            onClick={testWaitForRefsNonBlocking}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            ✅ Non-blocking 예시
          </button>

          <button
            onClick={cancelDelayedMount}
            disabled={!delayedMountTimer}
            className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm disabled:opacity-50"
          >
            ⏹️ 취소
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
            <div className="font-medium">지연 마운트 상태</div>
            <div>타이머: {delayedMountTimer ? '🔄 진행중' : '⏹️ 중지'}</div>
            <div>마운트: {isDelayedMounted ? '✅' : '❌'}</div>
          </div>
          <div className="p-2 bg-white rounded border">
            <div className="font-medium">RefContext 상태</div>
            <div>isMounted: {delayedElement.isMounted ? '✅' : '❌'}</div>
            <div>hasTarget: {delayedElement.target ? '✅' : '❌'}</div>
          </div>
          <div className="p-2 bg-white rounded border">
            <div className="font-medium">테스트 가이드</div>
            <div>1. 지연 마운트 시작</div>
            <div>2. 블로킹/Non-blocking 테스트</div>
          </div>
        </div>

        {isDelayedMounted && (
          <div
            ref={delayedElement.setRef}
            className="p-4 border-2 border-dashed border-yellow-300 rounded text-center min-h-[80px] flex items-center justify-center"
          >
            🎯 지연 마운트된 요소
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
