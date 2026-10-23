# Change Log

## [0.1.2] (2026-10-18)

Published to npm on 2026-10-23. `latest` and `next` resolve to `0.1.2`.

### Cohort alignment

- No runtime or API changes. Released with `@context-action/preact-ui@0.2.0`
  because the protected Preact cohort workflow publishes both packages and
  refuses already-published versions.
- README preview status updated; the root entry is now verified to load without
  a `process` global (ESM and CJS) by `pnpm verify:package-exports`.

## [0.1.1] (2026-10-04)

### Documentation & Verification

- Comprehensive README hardening with explicit architectural contracts, fine-grained signal projections, and Context-Layered examples.
- Clarified zero runtime dependency on React or SSR for pure Preact applications.

## [0.1.0] (2026-10-02)

### Public preview

- Publish the first public preview of the Preact dispatch-context and read-only
  Signals adapters.
- Document the host-owned `ActionDispatcher` and `ReadableSource` contracts,
  projection lifecycle, and the separate `@context-action/preact-ui` runtime.

Pre-1.0 releases may change their public API or supported runtime matrix before
the package is promoted to a stable 1.0 contract.
