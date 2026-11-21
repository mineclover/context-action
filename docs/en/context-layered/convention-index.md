# Convention Index

This document is the central entry point for the implementation-playbook style conventions in the Context-Action repository. The docs have grown enough that it helps to group which documents define the rules, which ones demonstrate the pattern, and which ones lock the verification model.

## Architecture & Quality System at a Glance

Context-Action organizes applications around **three core axes**, adopts structure progressively by domain size, and splits governance cleanly between **CI-enforced invariants** and **advisory architecture practices**:

- **Core 3 Axes**:
  1. **Action Pipeline** (`@context-action/core`, `ActionContext`) — sequential admission (`Guard`), execution (`Command`/`Result`), and post-settlement observation (`Observer`).
  2. **Reactive Store** (`@context-action/store-core`, `Store`, `TimeTravelStore`) — explicit snapshots read lazily in `handlers/` (`store.getValue()`) and subscribed declaratively in `hooks/` (`useStoreValue` / `useStoreSelector` / `useStorePath`).
  3. **Imperative Ref** (`RefContext`) — high-frequency DOM, canvas, or element-host operations without React re-renders.
- **3-Level Progressive Adoption Ladder**:
  - **Level 1 · Lite**: Single-domain `createActionContext` + `createStoreContext` + `useActionHandler` inside a local Registry.
  - **Level 2 · Headless-First Symmetric DI**: Pure domain `business/` + framework-neutral `runtime/` (`ActionRegister` + `createStore` / `createStateStore`), injected into React via `ownership="shared"` Providers (`/foundations/react/headless-di`).
  - **Level 3 · Full 6-Layer**: Strict `contexts / business / runtime (optional) / handlers / actions / hooks / views` split with separated `Business` vs. `Layout` intents, domain codes/events, and explicit state machines ([packages/template-react](../../../packages/template-react/README.md) starter & `/patterns/implementation-playbook`).
- **7 CI-Enforced Rules (`pnpm convention:check`, scanning `example/src` + `packages/template-react/src`, or external consumer `--root <dir>`)**:
  1. Handler registration placement (`handlers/` or `*HandlerRegistry` only)
  2. Fixed Provider nesting (`Action -> Store -> Ref -> HandlerRegistry`)
  3. Canonical layer file names & import boundaries (`contexts / business / runtime / handlers / actions / hooks / views`)
  4. Explicit non-canonical `handlers/` classification (`tools/context-action-lint/layered-surface-classification.json`)
  5. `no-deprecated-effect-handler` (blocks deprecated `use*ActionEffectHandler` / `registerEffect`)
  6. `no-store-access-in-actions` (blocks runtime store imports and `use*Store` / `getStore` / `setValue` / `update` in canonical `actions/`)
  7. `no-store-subscription-in-handlers` (blocks `use*StoreValue` / `use*StoreSelector` / `use*StorePath` in `handlers/` & `*HandlerRegistry`; justifies rare intentional exceptions fail-closed via `tools/context-action-lint/rule-exceptions.json`)
- **Advisory / Cross-Repo Discipline**: 4-role handler hooks, `BusinessActionIntent` vs. `LayoutActionIntent` separation (`No Mixed Payloads`), `useCallback` stability, domain codes/events translated in `hooks/`, IIC (`CA-IIC-*`), 2-Second State Rule (`CA-SPEC-EVIDENCE-001`), and Unified Triad (`ttsc-ex` · `oa-sdk`) locks.

## Start Here by Task

Choose the path that matches the change; do not read the whole library before
you know which artifact you own.

