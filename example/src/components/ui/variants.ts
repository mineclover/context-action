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

// Select variants
export const selectVariants = ({
  size = 'md',
  variant = 'default',
}: {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'error';
} = {}) => {
  const baseClasses =
    'block w-full rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 bg-white';

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
  color = 'primary',
}: {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'danger';
} = {}) => {
  const baseClasses =
    'rounded border-2 border-gray-300 text-white focus:ring-2 focus:ring-offset-2 transition-colors cursor-pointer';

  const colorClasses = {
    primary: 'checked:bg-blue-600 checked:border-blue-600 focus:ring-blue-500',
    success:
      'checked:bg-green-600 checked:border-green-600 focus:ring-green-500',
    warning:
      'checked:bg-yellow-600 checked:border-yellow-600 focus:ring-yellow-500',
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
  color = 'primary',
}: {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'danger';
} = {}) => {
  const baseClasses =
    'rounded-full border-2 border-gray-300 text-white focus:ring-2 focus:ring-offset-2 transition-colors cursor-pointer';

  const colorClasses = {
    primary: 'checked:bg-blue-600 checked:border-blue-600 focus:ring-blue-500',
    success:
      'checked:bg-green-600 checked:border-green-600 focus:ring-green-500',
    warning:
      'checked:bg-yellow-600 checked:border-yellow-600 focus:ring-yellow-500',
    danger: 'checked:bg-red-600 checked:border-red-600 focus:ring-red-500',
  };

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return `${baseClasses} ${colorClasses[color]} ${sizeClasses[size]}`;
};

export const pageVariants = ({
  variant = 'default',
}: {
  variant?: 'default' | 'withSidebar';
} = {}) => {
  const baseClasses = 'min-h-screen bg-gray-50 py-6';

  const variantClasses = {
    default: 'px-6',
    withSidebar: 'px-6',
  };

  return `${baseClasses} ${variantClasses[variant]}`;
};

export const layoutContainerVariants = ({
  size = 'large',
}: {
  size?: 'default' | 'large';
} = {}) => {
  const baseClasses = 'max-w-none mx-auto space-y-6';

  const sizeClasses = {
    default: 'max-w-4xl',
    large: 'max-w-7xl',
  };

  return `${baseClasses} ${sizeClasses[size]}`;
};

// Stat Card variants
export const statTitleVariants = () =>
  'font-semibold text-sm text-gray-600 mb-2';

export const statValueVariants = ({
  color = 'blue',
}: {
  color?: 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'gray';
} = {}) => {
  const baseClasses = 'font-bold';

  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    orange: 'text-orange-600',
    purple: 'text-purple-600',
    gray: 'text-gray-600',
  };

  return `${baseClasses} text-2xl ${colorClasses[color]}`;
};

export const statValueSizeVariants = ({
  size = 'default',
  color = 'blue',
}: {
  size?: 'default' | 'lg' | 'mono';
  color?: 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'gray';
} = {}) => {
  const baseClasses = 'font-bold';

  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    orange: 'text-orange-600',
    purple: 'text-purple-600',
    gray: 'text-gray-600',
  };

  const sizeClasses = {
    default: 'text-2xl',
    lg: 'text-3xl',
    mono: 'text-2xl font-mono',
  };

  return `${baseClasses} ${sizeClasses[size]} ${colorClasses[color]}`;
};

export const statHintVariants = () => 'text-xs text-gray-500 mt-1';

// Tech Section variants
export const techSectionGridVariants = () =>
  'grid grid-cols-1 gap-6 lg:grid-cols-2';

export const techTitleVariants = ({
  color = 'blue',
}: {
  color?: 'blue' | 'green';
} = {}) => {
  const baseClasses = 'font-semibold mb-3';

  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
  };

  return `${baseClasses} ${colorClasses[color]}`;
};

export const techListVariants = () => 'space-y-2 text-sm text-gray-700';

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

// Store state subscriber variants (for MutableStore demo)
export const storeSubscriberVariants = ({
  type = 'normal',
}: {
  type?: 'normal' | 'fullState';
} = {}) => {
  const baseClasses = 'p-2 rounded border';

  const typeClasses = {
    normal: 'bg-gray-50 dark:bg-gray-800 border-gray-200',
    fullState: 'bg-red-50 dark:bg-red-900/20 border-red-200',
  };

  return `${baseClasses} ${typeClasses[type]}`;
};

