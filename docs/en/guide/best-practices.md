# Best Practices

Engineering conventions, runtime safety guardrails, and right-sized adoption examples for building maintainable **Context-Action** applications.

> Looking for the full 6-layer governance specification or store primitive matrix? See [Conventions](../concept/conventions.md), [Convention Index](../context-layered/convention-index.md), and [Store Selection and Usage Guide](../context-layered/store-selection-and-usage-guide.md).

---

## ⚡ Quick Team Summary

Share these 6 rules first when aligning a team on Context-Action:

1. **Define boundaries before UI**: Declare typed `actions/` + `contexts/` contracts and pure domain helpers (`business/`) before writing view components.
2. **Read stores lazily in handlers, subscribe only in views**: Inside `handlers/`, call `store.getValue()`; never call `useStoreValue`, `useStoreSelector`, or `useStorePath` in handler code.
3. **Keep `actions/` dispatch-only and handle return values explicitly**: `actions/` hooks only wrap `dispatch` / `dispatchWithResult`; use `dispatchWithResult()` whenever callers need handler return values or abort reasons (`dispatch()` returns `Promise<void>`).
4. **Bypass serialized queues on interrupt/telemetry actions**: `createActionContext` enables `useConcurrencyQueue: true` by default — always pass `{ immediate: true }` to cancel, reset, retry, or live execution-step actions dispatched alongside an active async handler.
5. **Update Stores immutably**: Always return a new root object and shallow-clone collections (`new Map(prev.map)`, `[...prev.items]`) inside `store.update(...)`.
6. **Right-size your structure**: Match complexity to **Level 1 (Lite)**, **Level 2 (Headless-First Symmetric DI)**, or **Level 3 (Full 6-Layer)** instead of forcing 6 layers onto simple local UI.

---

## Right-Sized Adoption Matrix

Adopt the lightest structure that keeps ownership explicit and tests fast:

| Level | Best Fit | Modules / Primitives | Verification Focus | When NOT to Over-Engineer |
|---|---|---|---|---|
| **Local React State** | Single-component hover, accordion toggle, ephemeral UI flag | React `useState` / `useReducer` | Component test | Never create Actions or Stores just to toggle a local dropdown or tab |
| **Level 1 · Lite** | Single-domain widget or form with shared validation + derived state | 1× `createActionContext`, 1× `createStoreContext`, 1× `Registry` component + `View` | React Testing Library behavior test | Skip splitting into 6 folders until domain logic or cross-panel coordination grows |
| **Level 2 · Headless-First Symmetric DI** | Shared engine across vanilla JS, SSR/workers, multiple React trees, or unmount/remount persistence | Pure TS `ActionRegister` + `createStore`, `registerGuard/Result/Observer`, React `Provider ownership="shared"` | Pure Node/Vitest/Jest engine test + thin React mount/unmount DI test | Skip 6-layer route folders if the module exposes one cohesive engine API |
| **Level 3 · Full 6-Layer** | Multi-concern product feature, team-owned route, complex async flows + layout intents | `contexts / business / handlers / actions / hooks / views` + `BusinessActionIntent` vs `LayoutActionIntent` | `pnpm convention:check`, pure `business/` unit tests, Playwright/RTL flow tests | Do not use Level 3 for small utility popovers or isolated widgets |

---

## CI-Enforced Rules vs Advisory Conventions

Context-Action separates rules checked automatically by scripts (`pnpm convention:check`, `pnpm verify:surface-catalog`, `pnpm package-boundary:check`) from architectural guidelines reviewed during code review.

### Enforced by CI (`pnpm convention:check` & Boundary Gates)

1. **No store subscriptions in handlers (`no-store-subscription-in-handlers`)**: Static analysis rejects direct or aliased calls to `useStoreValue`, `useStoreSelector`, `useStorePath`, and reactive subscriptions inside `handlers/**`. Read `store.getValue()` inside callbacks instead.
2. **No `actions/` imports inside `handlers/` (`no-actions-import-in-handlers`)**: Handlers must not couple themselves to React action dispatch wrappers. Wire UI callbacks via props/injector interfaces or keep pure calculations in `business/`.
3. **Separated action intents (`no-mixed-intent-payloads`)**: Keep `BusinessActionIntent` (validation, API submission, state transitions) separate from `LayoutActionIntent` (focus management, panel scroll, viewport layout).
4. **Dispatch-only `actions/` hooks (`actions-dispatch-only`)**: Modules in `actions/` only expose `useCallback`-wrapped `dispatch` / `dispatchWithResult` helpers — no domain branching or store subscriptions.
5. **No raw DOM objects or events in Stores**: Reactive stores hold serializable/domain state only. Imperative DOM elements (`HTMLInputElement`, `ResizeObserver`, scroll containers) belong in `RefContext`.
6. **Single-source state owner**: Avoid duplicating identical mutable fields across multiple stores or React `useState` mirrors.
7. **Canonical package boundaries**: Workspace consumers import published entrypoints and package subpaths verified by `pnpm package-boundary:check`.

