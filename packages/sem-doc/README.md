# @context-action/sem-doc

`sem-doc` is a publishable sem-centered analysis tool for answering what context
an engineer needs before changing TypeScript code. It combines sem's semantic graph with a TSDoc-style
Markdown document convention and a revision-pinned Git diff.

The package identity is `@context-action/sem-doc`. The former `@tsdoc-edge/sem-doc` name is retained
only in the changelog as migration history.

The specification is in [spec/sem-doc.md](spec/sem-doc.md).

`sem-doc` is not the `@context-action/architecture-governance` registry or verification gate. The two
packages may share SEM/Foundation primitives but keep independent report contracts and runtime
dependencies. Use the [boundary guide](../../docs/en/context-layered/architecture/sem-doc-architecture-governance-boundary.md)
to choose the right tool; the [Architecture Governance Usage guide](../../docs/en/context-layered/architecture/architecture-governance-usage.md)
only documents the side-by-side workflow.

In that split, `sem-doc` is the operational Context Plane: it resolves symbols, work context, document
bindings, and Git change evidence. It does not author or evaluate the Context-Action architecture convention;
that experimental control-plane responsibility belongs to `architecture-governance`.

## Symbol Context SSOT

`sem-doc-work-context.v4` is the SSOT for a symbol-centered work context: target identity, bounded
relationships, dependent files, affected tests, SEM provenance, Git revision, and document
definitions/backlinks. Consumers should reuse this serialized report instead of issuing duplicate
impact/context queries or rebuilding document bindings.

This does not make sem-doc the architecture registry or API documentation source. Capability intent,
owner/role evidence, package policy, complete snapshots, and history belong to
`@context-action/architecture-governance`; signatures and public API pages remain in the TypeDoc
pipeline. sem-doc emits the canonical operational `sem-doc-context-scope.v2` projection for
implementer-facing grouping. It is derived from one work-context report and is not a replacement for the
revision-bound, snapshot-backed Architecture Governance `ContextScope` contract.

## ContextScope projection

`context-scope` maps the bounded work-context inventory into a deterministic context grouping. The result
keeps the canonical `projectId`/`filePath`/`entityId` identity, includes context and project groups,
records the exact work-context request provenance, and records SEM dependency evidence. A project ID is
required so serialized scopes remain interoperable with snapshot and commit-diff consumers. If the bounded
inventory contains symbols without corresponding edge evidence, the scope is emitted as `incomplete` with
`disconnected-nodes`; it is intentionally structural and does not infer render, read, write, runtime
order, or call-graph semantics.

The scope also carries a SHA-256 digest of the source work-context, the exact SEM impact/context
argument vectors, and aggregate execution provenance (`timeoutMs`, `maxOutputBytes`, and
`usedOutputBytes`). `parseContextScope` strictly rejects unknown fields, duplicate entries, oversized
collections, non-canonical symbol paths, missing revision provenance, and contradictory completion status
before a consumer uses the artifact.

For a screen, API, transaction, or workflow composed from more than one entry point, pass a
`sem-doc-context-manifest.v1` file with `--manifest`. The resulting scope keeps one context bubble,
multiple typed anchors, and a `source.workContexts` provenance item for every anchor. `context-scope-diff`
compares two serialized scopes by symbol, edge, and group identity. `context-scope-history` materializes
the same scope at each bounded Git commit and stores adjacent diffs; historical worktrees are removed
after each analysis. History collection can use `--output <path>` to write snapshots as NDJSON instead
of retaining every commit in memory. `--aggregate-*` controls the whole range, while `--commit-*`
controls each individual commit; both budgets are enforced together.

The pinned `sem 0.21.0` scanner excludes `node_modules` in its default mode. sem-doc keeps that
safe default unless `--include-node-modules-surface` is explicitly supplied to `work-context`,
`context-scope`, or `context-scope-history`. The option passes sem's `--no-default-excludes` to
the underlying impact/context queries so graph-referenced package files can actually be observed;
sem-doc then projects only the graph-referenced direct one-hop `node_modules` surface and discards
deeper package internals before work-context, scope, history, or branch-intersection artifacts are
serialized.
Because sem's flag is intentionally broad (it can also expose generated/vendor/fixture files),
the option is an explicit review-time policy, not a new default. Markdown indexing still skips
`node_modules`, build output, and repository metadata directories.

