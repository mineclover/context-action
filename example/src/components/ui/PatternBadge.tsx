import { cva, type RecipeVariantProps } from '../../../styled-system/css';
type VariantProps<T extends (...args: any) => any> = RecipeVariantProps<T>;
import type React from 'react';
import { cn } from '../../lib/utils';

const patternBadgeVariants = cva({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '1',
    fontWeight: 'medium',
    fontSize: 'xs',
    px: '2',
    py: '1',
    rounded: 'md',
    borderWidth: '1px',
    whiteSpace: 'nowrap',
  },
  variants: {
    pattern: {
      hoc: { bg: 'blue.100', color: 'blue.800', borderColor: 'blue.200' },
      provider: { bg: 'green.100', color: 'green.800', borderColor: 'green.200' },
      context: { bg: 'purple.100', color: 'purple.800', borderColor: 'purple.200' },
      hook: { bg: 'orange.100', color: 'orange.800', borderColor: 'orange.200' },
      unified: { bg: 'indigo.100', color: 'indigo.800', borderColor: 'indigo.200' },
      store: { bg: 'cyan.100', color: 'cyan.800', borderColor: 'cyan.200' },
      action: { bg: 'emerald.100', color: 'emerald.800', borderColor: 'emerald.200' },
      async: { bg: 'purple.100', color: 'purple.800', borderColor: 'purple.200' },
      ref: { bg: 'yellow.100', color: 'yellow.800', borderColor: 'yellow.200' },
      integration: { bg: 'pink.100', color: 'pink.800', borderColor: 'pink.200' },
      performance: { bg: 'red.100', color: 'red.800', borderColor: 'red.200' },
      api: { bg: 'blue.100', color: 'blue.800', borderColor: 'blue.200' },
      search: { bg: 'green.100', color: 'green.800', borderColor: 'green.200' },
      interaction: { bg: 'indigo.100', color: 'indigo.800', borderColor: 'indigo.200' },
      custom: { bg: 'gray.100', color: 'gray.800', borderColor: 'gray.200' },
    },
    size: {
      sm: { fontSize: 'xs', px: '2', py: '0.5' },
      md: { fontSize: 'xs', px: '2', py: '1' },
      lg: { fontSize: 'sm', px: '3', py: '1.5' },
    },
  },
  defaultVariants: {
    pattern: 'custom',
    size: 'md',
  },
});

type PatternBadgeProps = VariantProps<typeof patternBadgeVariants> & {
  children: React.ReactNode;
  icon?: string;
  className?: string;
};

export function PatternBadge({
  children,
  pattern,
  size,
  icon,
  className,
}: PatternBadgeProps) {
  return (
    <span className={cn(patternBadgeVariants({ pattern, size }), className)}>
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
