import type React from 'react';
import { cn } from '../../lib/utils';
import { type GridVariants, gridVariants } from './variants';

export interface GridProps
  extends React.HTMLAttributes<HTMLDivElement>,
    GridVariants {}

export function Grid({ className, cols, gap, children, ...props }: GridProps) {
  return (
    <div className={cn(gridVariants({ cols, gap }), className)} {...props}>
      {children}
    </div>
  );
}
