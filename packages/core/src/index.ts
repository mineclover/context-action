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
  MCPToolDefinition,
  OpenAIToolDefinition,
  AnthropicToolDefinition,
} from './json-schema.js';

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
  isActionValidationError,
} from './errors.js';
