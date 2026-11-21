[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/mutative-core/src](../README.md) / Immutable

# Type Alias: Immutable\<T\>

> **Immutable**&lt;`T`&gt; = `T` *extends* `Primitive` \| `AtomicObject` ? `T` : `T` *extends* `IfAvailable`\<`ReadonlyMap`\<infer K, infer V\>\> ? `ImmutableMap`\<`K`, `V`\> : `T` *extends* `IfAvailable`\<`ReadonlySet`\<infer V\>\> ? `ImmutableSet`&lt;`V`&gt; : `T` *extends* `WeakReferences` ? `T` : `T` *extends* `object` ? `ImmutableObject`&lt;`T`&gt; : `T`

Defined in: [packages/mutative-core/src/interface.ts:251](https://github.com/mineclover/context-action/blob/main/packages/mutative-core/src/interface.ts#L251)

A deeply readonly `T`, the type of a state that `enableAutoFreeze` freezes:
Maps and Sets become `ReadonlyMap` and `ReadonlySet`, and functions,
Promises, dates and regular expressions keep their types.

## Type Parameters

### Generic type T

Type parameter **T**
