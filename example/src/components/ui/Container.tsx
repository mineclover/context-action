import type React from 'react';
import { cn } from '../../lib/utils';
import { containerRecipe, type ContainerRecipeProps } from './recipes';

export type ContainerProps = React.HTMLAttributes<HTMLDivElement> &
  ContainerRecipeProps;

export function Container({
  className,
  size,
  centered,
  padding,
  children,
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn(containerRecipe({ size, centered, padding }), className)}
      {...props}
    >
      {children}
    </div>
  );
}
