/**
 * @fileoverview LogMonitor Context-Layered boundaries
 * @module LogMonitorContexts
 */

import type { ActionPayloadMap } from '@context-action/core';
import {
  createActionContext,
  createStoreContext,
} from '@context-action/react';
import { LogLevel } from '@/utils/logger';
import type { LogEntry, LogMonitorConfig } from '../types';

export interface LogMonitorStoreValues {
  logs: LogEntry[];
  logLevel: LogLevel;
  config: LogMonitorConfig;
}

export interface LogMonitorActions extends ActionPayloadMap {
  addLog: { entry: Omit<LogEntry, 'id' | 'timestamp'> };
  clearLogs: void;
  setLogLevel: { level: LogLevel };
  updateConfig: { configUpdate: Partial<LogMonitorConfig> };
  log: { message: string; data?: unknown };
}

export const {
  Provider: LogMonitorStoreProvider,
  useStore: useLogMonitorStore,
  useStoreManager: useLogMonitorStoreManager,
} = createStoreContext<LogMonitorStoreValues>('LogMonitor', {
  logs: { initialValue: [] as LogEntry[] },
  logLevel: { initialValue: LogLevel.DEBUG },
  config: {
    initialValue: {
      maxLogs: 50,
      defaultLogLevel: LogLevel.DEBUG,
      enableToast: true,
      enableAutoCleanup: true,
    } as LogMonitorConfig,
  },
});

export const {
  Provider: LogMonitorActionProvider,
  useActionDispatch: useLogMonitorAction,
  useActionHandler: useLogMonitorActionHandler,
} = createActionContext<LogMonitorActions>('LogMonitor');

