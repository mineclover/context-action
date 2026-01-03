/**
 * @fileoverview StatCard Component
 * 통계/메트릭 표시용 재사용 가능한 카드 컴포넌트
 */

import type React from 'react';
import { css } from '../../../styled-system/css';
import { cn } from '../../lib/utils';

// ================================
// Styles
// ================================

const styles = {
  card: css({
    bg: 'white',
    rounded: 'lg',
    p: '4',
    shadow: 'sm',
    border: '1px solid token(colors.gray.200)',
  }),
  title: css({
    fontWeight: 'semibold',
    fontSize: 'sm',
    color: 'gray.600',
    mb: '2',
  }),
  value: (color: string) => css({
    fontSize: '2xl',
    fontWeight: 'bold',
    color: `${color}.600`,
  }),
  valueLg: (color: string) => css({
    fontSize: '3xl',
    fontWeight: 'bold',
    color: `${color}.600`,
  }),
  valueMono: (color: string) => css({
    fontSize: '2xl',
    fontWeight: 'bold',
    color: `${color}.600`,
    fontFamily: 'mono',
  }),
  hint: css({
    fontSize: 'xs',
    color: 'gray.500',
    mt: '1',
  }),
};

// ================================
// Types
// ================================

export interface StatCardProps {
  title: string;
  value: React.ReactNode;
  color?: string;
  hint?: string;
  variant?: 'default' | 'large' | 'mono';
  className?: string;
  children?: React.ReactNode;
}

// ================================
// Component
// ================================

export function StatCard({
  title,
  value,
  color = 'blue',
  hint,
  variant = 'default',
  className,
  children,
}: StatCardProps) {
  const getValueStyle = () => {
    switch (variant) {
      case 'large':
        return styles.valueLg(color);
      case 'mono':
        return styles.valueMono(color);
      default:
        return styles.value(color);
    }
  };

  return (
    <div className={cn(styles.card, className)}>
      <h4 className={styles.title}>{title}</h4>
      <div className={getValueStyle()}>{value}</div>
      {hint && <div className={styles.hint}>{hint}</div>}
      {children}
    </div>
  );
}

// ================================
// StatsGrid Component
// ================================

const gridStyles = {
  cols2: css({
    display: 'grid',
    gridTemplateColumns: '1',
    gap: '4',
    md: { gridTemplateColumns: 'repeat(2, 1fr)' },
  }),
  cols3: css({
    display: 'grid',
    gridTemplateColumns: '1',
    gap: '4',
    md: { gridTemplateColumns: 'repeat(3, 1fr)' },
  }),
  cols4: css({
    display: 'grid',
    gridTemplateColumns: '1',
    gap: '4',
    md: { gridTemplateColumns: 'repeat(4, 1fr)' },
  }),
  cols5: css({
    display: 'grid',
    gridTemplateColumns: '1',
    gap: '4',
    md: { gridTemplateColumns: 'repeat(2, 1fr)' },
    lg: { gridTemplateColumns: 'repeat(5, 1fr)' },
  }),
};

export interface StatsGridProps {
  cols?: 2 | 3 | 4 | 5;
  children: React.ReactNode;
  className?: string;
}

export function StatsGrid({ cols = 4, children, className }: StatsGridProps) {
  const gridClass = gridStyles[`cols${cols}`];
  return <div className={cn(gridClass, className)}>{children}</div>;
}

export default StatCard;
