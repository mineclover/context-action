import type React from 'react';
import { cn } from '../../lib/utils';

type DemoCardProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: 'default' | 'info' | 'logger' | 'monitor' | 'compact';
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
};

// Direct Tailwind classes for maximum reusability
const demoCardVariants = {
  base: 'bg-white rounded-lg border border-gray-200 shadow-sm',
  variants: {
    default: '',
    info: 'bg-blue-50',
    logger: 'relative',
    monitor: 'bg-gray-50',
    compact: '',
  },
  spacings: {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  },
};

export function DemoCard({
  variant = 'default',
  spacing = 'md',
  className,
  children,
  ...props
}: DemoCardProps) {
  const classes = [
    demoCardVariants.base,
    demoCardVariants.variants[variant],
    demoCardVariants.spacings[spacing],
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cn(classes, className)} {...props}>
      {children}
    </div>
  );
}
