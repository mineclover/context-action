[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-durable-operations/src](../README.md) / NodeRedisDurableOperationClient

# Interface: NodeRedisDurableOperationClient

Defined in: [packages/tool-durable-operations/src/redis-operation-backend.ts:45](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/redis-operation-backend.ts#L45)

Structural subset of the node-redis v5 client used by the reference
backend. Keeping this type structural avoids a runtime dependency on the
driver while still providing a ready-to-use bridge for applications that
already use node-redis.

## Methods

### get()

> **get**(`key`): [`DurableOperationRedisMaybePromise`](../type-aliases/DurableOperationRedisMaybePromise.md)\<`string` \| `Uint8Array`&lt;`ArrayBufferLike`&gt; \| `null` \| `undefined`\>

Defined in: [packages/tool-durable-operations/src/redis-operation-backend.ts:46](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/redis-operation-backend.ts#L46)

#### Parameters

##### key

`string`

#### Returns

[`DurableOperationRedisMaybePromise`](../type-aliases/DurableOperationRedisMaybePromise.md)\<`string` \| `Uint8Array`&lt;`ArrayBufferLike`&gt; \| `null` \| `undefined`\>

***

### eval()

> **eval**(`script`, `options`): `unknown`

Defined in: [packages/tool-durable-operations/src/redis-operation-backend.ts:49](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/redis-operation-backend.ts#L49)

#### Parameters

##### script

`string`

##### options

###### keys

`string`[]

###### arguments

`string`[]

#### Returns

`unknown`

***

### zRangeByLex()

> **zRangeByLex**(`key`, `min`, `max`, `options`): [`DurableOperationRedisMaybePromise`](../type-aliases/DurableOperationRedisMaybePromise.md)\<readonly `string`[]\>

Defined in: [packages/tool-durable-operations/src/redis-operation-backend.ts:56](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/redis-operation-backend.ts#L56)

#### Parameters

##### key

`string`

##### min

`string`

##### max

`string`

##### options

###### LIMIT

\{ `offset`: `number`; `count`: `number`; \}

###### LIMIT.offset

`number`

###### LIMIT.count

`number`

#### Returns

[`DurableOperationRedisMaybePromise`](../type-aliases/DurableOperationRedisMaybePromise.md)\<readonly `string`[]\>
