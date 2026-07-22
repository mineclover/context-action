---
document_id: context-layered--package-boundary-convention
category: context-layered
source_path: en/context-layered/package-boundary-convention.md
character_limit: 5000
last_update: '2026-07-22T19:56:24.956Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Package Boundary and Codebase Management Convention

Package Boundary and Codebase Management Convention Status: Active for new work and boundary changes Scope: workspace packages, examples, demos, architecture evidence, and documentation ownership This convention defines how the Context-Action repository is divided into packages and how a change moves through the codebase. The package boundary is an ownership and dependency boundary, not only a folder name. Each package must have one primary responsibility, one public contract, and one clear verification route. 1. Boundary rules 1. A package owns one coherent capability. If a change needs two unrelated responsibilities, split the work or record an architecture decision before adding code. 2. A package may depend on a lower-level package only through its declared package export. Do not import another package through a relative path, src/, dist/, or a test-only alias. 3. package.json is the source of truth for runtime, peer, optional, and development dependencies. A source import without a matching dependency declaration is a boundary defect. 4. exports is the public surface. Files that are not exported are implementation details and must not be used as a cross-package integration point. 5. A package README is a discovery page. The authoritative behavior and architecture contract belongs in one guide under docs/; do not copy a second, diverging specification into a README. 6. dist/, API reference pages, LLMS artifacts, coverage, and generated reports are derived outputs. Change their source and generator, then regenerate them; never make a generated file the canonical implementation. 7. A package boundary change requires a dependency review, focused proof, and documentation ownership update in the same change. A file move alone is not a completed migration. 2. Current package map The following map is the current ownership model. It is intentionally small: a new package should be added only when an existing package cannot own the responsibility without violating dependency direction or release needs. | Package | Boundary role | Owns | Must not own | | --- | --- | --- | --- | | @context-action/core | runtime foundation | action pipeline, handler execution, validation contract, core errors | React, tool transports, Zod, browser UI, stores | | @context-action/tool-protocol | transport contract foundation | JSON Schema, Zod action schemas, MCP/provider adapters, tool calls, approval queue, call idempotency/provenance/observability contracts | React rendering, action registry internals, durable persistence, architecture policy | | @context-action/tool-durable-operations | mutation safety foundation | durable operation records, side-effect runner, HTTP/queue adapters, IndexedDB/Redis/PostgreSQL reference backends | provider-neutral tool sc

Key points:
• `core` never depends on `react`.
• `tool-protocol` is framework-neutral and does not depend on `core` or `react`; it owns the provider/tool boundary.
• `tool-durable-operations` is framework-neutral and does not depend on `core`, `react`, or `tool-protocol`; it owns durable mutation recovery and provider side-effect adapters.
• `react` consumes `core` and `mutative`; `mutative` consumes only the lower-level `mutative-core` runtime and does not import React types.
• `mutative-core` remains upstream-compatible and must not depend on Context-Action adapters or React.
• `sem-foundation-repository` consumes contracts, never the reverse.
• `architecture-governance` consumes foundation contracts/repository and SEM; foundation packages do not know
• `architecture-governance` and `sem-doc` are side-by-side consumers with different contracts; neither may
• documentation generators may inspect source and docs, but runtime packages must not depend on generators.
• examples and demos are leaves in the dependency graph. A package must not import an example or demo.
• adapter `freeze` maps to core `enableAutoFreeze`; `strict` remains separate;
• patch consumers must preserve Set `replace` patches and use array paths for
• adapter and time-travel tests must cover these behaviors after core changes.
• stable capability/contract ID and owner;
• scope and explicit non-goals;
• dependency and export changes;
• state/input/output/invariants or schema revision;
• focused tests and documentation route;
• migration and removal conditions for transitional code.
• Remove duplicate implementations only after identifying the canonical owner and adding a re-export or migration
• Keep `utils` local to a package unless the function is a versioned, policy-neutral contract. Shared...