export const subscriberHeaderVariants = () =>
  'flex justify-between items-center';

export const subscriberLabelVariants = ({
  type = 'normal',
}: {
  type?: 'normal' | 'fullState';
} = {}) => {
  const baseClasses = 'text-xs font-semibold';

  const typeClasses = {
    normal: 'text-gray-700 dark:text-gray-300',
    fullState: 'text-red-700 dark:text-red-400',
  };

  return `${baseClasses} ${typeClasses[type]}`;
};

export const renderCountBadgeVariants = ({
  isRendered = false,
}: {
  isRendered?: boolean;
} = {}) => {
  const baseClasses = 'text-[10px] px-1.5 py-0.5 rounded-full';

  const renderClasses = isRendered
    ? 'bg-amber-400 text-black'
    : 'bg-green-500 text-white';

  return `${baseClasses} ${renderClasses}`;
};

export const subscriberValueVariants = () =>
  'text-lg font-medium text-gray-900 dark:text-white mt-1';

export const subscriberPathVariants = () =>
  'text-[9px] font-mono text-gray-400 mt-0.5';

// MutableStore demo button variants
export const mutableStoreButtonVariants = ({
  color = 'blue',
}: {
  color?: 'blue' | 'violet' | 'green' | 'teal' | 'orange' | 'pink' | 'gray';
} = {}) => {
  const baseClasses =
    'px-2 py-1 text-xs font-medium rounded cursor-pointer border-none text-white';

  const colorClasses = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    violet: 'bg-violet-600 hover:bg-violet-700',
    green: 'bg-green-600 hover:bg-green-700',
    teal: 'bg-teal-600 hover:bg-teal-700',
    orange: 'bg-orange-500 hover:bg-orange-600',
    pink: 'bg-pink-600 hover:bg-pink-700',
    gray: 'bg-gray-500 hover:bg-gray-600',
  };

  return `${baseClasses} ${colorClasses[color]}`;
};

// Control panel variants
export const controlPanelVariants = ({
  theme = 'light',
}: {
  theme?: 'light' | 'dark';
} = {}) => {
  const baseClasses = 'rounded-lg p-3';

  const themeClasses = {
    light: 'bg-gray-100',
    dark: 'bg-slate-50 dark:bg-slate-800',
  };

  return `${baseClasses} ${themeClasses[theme]}`;
};

export const controlPanelHeaderVariants = ({
  theme = 'light',
}: {
  theme?: 'light' | 'dark';
} = {}) => {
  const baseClasses = 'flex items-center justify-between mb-2';

  const themeClasses = {
    light: '',
    dark: '',
  };

  return `${baseClasses} ${themeClasses[theme]}`;
};

export const controlPanelTitleVariants = ({
  theme = 'light',
}: {
  theme?: 'light' | 'dark';
} = {}) => {
  const baseClasses = 'text-sm font-semibold';

  const themeClasses = {
    light: 'text-gray-700',
    dark: 'text-slate-700 dark:text-slate-200',
  };

  return `${baseClasses} ${themeClasses[theme]}`;
};

export const controlPanelHintVariants = () => 'text-[10px] text-gray-500';

export const controlPanelButtonGroupVariants = () => 'flex flex-wrap gap-1';

// Pattern comparison variants
export const patternCardVariants = ({
  type = 'good',
}: {
  type?: 'good' | 'bad';
} = {}) => {
  const baseClasses = 'rounded-lg p-3';

  const typeClasses = {
    good: 'bg-green-50 dark:bg-green-900/20',
    bad: 'bg-amber-50 dark:bg-amber-900/20',
  };

  return `${baseClasses} ${typeClasses[type]}`;
};

export const patternCardHeaderVariants = () => 'flex items-center gap-2 mb-2';

export const patternIconVariants = ({
  type = 'good',
}: {
  type?: 'good' | 'bad';
} = {}) => {
  const typeClasses = {
    good: 'text-green-600 dark:text-green-400',
    bad: 'text-amber-600 dark:text-amber-400',
  };

  return typeClasses[type];
};

export const patternTitleVariants = ({
  type = 'good',
}: {
  type?: 'good' | 'bad';
} = {}) => {
  const baseClasses = 'text-xs font-semibold';

  const typeClasses = {
    good: 'text-green-700 dark:text-green-300',
    bad: 'text-amber-700 dark:text-amber-300',
  };

  return `${baseClasses} ${typeClasses[type]}`;
};

