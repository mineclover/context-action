[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-durable-operations/src](../README.md) / DurableOperationBackend

# Interface: DurableOperationBackend\<TResult\>

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:82](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-durable-operations/src/durable-operation.ts#L82)

Minimal atomic persistence primitive required by the reference adapter.
Redis, SQL, IndexedDB, or another backend can implement this with a
conditional insert/update/delete keyed by `revision`.

## Type Parameters

### TResult

`TResult` = `unknown`

## Methods

### read()

> **read**(`key`): `MaybePromise`\<[`DurableOperationRecord`](DurableOperationRecord.md)&lt;`TResult`&gt; \| `undefined`\>

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:83](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-durable-operations/src/durable-operation.ts#L83)

#### Parameters

##### key

`string`

#### Returns

`MaybePromise`\<[`DurableOperationRecord`](DurableOperationRecord.md)&lt;`TResult`&gt; \| `undefined`\>

***

### list()?

> `optional` **list**(): `MaybePromise`\<readonly [`DurableOperationRecord`](DurableOperationRecord.md)&lt;`TResult`&gt;[]\>

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:85](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-durable-operations/src/durable-operation.ts#L85)

Compatibility full scan for small stores. Prefer `listPage` on servers.

#### Returns

`MaybePromise`\<readonly [`DurableOperationRecord`](DurableOperationRecord.md)&lt;`TResult`&gt;[]\>

***

### listPage()?

> `optional` **listPage**(`options?`): `MaybePromise`\<[`DurableOperationListPage`](DurableOperationListPage.md)&lt;`TResult`&gt;\>

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:90](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-durable-operations/src/durable-operation.ts#L90)

Optional bounded scan for server backends. Cursors should be keyset-style
and remain valid while terminal records are deleted during pruning.

#### Parameters

##### options?

[`DurableOperationListOptions`](DurableOperationListOptions.md)

#### Returns

`MaybePromise`\<[`DurableOperationListPage`](DurableOperationListPage.md)&lt;`TResult`&gt;\>

***

### compareAndSet()

> **compareAndSet**(`key`, `expectedRevision`, `next`): `MaybePromise`&lt;`boolean`&gt;

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:93](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-durable-operations/src/durable-operation.ts#L93)

#### Parameters

##### key

`string`

##### expectedRevision

`number` \| `undefined`

##### next

[`DurableOperationRecord`](DurableOperationRecord.md)&lt;`TResult`&gt; \| `undefined`

#### Returns

`MaybePromise`&lt;`boolean`&gt;
