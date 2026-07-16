import type { ActionPayloadMap } from '@context-action/core';
import { createActionContext, createStoreContext } from '@context-action/react';
import type {
  EventLog,
  PerformanceHistoryEntry,
  PerformanceMetrics,
  ThrottleConfig,
  ThrottleEventType,
} from '../business/throttle-rules';
import {
  createInitialPerformanceMetrics,
  createInitialThrottleConfig,
} from '../business/throttle-rules';

export interface ThrottleActions extends ActionPayloadMap {
  inputEvent: { value: string };
  processEvent: {
    type: ThrottleEventType;
    value: string;
    timestamp: number;
    delay?: number;
  };
  clearLogs: void;
  runPerformanceTest: {
    type: ThrottleEventType;
    iterations: number;
    interval: number;
  };
  updateConfig: ThrottleConfig;
  startAutoTest: { duration: number; frequency: number };
  stopAutoTest: void;
}

export interface ThrottleStores {
  eventLogs: EventLog[];
  isAutoTesting: boolean;
  config: ThrottleConfig;
  metrics: PerformanceMetrics;
  performanceHistory: PerformanceHistoryEntry[];
}

export const {
  Provider: ThrottleActionProvider,
  useActionDispatch: useThrottleAction,
  useActionHandler: useThrottleActionHandler,
} = createActionContext<ThrottleActions>('AdvancedThrottle');

export const { Provider: ThrottleStoreProvider, useStore: useThrottleStore } =
  createStoreContext<ThrottleStores>('AdvancedThrottle', {
    eventLogs: {
      initialValue: [],
      strategy: 'reference',
      description: 'Recent events emitted by the five timing strategies.',
    },
    isAutoTesting: {
      initialValue: false,
      description: 'Whether the automated comparison loop is active.',
    },
    config: {
      initialValue: createInitialThrottleConfig(),
      strategy: 'shallow',
      description: 'Delay configuration for each timing strategy.',
    },
    metrics: {
      initialValue: createInitialPerformanceMetrics(),
      strategy: 'shallow',
      description: 'Per-strategy count, timing, efficiency, and CPU metrics.',
    },
    performanceHistory: {
      initialValue: [],
      strategy: 'reference',
      description: 'Recent benchmark summaries.',
    },
  });

export type {
  EventLog,
  PerformanceHistoryEntry,
  PerformanceMetrics,
  ThrottleConfig,
  ThrottleEventType,
} from '../business/throttle-rules';
