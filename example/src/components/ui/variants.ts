/**
 * Centralized component variants for maximum style reusability
 * All component variants are defined here for consistency and maintainability
 */

// ================================
// Core Component Variants
// ================================

export const cardVariants = ({
  variant = 'default',
  size = 'md',
  hover = false,
  category = 'default'
}: {
  variant?: 'default' | 'elevated' | 'outlined' | 'bordered';
  size?: 'sm' | 'md' | 'lg';
  hover?: boolean;
  category?: string;
} = {}) => {
  const baseClasses = 'bg-white border border-gray-200 rounded-lg transition-all duration-200';

  const variantClasses = {
    default: 'shadow-sm',
    elevated: 'shadow-lg',
    outlined: 'shadow-none',
    bordered: 'border-2 shadow-none',
  };

  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const hoverClasses = hover ? 'hover:shadow-lg hover:-translate-y-1' : '';

  const categoryBorderClasses: Record<string, string> = {
    core: 'border-l-4 border-l-red-500',
    store: 'border-l-4 border-l-green-600',
    pipeline: 'border-l-4 border-l-orange-500',
    react: 'border-l-4 border-l-purple-600',
    logger: 'border-l-4 border-l-yellow-600',
    actionguard: 'border-l-4 border-l-pink-600',
    conditional: 'border-l-4 border-l-cyan-600',
    examples: 'border-l-4 border-l-orange-600',
    refs: 'border-l-4 border-l-blue-600',
    demos: 'border-l-4 border-l-emerald-600',
    performance: 'border-l-4 border-l-red-600',
    utilities: 'border-l-4 border-l-teal-600',
    debug: 'border-l-4 border-l-indigo-600',
    default: '',
  };

  return `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${hoverClasses} ${categoryBorderClasses[category] || ''}`.trim();
};

export const buttonVariants = ({
  variant = 'primary',
  size = 'md'
}: {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'outline' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
} = {}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-lg border border-transparent font-medium transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white border-gray-600 hover:bg-gray-700 focus:ring-gray-500',
    success: 'bg-green-600 text-white border-green-600 hover:bg-green-700 focus:ring-green-500',
    warning: 'bg-yellow-600 text-white border-yellow-600 hover:bg-yellow-700 focus:ring-yellow-600',
    danger: 'bg-red-600 text-white border-red-600 hover:bg-red-700 focus:ring-red-500',
    info: 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    outline: 'bg-transparent text-gray-700 border-gray-300 hover:bg-gray-50 focus:ring-blue-500',
    ghost: 'bg-transparent text-gray-700 border-transparent hover:bg-gray-100 focus:ring-blue-500',
  };

  const sizeClasses = {
    xs: 'px-2.5 py-1.5 text-xs',
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg',
  };

  return `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`;
};

export const gridVariants = ({
  cols = 'auto',
  gap = 'md'
}: {
  cols?: 1 | 2 | 3 | 4 | 'auto';
  gap?: 'sm' | 'md' | 'lg';
} = {}) => {
  const baseClasses = 'grid gap-6';

  const colsClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    auto: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6',
  };

  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
  };

  return `${baseClasses} ${colsClasses[cols]} ${gapClasses[gap]}`;
};

// ================================
// Form Component Variants
// ================================

export const inputVariants = ({
  variant = 'default',
  size = 'md'
}: {
  variant?: 'default' | 'error' | 'success';
  size?: 'sm' | 'md' | 'lg';
} = {}) => {
  const baseClasses = 'block w-full rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variantClasses = {
    default: 'border-gray-300 focus:border-primary-500 focus:ring-primary-500',
    error: 'border-danger-300 focus:border-danger-500 focus:ring-danger-500',
    success: 'border-success-300 focus:border-success-500 focus:ring-success-500',
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-4 py-3 text-base',
  };

  return `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`;
};

