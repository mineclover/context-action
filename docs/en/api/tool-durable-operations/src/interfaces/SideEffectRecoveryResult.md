[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-durable-operations/src](../README.md) / SideEffectRecoveryResult

# Interface: SideEffectRecoveryResult\<TResult, TDiagnostic\>

Defined in: [packages/tool-durable-operations/src/side-effect.ts:83](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-durable-operations/src/side-effect.ts#L83)

## Type Parameters

### TResult

Type parameter **TResult**

### TDiagnostic

`TDiagnostic` = `unknown`

## Properties

### state

> `readonly` **state**: [`SideEffectRecoveryState`](../type-aliases/SideEffectRecoveryState.md)

Defined in: [packages/tool-durable-operations/src/side-effect.ts:84](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-durable-operations/src/side-effect.ts#L84)

***

### operation?

> `readonly` `optional` **operation?**: [`DurableOperationRecord`](DurableOperationRecord.md)\<[`SideEffectRecordPayload`](SideEffectRecordPayload.md)\<`TResult`, `TDiagnostic`\>\>

Defined in: [packages/tool-durable-operations/src/side-effect.ts:85](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-durable-operations/src/side-effect.ts#L85)

***

### result?

> `readonly` `optional` **result?**: `TResult`

Defined in: [packages/tool-durable-operations/src/side-effect.ts:88](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-durable-operations/src/side-effect.ts#L88)

***

### diagnostic?

> `readonly` `optional` **diagnostic?**: `TDiagnostic`

Defined in: [packages/tool-durable-operations/src/side-effect.ts:89](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-durable-operations/src/side-effect.ts#L89)

***

### reason?

> `readonly` `optional` **reason?**: `string`

Defined in: [packages/tool-durable-operations/src/side-effect.ts:90](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-durable-operations/src/side-effect.ts#L90)
