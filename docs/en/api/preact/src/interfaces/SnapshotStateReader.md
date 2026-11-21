[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/preact/src](../README.md) / SnapshotStateReader

# Interface: SnapshotStateReader\<T\>

Defined in: [packages/preact/src/source-signal.ts:25](https://github.com/mineclover/context-action/blob/main/packages/preact/src/source-signal.ts#L25)

Structural envelope contract matching `@context-action/store-core` `StateReader&lt;T&gt;` and `@context-action/react` `StoreReader&lt;T&gt;`.

## Type Parameters

### Generic type T

Type parameter **T**

## Methods

### getSnapshot()

> **getSnapshot**(): `object`

Defined in: [packages/preact/src/source-signal.ts:26](https://github.com/mineclover/context-action/blob/main/packages/preact/src/source-signal.ts#L26)

#### Returns

`object`

##### value

> `readonly` **value**: `T`

***

### subscribe()

> **subscribe**(`notify`): () => `void`

Defined in: [packages/preact/src/source-signal.ts:27](https://github.com/mineclover/context-action/blob/main/packages/preact/src/source-signal.ts#L27)

#### Parameters

##### notify

() => `void`

#### Returns

() => `void`
