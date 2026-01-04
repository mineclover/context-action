import type React from 'react';
import { cn } from '../../lib/utils';

export type StatusProps = React.HTMLAttributes<HTMLDivElement> & {
  status?: 'safe' | 'warning' | 'danger' | 'info' | 'neutral';
  icon?: React.ReactNode;
};

// Direct Tailwind classes for maximum reusability
const statusVariants = {
  base: 'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium',
  statuses: {
    safe: 'bg-success-50 text-success-700 border border-success-200',
    warning: 'bg-warning-50 text-warning-700 border border-warning-200',
    danger: 'bg-danger-50 text-danger-700 border border-danger-200',
    info: 'bg-primary-50 text-primary-700 border border-primary-200',
    neutral: 'bg-gray-50 text-gray-700 border border-gray-200',
  },
};

export function Status({
  className,
  status = 'neutral',
  icon,
  children,
  ...props
}: StatusProps) {
  const classes = [
    statusVariants.base,
    statusVariants.statuses[status],
  ].filter(Boolean).join(' ');

  return (
    <div className={cn(classes, className)} {...props}>
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </div>
  );
}
