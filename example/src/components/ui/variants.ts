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
// Extended Component Variants
// ================================

// Select/Input related variants
export const selectVariants = ({
  size = 'md',
  variant = 'default'
}: {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'error';
} = {}) => {
  const baseClasses = 'block w-full rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 bg-white';

  const variantClasses = {
    default: 'border-gray-300 focus:border-primary-500 focus:ring-primary-500',
    error: 'border-danger-300 focus:border-danger-500 focus:ring-danger-500',
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-4 py-3 text-base',
  };

  return `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`;
};

// Checkbox variants
export const checkboxVariants = ({
  size = 'md',
  color = 'primary'
}: {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'danger';
} = {}) => {
  const baseClasses = 'rounded border-2 border-gray-300 text-white focus:ring-2 focus:ring-offset-2 transition-colors cursor-pointer';

  const colorClasses = {
    primary: 'checked:bg-blue-600 checked:border-blue-600 focus:ring-blue-500',
    success: 'checked:bg-green-600 checked:border-green-600 focus:ring-green-500',
    warning: 'checked:bg-yellow-600 checked:border-yellow-600 focus:ring-yellow-500',
    danger: 'checked:bg-red-600 checked:border-red-600 focus:ring-red-500',
  };

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return `${baseClasses} ${colorClasses[color]} ${sizeClasses[size]}`;
};

// Radio variants
export const radioVariants = ({
  size = 'md',
  color = 'primary'
}: {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'danger';
} = {}) => {
  const baseClasses = 'rounded-full border-2 border-gray-300 text-white focus:ring-2 focus:ring-offset-2 transition-colors cursor-pointer';

  const colorClasses = {
    primary: 'checked:bg-blue-600 checked:border-blue-600 focus:ring-blue-500',
    success: 'checked:bg-green-600 checked:border-green-600 focus:ring-green-500',
    warning: 'checked:bg-yellow-600 checked:border-yellow-600 focus:ring-yellow-500',
    danger: 'checked:bg-red-600 checked:border-red-600 focus:ring-red-500',
  };

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return `${baseClasses} ${colorClasses[color]} ${sizeClasses[size]}`;
};

// Progress variants
export const progressVariants = ({
  variant = 'primary',
  size = 'md'
}: {
  variant?: 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
} = {}) => {
  const baseClasses = 'w-full bg-gray-200 rounded-full overflow-hidden';

  const variantClasses = {
    primary: 'bg-blue-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    danger: 'bg-red-600',
  };

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  return {
    container: `${baseClasses} ${sizeClasses[size]}`,
    bar: variantClasses[variant],
  };
};

// Avatar variants
export const avatarVariants = ({
  size = 'md',
  shape = 'circle'
}: {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  shape?: 'circle' | 'square' | 'rounded';
} = {}) => {
  const baseClasses = 'bg-gray-300 text-white font-medium flex items-center justify-center overflow-hidden';

  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
  };

  const shapeClasses = {
    circle: 'rounded-full',
    square: 'rounded-none',
    rounded: 'rounded-lg',
  };

  return `${baseClasses} ${sizeClasses[size]} ${shapeClasses[shape]}`;
};

// Skeleton variants
export const skeletonVariants = ({
  variant = 'default',
  animation = 'pulse'
}: {
  variant?: 'default' | 'text' | 'title' | 'avatar';
  animation?: 'pulse' | 'wave' | 'none';
} = {}) => {
  const baseClasses = 'bg-gray-200';

  const variantClasses = {
    default: 'rounded',
    text: 'h-4 rounded',
    title: 'h-6 rounded w-3/4',
    avatar: 'rounded-full',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-pulse', // Simplified, wave would need custom CSS
    none: '',
  };

  return `${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]}`;
};

// Alert/Notification variants
export const alertVariants = ({
  variant = 'info',
  size = 'md'
}: {
  variant?: 'info' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
} = {}) => {
  const baseClasses = 'rounded-lg border transition-all duration-200';

  const variantClasses = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  };

  const sizeClasses = {
    sm: 'p-3 text-sm',
    md: 'p-4 text-base',
    lg: 'p-6 text-lg',
  };

  return `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`;
};

// Label variants
export const labelVariants = ({
  size = 'md',
  required = false
}: {
  size?: 'sm' | 'md' | 'lg';
  required?: boolean;
} = {}) => {
  const baseClasses = 'block font-medium text-gray-700';

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-sm',
    lg: 'text-base',
  };

  const requiredClasses = required ? 'after:content-["*"] after:text-red-500 after:ml-1' : '';

  return `${baseClasses} ${sizeClasses[size]} ${requiredClasses}`.trim();
};

