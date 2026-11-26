# Test And Doc Linking

Use this after the scenario structure exists.

## Minimum verification (`S1`–`S6` · `CA-TESTING-CONVENTION-001`)

- `S1` invalid flow blocks submission in Guard and moves focus via Ref
- `S2` valid flow reaches success cleanly through deterministic FSM transitions
- `S3` post-success draft change invalidates stale result
- `S4` mid-flight reset / unmount restores baseline with zero stale timer leaks or `act()` warnings
- `S5` selective subscriptions (`useStorePath(..., { select })`) and fast-lane gestures avoid unnecessary re-renders
- `S6` scoped isolation (`createScopedContext`), controlled sync, `ownership="shared"` DI, and atomic transaction rollback behave deterministically
- optional `@aspectOf` storage failure degrades gracefully (`Promise.allSettled`) without blocking the root view

See [Testing Convention & Scenarios](../../../docs/en/context-layered/testing-convention.md) ([한국어](../../../docs/ko/context-layered/testing-convention.md)).

## Recommended commands

- `pnpm verify:surface-catalog`
- `pnpm convention:check`
- `pnpm docs:check`
- `pnpm verify:quick`
- `pnpm test:canonical-example -- --runInBand`
- `pnpm --dir example type-check`
- `pnpm --dir example build:fast`

## Discoverability checklist

- register source files for the new page and key modules
- update `catalog/repository-surface/example-surface.v1.json` for new canonical routes or demos
- add paired KO/EN docs links (`docs/ko/...` and `docs/en/...`) and regenerate LLMS bundles (`pnpm docs:llms`)
- add docs sidebar entry if a new document was added
- add route discovery from PatternsOverview or a scenario library page
