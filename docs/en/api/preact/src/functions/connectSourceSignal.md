[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/preact/src](../README.md) / connectSourceSignal

# Function: connectSourceSignal()

> **connectSourceSignal**&lt;`T`&gt;(`source`): [`SignalConnection`](../interfaces/SignalConnection.md)&lt;`T`&gt;

Defined in: [packages/preact/src/source-signal.ts:49](https://github.com/mineclover/context-action/blob/main/packages/preact/src/source-signal.ts#L49)

Connect outside render, then dispose with the owning UI/session.

## Type Parameters

### Generic type T

Type parameter **T**

## Parameters

### source

[`ReadableSource`](../interfaces/ReadableSource.md)&lt;`T`&gt;

## Returns

[`SignalConnection`](../interfaces/SignalConnection.md)&lt;`T`&gt;
