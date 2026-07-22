---
title: sem-doc package specification
type: product-specification
status: active
version: 0.1.2
semDocumentKind: architecture
---

# [[Sem Doc]]

## Purpose

`sem-doc` is a sem-centered analysis tool for answering one question reliably:

> What context does an engineer need before changing this code?

It combines sem's semantic entity graph with a TSDoc-style Markdown document convention and a Git-based
change view. It is intentionally independent from any compiler-resolved canonical graph and LSP runtime.

“TSDoc” in this specification names the repository's document convention (`[[Symbol]]` checkpoints and
frontmatter provenance); sem-doc does not depend on or embed the `@microsoft/tsdoc` parser.

## Symbol Context SSOT

Within its problem space, `sem-doc` is the single source of truth for the serialized context needed to
work on a symbol. The canonical artifact is `sem-doc-work-context.v5`; its target entity, bounded symbol
inventory, dependent `usageFiles`, affected tests, SEM provenance, repository revision, and document
definitions/backlinks must be read from that report rather than reconstructed by each consumer.

The related contracts have narrower ownership:

| Contract | SSOT meaning |
| --- | --- |
| `sem-doc-work-context.v5` | symbol-centered work context, bounded structural relationships, and execution provenance |
| `sem-doc-context-scope.v3` | canonical operational context grouping derived from one work-context report (`spec/context-scope.schema.json`) |
| `sem-doc-context-manifest.v1` | explicit multi-anchor context declaration consumed by `context-scope` |
| `sem-doc-context-scope-diff.v1` | deterministic symbol/edge/group delta between two serialized scopes |
| `sem-doc-context-scope-history.v2` | commit-ordered scope snapshots with adjacent diffs and aggregate execution provenance |
| `sem-doc-context-scope-history-stream.v1` | memory-bounded NDJSON base/commit snapshot records |
| `sem-doc-context-scope-branch-compare.v1` | changed-symbol, edge, and group intersection between two histories |
| `sem-documents.v3` | Markdown checkpoint, document classification, exact entity binding, and document backlink index |
| `sem-doc-git-diff.v1` | revision-pinned working-tree or staged file/hunk evidence |

This SSOT boundary is contextual, not architectural. It does not own `CA-*` capability intent, role or
owner declarations, package/impact policy decisions, complete revision snapshots, or public API
signatures. Those remain owned by Architecture Governance, Foundation contracts, or the TypeDoc API
documentation pipeline as described by their respective contracts. sem-doc derives the canonical operational
`sem-doc-context-scope.v3` grouping from one or more work-context reports; that view is not a complete snapshot or
architecture gate.

## Ownership and boundaries

| Capability | Owner | Contract |
| --- | --- | --- |
| TypeScript compiler-resolved graph | external provider | canonical graph and provenance; out of scope for sem-doc |
| Convention and graph lint | separate policy consumer | diagnostics; out of scope for sem-doc |
| Semantic entity identity, source mapping, and impact/context queries | external `sem` executable | read-only advisory evidence |
| Work context composition | `sem-doc` | `sem-doc-work-context.v5` |
| Operational context grouping | `sem-doc` | `sem-doc-context-scope.v3` |
| Documentation definitions/backlinks | `sem-doc` | `sem-documents.v3` classified exact entity binding index |
| Git file/hunk diff | `sem-doc` | `sem-doc-git-diff.v1` |
| Unsaved overlay and mutating CodeAction | out of scope | no LSP overlay contract |

`sem` output is never silently promoted to a compiler-graph violation. A caller may apply a
separate policy after inspecting the advisory envelope.

## Relationship to Architecture Governance

`@context-action/architecture-governance` is a separate consumer with a different purpose and contract.
`sem-doc` owns work-context composition, exact TSDoc entity bindings, and native Git diff evidence for
an implementer or reviewer. sem-doc also owns the canonical operational `sem-doc-context-scope.v3`
grouping view and its serialized-input validator.
Architecture Governance owns the authored `architecture/registry.json`, package/impact policy
verification, complete revision snapshots/history, snapshot diffs, and snapshot-backed `ContextScope`
projections for CI and architecture review.

