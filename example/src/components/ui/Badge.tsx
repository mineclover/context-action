import type React from 'react';
import { cn } from '../../lib/utils';

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?:
    | 'default'
    | 'primary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'outline';
};

// Direct Tailwind classes for maximum reusability
const badgeVariants = {
  base: 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
  variants: {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-primary-100 text-primary-800',
    success: 'bg-success-100 text-success-800',
    warning: 'bg-warning-100 text-warning-800',
    danger: 'bg-danger-100 text-danger-800',
    outline: 'border border-gray-300 text-gray-800',
  },
};

export function Badge({
  className,
  variant = 'default',
  children,
  ...props
}: BadgeProps) {
  const classes = [badgeVariants.base, badgeVariants.variants[variant]]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={cn(classes, className)} {...props}>
      {children}
    </span>
  );
}
