import type React from 'react';
import { cn } from '../../lib/utils';
import { badgeRecipe, type BadgeRecipeProps } from './recipes';

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> &
  BadgeRecipeProps;

export function Badge({ className, variant, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeRecipe({ variant }), className)} {...props}>
      {children}
    </span>
  );
}
