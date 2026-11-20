[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/store-core/src](../README.md) / TransactionParticipant

# Interface: TransactionParticipant\<T\>

Defined in: [packages/store-core/src/transaction-contracts.ts:28](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/transaction-contracts.ts#L28)

## Type Parameters

### Generic type T

`T` = `unknown`

## Properties

### name

> `readonly` **name**: `string`

Defined in: [packages/store-core/src/transaction-contracts.ts:29](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/transaction-contracts.ts#L29)

***

### store

> `readonly` **store**: [`TransactionParticipantBackend`](TransactionParticipantBackend.md)&lt;`T`&gt;

Defined in: [packages/store-core/src/transaction-contracts.ts:30](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/transaction-contracts.ts#L30)

***

### batchControl?

> `readonly` `optional` **batchControl?**: [`TransactionBatchControl`](TransactionBatchControl.md)

Defined in: [packages/store-core/src/transaction-contracts.ts:32](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/transaction-contracts.ts#L32)

Operation-only authority; history must retain store, not this control.
