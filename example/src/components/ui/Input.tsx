import React from 'react';
import { cn } from '../../lib/utils';

export type InputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'size'
> & {
  variant?: 'default' | 'error' | 'success';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  error?: string;
  helper?: string;
};

// Direct Tailwind classes for maximum reusability
const inputVariants = {
  base: 'block w-full rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
  variants: {
    default: 'border-gray-300 focus:border-primary-500 focus:ring-primary-500',
    error: 'border-danger-300 focus:border-danger-500 focus:ring-danger-500',
    success:
      'border-success-300 focus:border-success-500 focus:ring-success-500',
  },
  sizes: {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-4 py-3 text-base',
  },
};

export function Input({
  className,
  variant = 'default',
  size = 'md',
  label,
  error,
  helper,
  id,
  ...props
}: InputProps) {
  const generatedId = React.useId();
  const inputId = id || generatedId;
  const errorVariant = error ? 'error' : variant;

  const classes = [
    inputVariants.base,
    inputVariants.variants[errorVariant],
    inputVariants.sizes[size],
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}
      <input id={inputId} className={cn(classes, className)} {...props} />
      {error && <p className="text-sm text-danger-600">{error}</p>}
      {helper && !error && <p className="text-sm text-gray-500">{helper}</p>}
    </div>
  );
}

export type TextareaProps = Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  'size'
> & {
  variant?: 'default' | 'error' | 'success';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  error?: string;
  helper?: string;
};

export function Textarea({
  className,
  variant = 'default',
  size = 'md',
  label,
  error,
  helper,
  id,
  ...props
}: TextareaProps) {
  const generatedId = React.useId();
  const textareaId = id || generatedId;
  const errorVariant = error ? 'error' : variant;

  const classes = [
    inputVariants.base,
    inputVariants.variants[errorVariant],
    inputVariants.sizes[size],
    'min-h-[80px]',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}
      <textarea id={textareaId} className={cn(classes, className)} {...props} />
      {error && <p className="text-sm text-danger-600">{error}</p>}
      {helper && !error && <p className="text-sm text-gray-500">{helper}</p>}
    </div>
  );
}
