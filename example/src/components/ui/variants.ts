/**
 * Centralized component variants using cva (Class Variance Authority)
 * Structured by component categories for better organization and maintainability
 *
 * Benefits of cva:
 * - No Panda CSS dependency - pure Tailwind CSS solution
 * - Type-safe variant combinations
 * - Lightweight and performant
 * - Full TypeScript support with autocomplete
 *
 * Categories:
 * - Core: Basic UI components (buttons, cards, grids)
 * - Forms: Form-related components (inputs, selects, checkboxes)
 * - Layout: Layout and positioning components (containers, flex, spacing)
 * - UI: Specialized UI components (alerts, badges, avatars)
 * - Specialized: Domain-specific or advanced UI components
 * - Utilities: Generic utility variants for common styling needs
 */

// ================================
// 1. CORE COMPONENTS
// Basic building blocks for UI
// ================================

export const cardVariants = ({
  variant = 'default',
  size = 'md',
  hover = false,
  category = 'default',
}: {
  variant?: 'default' | 'elevated' | 'outlined' | 'bordered' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  hover?: boolean;
  category?: string;
} = {}) => {
  const baseClasses =
    'bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl transition-all duration-300';

  const variantClasses = {
    default: 'shadow-lg shadow-gray-200/50',
    elevated: 'shadow-2xl shadow-gray-300/50',
    outlined: 'shadow-none border-2 border-gray-200/50',
    bordered: 'border-2 border-gray-300/50 shadow-none',
    glass:
      'bg-white/60 backdrop-blur-md border-white/30 shadow-xl shadow-gray-200/30',
  };

  const sizeClasses = {
    sm: 'p-5',
    md: 'p-6',
    lg: 'p-8',
  };

  const hoverClasses = hover
    ? 'hover:shadow-2xl hover:shadow-gray-300/60 hover:-translate-y-1 hover:bg-white/90'
    : '';

  const categoryBorderClasses: Record<string, string> = {
    core: 'border-l-4 border-l-red-400',
    store: 'border-l-4 border-l-emerald-400',
    pipeline: 'border-l-4 border-l-orange-400',
    react: 'border-l-4 border-l-purple-400',
    logger: 'border-l-4 border-l-amber-400',
    actionguard: 'border-l-4 border-l-pink-400',
    conditional: 'border-l-4 border-l-cyan-400',
    examples: 'border-l-4 border-l-orange-400',
    refs: 'border-l-4 border-l-blue-400',
    demos: 'border-l-4 border-l-emerald-400',
    performance: 'border-l-4 border-l-red-400',
    utilities: 'border-l-4 border-l-teal-400',
    debug: 'border-l-4 border-l-indigo-400',
    default: '',
  };

  return `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${hoverClasses} ${categoryBorderClasses[category] || ''}`.trim();
};

export const buttonVariants = ({
  variant = 'primary',
  size = 'md',
}: {
  variant?:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'outline'
    | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
} = {}) => {
  const baseClasses =
    'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-lg hover:shadow-xl gap-2';

  const variantClasses = {
    primary:
      'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 focus:ring-blue-500 border border-blue-400/20',
    secondary:
      'bg-gradient-to-r from-slate-600 to-slate-700 text-white hover:from-slate-700 hover:to-slate-800 focus:ring-slate-500 border border-slate-500/20',
    success:
      'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 focus:ring-emerald-500 border border-emerald-400/20',
    warning:
      'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 focus:ring-amber-500 border border-amber-400/20',
    danger:
      'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 focus:ring-red-500 border border-red-400/20',
    info: 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white hover:from-cyan-600 hover:to-cyan-700 focus:ring-cyan-500 border border-cyan-400/20',
    outline:
      'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 focus:ring-blue-500 shadow-md',
    ghost:
      'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-blue-500 border border-transparent',
  };

  const sizeClasses = {
    xs: 'px-3 py-1.5 text-xs',
    sm: 'px-4 py-2 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg',
  };

  return `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`;
};

