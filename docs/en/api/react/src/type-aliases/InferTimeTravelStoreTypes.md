[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / InferTimeTravelStoreTypes

# Type Alias: InferTimeTravelStoreTypes\<T\>

> **InferTimeTravelStoreTypes**&lt;`T`&gt; = `{ readonly [K in keyof T]: T[K] extends ExplicitStoreValue<infer V> ? V : T[K] extends { initialValue: infer V } ? Exclude<keyof T[K], keyof TimeTravelStoreConfig<any>> extends never ? V : T[K] : T[K] extends (args: unknown[]) => unknown ? never : T[K] }`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:112](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L112)

Infer store types from definitions

## Type Parameters

### Generic type T

`T` *extends* `Record`\<`string`, `any`\>