export const badgeVariants = ({
  variant = 'default'
}: {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'outline';
} = {}) => {
  const baseClasses = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium';

  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-primary-100 text-primary-800',
    success: 'bg-success-100 text-success-800',
    warning: 'bg-warning-100 text-warning-800',
    danger: 'bg-danger-100 text-danger-800',
    outline: 'border border-gray-300 text-gray-800',
  };

  return `${baseClasses} ${variantClasses[variant]}`;
};

export const statusVariants = ({
  status = 'neutral'
}: {
  status?: 'safe' | 'warning' | 'danger' | 'info' | 'neutral';
} = {}) => {
  const baseClasses = 'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium';

  const statusClasses = {
    safe: 'bg-success-50 text-success-700 border border-success-200',
    warning: 'bg-warning-50 text-warning-700 border border-warning-200',
    danger: 'bg-danger-50 text-danger-700 border border-danger-200',
    info: 'bg-primary-50 text-primary-700 border border-primary-200',
    neutral: 'bg-gray-50 text-gray-700 border border-gray-200',
  };

  return `${baseClasses} ${statusClasses[status]}`;
};

// ================================
// Layout Component Variants
// ================================

export const containerVariants = ({
  size = 'lg',
  centered = true,
  padding = 'md'
}: {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  centered?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
} = {}) => {
  const baseClasses = 'w-full max-w-none';

  const sizeClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-8xl',
    full: 'max-w-none',
  };

  const centeredClass = centered ? 'mx-auto' : '';

  const paddingClasses = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-12',
  };

  return `${baseClasses} ${sizeClasses[size]} ${centeredClass} ${paddingClasses[padding]}`.trim();
};

export const navItemVariants = ({
  variant = 'default',
  category = 'main'
}: {
  variant?: 'default' | 'active' | 'disabled';
  category?: string;
} = {}) => {
  const baseClasses = 'block w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200';

  const variantClasses = {
    default: 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
    active: 'bg-primary-100 text-primary-900 border-l-4 border-primary-600',
    disabled: 'text-gray-400 cursor-not-allowed opacity-60',
  };

  const categoryHoverClasses: Record<string, string> = {
    main: '',
    core: 'hover:bg-red-50 hover:text-red-900',
    store: 'hover:bg-green-50 hover:text-green-900',
    action: 'hover:bg-blue-50 hover:text-blue-900',
    async: 'hover:bg-purple-50 hover:text-purple-900',
    architecture: 'hover:bg-gray-50 hover:text-gray-900',
    interaction: 'hover:bg-indigo-50 hover:text-indigo-900',
    pipeline: 'hover:bg-orange-50 hover:text-orange-900',
    react: 'hover:bg-purple-50 hover:text-purple-900',
    logger: 'hover:bg-yellow-50 hover:text-yellow-900',
    actionguard: 'hover:bg-pink-50 hover:text-pink-900',
    conditional: 'hover:bg-cyan-50 hover:text-cyan-900',
    examples: 'hover:bg-orange-50 hover:text-orange-900',
    refs: 'hover:bg-blue-50 hover:text-blue-900',
    demos: 'hover:bg-emerald-50 hover:text-emerald-900',
    performance: 'hover:bg-red-50 hover:text-red-900',
    utilities: 'hover:bg-teal-50 hover:text-teal-900',
    debug: 'hover:bg-indigo-50 hover:text-indigo-900',
    dev: 'hover:bg-red-50 hover:text-red-900',
    'coming-soon': 'bg-gray-50 text-gray-500',
  };

  return `${baseClasses} ${variantClasses[variant]} ${categoryHoverClasses[category] || ''}`.trim();
};

// ================================
// Specialized Component Variants
// ================================

export const demoCardVariants = ({
  variant = 'default',
  spacing = 'md'
}: {
  variant?: 'default' | 'info' | 'logger' | 'monitor' | 'compact';
  spacing?: 'none' | 'sm' | 'md' | 'lg';
} = {}) => {
  const baseClasses = 'bg-white rounded-lg border border-gray-200 shadow-sm';

  const variantClasses = {
    default: '',
    info: 'bg-blue-50',
    logger: 'relative',
    monitor: 'bg-gray-50',
    compact: '',
  };

  const spacingClasses = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return `${baseClasses} ${variantClasses[variant]} ${spacingClasses[spacing]}`;
};

