/**
 * @fileoverview useRefMountState 전용 테스트 페이지 - Context-Layered Architecture
 *
 * Layer Structure:
 * - views/: UI 컴포넌트
 * - actions/: Action 디스패처
 * - handlers/: Business Logic
 * - contexts/: State & Provider
 */

import { useStoreValue } from '@context-action/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  PageWithLogMonitor,
  useActionLoggerWithToast,
  useLogMonitor,
} from '@/components/LogMonitor';
import { LogLevel } from '@/utils/logger';
import { useRegisterSourceFile } from '../../../hooks/useRegisterSourceFile';
import { useTestActions } from './actions/useTestActions';
import type { UseRefMountStateRefs } from './contexts/UseRefMountStateContexts';
import {
  TestActionProvider,
  TestRefsProvider,
  TestStoreProvider,
  useTestOnMountStateChange,
  useTestRef,
  useTestRefMountChecker,
  useTestRefMountState,
  useTestStore,
} from './contexts/UseRefMountStateContexts';
import { UseRefMountStateHandlerRegistry } from './handlers/UseRefMountStateHandlerRegistry';

// ============================================================================
// VIEWS LAYER - UI Components
// ============================================================================

/**
 * 상태 모니터링 컴포넌트
 */
function RefStateMonitor({
  refName,
  title,
}: {
  refName: keyof UseRefMountStateRefs;
  title: string;
}) {
  const mountState = useTestRefMountState(refName);
  const { isMounted, isWaitingForMount, mountedTarget } = mountState;

  const renderCountsStore = useTestStore('renderCounts');
  const renderCounts = useStoreValue(renderCountsStore);
  const renderCount = renderCounts[refName] || 0;

  const { incrementRenderCount } = useTestActions();
  const logMonitor = useLogMonitor();

  // 렌더링 카운트 추적 (무한루프 방지를 위한 최적화)
  useEffect(() => {
    incrementRenderCount(refName);
  }, [
    isMounted,
    isWaitingForMount,
    mountedTarget,
    incrementRenderCount,
    refName,
  ]);

  // 중요한 상태 변경만 로깅 (마운트/언마운트 시점만 기록하여 무한루프 방지)
  const prevMountedRef = useRef<boolean | undefined>(undefined);

  useEffect(() => {
    // 마운트 상태가 실제로 변경된 경우에만 로깅
    if (
      prevMountedRef.current !== undefined &&
      prevMountedRef.current !== isMounted
    ) {
      logMonitor.addLog({
        level: LogLevel.DEBUG,
        type: 'system',
        message: `${isMounted ? '🟢' : '🔴'} ${refName} 마운트 상태 변경: ${prevMountedRef.current ? 'mounted' : 'unmounted'} → ${isMounted ? 'mounted' : 'unmounted'}`,
        details: {
          refName,
          previouslyMounted: prevMountedRef.current,
          currentlyMounted: isMounted,
          hasTarget: !!mountedTarget,
          renderCount: renderCounts[refName] || 0,
        },
      });
    }
    prevMountedRef.current = isMounted;
  }, [isMounted, refName, logMonitor, mountedTarget, renderCounts]);

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
      </div>
    </div>
  );
}

/**
 * 동적 마운트/언마운트 테스트 컴포넌트
 */
function DynamicMountTest() {
  const dynamicRef = useTestRef('dynamicElement');
  const [isMounted, setIsMounted] = useState(false);
  const _actionLogger = useActionLoggerWithToast();
  const _logMonitor = useLogMonitor();

  const toggleMount = useCallback(() => {
    const newState = !isMounted;
    setIsMounted(newState);

    // 간단한 콘솔 로깅으로 대체 (무한루프 방지)
    console.log(
      `🔄 동적 요소 토글: ${isMounted ? 'mounted' : 'unmounted'} → ${newState ? 'mounted' : 'unmounted'}`
    );
  }, [isMounted]);

  // 마운트 상태 변경 콜백 (중복 호출 방지를 위한 최적화)
  const lastMountStateRef = useRef<{
    mounted: boolean;
    timestamp: number;
  } | null>(null);

  useTestOnMountStateChange(
    'dynamicElement',
    useCallback((mounted, target) => {
      const now = Date.now();

      // 중복 호출 방지: 같은 상태가 100ms 이내에 반복 호출되면 무시
      if (
        lastMountStateRef.current &&
        lastMountStateRef.current.mounted === mounted &&
        now - lastMountStateRef.current.timestamp < 100
      ) {
        return;
      }

      lastMountStateRef.current = { mounted, timestamp: now };

      if (mounted && target) {
        // DOM 조작만 수행 (로깅은 일시적으로 비활성화)
        target.style.backgroundColor = '#dcfce7';
        target.textContent = '✅ 마운트 완료!';

        // 콘솔 로그로만 기록
        console.log('✅ 동적 요소 마운트됨 - useOnMountStateChange Hook', {
          target,
          timestamp: now,
        });
      } else {
        // 언마운트 로깅 (한 번만, 콘솔로만 출력하여 무한루프 방지)
        console.log('❌ 동적 요소 언마운트됨 - useOnMountStateChange Hook');
      }
    }, [])
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
    </div>
  );
}

