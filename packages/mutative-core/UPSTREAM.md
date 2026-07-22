# Upstream provenance

This package is vendored from the maintained fork:

- Maintained fork: [mineclover/mutative](https://github.com/mineclover/mutative)
- Imported branch: `codex/array-perf`
- Imported commit: [`5fd7d56`](https://github.com/mineclover/mutative/commit/5fd7d56b3f88185ef26908df055a9a27be9a2b88)
- Original project: [unadlib/mutative](https://github.com/unadlib/mutative)

Carried upstream references:

- [PR #166](https://github.com/unadlib/mutative/pull/166)
- [Issue #160](https://github.com/unadlib/mutative/issues/160)
- [Issue #32](https://github.com/unadlib/mutative/issues/32)

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
