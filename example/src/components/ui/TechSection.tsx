/**
 * @fileoverview TechSection Component
 * 기술 구현 설명 섹션용 재사용 컴포넌트
 */

import type React from 'react';
import { cn } from '../../lib/utils';
import {
  techListVariants,
  techSectionGridVariants,
  techTitleVariants,
  textTitleVariants,
} from './variants';

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
      <h4
        className={cn(techTitleVariants({ color: color as 'blue' | 'green' }))}
      >
        {title}
      </h4>
      <ul className={cn(techListVariants())}>
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
    <div className={cn('p-6', className)}>
      <h3 className={cn(textTitleVariants({ variant: 'section' }))}>{title}</h3>
      <div className={cn(techSectionGridVariants())}>
        {columns.map((column, index) => (
          <TechColumn key={index} {...column} />
        ))}
      </div>
    </div>
  );
}

export default TechSection;
