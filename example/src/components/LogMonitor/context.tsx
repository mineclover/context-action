/**
 * @fileoverview LogMonitor 컨텍스트 및 프로바이더
 * @module LogMonitorContext
 */

import { LogLevel } from '../../utils/logger';
import { useStoreValue } from '@context-action/react';
import React, { createContext, useContext, useEffect, useMemo } from 'react';
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

/**
 * LogMonitor 컨텍스트
 */
const LogMonitorContext = createContext<LogMonitorContextValue | null>(null);

/**
 * LogMonitor 컨텍스트 훅
 *
 * @throws LogMonitor Provider 외부에서 사용 시 에러 발생
 * @returns LogMonitor 컨텍스트 값
 */
export function useLogMonitorContext(): LogMonitorContextValue {
  const context = useContext(LogMonitorContext);
  if (!context) {
    throw new Error(
      'useLogMonitorContext must be used within a LogMonitorProvider'
    );
  }
  return context;
}

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

  // 스토어 값 구독
  const logs = useStoreValue(stores.logs) ?? [];
  const logLevel = useStoreValue(stores.logLevel) ?? initialLogLevel;

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

  const config = useStoreValue(stores.config) ?? fallbackConfig;

  // 안정적인 API 함수들 생성
  const stableAPI = useMemo(() => {
    return {
      addLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
        const logEntry = createLogEntry(pageId, entry);
        const currentLogs = stores.logs.getValue();
        const updatedLogs = maintainMaxLogs(
          currentLogs,
          logEntry,
          fallbackConfig.maxLogs
        );
        stores.logs.setValue(updatedLogs);
      },

      clearLogs: () => {
        stores.logs.setValue([]);
      },

      setLogLevel: (level: LogLevel) => {
        stores.logLevel.setValue(level);
      },

      updateConfig: (configUpdate: Partial<LogMonitorConfig>) => {
        const currentConfig = stores.config.getValue();
        const newConfig = { ...currentConfig, ...configUpdate };
        stores.config.setValue(newConfig);
      },
    };
  }, [pageId, stores, fallbackConfig.maxLogs]);

  // 페이지 초기화 관리 (Store 직접 조작 없음)
  useEffect(() => {
    // cleanup만 처리, 초기화 로그는 stableAPI를 통해 처리
    return () => {
      if (fallbackConfig.enableAutoCleanup) {
        setTimeout(() => {
          logMonitorStoreRegistry.clearStores(pageId);
        }, 1000);
      }
    };
  }, [pageId, fallbackConfig.enableAutoCleanup]);

  // 주의: 초기화 로그는 무한 루프를 유발할 수 있어 제거
  // 필요시 애플리케이션 레벨에서 수동으로 addLog 호출

  // 컨텍스트 값 생성
  const contextValue: LogMonitorContextValue = useMemo(
    () => ({
      logs,
      addLog: stableAPI.addLog,
      clearLogs: stableAPI.clearLogs,
      logLevel,
      setLogLevel: stableAPI.setLogLevel,
      config,
      updateConfig: stableAPI.updateConfig,
    }),
    [logs, logLevel, config, stableAPI]
  );

  return (
    <LogMonitorContext.Provider value={contextValue}>
      {children}
    </LogMonitorContext.Provider>
  );
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
      initialLogLevel={initialLogLevel}
      initialConfig={initialConfig}
    >
      <div className="page-with-log-monitor">
        {children}
        <LogMonitor
          title={title ? `${title} - Log Monitor` : undefined}
          {...logMonitorProps}
        />
      </div>
    </LogMonitorProvider>
  );
}
