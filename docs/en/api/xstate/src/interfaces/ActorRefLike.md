[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/xstate/src](../README.md) / ActorRefLike

# Interface: ActorRefLike\<TEvent, TSnapshot\>

Defined in: [packages/xstate/src/contracts.ts:32](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/contracts.ts#L32)

Standard runtime contract implemented by XState v5 `createActor()`, XState v6
`createActor()`, and `@xstate/effect` `createEffectActor()` instances.

## Type Parameters

### TEvent

`TEvent` *extends* [`StatechartEventLike`](StatechartEventLike.md) = [`StatechartEventLike`](StatechartEventLike.md)

### TSnapshot

`TSnapshot` *extends* [`StatechartSnapshotPort`](StatechartSnapshotPort.md) = [`StatechartSnapshotPort`](StatechartSnapshotPort.md)

## Methods

### getSnapshot()

> **getSnapshot**(): `TSnapshot`

Defined in: [packages/xstate/src/contracts.ts:36](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/contracts.ts#L36)

#### Returns

Type parameter **TSnapshot**

***

### send()

> **send**(`event`): `void`

Defined in: [packages/xstate/src/contracts.ts:37](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/contracts.ts#L37)

#### Parameters

##### event

Type parameter **TEvent**

#### Returns

`void`

***

### subscribe()

> **subscribe**(`listenerOrObserver`): [`StatechartSubscriptionLike`](../type-aliases/StatechartSubscriptionLike.md)

Defined in: [packages/xstate/src/contracts.ts:38](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/contracts.ts#L38)

#### Parameters

##### listenerOrObserver

[`StatechartObserverLike`](StatechartObserverLike.md)&lt;`TSnapshot`&gt; \| ((`snapshot`) => `void`)

#### Returns

[`StatechartSubscriptionLike`](../type-aliases/StatechartSubscriptionLike.md)

***

### stop()?

> `optional` **stop**(): `unknown`

Defined in: [packages/xstate/src/contracts.ts:41](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/contracts.ts#L41)

#### Returns

`unknown`

***

### on()?

> `optional` **on**(`type`, `handler`): [`StatechartSubscriptionLike`](../type-aliases/StatechartSubscriptionLike.md)

Defined in: [packages/xstate/src/contracts.ts:42](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/contracts.ts#L42)

#### Parameters

##### type

`string`

##### handler

(`emitted`) => `void`

#### Returns

[`StatechartSubscriptionLike`](../type-aliases/StatechartSubscriptionLike.md)
