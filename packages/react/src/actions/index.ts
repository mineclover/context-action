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

// Main ActionProvider component and hooks
export { 
  ActionProvider, 
  useActionDispatch, 
  useActionContext, 
  useActionRegister,
  ActionContext 
} from './ActionProvider';

// Legacy ActionContext (deprecated)
export { 
  createActionContext,
  type ActionContextConfig 
} from './ActionContext';

// Re-export core types for convenience
export type {
  ActionPayloadMap,
  ActionHandler,
  HandlerConfig,
  PipelineController,
  ActionRegisterConfig
} from '@context-action/core';