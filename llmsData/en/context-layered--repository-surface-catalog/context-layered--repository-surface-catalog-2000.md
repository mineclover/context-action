---
document_id: context-layered--repository-surface-catalog
category: context-layered
source_path: en/context-layered/repository-surface-catalog.md
character_limit: 2000
last_update: '2026-11-19T21:51:46.223Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Repository Surface Catalog (API, Examples, and Managed Documents)

Repository Surface Catalog (API, Examples, and Managed Documents) Status: Active Spec / Decision ID: CA-SURFACE-CATALOG-001 Owner: Framework Architecture & Documentation Governance Canonical JSON Catalogs: - catalog/repository-surface/api-surface.v1.json - catalog/repository-surface/example-surface.v1.json - catalog/repository-surface/document-surface.v1.json This specification defines the principles, schema standards, and complete inventory for three repository surfaces: 1. Full Repository API Architecture: all 20 workspace packages (packages/), their public exports, workspace dependencies, stability tiers, and TypeDoc coverage. 2. What Examples Explain: all 72 canonical routes across 13 semantic groups in example/, standalone demos (demos/bolt-style-editor, examples/vanilla-js), 7 package-local example suites, and 9 narrative example walkthroughs. 3. Managed Documentation Architecture: all 13 root markdown documents, 13 managed documentation areas with explicit au

Key points:
• [`catalog/repository-surface/api-surface.v1.json`](../../../catalog/repository-surface/api-surface.v1.json)
• [`catalog/repository-surface/example-surface.v1.json`](../../../catalog/repository-surface/example-surface.v1.json)
• [`catalog/repository-surface/document-surface.v1.json`](../../../catalog/repository-surface/document-surface.v1.json)
• `docs/api/generated` (`pnpm docs:api`) ← `typedoc.json` + exported TypeScript source/JSDoc
• `docs/en/api` & `docs/.vitepress/config/api-spec.ts` (`pnpm docs:sync`) ← `docs/api/generated` + `typedoc-vitepress-sync`
•...