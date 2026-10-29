[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / StoreTransactionParticipant

# Interface: StoreTransactionParticipant\<T\>

Defined in: [packages/react/src/stores/core/StoreTransactionCoordinator.ts:18](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/StoreTransactionCoordinator.ts#L18)

## Extends

- `TransactionParticipant`&lt;`T`&gt;

## Type Parameters

### Generic type T

`T` = `unknown`

## Properties

### store

> `readonly` **store**: `TransactionBackend`&lt;`T`&gt;

Defined in: [packages/react/src/stores/core/StoreTransactionCoordinator.ts:20](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/StoreTransactionCoordinator.ts#L20)

Retain the legacy convenience surface for existing React callers.

#### Overrides

`TransactionParticipant.store`
