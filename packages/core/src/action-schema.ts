/**
 * Action Schema - Zod 기반 Action 정의 시스템
 *
 * defineTool 패턴을 기반으로 context-action에 맞게 구현
 * - Zod 스키마를 Single Source of Truth로 사용
 * - 런타임 검증 (validate, safeParse)
 * - Tool Chain 포맷 변환 (MCP, OpenAI, Anthropic)
 *
 * @example
 * ```typescript
 * const updateUserAction = defineAction({
 *   name: 'updateUser',
 *   description: 'Update user profile',
 *   parameters: z.object({
 *     id: z.string().meta({ description: 'User ID' }),
 *     name: z.string().min(2).max(50),
 *   }),
 * });
 *
 * // Tool chain 포맷 변환
 * const mcpTool = updateUserAction.toMCP();
 * const openaiTool = updateUserAction.toOpenAI();
 * ```
 */

import type { ZodObject, ZodRawShape, ZodType, z } from 'zod';
import type {
  AnthropicToolDefinition,
  JSONSchema,
  MCPToolDefinition,
  OpenAIToolDefinition,
  ToolAnnotations,
} from './json-schema';

// ============================================
// Type Aliases (Zod 4 호환)
// ============================================

type ZodTypeAny = ZodType;

// ============================================
// Safe Parse Result Type
// ============================================

/**
 * Safe parse 결과 타입 (Zod 4 호환)
 */
export type SafeParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: z.ZodError };

// ============================================
// Define Action Options
// ============================================

/**
 * defineAction 옵션 인터페이스
 */
export interface DefineActionOptions<TSchema extends ZodRawShape> {
  /** Action 이름 (고유 식별자) */
  name: string;
  /** Optional human-facing tool title */
  title?: string;
  /** Action 설명 (LLM 컨텍스트용) */
  description?: string;
  /** Optional tool-selection and safety hints */
  annotations?: ToolAnnotations;
  /** Zod 스키마 (payload 검증 및 타입 추론의 Single Source of Truth) */
  parameters: ZodObject<TSchema>;
}

// ============================================
// Unified Action Interface
// ============================================

/**
 * 통합 Action 인터페이스
 *
 * Zod 스키마 기반 Action 정의로 다음을 제공:
 * - 타입 추론 (z.infer)
 * - 런타임 검증 (validate, safeParse)
 * - Tool Chain 포맷 변환 (toMCP, toOpenAI, toAnthropic)
 */
export interface UnifiedAction<TPayload = unknown> {
  // ---- Metadata ----
  /** Action 이름 */
  readonly name: string;
  /** Optional human-facing tool title */
  readonly title?: string;
  /** Action 설명 */
  readonly description?: string;
  /** Optional tool-selection and safety hints */
  readonly annotations?: ToolAnnotations;
  /** 원본 Zod 스키마 */
  readonly zodSchema: ZodObject<ZodRawShape>;
  /** JSON Schema (Tool chain 호환용) */
  readonly jsonSchema: JSONSchema;

  // ---- Validation Functions ----
  /**
   * Payload 검증 (strict mode)
   * @throws ZodError if validation fails
   */
  validate: (payload: unknown) => TPayload;

  /**
   * Payload 검증 (safe mode)
   * @returns SafeParseResult with success/error
   */
  safeParse: (payload: unknown) => SafeParseResult<TPayload>;

  // ---- Tool Chain Format Converters ----
  /** JSON Schema 반환 */
  toJSONSchema: () => JSONSchema;
  /** MCP 포맷 변환 */
  toMCP: () => MCPToolDefinition;
  /** OpenAI 포맷 변환 */
  toOpenAI: () => OpenAIToolDefinition;
  /** Anthropic 포맷 변환 */
  toAnthropic: () => AnthropicToolDefinition;
}

// ============================================
// Action Schema Map
// ============================================

/**
 * 다중 Action 스키마 맵
 */
export interface ActionSchemaMap {
  [actionName: string]: UnifiedAction;
}

// ============================================
// Type Inference Utilities
// ============================================

/**
 * ActionSchemaMap에서 ActionPayloadMap 타입 추론
 *
 * @example
 * ```typescript
 * const schema = createActionSchema({
 *   updateUser: defineAction({ ... }),
 *   deleteUser: defineAction({ ... }),
 * });
 *
 * type MyActions = InferActionPayloadMap<typeof schema>;
 * // { updateUser: { id: string; name: string }; deleteUser: { id: string } }
 * ```
 */
export type InferActionPayloadMap<T extends ActionSchemaMap> = {
  [K in keyof T]: T[K] extends UnifiedAction<infer P> ? P : never;
};

// ============================================
// Zod → JSON Schema Conversion
// ============================================

/**
 * Zod 스키마를 JSON Schema로 변환 (Zod 4 네이티브 API)
 *
 * @param schema - Zod 스키마
 * @returns JSON Schema (draft-7)
 */
