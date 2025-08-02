import React from 'react';
import { cn } from '../../lib/utils';
import { containerVariants, type ContainerVariants } from './variants';

export interface ContainerProps 
  extends React.HTMLAttributes<HTMLDivElement>, 
    ContainerVariants {}

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
      className={cn(containerVariants({ size, centered, padding }), className)} 
      {...props}
    >
      {children}
    </div>
  );
}