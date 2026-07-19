# Changelog

## 0.1.1

- Include `@ataraxy-labs/sem@0.21.0` as a runtime dependency so a clean npm install
  provides the default `sem` executable required by work-context and context-scope commands.

## Unreleased

- Moved sem-doc into `context-action/packages/sem-doc` as a private workspace package for the PoC.
- Renamed the private workspace package from `@tsdoc-edge/sem-doc` to `@context-action/sem-doc`; the source path and CLI binary remain unchanged.
- Deferred publish/release integration until the serialized symbol snapshot contract stabilizes.

- Updated the work-context contract to `sem-doc-work-context.v4` with bounded-hop symbols,
  complete affected-test evidence, dependent usage files, and aggregate sem budgets.
- Added exact sem entity binding validation, native Git diff provenance, and scoped benchmarks.
- Added optional `@context-action/sem-foundation-contracts`/`@context-action/sem-foundation-repository` compatibility adapters,
  aggregate timeout/output budgets, symlink-aware revision checks, and package artifact verification.
- Locked the CLI `version`, help, and JSON work-context paths to the current contract.
- Pinned `@ataraxy-labs/sem@0.21.0` for reproducible development and POC verification.
- Removed the `tsdoc-edge` compatibility copy; this repository is now the sole sem-doc source.

## 0.1.0

- Initial standalone sem-doc package.
- Added sem-backed work-context composition with typed advisory contracts.
- Added native Git-based diff reporting with revision and stale-read guards.
