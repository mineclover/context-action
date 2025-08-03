import React from 'react';
import { Badge } from './Badge';
import { cva, type VariantProps } from 'class-variance-authority';

const patternBadgeVariants = cva(
  'inline-flex items-center gap-1 font-medium text-xs px-2 py-1 rounded-md border whitespace-nowrap',
  {
    variants: {
      pattern: {
        hoc: 'bg-blue-100 text-blue-800 border-blue-200',
        provider: 'bg-green-100 text-green-800 border-green-200',
        context: 'bg-purple-100 text-purple-800 border-purple-200',
        hook: 'bg-orange-100 text-orange-800 border-orange-200',
        unified: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        store: 'bg-cyan-100 text-cyan-800 border-cyan-200',
        action: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        custom: 'bg-gray-100 text-gray-800 border-gray-200'
      },
      size: {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-xs px-2 py-1',
        lg: 'text-sm px-3 py-1.5'
      }
    },
    defaultVariants: {
      pattern: 'custom',
      size: 'md'
    }
  }
);

interface PatternBadgeProps extends VariantProps<typeof patternBadgeVariants> {
  children: React.ReactNode;
  icon?: string;
  className?: string;
}

export function PatternBadge({ 
  children, 
  pattern, 
  size, 
  icon, 
  className 
}: PatternBadgeProps) {
  return (
    <span className={patternBadgeVariants({ pattern, size, className })}>
      {icon && <span className="text-xs">{icon}</span>}
      <span className="font-medium">{children}</span>
    </span>
  );
}

// 자주 사용되는 패턴들을 위한 미리 정의된 컴포넌트들
export const HOCPatternBadge = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => (
  <PatternBadge pattern="hoc" size={size} icon="🔧">
    Pattern: HOC
  </PatternBadge>
);

export const ProviderPatternBadge = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => (
  <PatternBadge pattern="provider" size={size} icon="🏗️">
    Pattern: Provider
  </PatternBadge>
);

export const ContextPatternBadge = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => (
  <PatternBadge pattern="context" size={size} icon="🔗">
    Pattern: Context
  </PatternBadge>
);

export const UnifiedPatternBadge = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => (
  <PatternBadge pattern="unified" size={size} icon="⚡">
    Pattern: Unified
  </PatternBadge>
);

export const StorePatternBadge = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => (
  <PatternBadge pattern="store" size={size} icon="🗄️">
    Pattern: Store
  </PatternBadge>
);

export const ActionPatternBadge = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => (
  <PatternBadge pattern="action" size={size} icon="⚡">
    Pattern: Action
  </PatternBadge>
);