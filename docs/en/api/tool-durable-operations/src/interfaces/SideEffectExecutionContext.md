[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-durable-operations/src](../README.md) / SideEffectExecutionContext

# Interface: SideEffectExecutionContext

Defined in: [packages/tool-durable-operations/src/side-effect.ts:35](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/side-effect.ts#L35)

Context passed to an HTTP, queue, filesystem, or provider adapter.

## Properties

### key

> `readonly` **key**: `string`

Defined in: [packages/tool-durable-operations/src/side-effect.ts:36](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/side-effect.ts#L36)

***

### fingerprint

> `readonly` **fingerprint**: `string`

Defined in: [packages/tool-durable-operations/src/side-effect.ts:37](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/side-effect.ts#L37)

***

### ownerId

> `readonly` **ownerId**: `string`

Defined in: [packages/tool-durable-operations/src/side-effect.ts:38](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/side-effect.ts#L38)

***

### signal?

> `readonly` `optional` **signal?**: `AbortSignal`

Defined in: [packages/tool-durable-operations/src/side-effect.ts:39](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/side-effect.ts#L39)
