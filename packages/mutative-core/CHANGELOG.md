# Change Log

## [0.8.11] (2026-10-01)

- Reissue the maintained upstream `mutative@1.3.0` core baseline for the history-entry identity cohort.

## [0.8.10] (2026-10-01)

- Reissue the maintained upstream `mutative@1.3.0` baseline in the coordinated patch cohort without replacing the reviewed fork source.
- Keep the upstream lock, inventory, and regression contract bound to the published core artifact.

## [0.8.9] (2026-10-01)

- Verify the acquired upstream `mutative@1.3.0` source baseline against its npm tarball integrity and file hashes.
- Ship upstream provenance, the reviewed patch inventory, and synchronization instructions with the core artifact.
- Preserve the maintained lazy-array, nested-draft isolation, Set replay order, Map/Symbol path, and strict/unsafe regression fixes.
- Keep scoped versions independent from upstream versions; no runtime source replacement occurs in this patch.

## [0.8.8] (2026-07-19)

- Vendored the maintained `mineclover/mutative` core into a standalone
  `@context-action/mutative-core` package.
- Includes [upstream PR #166](https://github.com/unadlib/mutative/pull/166)
  array lazy-draft performance and follow-up fixes.
- Includes the nested `create()` isolation fix from [upstream issue #160](https://github.com/unadlib/mutative/issues/160).
- Exposes `produce` as an exact alias of `create` from [upstream issue #32](https://github.com/unadlib/mutative/issues/32).
- Preserves `Set` insertion order through inverse patch replay.
- Rejects lossy string paths for non-string `Map` keys and `Symbol` properties.
- Restores nested `unsafe()` scopes and enforces strict-mode raw-return semantics.
- Freezes `Map` and `Set` shells after installing their throwing mutators.
