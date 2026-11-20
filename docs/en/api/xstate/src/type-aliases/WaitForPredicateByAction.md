[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/xstate/src](../README.md) / WaitForPredicateByAction

# Type Alias: WaitForPredicateByAction\<TActions, TEvent, TSnapshot\>

> **WaitForPredicateByAction**\<`TActions`, `TEvent`, `TSnapshot`\> = `{ readonly [K in ActionNames<TActions>]?: (snapshot: TSnapshot, event: TEvent, payload: TActions[K]) => boolean }`

Defined in: [packages/xstate/src/pipeline-binding.ts:71](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/pipeline-binding.ts#L71)

## Type Parameters

### TActions

`TActions` *extends* `ActionPayloadMap`

### TEvent

`TEvent` *extends* [`StatechartEventLike`](../interfaces/StatechartEventLike.md)

### TSnapshot

`TSnapshot` *extends* [`StatechartSnapshotPort`](../interfaces/StatechartSnapshotPort.md)
