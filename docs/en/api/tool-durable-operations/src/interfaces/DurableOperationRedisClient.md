[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-durable-operations/src](../README.md) / DurableOperationRedisClient

# Interface: DurableOperationRedisClient

Defined in: [packages/tool-durable-operations/src/redis-operation-backend.ts:23](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/redis-operation-backend.ts#L23)

Small driver-neutral Redis surface.

node-redis and ioredis expose different `eval`/lex-range signatures, so an
application supplies this three-method bridge instead of making this
framework package depend on either client. `rangeByLex` must apply Redis
`ZRANGEBYLEX` semantics and its limit as one command.

## Methods

### get()

> **get**(`key`): [`DurableOperationRedisMaybePromise`](../type-aliases/DurableOperationRedisMaybePromise.md)\<`string` \| `Uint8Array`&lt;`ArrayBufferLike`&gt; \| `null` \| `undefined`\>

Defined in: [packages/tool-durable-operations/src/redis-operation-backend.ts:24](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/redis-operation-backend.ts#L24)

#### Parameters

##### key

`string`

#### Returns

[`DurableOperationRedisMaybePromise`](../type-aliases/DurableOperationRedisMaybePromise.md)\<`string` \| `Uint8Array`&lt;`ArrayBufferLike`&gt; \| `null` \| `undefined`\>

***

### eval()

> **eval**&lt;`TResult`&gt;(`script`, `options`): [`DurableOperationRedisMaybePromise`](../type-aliases/DurableOperationRedisMaybePromise.md)&lt;`TResult`&gt;

Defined in: [packages/tool-durable-operations/src/redis-operation-backend.ts:27](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/redis-operation-backend.ts#L27)

#### Type Parameters

##### TResult

`TResult` = `unknown`

#### Parameters

##### script

`string`

##### options

[`DurableOperationRedisEvalOptions`](DurableOperationRedisEvalOptions.md)

#### Returns

[`DurableOperationRedisMaybePromise`](../type-aliases/DurableOperationRedisMaybePromise.md)&lt;`TResult`&gt;

***

### rangeByLex()

> **rangeByLex**(`key`, `min`, `max`, `limit`): [`DurableOperationRedisMaybePromise`](../type-aliases/DurableOperationRedisMaybePromise.md)\<readonly `string`[]\>

Defined in: [packages/tool-durable-operations/src/redis-operation-backend.ts:31](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/redis-operation-backend.ts#L31)

#### Parameters

##### key

`string`

##### min

`string`

##### max

`string`

##### limit

`number`

#### Returns

[`DurableOperationRedisMaybePromise`](../type-aliases/DurableOperationRedisMaybePromise.md)\<readonly `string`[]\>
