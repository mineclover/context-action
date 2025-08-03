/**
 * @fileoverview Action system exports - ActionProvider and related functionality
 * @implements actionprovider
 * @implements viewmodel-layer
 * @implements mvvm-pattern
 * @memberof api-terms
 * @since 1.0.0
 * 
 * Provides React components and hooks for action management in the Context-Action framework.
 * This module includes ActionProvider for context setup and useActionDispatch for dispatching actions.
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

// Re-export core types for convenience
export type {
  ActionPayloadMap,
  ActionHandler,
  HandlerConfig,
  PipelineController,
  ActionRegisterConfig
} from '@context-action/core';