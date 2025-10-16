import React from 'react';

interface MetricsDisplayProps {
  title: string;
  variant: 'memoized' | 'non-memoized';
  metrics: {
    counter: number;
    calcResult: number;
    renderCount: number;
    renderRate: number;
    renderRateStatus: 'normal' | 'warning' | 'danger' | 'critical';
  };
  dataStatus: {
    heavyData: {
      length: number;
      status: 'normal' | 'heavy' | 'blocked';
    };
    memoryData: {
      length: number;
      status: 'normal' | 'warning' | 'leak' | 'blocked';
    };
    processedResults: {
      length: number;
    };
  };
}

/**
 * Shared Component - 순수 UI 컴포넌트
 * 메트릭 정보를 시각적으로 표시하는 재사용 가능한 컴포넌트
 */
export function MetricsDisplay({
  title,
  variant,
  metrics,
  dataStatus,
}: MetricsDisplayProps) {
  const borderColor =
    variant === 'memoized' ? 'border-green-500' : 'border-red-500';
  const bgColor = variant === 'memoized' ? 'bg-green-50' : 'bg-red-50';
  const titleColor = variant === 'memoized' ? 'text-green-700' : 'text-red-700';

  return (
    <div className={`p-4 border-2 rounded-lg ${borderColor} ${bgColor}`}>
      <h3 className={`text-lg font-bold mb-2 ${titleColor}`}>
        {variant === 'memoized' ? '✅' : '❌'} {title}
      </h3>

      {/* Render Metrics */}
      <div className="mb-3 text-sm">
        <div className="flex justify-between">
          <span>Render Count:</span>
          <span className="font-mono font-bold">{metrics.renderCount}</span>
        </div>
        <div className="flex justify-between">
          <span>Render Rate:</span>
          <span
            className={`font-mono font-bold ${getRenderRateColor(metrics.renderRateStatus)}`}
          >
            {metrics.renderRate.toFixed(1)}/sec
          </span>
        </div>
      </div>

      {/* Data Status */}
      <div className="mb-3 p-2 bg-white rounded text-xs space-y-1">
        <div>Counter: {metrics.counter}</div>
        <div>Calc Result: {metrics.calcResult}</div>

        <div className={getHeavyDataColor(dataStatus.heavyData.status)}>
          Heavy Data: {dataStatus.heavyData.length} items
          {getHeavyDataIcon(dataStatus.heavyData.status)}
        </div>

        <div>Processed: {dataStatus.processedResults.length} results</div>

        <div className={getMemoryDataColor(dataStatus.memoryData.status)}>
          Memory Data: {dataStatus.memoryData.length} objects
          {getMemoryDataIcon(dataStatus.memoryData.status)}
        </div>
      </div>
    </div>
  );
}

// Helper functions for styling
function getRenderRateColor(
  status: 'normal' | 'warning' | 'danger' | 'critical'
) {
  switch (status) {
    case 'critical':
      return 'text-red-600';
    case 'danger':
      return 'text-red-500';
    case 'warning':
      return 'text-yellow-600';
    default:
      return 'text-green-600';
  }
}

function getHeavyDataColor(status: 'normal' | 'heavy' | 'blocked') {
  switch (status) {
    case 'blocked':
      return 'text-red-600 font-bold';
    case 'heavy':
      return 'text-yellow-600 font-bold';
    default:
      return '';
  }
}

function getHeavyDataIcon(status: 'normal' | 'heavy' | 'blocked') {
  switch (status) {
    case 'blocked':
      return ' 🚨 BLOCKED!';
    case 'heavy':
      return ' 🔥 HEAVY!';
    default:
      return '';
  }
}

function getMemoryDataColor(status: 'normal' | 'warning' | 'leak' | 'blocked') {
  switch (status) {
    case 'blocked':
      return 'text-red-600 font-bold';
    case 'leak':
      return 'text-red-600 font-bold';
    case 'warning':
      return 'text-yellow-600 font-bold';
    default:
      return '';
  }
}

function getMemoryDataIcon(status: 'normal' | 'warning' | 'leak' | 'blocked') {
  switch (status) {
    case 'blocked':
      return ' 🚨 BLOCKED!';
    case 'leak':
      return ' 🔥 LEAK!';
    case 'warning':
      return ' ⚠️ WARNING';
    default:
      return '';
  }
}
