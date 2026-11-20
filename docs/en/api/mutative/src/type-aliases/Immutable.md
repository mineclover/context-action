[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/mutative/src](../README.md) / Immutable

# Type Alias: Immutable\<T\>

> **Immutable**&lt;`T`&gt; = `T` *extends* `Primitive` \| `AtomicObject` ? `T` : `T` *extends* `IfAvailable`\<`ReadonlyMap`\<infer K, infer V\>\> ? `ImmutableMap`\<`K`, `V`\> : `T` *extends* `IfAvailable`\<`ReadonlySet`\<infer V\>\> ? `ImmutableSet`&lt;`V`&gt; : `T` *extends* `WeakReferences` ? `T` : `T` *extends* `object` ? `ImmutableObject`&lt;`T`&gt; : `T`

Defined in: [packages/mutative-core/dist/index.d.ts:94](https://github.com/mineclover/context-action/blob/main/packages/mutative-core/dist/index.d.ts#L94)

@context-action/mutative

Mutative-based immutability and time-travel utilities.
Drop-in replacement for Immer with undo/redo capabilities.

## Type Parameters

### Generic type T

Type parameter **T**
