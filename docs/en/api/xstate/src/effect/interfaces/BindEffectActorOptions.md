[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/xstate/src/effect](../README.md) / BindEffectActorOptions

# Interface: BindEffectActorOptions\<TActions, TEvent, TSnapshot, TEmitted\>

Defined in: [packages/xstate/src/effect.ts:112](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/effect.ts#L112)

## Extends

- [`BindActorActionRegisterOptions`](../../interfaces/BindActorActionRegisterOptions.md)\<`TActions`, `TEvent`, `TSnapshot`, `TEmitted`\>

## Type Parameters

### TActions

`TActions` *extends* `ActionPayloadMap`

### TEvent

`TEvent` *extends* [`StatechartEventLike`](../../interfaces/StatechartEventLike.md) = [`StatechartEventLike`](../../interfaces/StatechartEventLike.md)

### TSnapshot

`TSnapshot` *extends* [`StatechartSnapshotPort`](../../interfaces/StatechartSnapshotPort.md) = [`StatechartSnapshotPort`](../../interfaces/StatechartSnapshotPort.md)

### TEmitted

`TEmitted` *extends* [`StatechartEventLike`](../../interfaces/StatechartEventLike.md) = [`StatechartEventLike`](../../interfaces/StatechartEventLike.md)

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

[`BindActorActionRegisterOptions`](../../interfaces/BindActorActionRegisterOptions.md).[`toEvent`](../../interfaces/BindActorActionRegisterOptions.md#toevent)

## Properties

### scope?

> `readonly` `optional` **scope?**: [`EffectScopeCloseableLike`](../type-aliases/EffectScopeCloseableLike.md)

Defined in: [packages/xstate/src/effect.ts:119](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/effect.ts#L119)

Effect `Scope` or close callback torn down when `handle.dispose()` runs.

***

### stopActorOnDispose?

> `readonly` `optional` **stopActorOnDispose?**: `boolean`

Defined in: [packages/xstate/src/effect.ts:121](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/effect.ts#L121)

Automatically invokes `actor.stop()` during `handle.dispose()`. Defaults to `true`.

***

### map?

> `readonly` `optional` **map?**: [`ActionToEventMap`](../../type-aliases/ActionToEventMap.md)\<`TActions`, `TEvent`\>

Defined in: [packages/xstate/src/pipeline-binding.ts:60](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/pipeline-binding.ts#L60)

#### Inherited from

[`BindActorActionRegisterOptions`](../../interfaces/BindActorActionRegisterOptions.md).[`map`](../../interfaces/BindActorActionRegisterOptions.md#map)

***

### actions?

> `readonly` `optional` **actions?**: readonly `Extract`\<keyof `TActions`, `string`\>[]

Defined in: [packages/xstate/src/pipeline-binding.ts:61](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/pipeline-binding.ts#L61)

#### Inherited from

[`BindActorActionRegisterOptions`](../../interfaces/BindActorActionRegisterOptions.md).[`actions`](../../interfaces/BindActorActionRegisterOptions.md#actions)

***

### emissions?

> `readonly` `optional` **emissions?**: [`ActorEmissionMap`](../../type-aliases/ActorEmissionMap.md)\<`TActions`, `TEmitted`\>

Defined in: [packages/xstate/src/pipeline-binding.ts:64](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/pipeline-binding.ts#L64)

Routes outbound XState `emit()` events (`actor.on(type, ...)`) back into this pipeline/register.

#### Inherited from

[`BindActorActionRegisterOptions`](../../interfaces/BindActorActionRegisterOptions.md).[`emissions`](../../interfaces/BindActorActionRegisterOptions.md#emissions)

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

[`BindActorActionRegisterOptions`](../../interfaces/BindActorActionRegisterOptions.md).[`onEmissionError`](../../interfaces/BindActorActionRegisterOptions.md#onemissionerror)

***

### enforceCanGuard?

> `readonly` `optional` **enforceCanGuard?**: `boolean`

Defined in: [packages/xstate/src/pipeline-binding.ts:66](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/pipeline-binding.ts#L66)

#### Inherited from

[`BindActorActionRegisterOptions`](../../interfaces/BindActorActionRegisterOptions.md).[`enforceCanGuard`](../../interfaces/BindActorActionRegisterOptions.md#enforcecanguard)

***

### guardPriority?

> `readonly` `optional` **guardPriority?**: `number`

Defined in: [packages/xstate/src/pipeline-binding.ts:67](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/pipeline-binding.ts#L67)

#### Inherited from

[`BindActorActionRegisterOptions`](../../interfaces/BindActorActionRegisterOptions.md).[`guardPriority`](../../interfaces/BindActorActionRegisterOptions.md#guardpriority)

***

### handlerPriority?

> `readonly` `optional` **handlerPriority?**: `number`

Defined in: [packages/xstate/src/pipeline-binding.ts:68](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/pipeline-binding.ts#L68)

#### Inherited from

[`BindActorActionRegisterOptions`](../../interfaces/BindActorActionRegisterOptions.md).[`handlerPriority`](../../interfaces/BindActorActionRegisterOptions.md#handlerpriority)

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

#### Inherited from

[`BindActorActionRegisterOptions`](../../interfaces/BindActorActionRegisterOptions.md).[`waitFor`](../../interfaces/BindActorActionRegisterOptions.md#waitfor)

***

### waitForByAction?

> `readonly` `optional` **waitForByAction?**: [`WaitForPredicateByAction`](../../type-aliases/WaitForPredicateByAction.md)\<`TActions`, `TEvent`, `TSnapshot`\>

Defined in: [packages/xstate/src/pipeline-binding.ts:92](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/pipeline-binding.ts#L92)

Optional per-action predicate overriding `waitFor` for specific actions.

#### Inherited from

[`BindActorActionRegisterOptions`](../../interfaces/BindActorActionRegisterOptions.md).[`waitForByAction`](../../interfaces/BindActorActionRegisterOptions.md#waitforbyaction)

***

### timeoutMs?

> `readonly` `optional` **timeoutMs?**: `number`

Defined in: [packages/xstate/src/pipeline-binding.ts:94](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/pipeline-binding.ts#L94)

Timeout (ms) applied when `waitFor` / `waitForByAction` is used.

#### Inherited from

[`BindActorActionRegisterOptions`](../../interfaces/BindActorActionRegisterOptions.md).[`timeoutMs`](../../interfaces/BindActorActionRegisterOptions.md#timeoutms)

***

### blocking?

> `readonly` `optional` **blocking?**: `boolean`

Defined in: [packages/xstate/src/pipeline-binding.ts:96](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/pipeline-binding.ts#L96)

Sets `blocking` on registered handlers. Defaults to true when waiting, undefined otherwise.

#### Inherited from

[`BindActorActionRegisterOptions`](../../interfaces/BindActorActionRegisterOptions.md).[`blocking`](../../interfaces/BindActorActionRegisterOptions.md#blocking)
