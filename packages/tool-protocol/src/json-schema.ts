/**
 * JSON Schema Type Definitions
 *
 * Tool chain 표준 포맷 (MCP, OpenAI, Anthropic API 호환)
 * Based on JSON Schema draft-07
 *
 * @see https://json-schema.org/draft-07/json-schema-release-notes.html
 */

// ============================================
// JSON Schema Type
// ============================================

/**
 * JSON Schema 기본 타입
 */
export type JSONSchemaType =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'array'
  | 'object'
  | 'null';

// ============================================
// JSON Schema Interface
// ============================================

/**
 * JSON Schema 인터페이스 (draft-07 호환)
 *
 * Tool chain (MCP, OpenAI, Anthropic) 포맷 변환의 기반이 되는 타입입니다.
 * Zod 스키마에서 z.toJSONSchema()를 통해 변환됩니다.
 *
 * @example
 * ```typescript
 * const schema: JSONSchema = {
 *   type: 'object',
 *   properties: {
 *     id: { type: 'string', description: 'User ID' },
 *     name: { type: 'string', minLength: 1, maxLength: 50 }
 *   },
 *   required: ['id', 'name']
 * };
 * ```
 */
export interface JSONSchema {
  // ---- Type ----
  type?: JSONSchemaType | JSONSchemaType[];

  // ---- Metadata ----
  title?: string;
  description?: string;
  default?: unknown;
  examples?: unknown[];

  // ---- String validations ----
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;

  // ---- Number validations ----
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  multipleOf?: number;

  // ---- Array validations ----
  items?: JSONSchema;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;

  // ---- Object validations ----
  properties?: Record<string, JSONSchema>;
  required?: string[];
  additionalProperties?: boolean | JSONSchema;

  // ---- Enum ----
  enum?: unknown[];
  const?: unknown;

  // ---- Composition ----
  allOf?: JSONSchema[];
  anyOf?: JSONSchema[];
  oneOf?: JSONSchema[];
  not?: JSONSchema;

  // ---- References ----
  $ref?: string;
  $defs?: Record<string, JSONSchema>;

  // ---- Allow additional properties for extensibility ----
  [key: string]: unknown;
}

// ============================================
// Tool Chain Format Definitions
// ============================================

/**
 * Optional behavioral hints for tool selection and safety review.
 *
 * Hints are metadata only; the runtime must still enforce authorization and
 * validation before executing a tool.
 */
export interface ToolAnnotations {
  title?: string;
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  openWorldHint?: boolean;
  /** Tool output may include untrusted, model-visible content. */
  untrustedContentHint?: boolean;
}

/** Canonical tool definition shared by MCP and local tool managers. */
export interface ToolDefinition {
  /** Tool name (unique identifier) */
  name: string;
  /** Optional human-facing title */
  title?: string;
  /** Description used by the model for tool selection */
  description?: string;
  /** Input schema in JSON Schema format */
  inputSchema: JSONSchema;
  /** Optional structured output schema */
  outputSchema?: JSONSchema;
  /** Optional behavioral hints */
  annotations?: ToolAnnotations;
  /** Transport-specific hints are intentionally separate from canonical tool metadata. */
  transports?: {
    webmcp?: {
      untrustedContentHint?: boolean;
    };
  };
}

/**
 * MCP (Model Context Protocol) Tool 정의
 *
 * @see https://modelcontextprotocol.io/docs/concepts/tools
 */
export interface MCPToolDefinition extends ToolDefinition {}

/**
 * OpenAI API Tool 정의
 *
 * @see https://platform.openai.com/docs/guides/function-calling
 */
export interface OpenAIToolDefinition {
  type: 'function';
  function: {
    /** Function 이름 */
    name: string;
    /** Function 설명 */
    description?: string;
    /** Parameters 스키마 (JSON Schema 형식) */
    parameters: JSONSchema;
  };
}

/**
 * Anthropic API Tool 정의
 *
 * @see https://docs.anthropic.com/en/docs/build-with-claude/tool-use
 */
export interface AnthropicToolDefinition {
  /** Tool 이름 */
  name: string;
  /** Tool 설명 */
  description?: string;
  /** Input 스키마 (JSON Schema 형식) */
  input_schema: JSONSchema;
}
