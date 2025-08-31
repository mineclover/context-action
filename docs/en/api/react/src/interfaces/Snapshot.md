[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / Snapshot

# Interface: Snapshot\<T\>

Defined in: [packages/react/src/stores/core/types.ts:95](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/stores/core/types.ts#L95)

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

### T

`T` = `unknown`

The type of the stored value

## Properties

### value

> **value**: `T`

Defined in: [packages/react/src/stores/core/types.ts:97](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/stores/core/types.ts#L97)

The current value of the store

***

### name

> **name**: `string`

Defined in: [packages/react/src/stores/core/types.ts:100](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/stores/core/types.ts#L100)

Unique identifier for the store

***

### lastUpdate

> **lastUpdate**: `number`

Defined in: [packages/react/src/stores/core/types.ts:103](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/stores/core/types.ts#L103)

Timestamp of the last update

***

### version?

> `optional` **version**: `number`

Defined in: [packages/react/src/stores/core/types.ts:106](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/stores/core/types.ts#L106)

Snapshot version for optimistic updates

***

### isValid?

> `optional` **isValid**: `boolean`

Defined in: [packages/react/src/stores/core/types.ts:109](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/stores/core/types.ts#L109)

Validation status of the current value

***

### validationError?

> `optional` **validationError**: `string`

Defined in: [packages/react/src/stores/core/types.ts:112](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/stores/core/types.ts#L112)

Error message if validation failed

***

### metrics?

> `optional` **metrics**: `object`

Defined in: [packages/react/src/stores/core/types.ts:115](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/stores/core/types.ts#L115)

Performance metrics for this snapshot

#### creationTime

> **creationTime**: `number`

Time taken to create this snapshot (ms)

#### sizeEstimate?

> `optional` **sizeEstimate**: `number`

Memory size estimate (bytes)

#### notificationCount?

> `optional` **notificationCount**: `number`

Number of listeners notified

***

### security?

> `optional` **security**: `object`

Defined in: [packages/react/src/stores/core/types.ts:125](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/stores/core/types.ts#L125)

Security metadata

#### validated

> **validated**: `boolean`

Whether value passed security validation

#### sanitized?

> `optional` **sanitized**: `boolean`

Sanitization applied

#### trustLevel?

> `optional` **trustLevel**: `number`

Trust level (0-100)
