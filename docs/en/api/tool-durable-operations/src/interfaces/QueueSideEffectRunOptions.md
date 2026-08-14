[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-durable-operations/src](../README.md) / QueueSideEffectRunOptions

# Interface: QueueSideEffectRunOptions\<TMessage, TAcknowledgement, TResult, TDiagnostic\>

Defined in: [packages/tool-durable-operations/src/queue-side-effect.ts:25](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/queue-side-effect.ts#L25)

## Extends

- `Omit`\<[`SideEffectRunOptions`](SideEffectRunOptions.md)\<`TResult`, `TDiagnostic`\>, `"execute"` \| `"onError"`\>

## Type Parameters

### TMessage

Type parameter **TMessage**

### TAcknowledgement

Type parameter **TAcknowledgement**

### TResult

Type parameter **TResult**

### TDiagnostic

`TDiagnostic` = `unknown`

## Properties

### runner

> `readonly` **runner**: [`DurableSideEffectRunner`](DurableSideEffectRunner.md)\<`TResult`, `TDiagnostic`\>

Defined in: [packages/tool-durable-operations/src/queue-side-effect.ts:32](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/queue-side-effect.ts#L32)

Existing durable runner; this bridge does not create another store.

***

### message

> `readonly` **message**: `TMessage`

Defined in: [packages/tool-durable-operations/src/queue-side-effect.ts:34](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/queue-side-effect.ts#L34)

Message passed to the injected queue publisher.

***

### enqueue

> `readonly` **enqueue**: [`QueueSideEffectEnqueue`](../type-aliases/QueueSideEffectEnqueue.md)\<`TMessage`, `TAcknowledgement`\>

Defined in: [packages/tool-durable-operations/src/queue-side-effect.ts:36](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/queue-side-effect.ts#L36)

Queue SDK or transport enqueue function.

***

### onAcknowledgement

> `readonly` **onAcknowledgement**: [`QueueSideEffectAcknowledgementHandler`](../type-aliases/QueueSideEffectAcknowledgementHandler.md)\<`TAcknowledgement`, `TResult`, `TDiagnostic`\>

Defined in: [packages/tool-durable-operations/src/queue-side-effect.ts:38](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/queue-side-effect.ts#L38)

Provider-specific acknowledgement classification.

***

### onError?

> `readonly` `optional` **onError?**: (`error`, `context`) => [`SideEffectOutcome`](../type-aliases/SideEffectOutcome.md)\<`TResult`, `TDiagnostic`\> \| `Promise`\<[`SideEffectOutcome`](../type-aliases/SideEffectOutcome.md)\<`TResult`, `TDiagnostic`\>\>

Defined in: [packages/tool-durable-operations/src/queue-side-effect.ts:44](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/queue-side-effect.ts#L44)

Optional classification for errors known to happen before enqueue.

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
