[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/preact/src](../README.md) / fromStateReader

# Function: fromStateReader()

> **fromStateReader**&lt;`T`&gt;(`reader`): [`ReadableSource`](../interfaces/ReadableSource.md)&lt;`T`&gt;

Defined in: [packages/preact/src/source-signal.ts:35](https://github.com/mineclover/context-action/blob/main/packages/preact/src/source-signal.ts#L35)

Adapts a snapshot-envelope `StateReader&lt;T&gt;` / `StoreReader&lt;T&gt;` (returning `{ value }`) into a
raw-value `ReadableSource&lt;T&gt;` for `connectSourceSignal()`. Explicit adaptation avoids ambiguous
duck-typing when domain states themselves contain a `.value` property.

## Type Parameters

### Generic type T

Type parameter **T**

## Parameters

### reader

[`SnapshotStateReader`](../interfaces/SnapshotStateReader.md)&lt;`T`&gt;

## Returns

[`ReadableSource`](../interfaces/ReadableSource.md)&lt;`T`&gt;
