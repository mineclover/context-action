[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-durable-operations/src](../README.md) / SideEffectRunResult

# Interface: SideEffectRunResult\<TResult, TDiagnostic\>

Defined in: [packages/tool-durable-operations/src/side-effect.ts:57](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-durable-operations/src/side-effect.ts#L57)

## Type Parameters

### TResult

Type parameter **TResult**

### TDiagnostic

`TDiagnostic` = `unknown`

## Properties

### state

> `readonly` **state**: [`SideEffectRunState`](../type-aliases/SideEffectRunState.md)

Defined in: [packages/tool-durable-operations/src/side-effect.ts:58](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-durable-operations/src/side-effect.ts#L58)

***

### operation?

> `readonly` `optional` **operation?**: [`DurableOperationRecord`](DurableOperationRecord.md)\<[`SideEffectRecordPayload`](SideEffectRecordPayload.md)\<`TResult`, `TDiagnostic`\>\>

Defined in: [packages/tool-durable-operations/src/side-effect.ts:59](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-durable-operations/src/side-effect.ts#L59)

***

### result?

> `readonly` `optional` **result?**: `TResult`

Defined in: [packages/tool-durable-operations/src/side-effect.ts:62](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-durable-operations/src/side-effect.ts#L62)

***

### diagnostic?

> `readonly` `optional` **diagnostic?**: `TDiagnostic`

Defined in: [packages/tool-durable-operations/src/side-effect.ts:63](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-durable-operations/src/side-effect.ts#L63)

***

### reason?

> `readonly` `optional` **reason?**: `string`

Defined in: [packages/tool-durable-operations/src/side-effect.ts:64](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-durable-operations/src/side-effect.ts#L64)
