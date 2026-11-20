[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/store-core/src](../README.md) / createStateStore

# Function: createStateStore()

> **createStateStore**&lt;`T`&gt;(`name`, `initialValue`, `options?`): [`StateStore`](../interfaces/StateStore.md)&lt;`T`&gt;

Defined in: [packages/store-core/src/index.ts:28](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/index.ts#L28)

A trusted-reference backend for applications that already own immutability.
No clone, freeze, draft, or patch generation is performed.

## Type Parameters

### Generic type T

Type parameter **T**

## Parameters

### name

`string`

### initialValue

Type parameter **T**

### options?

[`StateStoreOptions`](../interfaces/StateStoreOptions.md) = `{}`

## Returns

[`StateStore`](../interfaces/StateStore.md)&lt;`T`&gt;
