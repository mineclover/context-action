# Change Log

## [0.1.3] (2026-10-23)

Candidate patch for the Lit/Lit UI cohort. No runtime or public API changes;
this version keeps the public packages aligned for the `hydrateLit()`
`renderBefore` stabilization in `@context-action/lit-ui`.

## [0.1.2] (2026-10-23)

Published to npm on 2026-10-23. `latest` and `next` resolve to `0.1.2`.

Cohort alignment patch for the Lit/Lit UI cohort. No runtime or public API changes;
the version keeps the public packages aligned for the hydration stabilization
release in `@context-action/lit-ui`.

## [0.1.1] (2026-10-23)

Published to npm on 2026-10-23. `latest` and `next` resolve to `0.1.1`.

Cohort alignment patch for the Lit UI 0.1.1 static-styles hydration fix. The
runtime, exports, and public API are unchanged; this version updates package
documentation and keeps the Lit/Lit UI cohort publishable together.

## [0.1.0] (2026-10-23)

Published to npm on 2026-10-23. `latest` and `next` resolve to `0.1.0`.

### Added

- Initial public release of the Lit ReactiveController adapters.
- `StoreController` with selector projections, custom equality, synchronous
  initial snapshots, connect/disconnect resubscription, and zero-leak teardown.
- `ActionController` with typed dispatches, pending-state coalescing, and
  lifecycle-scoped abort signals.
- `ControllerScope` for deterministic LIFO disposal of ReactiveControllers,
  subscriptions, and cleanup callbacks, including `AggregateError` collection
  and optional auto-dispose on host disconnect.
- Broad Lit 3 peer compatibility (`^3.2.0`) with no runtime React dependency.

### Verification

- Unit, stress, and type-check gates run through `pnpm check:lit`.
- Package exports are verified in ESM and CJS, and the package is included in
  Lerna release versioning and the public package tarball checks.

### Changed

- Tooling updated to tsdown `0.23.1` and Vitest `5.0.5`; TypeScript remains on
  the repository's `6.0.3` baseline.
