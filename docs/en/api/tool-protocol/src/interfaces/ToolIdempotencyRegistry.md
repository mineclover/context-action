[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / ToolIdempotencyRegistry

# Interface: ToolIdempotencyRegistry\<TResult\>

Defined in: [packages/tool-protocol/src/idempotency.ts:26](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-protocol/src/idempotency.ts#L26)

## Type Parameters

### TResult

`TResult` = `unknown`

## Methods

### claim()

> **claim**(`key`, `fingerprint`, `create`): [`ToolIdempotencyClaim`](ToolIdempotencyClaim.md)&lt;`TResult`&gt;

Defined in: [packages/tool-protocol/src/idempotency.ts:27](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-protocol/src/idempotency.ts#L27)

#### Parameters

##### key

`string`

##### fingerprint

`string`

##### create

() => `Promise`&lt;`TResult`&gt;

#### Returns

[`ToolIdempotencyClaim`](ToolIdempotencyClaim.md)&lt;`TResult`&gt;

***

### clear()

> **clear**(`key?`): `void`

Defined in: [packages/tool-protocol/src/idempotency.ts:32](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-protocol/src/idempotency.ts#L32)

#### Parameters

##### key?

`string`

#### Returns

`void`

## Properties

### size

> `readonly` **size**: `number`

Defined in: [packages/tool-protocol/src/idempotency.ts:33](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-protocol/src/idempotency.ts#L33)
