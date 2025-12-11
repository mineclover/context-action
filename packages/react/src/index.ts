// ==============================================
// MAIN INDEX - Essential APIs Only
// ==============================================

// Action System (Core functionality)
export { createActionContext } from './actions/ActionContext';
export type { 
  ActionContextConfig,
  ActionContextReturn,
  ActionContextType
} from './actions/ActionContext.types';

// Store System (Core functionality)
export { createStore, Store } from './stores/core/Store';
export { useStoreValue } from './stores/hooks/useStoreValue';
export { useStoreSelector } from './stores/hooks/useStoreSelector';
export type { IStore, Snapshot } from './stores/core/types';

// Store Error Boundary (Essential for production apps)
export { StoreErrorBoundary } from './stores/components/StoreErrorBoundary';
export type { StoreErrorBoundaryProps } from './stores/components/StoreErrorBoundary';

// Declarative Store Pattern (Most commonly used)
export { createStoreContext, StoreManager } from './stores/patterns/declarative-store-pattern-v2';
export type { InitialStores, StoreConfig, WithProviderConfig } from './stores/patterns/declarative-store-pattern-v2';

// Ref System (Core functionality)
export { createRefContext } from './refs/createRefContext';
export type { RefContextReturn, CreateRefContextOptions } from './refs/createRefContext';
export type { RefTarget, RefOperationOptions, RefOperationResult } from './refs/types';

// Core types from @context-action/core
export type {
  ActionPayloadMap,
  ActionHandler,
  HandlerConfig,
  PipelineController,
  ActionRegisterConfig,
  ExecutionMode,
  UnregisterFunction
} from '@context-action/core';

export { ActionRegister } from '@context-action/core';

// ==============================================
// Zod Schema Integration (optional - requires zod peer dependency)
// ==============================================

// Re-export from @context-action/core for convenience
export {
  defineAction,
  createActionSchema,
  createActionFactory,
  zodToJsonSchema,
  ActionValidationError,
  isActionValidationError,
} from '@context-action/core';

export type {
  JSONSchema,
  JSONSchemaType,
  MCPToolDefinition,
  OpenAIToolDefinition,
  AnthropicToolDefinition,
  DefineActionOptions,
  UnifiedAction,
  ActionSchemaMap,
  InferActionPayloadMap,
  SafeParseResult,
} from '@context-action/core';

// ==============================================
// Tool Context (LLM Tool Registry)
// ==============================================

export { createToolContext } from './tools/ToolContext';
export type {
  ToolContextConfig,
  ToolContextReturn,
  ToolContextType,
  ToolRegistry,
  ToolDispatchFunction,
  ToolDispatchWithResultReturn,
  ToolExecutionResult,
  ToolValidationMode,
} from './tools/ToolContext.types';