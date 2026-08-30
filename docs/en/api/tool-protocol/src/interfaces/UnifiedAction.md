[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / UnifiedAction

# Interface: UnifiedAction\<TPayload, TOutput, TInputSchema\>

Defined in: [packages/tool-protocol/src/action-schema.ts:93](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L93)

통합 Action 인터페이스

Zod 스키마 기반 Action 정의로 다음을 제공:
- 타입 추론 (z.infer)
- 런타임 검증 (validate, safeParse)
- Tool Chain 포맷 변환 (toMCP, toOpenAI, toAnthropic)

## Extended by

- [`ActionDefinition`](ActionDefinition.md)

## Type Parameters

### TPayload

`TPayload` = `unknown`

### TOutput

`TOutput` = `unknown`

### TInputSchema

`TInputSchema` *extends* `ZodTypeAny` = `ZodTypeAny`

## Properties

### name

> `readonly` **name**: `string`

Defined in: [packages/tool-protocol/src/action-schema.ts:100](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L100)

Action 이름

***

### title?

> `readonly` `optional` **title?**: `string`

Defined in: [packages/tool-protocol/src/action-schema.ts:102](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L102)

Optional human-facing tool title

***

### description?

> `readonly` `optional` **description?**: `string`

Defined in: [packages/tool-protocol/src/action-schema.ts:104](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L104)

Action 설명

***

### annotations?

> `readonly` `optional` **annotations?**: [`ToolAnnotations`](ToolAnnotations.md)

Defined in: [packages/tool-protocol/src/action-schema.ts:106](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L106)

Optional tool-selection and safety hints

***

### zodSchema

> `readonly` **zodSchema**: `TInputSchema`

Defined in: [packages/tool-protocol/src/action-schema.ts:108](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L108)

원본 Zod 스키마

***

### jsonSchema

> `readonly` **jsonSchema**: [`JSONSchema`](JSONSchema.md)

Defined in: [packages/tool-protocol/src/action-schema.ts:110](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L110)

JSON Schema (Tool chain 호환용)

***

### outputSchema?

> `readonly` `optional` **outputSchema?**: [`JSONSchema`](JSONSchema.md)

Defined in: [packages/tool-protocol/src/action-schema.ts:112](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L112)

Optional structured result JSON Schema (Tool chain 호환용)

***

### safeParseOutput?

> `readonly` `optional` **safeParseOutput?**: (`value`) => [`SafeParseResult`](../type-aliases/SafeParseResult.md)&lt;`TOutput`&gt;

Defined in: [packages/tool-protocol/src/action-schema.ts:115](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L115)

Safely validate a structured tool result when an output schema is defined

#### Parameters

##### value

`unknown`

#### Returns

[`SafeParseResult`](../type-aliases/SafeParseResult.md)&lt;`TOutput`&gt;

***

### validate

> **validate**: (`payload`) => `TPayload`

Defined in: [packages/tool-protocol/src/action-schema.ts:122](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L122)

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

Defined in: [packages/tool-protocol/src/action-schema.ts:128](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L128)

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

Defined in: [packages/tool-protocol/src/action-schema.ts:132](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L132)

JSON Schema 반환

#### Returns

[`JSONSchema`](JSONSchema.md)

***

### toMCP

> **toMCP**: () => [`MCPToolDefinition`](MCPToolDefinition.md)

Defined in: [packages/tool-protocol/src/action-schema.ts:134](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L134)

MCP 포맷 변환

#### Returns

[`MCPToolDefinition`](MCPToolDefinition.md)

***

### toOpenAI

> **toOpenAI**: () => [`OpenAIToolDefinition`](OpenAIToolDefinition.md)

Defined in: [packages/tool-protocol/src/action-schema.ts:136](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L136)

OpenAI 포맷 변환

#### Returns

[`OpenAIToolDefinition`](OpenAIToolDefinition.md)

***

### toAnthropic

> **toAnthropic**: () => [`AnthropicToolDefinition`](AnthropicToolDefinition.md)

Defined in: [packages/tool-protocol/src/action-schema.ts:138](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L138)

Anthropic 포맷 변환

#### Returns

[`AnthropicToolDefinition`](AnthropicToolDefinition.md)