### Advisory Design Practices

- **Strict 6-layer directory layout (`Level 3`)**: Recommended for multi-developer features; optional for Level 1/2 widgets.
- **Observer `{ when: 'always' }`**: Recommended whenever an observer records validation failures, aborted dispatches, or audit timelines (`registerObserver` defaults to post-completion unless configured).
- **Queue preemption (`{ immediate: true }`)**: Design judgment per action based on whether it interrupts or observes an active handler.

---

## Production Do / Don't Checklist

### 1. Read State Lazily in Handlers (`store.getValue()`)

Subscribing to a Store inside a Handler component forces every handler hook and `useCallback` registration to churn on state changes and risks stale closures.

```tsx
// ❌ Don't: subscribes handler registry to every draft update
const draft = useStoreValue(draftStore);
useActionCommandHandler('submitOrder', useCallback(async () => {
  await submit(draft);
}, [draft]));

// ✅ Do: read latest snapshot on demand inside the handler
useActionCommandHandler('submitOrder', useCallback(async () => {
  const latestDraft = draftStore.getValue();
  await submit(latestDraft);
}, [draftStore]));
```

### 2. Choose `dispatch()` vs `dispatchWithResult()` Intentionally

`dispatch()` resolves to `Promise<void>`. Calling `controller.return(value)` or `controller.abort(reason)` is dropped for callers unless you use `dispatchWithResult()`.

- Use **`dispatch(action, payload)`** for fire-and-forget UI commands whose side effects flow cleanly into Stores.
- Use **`dispatchWithResult(action, payload)`** when the caller inspects `execution.outcome` (`'completed' | 'cancelled'`), `execution.result`, or `execution.abortReason` (such as cache hits, multi-tier fallback pipelines, or guarded edits).

### 3. Preempt Serialized Queues with `{ immediate: true }`

`createActionContext` sets `useConcurrencyQueue: true` by default so actions on the same context serialize deterministically. Two classes of actions **must** pass `{ immediate: true }`:

1. **Interrupt, cancel, reset, or retry actions** triggered while an async `submitOrder` or `fetchData` handler is awaiting — otherwise the reset stays blocked behind the slow promise it is trying to cancel.
2. **Live telemetry / progress actions** dispatched *from inside* a running handler on the same `ActionContext` — otherwise step logs wait until the parent scenario completes.

```tsx
const resetDraft = useCallback(
  () => businessDispatch('resetDraft', undefined, { immediate: true }),
  [businessDispatch]
);
```

### 4. Update Collections & State Objects Immutably

`Store` notifies subscribers by comparing references (`Object.is`). Mutating a `Map`, `Set`, or array returned by `store.update` skips notifications or leaks shared references across renders.

```ts
// ❌ Don't: mutates the existing Map instance in place
cacheStore.update((prev) => {
  prev.entries.set(key, entry);
  return prev;
});

// ✅ Do: clone the Map and return a new root object
cacheStore.update((prev) => {
  const nextEntries = new Map(prev.entries);
  nextEntries.set(key, entry);
  return { ...prev, entries: nextEntries };
});
```

### 5. Settle Cancelled Async Promises & Reset Terminal UI Phases

When an in-flight async workflow supports cancellation (`resetDraft`, `abort`, unmount cleanup):

- Track the active promise resolver/AbortController in a ref (`pendingResolveRef`) and resolve it (`resolve(false)`) during cancel and unmount cleanup so callers never hang forever or leak stale `await` continuations.
- Model an explicit user-edit transition (for example `{ type: 'draft_edited' }`) in pure domain state machines so a `'success'` or `'failed'` banner cleanly transitions back to `'idle'` when the user edits an input again.

### 6. Separate `BusinessActionIntent` from `LayoutActionIntent` & Drive DOM with `RefContext`

Keep business validation in `businessDispatch('submitOrder')` and UI imperatives (scrolling, focusing an invalid field) in `layoutDispatch('focusField', { field })` backed by `createRefContext`. For RAF-batched stores (`Store` default `notificationMode: 'batched'`), keep 60fps imperative coordinates inside `RefContext` rather than dispatching Store updates on every frame — and remember in tests under fake timers that `Store` updates flush on a 16ms `requestAnimationFrame` tick.

