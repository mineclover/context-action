import { cva, type VariantProps } from "class-variance-authority";

// 기본 컨테이너
export const containerVariants = cva(
  "w-full max-w-none",
  {
    variants: {
      size: {
        sm: "max-w-2xl",
        md: "max-w-4xl",
        lg: "max-w-6xl",
        xl: "max-w-8xl",
        full: "max-w-none",
      },
      centered: {
        true: "mx-auto",
        false: "",
      },
      padding: {
        none: "p-0",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
        xl: "p-12",
      },
    },
    defaultVariants: {
      size: "lg",
      centered: true,
      padding: "md",
    },
  }
);

// 카드 컴포넌트
export const cardVariants = cva(
  "bg-white border rounded-lg transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border-gray-200 shadow-sm",
        elevated: "border-gray-200 shadow-lg",
        outlined: "border-gray-300 shadow-none",
        bordered: "border-2 border-gray-200 shadow-none",
      },
      size: {
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
      },
      hover: {
        true: "hover:shadow-lg hover:-translate-y-1",
        false: "",
      },
      category: {
        core: "border-l-4 border-l-danger-500",
        store: "border-l-4 border-l-success-600",
        react: "border-l-4 border-l-purple-600",
        logger: "border-l-4 border-l-warning-600",
        actionguard: "border-l-4 border-l-pink-600",
        examples: "border-l-4 border-l-orange-600",
        debug: "border-l-4 border-l-indigo-600",
        default: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      hover: false,
      category: "default",
    },
  }
);

