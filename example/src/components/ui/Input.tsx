import React from 'react';
import { cn } from '../../lib/utils';
import { inputVariants, type InputVariants } from './variants';

export interface InputProps 
  extends React.InputHTMLAttributes<HTMLInputElement>, 
    InputVariants {
  label?: string;
  error?: string;
  helper?: string;
}

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
  const inputId = id || React.useId();
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
        className={cn(inputVariants({ variant: errorVariant, size }), className)} 
        {...props}
      />
      {error && (
        <p className="text-sm text-danger-600">{error}</p>
      )}
      {helper && !error && (
        <p className="text-sm text-gray-500">{helper}</p>
      )}
    </div>
  );
}

export interface TextareaProps 
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>, 
    InputVariants {
  label?: string;
  error?: string;
  helper?: string;
}

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
  const textareaId = id || React.useId();
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
        className={cn(inputVariants({ variant: errorVariant, size }), "min-h-[80px]", className)} 
        {...props}
      />
      {error && (
        <p className="text-sm text-danger-600">{error}</p>
      )}
      {helper && !error && (
        <p className="text-sm text-gray-500">{helper}</p>
      )}
    </div>
  );
}