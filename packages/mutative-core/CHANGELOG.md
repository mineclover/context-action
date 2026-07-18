# Changelog

## 0.8.8

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