```bash
pnpm --filter @context-action/sem-doc exec node dist/cli.js context-scope \
  Dashboard --file src/Dashboard.tsx --context-id dashboard --kind screen --project-id example --max-anchors 64 --json

pnpm --filter @context-action/sem-doc exec node dist/cli.js context-scope-diff before.json after.json --json
pnpm --filter @context-action/sem-doc exec node dist/cli.js context-scope-history HEAD~10 HEAD Dashboard \
  --project-id example --file src/Dashboard.tsx --aggregate-max-output-bytes 268435456 \
  --commit-max-output-bytes 33554432 --output managed/history.ndjson --json
pnpm --filter @context-action/sem-doc exec node dist/cli.js context-scope-compare \
  managed/left-history.ndjson managed/right-history.ndjson --json
```

Use this projection to prepare a visual scope or review context. Use Architecture Governance when the
scope must be bound to a complete revision snapshot, manifest digest, and CI/reviewer gate.

## Scope

- Uses the external `sem` executable as a read-only analysis engine.
- Normalizes sem JSON into versioned `sem-advisory.v1` evidence.
- Provides `sem-doc-work-context.v4` with bounded-hop symbols, a separate complete affected-test
  list, dependent usage files, context, document definitions, and backlinks.
- Provides `sem-doc-context-scope.v2` as the canonical operational grouping view over one or more work-context reports.
- Includes separate `documentEvidence[]` in ContextScope so document binding readiness is visible without
  conflating it with graph completeness.
- Provides `sem-doc-context-manifest.v1`, ContextScope snapshot diffs, and bounded Git-history scope materialization.
- Provides `sem-doc-context-scope-history-stream.v1` NDJSON output and branch changed-symbol intersections.
- Exposes `parseContextScope` so JSON scopes loaded from Git history or another process are validated before
  graph/diff consumers use them.
- Publishes the machine-readable contract at [`spec/context-scope.schema.json`](spec/context-scope.schema.json).
- Publishes companion [`context-manifest.schema.json`](spec/context-manifest.schema.json),
  [`context-scope-diff.schema.json`](spec/context-scope-diff.schema.json),
  [`context-scope-history.schema.json`](spec/context-scope-history.schema.json),
  [`context-scope-history-stream.schema.json`](spec/context-scope-history-stream.schema.json), and
  [`context-scope-branch-compare.schema.json`](spec/context-scope-branch-compare.schema.json) contracts.
- Uses sem entity IDs to distinguish same-named symbols and preserves their definition file and range.
- Provides `sem-doc-git-diff.v1` with Git status, hunks, additions/deletions, and revision provenance.
- Limits semantic diff decisions to typed changes emitted by sem; native Git hunks remain factual
  evidence rather than semantic classification.
- Keeps sem entity IDs and revisions separate from any compiler-resolved canonical graph.
- Exposes `foundationSymbolSnapshotEntry` so parsed entities can be handed to the shared
  `context-action/symbol-snapshot@1.1` serializer without adding an LSP or second AST index. The
  conversion is delegated to the required canonical `@sem-foundation/contracts`
  `createSymbolSnapshotEntry` primitive.
- Rejects repository-outside paths, stale revisions, malformed JSON, and invalid semantic ranges/counts.
- Does not attempt a complete inventory of function-local functions, constants, variables, or parameters.
- Does not embed the `@microsoft/tsdoc` parser; document bindings use the package's Markdown/frontmatter
  convention.
- Does not implement an LSP server, unsaved-overlay analysis, or mutating CodeAction.

Sem-derived output is advisory evidence. A caller must make a separate policy decision before
promoting it to a canonical graph or lint violation.

## Install and run

