[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/xstate/src](../README.md) / ActionToEventEntry

# Type Alias: ActionToEventEntry\<TPayload, TEvent\>

> **ActionToEventEntry**\<`TPayload`, `TEvent`\> = `TEvent`\[`"type"`\] \| ((`payload`) => `TEvent`)

Defined in: [packages/xstate/src/contracts.ts:62](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/contracts.ts#L62)

Declarative mapping entry from a Context-Action action key/payload to an XState event.

## Type Parameters

### TPayload

`TPayload`

### TEvent

`TEvent` *extends* [`StatechartEventLike`](../interfaces/StatechartEventLike.md) = [`StatechartEventLike`](../interfaces/StatechartEventLike.md)
