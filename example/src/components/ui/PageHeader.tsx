/**
 * @fileoverview PageHeader Component
 * 페이지 헤더용 재사용 가능한 컴포넌트 (뱃지 포함)
 */

import type React from 'react';
import { css } from '../../../styled-system/css';
import { cn } from '../../lib/utils';
import { Badge } from './Badge';

// ================================
// Styles
// ================================

const styles = {
  badgeContainer: css({
    display: 'flex',
    flexWrap: 'wrap',
    gap: '2',
    mt: '4',
  }),
};

// Badge color mapping
const badgeColors: Record<string, { bg: string; color: string }> = {
  blue: { bg: 'blue.50', color: 'blue.800' },
  green: { bg: 'green.50', color: 'green.800' },
  purple: { bg: 'purple.50', color: 'purple.800' },
  orange: { bg: 'orange.50', color: 'orange.800' },
  red: { bg: 'red.50', color: 'red.800' },
  yellow: { bg: 'yellow.50', color: 'yellow.800' },
  gray: { bg: 'gray.50', color: 'gray.800' },
  pink: { bg: 'pink.50', color: 'pink.800' },
  cyan: { bg: 'cyan.50', color: 'cyan.800' },
  teal: { bg: 'teal.50', color: 'teal.800' },
};

// ================================
// Types
// ================================

export interface BadgeItem {
  label: string;
  color?: keyof typeof badgeColors;
}

export interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  badges?: BadgeItem[];
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
  className,
  children,
}: PageHeaderProps) {
  return (
    <header className={cn('page-header', className)}>
      <h1>{title}</h1>
      {description && <p className="page-description">{description}</p>}
      {badges && badges.length > 0 && (
        <div className={styles.badgeContainer}>
          {badges.map((badge, index) => {
            const colorConfig = badgeColors[badge.color || 'blue'];
            return (
              <Badge
                key={index}
                variant="outline"
                className={css({ bg: colorConfig.bg, color: colorConfig.color })}
              >
                {badge.label}
              </Badge>
            );
          })}
        </div>
      )}
      {children}
    </header>
  );
}

export default PageHeader;
