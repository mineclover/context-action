[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/xstate/src](../README.md) / ActorActionEmitter

# Interface: ActorActionEmitter\<TActions\>

Defined in: [packages/xstate/src/pipeline-binding.ts:103](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/pipeline-binding.ts#L103)

## Type Parameters

### TActions

`TActions` *extends* `ActionPayloadMap`

## Methods

### emit()

> **emit**&lt;`K`&gt;(`action`, ...`args`): `Promise`&lt;`void`&gt; \| `SyncDispatchOutcome`\<`TActions`\[`K`\], `unknown`\>

Defined in: [packages/xstate/src/pipeline-binding.ts:104](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/pipeline-binding.ts#L104)

#### Type Parameters

##### K

`K` *extends* `string`

#### Parameters

##### action

Type parameter **K**

##### args

...[`EmitArgs`](../type-aliases/EmitArgs.md)\<`TActions`\[`K`\]\>

#### Returns

`Promise`&lt;`void`&gt; \| `SyncDispatchOutcome`\<`TActions`\[`K`\], `unknown`\>

***

### enqueue()

> **enqueue**&lt;`K`&gt;(`enq`, `action`, ...`args`): `void`

Defined in: [packages/xstate/src/pipeline-binding.ts:108](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/pipeline-binding.ts#L108)

#### Type Parameters

##### K

`K` *extends* `string`

#### Parameters

##### enq

(`effect`) => `void`

##### action

Type parameter **K**

##### args

...[`EmitArgs`](../type-aliases/EmitArgs.md)\<`TActions`\[`K`\]\>

#### Returns

`void`
