/**
 * Shared services across all domains
 * Business logic and utility functions
 */

import type { LogEntry, PerformanceMetrics } from '../hooks/types';
import { LogLevel } from '@/utils/logger';

// Helper to get log level name
const getLogLevelName = (level: LogLevel): string => {
  return LogLevel[level] || 'UNKNOWN';
};

// Logger service for consistent logging across domains
export class LoggerService {
  private static instance: LoggerService;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  log(level: LogEntry['level'], message: string, data?: any, source?: string): LogEntry {
    const entry: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      level,
      message,
      data,
      source
    };

    this.logs.push(entry);
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Also log to console for development
    const prefix = `[${source || 'App'}] ${getLogLevelName(level)}:`;
    if (level >= LogLevel.ERROR) {
      console.error(prefix, message, data);
    } else if (level >= LogLevel.WARN) {
      console.warn(prefix, message, data);
    } else if (level >= LogLevel.INFO) {
      console.info(prefix, message, data);
    } else {
      console.log(prefix, message, data);
    }

    return entry;
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  getLogsBySource(source: string): LogEntry[] {
    return this.logs.filter(log => log.source === source);
  }
}

// Performance monitoring service
export class PerformanceService {
  private static instance: PerformanceService;
  private metrics: Map<string, PerformanceMetrics[]> = new Map();

  static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService();
    }
    return PerformanceService.instance;
  }

  startMeasurement(operationName: string): string {
    const measurementId = `${operationName}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    performance.mark(`${measurementId}-start`);
    return measurementId;
  }

  endMeasurement(measurementId: string, operationName: string): PerformanceMetrics | null {
    try {
      performance.mark(`${measurementId}-end`);
      performance.measure(measurementId, `${measurementId}-start`, `${measurementId}-end`);
      
      const measure = performance.getEntriesByName(measurementId)[0] as PerformanceEntry;
      const duration = measure.duration;

      const metrics: PerformanceMetrics = {
        startTime: measure.startTime,
        endTime: measure.startTime + duration,
        duration,
        operations: 1,
        errors: 0,
        avgResponseTime: duration
      };

      // Store metrics
      if (!this.metrics.has(operationName)) {
        this.metrics.set(operationName, []);
      }
      this.metrics.get(operationName)!.push(metrics);

      // Cleanup performance entries
      performance.clearMarks(`${measurementId}-start`);
      performance.clearMarks(`${measurementId}-end`);
      performance.clearMeasures(measurementId);

      return metrics;
    } catch (error) {
      console.error('Performance measurement error:', error);
      return null;
    }
  }

  getMetrics(operationName: string): PerformanceMetrics[] {
    return this.metrics.get(operationName) || [];
  }

  getAggregatedMetrics(operationName: string): PerformanceMetrics | null {
    const metrics = this.metrics.get(operationName);
    if (!metrics || metrics.length === 0) return null;

    const totalDuration = metrics.reduce((sum, m) => sum + (m.duration || 0), 0);
    const totalOperations = metrics.reduce((sum, m) => sum + m.operations, 0);
    const totalErrors = metrics.reduce((sum, m) => sum + m.errors, 0);

    return {
      startTime: metrics[0].startTime,
      endTime: metrics[metrics.length - 1].endTime,
      duration: totalDuration,
      operations: totalOperations,
      errors: totalErrors,
      avgResponseTime: totalDuration / metrics.length
    };
  }

  clearMetrics(operationName?: string): void {
    if (operationName) {
      this.metrics.delete(operationName);
    } else {
      this.metrics.clear();
    }
  }
}

// Validation service for consistent validation patterns
export function validateRequired(value: any, fieldName: string): string | null {
  if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) {
    return `${fieldName} is required`;
  }
  return null;
}

export function validateEmail(email: string): string | null {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Invalid email format';
  }
  return null;
}

export function validateMinLength(value: string, minLength: number, fieldName: string): string | null {
  if (value.length < minLength) {
    return `${fieldName} must be at least ${minLength} characters`;
  }
  return null;
}

export function validateMaxLength(value: string, maxLength: number, fieldName: string): string | null {
  if (value.length > maxLength) {
    return `${fieldName} must be no more than ${maxLength} characters`;
  }
  return null;
}

export function validatePattern(value: string, pattern: RegExp, message: string): string | null {
  if (!pattern.test(value)) {
    return message;
  }
  return null;
}

export function combineValidators(...validators: Array<() => string | null>): string[] {
  return validators
    .map(validator => validator())
    .filter((result): result is string => result !== null);
}

// Form validation utilities
export function validateForm(fields: Record<string, any>, rules: Record<string, Array<() => string | null>>): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  
  for (const [fieldName, validators] of Object.entries(rules)) {
    const fieldErrors = combineValidators(...validators);
    if (fieldErrors.length > 0) {
      errors[fieldName] = fieldErrors;
    }
  }
  
  return errors;
}

// Legacy class wrapper for backward compatibility
export const ValidationService = {
  validateRequired,
  validateEmail,
  validateMinLength,
  validateMaxLength,
  validatePattern,
  combineValidators,
  validateForm,
};

// Async utilities service
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function timeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms)
    )
  ]);
}

export function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  const attemptRetry = async (): Promise<T> => {
    let lastError: Error = new Error('No attempts made');
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await fn();
        return result;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          await delay(delayMs * 2 ** attempt); // Exponential backoff
        }
      }
    }
    
    throw lastError;
  };
  
  return attemptRetry();
}

export async function withFallback<T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T> | T
): Promise<T> {
  try {
    return await primary();
  } catch {
    return await fallback();
  }
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delayMs);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    
    if (now - lastCall >= delayMs) {
      lastCall = now;
      func(...args);
    }
  };
}

// Async utility functions
export async function executeWithProgress<T>(
  operation: () => Promise<T>,
  onProgress?: (progress: number) => void
): Promise<T> {
  onProgress?.(0);
  
  try {
    const result = await operation();
    onProgress?.(100);
    return result;
  } catch (error) {
    onProgress?.(0);
    throw error;
  }
}

export async function batchExecute<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize: number = 5,
  delayMs: number = 100
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
    
    if (i + batchSize < items.length) {
      await delay(delayMs);
    }
  }
  
  return results;
}

// Legacy class wrapper for backward compatibility
export const AsyncUtilsService = {
  delay,
  timeout,
  retry,
  withFallback,
  debounce,
  throttle,
  executeWithProgress,
  batchExecute,
};