[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/store-core/src](../README.md) / StatePatch

# Interface: StatePatch

Defined in: [packages/store-core/src/contracts.ts:14](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L14)

Patch paths intentionally accept non-string keys such as Map keys and Symbols.

## Properties

### op

> `readonly` **op**: `"add"` \| `"remove"` \| `"replace"` \| `"move"` \| `"copy"` \| `"test"`

Defined in: [packages/store-core/src/contracts.ts:15](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L15)

***

### path

> `readonly` **path**: readonly `unknown`[]

Defined in: [packages/store-core/src/contracts.ts:16](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L16)

***

### from?

> `readonly` `optional` **from?**: readonly `unknown`[]

Defined in: [packages/store-core/src/contracts.ts:17](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L17)

***

### value?

> `readonly` `optional` **value?**: `unknown`

Defined in: [packages/store-core/src/contracts.ts:18](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L18)
