# Gemini-AI Agent Project Context

Entry context for Gemini agents working in `context-action`. See **[AGENTS.md](./AGENTS.md)** as the single source of truth for workspace commands, 19-package boundaries, build order, and protected release rules.

## Contract-First Development & Documentation Workflow

1. **Specify the Contract**: Define public types, state transitions, or durable architecture boundaries in the owning package or decision record (`docs/en/context-layered/decisions/`). Keep 6-layer Context-Layered separation (`contexts / business / handlers / actions / hooks / views`, plus optional pure-TS `runtime/`) and `BusinessActionIntent` vs `LayoutActionIntent` separation when authoring React scenarios (`skills/context-action-implementation-playbook/SKILL.md`).
2. **Implement in Layer Order**: Build lower-level packages before consumers (`pnpm build` runs Lerna in topological order; after editing `core` or `react`, run `pnpm build:core && pnpm build:react` before checking `example`).
3. **Update Authoritative Docs & Surface Catalogs**: Keep paired `docs/en/**` and `docs/ko/**` aligned per [Documentation Conventions](docs/en/concept/documentation-development-conventions.md) and [Change Management Convention](docs/en/context-layered/change-management-convention.md). Update `catalog/repository-surface/*.v1.json` whenever packages, exports, canonical routes, or managed/root docs change.
4. **Sync Derived LLMS Bundles**:
   - After editing `docs/{en,ko}/**/*.md`: run `pnpm docs:llms` to regenerate `docs/{en,ko}/llms/llms-{minimal,500chars,origin}.txt`.
   - When changing public TypeScript APIs/exports: update package `README.md`, `packages/*/docs/*.md`, and `catalog/repository-surface/api-surface.v1.json`.
5. **Verify Locally Before Commit/PR** ([Local-First Verification Policy](docs/LOCAL_FIRST_VERIFICATION_POLICY.md)):
   - Clean-tree receipt generation: `pnpm verify:quick` (or `pnpm verify`), verified via `pnpm verify:receipt`.
   - Docs & catalog gates: `pnpm docs:check`, `pnpm verify:doc-snippets`, `pnpm verify:surface-catalog`, `pnpm convention:check`, `pnpm package-boundary:check`.
   - Static checks & tests: `pnpm lint`, `pnpm type-check`, `pnpm test`.
