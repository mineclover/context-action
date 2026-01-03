/**
 * @fileoverview TechSection Component
 * 기술 구현 설명 섹션용 재사용 컴포넌트
 */

import type React from 'react';
import { css } from '../../../styled-system/css';
import { cn } from '../../lib/utils';

// ================================
// Styles
// ================================

const styles = {
  container: css({ p: '6' }),
  title: css({
    fontSize: 'lg',
    fontWeight: 'semibold',
    color: 'gray.900',
    mb: '4',
  }),
  grid: css({
    display: 'grid',
    gridTemplateColumns: '1',
    gap: '6',
    lg: { gridTemplateColumns: 'repeat(2, 1fr)' },
  }),
  columnTitle: (color: string) => css({
    fontWeight: 'semibold',
    color: `${color}.600`,
    mb: '3',
  }),
  list: css({
    spaceY: '2',
    fontSize: 'sm',
    color: 'gray.700',
  }),
};

// ================================
// Types
// ================================

export interface TechColumnProps {
  title: string;
  color?: string;
  items: React.ReactNode[];
}

export interface TechSectionProps {
  title?: string;
  columns: TechColumnProps[];
  className?: string;
}

// ================================
// Components
// ================================

export function TechColumn({ title, color = 'blue', items }: TechColumnProps) {
  return (
    <div>
      <h4 className={styles.columnTitle(color)}>{title}</h4>
      <ul className={styles.list}>
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function TechSection({
  title = '🛠️ 기술 구현',
  columns,
  className,
}: TechSectionProps) {
  return (
    <div className={cn(styles.container, className)}>
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.grid}>
        {columns.map((column, index) => (
          <TechColumn key={index} {...column} />
        ))}
      </div>
    </div>
  );
}

export default TechSection;
