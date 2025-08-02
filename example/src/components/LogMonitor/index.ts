/**
 * @fileoverview LogMonitor 시스템 메인 export
 * @module LogMonitor
 */

// 타입 정의
export type {
  LogEntry,
  LogEntryType,
  LogMonitorConfig,
  LogMonitorProps,
  ActionLogOptions,
  ToastOptions,
  InternalLogActionMap,
  StableLoggerAPI,
  LogMonitorContextValue,
  ActionMessage,
  ActionMessageMap,
  LogEntryFactoryOptions,
  LogLevelColorMap,
  LogTypeColorMap,
} from './types';

// 스토어 레지스트리
export { 
  LogMonitorStoreRegistry,
  logMonitorStoreRegistry,
} from './store-registry';

// 유틸리티 함수들
export {
  generateLogEntryId,
  getCurrentTimeString,
  getLogLevelColor,
  getLogTypeColor,
  getLogLevelName,
  createLogEntry,
  maintainMaxLogs,
  getActionMessage,
  ACTION_MESSAGES,
  LOG_LEVEL_COLORS,
  LOG_TYPE_COLORS,
  LOG_LEVEL_NAMES,
} from './utils';

// 컨텍스트 및 프로바이더
export {
  useLogMonitorContext,
  LogMonitorProvider,
  PageWithLogMonitor,
} from './context';

// 훅들
export {
  useLogMonitor,
  useActionLogger,
  useActionLoggerWithToast,
  useActionLoggerWithCustomToast,
  usePureActionLogger,
  type ToastSystem,
} from './hooks';

// 메인 컴포넌트
export { LogMonitor } from './LogMonitor';

// 기본 내보내기 (하위 호환성)
export { LogMonitor as default } from './LogMonitor';