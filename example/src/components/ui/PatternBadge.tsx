import type React from 'react';
import { cn } from '../../lib/utils';

type PatternBadgeProps = {
  pattern?: 'hoc' | 'provider' | 'context' | 'hook' | 'unified' | 'store' | 'action' | 'async' | 'ref' | 'integration' | 'performance' | 'api' | 'search' | 'interaction' | 'custom';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  icon?: string;
  className?: string;
};

// Direct Tailwind classes for maximum reusability
const patternBadgeVariants = {
  base: 'inline-flex items-center gap-1 font-medium text-xs px-2 py-1 rounded-md border border-solid whitespace-nowrap',
  patterns: {
    hoc: 'bg-blue-100 text-blue-800 border-blue-200',
    provider: 'bg-green-100 text-green-800 border-green-200',
    context: 'bg-purple-100 text-purple-800 border-purple-200',
    hook: 'bg-orange-100 text-orange-800 border-orange-200',
    unified: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    store: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    action: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    async: 'bg-purple-100 text-purple-800 border-purple-200',
    ref: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    integration: 'bg-pink-100 text-pink-800 border-pink-200',
    performance: 'bg-red-100 text-red-800 border-red-200',
    api: 'bg-blue-100 text-blue-800 border-blue-200',
    search: 'bg-green-100 text-green-800 border-green-200',
    interaction: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    custom: 'bg-gray-100 text-gray-800 border-gray-200',
  },
  sizes: {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1.5',
  },
};

export function PatternBadge({
  children,
  pattern = 'custom',
  size = 'md',
  icon,
  className,
}: PatternBadgeProps) {
  const classes = [
    patternBadgeVariants.base,
    patternBadgeVariants.patterns[pattern],
    patternBadgeVariants.sizes[size],
  ].filter(Boolean).join(' ');

  return (
    <span className={cn(classes, className)}>
      {icon && <span className="text-xs">{icon}</span>}
      <span className="font-medium">{children}</span>
    </span>
  );
}

// 자주 사용되는 패턴들을 위한 미리 정의된 컴포넌트들
export const HOCPatternBadge = ({
  size = 'md',
}: {
  size?: 'sm' | 'md' | 'lg';
}) => (
  <PatternBadge pattern="hoc" size={size} icon="🔧">
    Pattern: HOC
  </PatternBadge>
);

export const ProviderPatternBadge = ({
  size = 'md',
}: {
  size?: 'sm' | 'md' | 'lg';
}) => (
  <PatternBadge pattern="provider" size={size} icon="🏗️">
    Pattern: Provider
  </PatternBadge>
);

export const ContextPatternBadge = ({
  size = 'md',
}: {
  size?: 'sm' | 'md' | 'lg';
}) => (
  <PatternBadge pattern="context" size={size} icon="🔗">
    Pattern: Context
  </PatternBadge>
);

export const UnifiedPatternBadge = ({
  size = 'md',
}: {
  size?: 'sm' | 'md' | 'lg';
}) => (
  <PatternBadge pattern="unified" size={size} icon="⚡">
    Pattern: Unified
  </PatternBadge>
);

export const StorePatternBadge = ({
  size = 'md',
}: {
  size?: 'sm' | 'md' | 'lg';
}) => (
  <PatternBadge pattern="store" size={size} icon="🗄️">
    Pattern: Store
  </PatternBadge>
);

export const ActionPatternBadge = ({
  size = 'md',
}: {
  size?: 'sm' | 'md' | 'lg';
}) => (
  <PatternBadge pattern="action" size={size} icon="⚡">
    Pattern: Action
  </PatternBadge>
);

// 동적 PatternBadge 컴포넌트 - type과 difficulty를 받아서 처리
interface DynamicPatternBadgeProps {
  type?:
    | 'store'
    | 'action'
    | 'async'
    | 'ref'
    | 'integration'
    | 'performance'
    | 'api'
    | 'search'
    | 'interaction';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  size?: 'sm' | 'md' | 'lg';
}

export const DynamicPatternBadge = ({
  type = 'integration',
  difficulty = 'intermediate',
  size = 'md',
}: DynamicPatternBadgeProps) => {
  const typeIcons = {
    store: '🗄️',
    action: '⚡',
    async: '⏳',
    ref: '📌',
    integration: '🔗',
    performance: '🚀',
    api: '🌐',
    search: '🔍',
    interaction: '👆',
  };

  const difficultyLabels = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
  };

  return (
    <PatternBadge pattern={type} size={size} icon={typeIcons[type]}>
      {difficultyLabels[difficulty]}
    </PatternBadge>
  );
};
