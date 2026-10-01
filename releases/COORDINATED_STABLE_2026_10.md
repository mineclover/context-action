# 2026-10 Coordinated Stable Release Roadmap

This candidate promotes the state-management contract as one protected cohort:

| Package | Candidate | Contract boundary |
| --- | --- | --- |
| `@context-action/core` | `1.2.3` | Dispatch trace terminal-outcome reliability |
| `@context-action/store-core` | `0.1.0` | Framework-neutral state and timeline backend contracts |
| `@context-action/mutative-core` | `0.8.11` | Upstream 1.3.0 baseline and maintained core inventory |
| `@context-action/mutative` | `0.8.11` | Cancellable timeline batches and replay metadata |
| `@context-action/react` | `4.0.3` | Transaction participant safety and array-path invalidation |

The August 2026 Core/React plan remains historical. This plan uses the exact
immutable `release_commit` supplied to the candidate workflow for provenance;
the plan intentionally contains no fabricated source SHA.

The candidate workflow publishes only to `next`, runs the complete release gate,
packed consumer closure, and provenance evidence. The promotion workflow then
checks the same cohort and promotes it to `latest` with a durable rollback
journal.
