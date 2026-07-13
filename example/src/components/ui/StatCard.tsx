/**
 * @fileoverview StatCard Component
 * 통계/메트릭 표시용 재사용 가능한 카드 컴포넌트
 */

import type React from 'react';
import { cn } from '../../lib/utils';
import {
  cardVariants,
  gridVariants,
  statHintVariants,
  statTitleVariants,
  statValueSizeVariants,
  statValueVariants,
} from './variants';

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
        return statValueSizeVariants({ size: 'lg', color: color as any });
      case 'mono':
        return statValueSizeVariants({ size: 'mono', color: color as any });
      default:
        return statValueVariants({ color: color as any });
    }
  };

  return (
    <div className={cn(cardVariants({ size: 'sm' }), className)}>
      <h4 className={cn(statTitleVariants())}>{title}</h4>
      <div className={cn(getValueStyle())}>{value}</div>
      {hint && <div className={cn(statHintVariants())}>{hint}</div>}
      {children}
    </div>
  );
}

// ================================
// StatsGrid Component
// ================================

export interface StatsGridProps {
  cols?: 2 | 3 | 4 | 5;
  children: React.ReactNode;
  className?: string;
}

export function StatsGrid({ cols = 4, children, className }: StatsGridProps) {
  return (
    <div className={cn(gridVariants({ cols: cols as 2 | 3 | 4 }), className)}>
      {children}
    </div>
  );
}

export default StatCard;
