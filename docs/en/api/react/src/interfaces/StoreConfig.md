[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / StoreConfig

# Interface: StoreConfig\<T\>

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:30](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L30)

Store configuration interface for store context pattern

Defines configuration options for individual stores including initial values,
comparison strategies, debugging options, and metadata.

## See

https://mineclover.github.io/context-action/en/guide/patterns/store/

## Type Parameters

### T

`T` = `any`

The type of values stored in this store

## Properties

### initialValue

> **initialValue**: `T`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:31](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L31)

***

### strategy?

> `optional` **strategy**: `"reference"` \| `"shallow"` \| `"deep"`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:32](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L32)

***

### description?

> `optional` **description**: `string`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:33](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L33)

***

### debug?

> `optional` **debug**: `boolean`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:34](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L34)

***

### tags?

> `optional` **tags**: `string`[]

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:35](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L35)

***

### version?

> `optional` **version**: `string`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:36](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L36)

***

### comparisonOptions?

> `optional` **comparisonOptions**: `Partial`\<`ComparisonOptions`\<`T`\>\>

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:37](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L37)
