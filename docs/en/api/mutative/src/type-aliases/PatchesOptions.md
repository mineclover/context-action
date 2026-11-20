[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/mutative/src](../README.md) / PatchesOptions

# Type Alias: PatchesOptions

> **PatchesOptions** = `boolean` \| \{ `pathAsArray?`: `boolean`; `arrayLengthAssignment?`: `boolean`; \}

Defined in: [packages/mutative-core/dist/index.d.ts:14](https://github.com/mineclover/context-action/blob/main/packages/mutative-core/dist/index.d.ts#L14)

@context-action/mutative

Mutative-based immutability and time-travel utilities.
Drop-in replacement for Immer with undo/redo capabilities.

## Union Members

`boolean`

***

### Type Literal

\{ `pathAsArray?`: `boolean`; `arrayLengthAssignment?`: `boolean`; \}

#### pathAsArray?

> `optional` **pathAsArray?**: `boolean`

The default value is `true`. If it's `true`, the path will be an array, otherwise it is a string.

#### arrayLengthAssignment?

> `optional` **arrayLengthAssignment?**: `boolean`

The default value is `true`. If it's `true`, the array length will be included in the patches, otherwise no include array length.
