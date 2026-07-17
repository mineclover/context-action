# Changelog

## Unreleased

- Moved sem-doc into `context-action/packages/sem-doc` as a private workspace package for the PoC.
- Deferred publish/release integration until the serialized symbol snapshot contract stabilizes.

- Updated the work-context contract to `sem-doc-work-context.v4` with bounded-hop symbols,
  complete affected-test evidence, dependent usage files, and aggregate sem budgets.
- Added exact sem entity binding validation, native Git diff provenance, and scoped benchmarks.
- Added optional `@sem-foundation/contracts`/`@sem-foundation/repository` compatibility adapters,
  aggregate timeout/output budgets, symlink-aware revision checks, and package artifact verification.
- Locked the CLI `version`, help, and JSON work-context paths to the current contract.
- Pinned `@ataraxy-labs/sem@0.21.0` for reproducible development and POC verification.
- Removed the `tsdoc-edge` compatibility copy; this repository is now the sole sem-doc source.

## 0.1.0

- Initial standalone sem-doc package.
- Added sem-backed work-context composition with typed advisory contracts.
- Added native Git-based diff reporting with revision and stale-read guards.
