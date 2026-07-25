[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / ToolAnnotations

# Interface: ToolAnnotations

Defined in: [packages/tool-protocol/src/json-schema.ts:110](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-protocol/src/json-schema.ts#L110)

Optional behavioral hints for tool selection and safety review.

Hints are metadata only; the runtime must still enforce authorization and
validation before executing a tool.

## Properties

### title?

> `optional` **title?**: `string`

Defined in: [packages/tool-protocol/src/json-schema.ts:111](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-protocol/src/json-schema.ts#L111)

***

### readOnlyHint?

> `optional` **readOnlyHint?**: `boolean`

Defined in: [packages/tool-protocol/src/json-schema.ts:112](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-protocol/src/json-schema.ts#L112)

***

### destructiveHint?

> `optional` **destructiveHint?**: `boolean`

Defined in: [packages/tool-protocol/src/json-schema.ts:113](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-protocol/src/json-schema.ts#L113)

***

### idempotentHint?

> `optional` **idempotentHint?**: `boolean`

Defined in: [packages/tool-protocol/src/json-schema.ts:114](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-protocol/src/json-schema.ts#L114)

***

### openWorldHint?

> `optional` **openWorldHint?**: `boolean`

Defined in: [packages/tool-protocol/src/json-schema.ts:115](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-protocol/src/json-schema.ts#L115)