/**
 * 토글 마운트 테스트 컴포넌트
 */
function ToggleMountTest() {
  const toggleRef = useTestRef('toggleElement');
  const [isVisible, setIsVisible] = useState(true);
  const [toggleCount, setToggleCount] = useState(0);
  const _actionLogger = useActionLoggerWithToast();
  const _logMonitor = useLogMonitor();

  const toggleVisibility = useCallback(() => {
    const newVisible = !isVisible;
    const newCount = toggleCount + 1;

    setIsVisible(newVisible);
    setToggleCount(newCount);

    // 간단한 콘솔 로깅 (무한루프 방지)
    console.log(`⚡ 토글 ${newVisible ? '표시' : '숨김'} (#${newCount})`);
  }, [isVisible, toggleCount]);

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
 * 조건부 렌더링 테스트 컴포넌트
 */
function ConditionalRenderTest() {
  const conditionalRef = useTestRef('conditionalElement');
  const [showElement, setShowElement] = useState(false);
  const [condition, setCondition] = useState<'hidden' | 'loading' | 'shown'>(
    'hidden'
  );
  const actionLogger = useActionLoggerWithToast();
  const logMonitor = useLogMonitor();
  const [_startTime, setStartTime] = useState<number>(0);

  const startConditionalFlow = useCallback(() => {
    const flowStartTime = performance.now();
    setStartTime(flowStartTime);
    setCondition('loading');
    setShowElement(false);

    // 조건부 렌더링 시작 로깅
    actionLogger.logAction(
      'startConditionalFlow',
      { condition: 'loading', delay: 2000 },
      {
        context: 'Conditional Render Test',
        toast: {
          type: 'info',
          title: '조건부 렌더링',
          message: '2초 후 요소가 표시됩니다',
        },
      }
    );

    // 비동기 타이밍 로그
    logMonitor.addLog({
      level: LogLevel.DEBUG,
      type: 'system',
      message: '⏰ 조건부 렌더링 타이머 시작 (2000ms)',
      details: {
        startTime: flowStartTime,
        targetDelay: 2000,
        refName: 'conditionalElement',
      },
    });

    // 2초 후 표시
    setTimeout(() => {
      const endTime = performance.now();
      const actualDelay = Math.round(endTime - flowStartTime);

      setShowElement(true);
      setCondition('shown');

      // 성공 로깅 (Toast + 성능 데이터)
      actionLogger.logAction(
        'conditionalElementShown',
        { condition: 'shown', actualDelay },
        {
          context: 'Conditional Render Test',
          toast: {
            type: 'success',
            title: '조건부 요소 표시',
            message: `지연 시간: ${actualDelay}ms`,
          },
        }
      );

      // 성능 데이터 로그
      logMonitor.addLog({
        level: LogLevel.INFO,
        type: 'system',
        message: '⚡ 조건부 렌더링 지연 시간 측정 완료',
        details: {
          expectedDelay: 2000,
          actualDelay,
          timingAccuracy: (Math.abs(2000 - actualDelay) / 2000) * 100,
          refName: 'conditionalElement',
        },
      });
    }, 2000);
  }, [actionLogger, logMonitor]);

  const resetFlow = useCallback(() => {
    setCondition('hidden');
    setShowElement(false);

    actionLogger.logSystem('🔄 조건부 렌더링 리셋', {
      context: 'Conditional Render Test',
    });

    logMonitor.addLog({
      level: LogLevel.DEBUG,
      type: 'system',
      message: '🔄 조건부 렌더링 상태 초기화',
      details: {
        previousCondition: condition,
        newCondition: 'hidden',
        refName: 'conditionalElement',
      },
    });
  }, [condition, actionLogger, logMonitor]);

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
 * 지연 마운트 테스트 컴포넌트
 */
function DelayedMountTest() {
  const delayedRef = useTestRef('delayedElement');
  const [isDelayMounting, setIsDelayMounting] = useState(false);
  const [delayTimer, setDelayTimer] = useState<NodeJS.Timeout | null>(null);
  const [showDelayed, setShowDelayed] = useState(false);
  const actionLogger = useActionLoggerWithToast();
  const logMonitor = useLogMonitor();
  const [delayStartTime, setDelayStartTime] = useState<number>(0);

  const mountChecker = useTestRefMountChecker('delayedElement');

  const startDelayedMount = useCallback(() => {
    if (delayTimer) {
      clearTimeout(delayTimer);
    }

    const startTime = performance.now();
    setDelayStartTime(startTime);
    setIsDelayMounting(true);
    setShowDelayed(false);

    // 3초 지연 마운트 시작 로깅
    actionLogger.logAction(
      'startDelayedMount',
      { delay: 3000, refName: 'delayedElement' },
      {
        context: 'Delayed Mount Test',
        toast: {
          type: 'info',
          title: '지연 마운트',
          message: '3초 후 요소가 마운트됩니다',
        },
      }
    );

    // 지연 마운트 성능 지표 로그
    logMonitor.addLog({
      level: LogLevel.DEBUG,
      type: 'system',
      message: '⏰ 지연 마운트 타이머 시작 (3000ms)',
      details: {
        startTime,
        targetDelay: 3000,
        timerId: 'delayed-mount-timer',
        refName: 'delayedElement',
      },
    });

    const timer = setTimeout(() => {
      const endTime = performance.now();
      const actualDelay = Math.round(endTime - startTime);

      setShowDelayed(true);
      setIsDelayMounting(false);
      setDelayTimer(null);

      // 지연 마운트 완료 로깅
      actionLogger.logAction(
        'delayedMountCompleted',
        { actualDelay, targetDelay: 3000 },
        {
          context: 'Delayed Mount Test',
          toast: {
            type: 'success',
            title: '지연 마운트 완료',
            message: `실제 지연: ${actualDelay}ms`,
          },
        }
      );

      // 정밀 타이밍 데이터 로그
      logMonitor.addLog({
        level: LogLevel.INFO,
        type: 'system',
        message: '⚡ 지연 마운트 타이밍 정확도 분석',
        details: {
          expectedDelay: 3000,
          actualDelay,
          timingError: actualDelay - 3000,
          accuracy: `${(((3000 - Math.abs(actualDelay - 3000)) / 3000) * 100).toFixed(2)}%`,
          refName: 'delayedElement',
        },
      });
    }, 3000);

    setDelayTimer(timer);
  }, [delayTimer, actionLogger, logMonitor]);

  const cancelDelayedMount = useCallback(() => {
    if (delayTimer) {
      const cancelTime = performance.now();
      const elapsedTime = Math.round(cancelTime - delayStartTime);

      clearTimeout(delayTimer);
      setDelayTimer(null);
      setIsDelayMounting(false);

      // 취소 액션 로깅 (Toast 지원)
      actionLogger.logAction(
        'cancelDelayedMount',
        { elapsedTime, remainingTime: 3000 - elapsedTime },
        {
          context: 'Delayed Mount Test',
          toast: {
            type: 'info',
            title: '지연 마운트 취소',
            message: `${elapsedTime}ms 후 취소됨`,
          },
        }
      );

      // 취소 타이밍 데이터
      logMonitor.addLog({
        level: LogLevel.WARN,
        type: 'system',
        message: '⏹️ 지연 마운트 취소 - 타이밍 데이터',
        details: {
          startTime: delayStartTime,
          cancelTime,
          elapsedTime,
          remainingTime: 3000 - elapsedTime,
          completionRate: `${((elapsedTime / 3000) * 100).toFixed(1)}%`,
        },
      });
    }
  }, [delayTimer, delayStartTime, actionLogger, logMonitor]);

  const checkCurrentState = useCallback(() => {
    const checkTime = performance.now();
    const currentState = mountChecker();
    const stateInfo = `현재 상태:\n- isMounted: ${currentState.isMounted}\n- isWaitingForMount: ${currentState.isWaitingForMount}\n- hasTarget: ${!!currentState.target}`;

    // 상태 확인 액션 로깅
    actionLogger.logAction(
      'checkDelayedElementState',
      {
        state: {
          isMounted: currentState.isMounted,
          isWaitingForMount: currentState.isWaitingForMount,
          hasTarget: !!currentState.target,
        },
      },
      {
        context: 'Delayed Mount Test - State Check',
        toast: {
          type: 'info',
          title: '상태 확인',
          message: `마운트: ${currentState.isMounted ? 'O' : 'X'}`,
        },
      }
    );

    // 상세 상태 로그
    logMonitor.addLog({
      level: LogLevel.DEBUG,
      type: 'system',
      message: '📊 useRefMountChecker 상태 실시간 확인',
      details: {
        checkTime,
        refName: 'delayedElement',
        mountState: currentState,
        elementTagName: currentState.target?.tagName || null,
        elementId: currentState.target?.id || null,
      },
    });

    alert(stateInfo);
  }, [mountChecker, actionLogger, logMonitor]);

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
 * 메인 콘텐츠 컴포넌트
 */
function UseRefMountStateContent() {
  const renderCountsStore = useTestStore('renderCounts');
  const _renderCounts = useStoreValue(renderCountsStore);
  const { resetRenderCounts } = useTestActions();

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">
          🎯 useRefMountState Context-Layered Test
        </h1>
        <p className="text-gray-600 mb-2">
          Context-Layered Architecture로 구현된 useRefMountState 테스트
        </p>
        <div className="inline-block px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>아키텍처:</strong> contexts/ → handlers/ → actions/ → views/
          </p>
        </div>
      </div>

      {/* 상태 모니터링 섹션 */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">📊 실시간 상태 모니터링</h2>
          <button
            onClick={resetRenderCounts}
            className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            렌더 카운트 리셋
          </button>
        </div>
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
        <h3 className="text-lg font-bold mb-3">
          🏗️ Context-Layered Architecture
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h4 className="font-semibold text-green-700">✅ 레이어 구조</h4>
            <ul className="text-sm space-y-1 mt-2 text-green-600">
              <li>
                • <strong>contexts/:</strong> TestStoreProvider,
                TestActionProvider, TestRefsProvider
              </li>
              <li>
                • <strong>handlers/:</strong> UseRefMountStateHandlerRegistry
                (orchestration)
              </li>
              <li>
                • <strong>actions/:</strong> useTestActions (액션 디스패처)
              </li>
              <li>
                • <strong>views/:</strong> RefStateMonitor, DynamicMountTest 등
                + LogMonitor
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-blue-700">🎯 주요 기능</h4>
            <ul className="text-sm space-y-1 mt-2 text-blue-600">
              <li>• Store를 통한 중앙화된 상태 관리</li>
              <li>• Action 기반 비즈니스 로직 분리</li>
              <li>• 실시간 렌더 카운트 추적</li>
              <li>• LogMonitor 통합 이벤트 로깅</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export function UseRefMountStateTestPage() {
  // 소스 파일 등록
  useRegisterSourceFile('pages/patterns/refs/UseRefMountStateTestPage.tsx', {
    name: 'UseRefMountStateTestPage (Context-Layered)',
    description:
      'Context-Layered Architecture로 구현된 useRefMountState 테스트 페이지',
    tags: ['context-layered', 'useRefMountState', 'test', 'architecture'],
    priority: 8,
  });

  return (
    <PageWithLogMonitor
      pageId="use-ref-mount-state-test"
      title="useRefMountState Test Page (Context-Layered)"
      initialConfig={{ enableToast: true, maxLogs: 50 }}
    >
      <TestActionProvider>
        <TestStoreProvider>
          <TestRefsProvider>
            <UseRefMountStateHandlerRegistry>
              <div className="page-container">
                <UseRefMountStateContent />
              </div>
            </UseRefMountStateHandlerRegistry>
          </TestRefsProvider>
        </TestStoreProvider>
      </TestActionProvider>
    </PageWithLogMonitor>
  );
}

export default UseRefMountStateTestPage;
