import type React from 'react';
import { cn } from '../../lib/utils';
import { gridRecipe, type GridRecipeProps } from './recipes';

export type GridProps = React.HTMLAttributes<HTMLDivElement> &
  GridRecipeProps;

export function Grid({ className, cols, gap, children, ...props }: GridProps) {
  return (
    <div className={cn(gridRecipe({ cols, gap }), className)} {...props}>
      {children}
    </div>
  );
}
