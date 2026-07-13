/**
 * @fileoverview LogMonitor 컨텍스트 및 프로바이더
 * @module LogMonitorContext
 */

import { useStoreValue } from '@context-action/react';
import React, { useMemo } from 'react';
import { LogLevel } from '@/utils/logger';
import { LogMonitor } from './LogMonitor';
import type {
  LogEntry,
  LogMonitorContextValue,
  LogMonitorConfig,
} from './types';
import {
  LogMonitorActionProvider,
  LogMonitorStoreProvider,
  useLogMonitorAction,
  useLogMonitorStore,
} from './contexts/LogMonitorContexts';
import { LogMonitorHandlerRegistry } from './handlers/LogMonitorHandlerRegistry';

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
    <LogMonitorActionProvider>
      <LogMonitorStoreProvider>
        <LogMonitorHandlerRegistry
          pageId={pageId}
          fallbackConfig={fallbackConfig}
        >
          {children}
        </LogMonitorHandlerRegistry>
      </LogMonitorStoreProvider>
    </LogMonitorActionProvider>
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
    getLogsByLevel: (level: LogLevel) =>
      logs.filter((log) => log.level === level),
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
    isToastEnabled: config.enableToast,
  };
}

/**
 * ViewModel Layer - 액션 디스패치 훅
 */
export function useLogMonitorActions() {
  const dispatch = useLogMonitorAction();

  return {
    addLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) =>
      dispatch('addLog', { entry }),
    clearLogs: () => dispatch('clearLogs'),
    setLogLevel: (level: LogLevel) => dispatch('setLogLevel', { level }),
    updateConfig: (configUpdate: Partial<LogMonitorConfig>) =>
      dispatch('updateConfig', { configUpdate }),
    log: (message: string, data?: unknown) =>
      dispatch('log', { message, data }),
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
    ...actions,
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
    clearLogs: () => dispatch('clearLogs'),
    setLogLevel: (level: LogLevel) => dispatch('setLogLevel', { level }),
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
