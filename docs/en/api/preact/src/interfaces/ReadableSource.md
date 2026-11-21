[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/preact/src](../README.md) / ReadableSource

# Interface: ReadableSource\<T\>

Defined in: [packages/preact/src/source-signal.ts:19](https://github.com/mineclover/context-action/blob/main/packages/preact/src/source-signal.ts#L19)

Immutable, cached snapshots; notifications are synchronous invalidations.

## Type Parameters

### Generic type T

Type parameter **T**

## Methods

### getSnapshot()

> **getSnapshot**(): `T`

Defined in: [packages/preact/src/source-signal.ts:20](https://github.com/mineclover/context-action/blob/main/packages/preact/src/source-signal.ts#L20)

#### Returns

Type parameter **T**

***

### subscribe()

> **subscribe**(`notify`): () => `void`

Defined in: [packages/preact/src/source-signal.ts:21](https://github.com/mineclover/context-action/blob/main/packages/preact/src/source-signal.ts#L21)

#### Parameters

##### notify

() => `void`

#### Returns

() => `void`
