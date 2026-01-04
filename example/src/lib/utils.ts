import { clsx } from 'clsx';

// Tailwind CSS utility function
export function cn(...inputs: (string | undefined | null | false)[]): string {
  return clsx(...inputs);
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
