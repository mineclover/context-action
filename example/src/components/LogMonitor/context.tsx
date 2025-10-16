/**
 * @fileoverview LogMonitor 컨텍스트 및 프로바이더
 * @module LogMonitorContext
 */

import { LogLevel } from '@/utils/logger';
import { useStoreValue, createActionContext, createStoreContext } from '@context-action/react';
import React, { useMemo } from 'react';
import type { ActionPayloadMap } from '@context-action/core';
import { LogMonitor } from './LogMonitor';
import type {
  LogEntry,
  LogMonitorConfig,
  LogMonitorContextValue,
} from './types';
import { createLogEntry, maintainMaxLogs } from './utils';

// LogMonitor Store Types 정의
export interface LogMonitorStores {
  logs: Array<LogEntry>;
  logLevel: LogLevel;
  config: LogMonitorConfig;
}

// LogMonitor Actions 정의 (Context-Action Action Pattern)
export interface LogMonitorActions extends ActionPayloadMap {
  addLog: { entry: Omit<LogEntry, 'id' | 'timestamp'> };
  clearLogs: void;
  setLogLevel: { level: LogLevel };
  updateConfig: { configUpdate: Partial<LogMonitorConfig> };
  log: { message: string; data?: unknown };
}

// Context-Action LogMonitor Store Context 생성
const {
  Provider: LogMonitorStoreProvider,
  useStore: useLogMonitorStore,
  useStoreManager: useLogMonitorStoreManager
} = createStoreContext<LogMonitorStores>('LogMonitor', {
  logs: { initialValue: [] as Array<LogEntry> },
  logLevel: { initialValue: LogLevel.DEBUG },
  config: { 
    initialValue: {
      maxLogs: 50,
      defaultLogLevel: LogLevel.DEBUG,
      enableToast: true,
      enableAutoCleanup: true,
    } as LogMonitorConfig 
  }
});

// Context-Action LogMonitor Action Context 생성
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

/**
 * ViewModel Layer - 액션 핸들러들
 */
function LogMonitorActionHandlers({ 
  pageId, 
  fallbackConfig 
}: { 
  pageId: string;
  fallbackConfig: LogMonitorConfig;
}) {
  const storeManager = useLogMonitorStoreManager();
  
  // addLog 핸들러 - 로그 추가
  useLogMonitorActionHandler('addLog', React.useCallback(async (payload) => {
    const logEntry = createLogEntry(pageId, payload.entry);
    const logsStore = storeManager.getStore('logs');
    const currentLogs = logsStore.getValue();
    const updatedLogs = maintainMaxLogs(
      currentLogs,
      logEntry,
      fallbackConfig.maxLogs
    );
    logsStore.setValue(updatedLogs);
  }, [pageId, storeManager, fallbackConfig.maxLogs]));

  // clearLogs 핸들러 - 로그 클리어
  useLogMonitorActionHandler('clearLogs', React.useCallback(async () => {
    const logsStore = storeManager.getStore('logs');
    logsStore.setValue([]);
  }, [storeManager]));

  // setLogLevel 핸들러 - 로그 레벨 설정
  useLogMonitorActionHandler('setLogLevel', React.useCallback(async (payload) => {
    const logLevelStore = storeManager.getStore('logLevel');
    logLevelStore.setValue(payload.level);
  }, [storeManager]));

  // updateConfig 핸들러 - 설정 업데이트
  useLogMonitorActionHandler('updateConfig', React.useCallback(async (payload) => {
    const configStore = storeManager.getStore('config');
    const currentConfig = configStore.getValue();
    const newConfig = { ...currentConfig, ...payload.configUpdate };
    configStore.setValue(newConfig);
  }, [storeManager]));

  // log 핸들러 - 시스템 로그
  useLogMonitorActionHandler('log', React.useCallback(async (payload) => {
    const logEntry = createLogEntry(pageId, {
      level: LogLevel.INFO,
      type: 'system',
      message: payload.message,
      details: payload.data,
    });
    const logsStore = storeManager.getStore('logs');
    const currentLogs = logsStore.getValue();
    const updatedLogs = maintainMaxLogs(
      currentLogs,
      logEntry,
      fallbackConfig.maxLogs
    );
    logsStore.setValue(updatedLogs);
  }, [pageId, storeManager, fallbackConfig.maxLogs]));

  return null;
}

/**
 * LogMonitor Provider 컴포넌트
 *
 * 페이지별로 독립적인 로그 모니터링 환경을 제공합니다.
 */
export function LogMonitorProvider({
  children,
  pageId,
  initialLogLevel = LogLevel.DEBUG,
  initialConfig = {},
}: LogMonitorProviderProps) {
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

  return (
    <LogMonitorStoreProvider>
      <LogMonitorActionProvider>
        <LogMonitorActionHandlers 
          pageId={pageId}
          fallbackConfig={fallbackConfig}
        />
        {children}
      </LogMonitorActionProvider>
    </LogMonitorStoreProvider>
  );
}

/**
 * Model Layer - 데이터 구독 훅들
 */
export function useLogMonitorLogs() {
  const logsStore = useLogMonitorStore('logs');
  const logs = useStoreValue(logsStore);
  
  return {
    logs,
    logCount: logs.length,
    hasLogs: logs.length > 0,
    latestLog: logs[logs.length - 1],
    getLogsByLevel: (level: LogLevel) => logs.filter(log => log.level === level)
  };
}

export function useLogMonitorConfig() {
  const logLevelStore = useLogMonitorStore('logLevel');
  const configStore = useLogMonitorStore('config');
  
  const logLevel = useStoreValue(logLevelStore);
  const config = useStoreValue(configStore);
  
  return {
    logLevel,
    config,
    isDebugMode: logLevel === LogLevel.DEBUG,
    isToastEnabled: config.enableToast
  };
}

/**
 * ViewModel Layer - 액션 디스패치 훅
 */
export function useLogMonitorActions() {
  const dispatch = useLogMonitorAction();
  
  return {
    addLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => dispatch('addLog', { entry }),
    clearLogs: () => dispatch('clearLogs'),
    setLogLevel: (level: LogLevel) => dispatch('setLogLevel', { level }),
    updateConfig: (configUpdate: Partial<LogMonitorConfig>) => dispatch('updateConfig', { configUpdate }),
    log: (message: string, data?: unknown) => dispatch('log', { message, data }),
  };
}

/**
 * 기존 호환성을 위한 통합 훅 (점진적 마이그레이션용)
 */
export function useLogMonitorContext(): LogMonitorContextValue {
  const { logs } = useLogMonitorLogs();
  const { logLevel, config } = useLogMonitorConfig();
  const actions = useLogMonitorActions();
  
  return {
    logs,
    logLevel,
    config,
    ...actions
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