export const codeExampleVariants = ({
  size = 'md'
}: {
  size?: 'sm' | 'md' | 'lg';
} = {}) => {
  const baseClasses = 'mt-8 bg-white rounded-lg border border-gray-200 shadow-sm';

  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return `${baseClasses} ${sizeClasses[size]}`;
};

export const codeBlockVariants = ({
  size = 'md'
}: {
  size?: 'xs' | 'sm' | 'md' | 'lg';
} = {}) => {
  const baseClasses = 'bg-gray-900 text-gray-100 rounded-lg overflow-x-auto font-mono line-height-relaxed max-w-full w-full';

  const sizeClasses = {
    xs: 'p-2 text-xs',
    sm: 'p-3 text-sm',
    md: 'p-4 text-sm',
    lg: 'p-6 text-base',
  };

  return `${baseClasses} ${sizeClasses[size]}`;
};

// ================================
// Toast & Log Variants (Simplified)
// ================================

export const toastVariants = ({
  type = 'default',
  phase = 'visible'
}: {
  type?: string;
  phase?: string;
} = {}) => 'bg-white rounded-lg shadow-lg border border-gray-200 transition-all duration-300';

export const toastContainerVariants = ({
  position = 'top-right',
  width = 'sm'
}: {
  position?: string;
  width?: string;
} = {}) => 'fixed z-50 p-4 space-y-2 pointer-events-none';

export const toastStepBadgeVariants = ({
  step = 'start'
}: {
  step?: string;
} = {}) => 'inline-flex items-center px-2 py-1 rounded-full font-medium text-xs';

export const logMonitorVariants = ({
  variant = 'default'
}: {
  variant?: string;
} = {}) => 'bg-white rounded-lg border border-gray-200';

export const logEntryVariants = (props: any) => 'grid gap-2 p-2 border-b border-gray-100 text-xs font-mono';

export const logLevelBadgeVariants = ({
  level = 'info'
}: {
  level?: string;
} = {}) => {
  const baseClasses = 'inline-flex items-center px-2 py-1 rounded-md font-medium text-xs';
  const levelClasses: Record<string, string> = {
    trace: 'bg-gray-100 text-gray-700',
    debug: 'bg-blue-100 text-blue-700',
    info: 'bg-green-100 text-green-700',
    warn: 'bg-yellow-100 text-yellow-700',
    error: 'bg-red-100 text-red-700',
  };
  return `${baseClasses} ${levelClasses[level] || levelClasses.info}`;
};

// ================================
// Type Definitions for Compatibility
// ================================

export type CardVariants = Parameters<typeof cardVariants>[0];
export type ButtonVariants = Parameters<typeof buttonVariants>[0];
export type GridVariants = Parameters<typeof gridVariants>[0];
export type InputVariants = Parameters<typeof inputVariants>[0];
export type BadgeVariants = Parameters<typeof badgeVariants>[0];
export type StatusVariants = Parameters<typeof statusVariants>[0];
export type ContainerVariants = Parameters<typeof containerVariants>[0];
export type NavItemVariants = Parameters<typeof navItemVariants>[0];
export type DemoCardVariants = Parameters<typeof demoCardVariants>[0];
export type CodeExampleVariants = Parameters<typeof codeExampleVariants>[0];
export type CodeBlockVariants = Parameters<typeof codeBlockVariants>[0];
export type ToastVariants = Parameters<typeof toastVariants>[0];
export type ToastContainerVariants = Parameters<typeof toastContainerVariants>[0];
export type ToastStepBadgeVariants = Parameters<typeof toastStepBadgeVariants>[0];
export type LayoutVariants = any;
export type SidebarVariants = any;
export type MainContentVariants = any;
export type LogMonitorVariants = any;
export type LogEntryVariants = any;
export type LogLevelBadgeVariants = any;
