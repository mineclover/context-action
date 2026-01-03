/**
 * @fileoverview InfoBox Component
 * 정보/경고/성공/에러 메시지 표시용 컴포넌트
 */

import type React from 'react';
import { css } from '../../../styled-system/css';
import { cn } from '../../lib/utils';

// ================================
// Styles
// ================================

const baseStyle = css({
  p: '4',
  rounded: 'lg',
  border: '1px solid',
  fontSize: 'sm',
});

const variantStyles = {
  info: css({
    bg: 'blue.50',
    borderColor: 'blue.200',
    color: 'blue.800',
  }),
  success: css({
    bg: 'green.50',
    borderColor: 'green.200',
    color: 'green.800',
  }),
  warning: css({
    bg: 'yellow.50',
    borderColor: 'yellow.200',
    color: 'yellow.800',
  }),
  error: css({
    bg: 'red.50',
    borderColor: 'red.200',
    color: 'red.800',
  }),
};

const titleStyles = {
  info: css({ fontWeight: 'medium', color: 'blue.800', mb: '1' }),
  success: css({ fontWeight: 'medium', color: 'green.800', mb: '1' }),
  warning: css({ fontWeight: 'medium', color: 'yellow.800', mb: '1' }),
  error: css({ fontWeight: 'medium', color: 'red.800', mb: '1' }),
};

// ================================
// Types
// ================================

export type InfoBoxVariant = 'info' | 'success' | 'warning' | 'error';

export interface InfoBoxProps {
  variant?: InfoBoxVariant;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

// ================================
// Component
// ================================

export function InfoBox({
  variant = 'info',
  title,
  children,
  className,
}: InfoBoxProps) {
  return (
    <div className={cn(baseStyle, variantStyles[variant], className)}>
      {title && <div className={titleStyles[variant]}>{title}</div>}
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
