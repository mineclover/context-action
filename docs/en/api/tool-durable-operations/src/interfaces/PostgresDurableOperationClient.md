[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-durable-operations/src](../README.md) / PostgresDurableOperationClient

# Interface: PostgresDurableOperationClient

Defined in: packages/tool-durable-operations/src/postgres-operation-backend.ts:17

The small structural surface required from `pg` or a pool wrapper.

The package intentionally does not depend on `pg`. Applications choose the
pool/client lifecycle, credentials, and transaction instrumentation and
inject only this query boundary.

## Methods

### query()

> **query**&lt;`TRow`&gt;(`text`, `values?`): [`PostgresDurableOperationMaybePromise`](../type-aliases/PostgresDurableOperationMaybePromise.md)\<[`PostgresDurableOperationQueryResult`](PostgresDurableOperationQueryResult.md)&lt;`TRow`&gt;\>

Defined in: packages/tool-durable-operations/src/postgres-operation-backend.ts:18

#### Type Parameters

##### TRow

`TRow` = `Record`\<`string`, `unknown`\>

#### Parameters

##### text

`string`

##### values?

readonly `unknown`[]

#### Returns

[`PostgresDurableOperationMaybePromise`](../type-aliases/PostgresDurableOperationMaybePromise.md)\<[`PostgresDurableOperationQueryResult`](PostgresDurableOperationQueryResult.md)&lt;`TRow`&gt;\>