| If you are changing… | Read first | Then use |
| --- | --- | --- |
| a feature end-to-end from specs, intent, or store selection | [Spec-to-Code Authoring Guide](/en/context-layered/spec-to-code-authoring-guide) | `pnpm convention:check && pnpm docs:check` |
| a package responsibility, dependency, or export | [Package Boundary and Codebase Management](/en/context-layered/package-boundary-convention) | `pnpm package-boundary:check` |
| repository API packages, example routes, or managed document inventory | [Repository Surface Catalog](/en/context-layered/repository-surface-catalog) | `pnpm verify:surface-catalog` |
| choosing or integrating a Store / state mechanism across packages | [Store Selection and Usage Guide](/en/context-layered/store-selection-and-usage-guide) | `pnpm package-boundary:check` |
| a public guide, API reference, README route, or generated document | [Documentation and Development Management](/en/concept/documentation-development-conventions) | `pnpm docs:check` |
| a durable architectural boundary or compatibility exception | [Architecture Decision Records](/en/context-layered/decisions/) | the linked package/guide and focused proof |
| a feature, bug, or workflow contract | [Specification, Issue, and Documentation Management](/en/context-layered/change-management-convention) | its change-class gate |
| UX behavior, implicit agreement, or design-accessibility trade-off | [Interaction Intent Contract (IIC)](/en/context-layered/interaction-intent-contract) | intent, discoverability, and follow-up UI evidence |
| `ttsc-ex` · `oa-sdk` contract locks, intent separation, or layout hierarchy sync | [Unified Triad Self-Serve Sync Guide](/en/context-layered/triad-evidence-sync-guide) | `pnpm docs:management && pnpm llms:check && pnpm convention:check` |
| a canonical example/usecase | [Implementation Convention](/en/context-layered/implementation-convention) | `pnpm convention:check` and example checks |

For local pre-PR receipt verification ([Local-First Verification Policy](../../LOCAL_FIRST_VERIFICATION_POLICY.md)), run `pnpm verify:quick` (fast smoke) or `pnpm verify` (full 17-step local suite) and verify with `pnpm verify:receipt`. For a full release candidate preflight, use `pnpm verify:all`; it composes the repository checks rather than replacing focused evidence.

## Grouped by Role

### 1. Documents that define the standard

- [Spec-to-Code Authoring Guide](/en/context-layered/spec-to-code-authoring-guide)
  - single end-to-end blueprint mapping IIC and 3-tier state rules through `contexts / business / runtime / handlers / actions / hooks / views`, the 4-role pipeline hierarchy, and verification gates
- [Convention Alignment Plan](/en/context-layered/convention-alignment-plan)
  - current-state classification, fixed provider order, and migration gates
- [Package Boundary and Codebase Management](/en/context-layered/package-boundary-convention)
  - package ownership, dependency direction, package lifecycle, and cleanup rules
- [Repository Surface Catalog](/en/context-layered/repository-surface-catalog)
  - machine-verifiable base specification and inventory for workspace API packages, canonical example routes / demos, and managed documents ([CA-SURFACE-CATALOG-001](/en/context-layered/decisions/CA-SURFACE-CATALOG-001))
- [Mutative Core History and Upstream References](/en/context-layered/mutative-core-history)
  - Mutative source lineage, carried upstream fixes, licensing, and synchronization rules
- [Implementation Convention](/en/context-layered/implementation-convention)
  - the standard implementation-playbook rule set
- [Core Action Contracts](../../../packages/core/docs/action-contracts.md)
  - framework-neutral dispatch, lifecycle trace, and action-to-state boundary
- [XState & Effect Integration Contracts](../../../packages/xstate/docs/xstate-effect-integration.md)
  - separated `.` and `./effect` adapter boundaries, philosophical invariants, Standard Schema guards, and transaction scopes ([CA-STATECHART-EFFECT-001](/en/context-layered/decisions/CA-STATECHART-EFFECT-001))
- [React State Contracts](../../../packages/react/docs/state-contracts.md)
  - Store reader/writer roles, safe reads, transactions, timeline, and inspector boundary
- [Specification, Issue, and Documentation Management](/en/context-layered/change-management-convention)
  - issue lifecycle, contract traceability, decision records, and handoff evidence
- [Interaction Intent Contract (IIC)](/en/context-layered/interaction-intent-contract)
  - explicit interaction agreements, removed affordances, trade-offs, and follow-up UI evidence
- [Interaction Intent to Implementation Flow](/en/context-layered/interaction-intent-implementation-flow)
  - design-to-code mapping across Context-Action layers and focused evidence gates
- [Architecture Decision Records](/en/context-layered/decisions/)
  - durable home and template for package, protocol, persistence, and compatibility decisions (including [CA-SPEC-EVIDENCE-001](/en/context-layered/decisions/CA-SPEC-EVIDENCE-001) and accepted vNext blueprint [CA-VNEXT-ARCHITECTURE-001](/en/context-layered/decisions/CA-VNEXT-ARCHITECTURE-001))
