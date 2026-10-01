[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / Snapshot

# Interface: Snapshot\<T\>

Defined in: [packages/react/src/stores/core/types.ts:97](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L97)

Enhanced store snapshot with metadata and validation

## Implements

store-snapshot

## Implements

immutable-state

## Memberof

api-terms

Enhanced immutable snapshot with comprehensive metadata, validation status,
and performance metrics for advanced debugging and monitoring.

## Type Parameters

### Generic type T

`T` = `unknown`

The type of the stored value

## Properties

### value

> **value**: `T`

Defined in: [packages/react/src/stores/core/types.ts:99](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L99)

The current value of the store

***

### name

> **name**: `string`

Defined in: [packages/react/src/stores/core/types.ts:102](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L102)

Unique identifier for the store

***

### lastUpdate

> **lastUpdate**: `number`

Defined in: [packages/react/src/stores/core/types.ts:105](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L105)

Timestamp of the last update

***

### version?

> `optional` **version?**: `number`

Defined in: [packages/react/src/stores/core/types.ts:108](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L108)

Snapshot version for optimistic updates

***

### isValid?

> `optional` **isValid?**: `boolean`

Defined in: [packages/react/src/stores/core/types.ts:111](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L111)

Validation status of the current value

***

### validationError?

> `optional` **validationError?**: `string`

Defined in: [packages/react/src/stores/core/types.ts:114](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L114)

Error message if validation failed

***

### metrics?

> `optional` **metrics?**: `object`

Defined in: [packages/react/src/stores/core/types.ts:117](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L117)

Performance metrics for this snapshot

#### creationTime

> **creationTime**: `number`

Time taken to create this snapshot (ms)

#### sizeEstimate?

> `optional` **sizeEstimate?**: `number`

Memory size estimate (bytes)

#### notificationCount?

> `optional` **notificationCount?**: `number`

Number of listeners notified

***

### security?

> `optional` **security?**: `object`

Defined in: [packages/react/src/stores/core/types.ts:127](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L127)

Security metadata

#### validated

> **validated**: `boolean`

Whether value passed security validation

#### sanitized?

> `optional` **sanitized?**: `boolean`

Sanitization applied

#### trustLevel?

> `optional` **trustLevel?**: `number`

Trust level (0-100)