`sem-doc` requires Node.js 24. The package pins the `@ataraxy-labs/sem` development
wrapper to `0.21.0`; the workspace install obtains the matching platform binary. `sem-doc` also
requires `@sem-foundation/contracts` and `@sem-foundation/repository` at runtime for canonical symbol
and Git revision contracts. It resolves the package-local binary by default, even when work-context
changes the subprocess cwd to the Git repository root, and invokes it as an external read-only
process. Set `SEM_BIN` only when using a different binary. The package is included in the repository's
Lerna publish flow; publish `@sem-foundation/contracts` and `@sem-foundation/repository` before
publishing sem-doc when those foundation packages are not already available on the registry.

```bash
pnpm install
pnpm --filter @context-action/sem-doc build
pnpm --filter @context-action/sem-doc exec node dist/cli.js work-context SemClient --file src/sem-client.ts --docs-root spec --json
pnpm --filter @context-action/sem-doc verify:poc
```

To use a different sem executable for the direct CLI commands below, run from the `context-action`
root and set `SEM_BIN` explicitly:

```bash
export SEM_BIN="$PWD/packages/sem-doc/node_modules/.bin/sem"
```

## Git diff

```bash
# HEAD vs working tree, including untracked files
pnpm --filter @context-action/sem-doc exec node dist/cli.js diff --json

# Native Git diff for selected paths
pnpm --filter @context-action/sem-doc exec node dist/cli.js diff src spec --context 1

# HEAD vs index; untracked files are excluded by default
pnpm --filter @context-action/sem-doc exec node dist/cli.js diff --staged --json

# Raw sem semantic diff remains explicit
pnpm --filter @context-action/sem-doc exec node dist/cli.js sem-diff --format json
```

`sem-doc diff` records the Git HEAD, an on-disk working-tree digest, file status, hunks, and
addition/deletion counts. Binary files are reported without text parsing. Very large text files use
a coarse prefix/suffix diff and declare that precision. The service checks the repository revision
before and after analysis and rejects a stale result.

The subprocess buffer defaults to 64 MiB for Git and 32 MiB for direct sem calls; both are bounded
by a 1 GiB safety maximum. Git request paths are limited to 4,096 entries (4,096 characters each)
and hunk context to 4,096 lines; files with more than 20,000 combined old/new lines use the
declared coarse diff path. Work-context timeout/output options use the same 1 hour/1 GiB maximum
and retain the aggregate budget across version, impact, and context calls.

## Work context

```bash
# Complete 2-hop symbol inventory, token-budgeted context, and document backlinks
pnpm --filter @context-action/sem-doc exec node dist/cli.js work-context SemClient --file src/sem-client.ts --docs-root spec

# Direct relationships only
pnpm --filter @context-action/sem-doc exec node dist/cli.js work-context SemClient --file src/sem-client.ts --depth 1

# Explicitly include the direct node_modules surface (package internals remain bounded to one hop)
pnpm --filter @context-action/sem-doc exec node dist/cli.js work-context SemClient \
  --file src/sem-client.ts --include-node-modules-surface --json

# Index TSDoc H1 [[Symbol]] definitions and backlinks
pnpm --filter @context-action/sem-doc exec node dist/cli.js docs index spec --json

# Validate classified SSOT bindings against the current sem entity catalog
pnpm --filter @context-action/sem-doc exec node dist/cli.js docs validate-bindings spec --strict --json
```

`--depth` accepts only 1 or 2 and is passed to both sem impact traversal and context `--hops`.
The underlying sem CLI defaults to impact depth 2 but context hops 0 (unbounded, token-budgeted);
sem-doc deliberately overrides both through its own default depth 2 so work-context collection is
bounded and reproducible.
`--budget` limits source excerpts, not the complete symbol inventory. Interactive consumers SHOULD
request 2 hops once and derive a 1-hop view with `selectWorkContextHops(report.symbols, 1)` instead
of issuing a second sem query.
The work-context report preserves sem version, exact arguments, Git revision, sem payloads, and
matching document definitions/backlinks.

`--include-node-modules-surface` is deliberately opt-in. It is recorded in the exact SEM argument
provenance (`--no-default-excludes`) and therefore remains visible in serialized scopes and history
snapshots. The one-hop projection is a collection boundary, not a claim that every file in a package
was analyzed; use the repository-level entity snapshot lane when a complete revision inventory is
required.

