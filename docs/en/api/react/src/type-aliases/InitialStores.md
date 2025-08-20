[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / InitialStores

# Type Alias: InitialStores\<T\>

> **InitialStores**&lt;`T`&gt; = \{ \[K in keyof T\]: StoreConfig\<T\[K\]\> \| T\[K\] \}

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:76](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L76)

Initial stores type mapping for declarative store pattern

Maps store names to their configuration or direct initial values.
Supports both full configuration objects and direct value assignment
for simplified store definition.

## Type Parameters

### Generic type T

`T` *extends* `Record`\<`string`, `any`\>

Record of store names to their value types

## Example

```typescript
type AppStores = {
  user: User
  settings: AppSettings
  theme: 'light' | 'dark'
}

const stores: InitialStores<AppStores> = {
  user: { initialValue: defaultUser, strategy: 'shallow' },
  settings: defaultSettings,  // Direct value
  theme: 'light'              // Direct value
}
```
