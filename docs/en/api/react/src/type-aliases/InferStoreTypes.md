[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / InferStoreTypes

# Type Alias: InferStoreTypes\<T\>

> **InferStoreTypes**&lt;`T`&gt; = `{ [K in keyof T]: T[K] extends StoreConfig<infer V> ? V : T[K] extends (args: any[]) => any ? never : T[K] extends object ? T[K] extends { length: number } ? T[K] : T[K] extends Date ? T[K] : T[K] : T[K] }`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:119](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L119)

Infer store value types from store definitions

Utility type that extracts the value types from store definitions,
supporting both configuration objects and direct values. Excludes
functions and properly handles arrays, dates, and objects.

## Type Parameters

### Generic type T

`T` *extends* [`StoreDefinitions`](StoreDefinitions.md)

Store definitions record

## Example

```typescript
const definitions = {
  user: { initialValue: { id: '', name: '' } },
  count: 0,
  items: [] as string[],
  settings: { theme: 'light' }
}

type InferredTypes = InferStoreTypes<typeof definitions>
// Result: {
//   user: { id: string; name: string }
//   count: number
//   items: string[]
//   settings: { theme: string }
// }
```