// Page Header variants
export const pageHeaderVariants = ({
  size = 'md',
  align = 'left'
}: {
  size?: 'sm' | 'md' | 'lg';
  align?: 'left' | 'center' | 'right';
} = {}) => {
  const baseClasses = 'mb-8';

  const sizeClasses = {
    sm: 'space-y-2',
    md: 'space-y-4',
    lg: 'space-y-6',
  };

  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return `${baseClasses} ${sizeClasses[size]} ${alignClasses[align]}`;
};

// Section variants
export const sectionVariants = ({
  spacing = 'md',
  divider = false
}: {
  spacing?: 'sm' | 'md' | 'lg' | 'xl';
  divider?: boolean;
} = {}) => {
  const baseClasses = 'py-8';

  const spacingClasses = {
    sm: 'py-4',
    md: 'py-8',
    lg: 'py-12',
    xl: 'py-16',
  };

  const dividerClasses = divider ? 'border-b border-gray-200' : '';

  return `${baseClasses} ${spacingClasses[spacing]} ${dividerClasses}`.trim();
};

// InfoBox variants
export const infoBoxVariants = ({
  variant = 'info',
  size = 'md'
}: {
  variant?: 'info' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
} = {}) => {
  const baseClasses = 'rounded-lg border-l-4 p-4 bg-gray-50';

  const variantClasses = {
    info: 'border-blue-400 bg-blue-50 text-blue-800',
    success: 'border-green-400 bg-green-50 text-green-800',
    warning: 'border-yellow-400 bg-yellow-50 text-yellow-800',
    error: 'border-red-400 bg-red-50 text-red-800',
  };

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`;
};

// Metrics Display variants
export const metricsDisplayVariants = ({
  variant = 'default',
  size = 'md'
}: {
  variant?: 'default' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
} = {}) => {
  const baseClasses = 'bg-white p-4 rounded-lg border border-gray-200 transition-all duration-200';

  const variantClasses = {
    default: 'text-gray-700',
    success: 'text-green-700 border-green-200 bg-green-50',
    warning: 'text-yellow-700 border-yellow-200 bg-yellow-50',
    danger: 'text-red-700 border-red-200 bg-red-50',
  };

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`;
};

// ================================
// Utility Variants
// ================================

// Spacing variants
export const spacingVariants = ({
  size = 'md',
  direction = 'vertical'
}: {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  direction?: 'vertical' | 'horizontal';
} = {}) => {
  const sizeClasses = {
    xs: direction === 'vertical' ? 'space-y-1' : 'space-x-1',
    sm: direction === 'vertical' ? 'space-y-2' : 'space-x-2',
    md: direction === 'vertical' ? 'space-y-4' : 'space-x-4',
    lg: direction === 'vertical' ? 'space-y-6' : 'space-x-6',
    xl: direction === 'vertical' ? 'space-y-8' : 'space-x-8',
    '2xl': direction === 'vertical' ? 'space-y-12' : 'space-x-12',
  };

  return sizeClasses[size];
};

// Flex variants
export const flexVariants = ({
  direction = 'row',
  align = 'center',
  justify = 'start',
  wrap = false,
  gap = 'md'
}: {
  direction?: 'row' | 'col';
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
} = {}) => {
  const baseClasses = 'flex';

  const directionClasses = {
    row: 'flex-row',
    col: 'flex-col',
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
    baseline: 'items-baseline',
  };

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
  };

  const wrapClasses = wrap ? 'flex-wrap' : 'flex-nowrap';

  const gapClasses = {
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  };

  return `${baseClasses} ${directionClasses[direction]} ${alignClasses[align]} ${justifyClasses[justify]} ${wrapClasses} ${gapClasses[gap]}`;
};

// Grid utility variants
export const gridUtilityVariants = ({
  cols = 'auto',
  gap = 'md',
  responsive = true
}: {
  cols?: 'auto' | 1 | 2 | 3 | 4 | 6 | 12;
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  responsive?: boolean;
} = {}) => {
  const baseClasses = 'grid';

  const colsClasses = {
    auto: responsive ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-4',
    1: 'grid-cols-1',
    2: responsive ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-2',
    3: responsive ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-3',
    4: responsive ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-4',
    6: responsive ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6' : 'grid-cols-6',
    12: responsive ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-12' : 'grid-cols-12',
  };

  const gapClasses = {
    xs: 'gap-2',
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  };

  return `${baseClasses} ${colsClasses[cols]} ${gapClasses[gap]}`;
};

