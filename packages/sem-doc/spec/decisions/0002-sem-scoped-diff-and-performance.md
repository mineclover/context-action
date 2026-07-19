---
semDocumentKind: architecture
---

# ADR-0002: Limit semantic diff decisions and performance checks to the sem entity boundary

- Status: Accepted
- Date: 2026-07-15

## Context

ADR-0001 excludes complete function-local declaration inventories and uses only entities exposed by
sem. Diff classification and performance reporting need the same boundary; otherwise `sem-doc`
would implicitly reintroduce a second AST identity system through another feature.

The native Git diff and sem entity diff serve different purposes. Git can preserve factual file and
hunk evidence for every textual change, while only sem can provide the entity identities used by
the semantic analysis contract.

## Decision

`sem-doc` will apply the following rules:

- Native Git file/hunk output remains factual evidence and does not claim semantic classification.
- A semantic diff decision record contains only changes emitted by sem and parsed as sem entities.
- Each semantic record preserves sem version, command arguments, repository revision, entity
  identity, entity type, definition file/range, and change type when sem provides them.
- A local declaration change that sem does not expose is reported as outside this semantic decision
  boundary, not as an inferred semantic change and not as proof that no semantic change occurred.
- No separate AST/local-scope analyzer will be added to enrich semantic diff records.

Performance checks cover only the paths owned by this boundary:

- 1-hop work-context composition;
- 2-hop work-context composition;
- typed sem entity diff parsing and advisory recording.

The benchmark is observational. It records sample counts, environment, engine mode, and timing
distribution without a machine-dependent wall-clock pass/fail threshold. A fake-sem run measures
adapter/orchestration overhead and must be labelled as such; an engine performance claim requires a
run with `SEM_BIN` pointing to a real sem executable.

## Consequences

Raw Git evidence can remain complete without being confused with a semantic decision. Semantic diff
records and their performance measurements stay aligned with the same sem-owned identity boundary
as work-context.

Performance regressions are reviewed by comparing benchmark records from comparable environments.
If a CI performance gate is introduced later, its workload, runner class, warm-up policy, and
statistical regression rule require a separate accepted decision.
