import type React from 'react';
import { cn } from '../../lib/utils';
import { type StatusVariants, statusVariants } from './variants';

export interface StatusProps
  extends React.HTMLAttributes<HTMLDivElement>,
    StatusVariants {
  icon?: React.ReactNode;
}

export function Status({
  className,
  status,
  icon,
  children,
  ...props
}: StatusProps) {
  return (
    <div className={cn(statusVariants({ status }), className)} {...props}>
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </div>
  );
}
