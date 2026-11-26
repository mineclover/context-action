# Phase 2 (`v5`) Migration & Readiness Guide

This guide prepares application teams, template starters, and external consumers for **Phase 2 (`v5` major breaking cleanup)** under [`CA-VNEXT-ARCHITECTURE-001`](./decisions/CA-VNEXT-ARCHITECTURE-001.md). Every preparation step in this document runs on top of the current `4.x` release line without breaking existing root imports or freezing active development.

- **Status:** **Phase 2 (`v5`) implemented on `stage`** (rollback checkpoint `checkpoint/pre-phase2-v4` @ `240b2b32`; `packages/template-react/src` and `example/src` compliant with `0` blocking findings; package versions remain frozen pending release approval). External `4.x -> v5` consumers can continue using `pnpm audit:v5-readiness` to migrate incrementally.
- **Prerequisite Baseline:** [CA-VNEXT-ARCHITECTURE-001](./decisions/CA-VNEXT-ARCHITECTURE-001.md) (`M0–M4` & Phase 2 complete on `stage`) · [vNext Architecture Handoff Guide](./vnext-architecture-handoff.md)

## 1. Phase 1 (`4.x` Non-Breaking) vs. Phase 2 (`v5` Major) Boundary

Phase 1 delivered the target primitives without breaking existing `4.x` callers, and Phase 2 finalized the `@context-action/react` root surface cleanup and default alignment on `stage` (while keeping `@context-action/core` `registerEffect` for `1.x` compatibility):

| Area | Available in `4.x` (Additive / Non-Breaking) | Applied in Phase 2 (`v5` on `stage`) |
| :--- | :--- | :--- |
| React entrypoints | `@context-action/react/{refs,time-travel,transactions,backend}` subpaths live alongside root `.` re-exports | Specialized re-exports (`createRefContext`, `createTimeTravelStore*`, `StoreTransactionCoordinator`, `createBackendStore`, etc.) live solely on their subpaths |
| Dispatch hook symmetry & deprecations | `useActionResultDispatch()` and `useActionScope()` promoted as primary hooks; `useActionDispatchWithResult()` marked `@deprecated` | Removed `useActionDispatchWithResult`, `useActionEffectHandler`, `compareStrategy`, `StoreSchema`, and legacy React `TransactionBackend` facade (`@context-action/core` retains `registerEffect` for `1.x`) |
| Action queue policies | Contract-level `actions: { [name]: { queue, timeout } }` policies on `ActionRegister` / `createActionContext`, plus lazy `dispatchQueue` allocation for `{ immediate: false }` | Default `useConcurrencyQueue` in `createActionContext` aligned with Core (`false`); per-action serial queues opt in via `actions: { [name]: { queue: 'serial' } }` or `{ registry: { useConcurrencyQueue: true } }` |
| Store notifications | Explicit `notificationMode?: 'batched' \| 'immediate'` option on `Store`, `TimeTravelStore`, `createStoreContext`, and `createTimeTravelStoreContext` | Default `Store` `notificationMode` aligned to `'immediate'` (matching `createStateStore()` and React 18/19 batching; `'batched'` remains opt-in for explicit RAF coalescing) |

## 2. Consumer Migration Recipes (Safe in `4.x`, Ready for `v5`)

### 2.1 Move Ref, Time-Travel, Transaction, and Backend Imports to Subpaths

Before (`4.x` root barrel):

```ts
import {
  createActionContext,
  createRefContext,
  createTimeTravelStoreContext,
  StoreTransactionCoordinator,
} from '@context-action/react';
```

After (`4.x`-compatible & `v5`-ready):

<!-- @context-action-compile -->
```ts
import {
  createActionContext,
  createStoreContext,
  type ActionPayloadMap,
} from '@context-action/react';
import { createRefContext } from '@context-action/react/refs';
import {
  createTimeTravelStore,
  createTimeTravelStoreContext,
} from '@context-action/react/time-travel';
import { StoreTransactionCoordinator } from '@context-action/react/transactions';

export interface WorkspaceActions extends ActionPayloadMap {
  submitOrder: { orderId: string };
  resetDraft: void;
  retrySubmission: void;
}

export const {
  Provider: WorkspaceActionProvider,
  useActionDispatch: useWorkspaceDispatch,
  useActionResultDispatch: useWorkspaceResultDispatch,
  useActionScope: useWorkspaceScope,
} = createActionContext<
  WorkspaceActions,
  { submitOrder: { accepted: boolean } }
>('WorkspaceActions', {
  actions: {
    resetDraft: { queue: 'immediate' },
    retrySubmission: { queue: 'immediate', timeout: 5_000 },
  },
});

export const {
  Provider: WorkspaceStoreProvider,
  useStore: useWorkspaceStore,
} = createStoreContext('WorkspaceStores', {
  status: { initialValue: 'idle' as 'idle' | 'submitting', notificationMode: 'batched' },
  pendingCount: { initialValue: 0, notificationMode: 'immediate' },
});

export const WorkspaceRefs = createRefContext<{ focusInput: HTMLInputElement }>('WorkspaceRefs');
export const timelineStore = createTimeTravelStore(
  'workspace-timeline',
  { step: 0 },
  { maxHistory: 20, notificationMode: 'batched' }
);
export const TimeTravelCtx = createTimeTravelStoreContext('WorkspaceTimeTravel', {
  history: { initialValue: { step: 0 }, notificationMode: 'batched' },
});
export const coordinator = new StoreTransactionCoordinator();
```

### 2.2 Replace `useActionDispatchWithResult()` and Call-Site `{ immediate: true }`

