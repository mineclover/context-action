# @sem-foundation/contracts

Shared, policy-neutral contracts for SEM-backed tools.

This package intentionally does not execute SEM, inspect Git, load architecture registries, or
evaluate boundary policies. It provides the common vocabulary that `@context-action/architecture-governance`
and `@tsdoc-edge/sem-doc` can adapt to independently:

- raw and normalized SEM entity records;
- revision provenance and the shared `sem-advisory.v1` envelope;
- canonical entity ID and symbol suffix helpers;
- repository-relative path normalization.
- project-qualified symbol-set keys and deterministic context intersection results.
- versioned complete `SymbolSnapshot` contracts with revision, project, and source-line provenance.
- optional per-project source extension filters for repositories that keep JSON/config artifacts next to code.

The package is intentionally small enough to publish as a standalone dependency. It does not
publish SEM execution or repository policy; consumers retain those responsibilities. The first
consumer in this workspace is `@context-action/architecture-governance`. `@tsdoc-edge/sem-doc`
uses the same wire contract through an adapter and can load the published helpers as optional
peer dependencies. Git history/worktree mechanics live in the companion `@sem-foundation/repository`
package.

`compareSymbolContexts` performs set comparison on serialized `(projectId, filePath, entityId)`
identity. It reports `intersection`, `onlyLeft`, and `onlyRight` entries without claiming exact
reference locations or runtime call-graph semantics.

`createSymbolSnapshot` is the canonical serializer for one repository revision. It normalizes
repository-relative paths, deduplicates by `(projectId, filePath, entityId)`, rejects conflicting
evidence, records per-project `analyzed`/`skipped` provenance, and sorts entries deterministically.
The current wire contract is `context-action/symbol-snapshot@1.1`; skipped historical projects carry
the reason `missing-at-revision`. `AnalysisProject.fileExtensions` accepts 1–32 unique, normalized
dot-prefixed extensions (each at most 64 characters) when a consumer needs to exclude non-source
artifacts from SEM collection. These are defaults, not an unavoidable API ceiling: trusted callers
can pass `SemFoundationLimitOptions` to normalization and snapshot APIs to raise project, extension,
extension-length, or snapshot-entry limits. The explicit `'unbounded'` value maps to the JavaScript
safe-integer ceiling for trusted in-process callers. Overrides should be paired with the caller's own
process and output budgets.
`diffSymbolSnapshots` compares two complete inventories by the same project-qualified `SymbolRef`
identity (`projectId`, `filePath`, `entityId`) and separates added, removed, and changed source evidence.
Git/SEM execution remains outside this package.

Release checklist:

1. Build and run the contract tests.
2. Pack the package and verify both ESM and CommonJS exports.
3. Publish a versioned contract before adding it as a required dependency to another repository.
