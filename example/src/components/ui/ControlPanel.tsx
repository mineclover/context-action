/**
 * @fileoverview ControlPanel Component
 * 컨트롤 패널용 재사용 가능한 컴포넌트
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
    md: { gridTemplateColumns: 'repeat(2, 1fr)' },
  }),
  grid3: css({
    display: 'grid',
    gridTemplateColumns: '1',
    gap: '6',
    md: { gridTemplateColumns: 'repeat(3, 1fr)' },
  }),
  section: css({}),
  sectionTitle: css({
    fontWeight: 'semibold',
    color: 'gray.700',
    mb: '3',
  }),
  buttonGroup: css({ spaceY: '2' }),
  settingsRow: css({
    display: 'flex',
    alignItems: 'center',
    gap: '4',
    p: '3',
    bg: 'gray.50',
    rounded: 'lg',
  }),
  label: css({
    fontSize: 'sm',
    fontWeight: 'medium',
    color: 'gray.700',
  }),
  rangeLabel: css({
    display: 'block',
    fontSize: 'xs',
    fontWeight: 'medium',
    color: 'gray.600',
    mb: '1',
  }),
  rangeInput: css({
    w: 'full',
    h: '2',
    bg: 'gray.200',
    rounded: 'lg',
    appearance: 'none',
    cursor: 'pointer',
  }),
};

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
    <div className={styles.section}>
      <h4 className={styles.sectionTitle}>{title}</h4>
      {children}
    </div>
  );
}

export function ControlButtonGroup({ children }: { children: React.ReactNode }) {
  return <div className={styles.buttonGroup}>{children}</div>;
}

export function ControlSettingsRow({ children }: { children: React.ReactNode }) {
  return <div className={styles.settingsRow}>{children}</div>;
}

export function ControlLabel({ children }: { children: React.ReactNode }) {
  return <label className={styles.label}>{children}</label>;
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
      <label className={styles.rangeLabel}>
        {label}: {value}{unit}
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className={styles.rangeInput}
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
  const gridClass = cols === 3 ? styles.grid3 : styles.grid;

  return (
    <div className={cn(styles.container, className)}>
      <h3 className={styles.title}>{title}</h3>
      <div className={gridClass}>{children}</div>
    </div>
  );
}

export default ControlPanel;
