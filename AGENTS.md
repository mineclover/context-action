# AGENTS.md

Canonical workspace operating guide for AI coding agents working in the **Context-Action** monorepo (`CLAUDE.md` and `gemini.md` defer to this file).

## Project Overview

Context-Action is a TypeScript monorepo separating application logic into framework-neutral **Action Pipelines** and reactive **Stores**, organized around the **Context-Layered Architecture** (`contexts / business / handlers / actions / hooks / views`, plus an optional pure-TS `runtime/` directory for headless domain orchestration outside React).

- **19 Workspace Packages Across 6 Layers** ([Repository Surface Catalog](docs/en/context-layered/repository-surface-catalog.md), `catalog/repository-surface/api-surface.v1.json`, `CA-SURFACE-CATALOG-001`):
  - **Foundation (`6`)**: `@context-action/core`, `@context-action/interactions`, `@context-action/store-core`, `@context-action/mutative-core`, `@context-action/tool-protocol`, `@context-action/tool-durable-operations`
  - **Framework Adapters (`4`)**: `@context-action/react`, `@context-action/mutative`, `@context-action/lit`, `@context-action/preact`
  - **UI Runtimes (`2`)**: `@context-action/lit-ui`, `@context-action/preact-ui`
  - **Integration Adapters (`3`)**: `@context-action/xstate`, `@context-action/ai-sdk`, `@context-action/webmcp`
  - **Tooling (`1`)**: `@context-action/style-testing`
  - **Private Host Support (`3`)**: `@context-action/live-code-editor`, `@context-action/openrouter-browser-storage`, `@context-action/template-react`
- **Canonical Authoritative Guides**:
  - [Convention Index](docs/en/context-layered/convention-index.md) — Central entry point for architecture conventions and ADRs
  - [Repository Surface Catalog](docs/en/context-layered/repository-surface-catalog.md) — Complete 19-package, 78-route, and document inventory
  - [Package Boundary Convention](docs/en/context-layered/package-boundary-convention.md) — Cross-package import, export, and ownership rules
  - [Store Selection and Usage Guide](docs/en/context-layered/store-selection-and-usage-guide.md) — State/store primitive selection across packages
  - [Spec-to-Code Authoring Guide](docs/en/context-layered/spec-to-code-authoring-guide.md) — Contract-first authoring workflow across layers
  - [Testing Convention & Scenarios](docs/en/context-layered/testing-convention.md) — Standardized `T1`–`T4` test tiers, `S1`–`S6` scenarios, and hygiene gate (`CA-TESTING-CONVENTION-001`)
  - [Change Management Convention](docs/en/context-layered/change-management-convention.md) — Spec/issue/PR traceability (`CA-*` / `#issue`)

## Development Commands

### Verification & Testing
```bash
# Local-First verification & receipt (Issue #50, #53)
pnpm verify            # Full 17-step local verification suite (~80s)
pnpm verify:quick      # Fast smoke verification suite (~20-25s)
pnpm verify:receipt    # Audit cryptographic RFC 8785 receipt (fail-closed)

# Build, test, lint, and type-check
pnpm build             # Build all library packages in dependency order (tsdown ESM/CJS + .d.ts)
pnpm test              # Build core + run workspace package tests (--no-bail)
pnpm test:core         # Run @context-action/core tests
pnpm lint              # Biome linting across workspace packages and scripts
pnpm type-check        # Strict TypeScript compilation across packages and tests
pnpm clean             # Clean package build outputs

# Governance, boundaries, and Lit/compatibility gates
pnpm convention:check          # Context-Layered boundaries + CA-SURFACE-CATALOG-001 gate
pnpm verify:surface-catalog    # API / Example / Document surface catalog parity
pnpm package-boundary:check    # Cross-package import & subpath export boundary gate
pnpm change:traceability       # PR traceability check (issue # or CA-* ID)
pnpm check:lit                 # Lit build, type-check, unit, and edge runtime gate
pnpm verify:all                # Full repository pre-release gate
pnpm release:check             # Complete release preflight
```

