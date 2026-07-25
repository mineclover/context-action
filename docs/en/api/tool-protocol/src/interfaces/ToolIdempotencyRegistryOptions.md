[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / ToolIdempotencyRegistryOptions

# Interface: ToolIdempotencyRegistryOptions

Defined in: [packages/tool-protocol/src/idempotency.ts:12](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-protocol/src/idempotency.ts#L12)

## Properties

### retentionMs?

> `readonly` `optional` **retentionMs?**: `number`

Defined in: [packages/tool-protocol/src/idempotency.ts:14](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-protocol/src/idempotency.ts#L14)

How long a settled entry remains replayable. Defaults to five minutes.

***

### maxEntries?

> `readonly` `optional` **maxEntries?**: `number`

Defined in: [packages/tool-protocol/src/idempotency.ts:16](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-protocol/src/idempotency.ts#L16)

Maximum number of settled logical operations retained. Defaults to 1,000.

***

### now?

> `readonly` `optional` **now?**: () => `number`

Defined in: [packages/tool-protocol/src/idempotency.ts:18](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-protocol/src/idempotency.ts#L18)

Injectable clock for deterministic tests.

#### Returns

`number`
