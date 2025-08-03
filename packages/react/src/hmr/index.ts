/**
 * @fileoverview HMR (Hot Module Replacement) Support Module Exports
 * 기존 코드를 건드리지 않고 외부에서 HMR 기능을 추가하는 모듈들
 */

// Core HMR State Management
export { hmrStateManager, HMRStateManager } from './hmr-state-manager';
export type { 
  HMRStoreState, 
  HMRHandlerInfo, 
  HMRGlobalState 
} from './hmr-state-manager';

// Store HMR Support
export { 
  StoreHMRWrapper, 
  enableStoreHMR, 
  enableStoresHMR,
  getStoreHMRStats
} from './store-hmr-support';
export type { 
  StoreHMRConfig,
  StoreHMRStats
} from './store-hmr-support';

// React HMR Integration Hooks
export {
  useStoreHMR,
  useActionRegisterHMR,
  useIntegratedHMR,
  useMultiStoreHMR,
  useHMRDevTools
} from './react-hmr-hooks';
export type {
  ReactHMRConfig,
  UseStoreHMRResult,
  UseActionRegisterHMRResult
} from './react-hmr-hooks';

// HMR Development Tools
export { 
  HMRDevDashboard, 
  AutoHMRDashboard 
} from './hmr-dev-dashboard';

// Auto HMR Dashboard (minimal, auto-enabled)
export {
  AutoHMRStatus,
  GlobalAutoHMRStatus
} from './auto-hmr-dashboard';

// HMR Specialized Logging
export { hmrLogger, HMRLogUtils } from './hmr-logger';
export type { 
  HMRLogCategory, 
  HMRLogLevel, 
  HMRLogEntry, 
  HMRLogSubscriber 
} from './hmr-logger';

// Re-export React HMR types for convenience
export type { 
  ActionRegisterHMRConfig 
} from './react-hmr-hooks';

// Auto HMR System
export {
  autoEnableStoreHMR,
  autoEnableActionRegisterHMR,
  shouldAutoEnableHMRTools,
  getAutoHMRStats,
  clearAutoHMR
} from './auto-hmr';