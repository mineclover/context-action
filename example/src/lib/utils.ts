import { css, cx } from '../../styled-system/css';

// Panda CSS utility function
export function cn(...inputs: (string | undefined | null | false)[]): string {
  return cx(...inputs.filter(Boolean) as string[]);
}

// 타입 안전한 variant 래퍼 (Panda CSS 호환)
export function safeVariant<T extends (...args: any[]) => any>(
  variantFn: T
): (...args: Parameters<T>) => string {
  return (...args: Parameters<T>): string => {
    return variantFn(...args) as string;
  };
}

export function formatTimestamp(timestamp: number): string {
  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(timestamp));
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}
