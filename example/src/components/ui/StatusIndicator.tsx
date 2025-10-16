/**
 * StatusIndicator Component
 * A simple status indicator component for showing various states
 */

import { cn } from '../../lib/utils';

export interface StatusIndicatorProps {
  status: 'success' | 'error' | 'warning' | 'info' | 'loading' | 'idle';
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StatusIndicator({
  status,
  message,
  size = 'md',
  className,
}: StatusIndicatorProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const statusClasses = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
    loading: 'bg-gray-400 animate-pulse',
    idle: 'bg-gray-300',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn('rounded-full', sizeClasses[size], statusClasses[status])}
      />
      {message && <span className="text-sm font-medium">{message}</span>}
    </div>
  );
}
