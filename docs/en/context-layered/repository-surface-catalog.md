# Repository Surface Catalog (API, Examples, and Managed Documents)

**Status:** Active  
**Spec / Decision ID:** `CA-SURFACE-CATALOG-001`  
**Owner:** Framework Architecture & Documentation Governance  
**Canonical JSON Catalogs:**
- [`catalog/repository-surface/api-surface.v1.json`](../../../catalog/repository-surface/api-surface.v1.json)
- [`catalog/repository-surface/example-surface.v1.json`](../../../catalog/repository-surface/example-surface.v1.json)
- [`catalog/repository-surface/document-surface.v1.json`](../../../catalog/repository-surface/document-surface.v1.json)

This specification defines the principles, schema standards, and complete inventory for three repository surfaces:

1. **Full Repository API Architecture**: all 18 workspace packages (`packages/*`), their public `exports`, workspace dependencies, and stability tiers.
2. **What Examples Explain**: all 77 canonical routes across 13 semantic groups in `example/`, standalone demos (`demos/bolt-style-editor`, `examples/vanilla-js`), 5 package-local example suites, and 9 narrative example walkthroughs.
3. **Managed Documentation Architecture**: all 9 root markdown documents, 12 managed documentation areas with explicit authority and EN/KO pairing policies, and derived LLMS bundle artifacts.

It complements [Package Boundary and Codebase Management](/en/context-layered/package-boundary-convention), [Specification, Issue, and Documentation Management](/en/context-layered/change-management-convention), [Documentation and Development Management](/en/concept/documentation-development-conventions), and ADR [CA-SURFACE-CATALOG-001](/en/context-layered/decisions/CA-SURFACE-CATALOG-001).

---

## 1. Five Organizing Principles

1. **Source-First Non-Duplication**: Runtime manifests (`packages/*/package.json`), route registration (`example/src/App.tsx`), package READMEs/contracts, and handwritten guides (`docs/{en,ko}/**`) remain the canonical sources of truth. The surface catalog indexes and cross-validates them without duplicating behavior specs.
2. **Explicit Authority vs. Derived Separation**: Every managed document is classified as `authoritative`, `discovery`, `evidence`, `derived`, `transitional`, or `historical`. Derived files (`docs/{en,ko}/llms/llms-*.txt`) must be regenerated from source, never edited as canonical specs.
3. **Three-Surface Versioned Schema Symmetry**: API (`api-surface.v1.json`), Example (`example-surface.v1.json`), and Document (`document-surface.v1.json`) share versioned schemas, stable kebab IDs, bilingual summaries (`en` / `ko`), and explicit verification gates.
4. **Honest Bilingual Parity Accounting**: Directories expected to move in lockstep use `strict-paired` (0 unpaired files; currently all 5 `docs/{en,ko}/{context-layered,concept,examples,guide,troubleshooting}` and `docs/{en,ko}/llms`). Any directory temporarily carrying tracked translation debt uses `tracked-partial` with an explicit `knownUnpaired` list so gaps cannot silently grow or go stale.
5. **Fail-Closed Drift Verification**: Any uncataloged package, export subpath, workspace dependency, canonical example route, package example folder, root markdown file, or translation drift fails `pnpm verify:surface-catalog` and `pnpm convention:check`.

---

## 2. Base Specification

### Package Layers & Stability Tiers (`api-surface.v1.json`)

| Layer | Role | Stability Tiers Used |
| --- | --- | --- |
| `foundation` | Zero/minimal-dependency core contracts & engines (`core`, `store-core`, `mutative-core`, `tool-protocol`, `tool-durable-operations`) | `stable`, `public-preview` |
| `framework-adapter` | Framework-specific bindings (`react`, `mutative`, `lit`, `preact`) | `stable`, `public-preview` |
| `ui-runtime` | Owned DOM roots, Web Components, FACE, SSR/hydration (`lit-ui`, `preact-ui`) | `public-preview` |
| `integration-adapter` | External protocol & runtime bridges (`ai-sdk`, `webmcp`, `xstate`) | `public-preview` |
| `tooling` | Build/doc/style verification tooling (`style-testing`) | `private` |
| `private-host-support` | Private demo/template support (`live-code-editor`, `openrouter-browser-storage`, `template-react`) | `private` |

