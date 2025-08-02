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

// Export variant props types
export type ContainerVariants = VariantProps<typeof containerVariants>;
export type CardVariants = VariantProps<typeof cardVariants>;
export type ButtonVariants = VariantProps<typeof buttonVariants>;
export type BadgeVariants = VariantProps<typeof badgeVariants>;
export type InputVariants = VariantProps<typeof inputVariants>;
export type StatusVariants = VariantProps<typeof statusVariants>;
export type GridVariants = VariantProps<typeof gridVariants>;