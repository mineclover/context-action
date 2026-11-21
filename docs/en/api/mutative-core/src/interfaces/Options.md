[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/mutative-core/src](../README.md) / Options

# Interface: Options\<O, F\>

Defined in: [packages/mutative-core/src/interface.ts:197](https://github.com/mineclover/context-action/blob/main/packages/mutative-core/src/interface.ts#L197)

## Type Parameters

### Generic type O

`O` *extends* [`PatchesOptions`](../type-aliases/PatchesOptions.md)

### Generic type F

`F` *extends* `boolean`

## Properties

### strict?

> `optional` **strict?**: `boolean`

Defined in: [packages/mutative-core/src/interface.ts:206](https://github.com/mineclover/context-action/blob/main/packages/mutative-core/src/interface.ts#L206)

In strict mode, reading an object that cannot be drafted from a draft,
such as a class instance that no mark makes draftable, or a value that
`mark` makes mutable, throws unless the read happens inside `unsafe()`.
A value returned with `rawReturn()` is still searched for drafts, which
development builds report with a warning. Development builds also warn
once when a recipe leaves 1,000 or more drafts unchanged.

***

### enablePatches?

> `optional` **enablePatches?**: `O`

Defined in: [packages/mutative-core/src/interface.ts:211](https://github.com/mineclover/context-action/blob/main/packages/mutative-core/src/interface.ts#L211)

Generate patches: the result is then
`[state, patches, inversePatches]`.

***

### enableAutoFreeze?

> `optional` **enableAutoFreeze?**: `F`

Defined in: [packages/mutative-core/src/interface.ts:216](https://github.com/mineclover/context-action/blob/main/packages/mutative-core/src/interface.ts#L216)

Freeze the next state deeply, also the parts that it shares with the base
state. Development builds also throw for an object that holds itself.

***

### mark?

> `optional` **mark?**: `Mark`\<`O`, `F`\> \| `Mark`\<`O`, `F`\>[]

Defined in: [packages/mutative-core/src/interface.ts:224](https://github.com/mineclover/context-action/blob/main/packages/mutative-core/src/interface.ts#L224)

Decide how values are drafted: a mark returns `immutable` to make a value
draftable, such as a class instance, `mutable` to keep it out of drafts so
that the recipe changes it in place, or a function that returns a shallow
copy of the value, which needs patches and auto-freeze off. With several
marks, the first one that returns a value decides.
