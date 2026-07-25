[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / UnifiedAction

# Interface: UnifiedAction\<TPayload\>

Defined in: [packages/tool-protocol/src/action-schema.ts:90](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L90)

통합 Action 인터페이스

Zod 스키마 기반 Action 정의로 다음을 제공:
- 타입 추론 (z.infer)
- 런타임 검증 (validate, safeParse)
- Tool Chain 포맷 변환 (toMCP, toOpenAI, toAnthropic)

## Type Parameters

### TPayload

`TPayload` = `unknown`

## Properties

### name

> `readonly` **name**: `string`

Defined in: [packages/tool-protocol/src/action-schema.ts:93](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L93)

Action 이름

***

### title?

> `readonly` `optional` **title?**: `string`

Defined in: [packages/tool-protocol/src/action-schema.ts:95](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L95)

Optional human-facing tool title

***

### description?

> `readonly` `optional` **description?**: `string`

Defined in: [packages/tool-protocol/src/action-schema.ts:97](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L97)

Action 설명

***

### annotations?

> `readonly` `optional` **annotations?**: [`ToolAnnotations`](ToolAnnotations.md)

Defined in: [packages/tool-protocol/src/action-schema.ts:99](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L99)

Optional tool-selection and safety hints

***

### zodSchema

> `readonly` **zodSchema**: `ZodObject`\<`Readonly`\<\{\[`k`: `string`\]: `$ZodType`\<`unknown`, `unknown`, `$ZodTypeInternals`\<`unknown`, `unknown`\>\>; \}\>\>

Defined in: [packages/tool-protocol/src/action-schema.ts:101](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L101)

원본 Zod 스키마

***

### jsonSchema

> `readonly` **jsonSchema**: [`JSONSchema`](JSONSchema.md)

Defined in: [packages/tool-protocol/src/action-schema.ts:103](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L103)

JSON Schema (Tool chain 호환용)

***

### outputSchema?

> `readonly` `optional` **outputSchema?**: [`JSONSchema`](JSONSchema.md)

Defined in: [packages/tool-protocol/src/action-schema.ts:105](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L105)

Optional structured result JSON Schema (Tool chain 호환용)

***

### safeParseOutput?

> `readonly` `optional` **safeParseOutput?**: (`value`) => [`SafeParseResult`](../type-aliases/SafeParseResult.md)&lt;`unknown`&gt;

Defined in: [packages/tool-protocol/src/action-schema.ts:108](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L108)

Safely validate a structured tool result when an output schema is defined

#### Parameters

##### value

`unknown`

#### Returns

[`SafeParseResult`](../type-aliases/SafeParseResult.md)&lt;`unknown`&gt;

***

### validate

> **validate**: (`payload`) => `TPayload`

Defined in: [packages/tool-protocol/src/action-schema.ts:115](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L115)

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

Defined in: [packages/tool-protocol/src/action-schema.ts:121](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L121)

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

Defined in: [packages/tool-protocol/src/action-schema.ts:125](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L125)

JSON Schema 반환

#### Returns

[`JSONSchema`](JSONSchema.md)

***

### toMCP

> **toMCP**: () => [`MCPToolDefinition`](MCPToolDefinition.md)

Defined in: [packages/tool-protocol/src/action-schema.ts:127](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L127)

MCP 포맷 변환

#### Returns

[`MCPToolDefinition`](MCPToolDefinition.md)

***

### toOpenAI

> **toOpenAI**: () => [`OpenAIToolDefinition`](OpenAIToolDefinition.md)

Defined in: [packages/tool-protocol/src/action-schema.ts:129](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L129)

OpenAI 포맷 변환

#### Returns

[`OpenAIToolDefinition`](OpenAIToolDefinition.md)

***

### toAnthropic

> **toAnthropic**: () => [`AnthropicToolDefinition`](AnthropicToolDefinition.md)

Defined in: [packages/tool-protocol/src/action-schema.ts:131](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L131)

Anthropic 포맷 변환

#### Returns

[`AnthropicToolDefinition`](AnthropicToolDefinition.md)
