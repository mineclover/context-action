[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src/advanced](../README.md) / PartialBy

# Type Alias: PartialBy\<T, K\>

> **PartialBy**\<`T`, `K`\> = `Omit`\<`T`, `K`\> & `Partial`\<`Pick`\<`T`, `K`\>\>

Defined in: [packages/react/src/stores/utils/type-helpers.ts:54](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/utils/type-helpers.ts#L54)

Utility type for making certain properties optional

## Type Parameters

### Generic type T

Type parameter **T**

### Generic type K

`K` *extends* keyof `T`
