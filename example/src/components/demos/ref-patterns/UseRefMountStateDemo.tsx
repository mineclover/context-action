/**
 * @fileoverview useRefMountState 전용 데모
 *
 * useSyncExternalStore 기반 useRefMountState의 리액티브 구독을 테스트
 */

import { createRefContext } from '@context-action/react';
import { useCallback, useEffect, useState } from 'react';

// 격리된 RefContext 생성
type TestRefs = {
  dynamicElement: HTMLDivElement;
  conditionalElement: HTMLDivElement;
  delayedElement: HTMLDivElement;
  toggleElement: HTMLDivElement;
};

const {
  Provider: TestRefsProvider,
  useRefHandler: useTestRef,
  useRefMountState: useTestRefMountState,
  useOnMountStateChange: useTestOnMountStateChange,
  useRefMountChecker: useTestRefMountChecker,
} = createRefContext<TestRefs>('UseRefMountStateTest');

/**
 * 개별 Ref 상태 모니터링 컴포넌트
 */
function RefStateMonitor({
  refName,
  title,
}: {
  refName: keyof TestRefs;
  title: string;
}) {
  // 🎯 핵심: useRefMountState로 리액티브 구독
  const mountState = useTestRefMountState(refName);
  const { isMounted, isWaitingForMount, mountedTarget } = mountState;

  const [renderCount, setRenderCount] = useState(0);
  const [stateChanges, setStateChanges] = useState<string[]>([]);

  // 리렌더링 카운트 추적
  useEffect(() => {
    setRenderCount((prev) => prev + 1);

    const timestamp = new Date().toLocaleTimeString();
    const change = `[${timestamp}] Mount: ${isMounted}, Waiting: ${isWaitingForMount}, Target: ${!!mountedTarget}`;
    setStateChanges((prev) => [...prev.slice(-4), change]); // 최근 5개만 유지
  }, [isMounted, isWaitingForMount, mountedTarget]);

  return (
    <div className="p-3 bg-white rounded border">
      <h4 className="font-medium text-sm mb-2">{title}</h4>

      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span>isMounted:</span>
          <span
            className={isMounted ? 'text-green-600 font-bold' : 'text-red-600'}
          >
            {isMounted ? '✅' : '❌'}
          </span>
        </div>

        <div className="flex justify-between">
          <span>isWaitingForMount:</span>
          <span
            className={
              isWaitingForMount ? 'text-yellow-600 font-bold' : 'text-gray-400'
            }
          >
            {isWaitingForMount ? '⏳' : '⏹️'}
          </span>
        </div>

        <div className="flex justify-between">
          <span>mountedTarget:</span>
          <span
            className={
              mountedTarget ? 'text-blue-600 font-bold' : 'text-gray-400'
            }
          >
            {mountedTarget ? '📍' : '∅'}
          </span>
        </div>

        <div className="flex justify-between pt-1 border-t">
          <span>Render Count:</span>
          <span className="font-bold text-purple-600">{renderCount}</span>
        </div>

        <div className="pt-1 border-t">
          <div className="text-xs text-gray-500 mb-1">Recent Changes:</div>
          <div className="space-y-0.5 max-h-16 overflow-y-auto">
            {stateChanges.slice(-3).map((change, i) => (
              <div key={i} className="text-xs text-gray-700 font-mono">
                {change}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 동적 마운트/언마운트 테스트
 */
function DynamicMountTest() {
  const dynamicRef = useTestRef('dynamicElement');
  const [isMounted, setIsMounted] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev.slice(-4), `[${timestamp}] ${message}`]);
  }, []);

  const toggleMount = useCallback(() => {
    const newState = !isMounted;
    setIsMounted(newState);
    addLog(
      newState ? '🔺 동적 요소 마운트 시작' : '🔻 동적 요소 언마운트 시작'
    );
  }, [isMounted, addLog]);

  // 마운트 상태 변경 콜백
  useTestOnMountStateChange(
    'dynamicElement',
    useCallback(
      (mounted, target) => {
        if (mounted && target) {
          addLog('✅ useOnMountStateChange: 마운트됨');
          target.style.backgroundColor = '#dcfce7';
          target.textContent = '✅ 마운트 완료!';
        } else {
          addLog('❌ useOnMountStateChange: 언마운트됨');
        }
      },
      [addLog]
    )
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleMount}
          className={`px-4 py-2 rounded font-medium ${
            isMounted
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {isMounted ? '🔻 언마운트' : '🔺 마운트'} 동적 요소
        </button>

        <div className="text-sm text-gray-600">
          현재 상태: {isMounted ? '마운트됨' : '언마운트됨'}
        </div>
      </div>

      {isMounted && (
        <div
          ref={dynamicRef.setRef}
          className="p-4 border-2 border-dashed border-green-300 rounded text-center min-h-[80px] flex items-center justify-center bg-green-50"
        >
          🎯 동적 마운트 요소
        </div>
      )}

      <div className="bg-gray-50 p-3 rounded">
        <h4 className="font-medium text-sm mb-2">이벤트 로그</h4>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {logs.map((log, i) => (
            <div key={i} className="text-xs font-mono text-gray-700">
              {log}
            </div>
          ))}
          {logs.length === 0 && (
            <div className="text-xs text-gray-400">로그 없음</div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 조건부 렌더링 테스트
 */
function ConditionalRenderTest() {
  const conditionalRef = useTestRef('conditionalElement');
  const [showElement, setShowElement] = useState(false);
  const [condition, setCondition] = useState<'hidden' | 'loading' | 'shown'>(
    'hidden'
  );

  const startConditionalFlow = useCallback(() => {
    setCondition('loading');
    setShowElement(false);

    // 2초 후 표시
    setTimeout(() => {
      setShowElement(true);
      setCondition('shown');
    }, 2000);
  }, []);

  const resetFlow = useCallback(() => {
    setCondition('hidden');
    setShowElement(false);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={startConditionalFlow}
          disabled={condition === 'loading'}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {condition === 'loading' ? '⏳ 로딩 중...' : '🚀 조건부 렌더링 시작'}
        </button>

        <button
          onClick={resetFlow}
          className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
        >
          리셋
        </button>

        <div className="text-sm text-gray-600">
          상태:{' '}
          {condition === 'hidden'
            ? '숨김'
            : condition === 'loading'
              ? '로딩 중'
              : '표시됨'}
        </div>
      </div>

      {condition === 'loading' && (
        <div className="p-4 border-2 border-dashed border-blue-300 rounded text-center bg-blue-50">
          ⏳ 2초 후 요소가 나타납니다...
        </div>
      )}

      {showElement && (
        <div
          ref={conditionalRef.setRef}
          className="p-4 border-2 border-dashed border-blue-300 rounded text-center min-h-[80px] flex items-center justify-center bg-blue-50"
        >
          🎯 조건부 렌더링 요소
        </div>
      )}
    </div>
  );
}

/**
 * 지연 마운트 테스트
 */
function DelayedMountTest() {
  const delayedRef = useTestRef('delayedElement');
  const [isDelayMounting, setIsDelayMounting] = useState(false);
  const [delayTimer, setDelayTimer] = useState<NodeJS.Timeout | null>(null);
  const [showDelayed, setShowDelayed] = useState(false);

  const mountChecker = useTestRefMountChecker('delayedElement');

  const startDelayedMount = useCallback(() => {
    if (delayTimer) {
      clearTimeout(delayTimer);
    }

    setIsDelayMounting(true);
    setShowDelayed(false);

    const timer = setTimeout(() => {
      setShowDelayed(true);
      setIsDelayMounting(false);
      setDelayTimer(null);
    }, 3000);

    setDelayTimer(timer);
  }, [delayTimer]);

  const cancelDelayedMount = useCallback(() => {
    if (delayTimer) {
      clearTimeout(delayTimer);
      setDelayTimer(null);
      setIsDelayMounting(false);
    }
  }, [delayTimer]);

  const checkCurrentState = useCallback(() => {
    const currentState = mountChecker();
    alert(
      `현재 상태:\n- isMounted: ${currentState.isMounted}\n- isWaitingForMount: ${currentState.isWaitingForMount}\n- hasTarget: ${!!currentState.target}`
    );
  }, [mountChecker]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={startDelayedMount}
          disabled={isDelayMounting}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
        >
          {isDelayMounting ? '⏰ 3초 대기 중...' : '⏰ 3초 지연 마운트 시작'}
        </button>

        <button
          onClick={cancelDelayedMount}
          disabled={!delayTimer}
          className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm disabled:opacity-50"
        >
          ⏹️ 취소
        </button>

        <button
          onClick={checkCurrentState}
          className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
        >
          📊 상태 확인
        </button>
      </div>

      {isDelayMounting && (
        <div className="p-4 border-2 border-dashed border-purple-300 rounded text-center bg-purple-50">
          ⏰ 3초 후에 요소가 마운트됩니다... ({Math.ceil(delayTimer ? 3 : 0)}초
          남음)
        </div>
      )}

      {showDelayed && (
        <div
          ref={delayedRef.setRef}
          className="p-4 border-2 border-dashed border-purple-300 rounded text-center min-h-[80px] flex items-center justify-center bg-purple-50"
        >
          🎯 3초 지연 마운트 요소
        </div>
      )}
    </div>
  );
}

/**
 * 토글 마운트 테스트
 */
function ToggleMountTest() {
  const toggleRef = useTestRef('toggleElement');
  const [isVisible, setIsVisible] = useState(true);
  const [toggleCount, setToggleCount] = useState(0);

  const toggleVisibility = useCallback(() => {
    setIsVisible((prev) => !prev);
    setToggleCount((prev) => prev + 1);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleVisibility}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          {isVisible ? '👁️‍🗨️ 숨기기' : '👁️ 보이기'} (토글 #{toggleCount})
        </button>

        <div className="text-sm text-gray-600">
          현재: {isVisible ? '보임' : '숨김'} | 토글 횟수: {toggleCount}
        </div>
      </div>

      {isVisible && (
        <div
          ref={toggleRef.setRef}
          className="p-4 border-2 border-dashed border-indigo-300 rounded text-center min-h-[80px] flex items-center justify-center bg-indigo-50"
        >
          🎯 토글 요소 (#{toggleCount})
        </div>
      )}
    </div>
  );
}

/**
 * useRefMountState 전용 데모 메인 컴포넌트
 */
function UseRefMountStateDemoContent() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">
          🎯 useRefMountState 전용 테스트
        </h1>
        <p className="text-gray-600 mb-2">
          useSyncExternalStore 기반 리액티브 구독을 테스트합니다
        </p>
        <div className="inline-block px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>핵심 기능:</strong> 실시간 mount/unmount 상태 감지 및
            리렌더링 트리거
          </p>
        </div>
      </div>

      {/* 상태 모니터링 섹션 */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">📊 실시간 상태 모니터링</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <RefStateMonitor refName="dynamicElement" title="동적 요소" />
          <RefStateMonitor refName="conditionalElement" title="조건부 요소" />
          <RefStateMonitor refName="delayedElement" title="지연 요소" />
          <RefStateMonitor refName="toggleElement" title="토글 요소" />
        </div>
      </div>

      {/* 테스트 섹션들 */}
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-bold mb-4">1. 동적 마운트/언마운트</h3>
          <DynamicMountTest />
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-bold mb-4">2. 조건부 렌더링</h3>
          <ConditionalRenderTest />
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-bold mb-4">3. 지연 마운트</h3>
          <DelayedMountTest />
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-bold mb-4">4. 빠른 토글</h3>
          <ToggleMountTest />
        </div>
      </div>

      {/* 설명 섹션 */}
      <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
        <h3 className="text-lg font-bold mb-3">🔍 테스트 포인트</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h4 className="font-semibold text-green-700">✅ 확인사항</h4>
            <ul className="text-sm space-y-1 mt-2 text-green-600">
              <li>• 상태 모니터링에서 실시간 업데이트 확인</li>
              <li>• Render Count가 상태 변경 시마다 증가</li>
              <li>• useOnMountStateChange 콜백 실행</li>
              <li>• useRefMountChecker의 즉시 상태 확인</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-blue-700">🎯 주요 기능</h4>
            <ul className="text-sm space-y-1 mt-2 text-blue-600">
              <li>• useSyncExternalStore 기반 리액티브 구독</li>
              <li>• 마운트/언마운트 상태 실시간 감지</li>
              <li>• 자동 리렌더링 트리거</li>
              <li>• 성능 최적화된 상태 캐싱</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export function UseRefMountStateDemo() {
  return (
    <TestRefsProvider>
      <UseRefMountStateDemoContent />
    </TestRefsProvider>
  );
}

export default UseRefMountStateDemo;
