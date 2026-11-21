# Upstream provenance

This package is vendored from upstream Mutative with Context-Action's minimal compatibility contracts layered on top:

- Original / active upstream source: [unadlib/mutative](https://github.com/unadlib/mutative)
- Active upstream tag: `v2.0.2`
- Upstream compatibility baseline: `mutative@2.0.2`
- Upstream registry gitHead: [`15caa67b2a15430d2d981c770bf7821d1beca3fa`](https://github.com/unadlib/mutative/commit/15caa67b2a15430d2d981c770bf7821d1beca3fa)
- Prior fork lineage (superseded by `v2.0.2`): [mineclover/mutative](https://github.com/mineclover/mutative) branch `codex/array-perf` commit [`5fd7d56`](https://github.com/mineclover/mutative/commit/5fd7d56b3f88185ef26908df055a9a27be9a2b88) over `mutative@1.3.0` (`01945e3274e9730706799e4d432c22248a6bdeb1`)

Carried Context-Action patch contracts on top of `mutative@2.0.2` (24 of 28 `src/` files are byte-identical to upstream):

- `produce-alias` (`src/index.ts`): re-export `create as produce` for Immer-style call sites ([Issue #32](https://github.com/unadlib/mutative/issues/32)).
- `nested-create-and-strict-return` (`src/makeCreator.ts`): `deepClone(current(base))` on nested draft inputs to isolate untouched descendants ([Issue #160](https://github.com/unadlib/mutative/issues/160)), plus explicit `strict: true` non-draft return rejection without `rawReturn()`.
- `set-order-and-lossless-paths` (`src/patch.ts`, `src/utils/draft.ts`): whole-`Set` `replace` patches to preserve insertion order across undo/redo, and unconditional fail-closed `pathAsArray: false` validation across development and production builds.

The implementation remains MIT-licensed. Keep this file and `LICENSE` with
future source synchronizations so downstream package archives retain the
provenance of the vendored core.

## Maintenance contract

- `@context-action/mutative-core` is a maintained fork, not a temporary copy.
- Upstream synchronization is reviewed manually and recorded here before a
  release; Context-Action-specific fixes must include regression tests.
- `@context-action/mutative` is the supported adapter and may add patch,
  history, and time-travel behavior without changing the upstream-compatible
  core contract.
- Keep the two package versions aligned unless a release note explicitly
  explains why the adapter and core diverge.
- Track the baseline and every Context-Action patch contract in
  [`upstream-sync.json`](./upstream-sync.json). Run
  `pnpm verify:mutative-upstream` before synchronizing or publishing.
- The upstream baseline version and the scoped adapter version are separate
  contracts. The adapter stays on the maintained `0.8.x` patch line unless a
  separate breaking release plan promotes both packages.
