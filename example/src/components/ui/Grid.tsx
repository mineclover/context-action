import type React from 'react';
import { cn } from '../../lib/utils';

export type GridProps = React.HTMLAttributes<HTMLDivElement> & {
  cols?: 1 | 2 | 3 | 4 | 'auto';
  gap?: 'sm' | 'md' | 'lg';
};

// Direct Tailwind classes with maximum reusability
const gridVariants = {
  base: 'grid gap-6',
  cols: {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    auto: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6',
  },
  gaps: {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
  },
};

export function Grid({
  className,
  cols = 'auto',
  gap = 'md',
  children,
  ...props
}: GridProps) {
  const classes = [
    gridVariants.base,
    gridVariants.cols[cols],
    gridVariants.gaps[gap],
  ].filter(Boolean).join(' ');

  return (
    <div className={cn(classes, className)} {...props}>
      {children}
    </div>
  );
}
