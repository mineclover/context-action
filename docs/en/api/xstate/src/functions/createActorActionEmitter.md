[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/xstate/src](../README.md) / createActorActionEmitter

# Function: createActorActionEmitter()

## Call Signature

> **createActorActionEmitter**\<`TActions`, `TResultMap`\>(`register`, `options?`): `object`

Defined in: [packages/xstate/src/pipeline-binding.ts:681](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/pipeline-binding.ts#L681)

Creates a bidirectional typed emitter enabling XState v5 actions, XState v6 `enq`
transitions, or `@xstate/effect` handlers to dispatch back into Context-Action.

### Type Parameters

#### TActions

`TActions` *extends* `object`

#### TResultMap

`TResultMap` *extends* `Partial`\<`Record`\<`Extract`\<keyof `TActions`, `string`\>, `unknown`\>\> = `Partial`\<`Record`\<`Extract`\<keyof `TActions`, `string`\>, `unknown`\>\>

### Parameters

#### register

`ActionRegister`\<`TActions`, `TResultMap`\>

#### options?

[`ActorActionEmitterOptions`](../interfaces/ActorActionEmitterOptions.md)

### Returns

`object`

#### emit()

> **emit**&lt;`K`&gt;(`action`, ...`args`): `Promise`&lt;`void`&gt;

##### Type Parameters

###### K

`K` *extends* `string`

##### Parameters

###### action

Type parameter **K**

###### args

...[`EmitArgs`](../type-aliases/EmitArgs.md)\<`TActions`\[`K`\]\>

##### Returns

`Promise`&lt;`void`&gt;

#### enqueue()

> **enqueue**&lt;`K`&gt;(`enq`, `action`, ...`args`): `void`

##### Type Parameters

###### K

`K` *extends* `string`

##### Parameters

###### enq

(`effect`) => `void`

###### action

Type parameter **K**

###### args

...[`EmitArgs`](../type-aliases/EmitArgs.md)\<`TActions`\[`K`\]\>

##### Returns

`void`

## Call Signature

> **createActorActionEmitter**&lt;`TActions`&gt;(`pipeline`, `options?`): `object`

Defined in: [packages/xstate/src/pipeline-binding.ts:695](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/pipeline-binding.ts#L695)

Creates a bidirectional typed emitter enabling XState v5 actions, XState v6 `enq`
transitions, or `@xstate/effect` handlers to dispatch back into Context-Action.

### Type Parameters

#### TActions

`TActions` *extends* `Record`\<`string`, `unknown`\>

### Parameters

#### pipeline

`SyncActionPipeline`&lt;`TActions`&gt;

#### options?

[`ActorActionEmitterOptions`](../interfaces/ActorActionEmitterOptions.md)

### Returns

`object`

#### emit()

> **emit**&lt;`K`&gt;(`action`, ...`args`): `SyncDispatchOutcome`\<`TActions`\[`K`\], `unknown`\>

##### Type Parameters

###### K

`K` *extends* `string`

##### Parameters

###### action

Type parameter **K**

###### args

...[`EmitArgs`](../type-aliases/EmitArgs.md)\<`TActions`\[`K`\]\>

##### Returns

`SyncDispatchOutcome`\<`TActions`\[`K`\], `unknown`\>

#### enqueue()

> **enqueue**&lt;`K`&gt;(`enq`, `action`, ...`args`): `void`

##### Type Parameters

###### K

`K` *extends* `string`

##### Parameters

###### enq

(`effect`) => `void`

###### action

Type parameter **K**

###### args

...[`EmitArgs`](../type-aliases/EmitArgs.md)\<`TActions`\[`K`\]\>

##### Returns

`void`
