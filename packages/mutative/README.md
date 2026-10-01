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

## Maintenance policy

`@context-action/mutative` and `@context-action/mutative-core` are maintained
fork packages. The core currently tracks the upstream `mutative@1.3.0`
compatibility baseline while preserving Context-Action regression fixes.
Upstream changes are synchronized deliberately and tracked in
[`mutative-core/UPSTREAM.md`](../mutative-core/UPSTREAM.md); adapter-specific
patch, history, and time-travel behavior is kept in this package. The scoped
adapter is currently `0.8.13` and remains on its own `0.8.x` patch line. Run
both package test suites after a fork update.

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
- `createMutativeTimelineBackend()` supports explicit notification holds with
  `beginBatch(..., { deferNotification: true })`; pair each hold with
  `resumeNotifications()` and call `flushNotifications()` to publish it.
- `createTimeTravel` forwards `enableAutoFreeze`, `strict`, and
  `patchesOptions` to the core runtime. String patch paths are only valid for
  string properties and string `Map` keys; use array paths for numeric or
  object keys and Symbol properties.

## License

Apache-2.0. See [LICENSE](./LICENSE).