- [Phase 2 (`v5`) Migration & Readiness Guide](/en/context-layered/v5-migration-readiness)
  - `4.x` non-breaking preparation recipes, `pnpm audit:v5-readiness` AST baseline, and Phase 2 (`v5` major) admission gates
- [Unified Triad (`ttsc-ex` · `oa-sdk`) Responsibility Split and Self-Serve Sync Guide](/en/context-layered/triad-evidence-sync-guide)
  - 3-workspace responsibility boundaries, generated contract `@evidenceReview` locks, intent separation, and self-serve pull workflow
- [Tool-Calling Web Studio Convention](/en/context-layered/usecase-tool-calling-web-studio)
  - tool registry, policy, workspace mutation, observable subscriptions, and live preview boundaries
- [Panel Layout Preference Convention](/en/context-layered/usecase-panel-layout)
  - presentation-only panel state, bounded resizing, persistence, and Store Context promotion criteria
- [Tool-Calling Editor Architecture](/en/concept/tool-calling-editor-architecture)
  - detailed catalog, approval, trace, persistence, and preview reference implementation
- [Folder Structure](/en/context-layered/architecture/folder-structure)
  - responsibility split across `contexts / business / handlers / actions / hooks / views`
- [Handler Registry](/en/context-layered/architecture/handler-registry)
  - handler registration and separation rules

### 2. Documents that explain logic and transitions

- [Explicit State Machine](/en/context-layered/patterns/explicit-state-machine)
  - how to lock complex async flows as `state + event + transition`
- [Context-Layered Overview](/en/context-layered/context-layered-guide)
- [Store Selection and Usage Guide](/en/context-layered/store-selection-and-usage-guide)
  - decision matrix and usage patterns across `createStoreContext`, `createStore`, `TimeTravelStore`, `store-core`, `/backend`, `/advanced`, `RefContext`, `xstate`, `preact`, `lit`, and `tool-durable-operations`
- [Usecase and Recipe Profile](/en/context-layered/usecase-recipe-profile)
  - the high-level architectural picture
- [Integration Profiles](/en/context-layered/integration-profiles)
  - versioned external-domain lifecycle, ownership, compatibility, and evidence catalogs
- [Migration Guide](/en/context-layered/migration-guide)
  - how to move older structures into this model

### 3. Documents that demonstrate the implementation

- [Canonical Order Form Example](/en/examples/canonical-order-form)
  - the base canonical example
- [Access Request Playbook Example](/en/examples/access-request-playbook)
  - approval/review workflow example
- [Incident Escalation Playbook Example](/en/examples/incident-escalation-playbook)
  - incident/escalation workflow example
- [Renewal Risk Review Playbook Example](/en/examples/renewal-risk-review-playbook)
  - renewal/customer-success workflow example
- [Playbook Scenario Library](/en/examples/implementation-playbook-scenarios)
  - scenario extensions that follow the same skill and convention

### 4. Documents that define verification

- [Documentation and Development Management](/en/concept/documentation-development-conventions)
  - canonical doc ownership, LLMS sync, build order, compile-checked snippets, and docs gates (`pnpm docs:check`)
- [Local-First Verification Policy](../../LOCAL_FIRST_VERIFICATION_POLICY.md)
  - single local entrypoints (`pnpm verify`, `pnpm verify:quick`) and RFC 8785 cryptographic receipt rules (`pnpm verify:receipt`)
- [Stability Test Cycle](/en/context-layered/stability-test-cycle)
  - how to split contract tests, scenario tests, and stress validation
- [Next Work and Documentation Ownership](/en/context-layered/next-work)
  - the single backlog and source-of-truth map for follow-up work

The repository convention & surface-catalog gate runs via:

```bash
pnpm convention:check
```

(`pnpm convention:check` invokes `node scripts/verify-context-action-conventions.mjs`, checking Context-Layered boundaries, example use-case recipes, MCP/function-calling catalog, integration profiles, repository surface catalogs via `pnpm verify:surface-catalog`, and standalone Web Studio action boundaries.) Use `pnpm web-coding:verify` for standalone build, filesystem, provider, preview, and browser release checks.

## Enforcement Scope: CI-Enforced vs. Advisory / Cross-Repo

Not every rule in this index has the same enforcement mechanism:

