[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/xstate/src](../README.md) / BindActorPipelineOptions

# Interface: BindActorPipelineOptions\<TActions, TEvent, TEmitted\>

Defined in: [packages/xstate/src/pipeline-binding.ts:55](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/pipeline-binding.ts#L55)

## Extended by

- [`BindActorActionRegisterOptions`](BindActorActionRegisterOptions.md)

## Type Parameters

### TActions

`TActions` *extends* `ActionPayloadMap`

### TEvent

`TEvent` *extends* [`StatechartEventLike`](StatechartEventLike.md) = [`StatechartEventLike`](StatechartEventLike.md)

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

## Properties

### map?

> `readonly` `optional` **map?**: [`ActionToEventMap`](../type-aliases/ActionToEventMap.md)\<`TActions`, `TEvent`\>

Defined in: [packages/xstate/src/pipeline-binding.ts:60](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/pipeline-binding.ts#L60)

***

### actions?

> `readonly` `optional` **actions?**: readonly `Extract`\<keyof `TActions`, `string`\>[]

Defined in: [packages/xstate/src/pipeline-binding.ts:61](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/pipeline-binding.ts#L61)

***

### emissions?

> `readonly` `optional` **emissions?**: [`ActorEmissionMap`](../type-aliases/ActorEmissionMap.md)\<`TActions`, `TEmitted`\>

Defined in: [packages/xstate/src/pipeline-binding.ts:64](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/pipeline-binding.ts#L64)

Routes outbound XState `emit()` events (`actor.on(type, ...)`) back into this pipeline/register.

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

***

### enforceCanGuard?

> `readonly` `optional` **enforceCanGuard?**: `boolean`

Defined in: [packages/xstate/src/pipeline-binding.ts:66](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/pipeline-binding.ts#L66)

***

### guardPriority?

> `readonly` `optional` **guardPriority?**: `number`

Defined in: [packages/xstate/src/pipeline-binding.ts:67](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/pipeline-binding.ts#L67)

***

### handlerPriority?

> `readonly` `optional` **handlerPriority?**: `number`

Defined in: [packages/xstate/src/pipeline-binding.ts:68](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/pipeline-binding.ts#L68)
