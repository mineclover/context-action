[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-durable-operations/src](../README.md) / DurableOperationStore

# Interface: DurableOperationStore\<TResult\>

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:149](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/durable-operation.ts#L149)

Application-owned persistence boundary for exactly-once-like mutation
handling. Implementations must make `claim` atomic for a given key.

## Type Parameters

### TResult

`TResult` = `unknown`

## Methods

### claim()

> **claim**(`key`, `fingerprint`, `ownerId`, `options?`): [`DurableOperationClaim`](DurableOperationClaim.md)&lt;`TResult`&gt; \| `Promise`\<[`DurableOperationClaim`](DurableOperationClaim.md)&lt;`TResult`&gt;\>

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:153](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/durable-operation.ts#L153)

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

> **complete**(`key`, `ownerId`, `result`, `expectedFence`): [`DurableOperationRecord`](DurableOperationRecord.md)&lt;`TResult`&gt; \| `Promise`\<[`DurableOperationRecord`](DurableOperationRecord.md)&lt;`TResult`&gt;\>

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:160](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/durable-operation.ts#L160)

#### Parameters

##### key

`string`

##### ownerId

`string`

##### result

Type parameter **TResult**

##### expectedFence

[`DurableOperationFence`](DurableOperationFence.md)

Fence returned by the owning claim.

#### Returns

[`DurableOperationRecord`](DurableOperationRecord.md)&lt;`TResult`&gt; \| `Promise`\<[`DurableOperationRecord`](DurableOperationRecord.md)&lt;`TResult`&gt;\>

***

### fail()

> **fail**(`key`, `ownerId`, `reason`, `result`, `expectedFence`): [`DurableOperationRecord`](DurableOperationRecord.md)&lt;`TResult`&gt; \| `Promise`\<[`DurableOperationRecord`](DurableOperationRecord.md)&lt;`TResult`&gt;\>

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:168](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/durable-operation.ts#L168)

#### Parameters

##### key

`string`

##### ownerId

`string`

##### reason

`string`

##### result

`TResult` \| `undefined`

##### expectedFence

[`DurableOperationFence`](DurableOperationFence.md)

Fence returned by the owning claim.

#### Returns

[`DurableOperationRecord`](DurableOperationRecord.md)&lt;`TResult`&gt; \| `Promise`\<[`DurableOperationRecord`](DurableOperationRecord.md)&lt;`TResult`&gt;\>

***

### markUnknown()

> **markUnknown**(`key`, `ownerId`, `reason`, `result`, `expectedFence`): [`DurableOperationRecord`](DurableOperationRecord.md)&lt;`TResult`&gt; \| `Promise`\<[`DurableOperationRecord`](DurableOperationRecord.md)&lt;`TResult`&gt;\>

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:177](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/durable-operation.ts#L177)

#### Parameters

##### key

`string`

##### ownerId

`string`

##### reason

`string`

##### result

`TResult` \| `undefined`

Optional diagnostic result retained for a later domain resolver.

##### expectedFence

[`DurableOperationFence`](DurableOperationFence.md)

Fence returned by the owning claim.

#### Returns

[`DurableOperationRecord`](DurableOperationRecord.md)&lt;`TResult`&gt; \| `Promise`\<[`DurableOperationRecord`](DurableOperationRecord.md)&lt;`TResult`&gt;\>

***

### resolveUnknown()

> **resolveUnknown**(`key`, `reconcilerId`, `resolution`, `expectedFence`): [`DurableOperationRecord`](DurableOperationRecord.md)&lt;`TResult`&gt; \| `Promise`\<[`DurableOperationRecord`](DurableOperationRecord.md)&lt;`TResult`&gt;\>

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:188](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/durable-operation.ts#L188)

Resolve an `unknown` record after a domain status/reconcile decision.

#### Parameters

##### key

`string`

##### reconcilerId

`string`

##### resolution

[`DurableOperationResolution`](../type-aliases/DurableOperationResolution.md)&lt;`TResult`&gt;

##### expectedFence

[`DurableOperationFence`](DurableOperationFence.md)

Fence observed before the domain reconciliation decision began.

#### Returns

[`DurableOperationRecord`](DurableOperationRecord.md)&lt;`TResult`&gt; \| `Promise`\<[`DurableOperationRecord`](DurableOperationRecord.md)&lt;`TResult`&gt;\>

***

### get()

> **get**(`key`): [`DurableOperationRecord`](DurableOperationRecord.md)&lt;`TResult`&gt; \| `Promise`\<[`DurableOperationRecord`](DurableOperationRecord.md)&lt;`TResult`&gt; \| `undefined`\> \| `undefined`

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:196](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/durable-operation.ts#L196)

#### Parameters

##### key

`string`

#### Returns

[`DurableOperationRecord`](DurableOperationRecord.md)&lt;`TResult`&gt; \| `Promise`\<[`DurableOperationRecord`](DurableOperationRecord.md)&lt;`TResult`&gt; \| `undefined`\> \| `undefined`

***

### prune()

> **prune**(`before?`): `number` \| `Promise`&lt;`number`&gt;

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:202](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/durable-operation.ts#L202)

Remove terminal records older than the configured retention window.

#### Parameters

##### before?

`number`

#### Returns

`number` \| `Promise`&lt;`number`&gt;

## Properties

### fencingCapability

> `readonly` **fencingCapability**: `"context-action/durable-operation-fencing/incarnation-revision-v1"`

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:151](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/durable-operation.ts#L151)

Fail-closed declaration that this store implements the full fence contract.
