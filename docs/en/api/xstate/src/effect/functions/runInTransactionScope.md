[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/xstate/src/effect](../README.md) / runInTransactionScope

# Function: runInTransactionScope()

> **runInTransactionScope**&lt;`TResult`&gt;(`coordinator`, `participants`, `task`, `options?`): `Promise`&lt;`TResult`&gt;

Defined in: [packages/xstate/src/effect.ts:591](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/effect.ts#L591)

Coordinates a multi-store `@context-action/store-core` transaction across async Effect/Promise
execution: commits on normal completion and guarantees idempotent `rollback()` on error or
`AbortSignal` / Fiber interruption.

## Type Parameters

### TResult

`TResult`

## Parameters

### coordinator

`TransactionCoordinatorPort`

### participants

readonly `TransactionParticipant`&lt;`unknown`&gt;[]

### task

(`tx`) => `TResult` \| `Promise`&lt;`TResult`&gt;

### options?

[`RunInTransactionScopeOptions`](../interfaces/RunInTransactionScopeOptions.md) = `{}`

## Returns

`Promise`&lt;`TResult`&gt;
