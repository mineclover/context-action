import React from 'react';
import { createActionContext, createStoreContext } from '@context-action/react';
import type {
  SecurityActions,
  CacheActions, 
  OrderActions,
  ApiActions,
  ScenarioKey,
  SecurityResult,
  CacheResult,
  OrderResult,
  ApiResult
} from '../scenarios/types';

// Store type definitions for flow control demo
interface _FlowControlStores {
  demoState: {
    selectedScenario: ScenarioKey;
    executionResults: Array<SecurityResult | CacheResult | OrderResult | ApiResult>;
    executionPath: string[];
    isExecuting: boolean;
    handlerExecutions: number;
    systemLoad: number;
    isBusinessHours: boolean;
  };
  cache: {
    memoryCache: Map<string, any>;
    redisCache: Map<string, any>;
  };
}

// Action context for Security operations
export const {
  Provider: SecurityActionProvider,
  useActionDispatch: useSecurityAction,
  useActionHandler: useSecurityActionHandler
} = createActionContext<SecurityActions>('SecurityActions');

// Action context for Cache operations  
export const {
  Provider: CacheActionProvider,
  useActionDispatch: useCacheAction,
  useActionHandler: useCacheActionHandler
} = createActionContext<CacheActions>('CacheActions');

// Action context for Order operations
export const {
  Provider: OrderActionProvider,
  useActionDispatch: useOrderAction,
  useActionHandler: useOrderActionHandler
} = createActionContext<OrderActions>('OrderActions');

// Action context for API operations
export const {
  Provider: ApiActionProvider,
  useActionDispatch: useApiAction,
  useActionHandler: useApiActionHandler
} = createActionContext<ApiActions>('ApiActions');

// Store context for demo state management
export const {
  Provider: FlowControlStoreProvider,
  useStore: useFlowControlStore
} = createStoreContext('FlowControlStores', {
  demoState: {
    selectedScenario: 'securityEscalation' as ScenarioKey,
    executionResults: [] as Array<SecurityResult | CacheResult | OrderResult | ApiResult>,
    executionPath: [] as string[],
    isExecuting: false,
    handlerExecutions: 0,
    systemLoad: 0.3,
    isBusinessHours: true
  },
  cache: {
    memoryCache: new Map<string, any>(),
    redisCache: new Map<string, any>()
  }
});

// Combined provider for all contexts
export function FlowControlProvider({ children }: { children: React.ReactNode }) {
  return (
    <FlowControlStoreProvider>
      <SecurityActionProvider>
        <CacheActionProvider>
          <OrderActionProvider>
            <ApiActionProvider>
              {children}
            </ApiActionProvider>
          </OrderActionProvider>
        </CacheActionProvider>
      </SecurityActionProvider>
    </FlowControlStoreProvider>
  );
}