The packages may reuse `@context-action/sem-foundation-contracts`, `@context-action/sem-foundation-repository`, and the external `sem`
executable, but neither package depends on the other at runtime. `sem-doc-work-context.v5`,
`sem-documents.v3`, and `sem-doc-git-diff.v1` MUST NOT be treated as Architecture Governance
verification-report or snapshot inputs without a separately versioned orchestration contract. Likewise,
the architecture registry is not a TSDoc binding index. See the repository-level
[boundary guide](../../../docs/en/context-layered/architecture/sem-doc-architecture-governance-boundary.md)
for the selection checklist.

`sem-doc-context-scope.v3` is an operational projection over `sem-doc-work-context.v5`. It does not
replace `context-action/context-scope@1.0`, does not claim complete repository inventory, and does not
upgrade SEM `depends-on` evidence into `renders`, `reads`, `writes`, or runtime execution order.
Every scope MUST carry an explicit project ID, source work-context digest, revision provenance, and exact
SEM impact/context argument vectors. Symbol references MUST use canonical project/file/entity values. A
scope with nodes that have no serialized edge evidence MUST be marked `incomplete`; consumers must not
interpret that graph as complete. `complete` scopes MUST NOT contain `reasons`, while `incomplete` scopes
MUST contain at least one reason.
The parser also applies the published collection limits and rejects unknown fields or duplicate identity
entries; consumers should not bypass it when loading a scope from disk or Git history.
When present, `documentEvidence[]` reports document-root, target binding status, checkpoint/backlink
counts, and missing-reference counts. It is intentionally separate from `status`: a complete graph may
still have unresolved documentation, and a resolved document does not make an incomplete graph complete.

## Accepted decisions

- [ADR-0001: Use sem-exposed entities without a complete local-scope inventory](decisions/0001-sem-entity-scope-boundary.md)
- [ADR-0002: Limit semantic diff decisions and performance checks to the sem entity boundary](decisions/0002-sem-scoped-diff-and-performance.md)
- [ADR-0003: Bind document checkpoints to exact sem entity provenance](decisions/0003-exact-document-entity-binding.md)

## Normative conventions

- [Document Entity Binding Convention](conventions/document-entity-binding.md)

## Work-context contract

`sem-doc work-context <entity>` returns `sem-doc-work-context.v5` and records:

- sem version and exact command arguments;
- Git HEAD and on-disk working-tree digest;
- the target entity and complete 1-hop or 2-hop symbol inventory;
- the complete affected-test list, separate from hop-labelled symbols unless sem reports a depth;
- a sorted, deduplicated `usageFiles` list from sem-reported dependent entities;
- sem impact/context payloads with provenance;
- TSDoc document definitions and backlinks.

The `execution` record is immutable report evidence, not the mutable runtime budget. It records the
logical `ownerId`, `phase`, final `state`, configured `timeoutMs` and `maxOutputBytes`, measured
`usedOutputBytes`, and measured `elapsedMs`. A successful report records `state: completed`;
failed or cancelled analyses throw before emitting a misleading successful snapshot.

The `--depth` option is restricted to 1 or 2 and is passed to sem `impact --depth` and
`context --hops`. `--budget` limits source excerpts only and must not truncate the symbol inventory.
A truncated sem test list, malformed JSON, invalid range/count, path outside the repository, or
changed repository revision causes an explicit failure.

`--include-node-modules-surface` is an explicit inclusion policy. When present, sem-doc passes
sem's `--no-default-excludes` to both queries, records that exact flag in request provenance, and
keeps only graph-referenced direct (one-hop) `node_modules` evidence. The flag is intentionally not enabled by
default because sem's include mode is broader than `node_modules` and can expose generated, vendor,
or fixture files. Package-internal rows beyond one hop are removed from all serialized work-context
and derived scope/history artifacts.

### Entity identity and source mapping

`sem-doc` uses the sem entity ID, not the display name, as the primary identity of a code symbol.
Every mapped symbol preserves its sem entity ID, entity type, definition file, and definition
`startLine`/`endLine`. Symbols with the same name remain distinct when their file, type, parent, or
source disambiguator differs.

For conventional static TypeScript imports, sem resolves the imported source, named/default or
namespace alias, and lexical scope before creating a dependency edge. An imported constant used
inside a function therefore maps to the original exported entity even when another entity elsewhere
has the same name. A parameter or local binding that shadows the import must not resolve to the
external entity.

