# CLAUDE.md

Entry guidance for Claude Code working in the `context-action` monorepo.

**[AGENTS.md](./AGENTS.md) is the single source of truth** for repository architecture, 19-package boundaries, workspace build order, verification gates, documentation pipeline rules, and release governance.

## Essential Quick Commands

```bash
# Build & test (respect dependency order: core -> react -> example)
pnpm build
pnpm type-check
pnpm test
pnpm lint

# Conventions, boundaries & surface catalogs (CA-SURFACE-CATALOG-001)
pnpm package-boundary:check
pnpm verify:surface-catalog
pnpm convention:check

# Unified documentation pipeline (rebuild LLMS bundles before checking)
pnpm docs:llms
pnpm docs:check
pnpm verify:doc-snippets

# Local-First preflight & receipt (run on a clean working tree before PR)
pnpm verify:quick
pnpm verify:receipt
```

## Canonical Entry Points

- [AGENTS.md](./AGENTS.md) — Full workspace instructions & implementation guardrails
- [Repository Surface Catalog](docs/en/context-layered/repository-surface-catalog.md) — 19 packages, 78 routes, and managed documentation areas
- [Spec-to-Code Authoring Guide](docs/en/context-layered/spec-to-code-authoring-guide.md) — 6-layer Context-Layered authoring workflow (`contexts / business / handlers / actions / hooks / views` + optional pure-TS `runtime/`)
- [Testing Convention & Scenarios](docs/en/context-layered/testing-convention.md) — Standardized `T1`–`T4` test tiers, `S1`–`S6` scenarios, and hygiene gate (`CA-TESTING-CONVENTION-001`)
- [Documentation Conventions](docs/en/concept/documentation-development-conventions.md) — Paired EN/KO docs & LLMS bundle verification rules
