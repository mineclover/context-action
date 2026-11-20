[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/store-core/src](../README.md) / StateMutationMeta

# Interface: StateMutationMeta

Defined in: [packages/store-core/src/contracts.ts:5](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L5)

Metadata is extensible so adapters can preserve their own correlation data.

## Indexable

> \[`key`: `string`\]: `unknown`

## Properties

### transactionId?

> `readonly` `optional` **transactionId?**: `string`

Defined in: [packages/store-core/src/contracts.ts:6](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L6)

***

### actionId?

> `readonly` `optional` **actionId?**: `string`

Defined in: [packages/store-core/src/contracts.ts:7](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L7)

***

### origin?

> `readonly` `optional` **origin?**: [`StateMutationOrigin`](../type-aliases/StateMutationOrigin.md)

Defined in: [packages/store-core/src/contracts.ts:8](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L8)

***

### label?

> `readonly` `optional` **label?**: `string`

Defined in: [packages/store-core/src/contracts.ts:9](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L9)
