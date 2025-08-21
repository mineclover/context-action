/**
 * @fileoverview Action system exports - comprehensive action management
 * @implements actioncontext
 * @implements viewmodel-layer
 * @implements mvvm-pattern
 * @memberof api-terms
 * 
 * Comprehensive action system including context providers, enhanced type-safe contexts,
 * utilities for business logic coordination, and various patterns for managing user 
 * interactions and business logic flow.
 */

// === UNIFIED ACTION CONTEXT SYSTEM ===
// Factory-based action context with built-in abort support and all features
export { 
  // Main factory function for creating typed action contexts
  createActionContext
} from './ActionContext';

// Export all types from the dedicated types file
export type {
  ActionContextConfig,
  ActionContextType,
  ActionContextReturn
} from './ActionContext.types';

// === ACTION UTILITIES ===
// Reserved for future action utilities

// Re-export core types for convenience
export type {
  ActionPayloadMap,
  ActionHandler,
  HandlerConfig,
  PipelineController,
  ActionRegisterConfig
} from '@context-action/core';