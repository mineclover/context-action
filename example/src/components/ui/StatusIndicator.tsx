/**
 * StatusIndicator Component
 * A simple status indicator component for showing various states
 */

import { cn } from '../../lib/utils';
import { flexVariants } from './variants';

export interface StatusIndicatorProps {
  status: 'success' | 'error' | 'warning' | 'info' | 'loading' | 'idle';
  message?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function StatusIndicator({
  status,
  message,
  size = 'md',
  className,
}: StatusIndicatorProps) {
  const sizeClasses = {
    xs: 'w-2 h-2',
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6',
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
    <div className={cn(flexVariants({ align: 'center', gap: 'sm' }), className)}>
      <div
        className={cn('rounded-full', sizeClasses[size], statusClasses[status])}
      />
      {message && <span className="text-sm font-medium">{message}</span>}
    </div>
  );
}
