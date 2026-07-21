/**
 * Framework-neutral action schema and tool protocol contracts.
 *
 * This package owns the boundary between action schemas and provider
 * transports. It deliberately has no dependency on the action runtime or on
 * React so adapters and registries can share the same contracts.
 */

export type {
  JSONSchema,
  JSONSchemaType,
  ToolAnnotations,
  ToolDefinition,
  MCPToolDefinition,
  OpenAIToolDefinition,
  AnthropicToolDefinition,
} from './json-schema.js';

export {
  TOOL_CALL_ERROR_CODES,
  createToolApprovalQueue,
  createToolCallError,
  createToolCallSuccess,
  getToolCallErrorMetadata,
  isToolApprovalSnapshot,
  isToolCallRequest,
  isToolCallResult,
  isToolListRequest,
  isToolListResult,
  listAllTools,
  stringifyToolContent,
  stringifyToolContentBlock,
  toAnthropicToolDefinition,
  toAnthropicToolDefinitions,
  toOpenAIToolDefinition,
  toOpenAIToolDefinitions,
  toToolCallRequest,
  toToolListRequest,
  withToolCallId,
} from './tool-protocol.js';

export {
  createToolCallFingerprint,
  createToolIdempotencyRegistry,
  createToolOperationKey,
  isValidToolIdempotencyKey,
} from './idempotency.js';

export type {
  ToolIdempotencyClaim,
  ToolIdempotencyClaimStatus,
  ToolIdempotencyRegistry,
  ToolIdempotencyRegistryOptions,
} from './idempotency.js';

export {
  createToolExecutionProvenance,
  measureToolOutputBytes,
  parseToolExecutionProvenance,
  TOOL_EXECUTION_PROVENANCE_SCHEMA,
} from './execution-provenance.js';

export type {
  ToolExecutionProvenance,
  ToolExecutionProvenanceOptions,
  ToolExecutionProvenanceState,
} from './execution-provenance.js';

export {
  createToolObservabilityPolicy,
  createToolObservationSink,
  DEFAULT_TOOL_OBSERVABILITY_POLICY,
  isToolObservationRetained,
  projectToolCallObservation,
  redactToolObservabilityValue,
  sanitizeToolCallDiagnostic,
  sanitizeToolCallDiagnosticReason,
  serializeToolObservabilityValue,
  TOOL_OBSERVATION_SCHEMA,
  TOOL_OBSERVATION_SINK_SCHEMA,
  TOOL_OBSERVABILITY_POLICY_SCHEMA,
} from './observability.js';

export type {
  ToolObservation,
  ToolObservationContext,
  ToolObservationRequest,
  ToolObservationResult,
  ToolObservationSink,
  ToolObservationSinkRecord,
  ToolObservabilityPolicy,
  ToolObservabilityPolicyOptions,
} from './observability.js';

export type {
  ToolCallErrorCode,
  ToolCallErrorMetadata,
  ModelToolCall,
  ToolArguments,
  ToolCallContext,
  ToolApprovalSnapshot,
  ToolApprovalDecision,
  ToolApprovalQueue,
  ToolApprovalQueueOptions,
  ToolApprovalRequestInput,
  ToolApprovalStore,
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
  ListAllToolsOptions,
  ToolManagementInterface,
  ToolCallObserver,
  ToolContent,
  ToolJsonContent,
  ToolTextContent,
} from './tool-protocol.js';

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
