[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/xstate/src](../README.md) / ActorEmissionMap

# Type Alias: ActorEmissionMap\<TActions, TEmitted\>

> **ActorEmissionMap**\<`TActions`, `TEmitted`\> = `{ readonly [TEmittedType in TEmitted["type"]]?: ActorEmissionEntry<TActions, Extract<TEmitted, { type: TEmittedType }>> }`

Defined in: [packages/xstate/src/pipeline-binding.ts:41](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/pipeline-binding.ts#L41)

## Type Parameters

### TActions

`TActions` *extends* `ActionPayloadMap`

### TEmitted

`TEmitted` *extends* [`StatechartEventLike`](../interfaces/StatechartEventLike.md) = [`StatechartEventLike`](../interfaces/StatechartEventLike.md)
