/**
 * MetricsDisplay Component
 * A component for displaying various metrics and performance data
 */

import { cn } from '../../lib/utils';

export interface Metric {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export interface MetricsDisplayProps {
  metrics: Metric[] | Record<string, string | number>;
  title?: string;
  className?: string;
  layout?: 'grid' | 'list';
}

export function MetricsDisplay({
  metrics,
  title,
  className,
  layout = 'grid'
}: MetricsDisplayProps) {
  const getTrendIcon = (trend?: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return <span className="text-green-500">↗</span>;
      case 'down':
        return <span className="text-red-500">↘</span>;
      case 'neutral':
        return <span className="text-gray-500">→</span>;
      default:
        return null;
    }
  };

  const layoutClasses = {
    grid: 'grid grid-cols-2 gap-4',
    list: 'space-y-2'
  };

  return (
    <div className={cn('p-4 bg-white rounded-lg shadow-sm', className)}>
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-gray-900">{title}</h3>
      )}
      <div className={layoutClasses[layout]}>
        {Array.isArray(metrics) ? metrics.map((metric, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{metric.label}:</span>
            <div className="flex items-center gap-1">
              <span className="font-medium">
                {metric.value}
                {metric.unit && (
                  <span className="text-gray-500 ml-1">{metric.unit}</span>
                )}
              </span>
              {getTrendIcon(metric.trend)}
            </div>
          </div>
        )) : metrics && typeof metrics === 'object' ? Object.entries(metrics).map(([key, value], index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{key}:</span>
            <span className="font-medium">{value}</span>
          </div>
        )) : (
          <div className="text-sm text-gray-500 text-center py-4">
            No metrics available
          </div>
        )}
      </div>
    </div>
  );
}