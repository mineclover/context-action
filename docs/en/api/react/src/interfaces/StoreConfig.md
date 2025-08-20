[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / StoreConfig

# Interface: StoreConfig\<T\>

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:40](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L40)

Store configuration interface for declarative store pattern

Defines configuration options for individual stores including initial values,
comparison strategies, debugging options, and metadata.

## Example

```typescript
const userConfig: StoreConfig<User> = {
  initialValue: { id: '', name: '', email: '' },
  strategy: 'shallow',
  description: 'User profile data',
  debug: true,
  tags: ['user', 'profile'],
  version: '1.0.0'
}
```

## Type Parameters

### Generic type T

`T` = `any`

The type of values stored in this store

## Properties

### initialValue

> **initialValue**: `T`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:41](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L41)

***

### strategy?

> `optional` **strategy**: `"reference"` \| `"shallow"` \| `"deep"`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:42](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L42)

***

### description?

> `optional` **description**: `string`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:43](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L43)

***

### debug?

> `optional` **debug**: `boolean`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:44](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L44)

***

### tags?

> `optional` **tags**: `string`[]

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:45](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L45)

***

### version?

> `optional` **version**: `string`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:46](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L46)

***

### comparisonOptions?

> `optional` **comparisonOptions**: `Partial`\<[`ComparisonOptions`](ComparisonOptions.md)&lt;`T`&gt;\>

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:47](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L47)
