/**
 * @fileoverview LogMonitor 시스템의 타입 정의
 * @module LogMonitorTypes
 */

import type { LogLevel } from '../../utils/logger';
import type { ActionPayloadMap, Store } from '@context-action/react';

/**
 * 로그 엔트리 타입 정의
 */
export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  type: LogEntryType;
  message: string;
  details?: unknown;
  priority?: number;
}

/**
 * 로그 엔트리 타입 분류
 */
export type LogEntryType = 'action' | 'system' | 'error' | 'middleware';

/**
 * 로그 모니터 설정
 */
export interface LogMonitorConfig {
  maxLogs: number;
  defaultLogLevel: LogLevel;
  enableToast: boolean;
  enableAutoCleanup: boolean;
}

/**
 * 로그 모니터 컴포넌트 Props
 */
export interface LogMonitorProps {
  title?: string;
  maxHeight?: string;
  showControls?: boolean;
  className?: string;
  config?: Partial<LogMonitorConfig>;
}

/**
 * 액션 로거 옵션
 */
export interface ActionLogOptions {
  toast?: boolean | ToastOptions;
  priority?: number;
  context?: string;
  // 자동 계산된 데이터 (내부 사용)
  _autoCalculated?: {
    executionTime: number;
    timestamp: string;
    actionType: string;
  };
}

/**
 * 토스트 옵션 타입
 */
export interface ToastOptions {
  type?: 'success' | 'error' | 'info' | 'system';
  title?: string;
  message?: string;
}

/**
 * 내부 로깅 액션 맵
 */
export interface InternalLogActionMap extends ActionPayloadMap {
  '_internal.log.action': {
    actionType: string;
    payload?: unknown;
    options?: ActionLogOptions;
  };
  '_internal.log.error': {
    message: string;
    error?: Error | unknown;
    options?: ActionLogOptions;
  };
  '_internal.log.system': {
    message: string;
    options?: ActionLogOptions;
  };
}

/**
 * 안정적인 로거 API 인터페이스
 */
export interface StableLoggerAPI {
  logAction: (
    actionType: string,
    payload?: unknown,
    options?: ActionLogOptions
  ) => void;
  logError: (
    message: string,
    error?: Error | unknown,
    options?: ActionLogOptions
  ) => void;
  logSystem: (message: string, options?: ActionLogOptions) => void;
}

/**
 * 로그 모니터 컨텍스트 타입
 */
export interface LogMonitorContextValue {
  logs: LogEntry[];
  addLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
  logLevel: LogLevel;
  setLogLevel: (level: LogLevel) => void;
  config: LogMonitorConfig;
  updateConfig: (update: Partial<LogMonitorConfig>) => void;
}

/**
 * 액션 메시지 매핑 타입
 */
export interface ActionMessage {
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'system';
}

/**
 * 액션 메시지 매핑
 */
export type ActionMessageMap = Record<string, ActionMessage>;

/**
 * 로그 엔트리 팩토리 옵션
 */
export interface LogEntryFactoryOptions {
  pageId: string;
  maxLogs?: number;
}

/**
 * 로그 레벨 색상 매핑
 */
export type LogLevelColorMap = Record<LogLevel, string>;

/**
 * 로그 타입 색상 매핑
 */
export type LogTypeColorMap = Record<LogEntryType, string>;

/**
 * 로그 모니터용 스토어 타입 정의
 */
export interface LogMonitorStores {
  logs: Store<LogEntry[]>;
  logLevel: Store<LogLevel>;
  config: Store<LogMonitorConfig>;
}
