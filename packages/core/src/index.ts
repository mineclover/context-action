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
  ExecutionMode,
} from './types.js';

// Note: Logger utilities are now available from @context-action/logger package
// Applications should import logger functionality directly from @context-action/logger