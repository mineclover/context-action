[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/xstate/src](../README.md) / ActorEmissionEntry

# Type Alias: ActorEmissionEntry\<TActions, TEmitted\>

> **ActorEmissionEntry**\<`TActions`, `TEmitted`\> = `ActionNames`&lt;`TActions`&gt; \| ((`emitted`, `emitter`) => `void` \| `Promise`&lt;`void`&gt;)

Defined in: [packages/xstate/src/pipeline-binding.ts:31](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/pipeline-binding.ts#L31)

## Type Parameters

### TActions

`TActions` *extends* `ActionPayloadMap`

### TEmitted

`TEmitted` *extends* [`StatechartEventLike`](../interfaces/StatechartEventLike.md) = [`StatechartEventLike`](../interfaces/StatechartEventLike.md)
