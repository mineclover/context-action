[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src/advanced](../README.md) / DeepReadonly

# Type Alias: DeepReadonly\<T\>

> **DeepReadonly**&lt;`T`&gt; = `{ readonly [P in keyof T]: T[P] extends (infer U)[] ? DeepReadonlyArray&lt;U&gt; : T[P] extends object ? DeepReadonly<T[P]> : T[P] }`

Defined in: [packages/react/src/stores/utils/type-helpers.ts:64](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/utils/type-helpers.ts#L64)

Deep readonly type for immutable store values

## Type Parameters

### Generic type T

Type parameter **T**
