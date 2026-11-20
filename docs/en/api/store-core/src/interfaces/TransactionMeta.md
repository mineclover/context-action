[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/store-core/src](../README.md) / TransactionMeta

# Interface: TransactionMeta

Defined in: [packages/store-core/src/transaction-contracts.ts:22](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/transaction-contracts.ts#L22)

Fixed correlation fields; arbitrary storage-specific metadata stays elsewhere.

## Extends

- `Pick`\<[`StateMutationMeta`](StateMutationMeta.md), `"transactionId"` \| `"actionId"` \| `"label"` \| `"origin"`\>

## Properties

### transactionId?

> `readonly` `optional` **transactionId?**: `string`

Defined in: [packages/store-core/src/contracts.ts:6](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L6)

#### Inherited from

[`StateMutationMeta`](StateMutationMeta.md).[`transactionId`](StateMutationMeta.md#transactionid)

***

### actionId?

> `readonly` `optional` **actionId?**: `string`

Defined in: [packages/store-core/src/contracts.ts:7](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L7)

#### Inherited from

[`StateMutationMeta`](StateMutationMeta.md).[`actionId`](StateMutationMeta.md#actionid)

***

### origin?

> `readonly` `optional` **origin?**: [`StateMutationOrigin`](../type-aliases/StateMutationOrigin.md)

Defined in: [packages/store-core/src/contracts.ts:8](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L8)

#### Inherited from

[`StateMutationMeta`](StateMutationMeta.md).[`origin`](StateMutationMeta.md#origin)

***

### label?

> `readonly` `optional` **label?**: `string`

Defined in: [packages/store-core/src/contracts.ts:9](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L9)

#### Inherited from

[`StateMutationMeta`](StateMutationMeta.md).[`label`](StateMutationMeta.md#label)

***

### id

> `readonly` **id**: `string`

Defined in: [packages/store-core/src/transaction-contracts.ts:23](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/transaction-contracts.ts#L23)
