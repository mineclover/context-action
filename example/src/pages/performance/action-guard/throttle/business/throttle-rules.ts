export type ThrottleEventType =
  | 'normal'
  | 'throttle'
  | 'debounce'
  | 'leading'
  | 'trailing';

export interface EventLog {
  id: string;
  type: ThrottleEventType;
  timestamp: number;
  value: string;
  delay?: number;
  executionTime?: number;
  isSkipped?: boolean;
}

export interface ThrottleConfig {
  throttleDelay: number;
  debounceDelay: number;
  leadingDelay: number;
  trailingDelay: number;
}

export interface PerformanceMetrics {
  eventCounts: Record<ThrottleEventType, number>;
  avgResponseTimes: Record<ThrottleEventType, number>;
  totalExecutions: Record<ThrottleEventType, number>;
  efficiency: Record<ThrottleEventType, number>;
  memoryUsage: Record<ThrottleEventType, number>;
  cpuLoad: Record<ThrottleEventType, number>;
}

export interface PerformanceHistoryEntry {
  timestamp: number;
  type: ThrottleEventType;
  duration: number;
  operations: number;
  efficiency: number;
}

export const throttleEventTypes: ThrottleEventType[] = [
  'normal',
  'throttle',
  'debounce',
  'leading',
  'trailing',
];

export function createInitialThrottleConfig(): ThrottleConfig {
  return {
    throttleDelay: 300,
    debounceDelay: 500,
    leadingDelay: 250,
    trailingDelay: 400,
  };
}

function createZeroMetrics(): Record<ThrottleEventType, number> {
  return {
    normal: 0,
    throttle: 0,
    debounce: 0,
    leading: 0,
    trailing: 0,
  };
}

export function createInitialPerformanceMetrics(): PerformanceMetrics {
  return {
    eventCounts: createZeroMetrics(),
    avgResponseTimes: createZeroMetrics(),
    totalExecutions: createZeroMetrics(),
    efficiency: createZeroMetrics(),
    memoryUsage: createZeroMetrics(),
    cpuLoad: createZeroMetrics(),
  };
}

export function appendEventLog(
  logs: EventLog[],
  eventLog: EventLog
): EventLog[] {
  return [eventLog, ...logs].slice(0, 100);
}

export function recordProcessedEvent(
  metrics: PerformanceMetrics,
  type: ThrottleEventType,
  executionTime: number
): PerformanceMetrics {
  const eventCount = (metrics.eventCounts[type] || 0) + 1;
  const currentAverage = metrics.avgResponseTimes[type] || 0;
  const averageResponseTime =
    (currentAverage * (eventCount - 1) + executionTime) / eventCount;

  return {
    ...metrics,
    eventCounts: {
      ...metrics.eventCounts,
      [type]: eventCount,
    },
    avgResponseTimes: {
      ...metrics.avgResponseTimes,
      [type]: averageResponseTime,
    },
    totalExecutions: {
      ...metrics.totalExecutions,
      [type]: (metrics.totalExecutions[type] || 0) + 1,
    },
    efficiency: {
      ...metrics.efficiency,
      [type]: averageResponseTime > 0 ? 1000 / averageResponseTime : 0,
    },
    cpuLoad: {
      ...metrics.cpuLoad,
      [type]: Math.min(100, executionTime / 2),
    },
  };
}

export function appendPerformanceHistory(
  history: PerformanceHistoryEntry[],
  entry: PerformanceHistoryEntry
): PerformanceHistoryEntry[] {
  return [entry, ...history].slice(0, 20);
}
