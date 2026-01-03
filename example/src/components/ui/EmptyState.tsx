/**
 * @fileoverview EmptyState Component
 * 빈 상태 표시용 재사용 가능한 컴포넌트
 */

import type React from 'react';
import { css } from '../../../styled-system/css';
import { cn } from '../../lib/utils';

// ================================
// Styles
// ================================

const styles = {
  container: css({
    textAlign: 'center',
    color: 'gray.400',
    py: '8',
  }),
  icon: css({
    mb: '2',
    fontSize: '4xl',
  }),
  text: css({
    fontSize: 'lg',
    mb: '2',
  }),
  hint: css({
    fontSize: 'sm',
    color: 'gray.500',
  }),
};

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
    <div className={cn(styles.container, className)}>
      <div className={styles.icon}>{icon}</div>
      <div className={styles.text}>{text}</div>
      {hint && <div className={styles.hint}>{hint}</div>}
      {children}
    </div>
  );
}

export default EmptyState;
