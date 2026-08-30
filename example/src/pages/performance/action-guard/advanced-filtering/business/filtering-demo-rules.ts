export interface ProcessDataPayload {
  userId: string;
  data: Record<string, unknown>;
  action?: string;
}

export interface FilteringExecutionResult {
  results?: unknown[];
  duration?: number;
  error?: string;
  execution?: FilteringExecutionSummary;
  success?: boolean;
}

export interface FilteringExecutionSummary {
  handlersExecuted: number;
  duration: number;
  startTime: number;
  endTime: number;
}

export interface ExecutionVisualizationState {
  executedHandlers: string[];
  isRunning: boolean;
  totalExecuted: number;
  totalDuration: number;
  currentDemo: string | null;
}

export interface FilteringHandler {
  id: string;
  name: string;
  icon: string;
  priority: number;
  blocking: boolean;
  color: 'red' | 'blue' | 'green' | 'yellow' | 'purple';
}

export interface FilteringHandlerFilterConfig {
  id: string;
  blocking: boolean;
}

export interface FilteringDispatchOptions {
  filter?: {
    handlerIds?: string[];
    excludeHandlerIds?: string[];
    priority?: {
      min?: number;
      max?: number;
    };
    custom?: (config: Readonly<FilteringHandlerFilterConfig>) => boolean;
  };
}

export interface FilteringDemo {
  key: string;
  title: string;
  description: string;
  filterOptions?: FilteringDispatchOptions;
  category: string;
}

export const FILTERING_HANDLERS: readonly FilteringHandler[] = [
  {
    id: 'security-check',
    name: 'Security',
    icon: '🔐',
    priority: 100,
    blocking: true,
    color: 'red',
  },
  {
    id: 'analytics',
    name: 'Analytics',
    icon: '📊',
    priority: 80,
    blocking: false,
    color: 'blue',
  },
  {
    id: 'database-save',
    name: 'Database',
    icon: '💾',
    priority: 60,
    blocking: true,
    color: 'green',
  },
  {
    id: 'notification',
    name: 'Notification',
    icon: '🔔',
    priority: 40,
    blocking: false,
    color: 'yellow',
  },
  {
    id: 'audit-log',
    name: 'Audit',
    icon: '📝',
    priority: 20,
    blocking: false,
    color: 'purple',
  },
];

export const FILTERING_DEMOS: readonly FilteringDemo[] = [
  {
    key: 'no-filter',
    title: '🔄 All Handlers',
    description: 'Execute all 5 handlers without any filtering',
    category: 'Basic',
  },
  {
    key: 'critical-only',
    title: '🔐 Critical Security + DB',
    description: 'Only security validation and database save',
    filterOptions: {
      filter: { handlerIds: ['security-check', 'database-save'] },
    },
    category: 'Handler IDs',
  },
  {
    key: 'analytics-only',
    title: '📊 Analytics Only',
    description: 'Execute only analytics tracking handler',
    filterOptions: { filter: { handlerIds: ['analytics'] } },
    category: 'Handler IDs',
  },
  {
    key: 'non-blocking',
    title: '⚡ Non-blocking Handlers',
    description: 'Analytics, notification, and audit (non-blocking)',
    filterOptions: {
      filter: {
        handlerIds: ['analytics', 'notification', 'audit-log'],
      },
    },
    category: 'Handler IDs',
  },
  {
    key: 'high-priority',
    title: '🚀 High Priority (≥80)',
    description: 'Security and analytics handlers',
    filterOptions: { filter: { priority: { min: 80 } } },
    category: 'Priority',
  },
  {
    key: 'medium-priority',
    title: '📊 Medium Priority (50-90)',
    description: 'Analytics, database, and notification',
    filterOptions: { filter: { priority: { min: 50, max: 90 } } },
    category: 'Priority',
  },
  {
    key: 'low-priority',
    title: '📝 Low Priority (≤50)',
    description: 'Notification and audit logging',
    filterOptions: { filter: { priority: { max: 50 } } },
    category: 'Priority',
  },
  {
    key: 'no-analytics',
    title: '🚫 Exclude Analytics',
    description: 'All handlers except analytics tracking',
    filterOptions: { filter: { excludeHandlerIds: ['analytics'] } },
    category: 'Exclusion',
  },
  {
    key: 'no-notifications',
    title: '🔕 Skip Notifications',
    description: 'All handlers except notification and audit',
    filterOptions: {
      filter: { excludeHandlerIds: ['notification', 'audit-log'] },
    },
    category: 'Exclusion',
  },
  {
    key: 'blocking-only',
    title: '⏳ Blocking Handlers',
    description: 'Only handlers that block execution (security + database)',
    filterOptions: {
      filter: { custom: (config) => config.blocking === true },
    },
    category: 'Custom Logic',
  },
  {
    key: 'essential-flow',
    title: '✅ Essential Flow',
    description: 'Security validation → Database save → Audit log',
    filterOptions: {
      filter: {
        custom: (config) =>
          ['security-check', 'database-save', 'audit-log'].includes(config.id),
      },
    },
    category: 'Custom Logic',
  },
  {
    key: 'high-priority-no-analytics',
    title: '🎯 High Priority + No Analytics',
    description: 'Priority ≥80 excluding analytics',
    filterOptions: {
      filter: {
        priority: { min: 80 },
        excludeHandlerIds: ['analytics'],
      },
    },
    category: 'Combined',
  },
  {
    key: 'impossible-filter',
    title: '❌ Impossible Filter',
    description: 'Priority >200 (no handlers match)',
    filterOptions: { filter: { priority: { min: 200 } } },
    category: 'Edge Cases',
  },
  {
    key: 'single-handler',
    title: '🎯 Single Handler Test',
    description: 'Only notification handler',
    filterOptions: {
      filter: {
        handlerIds: ['notification'],
        priority: { min: 30, max: 50 },
      },
    },
    category: 'Edge Cases',
  },
];

export function createInitialVisualizationState(
  currentDemo: string | null = null,
  isRunning = false
): ExecutionVisualizationState {
  return {
    executedHandlers: [],
    isRunning,
    totalExecuted: 0,
    totalDuration: 0,
    currentDemo,
  };
}

export function getExecutedHandlerIds(
  handlers: readonly { id: string; executed: boolean }[]
): string[] {
  return handlers
    .filter((handler) => handler.executed)
    .map((handler) => handler.id);
}

export function toFilteringExecutionResult(result: {
  execution: FilteringExecutionSummary;
  results: unknown[];
  success: boolean;
}): FilteringExecutionResult {
  return {
    execution: result.execution,
    results: result.results,
    success: result.success,
    duration: result.execution.duration,
  };
}

export function toFailedFilteringExecutionResult(
  error: unknown
): FilteringExecutionResult {
  return {
    error: error instanceof Error ? error.message : 'Unknown error',
    execution: {
      handlersExecuted: 0,
      duration: 0,
      startTime: 0,
      endTime: 0,
    },
    success: false,
  };
}

export function groupFilteringDemos(
  demos: readonly FilteringDemo[] = FILTERING_DEMOS
): Record<string, FilteringDemo[]> {
  return demos.reduce<Record<string, FilteringDemo[]>>((groups, demo) => {
    const categoryDemos = groups[demo.category] ?? [];
    categoryDemos.push(demo);
    groups[demo.category] = categoryDemos;
    return groups;
  }, {});
}