### Document Authority Classes & Pairing Policies (`document-surface.v1.json`)

| Authority Class | Role |
| --- | --- |
| `authoritative` | Canonical specification, architecture convention, or user guide |
| `discovery` | Landing README, AI agent guide, or index linking to canonical docs |
| `evidence` | Immutable release plans, v1 audit/runbook records, verification evidence |
| `derived` | Machine-generated outputs (`docs/{en,ko}/llms/llms-*.txt` via `pnpm docs:llms`) |
| `transitional` | Retained bridge documentation pending consolidation |
| `historical` | Preserved point-in-time snapshot (`CHANGELOG.md`) |

| Pairing Policy | Enforcement Rule |
| --- | --- |
| `strict-paired` | `enDir` and `koDir` must match 1:1 on `.md` files (0 EN-only, 0 KO-only) |
| `tracked-partial` | `onlyEn` and `onlyKo` sets must match `knownUnpaired` 1:1 until translated |
| `single-locale` | Single authoritative locale (`releases/`, `docs/releases/`, `packages/*/docs/`) |
| `derived` | Generated artifact bound to a documented `sourceOfTruth` and generator command |
| `not-applicable` | Machine schemas/skills (`catalog/`, `skills/`, `.agents/skills/`) |

### Update Loop on Surface Changes

1. Update the canonical source (`package.json`, `example/src/App.tsx`, or `docs/`).
2. Update the corresponding catalog in `catalog/repository-surface/*.v1.json` and, if needed, `docs/{en,ko}/context-layered/repository-surface-catalog.md`.
3. Run `pnpm docs:llms` for edited markdown files to regenerate `docs/{en,ko}/llms/llms-*.txt`.
4. Run `pnpm verify:surface-catalog && pnpm convention:check && pnpm docs:check`.

---

## 3. Surface 1: Full Repository API Architecture (18 Packages)

All 18 workspace packages declared under `packages/*/package.json` (excluding untracked local build residue without `package.json`):