export const gridVariants = ({
  cols = 'auto',
  gap = 'md',
}: {
  cols?: 1 | 2 | 3 | 4 | 'auto';
  gap?: 'sm' | 'md' | 'lg';
} = {}) => {
  const baseClasses = 'grid';

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
// 3. LAYOUT COMPONENTS
// Positioning, containers, and layout utilities
// ================================

export const inputVariants = ({
  variant = 'default',
  size = 'md',
}: {
  variant?: 'default' | 'error' | 'success';
  size?: 'sm' | 'md' | 'lg';
} = {}) => {
  const baseClasses =
    'block w-full rounded-xl border-2 bg-white/60 backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 shadow-sm hover:shadow-md';

  const variantClasses = {
    default:
      'border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 placeholder:text-gray-400',
    error:
      'border-red-200 focus:border-red-400 focus:ring-red-400/20 placeholder:text-red-300',
    success:
      'border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400/20 placeholder:text-emerald-300',
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-4 py-3 text-base',
  };

  return `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`;
};

export const badgeVariants = ({
  variant = 'default',
}: {
  variant?:
    | 'default'
    | 'primary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'outline';
} = {}) => {
  const baseClasses =
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium';

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
  status = 'neutral',
}: {
  status?: 'safe' | 'warning' | 'danger' | 'info' | 'neutral';
} = {}) => {
  const baseClasses =
    'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium';

  const statusClasses = {
    safe: 'bg-success-50 text-success-700 border border-success-200',
    warning: 'bg-warning-50 text-warning-700 border border-warning-200',
    danger: 'bg-danger-50 text-danger-700 border border-danger-200',
    info: 'bg-primary-50 text-primary-700 border border-primary-200',
    neutral: 'bg-gray-50 text-gray-700 border border-gray-200',
  };

  return `${baseClasses} ${statusClasses[status]}`;
};

