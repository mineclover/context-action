/**
 * Local types for lib/hooks
 */

// Performance metrics for hooks usage
export interface PerformanceMetrics {
  startTime: number;
  operations: number;
  errors: number;
  avgResponseTime: number;
  endTime?: number;
  duration?: number;
}
