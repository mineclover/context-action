/**
 * @fileoverview ControlPanel Component
 * 컨트롤 패널용 재사용 가능한 컴포넌트
 */

import type React from 'react';
import { cn } from '../../lib/utils';
import {
  flexVariants,
  gridVariants,
  spacingVariants,
  textHintVariants,
  textTitleVariants,
} from './variants';

// ================================
// Types
// ================================

export interface ControlSectionProps {
  title: string;
  children: React.ReactNode;
}

export interface ControlPanelProps {
  title?: string;
  cols?: 2 | 3;
  children: React.ReactNode;
  className?: string;
}

export interface RangeControlProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
}

// ================================
// Components
// ================================

export function ControlSection({ title, children }: ControlSectionProps) {
  return (
    <div>
      <h4 className={cn(textTitleVariants({ variant: 'subsection' }))}>
        {title}
      </h4>
      {children}
    </div>
  );
}

export function ControlButtonGroup({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={cn(spacingVariants({ size: 'sm', direction: 'vertical' }))}>
      {children}
    </div>
  );
}

export function ControlSettingsRow({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        flexVariants({ align: 'center', gap: 'md' }),
        'p-3 bg-gray-50 rounded-lg'
      )}
    >
      {children}
    </div>
  );
}

export function ControlLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-sm font-medium text-gray-700">{children}</label>
  );
}

export function RangeControl({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  onChange,
}: RangeControlProps) {
  return (
    <div>
      <label className={cn(textHintVariants({ size: 'xs' }), 'block mb-1')}>
        {label}: {value}
        {unit}
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      />
    </div>
  );
}

export function ControlPanel({
  title = '🎛️ 컨트롤',
  cols = 2,
  children,
  className,
}: ControlPanelProps) {
  return (
    <div className={cn('p-6', className)}>
      <h3 className={cn(textTitleVariants({ variant: 'section' }))}>{title}</h3>
      <div className={cn(gridVariants({ cols: cols as 2 | 3, gap: 'lg' }))}>
        {children}
      </div>
    </div>
  );
}

export default ControlPanel;