export const metricsDisplayVariants = ({
  variant = 'default',
  size = 'md',
}: {
  variant?: 'default' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
} = {}) => {
  const baseClasses =
    'bg-white p-4 rounded-lg border border-gray-200 transition-all duration-200';

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
// 4. UI COMPONENTS
// Visual feedback and specialized UI elements
// ================================

// Demo Card variants (modern glassmorphism design)
export const demoCardVariants = ({
  variant = 'default',
}: {
  variant?: 'default' | 'info' | 'success' | 'warning' | 'glass';
} = {}) => {
  const baseClasses =
    'rounded-2xl p-6 shadow-lg shadow-gray-200/50 transition-all duration-300 hover:shadow-xl hover:shadow-gray-300/60 hover:-translate-y-0.5';

  const variantClasses = {
    default: 'bg-white/80 backdrop-blur-sm border border-white/20',
    info: 'bg-gradient-to-br from-blue-50 to-blue-100/80 backdrop-blur-sm border border-blue-200/30',
    success:
      'bg-gradient-to-br from-emerald-50 to-emerald-100/80 backdrop-blur-sm border border-emerald-200/30',
    warning:
      'bg-gradient-to-br from-amber-50 to-amber-100/80 backdrop-blur-sm border border-amber-200/30',
    glass:
      'bg-white/60 backdrop-blur-md border border-white/30 shadow-xl shadow-gray-200/30',
  };

  return `${baseClasses} ${variantClasses[variant]}`;
};

// LoggerPage specific variants - enhanced theme
export const loggerDemoCardVariants = ({
  type = 'default',
}: {
  type?: 'default' | 'memory' | 'factory';
} = {}) => {
  const baseClasses =
    'rounded-2xl p-6 shadow-lg shadow-gray-200/50 transition-all duration-300 hover:shadow-xl hover:shadow-gray-300/60 hover:-translate-y-0.5';

  const typeClasses = {
    default:
      'bg-gradient-to-br from-blue-50 to-blue-100/80 backdrop-blur-sm border border-blue-200/30',
    memory:
      'bg-gradient-to-br from-purple-50 to-purple-100/80 backdrop-blur-sm border border-purple-200/30',
    factory:
      'bg-gradient-to-br from-emerald-50 to-emerald-100/80 backdrop-blur-sm border border-emerald-200/30',
  };

  return `${baseClasses} ${typeClasses[type]}`;
};

export const loggerButtonVariants = ({
  variant = 'primary',
  type = 'console',
}: {
  variant?: 'primary' | 'secondary' | 'success';
  type?: 'console' | 'memory' | 'factory';
} = {}) => {
  const baseClasses =
    'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-lg hover:shadow-xl gap-2 px-4 py-2.5 text-sm';

  const typeColors = {
    console: {
      primary:
        'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 focus:ring-blue-500 border border-blue-400/20',
      secondary:
        'bg-gradient-to-r from-slate-600 to-slate-700 text-white hover:from-slate-700 hover:to-slate-800 focus:ring-slate-500 border border-slate-500/20',
      success:
        'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 focus:ring-emerald-500 border border-emerald-400/20',
    },
    memory: {
      primary:
        'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 focus:ring-purple-500 border border-purple-400/20',
      secondary:
        'bg-gradient-to-r from-slate-600 to-slate-700 text-white hover:from-slate-700 hover:to-slate-800 focus:ring-slate-500 border border-slate-500/20',
      success:
        'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 focus:ring-emerald-500 border border-emerald-400/20',
    },
    factory: {
      primary:
        'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 focus:ring-emerald-500 border border-emerald-400/20',
      secondary:
        'bg-gradient-to-r from-slate-600 to-slate-700 text-white hover:from-slate-700 hover:to-slate-800 focus:ring-slate-500 border border-slate-500/20',
      success:
        'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 focus:ring-green-500 border border-green-400/20',
    },
  };

  return `${baseClasses} ${typeColors[type][variant]}`;
};

export const loggerInputVariants = ({
  type = 'console',
}: {
  type?: 'console' | 'memory' | 'factory';
} = {}) => {
  const baseClasses =
    'block w-full rounded-xl border-2 bg-white/60 backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 shadow-sm hover:shadow-md px-3 py-2 text-sm';

  const typeClasses = {
    console:
      'border-blue-200 focus:border-blue-400 focus:ring-blue-400/20 placeholder:text-blue-400',
    memory:
      'border-purple-200 focus:border-purple-400 focus:ring-purple-400/20 placeholder:text-purple-400',
    factory:
      'border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400/20 placeholder:text-emerald-400',
  };

  return `${baseClasses} ${typeClasses[type]}`;
};

// HooksPage specific variants - performance theme
export const hooksDemoCardVariants = ({
  type = 'default',
}: {
  type?: 'default' | 'memoization' | 'handlers' | 'memory';
} = {}) => {
  const baseClasses =
    'rounded-2xl p-6 shadow-lg shadow-gray-200/50 transition-all duration-300 hover:shadow-xl hover:shadow-gray-300/60 hover:-translate-y-0.5';

  const typeClasses = {
    default:
      'bg-gradient-to-br from-cyan-50 to-cyan-100/80 backdrop-blur-sm border border-cyan-200/30',
    memoization:
      'bg-gradient-to-br from-indigo-50 to-indigo-100/80 backdrop-blur-sm border border-indigo-200/30',
    handlers:
      'bg-gradient-to-br from-pink-50 to-pink-100/80 backdrop-blur-sm border border-pink-200/30',
    memory:
      'bg-gradient-to-br from-orange-50 to-orange-100/80 backdrop-blur-sm border border-orange-200/30',
  };

  return `${baseClasses} ${typeClasses[type]}`;
};

export const hooksButtonVariants = ({
  variant = 'primary',
  type = 'memoization',
}: {
  variant?: 'primary' | 'secondary' | 'warning';
  type?: 'memoization' | 'handlers' | 'memory';
} = {}) => {
  const baseClasses =
    'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-lg hover:shadow-xl gap-2 px-4 py-2.5 text-sm';

  const typeColors = {
    memoization: {
      primary:
        'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:from-indigo-600 hover:to-indigo-700 focus:ring-indigo-500 border border-indigo-400/20',
      secondary:
        'bg-gradient-to-r from-slate-600 to-slate-700 text-white hover:from-slate-700 hover:to-slate-800 focus:ring-slate-500 border border-slate-500/20',
      warning:
        'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 focus:ring-amber-500 border border-amber-400/20',
    },
    handlers: {
      primary:
        'bg-gradient-to-r from-pink-500 to-pink-600 text-white hover:from-pink-600 hover:to-pink-700 focus:ring-pink-500 border border-pink-400/20',
      secondary:
        'bg-gradient-to-r from-slate-600 to-slate-700 text-white hover:from-slate-700 hover:to-slate-800 focus:ring-slate-500 border border-slate-500/20',
      warning:
        'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 focus:ring-amber-500 border border-amber-400/20',
    },
    memory: {
      primary:
        'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 focus:ring-orange-500 border border-orange-400/20',
      secondary:
        'bg-gradient-to-r from-slate-600 to-slate-700 text-white hover:from-slate-700 hover:to-slate-800 focus:ring-slate-500 border border-slate-500/20',
      warning:
        'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 focus:ring-red-500 border border-red-400/20',
    },
  };

  return `${baseClasses} ${typeColors[type][variant]}`;
};

// Page layout variants
export const pageContainerVariants = () =>
  'max-w-full w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-x-hidden';

export const generalPageHeaderVariants = () => 'mb-8';

export const pageTitleVariants = () =>
  'text-xl font-bold text-gray-900 dark:text-white';

export const pageDescriptionVariants = () =>
  'text-lg text-gray-600 leading-relaxed';

// Form controls variants

// Form controls variants
export const controlGroupVariants = () => 'flex gap-2';

export const controlLabelVariants = () => 'text-sm font-medium text-gray-700';

export const rangeInputVariants = () =>
  'flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

// Button group variants
export const buttonGroupVariants = () => 'flex flex-wrap gap-2';

// Logger specific variants
export const logLevelSelectorVariants = () => 'mb-4 flex gap-2 items-center';

export const memoryLogContainerVariants = () =>
  'max-h-48 overflow-y-auto bg-gray-50 rounded-lg border border-gray-200 p-3';

export const loggerInfoVariants = () => 'space-y-4';

export const factoryControlsVariants = () => 'space-y-4';

// Code example variants
export const codeExampleVariants = () =>
  'mt-8 bg-white rounded-lg border border-gray-200 p-6 shadow-sm';

export const codeExampleTitleVariants = () =>
  'text-lg font-bold text-gray-900 mb-4';

// Optimization controls variants
export const optimizationControlsVariants = () => 'space-y-4';

export const handlerStatusVariants = ({
  active = false,
}: {
  active?: boolean;
} = {}) => {
  const baseClasses = 'flex items-center gap-2 p-2 rounded-lg border';
  const activeClasses = active
    ? 'bg-green-50 border-green-200 text-green-800'
    : 'bg-gray-50 border-gray-200 text-gray-600';

  return `${baseClasses} ${activeClasses}`;
};

export const handlerItemVariants = () =>
  'flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200';

export const handlerInfoVariants = () => 'flex-1';

export const handlerControlsVariants = () => 'flex gap-1';

export const dynamicHandlersVariants = () => 'space-y-3';

// Memory controls variants
export const memoryControlsVariants = () => 'space-y-4';

export const memoryStatsVariants = () => 'grid grid-cols-2 gap-4 mt-4';

export const statCardVariants = () =>
  'p-4 bg-white rounded-lg border border-gray-200 shadow-sm text-center';

// Select input variants
export const selectInputVariants = () =>
  'px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

// Text input variants
export const textInputVariants = ({
  size = 'default',
}: {
  size?: 'default' | 'small';
} = {}) => {
  const baseClasses =
    'border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500';
  const sizeClasses = size === 'small' ? 'px-3 py-1 text-sm' : 'px-3 py-2';

  return `${baseClasses} ${sizeClasses}`;
};

// Log Monitor variants
export const logEntryVariants = ({
  type = 'system',
  level = 'info',
}: {
  type?: 'action' | 'system' | 'performance' | 'error';
  level?: 'debug' | 'info' | 'warn' | 'error' | 'trace';
} = {}) => {
  const baseClasses = 'p-3 rounded-lg border text-sm';

  // type에 따른 배경색
  const typeClasses = {
    action: 'bg-blue-50 border-blue-200 text-blue-800',
    system: 'bg-gray-50 border-gray-200 text-gray-700',
    performance: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  };

  // level에 따른 추가 스타일 (필요시)
  const levelClasses = {
    debug: '',
    info: '',
    warn: 'font-medium',
    error: 'font-semibold',
    trace: 'opacity-75',
  };

  return `${baseClasses} ${typeClasses[type]} ${levelClasses[level]}`;
};

export const logLevelBadgeVariants = ({
  level = 'info',
}: {
  level?: 'debug' | 'info' | 'warn' | 'error' | 'trace';
} = {}) => {
  const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium uppercase';

  const levelClasses = {
    debug: 'bg-gray-100 text-gray-800',
    info: 'bg-blue-100 text-blue-800',
    warn: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    trace: 'bg-purple-100 text-purple-800',
  };

  return `${baseClasses} ${levelClasses[level]}`;
};

// Toast variants
export const toastContainerVariants = ({
  position = 'top-right',
  width = 'sm',
}: {
  position?:
    | 'top-right'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-left'
    | 'top-center'
    | 'bottom-center';
  width?: 'sm' | 'md' | 'lg';
} = {}) => {
  const baseClasses = 'fixed z-50 flex flex-col gap-2 p-4 pointer-events-none';

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
  };

  const widthClasses = {
    sm: 'w-80',
    md: 'w-96',
    lg: 'w-[28rem]',
  };

  return `${baseClasses} ${positionClasses[position]} ${widthClasses[width]}`;
};