export function zodToJsonSchema(
  schema: ZodTypeAny,
  zodModule: typeof z
): JSONSchema {
  return zodModule.toJSONSchema(schema, {
    target: 'draft-7',
    metadata: zodModule.globalRegistry,
  }) as JSONSchema;
}

// ============================================
// Define Action Function
// ============================================

/**
 * Zod 스키마 기반 Action 정의
 *
 * defineTool 패턴을 기반으로 context-action에 맞게 구현:
 * - Single Source of Truth: Zod 스키마로 타입 + 검증 + 메타데이터 통합
 * - 런타임 검증: validate(), safeParse()
 * - Tool Chain 호환: toMCP(), toOpenAI(), toAnthropic()
 *
 * @param options - Action 정의 옵션
 * @param zodModule - Zod 모듈 (peerDependency로 주입)
 * @returns UnifiedAction 인스턴스
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 * import { defineAction } from '@context-action/core';
 *
 * const updateUserAction = defineAction({
 *   name: 'updateUser',
 *   description: 'Update user profile',
 *   parameters: z.object({
 *     id: z.string().min(1).meta({ description: 'User ID' }),
 *     name: z.string().min(2).max(50).meta({ description: 'User name' }),
 *     email: z.string().email().optional(),
 *   }),
 * }, z);
 *
 * // 검증
 * const validated = updateUserAction.validate({ id: '123', name: 'John' });
 *
 * // Tool chain 변환
 * const mcpTool = updateUserAction.toMCP();
 * ```
 */
export function defineAction<TSchema extends ZodRawShape>(
  options: DefineActionOptions<TSchema>,
  zodModule: typeof z
): UnifiedAction<z.infer<ZodObject<TSchema>>> {
  type TPayload = z.infer<ZodObject<TSchema>>;

  const { name, title, description, annotations, parameters } = options;

  // Zod → JSON Schema 변환
  const jsonSchema = zodToJsonSchema(parameters, zodModule);

  const action: UnifiedAction<TPayload> = {
    // ---- Metadata ----
    name,
    title,
    description,
    annotations,
    zodSchema: parameters as unknown as ZodObject<ZodRawShape>,
    jsonSchema,

    // ---- Validation Functions ----
    validate: (payload: unknown): TPayload => {
      return parameters.parse(payload) as TPayload;
    },

    safeParse: (payload: unknown): SafeParseResult<TPayload> => {
      return parameters.safeParse(payload) as SafeParseResult<TPayload>;
    },

    // ---- Tool Chain Format Converters ----
    toJSONSchema: () => jsonSchema,

    toMCP: (): MCPToolDefinition => ({
      name,
      title,
      description,
      inputSchema: jsonSchema,
      annotations,
    }),

    toOpenAI: (): OpenAIToolDefinition => ({
      type: 'function',
      function: {
        name,
        description,
        parameters: {
          type: 'object',
          properties: jsonSchema.properties ?? {},
          required: jsonSchema.required,
        },
      },
    }),

    toAnthropic: (): AnthropicToolDefinition => ({
      name,
      description,
      input_schema: jsonSchema,
    }),
  };

  return action;
}

// ============================================
// Create Action Schema (Multiple Actions)
// ============================================

/**
 * 다중 Action 스키마 생성
 *
 * 여러 defineAction을 묶어서 ActionSchemaMap 생성
 *
 * @param actions - UnifiedAction 맵
 * @returns ActionSchemaMap
 *
 * @example
 * ```typescript
 * const userActionSchema = createActionSchema({
 *   updateUser: defineAction({ ... }, z),
 *   deleteUser: defineAction({ ... }, z),
 * });
 *
 * type UserActions = InferActionPayloadMap<typeof userActionSchema>;
 * ```
 */
export function createActionSchema<T extends Record<string, UnifiedAction>>(
  actions: T
): T & ActionSchemaMap {
  return actions;
}

// ============================================
// Helper: Create Action Factory
// ============================================

/**
 * Zod 모듈을 바인딩한 defineAction 팩토리 생성
 *
 * 매번 z 모듈을 전달하지 않아도 되도록 팩토리 패턴 제공
 *
 * @param zodModule - Zod 모듈
 * @returns defineAction 함수 (z 바인딩됨)
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 * import { createActionFactory } from '@context-action/core';
 *
 * const defineAction = createActionFactory(z);
 *
 * const updateUser = defineAction({
 *   name: 'updateUser',
 *   parameters: z.object({ id: z.string() }),
 * });
 * ```
 */
export function createActionFactory(zodModule: typeof z) {
  return <TSchema extends ZodRawShape>(
    options: DefineActionOptions<TSchema>
  ): UnifiedAction<z.infer<ZodObject<TSchema>>> => {
    return defineAction(options, zodModule);
  };
}
