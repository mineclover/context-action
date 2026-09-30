[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / bindActionTransactions

# Function: bindActionTransactions()

> **bindActionTransactions**(`source`, `coordinator`, `options`): () => `void`

Defined in: [packages/react/src/stores/core/ActionTransactionBridge.ts:20](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/ActionTransactionBridge.ts#L20)

Connects Core dispatch lifecycle to explicit Store transaction participants.
Core remains Store-agnostic; this adapter owns the integration policy.

## Parameters

### source

[`DispatchTraceSource`](../interfaces/DispatchTraceSource.md)

### coordinator

[`StoreTransactionCoordinator`](../classes/StoreTransactionCoordinator.md)

### options

[`ActionTransactionBridgeOptions`](../interfaces/ActionTransactionBridgeOptions.md)

## Returns

() => `void`
