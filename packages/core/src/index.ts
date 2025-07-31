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
  Logger,
} from './types.js';

export { LogLevel } from './types.js';

// Logger utilities
export {
  ConsoleLogger,
  NoopLogger,
  createLogger,
  getLogLevelFromEnv,
} from './logger.js';