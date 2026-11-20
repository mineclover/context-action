[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/xstate/src](../README.md) / ActorStateReader

# Interface: ActorStateReader\<TSelected\>

Defined in: [packages/xstate/src/actor-state-reader.ts:21](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/actor-state-reader.ts#L21)

## Extends

- `StateReader`&lt;`TSelected`&gt;

## Type Parameters

### TSelected

Type parameter **TSelected**

## Methods

### getSnapshot()

> **getSnapshot**(): `ReadonlyStateSnapshot`

Defined in: [packages/store-core/dist/index.d.ts:28](https://github.com/mineclover/context-action/blob/main/packages/store-core/dist/index.d.ts#L28)

#### Returns

Type parameter **ReadonlyStateSnapshot**

#### Inherited from

`StateReader.getSnapshot`

***

### subscribe()

> **subscribe**(`listener`): () => `void`

Defined in: [packages/store-core/dist/index.d.ts:30](https://github.com/mineclover/context-action/blob/main/packages/store-core/dist/index.d.ts#L30)

#### Parameters

##### listener

() => `void`

#### Returns

() => `void`

#### Inherited from

`StateReader.subscribe`

***

### getValue()

> **getValue**(): `TSelected`

Defined in: [packages/xstate/src/actor-state-reader.ts:22](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/actor-state-reader.ts#L22)

#### Returns

Type parameter **TSelected**

#### Overrides

`StateReader.getValue`

***

### isDisposed()

> **isDisposed**(): `boolean`

Defined in: [packages/xstate/src/actor-state-reader.ts:23](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/actor-state-reader.ts#L23)

#### Returns

`boolean`

***

### dispose()

> **dispose**(): `void`

Defined in: [packages/xstate/src/actor-state-reader.ts:24](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/actor-state-reader.ts#L24)

#### Returns

`void`

## Properties

### name

> `readonly` **name**: `string`

Defined in: [packages/store-core/dist/index.d.ts:27](https://github.com/mineclover/context-action/blob/main/packages/store-core/dist/index.d.ts#L27)

#### Inherited from

`StateReader.name`