The required contract is definition-source mapping, not exact reference-site mapping. The precise
line and column of every use is out of scope. Dynamic imports, computed property access, and other
patterns that sem cannot resolve statically are not upgraded to guaranteed mappings. A work-context
query whose name is ambiguous must be disambiguated with `--file`; raw sem queries may use the sem
entity ID directly.

### Traversal semantics

The underlying sem CLI defaults to `impact --depth 2`, while `context --hops 0` means unbounded
traversal subject to its token budget. sem-doc deliberately sets its own default `depth` to 2 and
passes that value to both commands, so `sem-doc-work-context.v5` does not inherit sem context's
unbounded default. The explicit `--depth` option remains restricted to 1 or 2.

sem `impact --depth` bounds transitive impact traversal. The `depth` reported on
`impact.entities[]` is the authoritative hop value. Direct dependencies and direct dependents are
1-hop relations. The separate affected-test list does not carry a reliable hop and must not be
labelled as 1-hop merely because it appears in the response; a test receives a hop only when the
same entity is present in bounded `impact.entities[]`, otherwise it remains separate affected-test
evidence.

In `sem-doc-work-context.v5`, `symbols.entries[]` contains only entities with a justified hop, while
`affectedTests.entries[]` preserves the complete deduplicated affected-test list without inventing
distance. `affectedTests.complete` is `true` on success; sem test truncation fails the request.

`usageFiles` contains dependent entity definition files for the target. It is a structural file-level
signal and MUST NOT be interpreted as exact reference locations or a runtime call graph.

Lexical scope depth and containment are not hops. `sem-doc` does not attempt to completely enumerate
functions, constants, variables, or parameters declared inside a function scope; only entities
exposed by sem participate in the symbol inventory.

Interactive consumers that need both views SHOULD request a complete 2-hop inventory once and use
`selectWorkContextHops` to derive the 1-hop subset. A 1-hop view cannot be expanded to 2 hops without
a new sem query. This reuse avoids duplicate impact/context processes while preserving reported hop
evidence.

### Exact document SSOT binding

The double-bracket H1 checkpoint is a unique documentation routing name. It is not used as the code entity
identity and does not need to equal the code symbol name. A document binds that checkpoint to code
with complete frontmatter provenance:

```yaml
---
semDocumentKind: code
semEntityId: src/auth.ts::function::authenticateUser
semEntityName: authenticateUser
semEntityType: function
semEntityFile: src/auth.ts
---
# [[Authentication Entry Point]]
```

All four fields must match the sem target. Work-context does not fall back to `entity.name`; an H1
without the locator remains a valid document checkpoint but produces an `unresolved` code-document
binding. Same-name candidates are reported only as diagnostics. Duplicate checkpoint definitions,
duplicate entity bindings, incomplete metadata, and multiple H1 checkpoints in a bound document are
index errors.

Repository convention classifies documents that explain one implementation symbol as code-backed SSOT
documents with `semDocumentKind: code`. Those documents MUST carry all four fields and SHOULD resolve
in the work-context used by the change. Concept, architecture, process, and tooling guides may remain
document-only; they are not eligible as a symbol's resolved SSOT. `external-reference` documents may
describe a direct dependency surface but MUST NOT claim ownership of a `node_modules` entity.

Declared bindings are validated against a revision-pinned sem entity catalog with
`sem-doc docs validate-bindings`. The `sem-doc-binding-validation.v2` report records strict mode,
classification, resolved, unresolved, and unbound counts plus typed errors. `--strict` requires
`semDocumentKind`, requires exact bindings for `code` documents, and rejects bindings on non-code
documents. Invalid declared bindings return a non-zero exit status; document-only checkpoints remain
allowed when classified as non-code.

## Git diff contract

`sem-doc diff` compares `HEAD` with the working tree by default and returns `sem-doc-git-diff.v1`.
The report contains:

- `scope`: `working-tree` or `staged`;
- revision pin (`gitHead`, working-tree digest);
- tracked status and optional untracked files;
- normalized paths, rename source paths, line hunks, additions, and deletions;
- binary and coarse-precision markers.

`--staged` compares `HEAD` with the index and excludes untracked files by default. `--context` sets
the retained unchanged lines. The service checks the repository revision before and after analysis;
if the repository changes, it rejects the result instead of returning a stale diff.

