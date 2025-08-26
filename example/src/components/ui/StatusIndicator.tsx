/**
 * StatusIndicator Component
 * A simple status indicator component for showing various states
 */

import React from 'react';
import { cn } from '../../lib/utils';

export interface StatusIndicatorProps {
  status: 'success' | 'error' | 'warning' | 'info' | 'loading';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StatusIndicator({
  status,
  size = 'md',
  className
}: StatusIndicatorProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3', 
    lg: 'w-4 h-4'
  };

  const statusClasses = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
    loading: 'bg-gray-400 animate-pulse'
  };

  return (
    <div
      className={cn(
        'rounded-full inline-block',
        sizeClasses[size],
        statusClasses[status],
        className
      )}
    />
  );
}