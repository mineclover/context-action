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
// Factory-based action context with built-in abort support
export { 
  // Factory function for creating typed action contexts
  createActionContext,
  type ActionContextConfig,
  type ActionContextReturn
} from './ActionContext';

// === SIMPLE ACTION CONTEXT (권장) ===
// createRefContext와 동일한 심플한 스타일
export { 
  createActionContext as createSimpleActionContext
} from './createActionContext';

export type {
  SimpleActionContextReturn
} from './createActionContext';

// === DECLARATIVE ACTION PATTERN (하위 호환성) ===
// 선언적 Action Pattern
export { 
  createDeclarativeActionPattern,
  action,
  actionWithHandler,
  actionWithConfig
} from './declarative-action-pattern';

export type {
  ActionDefinition,
  ActionDefinitions,
  InferActionTypes,
  ActionRefDefinitions,
  DeclarativeActionContextReturn,
  DeclarativeActionRefContextReturn
} from './declarative-action-pattern';

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