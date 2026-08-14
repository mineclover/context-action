[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-durable-operations/src](../README.md) / SideEffectRecoveryOptions

# Interface: SideEffectRecoveryOptions

Defined in: [packages/tool-durable-operations/src/side-effect.ts:140](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/side-effect.ts#L140)

## Properties

### expectedFence?

> `readonly` `optional` **expectedFence?**: [`DurableOperationFence`](DurableOperationFence.md)

Defined in: [packages/tool-durable-operations/src/side-effect.ts:141](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/side-effect.ts#L141)

***

### reconcilerId?

> `readonly` `optional` **reconcilerId?**: `string`

Defined in: [packages/tool-durable-operations/src/side-effect.ts:143](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/side-effect.ts#L143)

Optional audit identity; defaults to the runner owner.
