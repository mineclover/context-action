[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/mutative/src](../README.md) / MutativeStateBackend

# Class: MutativeStateBackend\<T\>

Defined in: [packages/mutative/src/backend.ts:341](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L341)

A framework-neutral Mutative state backend without timeline history.

The backend owns cloning, draft updates, patch capture, and snapshots. It
intentionally has no React dependency and can be wrapped by any UI layer.

## Type Parameters

### Generic type T

`T` = `unknown`

## Implements

- `StateBackend`\<`T`, `MutativePatch`\>

## Constructors

### Constructor

> **new MutativeStateBackend**&lt;`T`&gt;(`name`, `initialValue`, `options?`): `MutativeStateBackend`&lt;`T`&gt;

Defined in: [packages/mutative/src/backend.ts:360](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L360)

#### Parameters

##### name

`string`

##### initialValue

Type parameter **T**

##### options?

[`MutativeStateBackendOptions`](../interfaces/MutativeStateBackendOptions.md) = `{}`

#### Returns

`MutativeStateBackend`&lt;`T`&gt;

## Methods

### getSnapshot()

> **getSnapshot**(): `ReadonlyStateSnapshot`&lt;`T`&gt;

Defined in: [packages/mutative/src/backend.ts:382](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L382)

#### Returns

`ReadonlyStateSnapshot`&lt;`T`&gt;

#### Implementation of

`StateBackend.getSnapshot`

***

### subscribe()

> **subscribe**(`listener`): () => `void`

Defined in: [packages/mutative/src/backend.ts:384](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L384)

#### Parameters

##### listener

() => `void`

#### Returns

() => `void`

#### Implementation of

`StateBackend.subscribe`

***

### subscribeWithPatches()

> **subscribeWithPatches**(`listener`): () => `void`

Defined in: [packages/mutative/src/backend.ts:390](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L390)

#### Parameters

##### listener

(`patches`) => `void`

#### Returns

() => `void`

#### Implementation of

`StateBackend.subscribeWithPatches`

***

### getLastPatches()

> **getLastPatches**(): readonly (`IPatch` & `object` \| `IPatch` & `object` \| `IPatch` & `object`)[] \| `null`

Defined in: [packages/mutative/src/backend.ts:398](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L398)

#### Returns

readonly (`IPatch` & `object` \| `IPatch` & `object` \| `IPatch` & `object`)[] \| `null`

#### Implementation of

`StateBackend.getLastPatches`

***

### getSafeValue()

> **getSafeValue**(): `T`

Defined in: [packages/mutative/src/backend.ts:400](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L400)

#### Returns

Type parameter **T**

#### Implementation of

`StateBackend.getSafeValue`

***

### setValue()

> **setValue**(`value`, `_meta?`): `void`

Defined in: [packages/mutative/src/backend.ts:402](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L402)

#### Parameters

##### value

Type parameter **T**

##### \_meta?

Type parameter **StateMutationMeta**

#### Returns

`void`

#### Implementation of

`StateBackend.setValue`

***

### update()

> **update**(`updater`, `_meta?`): `void`

Defined in: [packages/mutative/src/backend.ts:417](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L417)

#### Parameters

##### updater

(`current`) => `T` \| `undefined`

##### \_meta?

Type parameter **StateMutationMeta**

#### Returns

`void`

#### Implementation of

`StateBackend.update`

***

### isStoreDisposed()

> **isStoreDisposed**(): `boolean`

Defined in: [packages/mutative/src/backend.ts:434](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L434)

#### Returns

`boolean`

***

### dispose()

> **dispose**(): `void`

Defined in: [packages/mutative/src/backend.ts:436](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L436)

#### Returns

`void`

#### Implementation of

`StateBackend.dispose`

## Properties

### name

> `readonly` **name**: `string`

Defined in: [packages/mutative/src/backend.ts:344](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L344)

#### Implementation of

`StateBackend.name`

***

### capabilities

> `readonly` **capabilities**: `object`

Defined in: [packages/mutative/src/backend.ts:345](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L345)

#### patches

> `readonly` **patches**: `true` = `true`

#### timeline

> `readonly` **timeline**: `false` = `false`

#### immutableSnapshots

> `readonly` **immutableSnapshots**: `boolean`

#### Implementation of

`StateBackend.capabilities`
