[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/xstate/src](../README.md) / BindActorActionRegisterOptions

# Interface: BindActorActionRegisterOptions\<TActions, TEvent, TSnapshot, TEmitted\>

Defined in: [packages/xstate/src/pipeline-binding.ts:83](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/pipeline-binding.ts#L83)

## Extends

- [`BindActorPipelineOptions`](BindActorPipelineOptions.md)\<`TActions`, `TEvent`, `TEmitted`\>

## Type Parameters

### TActions

`TActions` *extends* `ActionPayloadMap`

### TEvent

`TEvent` *extends* [`StatechartEventLike`](StatechartEventLike.md) = [`StatechartEventLike`](StatechartEventLike.md)

### TSnapshot

`TSnapshot` *extends* [`StatechartSnapshotPort`](StatechartSnapshotPort.md) = [`StatechartSnapshotPort`](StatechartSnapshotPort.md)

### TEmitted

`TEmitted` *extends* [`StatechartEventLike`](StatechartEventLike.md) = [`StatechartEventLike`](StatechartEventLike.md)

## Methods

### toEvent()?

> `optional` **toEvent**&lt;`K`&gt;(`action`, `payload`): `TEvent`

Defined in: [packages/xstate/src/pipeline-binding.ts:62](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/pipeline-binding.ts#L62)

#### Type Parameters

##### K

`K` *extends* `string`

#### Parameters

##### action

Type parameter **K**

##### payload

`TActions`\[`K`\]

#### Returns

`TEvent`

#### Inherited from

[`BindActorPipelineOptions`](BindActorPipelineOptions.md).[`toEvent`](BindActorPipelineOptions.md#toevent)

## Properties

### map?

> `readonly` `optional` **map?**: [`ActionToEventMap`](../type-aliases/ActionToEventMap.md)\<`TActions`, `TEvent`\>

Defined in: [packages/xstate/src/pipeline-binding.ts:60](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/pipeline-binding.ts#L60)

#### Inherited from

[`BindActorPipelineOptions`](BindActorPipelineOptions.md).[`map`](BindActorPipelineOptions.md#map)

***

### actions?

> `readonly` `optional` **actions?**: readonly `Extract`\<keyof `TActions`, `string`\>[]

Defined in: [packages/xstate/src/pipeline-binding.ts:61](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/pipeline-binding.ts#L61)

#### Inherited from

[`BindActorPipelineOptions`](BindActorPipelineOptions.md).[`actions`](BindActorPipelineOptions.md#actions)

***

### emissions?

> `readonly` `optional` **emissions?**: [`ActorEmissionMap`](../type-aliases/ActorEmissionMap.md)\<`TActions`, `TEmitted`\>

Defined in: [packages/xstate/src/pipeline-binding.ts:64](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/pipeline-binding.ts#L64)

Routes outbound XState `emit()` events (`actor.on(type, ...)`) back into this pipeline/register.

#### Inherited from

[`BindActorPipelineOptions`](BindActorPipelineOptions.md).[`emissions`](BindActorPipelineOptions.md#emissions)

***

### onEmissionError?

> `readonly` `optional` **onEmissionError?**: (`error`, `emittedType`) => `void`

Defined in: [packages/xstate/src/pipeline-binding.ts:65](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/pipeline-binding.ts#L65)

#### Parameters

##### error

`unknown`

##### emittedType

`string`

#### Returns

`void`

#### Inherited from

[`BindActorPipelineOptions`](BindActorPipelineOptions.md).[`onEmissionError`](BindActorPipelineOptions.md#onemissionerror)

***

### enforceCanGuard?

> `readonly` `optional` **enforceCanGuard?**: `boolean`

Defined in: [packages/xstate/src/pipeline-binding.ts:66](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/pipeline-binding.ts#L66)

#### Inherited from

[`BindActorPipelineOptions`](BindActorPipelineOptions.md).[`enforceCanGuard`](BindActorPipelineOptions.md#enforcecanguard)

***

### guardPriority?

> `readonly` `optional` **guardPriority?**: `number`

Defined in: [packages/xstate/src/pipeline-binding.ts:67](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/pipeline-binding.ts#L67)

#### Inherited from

[`BindActorPipelineOptions`](BindActorPipelineOptions.md).[`guardPriority`](BindActorPipelineOptions.md#guardpriority)

***

### handlerPriority?

> `readonly` `optional` **handlerPriority?**: `number`

Defined in: [packages/xstate/src/pipeline-binding.ts:68](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/pipeline-binding.ts#L68)

#### Inherited from

[`BindActorPipelineOptions`](BindActorPipelineOptions.md).[`handlerPriority`](BindActorPipelineOptions.md#handlerpriority)

***

### waitFor?

> `readonly` `optional` **waitFor?**: (`snapshot`, `event`) => `boolean`

Defined in: [packages/xstate/src/pipeline-binding.ts:90](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/pipeline-binding.ts#L90)

Optional global predicate for waiting until the actor settles after `send(event)`.

#### Parameters

##### snapshot

`TSnapshot`

##### event

`TEvent`

#### Returns

`boolean`

***

### waitForByAction?

> `readonly` `optional` **waitForByAction?**: [`WaitForPredicateByAction`](../type-aliases/WaitForPredicateByAction.md)\<`TActions`, `TEvent`, `TSnapshot`\>

Defined in: [packages/xstate/src/pipeline-binding.ts:92](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/pipeline-binding.ts#L92)

Optional per-action predicate overriding `waitFor` for specific actions.

***

### timeoutMs?

> `readonly` `optional` **timeoutMs?**: `number`

Defined in: [packages/xstate/src/pipeline-binding.ts:94](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/pipeline-binding.ts#L94)

Timeout (ms) applied when `waitFor` / `waitForByAction` is used.

***

### blocking?

> `readonly` `optional` **blocking?**: `boolean`

Defined in: [packages/xstate/src/pipeline-binding.ts:96](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/pipeline-binding.ts#L96)

Sets `blocking` on registered handlers. Defaults to true when waiting, undefined otherwise.
