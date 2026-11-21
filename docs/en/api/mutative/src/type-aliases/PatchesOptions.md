[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/mutative/src](../README.md) / PatchesOptions

# Type Alias: PatchesOptions

> **PatchesOptions** = `boolean` \| \{ `pathAsArray?`: `boolean`; `arrayLengthAssignment?`: `boolean`; \}

Defined in: [packages/mutative-core/dist/index.d.ts:18](https://github.com/mineclover/context-action/blob/main/packages/mutative-core/dist/index.d.ts#L18)

The `enablePatches` option: `true` or an object generates patches, `false`
does not.

## Union Members

`boolean`

***

### Type Literal

\{ `pathAsArray?`: `boolean`; `arrayLengthAssignment?`: `boolean`; \}

#### pathAsArray?

> `optional` **pathAsArray?**: `boolean`

Whether a patch path is an array of keys, as by default, or a JSON
Pointer string, such as `/list/0`.

#### arrayLengthAssignment?

> `optional` **arrayLengthAssignment?**: `boolean`

Whether an array that gets shorter gets a `replace` patch of its
`length`, as by default, or a `remove` patch for each index that it
loses, as JSON Patch requires.
Recreating holes in a sparse array still uses length patches;
JSON cannot represent holes.
