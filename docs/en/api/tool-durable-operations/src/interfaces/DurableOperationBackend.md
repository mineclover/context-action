[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-durable-operations/src](../README.md) / DurableOperationBackend

# Interface: DurableOperationBackend\<TResult\>

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:97](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/durable-operation.ts#L97)

Minimal atomic persistence primitive required by the reference adapter.
Redis, SQL, IndexedDB, or another backend can implement this with a
conditional insert/update/delete keyed by the full incarnation/revision
fence. Comparing only a revision is not sufficient after prune/recreate.

## Type Parameters

### TResult

`TResult` = `unknown`

## Methods

### read()

> **read**(`key`): `MaybePromise`\<[`DurableOperationRecord`](DurableOperationRecord.md)&lt;`TResult`&gt; \| `undefined`\>

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:98](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/durable-operation.ts#L98)

#### Parameters

##### key

`string`

#### Returns

`MaybePromise`\<[`DurableOperationRecord`](DurableOperationRecord.md)&lt;`TResult`&gt; \| `undefined`\>

***

### list()?

> `optional` **list**(): `MaybePromise`\<readonly [`DurableOperationRecord`](DurableOperationRecord.md)&lt;`TResult`&gt;[]\>

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:100](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/durable-operation.ts#L100)

Compatibility full scan for small stores. Prefer `listPage` on servers.

#### Returns

`MaybePromise`\<readonly [`DurableOperationRecord`](DurableOperationRecord.md)&lt;`TResult`&gt;[]\>

***

### listPage()?

> `optional` **listPage**(`options?`): `MaybePromise`\<[`DurableOperationListPage`](DurableOperationListPage.md)&lt;`TResult`&gt;\>

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:105](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/durable-operation.ts#L105)

Optional bounded scan for server backends. Cursors should be keyset-style
and remain valid while terminal records are deleted during pruning.

#### Parameters

##### options?

[`DurableOperationListOptions`](DurableOperationListOptions.md)

#### Returns

`MaybePromise`\<[`DurableOperationListPage`](DurableOperationListPage.md)&lt;`TResult`&gt;\>

***

### compareAndSet()

> **compareAndSet**(`key`, `expectedFence`, `next`): `MaybePromise`&lt;`boolean`&gt;

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:108](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/durable-operation.ts#L108)

#### Parameters

##### key

`string`

##### expectedFence

[`DurableOperationFence`](DurableOperationFence.md) \| `undefined`

`undefined` means insert only when the key is absent.

##### next

[`DurableOperationRecord`](DurableOperationRecord.md)&lt;`TResult`&gt; \| `undefined`

#### Returns

`MaybePromise`&lt;`boolean`&gt;

***

### backfillLegacyIncarnation()?

> `optional` **backfillLegacyIncarnation**(`key`, `expectedRevision`, `incarnation`): `MaybePromise`&lt;`boolean`&gt;

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:121](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/durable-operation.ts#L121)

Optional atomic upgrade for records written before incarnation fencing.
Implementations must update only when the key exists, its revision equals
`expectedRevision`, and its incarnation field is absent.
This upgrades stored data only; hosts must not run pre-fencing writers at
the same time because an old writer can still replace a migrated record.

#### Parameters

##### key

`string`

##### expectedRevision

`number`

##### incarnation

`string`

#### Returns

`MaybePromise`&lt;`boolean`&gt;
