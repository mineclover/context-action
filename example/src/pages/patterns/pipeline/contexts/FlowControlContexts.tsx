import {
  type ActionPayloadMap,
  createActionContext,
  createStoreContext,
} from '@context-action/react';
import React from 'react';
import type {
  ApiActions,
  ApiResult,
  CacheActions,
  CacheResult,
  OrderActions,
  OrderResult,
  ScenarioKey,
  SecurityActions,
  SecurityResult,
} from '../scenarios/types';

// Store type definitions for flow control demo
interface _FlowControlStores {
  demoState: {
    selectedScenario: ScenarioKey;
    executionResults: Array<
      SecurityResult | CacheResult | OrderResult | ApiResult
    >;
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
  useActionDispatchWithResult: useSecurityActionWithResult,
  useActionHandler: useSecurityActionHandler,
} = createActionContext<SecurityActions>('SecurityActions');

// Action context for Cache operations
export const {
  Provider: CacheActionProvider,
  useActionDispatch: useCacheAction,
  useActionDispatchWithResult: useCacheActionWithResult,
  useActionHandler: useCacheActionHandler,
} = createActionContext<CacheActions>('CacheActions');

// Action context for Order operations
export const {
  Provider: OrderActionProvider,
  useActionDispatch: useOrderAction,
  useActionDispatchWithResult: useOrderActionWithResult,
  useActionHandler: useOrderActionHandler,
} = createActionContext<OrderActions>('OrderActions');

// Action context for API operations
export const {
  Provider: ApiActionProvider,
  useActionDispatch: useApiAction,
  useActionDispatchWithResult: useApiActionWithResult,
  useActionHandler: useApiActionHandler,
} = createActionContext<ApiActions>('ApiActions');

export interface FlowControlDemoActions extends ActionPayloadMap {
  clearCache: void;
  toggleBusinessHours: void;
  adjustSystemLoad: { load: number };
  setSelectedScenario: { scenario: ScenarioKey };
  recordExecutionStep: { step: string };
  recordHandlerExecution: void;
  executeScenario: { scenario: ScenarioKey; payload: any };
}

export const {
  Provider: FlowControlDemoActionProvider,
  useActionDispatch: useFlowControlDemoAction,
  useActionCommandHandler: useFlowControlDemoActionCommandHandler,
} = createActionContext<FlowControlDemoActions>('FlowControlDemoActions');

// Store context for demo state management
export const {
  Provider: FlowControlStoreProvider,
  useStore: useFlowControlStore,
} = createStoreContext('FlowControlStores', {
  demoState: {
    selectedScenario: 'securityEscalation' as ScenarioKey,
    executionResults: [] as Array<
      SecurityResult | CacheResult | OrderResult | ApiResult
    >,
    executionPath: [] as string[],
    isExecuting: false,
    handlerExecutions: 0,
    systemLoad: 0.3,
    isBusinessHours: true,
  },
  cache: {
    memoryCache: new Map<string, any>(),
    redisCache: new Map<string, any>(),
  },
});

// Combined provider for all contexts
export function FlowControlProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SecurityActionProvider>
      <CacheActionProvider>
        <OrderActionProvider>
          <ApiActionProvider>
            <FlowControlDemoActionProvider>
              <FlowControlStoreProvider>{children}</FlowControlStoreProvider>
            </FlowControlDemoActionProvider>
          </ApiActionProvider>
        </OrderActionProvider>
      </CacheActionProvider>
    </SecurityActionProvider>
  );
}