The Git subprocess buffer defaults to 64 MiB and is capped at 1 GiB. A request may select at most
4,096 repository-relative paths (4,096 characters each), and `--context` accepts 0–4,096 lines.
Files with more than 20,000 combined old/new lines use the declared coarse precision. Direct sem
calls use a 32 MiB default buffer with the same 1 GiB cap.

`sem-doc sem-diff` remains an explicit escape hatch for sem's semantic diff. It is not the native
`sem-doc` diff contract.

### Semantic diff decision boundary

Native Git file and hunk output is factual text-change evidence, not a semantic judgment. A semantic
diff decision record is created only from sem-emitted changes that pass the typed `SemDiffResult`
parser and are stored in a revision- and engine-qualified `sem-advisory.v1` envelope. A change to a
function-local declaration that sem does not expose is outside this decision boundary; `sem-doc`
does not add an AST inference or interpret absence from sem output as proof of no semantic change.

## Scoped performance checks

`pnpm --filter @context-action/sem-doc benchmark:scope` measures individual 1-hop and 2-hop work-context, separate 1+2-hop
queries, a shared 2-hop query with a derived 1-hop view, and typed sem entity diff. It emits
`sem-doc-scope-benchmark.v1` with environment and percentile data. The benchmark is observational
and has no wall-clock pass/fail threshold. Each result records the work-context, document-index, and
advisory contract versions so results from different schemas are not compared as if they measured
identical behavior.

Without `SEM_BIN`, the lane uses fake sem and measures adapter/orchestration overhead. Set
`SEM_BIN=/path/to/sem` to measure the real engine with the same boundary. The initial fake-sem
baseline is recorded in
[`spec/benchmarks/2026-07-15-fake-sem-scope-baseline.json`](benchmarks/2026-07-15-fake-sem-scope-baseline.json).

## CLI contract

```text
sem-doc work-context <entity> [--file <path>] [--docs-root <path>] [--budget <n>] [--depth <1|2>] [--timeout-ms <n>] [--max-output-bytes <n>] [--execution-owner-id <id>] [--include-node-modules-surface] [--no-cache] [--engine-version <version>] [--json]
sem-doc context-scope <entity> [--manifest <path>] [--context-id <id>] [--kind <screen|api|transaction|workflow|document>] [--label <text>] [--project-id <id>] [--file <path>] [--docs-root <path>] [--depth <1|2>] [--max-nodes <n>] [--max-edges <n>] [--max-anchors <n>] [--execution-owner-id <id>] [--include-node-modules-surface] [--json]
sem-doc context-scope-diff <before.json> <after.json> [--json]
sem-doc context-scope-history <from> <to> <entity> --project-id <id> [--file <path>] [--docs-root <path>] [--max-commits <n>] [--aggregate-timeout-ms <n>] [--aggregate-max-output-bytes <n>] [--commit-timeout-ms <n>] [--commit-max-output-bytes <n>] [--execution-owner-id <id>] [--include-node-modules-surface] [--output <path>] [--json]
sem-doc context-scope-compare <left-history.json|ndjson> <right-history.json|ndjson> [--json]
sem-doc docs index [<docs-root>] [--json]
sem-doc docs validate-bindings [<docs-root>] [--timeout-ms <n>] [--max-output-bytes <n>] [--no-cache] [--strict] [--json]
sem-doc version
sem-doc diff [<path>...] [--staged] [--no-untracked] [--context <n>] [--json]
sem-doc sem-diff [sem options]
sem-doc <impact|blame|log|entities|context> [sem options]
```

`context-scope` first obtains the same bounded `sem-doc-work-context.v5` report as `work-context`, then
projects one or more bounded inventories into `sem-doc-context-scope.v3`. The
`kind` value selects the anchor vocabulary (`root`, `endpoint`, `trigger`, `command`, or `definition`)
but does not change SEM semantics. `--max-nodes` and `--max-edges` produce an explicit `incomplete` status
when the operational view cannot include all collected nodes or edges.
`--manifest` loads and validates a repository-relative `sem-doc-context-manifest.v1`; each anchor is
an independent SEM query and all reports must share the same revision and engine version.

