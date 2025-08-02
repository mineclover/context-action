import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

// Comparison Strategy Variants
export const comparisonStrategyVariants = cva(
  "border-2 p-4 rounded-lg transition-all duration-200",
  {
    variants: {
      strategy: {
        reference: "border-orange-400 bg-orange-50 text-orange-700",
        shallow: "border-blue-400 bg-blue-50 text-blue-700",
        deep: "border-purple-400 bg-purple-50 text-purple-700",
        default: "border-gray-400 bg-gray-50 text-gray-700",
      },
      throttled: {
        true: "ring-2 ring-yellow-300",
        false: "",
      },
    },
    defaultVariants: {
      strategy: "default",
      throttled: false,
    },
  }
);

// Render Status Variants
export const renderStatusVariants = cva(
  "inline-flex items-center gap-1 px-2 py-1 rounded font-medium text-xs",
  {
    variants: {
      status: {
        safe: "text-green-600 bg-green-100",
        watch: "text-yellow-600 bg-yellow-100",
        high: "text-orange-600 bg-orange-100",
        danger: "text-red-600 bg-red-100",
      },
    },
    defaultVariants: {
      status: "safe",
    },
  }
);

// Performance Card Variants
export const performanceCardVariants = cva(
  "border rounded-lg p-4 transition-colors",
  {
    variants: {
      type: {
        info: "bg-blue-50 border-blue-200",
        warning: "bg-yellow-50 border-yellow-200",
        success: "bg-green-50 border-green-200",
        error: "bg-red-50 border-red-200",
      },
    },
    defaultVariants: {
      type: "info",
    },
  }
);

export interface ComparisonCardProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof comparisonStrategyVariants> {
  title: string;
  renderCount: number;
  stopped?: boolean;
}

export function ComparisonCard({ 
  className, 
  strategy, 
  throttled, 
  title,
  renderCount,
  stopped,
  children,
  ...props 
}: ComparisonCardProps) {
  return (
    <div 
      className={cn(
        comparisonStrategyVariants({ strategy, throttled }),
        stopped && "border-red-500 bg-red-50",
        className
      )} 
      {...props}
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-base">{title}</h3>
        <RenderStatus renderCount={renderCount} />
      </div>
      
      {stopped && (
        <div className="mb-3">
          <h3 className="text-red-700 font-bold mb-2">🚨 STOPPED - Too Many Renders</h3>
          <div className="text-sm text-red-600">
            Component exceeded safety limit to prevent infinite loops.
          </div>
          <div className="text-xs text-red-500 mt-2">
            This usually indicates a state update cycle or comparison strategy issue.
          </div>
        </div>
      )}
      
      {children}
    </div>
  );
}

export interface RenderStatusProps {
  renderCount: number;
}

export function RenderStatus({ renderCount }: RenderStatusProps) {
  const getStatus = () => {
    if (renderCount <= 3) return { status: 'safe' as const, icon: '✅', text: 'Safe' };
    if (renderCount <= 8) return { status: 'watch' as const, icon: '⚠️', text: 'Watch' };
    if (renderCount <= 15) return { status: 'high' as const, icon: '🔄', text: 'High' };
    return { status: 'danger' as const, icon: '🚨', text: 'Danger' };
  };

  const { status, icon, text } = getStatus();

  return (
    <span className={cn(renderStatusVariants({ status }))}>
      <span>{icon}</span>
      <span>{text} ({renderCount})</span>
    </span>
  );
}

export interface PerformanceCardProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof performanceCardVariants> {
  title: string;
  icon?: string;
}

export function PerformanceCard({ 
  className, 
  type, 
  title,
  icon,
  children,
  ...props 
}: PerformanceCardProps) {
  return (
    <div className={cn(performanceCardVariants({ type }), className)} {...props}>
      <h3 className="font-bold mb-2 flex items-center gap-2">
        {icon && <span>{icon}</span>}
        {title}
      </h3>
      {children}
    </div>
  );
}

export interface StatDisplayProps {
  label: string;
  value: string | number;
  unit?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export function StatDisplay({ label, value, unit, variant = 'default' }: StatDisplayProps) {
  const colorMap = {
    default: 'text-gray-700',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600',
  };

  return (
    <div className="text-xs bg-white p-2 rounded border">
      <div className="text-gray-500 mb-1">{label}</div>
      <div className={cn("font-mono font-bold", colorMap[variant])}>
        {value}{unit && <span className="text-gray-400 ml-1">{unit}</span>}
      </div>
    </div>
  );
}