[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / TimeTravelStoreConfig

# Interface: TimeTravelStoreConfig\<T\>

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:71](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L71)

Time travel store configuration

## Type Parameters

### Generic type T

`T` = `any`

## Properties

### initialValue

> **initialValue**: `T`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:72](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L72)

***

### timeTravel?

> `optional` **timeTravel?**: `boolean`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:74](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L74)

Enable time travel (undo/redo). Default: true

***

### maxHistory?

> `optional` **maxHistory?**: `number`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:76](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L76)

Maximum undo history length

***

### mutable?

> `optional` **mutable?**: `boolean`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:78](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L78)

Enable mutable mode for observable state

***

### strategy?

> `optional` **strategy?**: `"reference"` \| `"shallow"` \| `"deep"`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:80](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L80)

Comparison strategy

***

### description?

> `optional` **description?**: `string`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:81](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L81)

***

### debug?

> `optional` **debug?**: `boolean`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:82](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L82)

***

### tags?

> `optional` **tags?**: `string`[]

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:83](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L83)

***

### version?

> `optional` **version?**: `string`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:84](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L84)

***

### comparisonOptions?

> `optional` **comparisonOptions?**: `Partial`\<`ComparisonOptions`&lt;`T`&gt;\>

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:85](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L85)
