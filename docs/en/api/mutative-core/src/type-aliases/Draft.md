[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/mutative-core/src](../README.md) / Draft

# Type Alias: Draft\<T\>

> **Draft**&lt;`T`&gt; = `T` *extends* `Primitive` \| `AtomicObject` ? `T` : `T` *extends* `IfAvailable`\<`ReadonlyMap`\<infer K, infer V\>\> ? `DraftedMap`\<`K`, `V`\> : `T` *extends* `IfAvailable`\<`ReadonlySet`\<infer V\>\> ? `DraftedSet`&lt;`V`&gt; : `T` *extends* `WeakReferences` ? `T` : `T` *extends* `object` ? [`DraftedObject`](DraftedObject.md)&lt;`T`&gt; : `T`

Defined in: [packages/mutative-core/src/interface.ts:277](https://github.com/mineclover/context-action/blob/main/packages/mutative-core/src/interface.ts#L277)

The type of a draft of `T`: its objects, arrays, Maps and Sets without
`readonly`, deeply, so that a recipe can change them. Functions, Promises,
dates and regular expressions keep their types.

## Type Parameters

### Generic type T

Type parameter **T**