### Documentation (Unified 2-Tier Pipeline)
```bash
pnpm docs:dev          # Start VitePress dev server
pnpm docs:llms         # Compile docs/{en,ko}/llms/llms-{minimal,500chars,origin}.txt from docs/{en,ko}/**
pnpm llms:check        # Verify docs/{en,ko}/llms/llms-*.txt freshness against source docs
pnpm docs:management   # Verify EN/KO doc pairing, issue forms, convention index & ADRs
pnpm docs:build        # Build VitePress site (with dead-link verification)
pnpm docs:check        # Canonical unified docs gate (docs:management + verify:surface-catalog + llms:check + docs:build)
pnpm verify:doc-snippets # Compile-check <!-- @context-action-compile --> TypeScript blocks (run after pnpm build)
```

- Authoritative docs live in paired `docs/en/**` and `docs/ko/**`, `catalog/repository-surface/*.v1.json`, `packages/*/README.md`, and `packages/*/docs/*.md`.
- Always run `pnpm docs:llms` after editing Markdown under `docs/{en,ko}/**` (excluding `docs/{en,ko}/llms/**`), then verify with `pnpm docs:check`.

### Workspace Build Order & Example App
`example` consumes workspace packages via built declarations (`packages/*/dist`). Always build lower layers before checking consumers:

```bash
# Full order
pnpm build && pnpm example:build

# Focused order after core/react source edits
pnpm build:core && pnpm build:react && pnpm --filter example type-check && pnpm --filter example check && pnpm example:build

# Example development / fast build / tests
pnpm dev                       # Vite dev server (example/)
pnpm --filter example test     # Vitest interaction tests
pnpm example:build:fast        # Fast build without tsc
```

### Release Governance (Protected)
- Packages use **Lerna** independent versioning; run `pnpm changed`, `pnpm diff`, `pnpm release:inventory`, and `pnpm release:check` for read-only inspection/preflight.
- Direct local publishing is disabled (`pnpm release` and `pnpm release:patch` fail closed). Never bump package versions, tag, or publish outside an approved release plan following [`releases/RELEASE.md`](releases/RELEASE.md) and protected workflows.
- Do not cite historical test counts as current status; report the validation results from the current immutable commit.

## Core Implementation Guardrails

- **Action & Intent Contracts**: Action payload maps must extend `ActionPayloadMap`. Keep `BusinessActionIntent` and `LayoutActionIntent` strictly separated (`No Mixed Payloads`) and handle errors explicitly via `controller.abort(...)`. See [Action Pipeline Guide](docs/en/concept/action-pipeline-guide.md) and [Implementation Playbook](skills/context-action-implementation-playbook/SKILL.md).
- **4-Role Handler Hooks (React)** & Lifecycle: Prefer the specialized handler hooks (`useActionGuard`, `useActionCommandHandler`, `useActionResultHandler`, `useActionObserver`) wrapped in `useCallback` rather than registering ad-hoc in UI components; keep pure domain functions isolated in `business/`. See [Hooks Reference](docs/en/concept/hooks-reference.md) and [Handler Registry](docs/en/context-layered/architecture/handler-registry.md).
- **Reactive Stores & Refs**: Read current store values lazily in handlers with `store.getValue()` and subscribe in UI components with `useStoreValue(store)` / `useStoreSelector(...)` (or `useStorePath(...)`); use `createRefContext` for high-frequency imperative DOM/Canvas updates without re-renders. See [Pattern Guide](docs/en/concept/pattern-guide.md).
- **Monorepo Dependencies & Bundling**: Internal dependencies use `workspace:*`; packages build dual ESM (`dist/index.js`), CJS (`dist/index.cjs`), and `.d.ts` via `tsdown` (`ci.yml` tracks bundle sizes per package artifact).

## Key Files and Directories

- [`packages/core/src/ActionRegister.ts`](packages/core/src/ActionRegister.ts) — Core framework-neutral action pipeline
- [`packages/react/src/`](packages/react/src/) — React ActionContext, declarative Store/TimeTravelStore contexts, RefContext, and hooks
- [`catalog/repository-surface/`](catalog/repository-surface/) — Machine-verifiable API, Example, and Document surface catalogs (`CA-SURFACE-CATALOG-001`)
- [`skills/context-action-implementation-playbook/SKILL.md`](skills/context-action-implementation-playbook/SKILL.md) — Scenario & 6-layer Context-Layered authoring skill
- [`docs/`](docs/) — VitePress documentation source & generated `docs/{en,ko}/llms/llms-*.txt` bundles
- [`example/src/`](example/src/) — 78-route showcase application
- [`scripts/`](scripts/) — Verification, boundary, catalog, supply-chain, and LLMS bundle tooling
