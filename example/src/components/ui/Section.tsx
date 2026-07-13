/**
 * Section Component
 * A reusable section wrapper for page content organization
 */

import React from 'react';
import { cn } from '../../lib/utils';
import { sectionVariants, spacingVariants } from './variants';

export interface SectionProps {
  title?: string;
  children: React.ReactNode;
  spacing?: 'sm' | 'md' | 'lg' | 'xl';
  divider?: boolean;
  className?: string;
  id?: string;
  titleClassName?: string;
  contentClassName?: string;
}

export function Section({
  title,
  children,
  spacing = 'md',
  divider = false,
  className,
  id,
  titleClassName,
  contentClassName,
}: SectionProps) {
  return (
    <section
      className={cn(sectionVariants({ spacing, divider }), className)}
      id={id}
    >
      {title && (
        <h2
          className={cn('text-2xl font-semibold text-gray-900', titleClassName)}
        >
          {title}
        </h2>
      )}
      <div
        className={cn(
          spacingVariants({ size: spacing, direction: 'vertical' }),
          contentClassName
        )}
      >
        {children}
      </div>
    </section>
  );
}
