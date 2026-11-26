# Testing Convention & Reusable Test Scenarios

**Status:** Active  
**Spec / Decision ID:** `CA-TESTING-CONVENTION-001`  
**Owner:** Framework Architecture & Verification Governance  
**Related Specs & Guides:**
- [Testing Context-Action by Boundary](/en/guide/testing-boundaries)
- [React UI Testing with `act`](/en/guide/react-testing-act)
- [Stability Test Cycle](/en/context-layered/stability-test-cycle)
- [Implementation Convention](/en/context-layered/implementation-convention)
- [Local-First Verification Policy](../../LOCAL_FIRST_VERIFICATION_POLICY.md)

This document standardizes how Context-Action packages, Context-Layered applications, and consumer repositories verify correctness on **Core `2.0.x`**, **Interactions `0.1.x`**, and **React `5.0.x`**. Instead of rewriting ad-hoc assertions per screen, teams classify each check into four **Test Tiers (`T1`–`T4`)** and prove every stateful workflow against six **Canonical Test Scenarios (`S1`–`S6`)**.

---

## 1. Four-Tier Testing Standard (`T1`–`T4`)

| Tier | Scope & File Location | Runtime & Setup | What It Proves |
| --- | --- | --- | --- |
| **`T1` · Pure Domain & Headless Runtime** | `business/*.test.ts`, `runtime/*.test.ts` | Node (`vitest` / `jest`), zero React, zero `act` | Deterministic draft creation, validation codes, domain events, FSM transitions, and pure-TS `ActionRegister` + `createStore` / `createStateStore` orchestration |
| **`T2` · Primitive & Subpath Contract** | `packages/*/__tests__/**/*.contract.test.ts(x)` | Node (Core/Store/Interactions) or JSDOM + `IS_REACT_ACT_ENVIRONMENT = true` (React) | 4-role pipeline (`Guard` / `Command` / `Result` / `Observer`), Dual-Lane (`lane: 'fast'` vs `'orchestrated'`), Store v5 `notificationMode: 'immediate'` default, `@context-action/react/{refs,time-travel,transactions,backend,advanced}` contracts |
| **`T3` · Context-Layered User Scenarios** | Colocated `*.test.tsx` / `*.integration.test.tsx` beside routes or starter features | JSDOM + `await act(async () => ...)` + fail-on-unwrapped-`act` + RTL / `userEvent` | End-to-end provider wiring (`Action -> Store -> Ref -> HandlerRegistry -> View`), user-visible state changes, ref-driven focus/scroll, controlled sync, and unmount cleanup |
| **`T4` · Governance, Catalog & Route Smoke** | `pnpm convention:check`, `pnpm verify:surface-catalog`, `pnpm example:impact`, `pnpm verify` | Static AST + build + browser route smoke + RFC 8785 receipt | 7 Context-Layered AST invariants, `CA-SURFACE-CATALOG-001` parity, clean-package hygiene (zero `.disabled` or unreferenced research reports), and cryptographic `pnpm verify:receipt` |

### Selection Rule Before Writing Tests

1. Pure calculation, validation code, or framework-neutral FSM -> write **`T1`**.
2. Library primitive guarantee or subpath contract -> write **`T2`**.
3. User-visible route or feature composition (`views/` + `handlers/` + `contexts/`) -> write **`T3`** covering **`S1`–`S6`**.
4. Structural boundary, surface parity, or release readiness -> enforce via **`T4`**.

---

## 2. Six Canonical Test Scenarios (`S1`–`S6`)

Every Context-Action feature or starter template proves the following standardized scenarios at the boundary that owns them:

### `S1` · Guard Rejection & Imperative Focus (Invalid Flow)

- **Given** invalid or incomplete input in the draft/form,
- **When** the user dispatches the business submission action,
- **Then** `useActionGuard` aborts the pipeline via `controller.abort(reason)`, domain store state does not enter `submitting`/`success`, a Layout intent (`LayoutActionIntent`) or `RefRegistry`/`RefContext` moves DOM focus to the first invalid field, and `useActionObserver(..., { when: 'failure' })` records a domain failure event.

### `S2` · Happy-Path State Machine & Result Collection (Valid Flow)

- **Given** valid input,
- **When** dispatch executes sequentially through `Guard` -> `Command`/`Result` -> `Observer`,
- **Then** explicit FSM phases transition deterministically (`idle -> submitting -> success`), structured results are observable, and subscribed views update declaratively from the Store.

