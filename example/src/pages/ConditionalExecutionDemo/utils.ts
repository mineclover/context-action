import { LogEntry, LogLevel } from './types';

// ===== Utility Functions =====
export const addLog = (logs: LogEntry[], level: LogLevel, message: string, data?: any): LogEntry[] => {
  const newLog: LogEntry = { timestamp: Date.now(), level, message, data };
  return [...logs, newLog];
};

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getLogIcon = (level: string) => {
  switch (level) {
    case 'info': return '📘';
    case 'warning': return '⚠️';
    case 'error': return '❌';
    default: return '📝';
  }
};

export const isWithinBusinessHours = (date: Date): boolean => {
  const hour = date.getHours();
  const day = date.getDay();
  
  // Monday (1) to Friday (5), 9 AM to 5 PM
  return day >= 1 && day <= 5 && hour >= 9 && hour < 17;
};

export const getNextBusinessHour = (date: Date): Date => {
  const next = new Date(date);
  
  // If it's weekend, move to next Monday
  if (next.getDay() === 0) next.setDate(next.getDate() + 1);
  if (next.getDay() === 6) next.setDate(next.getDate() + 2);
  
  // Set to 9 AM
  next.setHours(9, 0, 0, 0);
  
  return next;
};

export const getCreditThreshold = (tier: string): number => {
  const thresholds: Record<string, number> = {
    'bronze': 100,
    'silver': 500,
    'gold': 1000,
    'platinum': 2000
  };
  return thresholds[tier] || 100;
};