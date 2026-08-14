[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-durable-operations/src](../README.md) / DurableOperationStoreOptions

# Interface: DurableOperationStoreOptions

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:128](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/durable-operation.ts#L128)

## Properties

### now?

> `readonly` `optional` **now?**: () => `number`

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:130](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/durable-operation.ts#L130)

Injectable clock for deterministic tests.

#### Returns

`number`

***

### defaultLeaseMs?

> `readonly` `optional` **defaultLeaseMs?**: `number`

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:132](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/durable-operation.ts#L132)

Default lease used when a claim omits `leaseMs`. Defaults to five minutes.

***

### maxAttempts?

> `readonly` `optional` **maxAttempts?**: `number`

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:134](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/durable-operation.ts#L134)

Maximum CAS retries before reporting backend contention. Defaults to eight.

***

### retentionMs?

> `readonly` `optional` **retentionMs?**: `number`

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:136](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/durable-operation.ts#L136)

Terminal record retention used by `prune()`. Defaults to one day.

***

### prunePageSize?

> `readonly` `optional` **prunePageSize?**: `number`

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:138](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/durable-operation.ts#L138)

Page size used by a backend's bounded `listPage()` scan.

***

### maxPrunePages?

> `readonly` `optional` **maxPrunePages?**: `number`

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:140](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/durable-operation.ts#L140)

Maximum pages per prune call. Defaults to 1,000; use Infinity explicitly for trusted stores.

***

### createIncarnation?

> `readonly` `optional` **createIncarnation?**: () => `string`

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:142](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/durable-operation.ts#L142)

Injectable globally unique incarnation generator for deterministic tests or host policy.

#### Returns

`string`
