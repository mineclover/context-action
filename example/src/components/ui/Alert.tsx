/**
 * Alert Component
 * 알림/경고 메시지 표시용 컴포넌트
 */

import type React from 'react';
import { cn } from '../../lib/utils';
import { alertVariants, type AlertVariants } from './variants';

export type AlertProps = React.HTMLAttributes<HTMLDivElement> & AlertVariants & {
  title?: string;
  children: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
};

export function Alert({
  variant = 'info',
  size = 'md',
  title,
  children,
  dismissible = false,
  onDismiss,
  className,
  ...props
}: AlertProps) {
  const iconMap = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
  } as const;

  return (
    <div
      className={cn(alertVariants({ variant, size }), className)}
      role="alert"
      {...props}
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <span className="text-lg">{iconMap[variant]}</span>
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className="text-sm font-medium mb-1">
              {title}
            </h3>
          )}
          <div className="text-sm">
            {children}
          </div>
        </div>
        {dismissible && onDismiss && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                className="inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 opacity-60 hover:opacity-100"
                onClick={onDismiss}
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Convenience components
export function AlertInfo(props: Omit<AlertProps, 'variant'>) {
  return <Alert variant="info" {...props} />;
}

export function AlertSuccess(props: Omit<AlertProps, 'variant'>) {
  return <Alert variant="success" {...props} />;
}

export function AlertWarning(props: Omit<AlertProps, 'variant'>) {
  return <Alert variant="warning" {...props} />;
}

export function AlertError(props: Omit<AlertProps, 'variant'>) {
  return <Alert variant="error" {...props} />;
}

export default Alert;