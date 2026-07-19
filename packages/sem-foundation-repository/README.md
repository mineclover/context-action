# @context-action/sem-foundation-repository

Shared repository runtime primitives for SEM-backed tools.

This package owns the mechanics that must be identical when a tool analyzes current state or a
historical commit:

- bounded Git revision and first-parent range reads;
- detached worktree creation, checkout, and cleanup;
- symbolic Git ref resolution before detached worktree materialization;
- canonical repository/project containment checks;
- generic `analysisProjects` traversal through a callback.

It intentionally does not own SEM execution, architecture registries, document indexes, policy
evaluation, or report schemas. Consumers provide the project analyzer and keep their own evidence
and missing-project policy.

`@context-action/sem-foundation-contracts` supplies the shared `AnalysisProject`, `GitCommitRecord`, and
`RepositoryRevision` data contracts.

`analyzeHistoricalProjects` materializes each requested project in the target commit worktree and
lets the consumer choose the missing-project policy. The architecture-governance consumer skips a
project that does not exist at that revision and records `missing-at-revision` in the symbol snapshot;
the repository runtime itself remains policy-neutral.

`GitHistoryReader.listRange({ maxCommits })` uses 512 commits as its default but accepts a larger
explicit limit. `analyzeHistoricalProjects` accepts the Foundation contract limit options so callers
can raise the shared analysis-project and extension bounds without duplicating validation logic.
