---
document_id: context-layered--repository-surface-catalog
category: context-layered
source_path: en/context-layered/repository-surface-catalog.md
character_limit: 5000
last_update: '2026-11-19T21:51:46.224Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Repository Surface Catalog (API, Examples, and Managed Documents)

Repository Surface Catalog (API, Examples, and Managed Documents) Status: Active Spec / Decision ID: CA-SURFACE-CATALOG-001 Owner: Framework Architecture & Documentation Governance Canonical JSON Catalogs: - catalog/repository-surface/api-surface.v1.json - catalog/repository-surface/example-surface.v1.json - catalog/repository-surface/document-surface.v1.json This specification defines the principles, schema standards, and complete inventory for three repository surfaces: 1. Full Repository API Architecture: all 20 workspace packages (packages/), their public exports, workspace dependencies, stability tiers, and TypeDoc coverage. 2. What Examples Explain: all 72 canonical routes across 13 semantic groups in example/, standalone demos (demos/bolt-style-editor, examples/vanilla-js), 7 package-local example suites, and 9 narrative example walkthroughs. 3. Managed Documentation Architecture: all 13 root markdown documents, 13 managed documentation areas with explicit authority and EN/KO pairing policies, and derived TypeDoc/LLMS artifacts. It complements Package Boundary and Codebase Management, Specification, Issue, and Documentation Management, Documentation and Development Management, and ADR CA-SURFACE-CATALOG-001. --- 1. Five Organizing Principles 1. Source-First Non-Duplication: Runtime manifests (packages//package.json), TypeDoc entrypoints (typedoc.json), route registration (example/src/App.tsx), and handwritten guides (docs/{en,ko}/) remain the canonical sources of truth. The surface catalog indexes and cross-validates them without duplicating behavior specs. 2. Explicit Authority vs. Derived Separation: Every managed document is classified as authoritative, discovery, evidence, derived, transitional, or historical. Derived files (docs/api/generated, docs/en/api, api-spec.ts, llmsData, llms-.txt) must be regenerated from source, never edited as canonical specs. 3. Three-Surface Versioned Schema Symmetry: API (api-surface.v1.json), Example (example-surface.v1.json), and Document (document-surface.v1.json) share versioned schemas, stable kebab IDs, bilingual summaries (en / ko), and explicit verification gates. 4. Honest Bilingual Parity Accounting: Directories expected to move in lockstep use strict-paired (0 unpaired files). Directories carrying legacy translation debt (guide, troubleshooting) use tracked-partial with an explicit knownUnpaired list so gaps cannot silently grow or go stale. 5. Fail-Closed Drift Verification: Any uncataloged package, export subpath, workspace dependency, canonical example route, package example folder, root markdown file, or translation drift fails pnpm verify:surface-catalog and pnpm convention:check. --- 2. Base Specification Package Layers & Stability Tiers (api-surface.v1.json) | Layer | Ro

Key points:
• [`catalog/repository-surface/api-surface.v1.json`](../../../catalog/repository-surface/api-surface.v1.json)
• [`catalog/repository-surface/example-surface.v1.json`](../../../catalog/repository-surface/example-surface.v1.json)
• [`catalog/repository-surface/document-surface.v1.json`](../../../catalog/repository-surface/document-surface.v1.json)
• `docs/api/generated` (`pnpm docs:api`) ← `typedoc.json` + exported TypeScript source/JSDoc
• `docs/en/api` & `docs/.vitepress/config/api-spec.ts` (`pnpm docs:sync`) ← `docs/api/generated` + `typedoc-vitepress-sync`
• `llmsData` (`pnpm llms:sync-docs --changed-files <paths>`) ← `docs/{en,ko}/**/*.md`
• `docs/{en,ko}/llms/llms-origin.txt`, `llms-500chars.txt`, `llms-minimal.txt` (`llms-generate`) ← `llmsData/{en,ko}/**`
• **Full Repository API Architecture**: all 20 workspace packages (`packages/*`), their public `exports`, workspace dependencies, stability tiers, and TypeDoc coverage.
• **What Examples Explain**: all 72 canonical routes across 13 semantic groups in `example/`, standalone demos (`demos/bolt-style-editor`, `examples/vanilla-js`), 7 package-local example suites, and 9 narrative example walkthroughs.
• **Managed Documentation Architecture**: all 13 root markdown documents, 13 managed documentation areas with explicit authority and EN/KO pairing policies, and derived TypeDoc/LLMS artifacts.
• **Source-First Non-Duplication**: Runtime manifests (`packages/*/package.json`), TypeDoc entrypoints (`typedoc.json`), route registration (`example/src/App.tsx`), and handwritten guides (`docs/{en,ko}/**`) remain the canonical sources of truth. The surface catalog indexes and cross-validates them without duplicating behavior specs.
• **Explicit Authority vs. Derived Separation**: Every managed...