---

## Verified Right-Sized Implementation Examples

All TypeScript examples below are compile-checked automatically by `pnpm verify:doc-snippets` (`<!-- @context-action-compile -->`).

### Level 1 · Lite (Single-Domain Coupon Widget)

Ideal for an interactive calculator, coupon bar, or filter panel in one React subtree. No separate `business/` or `actions/` directories are required until the domain grows.

<!-- @context-action-compile -->
```tsx
import { useCallback } from 'react';
import type { ActionPayloadMap } from '@context-action/core';
import {
  createActionContext,
  createStoreContext,
  useStoreValue,
} from '@context-action/react';

interface CouponQuote {
  readonly appliedCode: string | null;
  readonly totalAmount: number;
  readonly errorCode: 'empty_code' | 'unknown_coupon' | null;
}

const VALID_COUPONS: Record<string, number> = { SAVE10: 10, TEAM25: 25 };

function evaluateCoupon(rawCode: string, subtotal: number): CouponQuote {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { appliedCode: null, totalAmount: subtotal, errorCode: 'empty_code' };
  const pct = VALID_COUPONS[code];
  if (pct === undefined) {
    return { appliedCode: null, totalAmount: subtotal, errorCode: 'unknown_coupon' };
  }
  return {
    appliedCode: code,
    totalAmount: Math.round(subtotal * (1 - pct / 100)),
    errorCode: null,
  };
}

interface LiteCouponActions extends ActionPayloadMap {
  applyCoupon: { code: string };
  clearCoupon: void;
}

const {
  Provider: LiteCouponActionProvider,
  useActionDispatch: useLiteCouponDispatch,
  useActionCommandHandler: useLiteCouponCommand,
} = createActionContext<LiteCouponActions>('LiteCouponActions');

const {
  Provider: LiteCouponStoreProvider,
  useStore: useLiteCouponStore,
} = createStoreContext('LiteCouponStores', {
  subtotal: 100,
  quote: { appliedCode: null, totalAmount: 100, errorCode: null } as CouponQuote,
});

function LiteCouponRegistry() {
  const subtotalStore = useLiteCouponStore('subtotal');
  const quoteStore = useLiteCouponStore('quote');

  useLiteCouponCommand(
    'applyCoupon',
    useCallback(
      ({ code }) => {
        quoteStore.setValue(evaluateCoupon(code, subtotalStore.getValue()));
      },
      [quoteStore, subtotalStore]
    )
  );

  useLiteCouponCommand(
    'clearCoupon',
    useCallback(() => {
      quoteStore.setValue({
        appliedCode: null,
        totalAmount: subtotalStore.getValue(),
        errorCode: null,
      });
    }, [quoteStore, subtotalStore])
  );

  return null;
}

export function LiteCouponWidget() {
  const quote = useStoreValue(useLiteCouponStore('quote'));
  const dispatch = useLiteCouponDispatch();

  return (
    <div>
      <span>{quote.totalAmount}</span>
      <button type="button" onClick={() => void dispatch('applyCoupon', { code: 'SAVE10' })}>
        Apply SAVE10
      </button>
      <button type="button" onClick={() => void dispatch('clearCoupon')}>
        Clear
      </button>
    </div>
  );
}

export function LiteCouponFeature() {
  return (
    <LiteCouponActionProvider>
      <LiteCouponStoreProvider>
        <LiteCouponRegistry />
        <LiteCouponWidget />
      </LiteCouponStoreProvider>
    </LiteCouponActionProvider>
  );
}
```

### Level 2 · Headless-First Symmetric DI (`ActionRegister` + `createStore` + Shared Provider)

Ideal when domain execution must run identically **with or without React mounted** (unit tests, SSR prefetch, Web Workers, multi-pane desktop state surviving unmounts). Inject the framework-neutral instances using `ownership="shared"`.

