/**
 * Shared components across all domains
 * Reusable UI components following design system principles
 */

import React from 'react';
import type { DemoCardProps, CodeExampleProps } from '../types';

// Domain Layout Component - consistent structure for domain pages
export function DomainLayout({ 
  title, 
  description, 
  children, 
  className = '' 
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`container mx-auto px-4 py-8 ${className}`}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
        <p className="text-lg text-gray-600 max-w-3xl">{description}</p>
      </div>
      {children}
    </div>
  );
}

// Section Component - consistent section structure
export function Section({ 
  title, 
  children, 
  className = '' 
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`mb-8 ${className}`}>
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">{title}</h2>
      {children}
    </section>
  );
}

// Enhanced Demo Card with consistent styling
export function DemoCard({ title, children, className = '' }: DemoCardProps) {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      <div className="border-b border-gray-200 px-6 py-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// Enhanced Code Example with syntax highlighting
export function CodeExample({ children, language = 'typescript' }: CodeExampleProps) {
  return (
    <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg">
      <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
        <span className="text-sm font-medium text-gray-600">{language}</span>
      </div>
      <pre className="p-4 overflow-x-auto">
        <code className="text-sm text-gray-800 whitespace-pre-wrap">{children}</code>
      </pre>
    </div>
  );
}

// Memoized constants to prevent recreation on every render
const TYPE_COLORS = {
  store: 'bg-blue-100 text-blue-800',
  action: 'bg-green-100 text-green-800', 
  async: 'bg-purple-100 text-purple-800',
  ref: 'bg-orange-100 text-orange-800',
  integration: 'bg-gray-100 text-gray-800',
  performance: 'bg-red-100 text-red-800',
  api: 'bg-cyan-100 text-cyan-800',
  search: 'bg-emerald-100 text-emerald-800',
  interaction: 'bg-indigo-100 text-indigo-800'
} as const;

const DIFFICULTY_COLORS = {
  beginner: 'bg-emerald-100 text-emerald-800',
  intermediate: 'bg-yellow-100 text-yellow-800',
  advanced: 'bg-red-100 text-red-800'
} as const;

// Pattern Badge - indicates pattern complexity and type
export const PatternBadge = React.memo(({ 
  type, 
  difficulty = 'intermediate',
  className = ''
}: {
  type: 'store' | 'action' | 'async' | 'ref' | 'integration' | 'performance' | 'api' | 'search' | 'interaction';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  className?: string;
}) => {
  return (
    <div className={`flex gap-2 ${className}`}>
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[type]}`}>
        {type.toUpperCase()}
      </span>
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${DIFFICULTY_COLORS[difficulty]}`}>
        {difficulty.toUpperCase()}
      </span>
    </div>
  );
});

// Memoized status configuration to prevent recreation
const STATUS_CONFIG = {
  idle: { icon: '⚪', color: 'text-gray-500', bg: 'bg-gray-100' },
  loading: { icon: '🔄', color: 'text-blue-500', bg: 'bg-blue-100' },
  success: { icon: '✅', color: 'text-green-500', bg: 'bg-green-100' },
  error: { icon: '❌', color: 'text-red-500', bg: 'bg-red-100' }
} as const;

// Status Indicator - shows operation status
export const StatusIndicator = React.memo(({ 
  status,
  message,
  className = ''
}: {
  status: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
  className?: string;
}) => {
  const config = STATUS_CONFIG[status];

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${config.bg} ${config.color} ${className}`}>
      <span className="text-sm">{config.icon}</span>
      {message && <span className="text-sm font-medium">{message}</span>}
    </div>
  );
});

// Metrics Display - shows performance or usage metrics
export const MetricsDisplay = React.memo(({
  metrics,
  title = 'Metrics',
  className = ''
}: {
  metrics: Record<string, string | number>;
  title?: string;
  className?: string;
}) => {
  const metricEntries = React.useMemo(() => 
    Object.entries(metrics), [metrics]
  );

  return (
    <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
      <h4 className="text-sm font-semibold text-gray-700 mb-3">{title}</h4>
      <div className="grid grid-cols-2 gap-3">
        {metricEntries.map(([key, value]) => (
          <div key={key} className="flex justify-between">
            <span className="text-sm text-gray-600">{key}:</span>
            <span className="text-sm font-medium text-gray-900">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

// Error Boundary for domain components
export class DomainErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Domain error boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} />;
      }

      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 m-4">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Something went wrong</h2>
          <p className="text-red-700 mb-4">
            An error occurred while rendering this component.
          </p>
          {this.state.error && (
            <details className="bg-red-100 rounded p-3">
              <summary className="cursor-pointer text-sm font-medium text-red-800">
                Error Details
              </summary>
              <pre className="mt-2 text-xs text-red-700 overflow-auto">
                {this.state.error.message}
              </pre>
            </details>
          )}
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Memoized size classes
const SIZE_CLASSES = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6', 
  lg: 'w-8 h-8'
} as const;

// Loading Spinner component
export const LoadingSpinner = React.memo(({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) => {
  return (
    <div className={`inline-block animate-spin rounded-full border-2 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite] ${SIZE_CLASSES[size]} ${className}`}>
      <span className="sr-only">Loading...</span>
    </div>
  );
});

// Empty State component
export function EmptyState({ 
  title, 
  description, 
  action,
  className = '' 
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="text-gray-400 text-6xl mb-4">📄</div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-4">{description}</p>
      {action}
    </div>
  );
}