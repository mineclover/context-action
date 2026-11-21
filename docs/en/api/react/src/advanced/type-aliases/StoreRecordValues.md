[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src/advanced](../README.md) / StoreRecordValues

# Type Alias: StoreRecordValues\<S\>

> **StoreRecordValues**&lt;`S`&gt; = `{ [K in keyof S]: StoreValue<S[K]> }`

Defined in: [packages/react/src/stores/utils/type-helpers.ts:27](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/utils/type-helpers.ts#L27)

Extract value types from a record of stores

## Type Parameters

### Generic type S

`S` *extends* `Record`\<`string`, [`Store`](../../classes/Store.md)&lt;`any`&gt;\>
