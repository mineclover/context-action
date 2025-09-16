/**
 * @fileoverview Test Metrics View Component
 *
 * Context-Driven Architecture의 View Layer
 * 순수 UI 컴포넌트로 테스트 메트릭을 렌더링합니다.
 */

import { memo } from 'react';
import { usePriorityTestState } from '../hooks/usePriorityTestState';

interface MetricCardProps {
  title: string;
  children: React.ReactNode;
}

const MetricCard = memo<MetricCardProps>(function MetricCard({ title, children }) {
  return (
    <div className="flex flex-col items-center p-2 bg-white rounded border border-gray-200 min-w-fit">
      <div className="text-xs text-gray-600 mb-1 whitespace-nowrap">{title}</div>
      <div className="text-sm font-semibold text-gray-900">{children}</div>
    </div>
  );
});

const TotalExecutionCount = memo(function TotalExecutionCount() {
  const { totalTests } = usePriorityTestState();
  return <span>{totalTests}</span>;
});

const SuccessRate = memo(function SuccessRate() {
  const { successRate } = usePriorityTestState();
  return <span>{successRate}%</span>;
});

const AverageExecutionTime = memo(function AverageExecutionTime() {
  const { averageExecutionTime } = usePriorityTestState();
  return <span>{averageExecutionTime}ms</span>;
});

const MinMaxExecutionTime = memo(function MinMaxExecutionTime() {
  const { minExecutionTime, maxExecutionTime } = usePriorityTestState();
  return <span>{minExecutionTime}-{maxExecutionTime}ms</span>;
});

interface TestMetricsViewProps {
  isRunning: boolean;
}

/**
 * 테스트 메트릭 표시 컴포넌트
 *
 * 성능 테스트 결과와 통계를 시각적으로 표시합니다.
 */
export const TestMetricsView = memo<TestMetricsViewProps>(
  function TestMetricsView({ isRunning }) {
    return (
      <div className="mb-4">
        <h4 className="font-medium text-gray-700 mb-2 text-sm">📊 성능 메트릭</h4>
        <div className="flex flex-wrap gap-3">
          <MetricCard title="총 실행">
            <TotalExecutionCount />
          </MetricCard>
          <MetricCard title="상태">
            <div className="text-sm font-semibold whitespace-nowrap">
              {isRunning ? '실행 중' : '대기 중'}
            </div>
          </MetricCard>
          <MetricCard title="성공률">
            <SuccessRate />
          </MetricCard>
          <MetricCard title="평균 시간">
            <AverageExecutionTime />
          </MetricCard>
          <MetricCard title="최소-최대">
            <MinMaxExecutionTime />
          </MetricCard>
        </div>
      </div>
    );
  }
);