Use `useActionResultDispatch()` for Provider-scoped result dispatch (or `useActionScope()` for component-unmount abort scopes), and declare `{ queue: 'immediate' }` in the `actions` policy map rather than repeating `{ immediate: true }` at UI call sites:

<!-- @context-action-compile -->
```tsx
import { type ActionPayloadMap, createActionContext } from '@context-action/react';

interface SearchActions extends ActionPayloadMap {
  runSearch: { query: string };
  cancelDraft: void;
}

interface SearchResults {
  runSearch: string[];
}

export const {
  useActionDispatch,
  useActionResultDispatch,
  useActionScope,
} = createActionContext<SearchActions, SearchResults>('SearchActions', {
  actions: {
    cancelDraft: { queue: 'immediate' },
  },
});

export function SearchControls() {
  const dispatch = useActionDispatch();
  const dispatchResult = useActionResultDispatch();
  const scope = useActionScope();

  const handleRun = async (query: string) => dispatchResult('runSearch', { query });
  const handleScopedRun = async (query: string) => scope.dispatchWithResult('runSearch', { query });
  const handleCancel = () => dispatch('cancelDraft');

  return (
    <div>
      <button type="button" onClick={() => void handleRun('context-action')}>Search</button>
      <button type="button" onClick={() => void handleScopedRun('scoped')}>Scoped</button>
      <button type="button" onClick={handleCancel}>Cancel</button>
    </div>
  );
}
```

### 2.3 Serialize Specific Dispatches Without a Global Concurrency Queue

When `useConcurrencyQueue` is omitted or disabled, explicit `{ immediate: false }` calls lazily allocate `ActionRegister`'s internal queue on demand so ad-hoc serial execution still works cleanly:

<!-- @context-action-compile -->
```ts
import { ActionRegister, type ActionPayloadMap } from '@context-action/core';

interface QueueActions extends ActionPayloadMap {
  syncItem: { id: string };
}

export async function dispatchSeriallyWithoutGlobalQueue() {
  const register = new ActionRegister<QueueActions>({
    name: 'LazySerialExample',
  });

  register.register('syncItem', async ({ id }) => {
    await Promise.resolve(id);
  });

  await Promise.all([
    register.dispatch('syncItem', { id: 'first' }, { immediate: false }),
    register.dispatch('syncItem', { id: 'second' }, { immediate: false }),
  ]);

  await register.destroyAsync({ deferCleanup: true });
}
```

## 3. Automated Readiness Auditor (`pnpm audit:v5-readiness`)

The repository ships a TypeScript AST auditor (`scripts/audit-v5-readiness.mjs`) that classifies consumer code without fragile regex matches (ignoring comments and string literals):

```bash
pnpm audit:v5-readiness                       # Human-readable summary across template-react and example
pnpm audit:v5-readiness -- --strict-template   # Fail if packages/template-react/src has blocking items
pnpm audit:v5-readiness -- --strict-all        # Fail if any scanned scope has blocking items
pnpm audit:v5-readiness -- --json              # Machine-readable report with file/line/column details
pnpm audit:v5-readiness -- --root ../my-app    # Scan an external consumer repository
pnpm test:v5-readiness                         # Run AST fixture & starter-compliance tests
```

### Audit Categories

| Category | Gate Role | What It Detects |
| :--- | :--- | :--- |
| `deprecatedApis` | Blocking (`--strict-template`, `--strict-all`) | `useActionDispatchWithResult`, `useActionEffectHandler`, `registerEffect`, `StoreSchema`, `defineStoreSchema`, `compareStrategy` |
| `rootSubpathImports` | Blocking (`--strict-template`, `--strict-all`) | Symbols imported from root `@context-action/react` that belong to `./refs`, `./time-travel`, `./transactions`, or `./backend` |
| `manualImmediateDispatches` | Blocking (`--strict-template`, `--strict-all`) | Call-site `{ immediate: true }` dispatch options instead of contract-level `actions: { <action>: { queue: 'immediate' } }` |
| `implicitStoreNotificationMode` | Advisory inventory | `createStore*` / `createTimeTravelStore*` definitions relying on default `notificationMode` without an explicit setting |

### Baseline Snapshot on `stage` (Pre-Phase-2 Checkpoint)

| Scope | Scanned Files | Blocking Total | Breakdown (`deprecatedApis` / `rootSubpathImports` / `manualImmediateDispatches`) | Advisory (`implicitStoreNotificationMode`) | Notes |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `packages/template-react/src` | 21 | **0** | `0 / 0 / 0` | 5 | Passes `--strict-template` and `--strict-all`; uses `@context-action/react/refs` and contract-level `actions` policies |
| `example/src` | 540 | **0** | `0 / 0 / 0` | 213 | Passes `--strict-all` cleanly; all subpath imports, `useActionScope`, and contract action queue policies migrated |

## 4. Phase 2 (`v5`) Completion & Release Governance Checklist

Phase 2 breaking removals and default harmonization are implemented on `stage` (with rollback checkpoint `checkpoint/pre-phase2-v4` preserved at `240b2b32`). Before tagging or bumping package versions in a dedicated `v5` release PR:

1. `pnpm audit:v5-readiness -- --strict-template`, `pnpm audit:v5-readiness -- --strict-all`, and `pnpm test:v5-readiness` remain green (`0` blocking findings across both `packages/template-react/src` and `example/src`).
2. External consumer apps upgrading from `4.x` resolve remaining `blockingTotal` items (`deprecatedApis`, `rootSubpathImports`, `manualImmediateDispatches`) reported by `pnpm audit:v5-readiness -- --root <app>`.
3. Release governance checks (`pnpm release:check`, `pnpm verify && pnpm verify:receipt`) and [Release Governance](../../../releases/RELEASE.md) approvals complete cleanly.