| Package | Layer | Visibility / Stability | Public `exports` | Workspace Deps (+Peers) | Authoritative Reference |
| --- | --- | --- | --- | --- | --- |
| `@context-action/core` (`1.3.1`) | `foundation` | `public` / `stable` | `.`, `./element`, `./element/react` | none | `packages/core/README.md`, `action-contracts.md`, `element-interop.md` |
| `@context-action/store-core` (`0.1.4`) | `foundation` | `public` / `stable` | `.` | none | `packages/store-core/README.md`, `store-selection-and-usage-guide.md` |
| `@context-action/mutative-core` (`0.8.14`) | `foundation` | `public` / `stable` | `.` | none | `packages/mutative-core/README.md`, `mutative-core-history.md` |
| `@context-action/tool-protocol` (`1.0.2`) | `foundation` | `public` / `stable` | `.` | none | `packages/tool-protocol/README.md`, `tool-calling-editor-architecture.md` |
| `@context-action/tool-durable-operations` (`0.2.0`) | `foundation` | `public` / `public-preview` | `.` | none | `packages/tool-durable-operations/README.md`, `durable-operation-operations.md` |
| `@context-action/react` (`4.0.7`) | `framework-adapter` | `public` / `stable` | `.`, `./refs`, `./time-travel`, `./transactions`, `./backend`, `./advanced`, `./utils`, `./webmcp` | `core`, `mutative`, `store-core` (+peers: `tool-protocol`, `webmcp`) | `packages/react/README.md`, `state-contracts.md`, `hooks-reference.md` |
| `@context-action/mutative` (`0.8.15`) | `framework-adapter` | `public` / `stable` | `.` | `mutative-core`, `store-core` | `packages/mutative/README.md`, `time-travel-specialization.md` |
| `@context-action/lit` (`0.1.4`) | `framework-adapter` | `public` / `public-preview` | `.` | `core` | `packages/lit/README.md`, `01-controller-scope.md` |
| `@context-action/preact` (`0.1.3`) | `framework-adapter` | `public` / `public-preview` | `.` | `core` | `packages/preact/README.md`, `spec-to-code-authoring-guide.md` |
| `@context-action/lit-ui` (`0.1.4`) | `ui-runtime` | `public` / `public-preview` | `.`, `./react-bridge`, `./ssr`, `./hydrate` | `core`, `lit` | `packages/lit-ui/README.md`, `packages/lit-ui/docs/*.md` |
| `@context-action/preact-ui` (`0.2.1`) | `ui-runtime` | `public` / `public-preview` | `.`, `./react-bridge`, `./ssr` | `core`, `preact` | `packages/preact-ui/README.md`, `packages/preact-ui/docs/*.md` |
| `@context-action/ai-sdk` (`0.1.0`) | `integration-adapter` | `public` / `public-preview` | `.` | `tool-protocol` | `packages/ai-sdk/README.md`, `usecase-tool-calling-web-studio.md` |
| `@context-action/webmcp` (`0.1.2`) | `integration-adapter` | `public` / `public-preview` | `.`, `./profiles/chrome-legacy` | `tool-protocol` | `packages/webmcp/README.md`, `docs/en/guide/webmcp.md` |
| `@context-action/xstate` (`0.1.0`) | `integration-adapter` | `public` / `public-preview` | `.`, `./effect` | `core`, `store-core` | `packages/xstate/README.md`, `xstate-effect-integration.md` |
| `@context-action/style-testing` (`0.1.0`) | `tooling` | `private` / `private` | `.`, `./babel-plugin` | none | `packages/style-testing/README.md` |
| `@context-action/live-code-editor` (`0.0.0`) | `private-host-support` | `private` / `private` | `.` | none | `packages/live-code-editor/README.md` |
| `@context-action/openrouter-browser-storage` (`0.0.0`) | `private-host-support` | `private` / `private` | `.` | none | `packages/openrouter-browser-storage/README.md` |
| `@context-action/template-react` (`1.0.0`) | `private-host-support` | `private` / `private` | `(no exports)` | `core`, `react` | `packages/template-react/README.md` |

> [!NOTE]
> **API Surface Source of Truth**: Rather than maintaining a repository-wide TypeDoc HTML/Markdown generation tree (`docs/en/api/**`), all 14 public runtime packages document their public contracts directly in `packages/*/README.md`, `packages/*/docs/*.md`, TypeScript `.d.ts` declarations, and [`catalog/repository-surface/api-surface.v1.json`](../../../catalog/repository-surface/api-surface.v1.json).

### 3.1 Package Roles by Layer

