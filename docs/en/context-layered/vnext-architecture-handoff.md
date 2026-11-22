# vNext Architecture & Cross-Project Handoff Guide

**Status:** Phase 1 (`M0–M4`) & Phase 2 (`v5` React breaking cleanup & default harmonization) implemented on `stage` (rollback checkpoint `checkpoint/pre-phase2-v4` @ `240b2b32`; package versions & npm publish remain frozen)  
**Baseline:** `stage` branch (`@context-action/core@1.3.1`, `@context-action/store-core@0.1.4`, `@context-action/mutative-core@0.8.14`, `@context-action/mutative@0.8.15`, `@context-action/react@4.0.7`, `@context-action/lit@0.1.4`, `@context-action/preact@0.1.3`; package versions frozen on `stage`)

This document equips a sibling consumer project or the next architecture review session with exact baseline rules, reading paths, Phase 1 & Phase 2 implementation coverage, open design boundaries, and ready-to-paste prompts.

---

## 1. Baseline & Freeze Rules

- **Active branch:** `stage` (rollback checkpoint `checkpoint/pre-phase2-v4` preserved at `240b2b32`; keep all pre-release work off `main` until an approved integration window).
- **Published contract & version freeze:** Package versions and npm releases remain frozen on `stage`. Note that **Phase 2 (`v5` React surface cleanup)** is now active on `stage` (`createActionContext` default `useConcurrencyQueue: false`, `Store` default `notificationMode: 'immediate'`, slimmed root `.` exports, removed deprecated React compatibility APIs, and `./refs`/`./time-travel`/`./transactions` standalone subpaths), while `@context-action/core` retains `registerEffect` for `1.x` compatibility.
- **No thin React hook wrappers for already-composable patterns:** Context-Action intentionally treats the 5 OOP × React built-in hook archetypes (`useImperativeHandle`, `useLocalStore`/`useReducer`, `useDeferredValue`, React 19 `useOptimistic`/`useTransition`/`useActionState`, and isomorphic `useLayoutEffect`/`useEffect`) as documented usage patterns rather than adding thin wrapper APIs.

---

## 2. Required Reading Map

Read these paired documents before proposing API changes or migrating consumer code:

1. **Architecture Blueprint & Evidence (Accepted Phase 1 · Phase 2 Readiness):**
   - [CA-VNEXT-ARCHITECTURE-001](./decisions/CA-VNEXT-ARCHITECTURE-001.md) — Hub-and-Spoke target architecture, verified file/line evidence across Tracks A/B/C, and phased 4.x / v5 roadmap.
   - [Phase 2 (`v5`) Migration & Readiness Guide](./v5-migration-readiness.md) — `4.x` non-breaking preparation recipes, `pnpm audit:v5-readiness` AST baseline, and Phase 2 admission criteria.
2. **Authoring Standards & Right-Sized Adoption:**
   - [Best Practices](../guide/best-practices.md) — Level 1 (Lite) / Level 2 (Headless-First Symmetric DI) / Level 3 (Full 6-Layer) ladder and the 7 CI-enforced rules (`pnpm convention:check`).
   - [Convention Index](./convention-index.md) — Central governance entrypoint and verification scopes.
3. **Code Patterns & OOP × React Built-in Hook Archetypes:**
   - [Code Patterns](../guide/code-patterns.md) — Unified recipe index linking the 5 OOP × React usage patterns (covered by `packages/react/__tests__/patterns/oop-react-hooks-patterns.integration.test.tsx`):
     - [Imperative Handle Facade](../guide/patterns/ref/imperative-handle-facade.md)
     - [Local State Imperative Handle](../guide/patterns/ref/local-state-imperative-handle.md)
     - [Deferred View Subscription](../guide/patterns/store/deferred-view-subscription.md)
     - [Optimistic & Transition UI (React 19)](../guide/patterns/async/optimistic-and-transition-ui.md)
     - [External OOP Lifecycle Bridge](../guide/patterns/ref/external-oop-lifecycle.md)
4. **Canonical Runtime & State Contracts:**
   - [Store Selection and Usage Guide](./store-selection-and-usage-guide.md)
   - [Core Action Contracts](../../../packages/core/docs/action-contracts.md)
   - [React State Contracts](../../../packages/react/docs/state-contracts.md)

---

## 3. Open Feedback Decision Gates (Resolve Before Implementation)

