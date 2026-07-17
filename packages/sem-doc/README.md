# @tsdoc-edge/sem-doc

`sem-doc` is a private workspace package and sem-centered analysis tool for answering what context
an engineer needs before changing TypeScript code. It combines sem's semantic graph with TSDoc
document links and a revision-pinned Git diff.

The specification is in [spec/sem-doc.md](spec/sem-doc.md).

For a repository-level walkthrough that combines `architecture-governance` and `sem-doc`, see the
[Architecture Governance Usage guide](../../docs/en/context-layered/architecture/architecture-governance-usage.md).

## Scope

- Uses the external `sem` executable as a read-only analysis engine.
- Normalizes sem JSON into versioned `sem-advisory.v1` evidence.
- Provides `sem-doc-work-context.v4` with bounded-hop symbols, a separate complete affected-test
  list, dependent usage files, context, document definitions, and backlinks.
- Uses sem entity IDs to distinguish same-named symbols and preserves their definition file and range.
- Provides `sem-doc-git-diff.v1` with Git status, hunks, additions/deletions, and revision provenance.
- Limits semantic diff decisions to typed changes emitted by sem; native Git hunks remain factual
  evidence rather than semantic classification.
- Keeps sem entity IDs and revisions separate from a `ttsc` canonical graph.
- Exposes `foundationSymbolSnapshotEntry` so parsed entities can be handed to the shared
  `context-action/symbol-snapshot@1.1` serializer without adding an LSP or second AST index.
- Rejects repository-outside paths, stale revisions, malformed JSON, and invalid semantic ranges/counts.
- Does not attempt a complete inventory of function-local functions, constants, variables, or parameters.
- Does not implement an LSP server, unsaved-overlay analysis, or mutating CodeAction.

Sem-derived output is advisory evidence. A caller must make a separate policy decision before
promoting it to a canonical graph or lint violation.

## Install and run

`sem-doc` requires Node.js 24. The private workspace pins the `@ataraxy-labs/sem` development
wrapper to `0.21.0`; the workspace install obtains the matching platform binary. `sem-doc` resolves
that package-local binary by default, even when work-context changes the subprocess cwd to the Git
repository root, and invokes it as an external read-only process. Set `SEM_BIN` only when using a
different binary. Publishing and release automation are intentionally disabled during the PoC.

```bash
pnpm install
pnpm --filter @tsdoc-edge/sem-doc build
pnpm --filter @tsdoc-edge/sem-doc exec node dist/cli.js work-context SemClient --file src/sem-client.ts --docs-root spec --json
pnpm --filter @tsdoc-edge/sem-doc verify:poc
```

To use a different sem executable for the direct CLI commands below, run from the `context-action`
root and set `SEM_BIN` explicitly:

```bash
export SEM_BIN="$PWD/packages/sem-doc/node_modules/.bin/sem"
```

## Git diff

```bash
# HEAD vs working tree, including untracked files
pnpm --filter @tsdoc-edge/sem-doc exec node dist/cli.js diff --json

# Native Git diff for selected paths
pnpm --filter @tsdoc-edge/sem-doc exec node dist/cli.js diff src spec --context 1

# HEAD vs index; untracked files are excluded by default
pnpm --filter @tsdoc-edge/sem-doc exec node dist/cli.js diff --staged --json

# Raw sem semantic diff remains explicit
pnpm --filter @tsdoc-edge/sem-doc exec node dist/cli.js sem-diff --format json
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
pnpm --filter @tsdoc-edge/sem-doc exec node dist/cli.js work-context SemClient --file src/sem-client.ts --docs-root spec

# Direct relationships only
pnpm --filter @tsdoc-edge/sem-doc exec node dist/cli.js work-context SemClient --file src/sem-client.ts --depth 1

# Index TSDoc H1 [[Symbol]] definitions and backlinks
pnpm --filter @tsdoc-edge/sem-doc exec node dist/cli.js docs index spec --json

# Validate declared SSOT bindings against the current sem entity catalog
pnpm --filter @tsdoc-edge/sem-doc exec node dist/cli.js docs validate-bindings spec --json
```

`--depth` accepts only 1 or 2 and is passed to both sem impact traversal and context `--hops`.
`--budget` limits source excerpts, not the complete symbol inventory. Interactive consumers SHOULD
request 2 hops once and derive a 1-hop view with `selectWorkContextHops(report.symbols, 1)` instead
of issuing a second sem query.
The work-context report preserves sem version, exact arguments, Git revision, sem payloads, and
matching document definitions/backlinks.

For conventional static TypeScript imports, sem entity identity and scope resolution are sufficient
for the required source mapping. Named/default/namespace aliases resolve to the original entity ID,
while parameters and local bindings that shadow an import do not resolve to that external entity.
Same-named entities in different files remain distinct because work-context preserves entity ID,
type, definition file, and `startLine`/`endLine`. Exact reference-site line/column tracking is not a
requirement. Dynamic or computed patterns that sem cannot statically resolve are not treated as
guaranteed mappings.

Documents use a unique double-bracket H1 checkpoint for routing and bind it to code through complete
`semEntityId`, `semEntityName`, `semEntityType`, and `semEntityFile` frontmatter. Work-context never
falls back to checkpoint or entity name alone. Missing exact provenance produces `unresolved`, while
incomplete metadata and duplicate checkpoint/entity bindings fail indexing. See
[ADR-0003](spec/decisions/0003-exact-document-entity-binding.md).

The normative rules are in the
[Document Entity Binding Convention](spec/conventions/document-entity-binding.md). Binding
validation emits `sem-doc-binding-validation.v1` and exits non-zero for missing entities, duplicate
entity IDs, or mismatched name/type/file provenance. Document-only checkpoints may remain unbound.

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
pnpm --filter @tsdoc-edge/sem-doc benchmark:scope

# Real sem engine measurement
SEM_BIN=/path/to/sem pnpm --filter @tsdoc-edge/sem-doc benchmark:scope
```

The lane measures individual 1-hop and 2-hop work-context, separate 1+2-hop queries, one shared
2-hop query with a derived 1-hop view, and typed sem entity diff. It records timing distributions and
environment metadata without a wall-clock pass/fail threshold. Fake-sem results must not be
interpreted as real sem engine performance. The diff and benchmark decision is recorded in
[ADR-0002](spec/decisions/0002-sem-scoped-diff-and-performance.md).

## Development and verification

```bash
pnpm --filter @tsdoc-edge/sem-doc typecheck
pnpm --filter @tsdoc-edge/sem-doc verify:boundary
pnpm --filter @tsdoc-edge/sem-doc lint
pnpm --filter @tsdoc-edge/sem-doc build
pnpm --filter @tsdoc-edge/sem-doc verify:pack
pnpm --filter @tsdoc-edge/sem-doc test

# Use the pinned repository binary
pnpm --filter @tsdoc-edge/sem-doc verify:poc

# Or override it with another sem build
SEM_BIN=/path/to/sem pnpm --filter @tsdoc-edge/sem-doc verify:poc
```

`context-action/packages/sem-doc` is the implementation home for the private PoC. The former
standalone checkout and the old `tsdoc-edge` copy are no longer source locations; new sem-doc
features should land in this workspace package first. The package remains excluded from Lerna
release/publish flows until the PoC has a stable external contract.
