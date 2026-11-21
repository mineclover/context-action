# vNext Architecture & Cross-Project Handoff Guide

**Status:** Active handoff reference for cross-project feedback  
**Baseline:** `stage` branch (`@context-action/core@1.3.1`, `@context-action/store-core@0.1.4`, `@context-action/mutative-core@0.8.14`, `@context-action/mutative@0.8.15`, `@context-action/react@4.0.7`, `@context-action/lit@0.1.4`, `@context-action/preact@0.1.3`)

This document equips a sibling consumer project or the next architecture review session with exact baseline rules, reading paths, open feedback gates, and ready-to-paste prompts so design feedback can be collected safely without disrupting concurrent cross-project work.

---

## 1. Baseline & Freeze Rules

- **Active branch:** `stage` (keep all pre-release design and stabilization work off `main` until an approved integration window).
- **Published contract freeze:** Sibling/external projects are actively modifying or integrating against the current `@context-action/*` 4.x / 1.x / 0.x contracts. **Do NOT alter runtime code, public exports, `package.json` versions, or `catalog/repository-surface/api-surface.v1.json`** while collecting design feedback.
- **No thin React hook wrappers for already-composable patterns:** Context-Action intentionally treats the 5 OOP × React built-in hook archetypes (`useImperativeHandle`, `useLocalStore`/`useReducer`, `useDeferredValue`, React 19 `useOptimistic`/`useTransition`/`useActionState`, and isomorphic `useLayoutEffect`/`useEffect`) as documented usage patterns rather than adding thin wrapper APIs.

---

## 2. Required Reading Map

Read these paired documents before proposing API changes or migrating consumer code:

1. **Architecture Blueprint & Evidence (Proposed Draft):**
   - [CA-VNEXT-ARCHITECTURE-001](./decisions/CA-VNEXT-ARCHITECTURE-001.md) — Hub-and-Spoke target architecture, verified file/line evidence across Tracks A/B/C, and phased 4.x / v5 roadmap.
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
| **4. Semver Horizon** | `ae-editor`, `iframe-demo`, `graph-hub`, and `macrostructure` all import directly from `@context-action/react` root `.` (`0.8.x`–`3.0.0`/`4.x`). | Commit **Phase 1 strictly to 4.x Non-Breaking (Additive)**; defer breaking cleanups to **v5 Major**. |

### 3.2 Phase 1 (4.x Additive) Execution Plan Summary (`M0–M4`)

Full contract targets, file ownership, and acceptance commands live in Section 9 of [CA-VNEXT-ARCHITECTURE-001](./decisions/CA-VNEXT-ARCHITECTURE-001.md):

- **M0 (Baseline Sync Prerequisite):** Let active concurrent `packages/react` 4.x edits (`StoreNotificationMode`, `useRefController`, `useDebugValue`, OOP docs) settle and commit cleanly on `stage`.
- **M1 (P0 · Track A1):** Widen `useStoreValue`, `useStoreSelector`, and `ExternalStoresMap<T>` (`createStoreContext().Provider stores={...}`) to accept `StateReader<T>` / `StateBackend<T>` directly without manual `BackendStore` wrapping.
- **M2 (P1 · Track B1):** Add optional per-action scheduling policy (`actions?: Partial<Record<ActionNames<T>, { queue?: 'serial' | 'immediate'; timeout?: number }>>`) in `@context-action/core` while preserving current defaults.
- **M3 (P1 · Track A2):** Extract framework-neutral `TimeTravelStore` / `TimelineBackend<T>` capabilities into Layer 1 while retaining full backward-compatible re-exports on `@context-action/react` root `.`.
- **M4 (P2 · Track C1 & B2):** Add opt-in React subpaths (`./refs`, `./time-travel`, `./transactions`) and symmetric dispatch hooks (`useActionResultDispatch()`, `useActionScope()`) with root `.` intact and full `api-surface.v1.json` + doc/boundary gate parity.

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
