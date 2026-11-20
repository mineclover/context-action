[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/store-core/src](../README.md) / TransactionCoordinatorPort

# Interface: TransactionCoordinatorPort

Defined in: [packages/store-core/src/transaction-contracts.ts:42](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/transaction-contracts.ts#L42)

Minimal coordination port. It does not promise a React runtime or a run helper.

## Methods

### begin()

> **begin**(`participants`, `options?`): [`TransactionHandle`](TransactionHandle.md)

Defined in: [packages/store-core/src/transaction-contracts.ts:43](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/transaction-contracts.ts#L43)

#### Parameters

##### participants

readonly [`TransactionParticipant`](TransactionParticipant.md)&lt;`unknown`&gt;[]

##### options?

[`TransactionOptions`](../type-aliases/TransactionOptions.md)

#### Returns

[`TransactionHandle`](TransactionHandle.md)
