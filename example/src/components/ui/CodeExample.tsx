import type React from 'react';
import { cn } from '../../lib/utils';
import {
  codeBlockRecipe,
  codeExampleRecipe,
  type CodeBlockRecipeProps,
  type CodeExampleRecipeProps,
} from './recipes';

type CodeExampleProps = React.HTMLAttributes<HTMLDivElement> &
  CodeExampleRecipeProps & {
    title?: string;
    children: React.ReactNode;
  };

type CodeBlockProps = React.HTMLAttributes<HTMLPreElement> &
  CodeBlockRecipeProps & {
    children: React.ReactNode;
  };

export function CodeExample({
  size,
  title,
  className,
  children,
  ...props
}: CodeExampleProps) {
  return (
    <div className={cn(codeExampleRecipe({ size }), className)} {...props}>
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
    <pre className={cn(codeBlockRecipe({ size }), className)} {...props}>
      {children}
    </pre>
  );
}
