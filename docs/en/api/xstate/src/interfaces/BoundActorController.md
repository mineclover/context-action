[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/xstate/src](../README.md) / BoundActorController

# Interface: BoundActorController\<TActions, TSnapshot\>

Defined in: [packages/xstate/src/contracts.ts:78](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/contracts.ts#L78)

Shared read/capability inspection controller exposed by all `@context-action/xstate` bindings.

## Type Parameters

### TActions

`TActions` *extends* `ActionPayloadMap`

### TSnapshot

`TSnapshot` *extends* [`StatechartSnapshotPort`](StatechartSnapshotPort.md) = [`StatechartSnapshotPort`](StatechartSnapshotPort.md)

## Methods

### unbind()

> **unbind**(): `void`

Defined in: [packages/xstate/src/contracts.ts:82](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/contracts.ts#L82)

#### Returns

`void`

***

### getSnapshot()

> **getSnapshot**(): `TSnapshot`

Defined in: [packages/xstate/src/contracts.ts:83](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/contracts.ts#L83)

#### Returns

Type parameter **TSnapshot**

***

### canDispatch()

> **canDispatch**&lt;`K`&gt;(`action`, ...`args`): `boolean`

Defined in: [packages/xstate/src/contracts.ts:84](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/contracts.ts#L84)

#### Type Parameters

##### K

`K` *extends* `string`

#### Parameters

##### action

Type parameter **K**

##### args

...[`EmitArgs`](../type-aliases/EmitArgs.md)\<`TActions`\[`K`\]\>

#### Returns

`boolean`

***

### isDisposed()

> **isDisposed**(): `boolean`

Defined in: [packages/xstate/src/contracts.ts:88](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/contracts.ts#L88)

#### Returns

`boolean`
