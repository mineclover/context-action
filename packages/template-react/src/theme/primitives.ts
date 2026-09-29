/**
 * Astryx Design System - Primitive Tokens
 * 
 * 색상, 타이포그래피, 반경, 모션 등 불변의 기본 값 정의.
 */

export interface PrimitiveTokens {
  color: {
    brand: Record<string, string>;
    neutral: Record<string, string>;
    success: Record<string, string>;
    warning: Record<string, string>;
    error: Record<string, string>;
    info: Record<string, string>;
  };
  typography: {
    fontFamilyBase: string;
    fontFamilyHeading: string;
    fontFamilyCode: string;
    scaleBase: number;
    scaleRatio: number;
  };
  radius: {
    none: string;
    sm: string;
    md: string;
    lg: string;
    full: string;
  };
  motion: {
    fast: string;
    medium: string;
    slow: string;
  };
}

export const brandPrimitives: PrimitiveTokens = {
  color: {
    brand: {
      50: '#eef2ff',
      100: '#e0e7ff',
      200: '#c7d2fe',
      500: '#6366f1', // Primary Accent
      600: '#4f46e5', // Primary Hover
      700: '#4338ca',
    },
    neutral: {
      0: '#ffffff',
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617',
    },
    success: {
      500: '#10b981',
      600: '#059669',
    },
    warning: {
      500: '#f59e0b',
      600: '#d97706',
    },
    error: {
      500: '#ef4444',
      600: '#dc2626',
    },
    info: {
      500: '#3b82f6',
      600: '#2563eb',
    },
  },
  typography: {
    fontFamilyBase: 'Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontFamilyHeading: 'Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontFamilyCode: '"Fira Code", "Cascadia Code", Consolas, monospace',
    scaleBase: 16,
    scaleRatio: 1.25,
  },
  radius: {
    none: '0px',
    sm: '4px',
    md: '8px',
    lg: '12px',
    full: '9999px',
  },
  motion: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    medium: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '350ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
};