<!-- @context-action-compile -->
```tsx
import { useCallback } from 'react';
import { ActionRegister, type ActionPayloadMap } from '@context-action/core';
import {
  createActionContext,
  createStore,
  createStoreContext,
  useStoreValue,
} from '@context-action/react';

interface QuoteResult {
  readonly appliedCode: string | null;
  readonly totalAmount: number;
  readonly errorCode: 'unknown_coupon' | null;
}

interface HeadlessCouponActions extends ActionPayloadMap {
  applyCoupon: { code: string; subtotal: number };
}

interface HeadlessCouponResultMap {
  applyCoupon: QuoteResult;
}

export function createCouponEngine() {
  const register = new ActionRegister<HeadlessCouponActions, HeadlessCouponResultMap>({
    name: 'CouponEngine',
  });
  const quoteStore = createStore<QuoteResult>('couponQuote', {
    appliedCode: null,
    totalAmount: 200,
    errorCode: null,
  });
  const auditStore = createStore<string[]>('couponAudit', []);

  register.registerGuard(
    'applyCoupon',
    ({ code, subtotal }, controller) => {
      if (code.trim().toUpperCase() !== 'TEAM25') {
        quoteStore.setValue({ appliedCode: null, totalAmount: subtotal, errorCode: 'unknown_coupon' });
        controller.abort('unknown_coupon');
      }
    },
    { id: 'coupon-guard', priority: 100 }
  );

  register.registerResult(
    'applyCoupon',
    ({ code, subtotal }) => {
      const next: QuoteResult = {
        appliedCode: code.trim().toUpperCase(),
        totalAmount: Math.round(subtotal * 0.75),
        errorCode: null,
      };
      quoteStore.setValue(next);
      return next;
    },
    { id: 'coupon-result', priority: 10 }
  );

  register.registerObserver(
    'applyCoupon',
    (event) => {
      auditStore.update((prev) => [...prev, `${event.outcome}:${event.payload.code.toUpperCase()}`]);
    },
    { id: 'coupon-audit', priority: 1, when: 'always' }
  );

  const CouponActions = createActionContext<HeadlessCouponActions, HeadlessCouponResultMap>(
    'CouponActions'
  );
  const CouponStores = createStoreContext('CouponStores', {
    couponQuote: { appliedCode: null, totalAmount: 200, errorCode: null } as QuoteResult,
  });

  return { register, quoteStore, auditStore, CouponActions, CouponStores };
}

export async function runHeadlessCouponCheck() {
  const engine = createCouponEngine();
  const execution = await engine.register.dispatchWithResult('applyCoupon', {
    code: 'team25',
    subtotal: 200,
  });
  return { execution, quote: engine.quoteStore.getValue(), audit: engine.auditStore.getValue() };
}

export function MountedCouponPanel({ engine }: { engine: ReturnType<typeof createCouponEngine> }) {
  function TelemetryObserver() {
    engine.CouponActions.useActionObserver(
      'applyCoupon',
      useCallback((event) => {
        void event.outcome;
      }, []),
      { id: 'react-ui-observer', when: 'always' }
    );
    return null;
  }

  function View() {
    const dispatch = engine.CouponActions.useActionDispatch();
    const quote = useStoreValue(engine.CouponStores.useStore('couponQuote'));
    return (
      <button
        type="button"
        onClick={() => void dispatch('applyCoupon', { code: 'TEAM25', subtotal: 200 })}
      >
        Total: {quote.totalAmount}
      </button>
    );
  }

  return (
    <engine.CouponActions.Provider register={engine.register} ownership="shared">
      <engine.CouponStores.Provider stores={{ couponQuote: engine.quoteStore }} ownership="shared">
        <TelemetryObserver />
        <View />
      </engine.CouponStores.Provider>
    </engine.CouponActions.Provider>
  );
}
```

### Level 3 · Full 6-Layer Feature Architecture

When a route owns multi-step async workflows, form/draft validation, focus/scroll layout intents, theme tokens, and audit logs across multiple components:

- Separate modules into `contexts/`, `business/`, `handlers/` (4-role hooks: `useActionGuard`, `useActionCommandHandler`, `useActionResultHandler`, `useActionObserver`), `actions/` (`dispatch`-only wrappers with `{ immediate: true }` on cancel/reset), `hooks/`, and `views/`.
- See the production reference implementation in `packages/template-react/src/features/order-workspace/` and its companion walkthroughs:
  - [Canonical Order Form](../examples/canonical-order-form.md)
  - [Spec-to-Code Authoring Guide](../context-layered/spec-to-code-authoring-guide.md)
  - [Context-Layered Architecture Guide](../context-layered/context-layered-guide.md)

---

## Related Resources

- [Code Patterns Quick Reference](./code-patterns.md)
- [Action Pipeline Guide](../concept/action-pipeline-guide.md)
- [Hooks Reference](../concept/hooks-reference.md)
- [Handler Registry Architecture](../context-layered/architecture/handler-registry.md)
- [Stability & Test Cycle](../context-layered/stability-test-cycle.md)
- [Troubleshooting](./troubleshooting.md)
