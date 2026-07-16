export { ActionRegister } from './ActionRegister.js';

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
  ExecutionMode,
  DispatchOptions,
  ExecutionResult,
} from './types.js';

export { ActionGuard } from './action-guard.js';

export { executeSequential, executeParallel, executeRace } from './execution-modes.js';

// 🆕 React integration helpers (optional)
export {
  createActionHandler,
  ReactDevUtils,
  ReactActionError,
  isReactActionError
} from './react-helpers.js';

// ============================================
// Zod Schema Integration (optional - requires zod peer dependency)
// ============================================

// JSON Schema types (tool chain 호환)
export type {
  JSONSchema,
  JSONSchemaType,
  ToolAnnotations,
  ToolDefinition,
  MCPToolDefinition,
  OpenAIToolDefinition,
  AnthropicToolDefinition,
} from './json-schema.js';

// Standard tool protocol contracts
export {
  TOOL_CALL_ERROR_CODES,
  createToolCallError,
  createToolCallSuccess,
  getToolCallErrorMetadata,
  toToolCallRequest,
  toToolListRequest,
  withToolCallId,
} from './tool-protocol.js';

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
} from './tool-protocol.js';

// Action Schema (Zod 기반 Action 정의)
export {
  defineAction,
  createActionSchema,
  createActionFactory,
  zodToJsonSchema,
} from './action-schema.js';

export type {
  DefineActionOptions,
  UnifiedAction,
  ActionSchemaMap,
  InferActionPayloadMap,
  SafeParseResult,
} from './action-schema.js';

// Validation Errors
export {
  ActionValidationError,
  ActionTimeoutError,
  ActionRegisterDestroyedError,
  isActionValidationError,
  isActionTimeoutError,
  isActionRegisterDestroyedError,
} from './errors.js';
