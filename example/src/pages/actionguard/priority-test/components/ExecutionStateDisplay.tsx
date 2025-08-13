import { useStoreValue } from '@context-action/react';
import type React from 'react';
import { usePriorityTestStore } from '../context/ActionTestContext';

interface ExecutionStateDisplayProps {
  className?: string;
  showDetails?: boolean;
}

export const ExecutionStateDisplay: React.FC<ExecutionStateDisplayProps> = ({
  className = '',
  showDetails = true,
}) => {
  const executionStateStore = usePriorityTestStore('executionState');
  const executionState = useStoreValue(executionStateStore);

  const successRate =
    executionState.totalTests > 0
      ? (
          (executionState.successfulTests / executionState.totalTests) *
          100
        ).toFixed(1)
      : '0.0';

  return (
    <div className={`execution-state-display ${className}`}>
      <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-gray-700">
            📊 실행 통계
          </span>
          <span className="text-sm font-medium text-indigo-600">
            테스트 ID: {executionState.currentTestId || 'None'}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <StatCard
            label="✅ 성공"
            value={executionState.successfulTests}
            colorClass="green"
          />
          <StatCard
            label="❌ 실패"
            value={executionState.failedTests}
            colorClass="red"
          />
          <StatCard
            label="⛔ 중단"
            value={executionState.abortedTests}
            colorClass="orange"
          />
          <StatCard
            label="📈 총 테스트"
            value={executionState.totalTests}
            colorClass="blue"
          />
        </div>

        {showDetails && executionState.totalTests > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 text-xs">
            <StatCard
              label="⚡ 평균 시간"
              value={`${executionState.averageExecutionTime}ms`}
              colorClass="purple"
            />
            <StatCard
              label="🚀 최대 시간"
              value={`${executionState.maxExecutionTime}ms`}
              colorClass="teal"
            />
            <StatCard
              label="⚡ 최소 시간"
              value={`${executionState.minExecutionTime === Number.MAX_VALUE ? 0 : executionState.minExecutionTime}ms`}
              colorClass="cyan"
            />
          </div>
        )}

        {executionState.totalTests > 0 && (
          <div className="mt-2 text-xs text-gray-600">
            성공률: {successRate}%
            {executionState.isRunning && (
              <span className="ml-2 text-blue-600 font-medium">
                ⏳ 실행 중...
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// 개별 통계 카드 컴포넌트
interface StatCardProps {
  label: string;
  value: string | number;
  colorClass: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, colorClass }) => {
  return (
    <div className="bg-white p-2 rounded shadow-sm">
      <div className={`text-${colorClass}-600 font-semibold`}>{label}</div>
      <div className={`text-lg font-bold text-${colorClass}-700`}>{value}</div>
    </div>
  );
};