export const patternButtonGroupVariants = () => 'flex flex-wrap gap-1 mb-3';

// Page layout variants

export const mutableStorePageHeaderVariants = () => 'mb-4';

export const mutableStorePageTitleVariants = () =>
  'text-xl font-bold text-gray-900 dark:text-white';

export const pageGridVariants = ({ cols = 2 }: { cols?: 1 | 2 | 3 } = {}) => {
  const baseClasses = 'grid gap-4 mb-4';

  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 lg:grid-cols-2',
    3: 'grid-cols-1 lg:grid-cols-3',
  };

  return `${baseClasses} ${colClasses[cols]}`;
};

export const keyFeaturesVariants = () =>
  'bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3';

export const keyFeaturesTitleVariants = () =>
  'text-xs font-semibold text-blue-800 dark:text-blue-300 mb-2';

export const keyFeaturesGridVariants = () =>
  'grid grid-cols-3 gap-3 text-[11px]';

// Performance section variants
export const performanceSectionVariants = ({
  span = false,
}: {
  span?: boolean;
} = {}) => {
  const baseClasses = '';

  const spanClasses = span ? 'lg:col-span-2' : '';

  return `${baseClasses} ${spanClasses}`.trim();
};

export const performanceHeaderVariants = () => 'flex items-center gap-2 mb-2';

export const performanceIconVariants = ({
  type = 'good',
}: {
  type?: 'good' | 'bad';
} = {}) => {
  const typeClasses = {
    good: 'text-green-600',
    bad: 'text-red-600',
  };

  return typeClasses[type];
};

export const performanceTitleVariants = ({
  type = 'good',
}: {
  type?: 'good' | 'bad';
} = {}) => {
  const baseClasses = 'text-sm font-semibold';

  const typeClasses = {
    good: 'text-green-700 dark:text-green-400',
    bad: 'text-red-700 dark:text-red-400',
  };

  return `${baseClasses} ${typeClasses[type]}`;
};

export const performanceHintVariants = () => 'text-[10px] text-gray-500';

export const performanceGridVariants = ({
  cols = 'auto',
}: {
  cols?: '2' | '3' | 'auto';
} = {}) => {
  const baseClasses = 'grid gap-2 mb-4';

  const colClasses = {
    '2': 'grid-cols-1 sm:grid-cols-2',
    '3': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    auto: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6',
  };

  return `${baseClasses} ${colClasses[cols]}`;
};

// Key features section variants
export const keyFeaturesCardVariants = () =>
  'bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3';

export const keyFeaturesItemTitleVariants = () =>
  'font-medium text-blue-700 dark:text-blue-400';

export const keyFeaturesItemTextVariants = () =>
  'text-blue-600 dark:text-blue-300';

// Chat demo variants
export const chatHeaderVariants = () =>
  'flex items-center justify-between p-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-t-xl';

export const chatTitleVariants = () => 'flex items-center gap-2';

export const chatBadgeVariants = () =>
  'px-2 py-1 bg-white/20 rounded-full text-xs font-medium';

export const chatActionsVariants = () => 'flex gap-2';

export const chatMessagesVariants = () =>
  'flex-1 p-4 space-y-4 overflow-y-auto max-h-96 bg-gray-50 rounded-b-xl';

export const chatMessageVariants = ({
  isOwn = false,
}: {
  isOwn?: boolean;
} = {}) => {
  const baseClasses = 'flex gap-3 max-w-md';
  const positionClasses = isOwn ? 'ml-auto flex-row-reverse' : '';
  return `${baseClasses} ${positionClasses}`;
};

export const chatMessageAvatarVariants = () =>
  'w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-r from-blue-400 to-purple-500 text-white text-sm';

export const chatMessageContentVariants = () =>
  'bg-white p-3 rounded-2xl shadow-sm border border-gray-100';

export const chatMessageHeaderVariants = () => 'flex items-center gap-2 mb-1';

export const chatMessageSenderVariants = ({
  isOwn = false,
}: {
  isOwn?: boolean;
} = {}) => {
  const baseClasses = 'text-xs font-medium';
  const colorClasses = isOwn ? 'text-blue-600' : 'text-gray-700';
  return `${baseClasses} ${colorClasses}`;
};

