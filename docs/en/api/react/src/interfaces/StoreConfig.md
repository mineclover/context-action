[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / StoreConfig

# Interface: StoreConfig\<T\>

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:48](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L48)

Store configuration interface for store context pattern

Defines configuration options for individual stores including initial values,
comparison strategies, debugging options, and metadata.

## See

https://mineclover.github.io/context-action/en/guide/patterns/store/

## Type Parameters

### Generic type T

`T` = `any`

The type of values stored in this store

## Properties

### initialValue

> **initialValue**: `T`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:49](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L49)

***

### strategy?

> `optional` **strategy?**: `"reference"` \| `"shallow"` \| `"deep"`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:50](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L50)

***

### ~~compareStrategy?~~

> `optional` **compareStrategy?**: `"reference"` \| `"shallow"` \| `"deep"`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:52](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L52)

#### Deprecated

Use strategy instead.

***

### description?

> `optional` **description?**: `string`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:53](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L53)

***

### debug?

> `optional` **debug?**: `boolean`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:54](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L54)

***

### tags?

> `optional` **tags?**: `string`[]

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:55](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L55)

***

### version?

> `optional` **version?**: `string`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:56](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L56)

***

### comparisonOptions?

> `optional` **comparisonOptions?**: `Partial`\<`ComparisonOptions`&lt;`T`&gt;\>

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:57](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L57)
