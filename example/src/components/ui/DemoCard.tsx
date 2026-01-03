import type React from 'react';
import { cn } from '../../lib/utils';
import { demoCardRecipe, type DemoCardRecipeProps } from './recipes';

type DemoCardProps = React.HTMLAttributes<HTMLDivElement> &
  DemoCardRecipeProps & {
    children: React.ReactNode;
  };

export function DemoCard({
  variant,
  spacing,
  className,
  children,
  ...props
}: DemoCardProps) {
  return (
    <div
      className={cn(demoCardRecipe({ variant, spacing }), className)}
      {...props}
    >
      {children}
    </div>
  );
}
