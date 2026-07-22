# Documentation tooling monorepo boundary

The reusable documentation-management implementations live in
`context-action-documentation-tooling`, the canonical repository for Foundation and sem-doc.
The repository is remote-backed and publishes the packages consumed by this repository. The machine-readable
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

## Published consumer verification

The tooling repository's release workflow validates Foundation tests, sem-doc tests, type checks, package
exports/tarballs, published metadata, and a clean-consumer smoke. This repository consumes the resulting
published versions and verifies its own `source-of-truth:check`, Architecture Governance build/type/test
suite, and package boundary policy. Architecture Governance intentionally reads consumer-owned
`architecture/registry.json`, policy files, and the `core` analysis project, so its integration checks
remain in this repository.

The consumer cutover is complete: `@context-action/sem-foundation-contracts@0.1.1`,
`@context-action/sem-foundation-repository@0.1.1`, and `@context-action/sem-doc@0.2.0` are the published
inputs. Foundation and sem-doc migration copies and the temporary parity/cutover scripts have been
removed. Generated docs, API pages, LLMS output, and the authored registry stay with each consumer
repository. `architecture-governance`, TypeDoc, and LLMS remain consumer-owned and are not part of the
tooling repository's runtime contract.
