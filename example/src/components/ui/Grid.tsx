import type React from 'react';
import { cn } from '../../lib/utils';
import { type GridRecipeProps } from './recipes';

export type GridProps = React.HTMLAttributes<HTMLDivElement> &
  GridRecipeProps;

// Temporary gridRecipe replacement - convert to direct Tailwind classes
function gridRecipe({ cols = 'auto', gap = 'md' }: GridRecipeProps = {}) {
  const baseClasses = 'grid gap-6';

  const colsClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    auto: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6',
  };

  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
  };

  return `${baseClasses} ${colsClasses[cols]} ${gapClasses[gap]}`;
}

export function Grid({ className, cols, gap, children, ...props }: GridProps) {
  return (
    <div className={cn(gridRecipe({ cols, gap }), className)} {...props}>
      {children}
    </div>
  );
}
