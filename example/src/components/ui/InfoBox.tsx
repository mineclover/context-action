/**
 * @fileoverview InfoBox Component
 * 정보/경고/성공/에러 메시지 표시용 컴포넌트
 */

import type React from 'react';
import { cn } from '../../lib/utils';
import { infoBoxVariants } from './variants';

// ================================
// Types
// ================================

export type InfoBoxVariant = 'info' | 'success' | 'warning' | 'error';

export interface InfoBoxProps {
  variant?: InfoBoxVariant;
  size?: 'sm' | 'md' | 'lg';
  title?: string;
  children: React.ReactNode;
  className?: string;
}

// ================================
// Component
// ================================

export function InfoBox({
  variant = 'info',
  size = 'md',
  title,
  children,
  className,
}: InfoBoxProps) {
  const titleColorClasses = {
    info: 'text-blue-800',
    success: 'text-green-800',
    warning: 'text-yellow-800',
    error: 'text-red-800',
  };

  return (
    <div className={cn(infoBoxVariants({ variant, size }), className)}>
      {title && (
        <div className={cn('font-medium mb-2', titleColorClasses[variant])}>
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

// ================================
// Convenience Components
// ================================

export function InfoBoxInfo(props: Omit<InfoBoxProps, 'variant'>) {
  return <InfoBox variant="info" {...props} />;
}

export function InfoBoxSuccess(props: Omit<InfoBoxProps, 'variant'>) {
  return <InfoBox variant="success" {...props} />;
}

export function InfoBoxWarning(props: Omit<InfoBoxProps, 'variant'>) {
  return <InfoBox variant="warning" {...props} />;
}

export function InfoBoxError(props: Omit<InfoBoxProps, 'variant'>) {
  return <InfoBox variant="error" {...props} />;
}

export default InfoBox;
