[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / DefineActionOptions

# Interface: DefineActionOptions\<TSchema, TOutputSchema\>

Defined in: [packages/tool-protocol/src/action-schema.ts:63](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L63)

defineAction 옵션 인터페이스

## Type Parameters

### TSchema

`TSchema` *extends* `ZodRawShape`

### TOutputSchema

`TOutputSchema` *extends* `ZodTypeAny` \| `undefined` = `undefined`

## Properties

### name

> **name**: `string`

Defined in: [packages/tool-protocol/src/action-schema.ts:68](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L68)

Action 이름 (고유 식별자)

***

### title?

> `optional` **title?**: `string`

Defined in: [packages/tool-protocol/src/action-schema.ts:70](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L70)

Optional human-facing tool title

***

### description?

> `optional` **description?**: `string`

Defined in: [packages/tool-protocol/src/action-schema.ts:72](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L72)

Action 설명 (LLM 컨텍스트용)

***

### annotations?

> `optional` **annotations?**: [`ToolAnnotations`](ToolAnnotations.md)

Defined in: [packages/tool-protocol/src/action-schema.ts:74](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L74)

Optional tool-selection and safety hints

***

### parameters

> **parameters**: `ZodObject`&lt;`TSchema`&gt;

Defined in: [packages/tool-protocol/src/action-schema.ts:76](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L76)

Zod 스키마 (payload 검증 및 타입 추론의 Single Source of Truth)

***

### outputSchema?

> `optional` **outputSchema?**: `TOutputSchema`

Defined in: [packages/tool-protocol/src/action-schema.ts:78](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L78)

Optional structured result schema advertised by tool transports
