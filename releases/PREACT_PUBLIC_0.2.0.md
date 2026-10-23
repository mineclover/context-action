# Preact Public Preview 0.2.0 Cohort Release Plan

This plan publishes the second public Preact preview cohort. It is independent
from the five-package state-management cohort in `COORDINATED_STABLE_2026_10.md`
and supersedes [`PREACT_PUBLIC_0.1.0.md`](PREACT_PUBLIC_0.1.0.md) for new
candidates. The machine-readable source of truth remains
`preact-public-2026-10.json`.

| Package | Previous | Candidate | Change class |
| --- | --- | --- | --- |
| `@context-action/preact` | `0.1.1` | `0.1.2` | Cohort alignment patch. No runtime or API changes |
| `@context-action/preact-ui` | `0.1.1` | `0.2.0` | Pre-1.0 minor: new public API plus one breaking `expose` rule |

## Publication status

| Evidence | Value |
| --- | --- |
| Release commit | `b7dc6d694dace59d97370da5e275dc87acd70b73` |
| Candidate run | [`39897580951`](https://github.com/mineclover/context-action/actions/runs/39897580951) — success |
| Promotion run | [`39903568673`](https://github.com/mineclover/context-action/actions/runs/39903568673) — success |
| `latest` / `next` | `preact 0.1.2` / `preact-ui 0.2.0` |
| Published consumer smoke | 82 assertions passed from the public registry |

## Why both packages move

The protected candidate workflow publishes the whole cohort with
`--require-all-unpublished`. Republishing an already-published
`@context-action/preact@0.1.1` would fail closed, so the cohort is bumped as a
unit, as the scoped publication remediation requires. `@context-action/preact`
takes a patch because its artifact surface is unchanged.

## Why `@context-action/preact-ui` is a minor

`releases/RELEASE.md` §1 releases breaking changes of pre-1.0 packages at the
next minor boundary. 0.2.0 contains:

- Added: `expose` lifecycle descriptors with typed
  `PreactCustomElementConstructor<Input, Expose>`, a root-entry
  `createElementFacade` / `ImperativeHandleFactory` for React-free hosts,
  `createCustomElementBridge` `createHandle`, and the `PublicActionMethods`,
  `ExposeContract`, and `ReservedElementKey` types.
- Breaking: `expose` may not redefine reserved element members. This is
  rejected at compile time and at construction time with a `TypeError`.
- Fix: pre-upgrade `upgradeProperties` values replay through prototype setters
  instead of shadowing them.

The package CHANGELOG has the full list and the migration notes.

## Publication contract

Dependencies require this order:

1. `@context-action/preact@0.1.2` (depends on `@context-action/core@^1.2.6`).
2. `@context-action/preact-ui@0.2.0` (depends on `@context-action/preact@^0.1.2`).

Publish only through `publish-preact-public-candidate.yml` (to `next`) from one
immutable `main` commit, then promote with `promote-preact-public.yml`
(`PROMOTE_PREACT_PUBLIC`). Local `npm publish`, direct `npm dist-tag`, and
publishing from a mutable working tree are not release paths.

## Required evidence

Run before dispatching the candidate workflow:

```sh
pnpm verify:preact-public-release -- --require-current-source
pnpm --filter @context-action/preact type-check
pnpm --filter @context-action/preact test
pnpm --filter @context-action/preact-ui type-check
pnpm --filter @context-action/preact-ui test
pnpm --filter @context-action/preact-ui test:native
pnpm --filter @context-action/preact-ui test:browser
pnpm --filter @context-action/preact-ui test:browser:cross
pnpm verify:package-exports
pnpm verify:package-tarballs
pnpm package-boundary:check
```

After the candidate reaches `next`, verify the registry artifacts outside the
workspace with the divergent cohort versions pinned from the plan:

```sh
pnpm verify:preact-consumer-smoke -- --cohort
```

Both packages stay 0.x public previews. API and support changes still require a
later 1.0 stability decision.

## Status

Published on 2026-10-23. `latest` and `next` resolve to `preact@0.1.2` and
`preact-ui@0.2.0`.