// Toast variants
export const toastVariants = ({
  type = 'info',
  phase = 'entering',
  executionStep,
}: {
  type?: 'info' | 'success' | 'error' | 'warning' | 'action';
  phase?: 'entering' | 'visible' | 'exiting' | 'exited';
  executionStep?: number;
} = {}) => {
  const baseClasses =
    'relative transition-all duration-200 pointer-events-auto';

  // Type-based styling
  const typeClasses = {
    info: 'bg-blue-500/90 text-white',
    success: 'bg-green-500/90 text-white',
    error: 'bg-red-500/90 text-white',
    warning: 'bg-yellow-500/90 text-black',
    action: 'bg-purple-500/90 text-white',
  };

  // Phase-based styling
  const phaseClasses = {
    entering: 'opacity-0 translate-y-2 scale-95',
    visible: 'opacity-100 translate-y-0 scale-100',
    exiting: 'opacity-0 translate-y-2 scale-95',
    exited: 'opacity-0',
  };

  // Execution step styling for action toasts
  const executionClasses =
    executionStep !== undefined
      ? `border-l-4 ${
          executionStep === 0
            ? 'border-l-green-400'
            : executionStep === 1
              ? 'border-l-blue-400'
              : executionStep === 2
                ? 'border-l-purple-400'
                : 'border-l-gray-400'
        }`
      : '';

  return `${baseClasses} ${typeClasses[type]} ${phaseClasses[phase]} ${executionClasses}`.trim();
};

