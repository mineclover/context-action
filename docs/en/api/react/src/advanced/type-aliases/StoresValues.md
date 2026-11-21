[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src/advanced](../README.md) / StoresValues

# Type Alias: StoresValues\<S\>

> **StoresValues**&lt;`S`&gt; = `{ [K in keyof S]: StoreValue<S[K]> }`

Defined in: [packages/react/src/stores/utils/type-helpers.ts:20](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/utils/type-helpers.ts#L20)

Extract value types from multiple stores

## Type Parameters

### Generic type S

`S` *extends* readonly [`Store`](../../classes/Store.md)&lt;`any`&gt;[]
