---
document_id: context-layered--architecture--documentation-tooling-monorepo
category: context-layered
source_path: en/context-layered/architecture/documentation-tooling-monorepo.md
character_limit: 5000
last_update: '2026-07-22T16:39:29.112Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Documentation tooling monorepo boundary

Documentation tooling monorepo boundary The reusable documentation-management implementations are being extracted into context-action-documentation-tooling as the proposed canonical repository for Foundation and sem-doc. It is currently a local scaffold with no configured remote, and the consumer has not switched to package artifacts. The machine-readable ownership declaration is source-of-truth.json. Ownership | Boundary | Remains in context-action | Extracted tooling repository | | --- | --- | --- | | Product runtime | core, react, tool-protocol, durable operations, examples | — | | Symbol context | consumer configuration and generated artifacts | Foundation contracts/repository and sem-doc | | Architecture rules | architecture-governance implementation, authored architecture/registry.json, project policies, product-specific evidence | — (not extracted) | | API documentation | TypeDoc/VitePress configuration, generated site output, and typedoc-vitepress-sync implementation | — (not extracted) | | LLM documentation | source docs, generated llmsData artifacts, and llms-generator implementation | — (not extracted) | sem-doc is the operational Symbol Context SSOT. architecture-governance remains an experimental, convention-driven control-plane package; extracting its implementation does not merge its report or gate contract into sem-doc. Validation gate before removal The copied workspace must pass Foundation tests, sem-doc tests, type checks, sem-doc boundary/binding/ pack verification, and a published-consumer smoke test. The source-of-truth:check command in both repositories also validates package names, paths, owners, and repository URLs. Architecture Governance's current integration suite intentionally reads consumer-owned architecture/registry.json, policy files, and the core analysis project; it is therefore run from the consumer checkout until a package-owned fixture repository is introduced. Only after the tooling remote and published artifact metadata are corrected, and that gate passes, should context-action switch to released or local-tarball dependencies and remove the duplicated package directories. Generated docs, API pages, LLMS output, and the authored registry stay with each consumer repository. Until then, architecture-governance, TypeDoc, and LLMS remain consumer-owned and must not be described as extracted tooling.