- **Foundation (`5`)**: `core` (action pipeline & optional `./element` DOM/host transport), `store-core` (framework-neutral state/timeline/transaction protocols + `createStateStore`), `mutative-core` (`mutative@2.0.2`-compatible immutable draft/patch engine), `tool-protocol` (Zod/JSON Schema tools, MCP/provider adapters, approval queues, idempotency, observability), `tool-durable-operations` (lease/claim side-effect recovery & IndexedDB/Redis/PostgreSQL reference backends).
- **Framework Adapters (`4`)**: `react` (React 18/19 Action/Store/TimeTravel/Ref contexts, hooks, transactions, `./refs`, `./time-travel`, `./transactions`, `./backend`, `./advanced`, `./webmcp`), `mutative` (`TimeTravel` + `MutativeStateBackend`/`MutativeTimelineBackend`), `lit` (`StoreController`, `ActionController`, `ControllerScope`), `preact` (`createDispatchContext`, `connectSourceSignal`, `createSourceContext`, `useProjection`).
- **UI Runtimes (`2`)**: `lit-ui` (Lit Web Components, W3C Context Protocol, FACE, `./react-bridge`, `./ssr`, `./hydrate`), `preact-ui` (owned Preact DOM roots, `mountPreact`/`hydratePreact`, `createDisposalScope`, `./react-bridge`, `./ssr`).
- **Integration Adapters (`3`)**: `xstate` (XState v5/v6 actor bridges in `.` and Effect v4 / `@xstate/effect` / Standard Schema v1 / transaction scopes in `./effect`), `ai-sdk` (AI SDK v7 turn-scoped `ToolSet` bridge), `webmcp` (allowlisted `document.modelContext` browser adapter).
- **Tooling (`1`)**: `style-testing` (private Playwright style extraction & Babel instrumentation).
- **Private Host Support (`3`)**: `live-code-editor` (workspace snapshot & iframe preview bridge), `openrouter-browser-storage` (demo API key local storage), `template-react` (Context-Layered + Astryx starter template).

For deciding which state/store API to use across these packages, see the [Store Selection and Usage Guide](./store-selection-and-usage-guide.md).

---

## 4. Surface 2: What Examples Explain

### 4.1 `example/` React App (77 Canonical Routes in 13 Semantic Groups)

`example/src/App.tsx` defines **77 canonical `<Route>` entries** (1:1 with entry modules; 0 legacy aliases) indexed by `scripts/example-route-impact.mjs`:

| Group ID | Routes (Count) | What It Explains | Primary APIs | Gate |
| --- | --- | --- | --- | --- |
| `ex-app-hub` | `/`, `/demos`, 6 `/catalog/*`, 3 `/overview/*` (**11**) | Entry home, category catalogs, MCP/function-calling catalog registry, conceptual overviews | `createActionContext`, `createStoreContext`, `ToolContext` | `pnpm --filter example check && pnpm --filter example build` |
| `ex-app-foundations-core` | `/foundations/core/basics`, `/foundations/core/advanced` (**2**) | Framework-neutral `ActionRegister` payload typing, priority ordering, async modes, abort signals | `ActionRegister`, `executeParallel`, `executeSequential`, `executeRace`, `useActionGuard`, `useActionCommandHandler`, `useActionObserver` | `pnpm --filter example test && pnpm --filter example build` |
| `ex-app-foundations-store` | `/foundations/store/basics`, `immutability-test`, `time-travel`, `time-travel-context`, `backend-transactions` (**5**) | Store reactivity, Mutative structural immutability, `TimeTravelStore`, `createBackendStore`, and `StoreTransactionCoordinator` | `createStore`, `createTimeTravelStore`, `createStateStore`, `createBackendStore`, `StoreTransactionCoordinator` | `pnpm --filter example test && pnpm --filter example build` |
| `ex-app-foundations-react` | `/foundations/react/provider`, `context`, `hooks`, `useActionWithResult`, `imperativeRef`, `headless-di` (**6**) | Separated Providers, multi-context isolation, selective hooks, `dispatchWithResult`, `useImperativeHandle + RefContext`, Headless-First Symmetric DI | `ActionRegister`, `createActionContext`, `createStore`, `createStoreContext`, `createTimeTravelStore`, `createTimeTravelStoreContext`, `TimeTravelStoreManager`, `createRefContext`, `useStoreValue`, `useStoreSelector`, `dispatchWithResult`, `useActionGuard`, `useActionResultHandler`, `useActionCommandHandler`, `useActionObserver` | `pnpm --filter example test && pnpm --filter example build` |
| `ex-app-performance-action-guard` | `/performance/action-guard`, `showcase`, `search`, `scroll`, `api-blocking`, `throttle-comparison`, `advanced-filtering` (**7**) | Debounce, throttle, in-flight API deduplication, abortable search, priority jumping & filtering | `ActionGuard`, `ActionRegister`, `PipelineController` | `pnpm --filter example check && pnpm --filter example test` |
| `ex-app-performance-priority` | `/performance/priority/advanced`, `/performance/priority/demo` (**2**) | Multi-handler priority scheduling benchmarks and live execution trace tuning | `ActionRegister`, `useActionHandler` | `pnpm --filter example build` |
| `ex-app-performance-mouse-events` | `/performance/mouse-events`, `legacy`, `reactive`, `non-reactive`, `context-store-action`, `canvas-ref-demo`, `context-store` (**7**) | Reactive Store updates vs zero-re-render `RefContext` direct DOM/Canvas updates under 120fps pointer streams | `createStoreContext`, `createRefContext`, `createActionContext` | `pnpm --filter example verify:mouse-action && verify:mouse-pattern && verify:mouse-enhanced` |
| `ex-app-performance-memoization` | `/performance`, `/performance/memoization/{demo,analysis,guidelines}` (**4**) | `useCallback` handler memoization and React Compiler stability to avoid re-registration churn | `useActionHandler`, `createActionContext` | `pnpm --filter example build` |
| `ex-app-patterns-conditional` | `/patterns/conditional`, `permissions`, `form-validation`, `workflow-steps`, `feature-toggle` (**5**) | Conditional pipeline gating: RBAC permissions, multi-stage validation, sequential workflow steps, feature flags | `useActionHandler`, `PipelineController`, `ActionGuard` | `pnpm --filter example verify:conditional` |
| `ex-app-patterns-architecture` | `/patterns/business-logic`, `layered-architecture`, `/patterns/implementation-playbook` + `scenarios`, `access-request`, `incident-escalation`, `renewal-risk-review` (**7**) | Pure business-logic extraction, 6-layer Context-Layered structure, Unified Triad (`BusinessActionIntent` vs `LayoutActionIntent`) alignment, Canonical Order Form, and Implementation Playbook workflows | `createActionContext`, `createStoreContext`, `useActionHandler`, `useStoreValue`, `useActionGuard`, `useActionCommandHandler`, `useActionObserver` | `pnpm convention:check && pnpm --filter example verify:usecase` |
| `ex-app-patterns-pipeline-refs` | `/patterns/pipeline/flow-control`, `/patterns/refs`, `waitforrefs-performance`, `use-ref-mount-state-test`, `canvas` (**5**) | Dynamic `PipelineController` (`abort`/`skip`/`jumpToPriority`/`modifyPayload`) and `waitForRefs`/`useRefMountState` DOM/Canvas lifecycle | `PipelineController`, `createRefContext`, `waitForRefs`, `useRefMountState` | `pnpm --filter example build` |
| `ex-app-integrations` | `/integrations/action-lifecycle`, `react-aria-reference`, `preact-web-components`, `lit-web-components`, `xstate-statechart`, `webmcp-scope`, `ai-sdk-tools`, `business/chat`, `advanced/form-builder`, `advanced/concurrent-actions` (**10**) | Action Lifecycle Workbench, React Aria layered hydration, Preact/Lit Web Component React bridges, XState/Effect, WebMCP, AI SDK v7 tool scope, chat, dynamic form builder, concurrency isolation | `ActionRegister`, `@context-action/core/element`, `preact-ui/react-bridge`, `lit-ui/react-bridge`, `@context-action/xstate`, `@context-action/webmcp`, `@context-action/ai-sdk` | `pnpm verify:react-aria-reference-hydration && pnpm verify:element-interop && pnpm --filter example test` |
| `ex-app-utilities` | `/utilities/dev-tools/{logger,toast-config,warning-demo,store-scenarios}`, `source-directory`, `testing/enhanced-search` (**6**) | LogMonitor tracing, toast policies, warning diagnostics, store comparison benchmarks, source directory, abortable search test harness | `ActionRegister`, `createStoreContext`, `createActionContext` | `pnpm --filter example check && pnpm --filter example build` |

