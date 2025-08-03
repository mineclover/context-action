/**
 * @fileoverview Development Tools Types
 */

export interface PerformanceMetrics {
  actionExecutionTime: number;
  renderTime: number;
  storeUpdateTime: number;
  totalTime: number;
  timestamp: number;
}

export interface ActionProfile {
  actionType: string;
  payload: any;
  executionTime: number;
  storeChanges: Array<{
    storeName: string;
    oldValue: any;
    newValue: any;
  }>;
  timestamp: number;
  stackTrace?: string;
}

export interface StoreSnapshot {
  name: string;
  value: any;
  lastUpdate: number;
  listenerCount: number;
  updateHistory: Array<{
    timestamp: number;
    oldValue: any;
    newValue: any;
  }>;
}

export interface DevToolsConfig {
  enablePerformanceMonitoring: boolean;
  enableActionProfiling: boolean;
  enableStoreInspection: boolean;
  enableTimeline: boolean;
  maxHistorySize: number;
  autoOpenDashboard: boolean;
}