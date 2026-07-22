# Documentation tooling monorepo boundary

The reusable documentation-management implementations are being extracted into the local
`/Users/junwoobang/workflow/context-action-documentation-tooling` scaffold. This is a migration boundary,
not yet a published or remote repository.

## Ownership

| Boundary | Remains in `context-action` | Extracted tooling repository |
| --- | --- | --- |
| Product runtime | `core`, `react`, `tool-protocol`, durable operations, examples | — |
| Symbol context | consumer configuration and generated artifacts | Foundation contracts/repository and `sem-doc` |
| Architecture rules | authored `architecture/registry.json`, project policies, product-specific evidence | `architecture-governance` implementation and schemas |
| API documentation | TypeDoc/VitePress configuration and generated site output | `typedoc-vitepress-sync` implementation |
| LLM documentation | source docs and generated `llmsData` artifacts | `llms-generator` implementation |

`sem-doc` is the operational Symbol Context SSOT. `architecture-governance` remains an experimental,
convention-driven control-plane package; extracting its implementation does not merge its report or
gate contract into sem-doc.

## Validation gate before removal

The copied workspace must pass Foundation tests, sem-doc tests, type checks, sem-doc boundary/binding/
pack verification, and a published-consumer smoke test. Architecture Governance's current integration
suite intentionally reads consumer-owned `architecture/registry.json`, policy files, and the `core`
analysis project; it is therefore run from the consumer checkout until a package-owned fixture repository
is introduced.

Only after that gate should `context-action` switch to released or local-tarball dependencies and remove
the duplicated package directories. Generated docs, API pages, LLMS output, and the authored registry
stay with each consumer repository.