// 버튼 컴포넌트
export const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg border font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary: "bg-primary-600 text-white border-primary-600 hover:bg-primary-700 focus:ring-primary-500",
        secondary: "bg-gray-600 text-white border-gray-600 hover:bg-gray-700 focus:ring-gray-500",
        success: "bg-success-600 text-white border-success-600 hover:bg-success-700 focus:ring-success-500",
        warning: "bg-warning-600 text-white border-warning-600 hover:bg-warning-700 focus:ring-warning-500",
        danger: "bg-danger-600 text-white border-danger-600 hover:bg-danger-700 focus:ring-danger-500",
        info: "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 focus:ring-blue-500",
        outline: "bg-transparent text-gray-700 border-gray-300 hover:bg-gray-50 focus:ring-primary-500",
        ghost: "bg-transparent text-gray-700 border-transparent hover:bg-gray-100 focus:ring-primary-500",
      },
      size: {
        xs: "px-2.5 py-1.5 text-xs",
        sm: "px-3 py-2 text-sm",
        md: "px-4 py-2.5 text-sm",
        lg: "px-6 py-3 text-base",
        xl: "px-8 py-4 text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

// 뱃지 컴포넌트
export const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-gray-100 text-gray-800",
        primary: "bg-primary-100 text-primary-800",
        success: "bg-success-100 text-success-800",
        warning: "bg-warning-100 text-warning-800",
        danger: "bg-danger-100 text-danger-800",
        outline: "border border-gray-300 text-gray-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

// 입력 필드
export const inputVariants = cva(
  "block w-full rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-gray-300 focus:border-primary-500 focus:ring-primary-500",
        error: "border-danger-300 focus:border-danger-500 focus:ring-danger-500",
        success: "border-success-300 focus:border-success-500 focus:ring-success-500",
      },
      size: {
        sm: "px-3 py-2 text-sm",
        md: "px-4 py-2.5 text-sm",
        lg: "px-4 py-3 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

// 상태 표시기
export const statusVariants = cva(
  "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
  {
    variants: {
      status: {
        safe: "bg-success-50 text-success-700 border border-success-200",
        warning: "bg-warning-50 text-warning-700 border border-warning-200",
        danger: "bg-danger-50 text-danger-700 border border-danger-200",
        info: "bg-primary-50 text-primary-700 border border-primary-200",
        neutral: "bg-gray-50 text-gray-700 border border-gray-200",
      },
    },
    defaultVariants: {
      status: "neutral",
    },
  }
);

// 그리드 레이아웃
export const gridVariants = cva(
  "grid gap-6",
  {
    variants: {
      cols: {
        1: "grid-cols-1",
        2: "grid-cols-1 md:grid-cols-2",
        3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
        auto: "grid-cols-[repeat(auto-fit,minmax(300px,1fr))]",
      },
      gap: {
        sm: "gap-4",
        md: "gap-6",
        lg: "gap-8",
      },
    },
    defaultVariants: {
      cols: "auto",
      gap: "md",
    },
  }
);

// 레이아웃 컴포넌트
export const layoutVariants = cva(
  "flex min-h-screen bg-gray-50",
  {
    variants: {
      variant: {
        default: "",
        fullscreen: "h-screen overflow-hidden",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

// 사이드바 컴포넌트
export const sidebarVariants = cva(
  "fixed h-full overflow-y-auto bg-white border-r border-gray-200 transition-all duration-200",
  {
    variants: {
      width: {
        sm: "w-64",
        md: "w-72",
        lg: "w-80",
      },
      collapsed: {
        true: "w-16",
        false: "",
      },
    },
    defaultVariants: {
      width: "md",
      collapsed: false,
    },
  }
);

// 메인 콘텐츠 영역
export const mainContentVariants = cva(
  "flex-1 p-8 transition-all duration-200",
  {
    variants: {
      sidebarWidth: {
        sm: "ml-64",
        md: "ml-72",
        lg: "ml-80",
      },
      sidebarCollapsed: {
        true: "ml-16",
        false: "",
      },
      maxWidth: {
        none: "max-w-none",
        sm: "max-w-2xl",
        md: "max-w-4xl",
        lg: "max-w-6xl",
        xl: "max-w-7xl",
      },
    },
    defaultVariants: {
      sidebarWidth: "md",
      sidebarCollapsed: false,
      maxWidth: "none",
    },
  }
);

// 네비게이션 아이템
export const navItemVariants = cva(
  "block w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
  {
    variants: {
      variant: {
        default: "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
        active: "bg-primary-100 text-primary-900 border-l-4 border-primary-600",
      },
      category: {
        main: "",
        core: "hover:bg-red-50 hover:text-red-900",
        store: "hover:bg-green-50 hover:text-green-900",
        react: "hover:bg-purple-50 hover:text-purple-900",
        logger: "hover:bg-yellow-50 hover:text-yellow-900",
        actionguard: "hover:bg-pink-50 hover:text-pink-900",
        examples: "hover:bg-orange-50 hover:text-orange-900",
        debug: "hover:bg-indigo-50 hover:text-indigo-900",
        dev: "hover:bg-red-50 hover:text-red-900",
      },
    },
    defaultVariants: {
      variant: "default",
      category: "main",
    },
  }
);

// 토스트 컴포넌트
export const toastVariants = cva(
  "relative bg-white rounded-lg shadow-lg border transition-all duration-300 ease-out",
  {
    variants: {
      type: {
        action: "border-l-4 border-l-blue-500",
        system: "border-l-4 border-l-gray-500",
        error: "border-l-4 border-l-red-500",
        success: "border-l-4 border-l-green-500",
        info: "border-l-4 border-l-sky-500",
        default: "border-l-4 border-l-gray-400",
      },
      phase: {
        entering: "opacity-0 translate-y-2 scale-95",
        visible: "opacity-100 translate-y-0 scale-100",
        exiting: "opacity-0 translate-x-full scale-95",
      },
      executionStep: {
        start: "border-l-blue-500",
        processing: "border-l-amber-500",
        success: "border-l-green-500",
        error: "border-l-red-500",
      },
    },
    defaultVariants: {
      type: "default",
      phase: "visible",
    },
  }
);

// 토스트 컨테이너
export const toastContainerVariants = cva(
  "fixed z-50 p-4 space-y-3",
  {
    variants: {
      position: {
        "top-right": "top-4 right-4",
        "top-left": "top-4 left-4",
        "top-center": "top-4 left-1/2 transform -translate-x-1/2",
        "bottom-right": "bottom-4 right-4",
        "bottom-left": "bottom-4 left-4",
        "bottom-center": "bottom-4 left-1/2 transform -translate-x-1/2",
      },
      width: {
        sm: "w-80",
        md: "w-96",
        lg: "w-[28rem]",
      },
    },
    defaultVariants: {
      position: "top-right",
      width: "md",
    },
  }
);

// 토스트 단계 뱃지
export const toastStepBadgeVariants = cva(
  "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
  {
    variants: {
      step: {
        start: "bg-blue-100 text-blue-800",
        processing: "bg-amber-100 text-amber-800",
        success: "bg-green-100 text-green-800",
        error: "bg-red-100 text-red-800",
      },
    },
    defaultVariants: {
      step: "start",
    },
  }
);

// 로그 모니터 컴포넌트
export const logMonitorVariants = cva(
  "bg-white rounded-lg border shadow-sm",
  {
    variants: {
      size: {
        sm: "text-xs",
        md: "text-sm",
        lg: "text-base",
      },
      variant: {
        default: "border-gray-200",
        compact: "border-gray-200 p-3",
        expanded: "border-gray-200 p-6",
      },
    },
    defaultVariants: {
      size: "sm",
      variant: "default",
    },
  }
);

// 로그 엔트리
export const logEntryVariants = cva(
  "grid gap-2 p-2 border-b border-gray-100 text-xs font-mono",
  {
    variants: {
      type: {
        action: "",
        system: "bg-gray-50",
        performance: "bg-blue-50",
        error: "bg-red-50",
      },
      level: {
        trace: "text-gray-500",
        debug: "text-blue-600",
        info: "text-green-600",
        warn: "text-yellow-600",
        error: "text-red-600",
      },
    },
    defaultVariants: {
      type: "action",
      level: "info",
    },
  }
);

// 로그 레벨 뱃지
export const logLevelBadgeVariants = cva(
  "inline-flex items-center px-2 py-1 rounded text-xs font-medium",
  {
    variants: {
      level: {
        trace: "bg-gray-100 text-gray-700",
        debug: "bg-blue-100 text-blue-700",
        info: "bg-green-100 text-green-700",
        warn: "bg-yellow-100 text-yellow-700",
        error: "bg-red-100 text-red-700",
      },
    },
    defaultVariants: {
      level: "info",
    },
  }
);

// 데모 카드 변형 - 레거시 demo-card 클래스 대체
export const demoCardVariants = cva(
  "bg-white rounded-lg border shadow-sm transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border-gray-200 p-6",
        info: "bg-blue-50 border-blue-200 p-6",
        logger: "border-gray-200 p-6 relative",
        monitor: "bg-gray-50 border-gray-300 p-6",
        compact: "border-gray-200 p-4",
      },
      spacing: {
        none: "p-0",
        sm: "p-4", 
        md: "p-6",
        lg: "p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      spacing: "md",
    },
  }
);

// 코드 예제 변형 - 레거시 code-example 클래스 대체
export const codeExampleVariants = cva(
  "mt-8 bg-white rounded-lg border border-gray-200 shadow-sm",
  {
    variants: {
      size: {
        sm: "p-4",
        md: "p-6", 
        lg: "p-8",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

// 코드 블록 변형 - 레거시 code-block 클래스 대체
export const codeBlockVariants = cva(
  "bg-gray-900 text-gray-100 rounded-lg overflow-x-auto font-mono leading-relaxed",
  {
    variants: {
      size: {
        xs: "p-2 text-xs",
        sm: "p-3 text-sm",
        md: "p-4 text-sm",
        lg: "p-6 text-base",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

// Export variant props types
export type ContainerVariants = VariantProps<typeof containerVariants>;
export type CardVariants = VariantProps<typeof cardVariants>;
export type ButtonVariants = VariantProps<typeof buttonVariants>;
export type BadgeVariants = VariantProps<typeof badgeVariants>;
export type InputVariants = VariantProps<typeof inputVariants>;
export type StatusVariants = VariantProps<typeof statusVariants>;
export type GridVariants = VariantProps<typeof gridVariants>;
export type LayoutVariants = VariantProps<typeof layoutVariants>;
export type SidebarVariants = VariantProps<typeof sidebarVariants>;
export type MainContentVariants = VariantProps<typeof mainContentVariants>;
export type NavItemVariants = VariantProps<typeof navItemVariants>;
export type ToastVariants = VariantProps<typeof toastVariants>;
export type ToastContainerVariants = VariantProps<typeof toastContainerVariants>;
export type ToastStepBadgeVariants = VariantProps<typeof toastStepBadgeVariants>;
export type LogMonitorVariants = VariantProps<typeof logMonitorVariants>;
export type LogEntryVariants = VariantProps<typeof logEntryVariants>;
export type LogLevelBadgeVariants = VariantProps<typeof logLevelBadgeVariants>;
export type DemoCardVariants = VariantProps<typeof demoCardVariants>;
export type CodeExampleVariants = VariantProps<typeof codeExampleVariants>;
export type CodeBlockVariants = VariantProps<typeof codeBlockVariants>;