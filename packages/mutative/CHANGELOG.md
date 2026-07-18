# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.8.8] (Unreleased)

- Moved the maintained Mutative runtime into `@context-action/mutative-core`.
- The adapter now depends on the workspace core package and no longer requires
  consumers to install the upstream `mutative` package separately.
- `freeze` now forwards to core `enableAutoFreeze`; `strict` remains an
  independent adapter option.
- Time-travel forwards core freeze/strict/patch-path options and preserves Set
  insertion order during undo/redo.
- `deepClone` now preserves Map, Set, Date, and RegExp values instead of
  converting collection instances to empty objects.
- Time-travel listeners now receive transition-only patches separately from
  the complete history; mutable root replacements and Map/Set reset paths are
  handled correctly.

## [0.8.7](https://github.com/mineclover/context-action/compare/v0.8.6...v0.8.7) (2026-07-12)

**Note:** Version bump only for package @context-action/mutative





## [0.8.6](https://github.com/mineclover/context-action/compare/v0.8.5...v0.8.6) (2026-03-27)

**Note:** Version bump only for package @context-action/mutative





## [0.8.5](https://github.com/mineclover/context-action/compare/v0.8.4...v0.8.5) (2026-03-27)


### Features

* Add path-based subscription and TimeTravelStore with major docs cleanup ([9b7d8d2](https://github.com/mineclover/context-action/commit/9b7d8d2f84a65751e477202960e649ad6aa45b01))
* **stores:** Add notificationMode support to TimeTravelStore ([8bc40c3](https://github.com/mineclover/context-action/commit/8bc40c30b8b08bae00547e15bcd5563c23e2553c))