// Animation variants
export const animationVariants = ({
  type = 'fade',
  duration = 'normal',
  easing = 'ease'
}: {
  type?: 'fade' | 'slide' | 'scale' | 'bounce' | 'spin' | 'ping';
  duration?: 'fast' | 'normal' | 'slow';
  easing?: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
} = {}) => {
  const typeClasses = {
    fade: 'opacity-0 animate-fade-in',
    slide: 'transform translate-x-full animate-slide-in',
    scale: 'transform scale-0 animate-scale-in',
    bounce: 'animate-bounce',
    spin: 'animate-spin',
    ping: 'animate-ping',
  };

  const durationClasses = {
    fast: 'duration-150',
    normal: 'duration-300',
    slow: 'duration-500',
  };

  const easingClasses = {
    linear: 'ease-linear',
    ease: 'ease',
    'ease-in': 'ease-in',
    'ease-out': 'ease-out',
    'ease-in-out': 'ease-in-out',
  };

  return `${typeClasses[type] || ''} ${durationClasses[duration]} ${easingClasses[easing]}`.trim();
};

// Shadow variants
export const shadowVariants = ({
  size = 'md',
  color = 'gray'
}: {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'inner';
  color?: 'gray' | 'blue' | 'green' | 'red' | 'yellow' | 'purple';
} = {}) => {
  const sizeClasses = {
    xs: 'shadow-xs',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    '2xl': 'shadow-2xl',
    inner: 'shadow-inner',
  };

  const colorClasses = {
    gray: '',
    blue: 'shadow-blue-500/50',
    green: 'shadow-green-500/50',
    red: 'shadow-red-500/50',
    yellow: 'shadow-yellow-500/50',
    purple: 'shadow-purple-500/50',
  };

  return `${sizeClasses[size]} ${colorClasses[color]}`.trim();
};

// Border variants
export const borderVariants = ({
  width = 'default',
  style = 'solid',
  color = 'gray',
  radius = 'md'
}: {
  width?: 'thin' | 'default' | 'thick' | 'extra';
  style?: 'solid' | 'dashed' | 'dotted' | 'double';
  color?: 'gray' | 'blue' | 'green' | 'red' | 'yellow' | 'purple';
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
} = {}) => {
  const widthClasses = {
    thin: 'border',
    default: 'border-2',
    thick: 'border-4',
    extra: 'border-8',
  };

  const styleClasses = {
    solid: 'border-solid',
    dashed: 'border-dashed',
    dotted: 'border-dotted',
    double: 'border-double',
  };

  const colorClasses = {
    gray: 'border-gray-300',
    blue: 'border-blue-500',
    green: 'border-green-500',
    red: 'border-red-500',
    yellow: 'border-yellow-500',
    purple: 'border-purple-500',
  };

  const radiusClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full',
  };

  return `${widthClasses[width]} ${styleClasses[style]} ${colorClasses[color]} ${radiusClasses[radius]}`;
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
export type AlertVariants = Parameters<typeof alertVariants>[0];
export type SelectVariants = Parameters<typeof selectVariants>[0];
export type CheckboxVariants = Parameters<typeof checkboxVariants>[0];
export type RadioVariants = Parameters<typeof radioVariants>[0];
export type ProgressVariants = Parameters<typeof progressVariants>[0];
export type AvatarVariants = Parameters<typeof avatarVariants>[0];
export type SkeletonVariants = Parameters<typeof skeletonVariants>[0];
export type SpacingVariants = Parameters<typeof spacingVariants>[0];
export type FlexVariants = Parameters<typeof flexVariants>[0];
export type GridUtilityVariants = Parameters<typeof gridUtilityVariants>[0];
export type AnimationVariants = Parameters<typeof animationVariants>[0];
export type ShadowVariants = Parameters<typeof shadowVariants>[0];
export type BorderVariants = Parameters<typeof borderVariants>[0];
export type LayoutVariants = any;
export type SidebarVariants = any;
export type MainContentVariants = any;
export type LogMonitorVariants = any;
export type LogEntryVariants = any;
export type LogLevelBadgeVariants = any;
