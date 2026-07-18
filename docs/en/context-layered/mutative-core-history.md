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
| Original project | [`unadlib/mutative`](https://github.com/unadlib/mutative) | Original Mutative implementation and issue history |
| Maintained fork | [`mineclover/mutative`](https://github.com/mineclover/mutative) | Fork used for maintenance and upstream-compatible fixes |
| Imported revision | [`5fd7d56`](https://github.com/mineclover/mutative/commit/5fd7d56b3f88185ef26908df055a9a27be9a2b88) | Revision vendored into `@context-action/mutative-core` |
| Context-Action package | [`packages/mutative-core`](../../../packages/mutative-core/) | Published core package and synchronization boundary |

The imported revision was prepared on 2026-07-18 and includes generated
distributable output so package consumers do not need an install-time build.
The complete provenance is also recorded in the package's
[`UPSTREAM.md`](../../../packages/mutative-core/UPSTREAM.md).

## Upstream work carried forward

- [PR #166](https://github.com/unadlib/mutative/pull/166): lazy array draft
  performance, rollback, species-constructor, and assigned-value fixes.
- [Issue #160](https://github.com/unadlib/mutative/issues/160): nested
  `create()` calls now detach untouched descendants instead of exposing
  references into the original base state.
- [Issue #32](https://github.com/unadlib/mutative/issues/32): `produce` is
  exported as an exact alias of `create` for Immer-style call sites.

The following proposals remain intentionally outside the core package until
their identity and replay semantics are specified:

- [Issue #127](https://github.com/unadlib/mutative/issues/127): `move`/`copy`
  operations.
- [Issue #162](https://github.com/unadlib/mutative/issues/162): splice-specific
  patch representation.
- [Issue #163](https://github.com/unadlib/mutative/issues/163): bundle-size
  reduction follow-up after the array implementation.

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

1. Review new issues and pull requests in the original repository and the
   maintained fork before changing the vendored source.
2. Prefer importing a focused upstream commit over making Context-Action-only
   edits inside `mutative-core`.
3. Record the imported commit in `UPSTREAM.md`, this history, and the package
   changelog.
4. Run core tests and type checks first, then build `@context-action/mutative`,
   and finally run React integration tests.
5. Publish the core package before publishing the adapter package when the
   adapter dependency range changes.