// Typography variants - improved hierarchy
export const textTitleVariants = ({
  variant = 'section',
}: {
  variant?: 'section' | 'card' | 'subsection' | 'hero';
} = {}) => {
  const baseClasses = 'font-bold tracking-tight';

  const variantClasses = {
    hero: 'text-4xl lg:text-5xl text-gray-900 mb-6 leading-tight',
    section: 'text-2xl lg:text-3xl text-gray-900 mb-4 leading-tight',
    card: 'text-xl lg:text-2xl text-gray-900 mb-3 leading-snug',
    subsection:
      'text-lg lg:text-xl text-gray-800 mb-3 leading-snug font-semibold',
  };

  return `${baseClasses} ${variantClasses[variant]}`;
};

export const textHintVariants = ({
  size = 'default',
}: {
  size?: 'default' | 'xs';
} = {}) => {
  const baseClasses = 'text-gray-600';

  const sizeClasses = {
    default: 'text-sm',
    xs: 'text-xs text-gray-500',
  };

  return `${baseClasses} ${sizeClasses[size]}`;
};

// Flex variants
export const flexVariants = ({
  direction = 'row',
  align = 'center',
  justify = 'start',
  wrap = false,
  gap = 'md',
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
  responsive = true,
}: {
  cols?: 'auto' | 1 | 2 | 3 | 4 | 6 | 12;
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  responsive?: boolean;
} = {}) => {
  const baseClasses = 'grid';

  const colsClasses = {
    auto: responsive
      ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
      : 'grid-cols-4',
    1: 'grid-cols-1',
    2: responsive ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-2',
    3: responsive ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-3',
    4: responsive ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-4',
    6: responsive
      ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6'
      : 'grid-cols-6',
    12: responsive
      ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-12'
      : 'grid-cols-12',
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

// ================================
// Type Definitions for Compatibility
// ================================

export type CardVariants = Parameters<typeof cardVariants>[0];
export type ButtonVariants = Parameters<typeof buttonVariants>[0];
export type ToastVariants = Parameters<typeof toastVariants>[0];
