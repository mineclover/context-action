# Documentation tooling monorepo boundary

The reusable documentation-management implementations are being extracted into
`context-action-documentation-tooling` as the proposed canonical repository for Foundation and sem-doc.
It is currently a local scaffold with no configured remote, and the consumer has not switched to package
artifacts. The machine-readable
ownership declaration is [`source-of-truth.json`](../../../../source-of-truth.json).

## Ownership

| Boundary | Remains in `context-action` | Extracted tooling repository |
| --- | --- | --- |
| Product runtime | `core`, `react`, `tool-protocol`, durable operations, examples | — |
| Symbol context | consumer configuration and generated artifacts | Foundation contracts/repository and `sem-doc` |
| Architecture rules | `architecture-governance` implementation, authored `architecture/registry.json`, project policies, product-specific evidence | — (not extracted) |
| API documentation | TypeDoc/VitePress configuration, generated site output, and `typedoc-vitepress-sync` implementation | — (not extracted) |
| LLM documentation | source docs, generated `llmsData` artifacts, and `llms-generator` implementation | — (not extracted) |

`sem-doc` is the operational Symbol Context SSOT. `architecture-governance` remains an experimental,
convention-driven control-plane package; extracting its implementation does not merge its report or
gate contract into sem-doc.

## What SEM owns

SEM's stable boundary is a revision-aware symbol evidence lane, not a runtime call graph or an LSP:

1. `sem` supplies the external entity evidence for a repository revision.
2. Foundation contracts give that evidence deterministic symbol, file, revision, complete-snapshot,
   and diff identities.
3. Foundation repository materializes Git commits, worktrees, and bounded `analysisProjects` inputs.
4. `sem-doc` validates and serializes bounded work contexts, document bindings, operational ContextScope,
   and bounded history/intersection artifacts.
5. Consumer-owned Architecture Governance materializes repository-wide snapshots/history and its
   architecture ContextScope from the same Foundation primitives.

The serialized artifact is the SSOT: a consumer can compare commit `A..Z` or two branch histories
without rerunning an implicit in-memory graph. A one-hop projection is a presentation/collection
boundary; a complete revision snapshot remains the source for later context grouping and intersection.
SEM does not claim exact call counts, runtime behavior, or architecture policy ownership.

## Validation gate before removal

The copied workspace must pass Foundation tests, sem-doc tests, type checks, sem-doc boundary/binding/
pack verification, and a published-consumer smoke test. The consumer additionally runs
`pnpm verify:tooling-consumer`, which packs the local canonical Foundation artifacts and proves that
consumer-owned Architecture Governance can install and use them in an isolated fixture. The
`source-of-truth:check` command in both
repositories also validates package names, paths, owners, and repository URLs. Architecture Governance's current integration
suite intentionally reads consumer-owned `architecture/registry.json`, policy files, and the `core`
analysis project; it is therefore run from the consumer checkout until a package-owned fixture repository
is introduced.

When both worktrees are available locally, `pnpm source-of-truth:parity` hashes every canonical package
file, validates the tooling manifest, and detects code/spec/test drift between the tooling source and the consumer migration copy. Root
`README.md` and `package.json` are excluded because their repository ownership and migration metadata are
intentionally different; the command skips with an explicit message when the sibling tooling checkout is absent.

The tooling repository now contains a prepared release workflow that validates this contract, publishes
Foundation contracts before sem-doc, and runs both published metadata and clean-consumer checks. It is
not invoked until the tooling remote, npm Trusted Publisher or token configuration, and corrected package
versions are intentionally configured.

The current published `@context-action/sem-doc@0.1.2` artifact still emits the older
`sem-doc-work-context.v4` contract, while the local implementation emits v5; this is an observable
legacy-artifact mismatch rather than a consumer code failure. Only after the tooling remote and
published artifact metadata are corrected, the published-consumer smoke passes, and that gate passes, should
`context-action` switch to released or local-tarball dependencies and remove
the duplicated package directories. Generated docs, API pages, LLMS output, and the authored registry
stay with each consumer repository. Until then, `architecture-governance`, TypeDoc, and LLMS remain
consumer-owned and must not be described as extracted tooling.