### `S3` · Post-Success Draft Invalidation (Dirty Recovery)

- **Given** a settled `success` state with an active confirmation banner/result,
- **When** the user edits the draft again,
- **Then** the FSM transitions cleanly back to `idle` and clears stale completion artifacts before any subsequent dispatch runs.

### `S4` · Mid-Flight Reset / Unmount Cancellation (Abort & Zero Leak)

- **Given** an async timer, fetch, or transition currently in `submitting` state,
- **When** `reset` is dispatched or the feature unmounts mid-flight,
- **Then** advancing timers inside `await act(async () => ...)` completes with zero late state overwrites, zero stale `success` transitions, and zero React `not wrapped in act` warnings.

### `S5` · Selective Subscription & Zero-Re-Render Isolation (`useStorePath` + Dual-Lane `fast`)

- **Given** a multi-field store or a 120fps pointer scrub interaction:
  1. A subscriber using `useStorePath(store, ['user', 'name'], { select })` must perform **0 extra renders** when unrelated slices mutate.
  2. A high-frequency gesture (`usePointerGesture` + `useRefRegistry` + `lane: 'fast'`) updates the preview DOM directly with **0 committed React renders** until pointer release triggers `lane: 'orchestrated'` commit.

### `S6` · Scoped Isolation, Controlled Sync, Shared DI & Atomic Rollback

- **Scoped Isolation (`createScopedContext`)**: Two sibling Providers hold isolated local stores, refs, and handlers with zero cross-talk.
- **Controlled Sync (`useControlledStoreSync`)**: External prop updates sync via `onSync(draft, nextValue)` inside the same `store.update()` commit without infinite feedback loops.
- **Headless Shared DI (`ownership="shared"`)**: Externally created `ActionRegister` and `TimeTravelStoreManager` retain state and undo/redo history after the React view unmounts and remounts.
- **Atomic Rollback (`@context-action/react/transactions`)**: `StoreTransactionCoordinator` + `bindActionTransactions` rolls back every participating store when a guard aborts or a handler throws mid-transaction.

---

## 3. Compile-Checked Harness Patterns (Core `2.0` / React `5.0`)

Keep test harnesses pinned to public v5 subpaths (never use removed v4 root re-exports such as `createRefContext` or `StoreTransactionCoordinator` from `@context-action/react`):

<!-- @context-action-compile -->
```tsx
import {
  type ActionPayloadMap,
  createActionContext,
  createScopedContext,
  useStorePath,
} from '@context-action/react';
import {
  useControlledStoreSync,
  useRefRegistry,
  useStoreInstance,
} from '@context-action/react/advanced';

interface TabActions extends ActionPayloadMap {
  selectTab: { id: string };
}

interface TabState {
  selectedId: string;
  focusedId: string;
}

const TabActionCtx = createActionContext<TabActions>('ConventionTabActions', {
  actions: { selectTab: { lane: 'orchestrated', queue: 'serial' } },
});

export const TabScope = createScopedContext(
  'ConventionTabs',
  TabActionCtx,
  ({ selectedId }: { selectedId?: string }) => {
    const store = useStoreInstance<TabState>(() => ({
      selectedId: selectedId ?? 'overview',
      focusedId: selectedId ?? 'overview',
    }));

    // onSync mutates the current Mutative draft atomically (do not nest store.update)
    useControlledStoreSync(store, ['selectedId'], selectedId, {
      onSync(draft, nextId) {
        draft.focusedId = nextId;
      },
    });

    const refs = useRefRegistry<{ tablist: HTMLDivElement }>();

    TabActionCtx.useActionGuard('selectTab', ({ id }, controller) => {
      if (!id) controller.abort('tab id required');
    });

    TabActionCtx.useActionCommandHandler('selectTab', ({ id }) => {
      store.update((draft) => {
        draft.selectedId = id;
        draft.focusedId = id;
      });
    });

    return { store, refs };
  }
);

export function useIsOverviewSelected(): boolean {
  const { store } = TabScope.useScope();
  return useStorePath(store, ['selectedId'], {
    select: (id) => id === 'overview',
  });
}
```

### Standard `S1`–`S6` Test Template (Jest / Vitest + RTL)

