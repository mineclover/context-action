# Mutative Core History and Upstream References

**Status:** Active reference for `@context-action/mutative-core`
**Scope:** source lineage, carried fixes, licensing, and synchronization rules

`@context-action/mutative-core` is the low-level immutable-update engine used by
the Context-Action runtime adapter. It is a maintained, upstream-compatible
package boundary; Context-Action-specific helpers such as time travel remain in
`@context-action/mutative`.

## Lineage

| Stage | Reference | Role |
| --- | --- | --- |
| Original / active upstream | [`unadlib/mutative`](https://github.com/unadlib/mutative) (`v2.0.2`) | Active upstream Mutative implementation |
| Upstream compatibility baseline | `mutative@2.0.2` ([`15caa67b`](https://github.com/unadlib/mutative/commit/15caa67b2a15430d2d981c770bf7821d1beca3fa)) | npm tarball and source `gitHead` captured in `upstream-lock.json` |
| Prior fork lineage (superseded) | [`mineclover/mutative`](https://github.com/mineclover/mutative) ([`5fd7d56`](https://github.com/mineclover/mutative/commit/5fd7d56b3f88185ef26908df055a9a27be9a2b88)) | Initial array/collection fork maintained over `mutative@1.3.0` before `v2.0.2` import |
| Context-Action package | [`packages/mutative-core`](https://github.com/mineclover/context-action/tree/main/packages/mutative-core) | Published core package and synchronization boundary |

Upgrading from the `1.3.0` fork baseline to `mutative@2.0.2` adopted upstream's
native `src/array.ts` implementation, Map/Set freezing and iterator lifetime
fixes, hardened `apply()` prototype checks, and shared-draft finalization fixes
([PR #213](https://github.com/unadlib/mutative/pull/213),
[PR #218](https://github.com/unadlib/mutative/pull/218)). That reduced our
divergent files from 13 to 4 while keeping 24 of 28 `src/` files byte-identical
to upstream.

The acquired upstream `mutative@2.0.2` npm tarball integrity, source-tree
hashes, and local modified/unchanged inventory are recorded in
[`upstream-lock.json`](../../../packages/mutative-core/upstream-lock.json).
The complete provenance is also recorded in the package's
[`UPSTREAM.md`](../../../packages/mutative-core/UPSTREAM.md).

## Context-Action local patch contracts

Three lightweight contracts are intentionally preserved on top of `mutative@2.0.2`:

- `produce-alias` (`src/index.ts`): exports `produce` as an exact alias of `create`
  for Immer-style call sites ([Issue #32](https://github.com/unadlib/mutative/issues/32)).
- `nested-create-and-strict-return` (`src/makeCreator.ts`): clones `current(base)`
  with `deepClone` when `create()` receives an outer draft so untouched
  descendants cannot mutate the outer base ([Issue #160](https://github.com/unadlib/mutative/issues/160)),
  and keeps `strict: true` non-draft return rejection when `rawReturn()` is not used.
- `set-order-and-lossless-paths` (`src/patch.ts`, `src/utils/draft.ts`): keeps
  whole-`Set` `replace` patches so undo/redo restores insertion order, and
  enforces fail-closed `pathAsArray: false` path checks in both dev and
  production builds.

## Context-Action adapter contract

`@context-action/mutative` is the Context-Action-facing adapter and forwards
the core behavior instead of maintaining a second immutable-update engine:

- `produce(..., { freeze: true })` maps to core `enableAutoFreeze`; `strict` is
  forwarded independently and rejects non-draft replacement values.
- `produceWithPatches` returns the core tuple
  `[state, patches, inversePatches]`. Set updates use a `replace` patch so
  undo/redo preserves insertion order.
- `createTimeTravel` forwards `enableAutoFreeze`, `strict`, and
  `patchesOptions`. String patch paths are valid only for string properties and
  string `Map` keys. Numeric/object `Map` keys and Symbol properties require
  array paths and otherwise fail explicitly.
- Time-travel listeners expose transition-only patches separately from the
  complete history so React path subscriptions do not replay historical
  patches on every update.
- `enableAutoFreeze` freezes object, array, Map, and Set shells and blocks their
  normal mutators. Direct prototype calls such as
  `Map.prototype.set.call(map, value)` remain a JavaScript collection escape
  hatch.

## Licensing and attribution

The vendored core remains **MIT-licensed**, matching the Mutative source. The
Context-Action adapter is separately licensed under Apache-2.0 and depends on
the core package rather than relabeling or rewriting the upstream license.
Keep [`packages/mutative-core/LICENSE`](../../../packages/mutative-core/LICENSE)
and the upstream references with every source synchronization.

## Synchronization policy

1. Review new issues and pull requests in [`unadlib/mutative`](https://github.com/unadlib/mutative)
   before changing the vendored source.
2. Prefer importing a verified upstream release over making Context-Action-only
   edits inside `mutative-core`.
3. Record the imported release in `UPSTREAM.md`, `upstream-sync.json`, this
   history, and the package changelog.
4. Run core tests and type checks first, then build `@context-action/mutative`,
   and finally run React integration tests.
5. Publish the core package before publishing the adapter package when the
   adapter dependency range changes.

Run the synchronization verifier before any release:

```bash
pnpm verify:mutative-upstream
```

The verifier downloads the exact upstream tarball, validates its SHA-512
integrity and every `src` file hash, then compares the local fork against the
committed lock inventory. It is read-only; never overwrite vendored source
automatically. Review an inventory candidate with `--inventory`, commit the
updated lock and provenance, and rerun `--check`. The upstream baseline
`2.0.2`, Mutative Core `0.8.14`, and scoped adapter `0.8.15` are separate
release contracts.
