[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/react/src](../README.md) / Snapshot

# Interface: Snapshot\<T\>

Defined in: [packages/react/src/stores/core/types.ts:72](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L72)

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

Defined in: [packages/react/src/stores/core/types.ts:74](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L74)

The current value of the store

***

### name

> **name**: `string`

Defined in: [packages/react/src/stores/core/types.ts:77](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L77)

Unique identifier for the store

***

### lastUpdate

> **lastUpdate**: `number`

Defined in: [packages/react/src/stores/core/types.ts:80](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L80)

Timestamp of the last update

***

### version?

> `optional` **version?**: `number`

Defined in: [packages/react/src/stores/core/types.ts:83](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L83)

Snapshot version for optimistic updates

***

### isValid?

> `optional` **isValid?**: `boolean`

Defined in: [packages/react/src/stores/core/types.ts:86](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L86)

Validation status of the current value

***

### validationError?

> `optional` **validationError?**: `string`

Defined in: [packages/react/src/stores/core/types.ts:89](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L89)

Error message if validation failed

***

### metrics?

> `optional` **metrics?**: `object`

Defined in: [packages/react/src/stores/core/types.ts:92](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L92)

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

Defined in: [packages/react/src/stores/core/types.ts:102](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L102)

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
