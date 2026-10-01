# 2026-10 Coordinated Stable Release Roadmap

This candidate promotes the state-management contract as one protected cohort:

| Package | Candidate | Contract boundary |
| --- | --- | --- |
| `@context-action/core` | `1.2.0` | Dispatch lifecycle traces and explicit transaction metadata |
| `@context-action/mutative` | `0.8.9` | Timeline batches and transition metadata |
| `@context-action/react` | `4.0.0` | Safe manager reads, atomic multi-store transactions, inspector contracts |

The August 2026 Core/React plan remains historical. This plan uses the exact
immutable `release_commit` supplied to the candidate workflow for provenance;
the plan intentionally contains no fabricated source SHA.

The candidate workflow publishes only to `next`, runs the complete release gate,
packed consumer closure, and provenance evidence. The promotion workflow then
checks the same cohort and promotes it to `latest` with a durable rollback
journal.
