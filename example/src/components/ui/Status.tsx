import type React from 'react';
import { cn } from '../../lib/utils';
import { statusRecipe, type StatusRecipeProps } from './recipes';

export type StatusProps = React.HTMLAttributes<HTMLDivElement> &
  StatusRecipeProps & {
    icon?: React.ReactNode;
  };

export function Status({
  className,
  status,
  icon,
  children,
  ...props
}: StatusProps) {
  return (
    <div className={cn(statusRecipe({ status }), className)} {...props}>
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </div>
  );
}