Sibling/consumer feedback should explicitly take a position on the 4 open decisions defined in [CA-VNEXT-ARCHITECTURE-001](./decisions/CA-VNEXT-ARCHITECTURE-001.md):

1. **Default `Store` Notification Mode (`packages/react/src/stores/core/Store.ts:105`):** Switch concrete `Store` defaults from `'batched'` (16ms RAF) to synchronous `'immediate'` (aligning with `createStateStore()` and React 18/19 automatic batching, leaving `'raf'` + `RefContext` opt-in), or keep `'batched'`?
2. **`defineRuntime` + `bindReactRuntime` vs. Independent Primitives:** Should Context-Action add an optional Level 1↔2 bridge factory, or preserve strictly separate `Action` / `Store` / `Ref` declarations?
3. **Mutative / TimeTravel Placement:** Extract `Store` & `TimeTravelStore` into a framework-neutral Layer 1 package (shared across React/Lit/Preact), or limit Phase 1 to accepting `StateReader<T>` / `StateBackend<T>` natively inside `@context-action/react`?
4. **Semver Target:** Prioritize non-breaking **4.x additive** steps first, or lock a complete **v5 major** breaking blueprint?

### 3.1 Cross-Project Audit Findings & Recommended Resolutions (7 Consumer Repos)

| Decision Gate | Empirical Evidence from 7 Consumer Repositories | Recommended Resolution |
|---|---|---|
| **1. Default `Store` Notification Mode** | `packages/react/UNRELEASED.md:6-10` already adds non-breaking `notificationMode?: 'batched' | 'immediate'` opt-in on 4.x while keeping existing RAF timing intact for legacy callers (`iframe-demo`, `graph-hub`, `ae-editor`). | **Keep `'batched'` default in 4.x** with opt-in `'immediate'`; revisit flipping the default only in **v5**. |
| **2. `defineRuntime` / `bindReactRuntime`** | `google-tools` (`runtime.ts:1-24`) and `browser-studio` (`shared.ts:86-90`) repeatedly hand-write `{ store, actions, dispose }` runtime facades, while `houdini-flow` and Level 3 apps rely on explicit separation. | Keep **independent primitives primary**; evaluate an optional Level 1↔2 bridge only after M1/M3 land. |
| **3. `StateBackend` & TimeTravel Placement** | `macrostructure` (`interface-intent-runtime-react.ts:15-32`) mirrors stores via `useEffect` because React `useStoreValue` rejects `StateReader<T>`, `google-tools` contrasts Lit's native `StateStore` acceptance, and `browser-studio` + `ae-editor` `.mjs` tests prove non-React demand for `TimeTravelStore`. | **M1 (P0):** Native `StateReader<T>` / `StateBackend<T>` in React hooks & `createStoreContext`.<br>**M3 (P1):** Framework-neutral Timeline/TimeTravel engine with React `.` re-exports preserved. |
| **4. Semver Horizon** | `ae-editor`, `iframe-demo`, `graph-hub`, and `macrostructure` previously imported from `@context-action/react` root `.` (`0.8.x`–`3.0.0`/`4.x`). | **Phase 1 completed 4.x Non-Breaking alignment**, and **Phase 2 (`v5`) root barrel slimming + default harmonization is now active on `stage`** (with rollback checkpoint `checkpoint/pre-phase2-v4` @ `240b2b32`). |

### 3.2 Phase 1 (`M0–M4`) & Phase 2 (`v5`) Implementation Status on `stage`

Full contract targets, file ownership, and acceptance commands live in Section 9 of [CA-VNEXT-ARCHITECTURE-001](./decisions/CA-VNEXT-ARCHITECTURE-001.md). All five Phase 1 milestones (`M0–M4`) and Phase 2 (`v5`) React breaking cleanup are implemented and verified on `stage`:

