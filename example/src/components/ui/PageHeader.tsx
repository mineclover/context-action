/**
 * @fileoverview PageHeader Component
 * 페이지 헤더용 재사용 가능한 컴포넌트 (뱃지 포함)
 */

import type React from 'react';
import { cn } from '../../lib/utils';
import { pageHeaderVariants, flexVariants } from './variants';
import { Badge } from './Badge';

// ================================
// Types
// ================================

export interface BadgeItem {
  label: string;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow' | 'gray' | 'pink' | 'cyan' | 'teal';
}

export interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  badges?: BadgeItem[];
  size?: 'sm' | 'md' | 'lg';
  align?: 'left' | 'center' | 'right';
  className?: string;
  children?: React.ReactNode;
}

// ================================
// Component
// ================================

export function PageHeader({
  title,
  description,
  badges,
  size = 'md',
  align = 'left',
  className,
  children,
}: PageHeaderProps) {
  return (
    <header className={cn(pageHeaderVariants({ size, align }), className)}>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
      {description && (
        <p className="text-lg text-gray-600 mb-6 max-w-3xl">{description}</p>
      )}
      {badges && badges.length > 0 && (
        <div className={cn(flexVariants({ wrap: true, gap: 'sm' }), 'mt-4')}>
          {badges.map((badge, index) => (
            <Badge
              key={index}
              variant="outline"
              className={getBadgeColorClass(badge.color)}
            >
              {badge.label}
            </Badge>
          ))}
        </div>
      )}
      {children}
    </header>
  );
}

// Helper function for badge colors
function getBadgeColorClass(color?: BadgeItem['color']): string {
  const colorMap: Record<NonNullable<BadgeItem['color']>, string> = {
    blue: 'bg-blue-50 text-blue-800 border-blue-200',
    green: 'bg-green-50 text-green-800 border-green-200',
    purple: 'bg-purple-50 text-purple-800 border-purple-200',
    orange: 'bg-orange-50 text-orange-800 border-orange-200',
    red: 'bg-red-50 text-red-800 border-red-200',
    yellow: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    gray: 'bg-gray-50 text-gray-800 border-gray-200',
    pink: 'bg-pink-50 text-pink-800 border-pink-200',
    cyan: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    teal: 'bg-teal-50 text-teal-800 border-teal-200',
  };

  return colorMap[color || 'blue'];
}

export default PageHeader;
