import type React from 'react';
import { cn } from '../../lib/utils';

type CodeExampleProps = React.HTMLAttributes<HTMLDivElement> & {
  size?: 'sm' | 'md' | 'lg';
  title?: string;
  children: React.ReactNode;
};

type CodeBlockProps = React.HTMLAttributes<HTMLPreElement> & {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
};

// Direct Tailwind classes for maximum reusability
const codeExampleVariants = {
  base: 'mt-8 bg-white rounded-lg border border-gray-200 shadow-sm',
  sizes: {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  },
};

const codeBlockVariants = {
  base: 'bg-gray-900 text-gray-100 rounded-lg overflow-x-auto font-mono line-height-relaxed max-w-full w-full',
  sizes: {
    xs: 'p-2 text-xs',
    sm: 'p-3 text-sm',
    md: 'p-4 text-sm',
    lg: 'p-6 text-base',
  },
};

export function CodeExample({
  size = 'md',
  title,
  className,
  children,
  ...props
}: CodeExampleProps) {
  const classes = [codeExampleVariants.base, codeExampleVariants.sizes[size]]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cn(classes, className)} {...props}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      {children}
    </div>
  );
}

export function CodeBlock({
  size = 'md',
  className,
  children,
  ...props
}: CodeBlockProps) {
  const classes = [codeBlockVariants.base, codeBlockVariants.sizes[size]]
    .filter(Boolean)
    .join(' ');

  return (
    <pre className={cn(classes, className)} {...props}>
      {children}
    </pre>
  );
}
