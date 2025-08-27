/**
 * DevTools 관련 타입 정의
 */

export interface DevToolsAction {
  type: string;
  payload?: any;
  timestamp: number;
  storeName?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface DevToolsState {
  stores: Record<string, {
    value: any;
    timestamp: number;
    version: number;
  }>;
  actions: DevToolsAction[];
  performance: {
    totalActions: number;
    averageActionTime: number;
    slowActions: DevToolsAction[];
  };
}

export interface StoreChange {
  storeName: string;
  oldValue: any;
  newValue: any;
  timestamp: number;
  action?: DevToolsAction;
}

export interface PerformanceMetrics {
  actionExecutionTime: number;
  storeUpdateTime: number;
  renderTime?: number;
  memoryUsage?: number;
}

export namespace DevToolsTypes {
  export const STORE_UPDATE = '@context-action/STORE_UPDATE';
  export const ACTION_DISPATCH = '@context-action/ACTION_DISPATCH';
  export const ACTION_COMPLETE = '@context-action/ACTION_COMPLETE';
  export const PERFORMANCE_LOG = '@context-action/PERFORMANCE_LOG';
  export const STATE_SNAPSHOT = '@context-action/STATE_SNAPSHOT';
  export const TIME_TRAVEL = '@context-action/TIME_TRAVEL';
}

export interface DevToolsExtension {
  connect: (config?: any) => DevToolsConnection;
  disconnect: () => void;
}

export interface DevToolsConnection {
  send: (action: DevToolsAction, state: any) => void;
  subscribe: (listener: (message: any) => void) => () => void;
  unsubscribe: () => void;
  init: (state: any) => void;
  error: (error: string) => void;
}