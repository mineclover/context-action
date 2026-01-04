import type React from 'react';
import { cn } from '../../lib/utils';

export type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: 'default' | 'elevated' | 'outlined' | 'bordered';
  size?: 'sm' | 'md' | 'lg';
  hover?: boolean;
  category?: 'core' | 'store' | 'pipeline' | 'react' | 'logger' | 'actionguard' | 'conditional' | 'examples' | 'refs' | 'demos' | 'performance' | 'utilities' | 'debug' | 'default';
};

// Direct Tailwind classes with CSS custom properties for maximum reusability
const cardVariants = {
  base: 'bg-white border border-gray-200 rounded-lg transition-all duration-200',
  variants: {
    default: 'shadow-sm',
    elevated: 'shadow-lg',
    outlined: 'shadow-none',
    bordered: 'border-2 shadow-none',
  },
  sizes: {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  },
  hovers: {
    true: 'hover:shadow-lg hover:-translate-y-1',
    false: '',
  },
  categories: {
    core: 'border-l-4 border-l-red-500',
    store: 'border-l-4 border-l-green-600',
    pipeline: 'border-l-4 border-l-orange-500',
    react: 'border-l-4 border-l-purple-600',
    logger: 'border-l-4 border-l-yellow-600',
    actionguard: 'border-l-4 border-l-pink-600',
    conditional: 'border-l-4 border-l-cyan-600',
    examples: 'border-l-4 border-l-orange-600',
    refs: 'border-l-4 border-l-blue-600',
    demos: 'border-l-4 border-l-emerald-600',
    performance: 'border-l-4 border-l-red-600',
    utilities: 'border-l-4 border-l-teal-600',
    debug: 'border-l-4 border-l-indigo-600',
    default: '',
  },
};

export function Card({
  className,
  variant = 'default',
  size = 'md',
  hover = false,
  category = 'default',
  children,
  ...props
}: CardProps) {
  const classes = [
    cardVariants.base,
    cardVariants.variants[variant],
    cardVariants.sizes[size],
    hover ? cardVariants.hovers.true : cardVariants.hovers.false,
    cardVariants.categories[category],
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

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-lg font-semibold text-gray-900 mb-2', className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-sm text-gray-600', className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('mt-4 pt-4 border-t border-gray-200', className)}
      {...props}
    >
      {children}
    </div>
  );
}
