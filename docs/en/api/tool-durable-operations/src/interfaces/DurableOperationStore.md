[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-durable-operations/src](../README.md) / DurableOperationStore

# Interface: DurableOperationStore\<TResult\>

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:119](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-durable-operations/src/durable-operation.ts#L119)

Application-owned persistence boundary for exactly-once-like mutation
handling. Implementations must make `claim` atomic for a given key.

## Type Parameters

### TResult

`TResult` = `unknown`

## Methods

### claim()

> **claim**(`key`, `fingerprint`, `ownerId`, `options?`): [`DurableOperationClaim`](DurableOperationClaim.md)&lt;`TResult`&gt; \| `Promise`\<[`DurableOperationClaim`](DurableOperationClaim.md)&lt;`TResult`&gt;\>

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:120](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-durable-operations/src/durable-operation.ts#L120)

#### Parameters

##### key

`string`

##### fingerprint

`string`

##### ownerId

`string`

##### options?

[`DurableOperationClaimOptions`](DurableOperationClaimOptions.md)

#### Returns

[`DurableOperationClaim`](DurableOperationClaim.md)&lt;`TResult`&gt; \| `Promise`\<[`DurableOperationClaim`](DurableOperationClaim.md)&lt;`TResult`&gt;\>

***

### complete()

> **complete**(`key`, `ownerId`, `result`): [`DurableOperationRecord`](DurableOperationRecord.md)&lt;`TResult`&gt; \| `Promise`\<[`DurableOperationRecord`](DurableOperationRecord.md)&lt;`TResult`&gt;\>

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:127](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-durable-operations/src/durable-operation.ts#L127)

#### Parameters

##### key

`string`

##### ownerId

`string`

##### result

Type parameter **TResult**

#### Returns

[`DurableOperationRecord`](DurableOperationRecord.md)&lt;`TResult`&gt; \| `Promise`\<[`DurableOperationRecord`](DurableOperationRecord.md)&lt;`TResult`&gt;\>

***

### fail()

> **fail**(`key`, `ownerId`, `reason`, `result?`): [`DurableOperationRecord`](DurableOperationRecord.md)&lt;`TResult`&gt; \| `Promise`\<[`DurableOperationRecord`](DurableOperationRecord.md)&lt;`TResult`&gt;\>

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:133](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-durable-operations/src/durable-operation.ts#L133)

#### Parameters

##### key

`string`

##### ownerId

`string`

##### reason

`string`

##### result?

Type parameter **TResult**

#### Returns

[`DurableOperationRecord`](DurableOperationRecord.md)&lt;`TResult`&gt; \| `Promise`\<[`DurableOperationRecord`](DurableOperationRecord.md)&lt;`TResult`&gt;\>

***

### markUnknown()

> **markUnknown**(`key`, `ownerId`, `reason`, `result?`): [`DurableOperationRecord`](DurableOperationRecord.md)&lt;`TResult`&gt; \| `Promise`\<[`DurableOperationRecord`](DurableOperationRecord.md)&lt;`TResult`&gt;\>

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:140](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-durable-operations/src/durable-operation.ts#L140)

#### Parameters

##### key

`string`

##### ownerId

`string`

##### reason

`string`

##### result?

Type parameter **TResult**

Optional diagnostic result retained for a later domain resolver.

#### Returns

[`DurableOperationRecord`](DurableOperationRecord.md)&lt;`TResult`&gt; \| `Promise`\<[`DurableOperationRecord`](DurableOperationRecord.md)&lt;`TResult`&gt;\>

***

### resolveUnknown()

> **resolveUnknown**(`key`, `reconcilerId`, `resolution`, `expectedRevision?`): [`DurableOperationRecord`](DurableOperationRecord.md)&lt;`TResult`&gt; \| `Promise`\<[`DurableOperationRecord`](DurableOperationRecord.md)&lt;`TResult`&gt;\>

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:149](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-durable-operations/src/durable-operation.ts#L149)

Resolve an `unknown` record after a domain status/reconcile decision.

#### Parameters

##### key

`string`

##### reconcilerId

`string`

##### resolution

[`DurableOperationResolution`](../type-aliases/DurableOperationResolution.md)&lt;`TResult`&gt;

##### expectedRevision?

`number`

#### Returns

[`DurableOperationRecord`](DurableOperationRecord.md)&lt;`TResult`&gt; \| `Promise`\<[`DurableOperationRecord`](DurableOperationRecord.md)&lt;`TResult`&gt;\>

***

### get()

> **get**(`key`): [`DurableOperationRecord`](DurableOperationRecord.md)&lt;`TResult`&gt; \| `Promise`\<[`DurableOperationRecord`](DurableOperationRecord.md)&lt;`TResult`&gt; \| `undefined`\> \| `undefined`

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:156](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-durable-operations/src/durable-operation.ts#L156)

#### Parameters

##### key

`string`

#### Returns

[`DurableOperationRecord`](DurableOperationRecord.md)&lt;`TResult`&gt; \| `Promise`\<[`DurableOperationRecord`](DurableOperationRecord.md)&lt;`TResult`&gt; \| `undefined`\> \| `undefined`

***

### prune()

> **prune**(`before?`): `number` \| `Promise`&lt;`number`&gt;

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:162](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-durable-operations/src/durable-operation.ts#L162)

Remove terminal records older than the configured retention window.

#### Parameters

##### before?

`number`

#### Returns

`number` \| `Promise`&lt;`number`&gt;
