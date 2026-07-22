[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / DefineActionOptions

# Interface: DefineActionOptions\<TSchema\>

Defined in: packages/tool-protocol/src/action-schema.ts:63

defineAction 옵션 인터페이스

## Type Parameters

### TSchema

`TSchema` *extends* `ZodRawShape`

## Properties

### name

> **name**: `string`

Defined in: packages/tool-protocol/src/action-schema.ts:65

Action 이름 (고유 식별자)

***

### title?

> `optional` **title?**: `string`

Defined in: packages/tool-protocol/src/action-schema.ts:67

Optional human-facing tool title

***

### description?

> `optional` **description?**: `string`

Defined in: packages/tool-protocol/src/action-schema.ts:69

Action 설명 (LLM 컨텍스트용)

***

### annotations?

> `optional` **annotations?**: [`ToolAnnotations`](ToolAnnotations.md)

Defined in: packages/tool-protocol/src/action-schema.ts:71

Optional tool-selection and safety hints

***

### parameters

> **parameters**: `ZodObject`&lt;`TSchema`&gt;

Defined in: packages/tool-protocol/src/action-schema.ts:73

Zod 스키마 (payload 검증 및 타입 추론의 Single Source of Truth)

***

### outputSchema?

> `optional` **outputSchema?**: `ZodTypeAny`

Defined in: packages/tool-protocol/src/action-schema.ts:75

Optional structured result schema advertised by tool transports
