[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/xstate/src](../README.md) / createActorStateReader

# Function: createActorStateReader()

> **createActorStateReader**\<`TSnapshot`, `TSelected`\>(`name`, `actor`, `options?`): [`ActorStateReader`](../interfaces/ActorStateReader.md)&lt;`TSelected`&gt;

Defined in: [packages/xstate/src/actor-state-reader.ts:34](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/actor-state-reader.ts#L34)

Projects any XState v5/v6 or `@xstate/effect` `ActorRefLike` onto a versioned
`@context-action/store-core` `StateReader<TSelected>`.

Guarantees fresh reads even before the first `subscribe()` call and suppresses
redundant subscriber notifications when `equals(prev, next)` holds.

## Type Parameters

### TSnapshot

`TSnapshot` *extends* [`StatechartSnapshotPort`](../interfaces/StatechartSnapshotPort.md)\<`unknown`, `unknown`\>

### TSelected

`TSelected` = `TSnapshot`

## Parameters

### name

`string`

### actor

`Pick`\<[`ActorRefLike`](../interfaces/ActorRefLike.md)\<`never`, `TSnapshot`\>, `"getSnapshot"` \| `"subscribe"`\>

### options?

[`ActorStateReaderOptions`](../interfaces/ActorStateReaderOptions.md)\<`TSnapshot`, `TSelected`\> = `{}`

## Returns

[`ActorStateReader`](../interfaces/ActorStateReader.md)&lt;`TSelected`&gt;
