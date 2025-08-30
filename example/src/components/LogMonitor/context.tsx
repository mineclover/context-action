/**
 * @fileoverview LogMonitor 컨텍스트 및 프로바이더
 * @module LogMonitorContext
 */

import { LogLevel } from '@/utils/logger';
import { useStoreValue, createActionContext } from '@context-action/react';
import React, { useEffect, useMemo } from 'react';
import type { ActionPayloadMap } from '@context-action/core';
import { LogMonitor } from './LogMonitor';
import { logMonitorStoreRegistry } from './store-registry';
import type {
  LogEntry,
  LogMonitorConfig,
  LogMonitorContextValue,
  LogMonitorProps,
  LogMonitorStores,
} from './types';
import { createLogEntry, maintainMaxLogs } from './utils';

// LogMonitor Actions 정의 (Context-Action Action Pattern)
export interface LogMonitorActions extends ActionPayloadMap {
  addLog: { entry: Omit<LogEntry, 'id' | 'timestamp'> };
  clearLogs: void;
  setLogLevel: { level: LogLevel };
  updateConfig: { configUpdate: Partial<LogMonitorConfig> };
  log: { message: string; data?: unknown };
}

// Context-Action LogMonitor Context 생성
const {
  Provider: LogMonitorActionProvider,
  useActionDispatch: useLogMonitorAction,
  useActionHandler: useLogMonitorActionHandler
} = createActionContext<LogMonitorActions>('LogMonitor');

/**
 * LogMonitor Provider Props
 */
interface LogMonitorProviderProps {
  children: React.ReactNode;
  pageId: string;
  initialLogLevel?: LogLevel;
  initialConfig?: Partial<LogMonitorConfig>;
}

// LogMonitor Action Handlers 컴포넌트
function LogMonitorActionHandlers({ 
  pageId, 
  stores,
  fallbackConfig 
}: { 
  pageId: string;
  stores: LogMonitorStores;
  fallbackConfig: LogMonitorConfig;
}) {
  // Action Handlers 등록
  useLogMonitorActionHandler('addLog', React.useCallback(async (payload) => {
    const logEntry = createLogEntry(pageId, payload.entry);
    const currentLogs = stores.logs.getValue();
    const updatedLogs = maintainMaxLogs(
      currentLogs,
      logEntry,
      fallbackConfig.maxLogs
    );
    stores.logs.setValue(updatedLogs);
  }, [pageId, stores, fallbackConfig.maxLogs]));

  useLogMonitorActionHandler('clearLogs', React.useCallback(async () => {
    stores.logs.setValue([]);
  }, [stores]));

  useLogMonitorActionHandler('setLogLevel', React.useCallback(async (payload) => {
    stores.logLevel.setValue(payload.level);
  }, [stores]));

  useLogMonitorActionHandler('updateConfig', React.useCallback(async (payload) => {
    const currentConfig = stores.config.getValue();
    const newConfig = { ...currentConfig, ...payload.configUpdate };
    stores.config.setValue(newConfig);
  }, [stores]));

  useLogMonitorActionHandler('log', React.useCallback(async (payload) => {
    const logEntry = createLogEntry(pageId, {
      level: LogLevel.INFO,
      type: 'system',
      message: payload.message,
      details: payload.data,
    });
    const currentLogs = stores.logs.getValue();
    const updatedLogs = maintainMaxLogs(
      currentLogs,
      logEntry,
      fallbackConfig.maxLogs
    );
    stores.logs.setValue(updatedLogs);
  }, [pageId, stores, fallbackConfig.maxLogs]));

  return null;
}

/**
 * LogMonitor Provider 컴포넌트
 *
 * 페이지별로 독립적인 로그 모니터링 환경을 제공합니다.
 * 스토어 레지스트리를 통해 각 페이지의 로그를 분리 관리합니다.
 */
