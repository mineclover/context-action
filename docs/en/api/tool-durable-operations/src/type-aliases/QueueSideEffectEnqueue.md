[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-durable-operations/src](../README.md) / QueueSideEffectEnqueue

# Type Alias: QueueSideEffectEnqueue\<TMessage, TAcknowledgement\>

> **QueueSideEffectEnqueue**\<`TMessage`, `TAcknowledgement`\> = (`message`, `context`) => `TAcknowledgement` \| `Promise`&lt;`TAcknowledgement`&gt;

Defined in: packages/tool-durable-operations/src/queue-side-effect.ts:10

Injected queue publish/enqueue boundary.

## Type Parameters

### TMessage

Type parameter **TMessage**

### TAcknowledgement

Type parameter **TAcknowledgement**

## Parameters

### message

Type parameter **TMessage**

### context

[`SideEffectExecutionContext`](../interfaces/SideEffectExecutionContext.md)

## Returns

`TAcknowledgement` \| `Promise`&lt;`TAcknowledgement`&gt;
