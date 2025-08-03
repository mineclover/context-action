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

// === ENHANCED TYPE-SAFE ACTION SYSTEM ===
// Primary recommendation for complex applications
export { 
  createActionContext,
  type ActionContextConfig 
} from './ActionContext';

// === SIMPLE ACTION PROVIDER ===  
// For simple applications and quick prototypes
export { 
  ActionProvider, 
  useActionDispatch, 
  useActionContext, 
  useActionRegister,
  ActionContext 
} from './ActionProvider';

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