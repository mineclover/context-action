/**
 * @fileoverview Action system exports - comprehensive action management
 * @implements actioncontext
 * @implements viewmodel-layer
 * @implements mvvm-pattern
 * @memberof api-terms
 * @since 1.0.0
 * 
 * Comprehensive action system including context providers, enhanced type-safe contexts,
 * utilities for business logic coordination, and various patterns for managing user 
 * interactions and business logic flow.
 */

// === UNIFIED ACTION CONTEXT SYSTEM ===
// Factory-based action context with built-in abort support
export { 
  // Factory function for creating typed action contexts
  createActionContext,
  type ActionContextConfig,
  type ActionContextReturn
} from './ActionContext';

// === ACTION UTILITIES ===
// Business logic coordination and validation helpers
export * from './utils';

// Re-export core types for convenience
export type {
  ActionPayloadMap,
  ActionHandler,
  HandlerConfig,
  PipelineController,
  ActionRegisterConfig
} from '@context-action/core';