[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/mutative-core/src](../README.md) / DraftedObject

# Type Alias: DraftedObject\<T\>

> **DraftedObject**&lt;`T`&gt; = `{ -readonly [K in keyof T]: Draft<T[K]> }`

Defined in: [packages/mutative-core/src/interface.ts:268](https://github.com/mineclover/context-action/blob/main/packages/mutative-core/src/interface.ts#L268)

The draft of an object type: writable properties whose values are drafts.

## Type Parameters

### Generic type T

Type parameter **T**
