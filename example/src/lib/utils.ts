import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// 타입 안전한 variant 래퍼
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
