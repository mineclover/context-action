/**
 * @fileoverview Throttle Comparison View Component - View Layer
 *
 * Hook을 통해 Data/Action과 연결되는 View 컴포넌트입니다.
 */

import React from 'react';
import {
  Button,
  CodeBlock,
  CodeExample,
  DemoCard,
  Input,
} from '../../../../components/ui';
import { useThrottleComparisonLogic } from '../hooks/useThrottleComparisonLogic';
import { ThrottleComparisonStyles } from './ThrottleComparisonStyles';

/**
 * 스로틀 비교 View 컴포넌트
 *
 * Hook Layer를 통해 데이터와 액션을 받아 UI를 렌더링합니다.
 */
export function ThrottleComparisonView() {
  const {
    throttleState,
    updateInputValue,
    updateTestDuration,
    updateTestInterval,
    handleManualCall,
    handleInternalCall,
    startAutoTest,
    stopAutoTest,
    resetMetrics,
    canOperate,
    manualExecutionRate,
    internalExecutionRate,
  } = useThrottleComparisonLogic();

  return (
    <div className="space-y-6">
      <ThrottleComparisonStyles />
      <header className="page-header">
        <h1>📊 Throttle Implementation Comparison</h1>
        <p className="page-description">
          Side-by-side comparison of manual <code>useThrottle</code> hook
          implementation versus Context-Action framework's built-in throttling
          feature. Both use
          <strong>1-second throttling intervals</strong> for direct performance
          comparison.
        </p>
        <div className="mt-3 text-sm text-gray-600">
          <strong>Test Features:</strong> Real-time metrics • Auto-test mode •
          Execution rate comparison • Performance analysis
        </div>
      </header>

      {/* 비교 메트릭 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DemoCard variant="info">
          <h3 className="text-lg font-semibold mb-4">
            📊 수동 Throttle (useThrottle 훅)
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="metric-item">
              <div className="metric-value">
                {throttleState.manualMetrics.totalCalls}
              </div>
              <div className="metric-label">총 호출</div>
            </div>
            <div className="metric-item">
              <div className="metric-value">
                {throttleState.manualMetrics.actualExecutions}
              </div>
              <div className="metric-label">실제 실행</div>
            </div>
            <div className="metric-item">
              <div className="metric-value">{manualExecutionRate}%</div>
              <div className="metric-label">실행율</div>
            </div>
            <div className="metric-item">
              <div className="metric-value">
                {throttleState.manualMetrics.averageInterval > 0
                  ? `${throttleState.manualMetrics.averageInterval}ms`
                  : '-'}
              </div>
              <div className="metric-label">평균 간격</div>
            </div>
          </div>
        </DemoCard>

        <DemoCard variant="info">
          <h3 className="text-lg font-semibold mb-4">
            ⚡ 내장 Throttle (ActionRegister 옵션)
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="metric-item">
              <div className="metric-value">
                {throttleState.internalMetrics.totalCalls}
              </div>
              <div className="metric-label">총 호출</div>
            </div>
            <div className="metric-item">
              <div className="metric-value">
                {throttleState.internalMetrics.actualExecutions}
              </div>
              <div className="metric-label">실제 실행</div>
            </div>
            <div className="metric-item">
              <div className="metric-value">{internalExecutionRate}%</div>
              <div className="metric-label">실행율</div>
            </div>
            <div className="metric-item">
              <div className="metric-value">
                {throttleState.internalMetrics.averageInterval > 0
                  ? `${throttleState.internalMetrics.averageInterval}ms`
                  : '-'}
              </div>
              <div className="metric-label">평균 간격</div>
            </div>
          </div>
        </DemoCard>
      </div>

      {/* 테스트 컨트롤 */}
      <DemoCard>
        <h3 className="text-lg font-semibold mb-4">🎮 테스트 컨트롤</h3>

        {/* 입력값 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            테스트 값 (선택사항)
          </label>
          <Input
            type="text"
            value={throttleState.inputValue}
            onChange={(e) => updateInputValue(e.target.value)}
            placeholder="테스트할 값을 입력하세요..."
          />
        </div>

        {/* 수동 테스트 버튼 */}
        <div className="space-y-4">
          <div>
            <h4 className="text-md font-medium mb-2">수동 테스트</h4>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleManualCall}
                variant="secondary"
                disabled={!canOperate || throttleState.isAutoTesting}
              >
                📊 수동 Throttle 호출
              </Button>
              <Button
                onClick={handleInternalCall}
                variant="primary"
                disabled={!canOperate || throttleState.isAutoTesting}
              >
                ⚡ 내장 Throttle 호출
              </Button>
              <Button onClick={resetMetrics} variant="outline">
                🔄 메트릭 초기화
              </Button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              빠르게 여러 번 클릭하여 throttle 동작을 확인해보세요.
            </p>
          </div>

          {/* 자동 테스트 설정 */}
          <div>
            <h4 className="text-md font-medium mb-2">자동 테스트 설정</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  테스트 지속 시간 (ms)
                </label>
                <Input
                  type="number"
                  value={throttleState.testDuration}
                  onChange={(e) => updateTestDuration(Number(e.target.value))}
                  min="1000"
                  max="30000"
                  step="1000"
                  disabled={throttleState.isAutoTesting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  호출 간격 (ms)
                </label>
                <Input
                  type="number"
                  value={throttleState.testInterval}
                  onChange={(e) => updateTestInterval(Number(e.target.value))}
                  min="10"
                  max="1000"
                  step="10"
                  disabled={throttleState.isAutoTesting}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={
                  throttleState.isAutoTesting ? stopAutoTest : startAutoTest
                }
                variant={throttleState.isAutoTesting ? 'danger' : 'success'}
                disabled={!canOperate}
              >
                {throttleState.isAutoTesting
                  ? '⏹️ 테스트 중지'
                  : '▶️ 자동 테스트 시작'}
              </Button>
            </div>
            {throttleState.isAutoTesting && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm">
                <div className="flex items-center gap-2">
                  <div className="loading-spinner" />
                  <span>
                    자동 테스트 실행 중... ({throttleState.testInterval}ms
                    간격으로 {throttleState.testDuration}ms 동안)
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </DemoCard>

      {/* 구현 방식 비교 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DemoCard>
          <h3 className="text-lg font-semibold mb-4">
            🔧 수동 구현 (useThrottle)
          </h3>
          <CodeBlock>
            {`function useThrottle(callback, delay) {
  const lastCallRef = useRef(0);
  const timeoutRef = useRef();
  
  return useCallback((...args) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallRef.current;
    
    if (timeSinceLastCall >= delay) {
      lastCallRef.current = now;
      callback(...args);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        lastCallRef.current = Date.now();
        callback(...args);
      }, delay - timeSinceLastCall);
    }
  }, [callback, delay]);
};

// 사용법
const throttledHandler = useThrottle(handler, 1000);`}
          </CodeBlock>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-yellow-600">⚠️</span>
              <span>수동으로 타이머 관리 필요</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-600">ℹ️</span>
              <span>메모리 누수 위험 (cleanup 필요)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600">✅</span>
              <span>커스터마이징 가능</span>
            </div>
          </div>
        </DemoCard>

        <DemoCard>
          <h3 className="text-lg font-semibold mb-4">
            ⚡ 내장 구현 (ActionGuard)
          </h3>
          <CodeBlock>
            {`// ActionRegister 등록 시 옵션으로 설정
actionRegister.register('myAction', handler, {
  throttle: 1000  // 1초 throttle
});

// 또는 dispatch 시 옵션으로 설정
dispatch('myAction', payload, {
  throttle: 1000
});

// ActionGuard 클래스 내부 구현
throttle(actionKey: string, throttleMs: number): boolean {
  // ... 내부 상태 관리
  // ... 자동 메모리 정리
  // ... 최적화된 성능
  return shouldExecute;
}`}
          </CodeBlock>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-green-600">✅</span>
              <span>자동 메모리 관리</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600">✅</span>
              <span>프레임워크 통합</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600">✅</span>
              <span>성능 최적화</span>
            </div>
          </div>
        </DemoCard>
      </div>

      {/* 성능 분석 */}
      <DemoCard variant="info">
        <h3 className="text-lg font-semibold mb-4">📈 성능 분석</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="analysis-item">
            <h4 className="font-semibold text-gray-900 mb-2">메모리 사용량</h4>
            <div className="space-y-1 text-sm">
              <div>• 수동: 각 컴포넌트마다 ref 생성</div>
              <div>• 내장: 중앙 집중식 관리</div>
              <div className="text-green-600 font-medium">
                → 내장 방식이 메모리 효율적
              </div>
            </div>
          </div>
          <div className="analysis-item">
            <h4 className="font-semibold text-gray-900 mb-2">타이머 관리</h4>
            <div className="space-y-1 text-sm">
              <div>• 수동: 수동 cleanup 필요</div>
              <div>• 내장: 자동 cleanup</div>
              <div className="text-green-600 font-medium">
                → 내장 방식이 안전함
              </div>
            </div>
          </div>
          <div className="analysis-item">
            <h4 className="font-semibold text-gray-900 mb-2">사용 편의성</h4>
            <div className="space-y-1 text-sm">
              <div>• 수동: 별도 훅 구현/관리</div>
              <div>• 내장: 옵션만 설정</div>
              <div className="text-green-600 font-medium">
                → 내장 방식이 간편함
              </div>
            </div>
          </div>
        </div>
      </DemoCard>

      {/* 결론 */}
      <DemoCard variant="info">
        <h3 className="text-lg font-semibold mb-4">💡 결론 및 권장사항</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">
              Context-Action 내장 throttle을 권장하는 이유:
            </h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✅</span>
                <span>
                  <strong>자동 메모리 관리:</strong> 컴포넌트 언마운트 시
                  자동으로 타이머 정리
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✅</span>
                <span>
                  <strong>중앙 집중식 관리:</strong> ActionGuard 클래스에서 모든
                  throttle 상태 관리
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✅</span>
                <span>
                  <strong>프레임워크 통합:</strong> 액션 시스템과 완벽하게
                  통합됨
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✅</span>
                <span>
                  <strong>성능 최적화:</strong> 불필요한 타이머 생성 방지
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✅</span>
                <span>
                  <strong>사용 편의성:</strong> 단일 옵션으로 간단 설정
                </span>
              </li>
            </ul>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>💡 팁:</strong> 기존 수동 throttle 코드를 내장 throttle로
              마이그레이션하면 코드량 감소, 성능 향상, 메모리 누수 방지 등의
              이점을 얻을 수 있습니다.
            </p>
          </div>
        </div>
      </DemoCard>
    </div>
  );
}