export const chatMessageTimeVariants = () => 'text-xs text-gray-500';

export const chatMessageTextVariants = () =>
  'text-sm text-gray-900 leading-relaxed';

export const chatInputAreaVariants = () =>
  'p-4 bg-white border-t border-gray-200 rounded-b-xl';

export const chatInputVariants = () =>
  'flex-1 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none';

export const userSelectorVariants = () => 'flex items-center gap-2 mb-4';

export const userLabelVariants = () => 'text-sm font-medium text-gray-700';

export const userBtnVariants = ({
  active = false,
}: {
  active?: boolean;
} = {}) => {
  const baseClasses = 'px-3 py-1 text-sm rounded-lg transition-all';
  const stateClasses = active
    ? 'bg-blue-500 text-white shadow-md'
    : 'bg-gray-100 text-gray-700 hover:bg-gray-200';
  return `${baseClasses} ${stateClasses}`;
};

export const quickMessagesVariants = () => 'mb-4';

export const quickMessageListVariants = () => 'flex flex-wrap gap-2';

export const quickMessageBtnVariants = () =>
  'px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors';

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

export const hooksStatusVariants = ({
  active = false,
  type = 'handlers',
}: {
  active?: boolean;
  type?: 'handlers' | 'memory';
} = {}) => {
  const baseClasses =
    'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200';

  const activeClasses = active
    ? {
        handlers: 'bg-pink-100 text-pink-800 border border-pink-200',
        memory: 'bg-orange-100 text-orange-800 border border-orange-200',
      }[type]
    : {
        handlers: 'bg-gray-100 text-gray-600 border border-gray-200',
        memory: 'bg-gray-100 text-gray-600 border border-gray-200',
      }[type];

  return `${baseClasses} ${activeClasses}`;
};

export const hooksMetricVariants = ({
  type = 'memory',
}: {
  type?: 'memory' | 'performance';
} = {}) => {
  const baseClasses =
    'p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg shadow-gray-200/50 text-center';

  const typeClasses = {
    memory: 'border-orange-200/30',
    performance: 'border-indigo-200/30',
  };

  return `${baseClasses} ${typeClasses[type]}`;
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

// Range controls variants
export const rangeControlVariants = () => 'flex items-center gap-4';

export const rangeLabelVariants = () =>
  'text-sm font-medium text-gray-700 min-w-[100px]';

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

// Concept list variants
export const conceptListVariants = () => 'space-y-3 text-sm text-gray-700';

export const bestPracticesListVariants = () =>
  'space-y-2 text-sm text-gray-700';

// List variants
export const logLevelListVariants = () =>
  'space-y-2 text-sm text-gray-700 list-disc list-inside';

export const demoDisplayVariants = () =>
  'p-6 bg-gray-50 border border-gray-200 rounded-lg';

export const storeDisplayVariants = () =>
  'p-4 bg-gray-50 border border-gray-200 rounded-lg mb-4';

export const demoValueVariants = () =>
  'text-2xl font-bold text-primary-600 text-center block';

// ================================

// Info Box variants
export const infoBoxVariants = ({
  variant = 'info',
  size = 'md',
}: {
  variant?: 'info' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
} = {}) => {
  const baseClasses = 'rounded-lg text-sm';

  const variantClasses = {
    info: 'bg-blue-50 border border-blue-200 text-blue-800',
    success: 'bg-green-50 border border-green-200 text-green-800',
    warning: 'bg-yellow-50 border border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border border-red-200 text-red-800',
  };

  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  return `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`;
};

export const infoBoxItemVariants = ({
  variant = 'box',
}: {
  variant?: 'box' | 'title' | 'text';
} = {}) => {
  const baseClasses = '';

  const variantClasses = {
    box: 'p-3 rounded-lg border bg-opacity-50',
    title: 'font-medium',
    text: 'mt-1',
  };

  return `${baseClasses} ${variantClasses[variant]}`;
};

// Page Header variants
export const pageHeaderVariants = ({
  size = 'md',
  align = 'left',
}: {
  size?: 'sm' | 'md' | 'lg';
  align?: 'left' | 'center' | 'right';
} = {}) => {
  const baseClasses = 'mb-8 pb-4 border-b border-gray-200';

  const sizeClasses = {
    sm: 'pb-2 mb-6',
    md: 'pb-4 mb-8',
    lg: 'pb-6 mb-10',
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
  divider = false,
}: {
  spacing?: 'sm' | 'md' | 'lg' | 'xl';
  divider?: boolean;
} = {}) => {
  const baseClasses = 'mb-6';

  const spacingClasses = {
    sm: 'space-y-2',
    md: 'space-y-4',
    lg: 'space-y-6',
    xl: 'space-y-8',
  };

  const dividerClass = divider ? 'border-b border-gray-200 pb-6' : '';

  return `${baseClasses} ${spacingClasses[spacing]} ${dividerClass}`;
};

// Empty state variants
export const emptyStateVariants = ({
  size = 'md',
}: {
  size?: 'sm' | 'md' | 'lg';
} = {}) => {
  const baseClasses = 'text-center text-gray-400';

  const sizeClasses = {
    sm: 'py-4',
    md: 'py-8',
    lg: 'py-12',
  };

  return `${baseClasses} ${sizeClasses[size]}`;
};

export const emptyStateIconVariants = ({
  size = 'md',
}: {
  size?: 'sm' | 'md' | 'lg';
} = {}) => {
  const baseClasses = 'mb-2';

  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
  };

  return `${baseClasses} ${sizeClasses[size]}`;
};

