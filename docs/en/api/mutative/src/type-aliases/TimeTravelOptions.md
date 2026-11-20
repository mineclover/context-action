[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/mutative/src](../README.md) / TimeTravelOptions

# Type Alias: TimeTravelOptions\<F, A, P\>

> **TimeTravelOptions**\<`F`, `A`, `P`\> = `object` & `Omit`\<`MutativeOptions`\<`true`, `F`\>, `"enablePatches"` \| `"enableAutoFreeze"` \| `"strict"`\>

Defined in: [packages/mutative/src/types.ts:24](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/types.ts#L24)

@context-action/mutative

Mutative-based immutability and time-travel utilities.
Drop-in replacement for Immer with undo/redo capabilities.

## Type Declaration

### maxHistory?

> `optional` **maxHistory?**: `number`

Maximum number of history entries to keep

#### Default

```ts
10
```

### initialPosition?

> `optional` **initialPosition?**: `number`

Initial position in history

#### Default

```ts
0
```

### initialPatches?

> `optional` **initialPatches?**: [`TravelPatches`](TravelPatches.md)&lt;`P`&gt;

Initial patches for restoring history

### autoArchive?

> `optional` **autoArchive?**: `A`

Auto-archive mode - automatically save state changes

#### Default

```ts
true
```

### mutable?

> `optional` **mutable?**: `boolean`

Mutable mode - apply patches in place (for observable state)

#### Default

```ts
false
```

### patchesOptions?

> `optional` **patchesOptions?**: `P`

Patches options for mutative

### enableAutoFreeze?

> `optional` **enableAutoFreeze?**: `F`

Forwarded to @context-action/mutative-core.

### strict?

> `optional` **strict?**: `boolean`

Reject non-draft replacement values in strict mode.

### onListenerError?

> `optional` **onListenerError?**: (`error`) => `void`

Observe listener failures without changing the transition result.

#### Parameters

##### error

`unknown`

#### Returns

`void`

## Type Parameters

### Generic type F

`F` *extends* `boolean` = `false`

### Generic type A

`A` *extends* `boolean` = `true`

### Generic type P

`P` *extends* [`PatchesOption`](PatchesOption.md) = `object`
