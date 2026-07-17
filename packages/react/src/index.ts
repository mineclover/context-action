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
export { createStore, Store, type PatchAwareListener } from './stores/core/Store';
export {
  createTimeTravelStore,
  TimeTravelStore,
  isTimeTravelStore
} from './stores/core/TimeTravelStore';
export type { TimeTravelStoreOptions } from './stores/core/TimeTravelStore';
export { useStoreValue } from './stores/hooks/useStoreValue';
export { useStoreSelector } from './stores/hooks/useStoreSelector';
export { useStorePath, useStoreSelectorWithPaths } from './stores/hooks/useStorePath';
export type { StorePath, UseStorePathOptions, UseStoreSelectorWithPathsOptions } from './stores/hooks/useStorePath';
export { useTimeTravelControls } from './stores/hooks/useTimeTravelControls';
export type { TimeTravelControlsState } from './stores/hooks/useTimeTravelControls';
export { useTimeTravelPath, useTimeTravelSelector } from './stores/hooks/useTimeTravelPath';
export type { UseTimeTravelPathOptions, UseTimeTravelSelectorOptions } from './stores/hooks/useTimeTravelPath';
export type { IStore, Snapshot } from './stores/core/types';

// Re-export Patches type from mutative for subscribeWithPatches users
export type { Patches, TravelPatches } from '@context-action/mutative';

// Store Error Boundary (Essential for production apps)
export { StoreErrorBoundary } from './stores/components/StoreErrorBoundary';
export type { StoreErrorBoundaryProps } from './stores/components/StoreErrorBoundary';

// Declarative Store Pattern (Most commonly used)
export { createStoreContext, StoreManager, asStoreValue } from './stores/patterns/declarative-store-pattern-v2';
export type {
  InitialStores,
  StoreConfig,
  ExplicitStoreValue,
  WithProviderConfig,
} from './stores/patterns/declarative-store-pattern-v2';

// Time Travel Store Pattern (Store Context with undo/redo)
export { createTimeTravelStoreContext, TimeTravelStoreManager } from './stores/patterns/time-travel-store-pattern';
export type {
  TimeTravelStoreConfig,
  TimeTravelInitialStores,
  TimeTravelControlsState as TimeTravelContextControlsState,
  InferTimeTravelStoreTypes
} from './stores/patterns/time-travel-store-pattern';

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
  ToolAnnotations,
  ToolDefinition,
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
  ToolPolicy,
  ToolPolicyDecision,
  ToolPolicyInput,
  ToolContextReturn,
  ToolContextType,
  ToolRegistry,
  ToolDispatchFunction,
  ToolDispatchWithResultReturn,
  ToolExecutionResult,
  ToolValidationMode,
} from './tools/ToolContext.types';

// Standard tool protocol contracts
export type {
  ToolCallErrorCode,
  ToolCallErrorMetadata,
  ModelToolCall,
  ToolArguments,
  ToolCallContext,
  ToolCallSource,
  ToolCallMode,
  ToolCallError,
  ToolCallEvent,
  ToolCallId,
  ToolCallOptions,
  ToolCallRequest,
  ToolCallResult,
  ToolListRequest,
  ToolListRequestOptions,
  ToolListResult,
  ToolManagementInterface,
  ToolCallObserver,
  ToolContent,
  ToolJsonContent,
  ToolTextContent,
} from '@context-action/core';
export {
  getToolCallErrorMetadata,
  isToolCallRequest,
  isToolCallResult,
  isToolListRequest,
  isToolListResult,
  listAllTools,
  TOOL_CALL_ERROR_CODES,
  toOpenAIToolDefinitions,
  toToolCallRequest,
  toToolListRequest,
} from '@context-action/core';
