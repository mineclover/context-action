/**
 * Section Component
 * A reusable section wrapper for page content organization
 */

import React from 'react';
import { cn } from '../../lib/utils';

export interface SectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  id?: string;
  titleClassName?: string;
  contentClassName?: string;
}

export function Section({
  title,
  children,
  className,
  id,
  titleClassName,
  contentClassName,
}: SectionProps) {
  return (
    <section className={cn('space-y-4', className)} id={id}>
      {title && (
        <h2
          className={cn('text-2xl font-semibold text-gray-900', titleClassName)}
        >
          {title}
        </h2>
      )}
      <div className={cn('space-y-4', contentClassName)}>{children}</div>
    </section>
  );
}
