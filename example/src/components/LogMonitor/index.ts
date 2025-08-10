/**
 * @fileoverview LogMonitor 시스템 메인 export
 * @module LogMonitor
 */

// 컨텍스트 및 프로바이더
export {
  LogMonitorProvider,
  PageWithLogMonitor,
  useLogMonitorContext,
} from './context';
// 훅들
export {
  type ToastSystem,
  useActionLogger,
  useActionLoggerWithCustomToast,
  useActionLoggerWithToast,
  useLogMonitor,
  usePureActionLogger,
} from './hooks';
// 메인 컴포넌트
// 기본 내보내기 (하위 호환성)
export { LogMonitor, LogMonitor as default } from './LogMonitor';
// 스토어 레지스트리
export {
  LogMonitorStoreRegistry,
  logMonitorStoreRegistry,
} from './store-registry';
// 타입 정의
export type {
  ActionLogOptions,
  ActionMessage,
  ActionMessageMap,
  InternalLogActionMap,
  LogEntry,
  LogEntryFactoryOptions,
  LogEntryType,
  LogLevelColorMap,
  LogMonitorConfig,
  LogMonitorContextValue,
  LogMonitorProps,
  LogTypeColorMap,
  StableLoggerAPI,
  ToastOptions,
} from './types';
// 유틸리티 함수들
export {
  ACTION_MESSAGES,
  createLogEntry,
  generateLogEntryId,
  getActionMessage,
  getCurrentTimeString,
  getLogLevelColor,
  getLogLevelName,
  getLogTypeColor,
  LOG_LEVEL_COLORS,
  LOG_LEVEL_NAMES,
  LOG_TYPE_COLORS,
  maintainMaxLogs,
} from './utils';
