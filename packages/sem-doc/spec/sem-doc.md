---
title: sem-doc private workspace specification
type: product-specification
status: active
version: 0.1.0
---

# [[Sem Doc]]

## Purpose

`sem-doc` is a sem-centered analysis tool for answering one question reliably:

> What context does an engineer need before changing this code?

It combines sem's semantic entity graph with TSDoc document definitions/backlinks and a Git-based
change view. It is intentionally independent from `ttsc`'s canonical graph and LSP runtime.

## Ownership and boundaries

| Capability | Owner | Contract |
| --- | --- | --- |
| TypeScript compiler-resolved graph | `ttsc` / `ttsc-graph-router` | canonical graph and provenance |
| Convention and graph lint | `ttsc`-based consumer | policy diagnostics |
| Semantic entity identity, source mapping, and impact/context queries | external `sem` executable | read-only advisory evidence |
| Work context composition | `sem-doc` | `sem-doc-work-context.v4` |
| Documentation definitions/backlinks | `sem-doc` | `sem-documents.v2` exact entity binding index |
| Git file/hunk diff | `sem-doc` | `sem-doc-git-diff.v1` |
| Unsaved overlay and mutating CodeAction | out of scope | no LSP overlay contract |

`sem` output is never silently promoted to a `ttsc` canonical graph violation. A caller may apply a
separate policy after inspecting the advisory envelope.

## Accepted decisions

- [ADR-0001: Use sem-exposed entities without a complete local-scope inventory](decisions/0001-sem-entity-scope-boundary.md)
- [ADR-0002: Limit semantic diff decisions and performance checks to the sem entity boundary](decisions/0002-sem-scoped-diff-and-performance.md)
- [ADR-0003: Bind document checkpoints to exact sem entity provenance](decisions/0003-exact-document-entity-binding.md)

## Normative conventions

- [Document Entity Binding Convention](conventions/document-entity-binding.md)

## Work-context contract

`sem-doc work-context <entity>` returns `sem-doc-work-context.v4` and records:

- sem version and exact command arguments;
- Git HEAD and on-disk working-tree digest;
- the target entity and complete 1-hop or 2-hop symbol inventory;
- the complete affected-test list, separate from hop-labelled symbols unless sem reports a depth;
- a sorted, deduplicated `usageFiles` list from sem-reported dependent entities;
- sem impact/context payloads with provenance;
- TSDoc document definitions and backlinks.

The `--depth` option is restricted to 1 or 2 and is passed to sem `impact --depth` and
`context --hops`. `--budget` limits source excerpts only and must not truncate the symbol inventory.
A truncated sem test list, malformed JSON, invalid range/count, path outside the repository, or
changed repository revision causes an explicit failure.

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

sem `impact --depth` bounds transitive impact traversal. The `depth` reported on
`impact.entities[]` is the authoritative hop value. Direct dependencies and direct dependents are
1-hop relations. The separate affected-test list does not carry a reliable hop and must not be
labelled as 1-hop merely because it appears in the response; a test receives a hop only when the
same entity is present in bounded `impact.entities[]`, otherwise it remains separate affected-test
evidence.

In `sem-doc-work-context.v4`, `symbols.entries[]` contains only entities with a justified hop, while
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

Declared bindings are validated against a revision-pinned sem entity catalog with
`sem-doc docs validate-bindings`. The `sem-doc-binding-validation.v1` report records resolved,
unresolved, and unbound counts plus typed errors. Invalid declared bindings return a non-zero exit
status; document-only unbound checkpoints remain allowed.

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

`pnpm --filter @tsdoc-edge/sem-doc benchmark:scope` measures individual 1-hop and 2-hop work-context, separate 1+2-hop
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
sem-doc work-context <entity> [--file <path>] [--docs-root <path>] [--budget <n>] [--depth <1|2>] [--timeout-ms <n>] [--max-output-bytes <n>] [--no-cache] [--engine-version <version>] [--json]
sem-doc docs index [<docs-root>] [--json]
sem-doc docs validate-bindings [<docs-root>] [--timeout-ms <n>] [--max-output-bytes <n>] [--no-cache] [--json]
sem-doc version
sem-doc diff [<path>...] [--staged] [--no-untracked] [--context <n>] [--json]
sem-doc sem-diff [sem options]
sem-doc <impact|blame|log|entities|context> [sem options]
```

The `SEM_BIN` environment variable selects the sem executable. `sem-doc` has no runtime package
dependency on sem; the executable remains an external engine boundary. The private workspace pins
`@ataraxy-labs/sem` as a development dependency so `pnpm install` obtains a reproducible default
binary, while `SEM_BIN` can override it for another engine build.
When installed as a library, `@sem-foundation/contracts` and `@sem-foundation/repository` are optional
peers. If present, sem-doc reuses their path, entity-ID, and Git revision contracts; without them it
uses the equivalent local fallback so the CLI remains usable without the Foundation packages.

`work-context` and `docs validate-bindings` use a composed default budget of 120 seconds and 64 MiB
of sem output across all subprocesses. `--timeout-ms` and `--max-output-bytes` override those
aggregate limits, up to 1 hour and 1 GiB respectively.

## Quality gates

The private workspace package must pass:

```bash
pnpm --filter @tsdoc-edge/sem-doc typecheck
pnpm --filter @tsdoc-edge/sem-doc verify:boundary
pnpm --filter @tsdoc-edge/sem-doc lint
pnpm --filter @tsdoc-edge/sem-doc build
pnpm --filter @tsdoc-edge/sem-doc verify:pack
pnpm --filter @tsdoc-edge/sem-doc test
pnpm --filter @tsdoc-edge/sem-doc verify:poc
pnpm --filter @tsdoc-edge/sem-doc benchmark:scope
```

The default POC uses the pinned repository binary. Set `SEM_BIN=/path/to/sem` only when validating
another sem build or a locally built executable.

## Migration from tsdoc-edge

`context-action/packages/sem-doc` is the only implementation home for the private PoC. The former
standalone checkout and the original `tsdoc-edge` workspace copy are not source locations. The
legacy AST/document analyzers in `tsdoc-edge` are not deleted by this split; their removal remains
gated by the capability owner matrix and by confirming that documentation/quality enrichment has a
replacement owner.

Foundation package integration is exposed as an optional compatibility boundary; sem-doc remains
usable with its local fallback when the Foundation packages are not installed. History snapshots and
context-set operations are owned by the architecture-governance consumer until the shared packages
are published for standalone installation. Publishing and release automation remain intentionally
deferred while the private workspace PoC is evaluated.
