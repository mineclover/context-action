/**
 * Local types for lib/hooks
 */

import type { LogLevel as UtilsLogLevel } from '@/utils/logger';

// LogEntry for hooks usage - simplified version
export interface LogEntry {
  id: string;
  timestamp: number;
  level: UtilsLogLevel;
  message: string;
  data?: any;
  source?: string;
}

// Performance metrics for hooks usage
export interface PerformanceMetrics {
  startTime: number;
  operations: number;
  errors: number;
  avgResponseTime: number;
  endTime?: number;
  duration?: number;
}
