import React from 'react';
import { cn } from '../../lib/utils';
import { inputRecipe, type InputRecipeProps } from './recipes';

export type InputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'size'
> &
  InputRecipeProps & {
    label?: string;
    error?: string;
    helper?: string;
  };

export function Input({
  className,
  variant,
  size,
  label,
  error,
  helper,
  id,
  ...props
}: InputProps) {
  const generatedId = React.useId();
  const inputId = id || generatedId;
  const errorVariant = error ? 'error' : variant;

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
      <input
        id={inputId}
        className={cn(inputRecipe({ variant: errorVariant, size }), className)}
        {...props}
      />
      {error && <p className="text-sm text-danger-600">{error}</p>}
      {helper && !error && <p className="text-sm text-gray-500">{helper}</p>}
    </div>
  );
}

export type TextareaProps = Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  'size'
> &
  InputRecipeProps & {
    label?: string;
    error?: string;
    helper?: string;
  };

export function Textarea({
  className,
  variant,
  size,
  label,
  error,
  helper,
  id,
  ...props
}: TextareaProps) {
  const generatedId = React.useId();
  const textareaId = id || generatedId;
  const errorVariant = error ? 'error' : variant;

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
      <textarea
        id={textareaId}
        className={cn(
          inputRecipe({ variant: errorVariant, size }),
          'min-h-[80px]',
          className
        )}
        {...props}
      />
      {error && <p className="text-sm text-danger-600">{error}</p>}
      {helper && !error && <p className="text-sm text-gray-500">{helper}</p>}
    </div>
  );
}
