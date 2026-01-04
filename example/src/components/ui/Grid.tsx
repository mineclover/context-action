import type React from 'react';
import { cn } from '../../lib/utils';
import { gridRecipe, type GridRecipeProps } from './recipes';

export type GridProps = React.HTMLAttributes<HTMLDivElement> &
  GridRecipeProps;

export function Grid({ className, cols, gap, children, ...props }: GridProps) {
  // Use Panda CSS recipe for maximum style reusability
  const recipeClasses = gridRecipe({ cols, gap });

  return (
    <div className={cn(recipeClasses, className)} {...props}>
      {children}
    </div>
  );
}
