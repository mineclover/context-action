import React from 'react';
import { cn } from '../../lib/utils';
import { demoCardVariants, type DemoCardVariants } from './variants';

interface DemoCardProps extends React.HTMLAttributes<HTMLDivElement>, DemoCardVariants {
  children: React.ReactNode;
}

export function DemoCard({ 
  variant, 
  spacing, 
  className, 
  children, 
  ...props 
}: DemoCardProps) {
  return (
    <div 
      className={cn(demoCardVariants({ variant, spacing }), className)} 
      {...props}
    >
      {children}
    </div>
  );
}