### 4.2 Standalone Demos (2) & Package-Local Examples (5)

| Surface | Path | Status | What It Explains | Verification Gate |
| --- | --- | --- | --- | --- |
| Standalone Demo | `demos/bolt-style-editor` | `verified` | Tool-Calling Web Studio (`tool-protocol`, `tool-durable-operations`, `live-code-editor`, IndexedDB, approval queue, bounded trace, iframe preview) | `pnpm web-coding:verify` |
| Standalone Demo | `examples/vanilla-js` | `reference` | Framework-free HTML/JS counter and XSS-safe todo apps using `@context-action/core` + `@context-action/store-core` | `pnpm build:core && pnpm --filter @context-action/store-core build` |
| Package Examples | `packages/core/examples` | `verified` | Core `ActionRegister` demos + copyable Vue/Svelte/Angular `element-hosts` over `./element` | `pnpm verify:element-hosts && pnpm verify:element-interop` |
| Package Examples | `packages/lit-ui/examples` | `verified` | DSD SSR hydration harness + ElementInternals FACE exception diagnostic playground | `pnpm --filter @context-action/lit-ui test:browser` |
| Package Examples | `packages/preact-ui/examples` | `verified` | Projected Order 6-layer workspace, Layer Panel contract reuse, modular Signals Web Components, SSR | `pnpm --filter @context-action/preact-ui test:browser` |
| Package Examples | `packages/react/examples` | `verified` | Package-level hooks, RefContext (`GameUI`/`SimpleForm`), declarative/unified Store patterns | `pnpm --filter @context-action/react exec tsc --noEmit -p tsconfig.examples.json && pnpm --filter @context-action/react test` |
| Package Examples | `packages/mutative/examples` | `experimental` | Workspace-only `travels@3` + `mutative@2` backend prototypes (`travels-v3`) | `pnpm --filter @context-action/mutative test:travels-v3` |

### 4.3 Narrative Example Walkthroughs (`docs/{en,ko}/examples/*.md`, 9 Paired Docs)

1. `basic-setup.md` (`/foundations/react/provider`) — Action-Only + Store-Only baseline setup
2. `action-only.md` (`/foundations/core/basics`) — Pure command/event dispatch without store state
3. `store-only.md` (`/foundations/store/basics`) — Pure reactive store & selector subscriptions
4. `pattern-composition.md` (`/patterns/layered-architecture`) — Composing Action + Store across MVVM layers
5. `canonical-order-form.md` (`/patterns/implementation-playbook`) — Canonical Order Form reference walkthrough
6. `access-request-playbook.md` (`/patterns/implementation-playbook/access-request`) — Approval review-packet workflow
7. `incident-escalation-playbook.md` (`/patterns/implementation-playbook/incident-escalation`) — Operations escalation-packet workflow
8. `renewal-risk-review-playbook.md` (`/patterns/implementation-playbook/renewal-risk-review`) — Customer-success renewal review workflow
9. `implementation-playbook-scenarios.md` (`/patterns/implementation-playbook/scenarios`) — Cross-domain playbook scenario catalog

---

## 5. Surface 3: Managed Documentation Architecture

### 5.1 Root Markdown Documents (9 Files)