```tsx
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

describe('Feature Scenarios (S1-S6)', () => {
  afterEach(() => {
    cleanup();
    // Always restore real timers if S4 enabled fake timers
  });

  it('S1: blocks invalid submit in Guard, focuses field via Ref, logs failure', async () => {
    render(<FeaturePage />);
    fireEvent.click(screen.getByTestId('submit-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('validation-error')).toBeInTheDocument();
      expect(document.activeElement).toBe(screen.getByTestId('primary-input'));
    });
  });

  it('S4: settles mid-flight reset with fake timers inside async act()', async () => {
    // Arrange with useFakeTimers(), trigger async submit, then click reset mid-flight
    await act(async () => {
      await Promise.resolve();
      // advance timers deterministically inside act() before asserting
    });
    expect(screen.getByTestId('phase-badge')).toHaveTextContent('IDLE');
  });
});
```

---

## 4. Repository Executable Proof Matrix

The canonical suites below continuously prove `T1`–`T4` and `S1`–`S6` in CI:

| Tier & Scenarios | Proof File | Gate |
| --- | --- | --- |
| `T2` · `S1`–`S6` Contract Proof | [`packages/react/__tests__/patterns/testing-convention-scenarios.contract.test.tsx`](../../../packages/react/__tests__/patterns/testing-convention-scenarios.contract.test.tsx) | `pnpm --filter @context-action/react test` |
| `T3` · `S1`–`S4` Starter Integration | [`packages/react/__tests__/patterns/template-react.integration.test.tsx`](../../../packages/react/__tests__/patterns/template-react.integration.test.tsx) | `pnpm --filter @context-action/react test` |
| `T3` · `S1`–`S4` Canonical Playbook | [`example/src/pages/patterns/implementation-playbook/CanonicalOrderExample.test.tsx`](../../../example/src/pages/patterns/implementation-playbook/CanonicalOrderExample.test.tsx) | `pnpm --filter example test` |
| `T3` · `S5` (`useStorePath { select }` & `useRefRegistry`) | [`example/src/pages/foundations/react/ProviderAndHooksErgonomics.test.tsx`](../../../example/src/pages/foundations/react/ProviderAndHooksErgonomics.test.tsx) | `pnpm --filter example test` |
| `T3` · `S5` + `S6` Headless Interactions & Dual-Lane | [`example/src/pages/integrations/headless-interactions/HeadlessInteractionsPage.test.tsx`](../../../example/src/pages/integrations/headless-interactions/HeadlessInteractionsPage.test.tsx) | `pnpm --filter example test` |
| `T3` · `S6` Shared-Ownership DI (`ownership="shared"`) | [`example/src/pages/foundations/react/headless-di/HeadlessDiPage.test.tsx`](../../../example/src/pages/foundations/react/headless-di/HeadlessDiPage.test.tsx) | `pnpm --filter example test` |
| `T3` · `S6` Atomic Transaction Rollback | [`example/src/pages/foundations/store/StoreBackendTransactionsPage.test.tsx`](../../../example/src/pages/foundations/store/StoreBackendTransactionsPage.test.tsx) | `pnpm --filter example test` |
| `T4` · Automated Testing-Convention & Hygiene Gate | [`scripts/verify-testing-convention.mjs`](../../../scripts/verify-testing-convention.mjs) | `pnpm convention:check` |

---

## 5. Hygiene & Anti-Pattern Guardrails

Enforced automatically by `pnpm convention:check` (`scripts/verify-testing-convention.mjs`):

1. **Strict `act` Environment**: Both `packages/react/__tests__/setup.ts` and `example/src/test/setup.ts` must enable `IS_REACT_ACT_ENVIRONMENT = true` and fail any test that emits `/not wrapped in act/i`. Never hide `act` warnings behind a global `console.error` mock.
2. **Zero Disabled Tests or Orphaned Research Reports**: Never keep `*.test.ts.disabled`, `*.test.tsx.disabled`, or ad-hoc `*_REPORT.md` / `*_ANALYSIS.md` research notes inside `packages/`. Historical records belong exclusively in `releases/` and `docs/releases/`.
3. **Public Entrypoint Parity**: New consumer tests and doc snippets must import from `@context-action/react`, `/refs`, `/time-travel`, `/transactions`, `/backend`, `/advanced`, `/utils`, or `@context-action/core` / `@context-action/interactions`, never internal `src/*` paths (except whitebox unit tests inside a package's own `__tests__/`).
4. **No Unstable Counts as Evidence**: Always cite current verification gates (`pnpm verify`, `pnpm convention:check`, `pnpm verify:receipt`) rather than historical test counts.
