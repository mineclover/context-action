[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-durable-operations/src](../README.md) / DurableOperationStoreOptions

# Interface: DurableOperationStoreOptions

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:100](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/durable-operation.ts#L100)

## Properties

### now?

> `readonly` `optional` **now?**: () => `number`

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:102](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/durable-operation.ts#L102)

Injectable clock for deterministic tests.

#### Returns

`number`

***

### defaultLeaseMs?

> `readonly` `optional` **defaultLeaseMs?**: `number`

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:104](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/durable-operation.ts#L104)

Default lease used when a claim omits `leaseMs`. Defaults to five minutes.

***

### maxAttempts?

> `readonly` `optional` **maxAttempts?**: `number`

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:106](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/durable-operation.ts#L106)

Maximum CAS retries before reporting backend contention. Defaults to eight.

***

### retentionMs?

> `readonly` `optional` **retentionMs?**: `number`

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:108](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/durable-operation.ts#L108)

Terminal record retention used by `prune()`. Defaults to one day.

***

### prunePageSize?

> `readonly` `optional` **prunePageSize?**: `number`

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:110](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/durable-operation.ts#L110)

Page size used by a backend's bounded `listPage()` scan.

***

### maxPrunePages?

> `readonly` `optional` **maxPrunePages?**: `number`

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:112](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/durable-operation.ts#L112)

Maximum pages per prune call. Defaults to 1,000; use Infinity explicitly for trusted stores.
