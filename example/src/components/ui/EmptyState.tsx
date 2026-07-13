/**
 * @fileoverview EmptyState Component
 * 빈 상태 표시용 재사용 가능한 컴포넌트
 */

import type React from 'react';
import { cn } from '../../lib/utils';
import {
  emptyStateHintVariants,
  emptyStateIconVariants,
  emptyStateTextVariants,
  emptyStateVariants,
} from './variants';

// ================================
// Types
// ================================

export interface EmptyStateProps {
  icon?: string;
  text: string;
  hint?: string;
  className?: string;
  children?: React.ReactNode;
}

// ================================
// Component
// ================================

export function EmptyState({
  icon = '📋',
  text,
  hint,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div className={cn(emptyStateVariants(), className)}>
      <div className={cn(emptyStateIconVariants())}>{icon}</div>
      <div className={cn(emptyStateTextVariants())}>{text}</div>
      {hint && <div className={cn(emptyStateHintVariants())}>{hint}</div>}
      {children}
    </div>
  );
}

export default EmptyState;
