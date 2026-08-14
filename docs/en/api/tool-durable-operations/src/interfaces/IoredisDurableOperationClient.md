[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-durable-operations/src](../README.md) / IoredisDurableOperationClient

# Interface: IoredisDurableOperationClient

Defined in: [packages/tool-durable-operations/src/redis-operation-backend.ts:76](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/redis-operation-backend.ts#L76)

Structural subset of ioredis used by the reference backend.
`eval` and `zrangebylex` use the positional command form exposed by
ioredis, so the bridge translates the framework-neutral options into that
form.

## Methods

### get()

> **get**(`key`): [`DurableOperationRedisMaybePromise`](../type-aliases/DurableOperationRedisMaybePromise.md)\<`string` \| `Uint8Array`&lt;`ArrayBufferLike`&gt; \| `null` \| `undefined`\>

Defined in: [packages/tool-durable-operations/src/redis-operation-backend.ts:77](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/redis-operation-backend.ts#L77)

#### Parameters

##### key

`string`

#### Returns

[`DurableOperationRedisMaybePromise`](../type-aliases/DurableOperationRedisMaybePromise.md)\<`string` \| `Uint8Array`&lt;`ArrayBufferLike`&gt; \| `null` \| `undefined`\>

***

### eval()

> **eval**(`script`, `numberOfKeys`, ...`arguments_`): `unknown`

Defined in: [packages/tool-durable-operations/src/redis-operation-backend.ts:80](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/redis-operation-backend.ts#L80)

#### Parameters

##### script

`string`

##### numberOfKeys

`number`

##### arguments\_

...readonly `string`[]

#### Returns

`unknown`

***

### zrangebylex()

> **zrangebylex**(`key`, `min`, `max`, ...`arguments_`): [`DurableOperationRedisMaybePromise`](../type-aliases/DurableOperationRedisMaybePromise.md)\<readonly `string`[]\>

Defined in: [packages/tool-durable-operations/src/redis-operation-backend.ts:85](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/redis-operation-backend.ts#L85)

#### Parameters

##### key

`string`

##### min

`string`

##### max

`string`

##### arguments\_

...readonly `string`[]

#### Returns

[`DurableOperationRedisMaybePromise`](../type-aliases/DurableOperationRedisMaybePromise.md)\<readonly `string`[]\>
