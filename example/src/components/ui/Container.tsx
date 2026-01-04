import type React from 'react';
import { cn } from '../../lib/utils';

export type ContainerProps = React.HTMLAttributes<HTMLDivElement> & {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  centered?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
};

// Direct Tailwind classes for maximum reusability
const containerVariants = {
  base: 'w-full max-w-none',
  sizes: {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-8xl',
    full: 'max-w-none',
  },
  centered: 'mx-auto',
  paddings: {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-12',
  },
};

export function Container({
  className,
  size = 'lg',
  centered = true,
  padding = 'md',
  children,
  ...props
}: ContainerProps) {
  const classes = [
    containerVariants.base,
    containerVariants.sizes[size],
    centered ? containerVariants.centered : '',
    containerVariants.paddings[padding],
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cn(classes, className)}
      {...props}
    >
      {children}
    </div>
  );
}
