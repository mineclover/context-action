[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / ActionDefinition

# Interface: ActionDefinition\<TSchema, TOutputSchema\>

Defined in: [packages/tool-protocol/src/action-schema.ts:142](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L142)

A schema-backed action definition with inferred input, payload, and output types.

## Extends

- [`UnifiedAction`](UnifiedAction.md)\<`z.infer`\<`ZodObject`&lt;`TSchema`&gt;\>, `TOutputSchema` *extends* `ZodTypeAny` ? `z.infer`&lt;`TOutputSchema`&gt; : `unknown`, `ZodObject`&lt;`TSchema`&gt;\>

## Type Parameters

### TSchema

`TSchema` *extends* `ZodRawShape`

### TOutputSchema

`TOutputSchema` *extends* `ZodTypeAny` \| `undefined` = `undefined`

## Properties

### name

> `readonly` **name**: `string`

Defined in: [packages/tool-protocol/src/action-schema.ts:100](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L100)

Action 이름

#### Inherited from

[`UnifiedAction`](UnifiedAction.md).[`name`](UnifiedAction.md#name)

***

### title?

> `readonly` `optional` **title?**: `string`

Defined in: [packages/tool-protocol/src/action-schema.ts:102](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L102)

Optional human-facing tool title

#### Inherited from

[`UnifiedAction`](UnifiedAction.md).[`title`](UnifiedAction.md#title)

***

### description?

> `readonly` `optional` **description?**: `string`

Defined in: [packages/tool-protocol/src/action-schema.ts:104](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L104)

Action 설명

#### Inherited from

[`UnifiedAction`](UnifiedAction.md).[`description`](UnifiedAction.md#description)

***

### annotations?

> `readonly` `optional` **annotations?**: [`ToolAnnotations`](ToolAnnotations.md)

Defined in: [packages/tool-protocol/src/action-schema.ts:106](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L106)

Optional tool-selection and safety hints

#### Inherited from

[`UnifiedAction`](UnifiedAction.md).[`annotations`](UnifiedAction.md#annotations)

***

### zodSchema

> `readonly` **zodSchema**: `ZodObject`

Defined in: [packages/tool-protocol/src/action-schema.ts:108](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L108)

원본 Zod 스키마

#### Inherited from

[`UnifiedAction`](UnifiedAction.md).[`zodSchema`](UnifiedAction.md#zodschema)

***

### jsonSchema

> `readonly` **jsonSchema**: [`JSONSchema`](JSONSchema.md)

Defined in: [packages/tool-protocol/src/action-schema.ts:110](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L110)

JSON Schema (Tool chain 호환용)

#### Inherited from

[`UnifiedAction`](UnifiedAction.md).[`jsonSchema`](UnifiedAction.md#jsonschema)

***

### outputSchema?

> `readonly` `optional` **outputSchema?**: [`JSONSchema`](JSONSchema.md)

Defined in: [packages/tool-protocol/src/action-schema.ts:112](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L112)

Optional structured result JSON Schema (Tool chain 호환용)

#### Inherited from

[`UnifiedAction`](UnifiedAction.md).[`outputSchema`](UnifiedAction.md#outputschema)

***

### safeParseOutput?

> `readonly` `optional` **safeParseOutput?**: (`value`) => [`SafeParseResult`](../type-aliases/SafeParseResult.md)\<`TOutputSchema` *extends* `ZodTypeAny` ? `output`&lt;`TOutputSchema`&gt; : `unknown`\>

Defined in: [packages/tool-protocol/src/action-schema.ts:115](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L115)

Safely validate a structured tool result when an output schema is defined

#### Parameters

##### value

`unknown`

#### Returns

[`SafeParseResult`](../type-aliases/SafeParseResult.md)\<`TOutputSchema` *extends* `ZodTypeAny` ? `output`&lt;`TOutputSchema`&gt; : `unknown`\>

#### Inherited from

[`UnifiedAction`](UnifiedAction.md).[`safeParseOutput`](UnifiedAction.md#safeparseoutput)

***

### validate

> **validate**: (`payload`) => `$InferObjectOutput`

Defined in: [packages/tool-protocol/src/action-schema.ts:122](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L122)

Payload 검증 (strict mode)

#### Parameters

##### payload

`unknown`

#### Returns

`$InferObjectOutput`

#### Throws

ZodError if validation fails

#### Inherited from

[`UnifiedAction`](UnifiedAction.md).[`validate`](UnifiedAction.md#validate)

***

### safeParse

> **safeParse**: (`payload`) => [`SafeParseResult`](../type-aliases/SafeParseResult.md)\<`$InferObjectOutput`\<`TSchema`, \{ \}\>\>

Defined in: [packages/tool-protocol/src/action-schema.ts:128](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L128)

Payload 검증 (safe mode)

#### Parameters

##### payload

`unknown`

#### Returns

[`SafeParseResult`](../type-aliases/SafeParseResult.md)\<`$InferObjectOutput`\<`TSchema`, \{ \}\>\>

SafeParseResult with success/error

#### Inherited from

[`UnifiedAction`](UnifiedAction.md).[`safeParse`](UnifiedAction.md#safeparse)

***

### toJSONSchema

> **toJSONSchema**: () => [`JSONSchema`](JSONSchema.md)

Defined in: [packages/tool-protocol/src/action-schema.ts:132](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L132)

JSON Schema 반환

#### Returns

[`JSONSchema`](JSONSchema.md)

#### Inherited from

[`UnifiedAction`](UnifiedAction.md).[`toJSONSchema`](UnifiedAction.md#tojsonschema)

***

### toMCP

> **toMCP**: () => [`MCPToolDefinition`](MCPToolDefinition.md)

Defined in: [packages/tool-protocol/src/action-schema.ts:134](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L134)

MCP 포맷 변환

#### Returns

[`MCPToolDefinition`](MCPToolDefinition.md)

#### Inherited from

[`UnifiedAction`](UnifiedAction.md).[`toMCP`](UnifiedAction.md#tomcp)

***

### toOpenAI

> **toOpenAI**: () => [`OpenAIToolDefinition`](OpenAIToolDefinition.md)

Defined in: [packages/tool-protocol/src/action-schema.ts:136](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L136)

OpenAI 포맷 변환

#### Returns

[`OpenAIToolDefinition`](OpenAIToolDefinition.md)

#### Inherited from

[`UnifiedAction`](UnifiedAction.md).[`toOpenAI`](UnifiedAction.md#toopenai)

***

### toAnthropic

> **toAnthropic**: () => [`AnthropicToolDefinition`](AnthropicToolDefinition.md)

Defined in: [packages/tool-protocol/src/action-schema.ts:138](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L138)

Anthropic 포맷 변환

#### Returns

[`AnthropicToolDefinition`](AnthropicToolDefinition.md)

#### Inherited from

[`UnifiedAction`](UnifiedAction.md).[`toAnthropic`](UnifiedAction.md#toanthropic)
