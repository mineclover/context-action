# @context-action/mutative

Mutative-backed immutable update, history, undo, and redo utilities for the
Context-Action framework.

## Installation

```bash
pnpm add @context-action/mutative
```

The package uses the maintained `@context-action/mutative-core` runtime
internally. Install the core package directly only when the upstream-compatible
Mutative API is needed without the Context-Action adapter.

## Adapter contract

- `produce(..., { freeze: true })` forwards to the core `enableAutoFreeze`
  option. `strict` is a separate option and rejects non-draft replacement
  values; use `rawReturn()` for an intentional raw replacement.
- `produceWithPatches` returns `[state, patches, inversePatches]`. Set changes
  use a `replace` patch so undo/redo preserves insertion order.
- `deepClone` preserves Map, Set, Date, and RegExp instances while recursively
  cloning their values.
- Time-travel listeners receive the complete history and an optional
  transition-only patch list, which adapters use for precise path updates.
- `createTimeTravel` forwards `enableAutoFreeze`, `strict`, and
  `patchesOptions` to the core runtime. String patch paths are only valid for
  string properties and string `Map` keys; use array paths for numeric or
  object keys and Symbol properties.

## License

Apache-2.0. See [LICENSE](./LICENSE).
