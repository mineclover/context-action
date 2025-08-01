/**
 * @fileoverview Core exports for Context-Action framework
 * Provides type-safe action pipeline management with Store integration
 */

// Core ActionRegister class and types
export { ActionRegister } from './ActionRegister.js';

// Type definitions
export type {
  ActionPayloadMap,
  ActionHandler,
  HandlerConfig,
  HandlerRegistration,
  PipelineContext,
  PipelineController,
  ActionRegisterConfig,
  UnregisterFunction,
  ActionDispatcher,
  ActionMetrics,
  ActionRegisterEvents,
  EventHandler,
  EventEmitter,
} from './types.js';

// Logger types and utilities from separate logger package
export type { Logger, LogLevel } from '@context-action/logger';
export {
  ConsoleLogger,
  NoopLogger,
  createLogger,
  getLogLevelFromEnv,
  getLoggerNameFromEnv,
  getDebugFromEnv,
} from '@context-action/logger';