| File | Authority | Lifecycle | Owner | Purpose |
| --- | --- | --- | --- | --- |
| `README.md`, `README.ko.md` | `discovery` | `active` | Framework Maintainers | GitHub English & Korean landing entry points linking to authoritative guides |
| `AGENTS.md` | `discovery` | `active` | Framework Maintainers | Canonical SSOT for agent instructions, build order, surface catalogs, and Local-First verification rules |
| `CLAUDE.md`, `gemini.md` | `discovery` | `active` | Framework Maintainers | Thin agent entry pointers routing to `AGENTS.md` and canonical Context-Layered guides |
| `CONTRIBUTING.md`, `DEVELOPMENT.md` | `discovery` | `active` | Framework Maintainers | Contributor setup, monorepo commands, and workflow onboarding |
| `SECURITY.md` | `authoritative` | `active` | Security & Release Maintainers | Supported release-line security scope & disclosure policy |
| `CHANGELOG.md` | `historical` | `historical` | Release Engineering | Historical monorepo changelog prior to per-package changelogs |

### 5.2 Managed Documentation Areas (12 Areas)

| Area ID | Paths | Authority | Pairing Policy | Notes / Tracked Gaps |
| --- | --- | --- | --- | --- |
| `doc-context-layered` | `docs/{en,ko}/context-layered` | `authoritative` | `strict-paired` | 0 unpaired; includes conventions, IIC, ADRs (`CA-*`), and this catalog |
| `doc-concept` | `docs/{en,ko}/concept` | `authoritative` | `strict-paired` | 0 unpaired; architecture, pipeline, hooks, editor architecture, docs rules |
| `doc-examples` | `docs/{en,ko}/examples` | `authoritative` | `strict-paired` | 0 unpaired; 9 example walkthroughs |
| `doc-llms` | `docs/{en,ko}/llms` (`.md`) | `authoritative` | `strict-paired` | 0 unpaired (`llms-*.txt` tracked under `derivedSurfaces`) |
| `doc-guide` | `docs/{en,ko}/guide` | `authoritative` | `strict-paired` | 0 unpaired; getting-started, pipeline (`advanced-filtering.md` paired), and action/store/ref/async/setup patterns |
| `doc-troubleshooting` | `docs/{en,ko}/troubleshooting` | `authoritative` | `strict-paired` | 0 unpaired; diagnostic guides for action, store, ref, infinite loops, and performance |
| `doc-docs-root` | `docs/index.md`, `LOCAL_FIRST_VERIFICATION_POLICY.md` | `authoritative` | `single-locale` | VitePress home selector & Local-First Verification Policy |
| `doc-releases-v1` | `docs/releases`, `docs/ko/releases` | `evidence` | `single-locale` | v1.0.0 audit, scope, runbooks, release manifest |
| `doc-releases-ops` | `releases/` | `evidence` | `single-locale` | `RELEASE.md`, cohort JSON plans, public preview release notes |
| `doc-package-docs` | `packages/*/README.md`, `CHANGELOG.md`, `UNRELEASED.md`, `docs/*.md` | `authoritative` | `single-locale` | Per-package discovery & focused contracts |
| `doc-catalogs` | `catalog/` | `authoritative` | `not-applicable` | `integration-profiles/*.json` + `repository-surface/*.v1.json` |
| `doc-skills` | `skills/` (`.agents/skills/` gitignored mirror) | `authoritative` | `not-applicable` | Repository-local Implementation Playbook skills |

### 5.3 Derived / Generated Surfaces (6 Outputs)

- `docs/en/llms/llms-origin.txt`, `llms-500chars.txt`, `llms-minimal.txt` (`pnpm docs:llms`) ← `docs/en/**/*.md` (excluding `docs/en/llms/**`)
- `docs/ko/llms/llms-origin.txt`, `llms-500chars.txt`, `llms-minimal.txt` (`pnpm docs:llms`) ← `docs/ko/**/*.md` (excluding `docs/ko/llms/**`)

---

## 6. Verification Commands

```bash
# Verify 1:1 structural parity across API, Example, and Document catalogs
pnpm verify:surface-catalog

# Run surface catalog regression tests
node --test scripts/verify-repository-surface-catalog.test.mjs

# Run all repository conventions (includes surface catalog checks)
pnpm convention:check

# Verify documentation management, LLMS parity, and VitePress build
pnpm docs:check
```
