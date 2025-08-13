/**
 * @fileoverview 테스트 메트릭 표시 컴포넌트들
 *
 * PriorityTestInstance에서 분리한 개별 메트릭 표시 컴포넌트들
 * 각각 독립적으로 상태를 구독하여 불필요한 리렌더링 방지
 */

import { useStoreValue } from '@context-action/react';
import { memo } from 'react';
import { usePriorityTestStore } from '../context/ActionTestContext';

/**
 * 총 실행 횟수 표시
 */
export const TotalExecutionCount = memo(() => {
  const executionStateStore = usePriorityTestStore('executionState');
  const executionState = useStoreValue(executionStateStore);
  return <>{executionState.totalTests}</>;
});

/**
 * 성공률 표시
 */
export const SuccessRate = memo(() => {
  const executionStateStore = usePriorityTestStore('executionState');
  const executionState = useStoreValue(executionStateStore);

  const successRate =
    executionState.totalTests > 0
      ? `${((executionState.successfulTests / executionState.totalTests) * 100).toFixed(1)}%`
      : '0.0%';

  return <>{successRate}</>;
});

/**
 * 평균 실행 시간 표시
 */
export const AverageExecutionTime = memo(() => {
  const executionStateStore = usePriorityTestStore('executionState');
  const executionState = useStoreValue(executionStateStore);
  return <>{executionState.averageExecutionTime || 0}ms</>;
});

/**
 * 최소/최대 실행 시간 범위 표시
 */
export const MinMaxExecutionTime = memo(() => {
  const executionStateStore = usePriorityTestStore('executionState');
  const executionState = useStoreValue(executionStateStore);

  const minTime =
    executionState.minExecutionTime === Number.MAX_VALUE
      ? 0
      : executionState.minExecutionTime;

  return (
    <div className="flex flex-col text-sm">
      <div>{minTime}ms</div>
      <div className="text-xs text-gray-500">~</div>
      <div>{executionState.maxExecutionTime || 0}ms</div>
    </div>
  );
});

/**
 * 현재 실행 중 상태 표시
 */
export const RunningStatus = memo(() => {
  const executionStateStore = usePriorityTestStore('executionState');
  const executionState = useStoreValue(executionStateStore);

  if (!executionState.isRunning) return null;

  return (
    <div className="flex items-center gap-2 text-blue-600">
      <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
      <span className="text-sm font-medium">실행 중...</span>
    </div>
  );
});

/**
 * 테스트 ID 표시
 */
export const CurrentTestId = memo(() => {
  const executionStateStore = usePriorityTestStore('executionState');
  const executionState = useStoreValue(executionStateStore);

  return (
    <span className="text-xs text-gray-500 font-mono">
      {executionState.currentTestId || 'None'}
    </span>
  );
});

/**
 * 실행 통계 카드 컴포넌트
 */
interface MetricCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  colorClass?: string;
}

export const MetricCard = memo<MetricCardProps>(
  ({ title, children, className = '', colorClass = 'blue' }) => {
    return (
      <div
        className={`bg-white rounded-lg p-4 shadow-sm border flex-1 min-h-[80px] ${className}`}
      >
        <div
          className={`text-xs text-${colorClass}-600 font-medium mb-2 whitespace-nowrap`}
        >
          {title}
        </div>
        <div
          className={`text-base font-bold text-${colorClass}-700 leading-tight`}
        >
          {children}
        </div>
      </div>
    );
  }
);

/**
 * 메트릭 대시보드 - 모든 메트릭을 한번에 표시
 */
export const MetricsDashboard = memo(() => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 p-4 bg-gray-50 rounded-lg">
      <MetricCard title="총 실행" colorClass="blue">
        <TotalExecutionCount />
      </MetricCard>

      <MetricCard title="성공률" colorClass="green">
        <SuccessRate />
      </MetricCard>

      <MetricCard title="평균 시간" colorClass="purple">
        <AverageExecutionTime />
      </MetricCard>

      <MetricCard title="시간 범위" colorClass="orange">
        <MinMaxExecutionTime />
      </MetricCard>

      <MetricCard title="상태" colorClass="gray">
        <div className="flex flex-col gap-1">
          <CurrentTestId />
          <RunningStatus />
        </div>
      </MetricCard>
    </div>
  );
});
