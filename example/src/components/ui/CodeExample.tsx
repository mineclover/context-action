import type React from 'react';
import { cn } from '../../lib/utils';
import {
  type CodeBlockVariants,
  type CodeExampleVariants,
  codeBlockVariants,
  codeExampleVariants,
} from './variants';

interface CodeExampleProps
  extends React.HTMLAttributes<HTMLDivElement>,
    CodeExampleVariants {
  title?: string;
  children: React.ReactNode;
}

interface CodeBlockProps
  extends React.HTMLAttributes<HTMLPreElement>,
    CodeBlockVariants {
  children: React.ReactNode;
}

export function CodeExample({
  size,
  title,
  className,
  children,
  ...props
}: CodeExampleProps) {
  return (
    <div className={cn(codeExampleVariants({ size }), className)} {...props}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      {children}
    </div>
  );
}

export function CodeBlock({
  size,
  className,
  children,
  ...props
}: CodeBlockProps) {
  return (
    <pre className={cn(codeBlockVariants({ size }), className)} {...props}>
      {children}
    </pre>
  );
}
