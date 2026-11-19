---
document_id: context-layered--decisions--CA-SURFACE-CATALOG-001
category: context-layered
source_path: en/context-layered/decisions/CA-SURFACE-CATALOG-001.md
character_limit: 2000
last_update: '2026-11-19T21:52:05.482Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
CA-SURFACE-CATALOG-001: Repository API, Example, and Document Surface Catalog Governance

CA-SURFACE-CATALOG-001: Repository API, Example, and Document Surface Catalog Governance Status: accepted Owner: Framework Architecture & Documentation Governance Related issue/spec: CA-SURFACE-CATALOG-001 (Repository Surface Catalog, Package Boundary Convention, Specification, Issue, and Documentation Management) Context The repository now spans 20 workspace packages (packages/), 72 canonical routes inside example/ (116 total routes including legacy redirects), standalone demos (demos/bolt-style-editor, examples/vanilla-js), 7 package-local examples/ suites, 9 narrative example walkthroughs, 13 root markdown files, bilingual documentation trees, release manifests, and derived TypeDoc/LLMS artifacts. Previously, these surfaces were only discoverable piecemeal across package.json, typedoc.json, example/src/App.tsx, sidebars.ts, and package-boundary-convention.md (where @context-action/lit, @context-action/lit-ui, @context-action/webmcp, and @context-action/te

Key points:
• **Manually maintained markdown lists only**: Rejected because prose inventories rot immediately when packages, export subpaths, canonical routes, or markdown directories change.
• **Replacing existing source-of-truth files (`package.json`, `typedoc.json`, `App.tsx`) with a monolithic generator**: Rejected because each surface already has an authoritative runtime source (`package.json#exports`, `typedoc.json`, `example/src/App.tsx`, handwritten `docs/{en,ko}/`); duplicating runtime ownership violates...