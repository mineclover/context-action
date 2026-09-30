[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / TimeTravelStoreConfig

# Interface: TimeTravelStoreConfig\<T\>

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:58](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L58)

Time travel store configuration

## Type Parameters

### Generic type T

`T` = `any`

## Properties

### initialValue

> **initialValue**: `T`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:59](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L59)

***

### timeTravel?

> `optional` **timeTravel?**: `boolean`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:61](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L61)

Enable time travel (undo/redo). Default: true

***

### maxHistory?

> `optional` **maxHistory?**: `number`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:63](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L63)

Maximum undo history length

***

### mutable?

> `optional` **mutable?**: `boolean`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:65](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L65)

Enable mutable mode for observable state

***

### strategy?

> `optional` **strategy?**: `"reference"` \| `"shallow"` \| `"deep"`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:67](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L67)

Comparison strategy

***

### description?

> `optional` **description?**: `string`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:68](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L68)

***

### debug?

> `optional` **debug?**: `boolean`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:69](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L69)

***

### tags?

> `optional` **tags?**: `string`[]

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:70](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L70)

***

### version?

> `optional` **version?**: `string`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:71](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L71)

***

### comparisonOptions?

> `optional` **comparisonOptions?**: `Partial`\<`ComparisonOptions`&lt;`T`&gt;\>

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:72](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L72)

***

### readMode?

> `optional` **readMode?**: `"reference"` \| `"safe"`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:74](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L74)

Public read policy. Manager defaults to safe defensive reads.
