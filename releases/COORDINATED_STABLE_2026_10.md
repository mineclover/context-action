# 2026-10 Coordinated Stable Release Roadmap

This candidate promotes the state-management contract as one protected cohort:

| Package | Candidate | Contract boundary |
| --- | --- | --- |
| `@context-action/core` | `1.2.5` | Freshly attested Core contract for the product-stability cohort |
| `@context-action/store-core` | `0.1.2` | Freshly attested framework-neutral state and timeline contracts |
| `@context-action/mutative-core` | `0.8.13` | Maintained upstream `mutative@1.3.0` baseline and fork inventory |
| `@context-action/mutative` | `0.8.14` | Defensive WeakMap/WeakSet snapshots and adapter patch contracts |
| `@context-action/react` | `4.0.6` | Backend notification reliability and self-contained consumer declarations |

This is the follow-up product-stability cohort after the published
`1.2.4/0.1.1/0.8.12/0.8.13/4.0.5` release. The five packages are reissued
together so dependency floors, provenance, and packed consumer evidence all
refer to one immutable source commit.

The August 2026 Core/React plan remains historical. This plan uses the exact
immutable `release_commit` supplied to the candidate workflow for provenance;
the plan intentionally contains no fabricated source SHA.

The candidate workflow publishes only to `next`, runs the complete release gate,
packed consumer closure, and provenance evidence. The promotion workflow then
checks the same cohort and promotes it to `latest` with a durable rollback
journal.

Publication is serialized in dependency order: Core, Store Core, Mutative Core,
Mutative adapter, then React. The helper refuses a scope list that places a
selected dependency after its consumer. Store Core is the initial registry
publish in this cohort; use the protected token path for that first publication,
then allow the helper to resume only after matching artifact integrity is proven.

The scoped Mutative adapter continues to track the acquired upstream
`mutative@1.3.0` baseline; its maintained `0.8.x` version is independent from
the upstream version.
