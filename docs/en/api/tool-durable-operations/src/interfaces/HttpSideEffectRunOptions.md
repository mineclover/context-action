[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-durable-operations/src](../README.md) / HttpSideEffectRunOptions

# Interface: HttpSideEffectRunOptions\<TResult, TDiagnostic\>

Defined in: [packages/tool-durable-operations/src/http-side-effect.ts:29](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/http-side-effect.ts#L29)

## Extends

- `Omit`\<[`SideEffectRunOptions`](SideEffectRunOptions.md)\<`TResult`, `TDiagnostic`\>, `"execute"` \| `"onError"`\>

## Type Parameters

### TResult

Type parameter **TResult**

### TDiagnostic

`TDiagnostic` = `unknown`

## Properties

### runner

> `readonly` **runner**: [`DurableSideEffectRunner`](DurableSideEffectRunner.md)\<`TResult`, `TDiagnostic`\>

Defined in: [packages/tool-durable-operations/src/http-side-effect.ts:35](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/http-side-effect.ts#L35)

Existing durable runner; this adapter does not create another store.

***

### request

> `readonly` **request**: [`HttpSideEffectRequest`](../type-aliases/HttpSideEffectRequest.md)

Defined in: [packages/tool-durable-operations/src/http-side-effect.ts:37](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/http-side-effect.ts#L37)

Injected fetch/request function so browser, server, and test transports share the contract.

***

### onResponse

> `readonly` **onResponse**: [`HttpSideEffectResponseHandler`](../type-aliases/HttpSideEffectResponseHandler.md)\<`TResult`, `TDiagnostic`\>

Defined in: [packages/tool-durable-operations/src/http-side-effect.ts:39](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/http-side-effect.ts#L39)

Provider-specific authoritative response classification.

***

### onError?

> `readonly` `optional` **onError?**: (`error`, `context`) => [`SideEffectOutcome`](../type-aliases/SideEffectOutcome.md)\<`TResult`, `TDiagnostic`\> \| `Promise`\<[`SideEffectOutcome`](../type-aliases/SideEffectOutcome.md)\<`TResult`, `TDiagnostic`\>\>

Defined in: [packages/tool-durable-operations/src/http-side-effect.ts:41](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/http-side-effect.ts#L41)

Optional classification for errors known to have happened before transmission.

#### Parameters

##### error

`unknown`

##### context

[`SideEffectExecutionContext`](SideEffectExecutionContext.md)

#### Returns

[`SideEffectOutcome`](../type-aliases/SideEffectOutcome.md)\<`TResult`, `TDiagnostic`\> \| `Promise`\<[`SideEffectOutcome`](../type-aliases/SideEffectOutcome.md)\<`TResult`, `TDiagnostic`\>\>

***

### key

> `readonly` **key**: `string`

Defined in: [packages/tool-durable-operations/src/side-effect.ts:124](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/side-effect.ts#L124)

#### Inherited from

`Omit.key`

***

### fingerprint

> `readonly` **fingerprint**: `string`

Defined in: [packages/tool-durable-operations/src/side-effect.ts:125](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/side-effect.ts#L125)

#### Inherited from

`Omit.fingerprint`

***

### leaseMs?

> `readonly` `optional` **leaseMs?**: `number`

Defined in: [packages/tool-durable-operations/src/side-effect.ts:126](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/side-effect.ts#L126)

#### Inherited from

`Omit.leaseMs`

***

### signal?

> `readonly` `optional` **signal?**: `AbortSignal`

Defined in: [packages/tool-durable-operations/src/side-effect.ts:127](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/side-effect.ts#L127)

#### Inherited from

`Omit.signal`

***

### abortDiagnostic?

> `readonly` `optional` **abortDiagnostic?**: `TDiagnostic`

Defined in: [packages/tool-durable-operations/src/side-effect.ts:129](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/side-effect.ts#L129)

Optional bounded diagnostic retained when cancellation wins the race.

#### Inherited from

`Omit.abortDiagnostic`
