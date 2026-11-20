# Gemini-AI Agent Project Context

This document provides workspace guidance for Gemini agents working in the `context-action` repository.

## Project Overview

`context-action` is a modular TypeScript monorepo for managing application state and business logic through framework-neutral **Action Pipelines** and reactive **Stores**. It organizes applications around the **Context-Layered 6-layer architecture** (`contexts / business / handlers / actions / hooks / views`) and explicit separation between view presentation, orchestration handlers, pure business logic, and state stores.

- **Workspace Packages (20 across 6 layers)**: `core`, `store-core`, `mutative-core`, `mutative`, `react`, `xstate`, `preact`, `preact-ui`, `lit`, `lit-ui`, `tool-protocol`, `tool-durable-operations`, `ai-sdk`, `webmcp`, `openrouter-browser-storage`, `live-code-editor`, `style-testing`, `template-react`, `llms-generator`, and `typedoc-vitepress-sync`.
- **Canonical Inventories & Selection Guides**:
  - [Repository Surface Catalog](docs/en/context-layered/repository-surface-catalog.md) (`catalog/repository-surface/{api,example,document}-surface.v1.json`, `CA-SURFACE-CATALOG-001`)
  - [Package Boundary and Codebase Management Convention](docs/en/context-layered/package-boundary-convention.md)
  - [Store Selection and Usage Guide](docs/en/context-layered/store-selection-and-usage-guide.md)
  - [Convention Index](docs/en/context-layered/convention-index.md)

## Development & Documentation Workflow

The repository follows a contract-first, documentation-synced development loop:

1. **Specify the Contract**: Define public types, state transitions, or durable architecture boundaries in the owning package or decision record (`docs/en/context-layered/decisions/`). Keep 6-layer Context-Layered separation (`contexts / business / handlers / actions / hooks / views`) and `BusinessActionIntent` vs `LayoutActionIntent` separation when authoring React scenarios (`skills/context-action-implementation-playbook/SKILL.md`).
2. **Implement in Layer Order**: Build lower-level runtime packages before consumers (`pnpm build` runs Lerna in dependency order; after changing `core` or `react`, run `pnpm build:core && pnpm build:react` before checking `example`).
3. **Update Authoritative Docs & Surface Catalogs**: Keep paired `docs/en/**` and `docs/ko/**` guides aligned per [Documentation and Development Management Conventions](docs/en/concept/documentation-development-conventions.md) and [Change Management Convention](docs/en/context-layered/change-management-convention.md). Update `catalog/repository-surface/*.v1.json` whenever packages, exports, canonical routes, or managed document areas change.
4. **Sync Derived Outputs**:
   - After editing `docs/(en|ko)/**/*.md`: run `pnpm build:llms-generator` and `pnpm llms:sync-docs --changed-files path1.md path2.md` (accepts comma- or space-separated paths, `=`, or repeated flags).
   - After changing public TypeScript APIs/JSDoc: run `pnpm docs:api && pnpm docs:sync`.
5. **Verify Locally Before Commit/PR** ([Local-First Verification Policy](docs/LOCAL_FIRST_VERIFICATION_POLICY.md)):
   - Full / quick receipt generation (on a clean tree before PR): `pnpm verify` or `pnpm verify:quick` (verified via `pnpm verify:receipt`).
   - Documentation & catalog gates: `pnpm docs:check`, `pnpm verify:doc-snippets`, `pnpm verify:surface-catalog`, `pnpm convention:check`, `pnpm package-boundary:check`.
   - Static checks & tests: `pnpm lint` (Biome), `pnpm type-check`, `pnpm test`.