| Scope | Conventions Covered | How It Is Checked |
| --- | --- | --- |
| **CI-Enforced in this repo** | `package-boundary-convention`, `repository-surface-catalog` (`CA-SURFACE-CATALOG-001`), `documentation-development-conventions`, `implementation-convention` (all 7 structural & AST rules + fail-closed `layered-surface-classification.json` / `rule-exceptions.json` across `example/src` and `packages/template-react/src`), `change-management-convention`, `LOCAL_FIRST_VERIFICATION_POLICY` | Automated scripts & PR CI: `pnpm package-boundary:check`, `pnpm verify:surface-catalog`, `pnpm convention:check` (`--root <dir>` for external consumers), `pnpm docs:check`, `pnpm verify:doc-snippets`, `pnpm change:traceability`, `pnpm verify:quick` / `pnpm verify:receipt` |
| **Advisory / Cross-Repo** | 4-role hooks (`Guard`/`Command`/`Result`/`Observer`), `BusinessActionIntent` vs. `LayoutActionIntent` split, domain events, `interaction-intent-contract` (IIC checklists), 2-Second State Rule (`CA-SPEC-EVIDENCE-001`), `triad-evidence-sync-guide` (`ttsc-ex` · `oa-sdk`), `usecase-panel-layout` | Design/PR review guidance, `packages/template-react` starter reference, and optional sibling-workspace tooling; local `context-action` CI checks repo-local docs/convention parity only |

## Reading Paths by Goal

### For architecture alignment

1. [Implementation Convention](/en/context-layered/implementation-convention)
2. [Specification, Issue, and Documentation Management](/en/context-layered/change-management-convention)
3. [Interaction Intent Contract (IIC)](/en/context-layered/interaction-intent-contract)
4. [Interaction Intent to Implementation Flow](/en/context-layered/interaction-intent-implementation-flow)
5. [Unified Triad (`ttsc-ex` · `oa-sdk`) Responsibility Split and Self-Serve Sync Guide](/en/context-layered/triad-evidence-sync-guide)
6. [Explicit State Machine](/en/context-layered/patterns/explicit-state-machine)
7. [Stability Test Cycle](/en/context-layered/stability-test-cycle)

For a stateful action that updates more than one Store, read the [Core Action
Contracts](../../../packages/core/docs/action-contracts.md) and [React State
Contracts](../../../packages/react/docs/state-contracts.md) together. Core emits
dispatch traces but never infers Store ownership; the React layer opens an
explicit transaction with named participants.

### For implementer onboarding

1. [Canonical Order Form Example](/en/examples/canonical-order-form)
2. [Access Request Playbook Example](/en/examples/access-request-playbook)
3. [Incident Escalation Playbook Example](/en/examples/incident-escalation-playbook)
4. [Renewal Risk Review Playbook Example](/en/examples/renewal-risk-review-playbook)

### For designing new scenarios

1. [Playbook Scenario Library](/en/examples/implementation-playbook-scenarios)
2. [Implementation Convention](/en/context-layered/implementation-convention)
3. [Unified Triad Self-Serve Sync Guide](/en/context-layered/triad-evidence-sync-guide)
4. repo-local skills: `.agents/skills/context-action-implementation-playbook/SKILL.md`, `skills/context-action-implementation-playbook/SKILL.md`

### For tool-calling web studios

1. [Tool-Calling Web Studio Convention](/en/context-layered/usecase-tool-calling-web-studio)
2. [Specification, Issue, and Documentation Management](/en/context-layered/change-management-convention)
3. [Panel Layout Preference Convention](/en/context-layered/usecase-panel-layout)
4. [Tool-Calling Editor Architecture](/en/concept/tool-calling-editor-architecture)
5. [Standalone Web Studio README](../../../demos/bolt-style-editor/README.md)

## Read Alongside the Starter Template & Example App

The docs make more sense when paired with the canonical starter template and live demos:

- `@context-action/template-react` starter (`packages/template-react/src/features/order-workspace/`)
- `/patterns/implementation-playbook`
- `/patterns/implementation-playbook/access-request`
- `/patterns/implementation-playbook/incident-escalation`
- `/patterns/implementation-playbook/renewal-risk-review`
- `/foundations/react/headless-di`
- standalone `/web-coding/` release

## One-Line Summary

Choose the source of truth first, make the smallest matching change, update
only its derived artifacts, and run the gate that proves that boundary.
