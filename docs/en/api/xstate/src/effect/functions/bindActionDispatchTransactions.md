[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/xstate/src/effect](../README.md) / bindActionDispatchTransactions

# Function: bindActionDispatchTransactions()

> **bindActionDispatchTransactions**(`source`, `coordinator`, `options`): () => `void`

Defined in: [packages/xstate/src/effect.ts:541](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/effect.ts#L541)

Framework-neutral equivalent of React's `bindActionTransactions()`:
connects `ActionRegister.subscribeDispatchTrace` directly to a
`@context-action/store-core` `TransactionCoordinatorPort`.

## Parameters

### source

[`DispatchTraceSource`](../interfaces/DispatchTraceSource.md)

### coordinator

`TransactionCoordinatorPort`

### options

[`ActionTransactionBridgeOptions`](../interfaces/ActionTransactionBridgeOptions.md)

## Returns

() => `void`
