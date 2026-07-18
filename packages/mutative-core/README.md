# @context-action/mutative-core

The Context-Action maintained core implementation of Mutative. It preserves
the upstream Mutative API while carrying the maintained fork fixes from
[`mineclover/mutative`](https://github.com/mineclover/mutative), including lazy
array drafts, nested `create()` isolation, and the `produce` alias.

## Installation

```bash
pnpm add @context-action/mutative-core
```

## Usage

```ts
import { produce } from '@context-action/mutative-core';

const next = produce({ count: 0 }, (draft) => {
  draft.count += 1;
});
```

## Core contracts

- Drafts support plain objects, arrays, `Map`, and `Set`. Unchanged branches
  retain their original references through copy-on-write finalization.
- Pass `enablePatches: true` to receive `[nextState, patches, inversePatches]`.
  Set changes are represented as a `replace` patch so inverse replay preserves
  insertion order.
- The default patch path is an array. A string JSON Pointer path can only
  represent string `Map` keys and string properties; using
  `pathAsArray: false` with numeric/object `Map` keys or Symbol properties
  throws. Use array paths for those keys.
- `strict: true` rejects non-draft replacement values. Use `rawReturn(value)`
  when an intentional raw replacement is required. `unsafe(callback)` is the
  scoped escape hatch for accessing mutable values in strict mode.
- `enableAutoFreeze: true` freezes object, array, `Map`, and `Set` shells and
  blocks their normal mutators. As required by JavaScript collection semantics,
  a direct `Map.prototype.set.call(map, ...)`/`Set.prototype.add.call(...)`
  can still bypass an instance-level guard.

`@context-action/mutative` is the higher-level Context-Action adapter with
patch helpers and time-travel controls. Most application code should use the
adapter; use this package when the upstream-compatible immutable update API is
needed directly.

## Lineage and license

This package contains the MIT-licensed Mutative implementation maintained by
the Context-Action project. See [LICENSE](./LICENSE) and the
[fork changelog](https://github.com/mineclover/mutative/blob/codex/array-perf/CHANGELOG.md)
for the upstream issue and pull-request work carried forward.

The original project is [`unadlib/mutative`](https://github.com/unadlib/mutative);
the maintained source fork is [`mineclover/mutative`](https://github.com/mineclover/mutative).
The exact imported revision is recorded in [UPSTREAM.md](./UPSTREAM.md).