export const emptyStateTextVariants = ({
  size = 'md',
}: {
  size?: 'sm' | 'md' | 'lg';
} = {}) => {
  const baseClasses = 'mb-2';

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl',
  };

  return `${baseClasses} ${sizeClasses[size]}`;
};

export const emptyStateHintVariants = () => 'text-sm text-gray-500';

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

// ================================
// 6. UTILITIES
// Generic utility variants for common styling needs
// ================================

// Spacing variants
export const spacingVariants = ({
  size = 'md',
  direction = 'vertical',
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

export const textMonoVariants = () => 'font-mono';

// List variants
export const listVariants = ({
  variant = 'spaced',
}: {
  variant?: 'spaced' | 'spacedSm' | 'disc';
} = {}) => {
  const baseClasses = 'text-sm text-gray-700';

  const variantClasses = {
    spaced: 'space-y-2',
    spacedSm: 'space-y-1',
    disc: 'list-disc list-inside ml-2 space-y-1',
  };

  return `${baseClasses} ${variantClasses[variant]}`;
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

// Animation variants
export const animationVariants = ({
  type = 'fade',
  duration = 'normal',
  easing = 'ease',
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
  color = 'gray',
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
  radius = 'md',
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
export type SelectVariants = Parameters<typeof selectVariants>[0];
export type CheckboxVariants = Parameters<typeof checkboxVariants>[0];
export type RadioVariants = Parameters<typeof radioVariants>[0];
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
export type PageVariants = Parameters<typeof pageVariants>[0];
export type LayoutContainerVariants = Parameters<
  typeof layoutContainerVariants
>[0];
export type TextTitleVariants = Parameters<typeof textTitleVariants>[0];
export type TextHintVariants = Parameters<typeof textHintVariants>[0];
export type TextMonoVariants = {};
export type ListVariants = Parameters<typeof listVariants>[0];
export type StatTitleVariants = {};
export type StatValueVariants = Parameters<typeof statValueVariants>[0];
export type StatValueSizeVariants = Parameters<typeof statValueSizeVariants>[0];
export type StatHintVariants = {};
export type TechSectionGridVariants = {};
export type TechTitleVariants = Parameters<typeof techTitleVariants>[0];
export type TechListVariants = {};
export type InfoBoxVariants = Parameters<typeof infoBoxVariants>[0];
export type InfoBoxItemVariants = Parameters<typeof infoBoxItemVariants>[0];
export type PageHeaderVariants = Parameters<typeof pageHeaderVariants>[0];
export type SectionVariants = Parameters<typeof sectionVariants>[0];
export type LogEntryVariants = Parameters<typeof logEntryVariants>[0];
export type LogLevelBadgeVariants = Parameters<typeof logLevelBadgeVariants>[0];
export type ToastContainerVariants = Parameters<
  typeof toastContainerVariants
>[0];
export type ToastVariants = Parameters<typeof toastVariants>[0];
export type DemoCardVariants = Parameters<typeof demoCardVariants>[0];
