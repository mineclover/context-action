[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-durable-operations/src](../README.md) / SideEffectRecoveryResult

# Interface: SideEffectRecoveryResult\<TResult, TDiagnostic\>

Defined in: [packages/tool-durable-operations/src/side-effect.ts:85](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/side-effect.ts#L85)

## Type Parameters

### TResult

Type parameter **TResult**

### TDiagnostic

`TDiagnostic` = `unknown`

## Properties

### state

> `readonly` **state**: [`SideEffectRecoveryState`](../type-aliases/SideEffectRecoveryState.md)

Defined in: [packages/tool-durable-operations/src/side-effect.ts:86](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/side-effect.ts#L86)

***

### operation?

> `readonly` `optional` **operation?**: [`DurableOperationRecord`](DurableOperationRecord.md)\<[`SideEffectRecordPayload`](SideEffectRecordPayload.md)\<`TResult`, `TDiagnostic`\>\>

Defined in: [packages/tool-durable-operations/src/side-effect.ts:87](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/side-effect.ts#L87)

***

### result?

> `readonly` `optional` **result?**: `TResult`

Defined in: [packages/tool-durable-operations/src/side-effect.ts:90](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/side-effect.ts#L90)

***

### diagnostic?

> `readonly` `optional` **diagnostic?**: `TDiagnostic`

Defined in: [packages/tool-durable-operations/src/side-effect.ts:91](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/side-effect.ts#L91)

***

### reason?

> `readonly` `optional` **reason?**: `string`

Defined in: [packages/tool-durable-operations/src/side-effect.ts:92](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/side-effect.ts#L92)