For conventional static TypeScript imports, sem entity identity and scope resolution are sufficient
for the required source mapping. Named/default/namespace aliases resolve to the original entity ID,
while parameters and local bindings that shadow an import do not resolve to that external entity.
Same-named entities in different files remain distinct because work-context preserves entity ID,
type, definition file, and `startLine`/`endLine`. Exact reference-site line/column tracking is not a
requirement. Dynamic or computed patterns that sem cannot statically resolve are not treated as
guaranteed mappings.

Documents use a unique double-bracket H1 checkpoint for routing and bind it to code through
`semDocumentKind: code`, plus `semEntityId`, `semEntityName`, `semEntityType`, and `semEntityFile`
frontmatter. Work-context never falls back to checkpoint or entity name alone. Missing exact provenance
produces `unresolved`, while incomplete metadata and duplicate checkpoint/entity bindings fail indexing. See
[ADR-0003](spec/decisions/0003-exact-document-entity-binding.md).

The repository convention distinguishes code-backed SSOT documents from conceptual or process guides.
Any document intended to explain one implementation symbol MUST set `semDocumentKind: code`, use the
four binding fields, and resolve in the work-context for that change. Conceptual, architecture,
process, and tooling documents MAY remain document-only; `external-reference` documents may describe
dependency surface evidence but do not own `node_modules` symbols. Use strict binding validation and a
representative work-context run as review evidence.

The normative rules are in the
[Document Entity Binding Convention](spec/conventions/document-entity-binding.md). Binding
validation emits `sem-doc-binding-validation.v2`; `--strict` requires every document to declare a
kind, requires exact bindings for `code` documents, and rejects bindings on non-code documents.
Document-only checkpoints remain allowed when explicitly classified.

The accepted scope boundary is recorded in
[ADR-0001](spec/decisions/0001-sem-entity-scope-boundary.md): work-context uses only entities exposed
by sem and does not add a second AST index to enumerate every declaration inside a function scope.

`--depth` bounds sem's transitive impact traversal; `impact.entities[].depth` is the authoritative
hop. Direct dependencies and dependents are 1-hop. Affected tests are separate evidence and are not
assigned a hop unless the same entity also appears in the bounded impact result.
The same depth bounds sem context collection through `--hops`.

`usageFiles` is the sorted, deduplicated file list of sem-reported dependent entities for the target
symbol. It is a structural file-level signal, not exact reference locations or a runtime call graph.

## Scoped performance benchmark

```bash
# Adapter/orchestration baseline with fake sem
pnpm --filter @context-action/sem-doc benchmark:scope

# Real sem engine measurement
SEM_BIN=/path/to/sem pnpm --filter @context-action/sem-doc benchmark:scope
```

The lane measures individual 1-hop and 2-hop work-context, separate 1+2-hop queries, one shared
2-hop query with a derived 1-hop view, and typed sem entity diff. It records timing distributions and
environment metadata without a wall-clock pass/fail threshold. Fake-sem results must not be
interpreted as real sem engine performance. The diff and benchmark decision is recorded in
[ADR-0002](spec/decisions/0002-sem-scoped-diff-and-performance.md).

## Development and verification

```bash
pnpm --filter @context-action/sem-doc typecheck
pnpm --filter @context-action/sem-doc verify:boundary
pnpm --filter @context-action/sem-doc lint
pnpm --filter @context-action/sem-doc build
pnpm --filter @context-action/sem-doc verify:pack
pnpm --filter @context-action/sem-doc test

# Use the pinned repository binary
pnpm --filter @context-action/sem-doc verify:poc

# Or override it with another sem build
SEM_BIN=/path/to/sem pnpm --filter @context-action/sem-doc verify:poc
```

`context-action/packages/sem-doc` is the implementation home for the publishable package. The former
standalone checkout and the old `tsdoc-edge` copy are no longer source locations; new sem-doc
features should land in this workspace package first. The package is included in the Lerna release/
publish flow and keeps `@sem-foundation/*` as explicit runtime dependencies.