`context-scope-history` always materializes a base snapshot at `from`, then analyzes commits in
`from..to`. The base snapshot makes the first commit delta explicit. `timeoutMs` and `maxOutputBytes`
remain compatibility aliases for the aggregate history budget. The aggregate budget is the parent of
each commit budget, so neither the whole range nor an individual commit can exceed its limit.
With `--output`, the report keeps only summary metadata in memory and writes one base record plus one
record per commit to the repository-relative NDJSON path. The writer retains only an entry counter;
consumers should treat the stream as a base record followed by unique commit entries. The current
array-returning reader materializes records; a future incremental reader should be used for very large
branch comparisons.

All commit work-context budgets are children of one aggregate history budget. Child budgets preserve
per-commit limits, while every SEM subprocess charges the same aggregate counters; the history
`execution.usedOutputBytes` is therefore the total observed output for the complete range, not the
largest individual commit.

The symbol collection boundary is intentionally asymmetric. The pinned `sem 0.21.0` scanner excludes
`node_modules` in its default mode. `--include-node-modules-surface` is an explicit opt-in on
`work-context`, `context-scope`, and `context-scope-history`; it passes sem's broad
`--no-default-excludes` flag to make direct package references observable. sem-doc then admits only
one graph hop at the `node_modules` boundary. Transitive package entities are excluded from the
work-context inventory, context content, affected tests, and every serialized ContextScope/history/
branch artifact. The filtered impact total describes the collected view, not discarded package-internal
rows. Markdown collection still skips `node_modules`, `.git`, `dist`, `.test-dist`, and `.reports`.
The exact SEM flag is retained in request provenance so the policy is reproducible and reviewable.

The branch comparison `intersection` is intentionally a changed-set intersection: it reports symbols,
edges, and groups changed in both histories. It does not assert that those identities are members of both
histories' final snapshots. A history request is single-project (`repositoryRoot` plus one entity/file);
the repository foundation's `analysisProjects` traversal is not implicitly enabled by sem-doc.

The `SEM_BIN` environment variable selects the sem executable. `sem-doc` includes the pinned
`@ataraxy-labs/sem` wrapper as a runtime dependency so a published install obtains a reproducible
default binary; the wrapper still executes sem as an external read-only process. `SEM_BIN` can
override it for another engine build.
`@context-action/sem-foundation-contracts` and `@context-action/sem-foundation-repository` are required runtime dependencies:
they own the canonical symbol identity, snapshot entry conversion, and Git revision semantics used
by sem-doc.

`work-context` and `docs validate-bindings` use a composed default budget of 120 seconds and 64 MiB
of sem output across all subprocesses. `--timeout-ms` and `--max-output-bytes` override those
aggregate limits, up to 1 hour and 1 GiB respectively.

## Quality gates

The package must pass:

```bash
pnpm --filter @context-action/sem-doc typecheck
pnpm --filter @context-action/sem-doc verify:boundary
pnpm --filter @context-action/sem-doc lint
pnpm --filter @context-action/sem-doc build
pnpm --filter @context-action/sem-doc verify:pack
pnpm --filter @context-action/sem-doc test
pnpm --filter @context-action/sem-doc verify:poc
pnpm --filter @context-action/sem-doc benchmark:scope
```

The default POC uses the pinned repository binary. Set `SEM_BIN=/path/to/sem` only when validating
another sem build or a locally built executable.

## Migration from tsdoc-edge

`context-action/packages/sem-doc` is the only implementation home for the package. The former
standalone checkout and the original `tsdoc-edge` workspace copy are not source locations. The
legacy AST/document analyzers in `tsdoc-edge` are not deleted by this split; their removal remains
gated by the capability owner matrix and by confirming that documentation/quality enrichment has a
replacement owner.

Foundation integration is a required runtime boundary; sem-doc does not carry a second local
implementation of those contracts. History snapshots and snapshot-backed context-set operations are owned
by the architecture-governance consumer. The operational context grouping in this package is intentionally
bounded to one work-context report and does not replace that revision-level contract.
The tooling workspace does not use Lerna. Its GitHub Actions release workflow publishes the two
`@context-action/sem-foundation-*` runtime dependencies before sem-doc when they are not already
available on the configured registry. The consumer repository's migration copies remain private and
outside `context-action`'s Lerna publish list until the corrected tooling release passes the cutover gates.
