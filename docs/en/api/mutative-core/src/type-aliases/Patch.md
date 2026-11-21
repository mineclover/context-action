[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/mutative-core/src](../README.md) / Patch

# Type Alias: Patch\<P\>

> **Patch**&lt;`P`&gt; = `P` *extends* `object` ? `IPatch` & `object` : `P` *extends* `true` \| `object` ? `IPatch` & `object` : `IPatch` & `object`

Defined in: [packages/mutative-core/src/interface.ts:110](https://github.com/mineclover/context-action/blob/main/packages/mutative-core/src/interface.ts#L110)

An `add`, `remove` or `replace` operation at a path, as `create()` generates
it with `enablePatches` and `apply()` applies it. The path is an array of
keys, or a JSON Pointer string with `pathAsArray: false`.

## Type Parameters

### Generic type P

`P` *extends* [`PatchesOptions`](PatchesOptions.md) = `any`
