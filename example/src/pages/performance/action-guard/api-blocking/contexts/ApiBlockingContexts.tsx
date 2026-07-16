import type { ActionPayloadMap } from '@context-action/core';
import { createActionContext, createStoreContext } from '@context-action/react';
import type {
  ApiCallRecord,
  BlockingMetrics,
  RateLimitConfig,
} from '../business/api-blocking-rules';
import {
  createInitialBlockingMetrics,
  createInitialRateLimitConfig,
} from '../business/api-blocking-rules';

export interface ApiBlockingActions extends ActionPayloadMap {
  makeApiCall: {
    endpoint: string;
    method: string;
    timestamp: number;
  };
  markApiCallSuccess: {
    callId: string;
    endpoint: string;
    responseTime: number;
    timestamp: number;
  };
  markApiCallBlocked: {
    callId: string;
    endpoint: string;
    reason: string;
    timestamp: number;
  };
  markApiCallError: {
    callId: string;
    endpoint: string;
    error: string;
    timestamp: number;
  };
  startBlocking: { action: string; duration: number; timestamp: number };
  endBlocking: { action: string; timestamp: number };
  setBlockDuration: { duration: number };
  clearHistory: void;
  configureRateLimit: {
    enabled: boolean;
    maxRequests: number;
    windowMs: number;
  };
}

export interface ApiBlockingStores {
  apiCalls: ApiCallRecord[];
  isBlocked: boolean;
  blockedAction: string | null;
  blockEndTime: number | null;
  blockDuration: number;
  rateLimit: RateLimitConfig;
  metrics: BlockingMetrics;
}

export const {
  Provider: ApiBlockingActionProvider,
  useActionDispatch: useApiBlockingAction,
  useActionHandler: useApiBlockingActionHandler,
} = createActionContext<ApiBlockingActions>('AdvancedApiBlocking');

export const {
  Provider: ApiBlockingStoreProvider,
  useStore: useApiBlockingStore,
} = createStoreContext<ApiBlockingStores>('AdvancedApiBlocking', {
  apiCalls: {
    initialValue: [],
    strategy: 'shallow',
    description: 'Recent API request records.',
  },
  isBlocked: {
    initialValue: false,
    description: 'Whether the request gate is currently active.',
  },
  blockedAction: {
    initialValue: null,
    description: 'Action currently held by the request gate.',
  },
  blockEndTime: {
    initialValue: null,
    description: 'Timestamp at which the current request gate ends.',
  },
  blockDuration: {
    initialValue: 2000,
    description: 'Duration of the duplicate-request gate in milliseconds.',
  },
  rateLimit: {
    initialValue: createInitialRateLimitConfig(),
    strategy: 'shallow',
    description: 'Sliding request-window configuration and counter.',
  },
  metrics: {
    initialValue: createInitialBlockingMetrics(),
    strategy: 'shallow',
    description: 'Request outcomes and blocking efficiency metrics.',
  },
});

export type {
  ApiCallRecord,
  BlockingMetrics,
  RateLimitConfig,
} from '../business/api-blocking-rules';