export function LogMonitorProvider({
  children,
  pageId,
  initialLogLevel = LogLevel.DEBUG,
  initialConfig = {},
}: LogMonitorProviderProps) {
  // 페이지별 스토어 가져오기
  const stores: LogMonitorStores = useMemo(() => {
    return logMonitorStoreRegistry.getStores(
      pageId,
      initialLogLevel,
      initialConfig
    );
  }, [pageId, initialLogLevel, initialConfig]);

  // config 안정화 - fallback 값을 미리 계산하여 참조 안정성 보장
  const fallbackConfig = useMemo(
    () =>
      ({
        maxLogs: 50,
        defaultLogLevel: initialLogLevel,
        enableToast: true,
        enableAutoCleanup: true,
        ...initialConfig,
      }) as LogMonitorConfig,
    [initialLogLevel, initialConfig]
  );

  // 페이지 초기화 관리 (Store 직접 조작 없음)
  useEffect(() => {
    // cleanup만 처리, 초기화 로그는 Actions를 통해 처리
    return () => {
      if (fallbackConfig.enableAutoCleanup) {
        setTimeout(() => {
          logMonitorStoreRegistry.clearStores(pageId);
        }, 1000);
      }
    };
  }, [pageId, fallbackConfig.enableAutoCleanup]);

  return (
    <LogMonitorActionProvider>
      <LogMonitorActionHandlers 
        pageId={pageId}
        stores={stores}
        fallbackConfig={fallbackConfig}
      />
      {children}
    </LogMonitorActionProvider>
  );
}

/**
 * Context-Action 기반 LogMonitor 컨텍스트 훅 (기존 호환성 유지)
 */
export function useLogMonitorContext(): LogMonitorContextValue {
  // Context-Action 기반으로 마이그레이션 완료
  
  // 임시로 기본값 반환 (실제 구현에서는 pageId 기반 store registry에서 가져와야 함)
  const dispatch = useLogMonitorAction();
  
  return {
    logs: [],
    logLevel: LogLevel.DEBUG,
    config: {
      maxLogs: 50,
      defaultLogLevel: LogLevel.DEBUG,
      enableToast: true,
      enableAutoCleanup: true,
    },
    addLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => dispatch('addLog', { entry }),
    clearLogs: () => dispatch('clearLogs'),
    setLogLevel: (level: LogLevel) => dispatch('setLogLevel', { level }),
    updateConfig: (configUpdate: Partial<LogMonitorConfig>) => dispatch('updateConfig', { configUpdate }),
    log: (message: string, data?: unknown) => dispatch('log', { message, data }),
  };
}

/**
 * Context-Action 기반 LogMonitor 액션 훅 (편의용)
 */
export function useLogMonitor() {
  const dispatch = useLogMonitorAction();
  
  return {
    addLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => 
      dispatch('addLog', { entry }),
    clearLogs: () => 
      dispatch('clearLogs'),
    setLogLevel: (level: LogLevel) => 
      dispatch('setLogLevel', { level }),
    updateConfig: (configUpdate: Partial<LogMonitorConfig>) => 
      dispatch('updateConfig', { configUpdate }),
    log: (message: string, data?: unknown) => 
      dispatch('log', { message, data }),
  };
}

/**
 * 페이지 래퍼 컴포넌트 (편의용)
 *
 * LogMonitorProvider와 함께 자동으로 LogMonitor 컴포넌트를 포함합니다.
 */
interface PageWithLogMonitorProps {
  children: React.ReactNode;
  pageId: string;
  title?: string;
  logMonitorProps?: Record<string, unknown>;
  initialLogLevel?: LogLevel;
  initialConfig?: Partial<LogMonitorConfig>;
}

export function PageWithLogMonitor({
  children,
  pageId,
  title,
  logMonitorProps = {},
  initialLogLevel,
  initialConfig,
}: PageWithLogMonitorProps) {
  // LogMonitor 컴포넌트 정적 import로 사용

  return (
    <LogMonitorProvider
      pageId={pageId}
      {...(initialLogLevel !== undefined && { initialLogLevel })}
      {...(initialConfig !== undefined && { initialConfig })}
    >
      <div className="page-with-log-monitor">
        {children}
        <LogMonitor
          {...(title && { title: `${title} - Log Monitor` })}
          {...logMonitorProps}
        />
      </div>
    </LogMonitorProvider>
  );
}
