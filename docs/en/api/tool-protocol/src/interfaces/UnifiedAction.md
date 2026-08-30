[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / UnifiedAction

# Interface: UnifiedAction\<TPayload, TOutput\>

Defined in: [packages/tool-protocol/src/action-schema.ts:93](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L93)

통합 Action 인터페이스

Zod 스키마 기반 Action 정의로 다음을 제공:
- 타입 추론 (z.infer)
- 런타임 검증 (validate, safeParse)
- Tool Chain 포맷 변환 (toMCP, toOpenAI, toAnthropic)

## Type Parameters

### TPayload

`TPayload` = `unknown`

### TOutput

`TOutput` = `unknown`

## Properties

### name

> `readonly` **name**: `string`

Defined in: [packages/tool-protocol/src/action-schema.ts:96](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L96)

Action 이름

***

### title?

> `readonly` `optional` **title?**: `string`

Defined in: [packages/tool-protocol/src/action-schema.ts:98](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L98)

Optional human-facing tool title

***

### description?

> `readonly` `optional` **description?**: `string`

Defined in: [packages/tool-protocol/src/action-schema.ts:100](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L100)

Action 설명

***

### annotations?

> `readonly` `optional` **annotations?**: [`ToolAnnotations`](ToolAnnotations.md)

Defined in: [packages/tool-protocol/src/action-schema.ts:102](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L102)

Optional tool-selection and safety hints

***

### zodSchema

> `readonly` **zodSchema**: `ZodObject`\<`Readonly`\<\{\[`k`: `string`\]: `$ZodType`\<`unknown`, `unknown`, `$ZodTypeInternals`\<`unknown`, `unknown`\>\>; \}\>\>

Defined in: [packages/tool-protocol/src/action-schema.ts:104](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L104)

원본 Zod 스키마

***

### jsonSchema

> `readonly` **jsonSchema**: [`JSONSchema`](JSONSchema.md)

Defined in: [packages/tool-protocol/src/action-schema.ts:106](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L106)

JSON Schema (Tool chain 호환용)

***

### outputSchema?

> `readonly` `optional` **outputSchema?**: [`JSONSchema`](JSONSchema.md)

Defined in: [packages/tool-protocol/src/action-schema.ts:108](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L108)

Optional structured result JSON Schema (Tool chain 호환용)

***

### safeParseOutput?

> `readonly` `optional` **safeParseOutput?**: (`value`) => [`SafeParseResult`](../type-aliases/SafeParseResult.md)&lt;`TOutput`&gt;

Defined in: [packages/tool-protocol/src/action-schema.ts:111](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L111)

Safely validate a structured tool result when an output schema is defined

#### Parameters

##### value

`unknown`

#### Returns

[`SafeParseResult`](../type-aliases/SafeParseResult.md)&lt;`TOutput`&gt;

***

### validate

> **validate**: (`payload`) => `TPayload`

Defined in: [packages/tool-protocol/src/action-schema.ts:118](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L118)

Payload 검증 (strict mode)

#### Parameters

##### payload

`unknown`

#### Returns

Type parameter **TPayload**

#### Throws

ZodError if validation fails

***

### safeParse

> **safeParse**: (`payload`) => [`SafeParseResult`](../type-aliases/SafeParseResult.md)&lt;`TPayload`&gt;

Defined in: [packages/tool-protocol/src/action-schema.ts:124](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L124)

Payload 검증 (safe mode)

#### Parameters

##### payload

`unknown`

#### Returns

[`SafeParseResult`](../type-aliases/SafeParseResult.md)&lt;`TPayload`&gt;

SafeParseResult with success/error

***

### toJSONSchema

> **toJSONSchema**: () => [`JSONSchema`](JSONSchema.md)

Defined in: [packages/tool-protocol/src/action-schema.ts:128](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L128)

JSON Schema 반환

#### Returns

[`JSONSchema`](JSONSchema.md)

***

### toMCP

> **toMCP**: () => [`MCPToolDefinition`](MCPToolDefinition.md)

Defined in: [packages/tool-protocol/src/action-schema.ts:130](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L130)

MCP 포맷 변환

#### Returns

[`MCPToolDefinition`](MCPToolDefinition.md)

***

### toOpenAI

> **toOpenAI**: () => [`OpenAIToolDefinition`](OpenAIToolDefinition.md)

Defined in: [packages/tool-protocol/src/action-schema.ts:132](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L132)

OpenAI 포맷 변환

#### Returns

[`OpenAIToolDefinition`](OpenAIToolDefinition.md)

***

### toAnthropic

> **toAnthropic**: () => [`AnthropicToolDefinition`](AnthropicToolDefinition.md)

Defined in: [packages/tool-protocol/src/action-schema.ts:134](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L134)

Anthropic 포맷 변환

#### Returns

[`AnthropicToolDefinition`](AnthropicToolDefinition.md)
