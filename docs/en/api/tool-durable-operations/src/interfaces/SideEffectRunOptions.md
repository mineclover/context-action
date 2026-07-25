[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-durable-operations/src](../README.md) / SideEffectRunOptions

# Interface: SideEffectRunOptions\<TResult, TDiagnostic\>

Defined in: [packages/tool-durable-operations/src/side-effect.ts:121](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/side-effect.ts#L121)

## Type Parameters

### TResult

Type parameter **TResult**

### TDiagnostic

`TDiagnostic` = `unknown`

## Properties

### key

> `readonly` **key**: `string`

Defined in: [packages/tool-durable-operations/src/side-effect.ts:122](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/side-effect.ts#L122)

***

### fingerprint

> `readonly` **fingerprint**: `string`

Defined in: [packages/tool-durable-operations/src/side-effect.ts:123](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/side-effect.ts#L123)

***

### leaseMs?

> `readonly` `optional` **leaseMs?**: `number`

Defined in: [packages/tool-durable-operations/src/side-effect.ts:124](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/side-effect.ts#L124)

***

### signal?

> `readonly` `optional` **signal?**: `AbortSignal`

Defined in: [packages/tool-durable-operations/src/side-effect.ts:125](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/side-effect.ts#L125)

***

### abortDiagnostic?

> `readonly` `optional` **abortDiagnostic?**: `TDiagnostic`

Defined in: [packages/tool-durable-operations/src/side-effect.ts:127](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/side-effect.ts#L127)

Optional bounded diagnostic retained when cancellation wins the race.

***

### execute

> `readonly` **execute**: (`context`) => `Promise`\<[`SideEffectOutcome`](../type-aliases/SideEffectOutcome.md)\<`TResult`, `TDiagnostic`\>\>

Defined in: [packages/tool-durable-operations/src/side-effect.ts:128](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/side-effect.ts#L128)

#### Parameters

##### context

[`SideEffectExecutionContext`](SideEffectExecutionContext.md)

#### Returns

`Promise`\<[`SideEffectOutcome`](../type-aliases/SideEffectOutcome.md)\<`TResult`, `TDiagnostic`\>\>

***

### onError?

> `readonly` `optional` **onError?**: (`error`, `context`) => [`SideEffectOutcome`](../type-aliases/SideEffectOutcome.md)\<`TResult`, `TDiagnostic`\> \| `Promise`\<[`SideEffectOutcome`](../type-aliases/SideEffectOutcome.md)\<`TResult`, `TDiagnostic`\>\>

Defined in: [packages/tool-durable-operations/src/side-effect.ts:132](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/side-effect.ts#L132)

Classify a thrown adapter error. The default is `unknown`.

#### Parameters

##### error

`unknown`

##### context

[`SideEffectExecutionContext`](SideEffectExecutionContext.md)

#### Returns

[`SideEffectOutcome`](../type-aliases/SideEffectOutcome.md)\<`TResult`, `TDiagnostic`\> \| `Promise`\<[`SideEffectOutcome`](../type-aliases/SideEffectOutcome.md)\<`TResult`, `TDiagnostic`\>\>
