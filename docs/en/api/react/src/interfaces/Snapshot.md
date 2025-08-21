[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / Snapshot

# Interface: Snapshot\<T\>

Defined in: [packages/react/src/stores/core/types.ts:51](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/core/types.ts#L51)

Store snapshot interface for immutable state representation

## Implements

store-snapshot

## Implements

immutable-state

## Memberof

api-terms

Immutable snapshot of Store state used for optimization and debugging.
Compatible with React's useSyncExternalStore pattern.

## Type Parameters

### Generic type T

`T` = `any`

The type of the stored value

## Properties

### value

> **value**: `T`

Defined in: [packages/react/src/stores/core/types.ts:53](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/core/types.ts#L53)

The current value of the store

***

### name

> **name**: `string`

Defined in: [packages/react/src/stores/core/types.ts:56](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/core/types.ts#L56)

Unique identifier for the store

***

### lastUpdate

> **lastUpdate**: `number`

Defined in: [packages/react/src/stores/core/types.ts:59](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/core/types.ts#L59)

Timestamp of the last update