- **M0 (`Done` · Baseline Sync):** Concurrent `packages/react` 4.x improvements (`StoreNotificationMode`, `useRefController`, `useDebugValue`, OOP docs) and baseline receipt (`e1bdf4a7`).
- **M1a & M1b (`Done` · P0 · Track A1):** `useStoreValue`, `useStoreValues`, `useStoreSelector`, `useStorePath`, `useTimeTravelControls`, `useTimeTravelPath`, `useTimeTravelSelector`, `ExternalStoresMap` (`ExternalStoreInput`), and `ExternalTimeTravelStoresMap` (`ExternalTimeTravelStoreInput`) accept `StateReader<T>` / `StateBackend<T>` / `TimelineBackend<T>` natively without manual `BackendStore` wrapping.
- **M2 (`Done` · P1 · Track B1):** `@context-action/core` adds generic `ActionRegisterConfig<T>.actions` (`ActionQueuePolicy`, `ActionPolicyConfig`: `queue: 'serial' | 'immediate'`, `timeout?: number`) and `createActionContext` forwarding while preserving 4.x defaults.
- **M3 (`Done` · P1 · Track A2):** `@context-action/mutative` Layer 1 `MutativeStateBackend` and `MutativeTimelineBackend` align with `StateStore`, `TransactionBackend`, and dynamic `getNotificationMode()` / `setNotificationMode()`, working natively with both React and non-React callers without creating a new package.
- **M4a & M4b (`Done` · P2 · Track C1 & B2):** Added opt-in React subpaths (`./refs` [Mutative-free], `./time-travel`, `./transactions`) and symmetric dispatch hooks (`useActionResultDispatch()`, `useActionScope()`, `ActionScopeReturn`) while keeping 100% root `.` exports and `api-surface.v1.json` / boundary gates aligned.

---

## 4. Copy-Pasteable Instruction / Prompt Kit

### Prompt 1 — Sibling / Consumer Project Audit & Feedback Collection

```text
Inspect how this consumer/sibling workspace currently uses `@context-action/*` (`ActionRegister`, `createActionContext`, `createStoreContext`, `createStore`, `StateBackend`/`store-core`, `createRefContext`, `TimeTravelStore`, OOP bridges).

Cross-reference our real usage and pain points against the Context-Action `stage` baseline docs:
1. `docs/ko/context-layered/decisions/CA-VNEXT-ARCHITECTURE-001.md` (Tracks A/B/C & 4 Open Decisions)
2. `docs/ko/guide/best-practices.md` (Level 1/2/3 Right-Sized Adoption)
3. `docs/ko/guide/code-patterns.md` & the 5 OOP x React built-in hook patterns

Strict constraint: Do NOT change `context-action` library contracts prematurely. Produce a structured feedback report covering:
- Current package versions & import subpaths we rely on (including deprecated APIs like `useActionEffectHandler` or `compareStrategy`, if any)
- Friction encountered (queue deadlocks requiring `{ immediate: true }`, Store `'batched'` RAF delays vs synchronous commits, Level 1->2 double wiring, `store-core` `BackendStore` wrapping, OOP ref bridges)
- Concrete recommendation for each of the 4 Open Decision Gates + any breaking-change blockers we need coordinated before implementation.
```

### Prompt 2 — `context-action` Design Finalization & ADR Acceptance

```text
Continue from `stage` in `context-action` (`docs/ko/context-layered/decisions/CA-VNEXT-ARCHITECTURE-001.md` and `docs/ko/context-layered/vnext-architecture-handoff.md`).

Using the collected cross-project feedback report:
1. Resolve the 4 Open Decision Gates in Section 6 of `CA-VNEXT-ARCHITECTURE-001`.
2. Update `CA-VNEXT-ARCHITECTURE-001` (or split per-track `accepted` `CA-*` records) with concrete TypeScript contracts, non-goals, and deprecation/migration timelines.
3. Produce a contract-first implementation plan on `stage` (starting with Phase 1 additive changes before any v5 breaking changes), keeping `catalog/repository-surface/api-surface.v1.json` and EN/KO docs in lockstep.
Do NOT merge to `main` or bump/publish versions without an approved release plan.
```

### Prompt 3 — Implementation & Verification Guardrails (After ADR Acceptance)

```text
Before committing any Phase 1 or vNext code changes on `stage`:
- Keep changes contract-first and update `catalog/repository-surface/api-surface.v1.json`, `packages/*/README.md`, and `packages/*/docs/*.md`.
- Maintain strict EN/KO doc pairing and run:
  pnpm docs:llms && pnpm docs:check && pnpm verify:doc-snippets && pnpm convention:check && pnpm package-boundary:check
- Verify workspace builds/tests in dependency order (`pnpm build && pnpm test`) plus React 18/19 compatibility when public exports or types change.
- Refresh `.verification/local-receipt.json` on clean source via `pnpm verify:quick` (or full `pnpm verify`) and confirm `pnpm verify:receipt` prints `✔ [VALID]`.
- Cite `CA-SURFACE-CATALOG-001` (and the accepted `CA-*` ID) in commit messages. Never push directly to `main`, run `pnpm release`, bump versions, or publish outside approved workflows.
```
