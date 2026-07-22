[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-durable-operations/src](../README.md) / HttpSideEffectRunOptions

# Interface: HttpSideEffectRunOptions\<TResult, TDiagnostic\>

Defined in: packages/tool-durable-operations/src/http-side-effect.ts:29

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

Defined in: packages/tool-durable-operations/src/http-side-effect.ts:35

Existing durable runner; this adapter does not create another store.

***

### request

> `readonly` **request**: [`HttpSideEffectRequest`](../type-aliases/HttpSideEffectRequest.md)

Defined in: packages/tool-durable-operations/src/http-side-effect.ts:37

Injected fetch/request function so browser, server, and test transports share the contract.

***

### onResponse

> `readonly` **onResponse**: [`HttpSideEffectResponseHandler`](../type-aliases/HttpSideEffectResponseHandler.md)\<`TResult`, `TDiagnostic`\>

Defined in: packages/tool-durable-operations/src/http-side-effect.ts:39

Provider-specific authoritative response classification.

***

### onError?

> `readonly` `optional` **onError?**: (`error`, `context`) => [`SideEffectOutcome`](../type-aliases/SideEffectOutcome.md)\<`TResult`, `TDiagnostic`\> \| `Promise`\<[`SideEffectOutcome`](../type-aliases/SideEffectOutcome.md)\<`TResult`, `TDiagnostic`\>\>

Defined in: packages/tool-durable-operations/src/http-side-effect.ts:41

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

Defined in: packages/tool-durable-operations/src/side-effect.ts:122

#### Inherited from

`Omit.key`

***

### fingerprint

> `readonly` **fingerprint**: `string`

Defined in: packages/tool-durable-operations/src/side-effect.ts:123

#### Inherited from

`Omit.fingerprint`

***

### leaseMs?

> `readonly` `optional` **leaseMs?**: `number`

Defined in: packages/tool-durable-operations/src/side-effect.ts:124

#### Inherited from

`Omit.leaseMs`

***

### signal?

> `readonly` `optional` **signal?**: `AbortSignal`

Defined in: packages/tool-durable-operations/src/side-effect.ts:125

#### Inherited from

`Omit.signal`

***

### abortDiagnostic?

> `readonly` `optional` **abortDiagnostic?**: `TDiagnostic`

Defined in: packages/tool-durable-operations/src/side-effect.ts:127

Optional bounded diagnostic retained when cancellation wins the race.

#### Inherited from

`Omit.abortDiagnostic`
