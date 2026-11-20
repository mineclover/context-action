[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/xstate/src](../README.md) / ActionToEventMap

# Type Alias: ActionToEventMap\<TActions, TEvent\>

> **ActionToEventMap**\<`TActions`, `TEvent`\> = `{ readonly [K in ActionNames<TActions>]?: ActionToEventEntry<TActions[K], TEvent> }`

Defined in: [packages/xstate/src/contracts.ts:68](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/contracts.ts#L68)

Type-safe action-to-event mapping keyed by ActionPayloadMap keys.

## Type Parameters

### TActions

`TActions` *extends* `ActionPayloadMap`

### TEvent

`TEvent` *extends* [`StatechartEventLike`](../interfaces/StatechartEventLike.md) = [`StatechartEventLike`](../interfaces/StatechartEventLike.md)
