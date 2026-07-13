/**
 * @fileoverview LogMonitor handler registry
 * @module LogMonitorHandlerRegistry
 */

import React, { useEffect, useState } from 'react';
import {
  useLogMonitorActionHandler,
  useLogMonitorStoreManager,
} from '../contexts/LogMonitorContexts';
import { LogLevel } from '@/utils/logger';
import { createLogEntry, maintainMaxLogs } from '../utils';
import type { LogMonitorConfig } from '../types';

interface LogMonitorHandlerRegistryProps {
  children?: React.ReactNode;
  pageId: string;
  fallbackConfig: LogMonitorConfig;
}

/**
 * Registers every LogMonitor action handler in one domain registry.
 *
 * The registry is required even for this small domain so registration,
 * cleanup, and store dependencies remain in the same reviewable boundary.
 */
export function LogMonitorHandlerRegistry({
  children,
  pageId,
  fallbackConfig,
}: LogMonitorHandlerRegistryProps) {
  const [ready, setReady] = useState(false);
  const storeManager = useLogMonitorStoreManager();

  useLogMonitorActionHandler(
    'addLog',
    React.useCallback(
      async (payload) => {
        const logEntry = createLogEntry(pageId, payload.entry);
        const logsStore = storeManager.getStore('logs');
        const updatedLogs = maintainMaxLogs(
          logsStore.getValue(),
          logEntry,
          fallbackConfig.maxLogs
        );
        logsStore.setValue(updatedLogs);
      },
      [pageId, storeManager, fallbackConfig.maxLogs]
    )
  );

  useLogMonitorActionHandler(
    'clearLogs',
    React.useCallback(async () => {
      storeManager.getStore('logs').setValue([]);
    }, [storeManager])
  );

  useLogMonitorActionHandler(
    'setLogLevel',
    React.useCallback(
      async (payload) => {
        storeManager.getStore('logLevel').setValue(payload.level);
      },
      [storeManager]
    )
  );

  useLogMonitorActionHandler(
    'updateConfig',
    React.useCallback(
      async (payload) => {
        const configStore = storeManager.getStore('config');
        configStore.setValue({
          ...configStore.getValue(),
          ...payload.configUpdate,
        });
      },
      [storeManager]
    )
  );

  useLogMonitorActionHandler(
    'log',
    React.useCallback(
      async (payload) => {
        const logEntry = createLogEntry(pageId, {
          level: LogLevel.INFO,
          type: 'system',
          message: payload.message,
          details: payload.data,
        });
        const logsStore = storeManager.getStore('logs');
        const updatedLogs = maintainMaxLogs(
          logsStore.getValue(),
          logEntry,
          fallbackConfig.maxLogs
        );
        logsStore.setValue(updatedLogs);
      },
      [pageId, storeManager, fallbackConfig.maxLogs]
    )
  );

  useEffect(() => {
    setReady(true);
  }, []);

  return ready ? <>{children}</> : null;
}
