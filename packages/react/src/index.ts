// Re-export core types for convenience
export type { ActionPayloadMap, ActionHandler, HandlerConfig, PipelineController } from '@context-action/core';
export { ActionRegister } from '@context-action/core';

// React-specific exports
export * from './ActionContext';