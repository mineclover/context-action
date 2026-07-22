[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / ToolAnnotations

# Interface: ToolAnnotations

Defined in: packages/tool-protocol/src/json-schema.ts:110

Optional behavioral hints for tool selection and safety review.

Hints are metadata only; the runtime must still enforce authorization and
validation before executing a tool.

## Properties

### title?

> `optional` **title?**: `string`

Defined in: packages/tool-protocol/src/json-schema.ts:111

***

### readOnlyHint?

> `optional` **readOnlyHint?**: `boolean`

Defined in: packages/tool-protocol/src/json-schema.ts:112

***

### destructiveHint?

> `optional` **destructiveHint?**: `boolean`

Defined in: packages/tool-protocol/src/json-schema.ts:113

***

### idempotentHint?

> `optional` **idempotentHint?**: `boolean`

Defined in: packages/tool-protocol/src/json-schema.ts:114

***

### openWorldHint?

> `optional` **openWorldHint?**: `boolean`

Defined in: packages/tool-protocol/src/json-schema.ts:115
