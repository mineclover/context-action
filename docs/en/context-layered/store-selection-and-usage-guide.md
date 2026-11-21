# Store Selection and Usage Guide

**Status:** Active  
**Spec / Decision ID:** `CA-SURFACE-CATALOG-001`  
**Owner:** Framework Core & React Runtime  
**Related Specifications:**
- [Store and Time-Travel Contracts](../../../packages/react/docs/state-contracts.md)
- [Store Conventions](/en/concept/store-conventions)
- [Repository Surface Catalog](/en/context-layered/repository-surface-catalog)
- [CA-STATECHART-EFFECT-001](/en/context-layered/decisions/CA-STATECHART-EFFECT-001)

Context-Action separates **write ownership** (`StoreWriter` / Action Handlers) from **read ownership** (`StoreReader` / reactive hooks or framework controllers). Every state mutation belongs inside an Action Handler following the three-step flow: read via `store.getValue()`, compute pure domain logic, and commit via `store.setValue()` or `store.update()`.

---

## 1. Store Selection Matrix

| Store / State Mechanism | Package Entry | Primary Use Case | Undo/Redo | React Dependency |
| --- | --- | --- | --- | --- |
| **`createStoreContext`** | `@context-action/react` | **Default choice.** Scope multiple domain stores cleanly to a React component subtree | No | Yes |
| **`createStore` (`Store`)** | `@context-action/react` | Standalone module-level store, dependency-injected store, or unit tests | No | Yes (Mutative built in) |
| **`createTimeTravelStoreContext` / `createTimeTravelStore`** | `@context-action/react` | Editors, form drafts, and canvas state needing undo/redo history navigation | **Yes (Mutative patches)** | Yes |
| **`createStateStore`** | `@context-action/store-core` | Minimal framework-neutral reference store for Vanilla JS, Node, Preact, Lit, or XState | No | **No (0 deps)** |
| **`createBackendStore` (`BackendStore`)** | `@context-action/react/backend` | Bridge any user-owned `StateBackend` into React subscription hooks | Backend-dependent | Yes (wrapper only) |
| **`StoreTransactionCoordinator` + `bindActionTransactions`** | `@context-action/react` | Group mutations across multiple stores into one atomic commit, rollback, and single undo step | **Yes (atomic multi-store)** | Yes |
| **`useLocalStore` / `useComputedStore` / `StoreRegistry`** | `@context-action/react/advanced` | Component-lifetime local store / memoized derived value / dynamic named store registry | No | Yes |
| **`createRefContext`** | `@context-action/react` | **Non-reactive (Tier 3).** DOM elements, Canvas handles, and 120fps pointer coordinates with zero React re-renders | No | Yes |
| **`createActorStateReader`** | `@context-action/xstate` | **Closed statechart read-only projection.** Blocks external `setValue()`; transitions go through actor events only | No | **No** |
| **`createSourceContext` / `StoreController`** | `@context-action/preact`, `@context-action/lit` | Read-only Signals or `ReactiveController` projections of external stores for Preact/Lit hosts | No | **No** |
| **`createDurableOperationStore`** | `@context-action/tool-durable-operations` | **Not UI state.** Lease/claim idempotency and recovery records for external HTTP, queue, or filesystem side effects | No | **No** |

---

## 2. Store Usage Patterns

### 2.1 `createStoreContext` (`@context-action/react`) — Standard React Domain State

Use `createStoreContext` as the default way to manage domain stores inside a React subtree. It returns `{ Provider, useStore, useStoreManager, useStoreInfo, useStoreClear, withProvider }`.

<!-- @context-action-compile -->
```tsx
import { createStoreContext, asStoreValue, useStoreValue } from '@context-action/react';

const {
  Provider: OrderStoreProvider,
  useStore: useOrderStore,
} = createStoreContext('Order', {
  draft: { item: '', qty: 1 },
  // Wrap plain objects that resemble StoreConfig shapes with asStoreValue()
  metadata: asStoreValue({ initialValue: 'custom-user-field' }),
  status: 'idle' as 'idle' | 'submitting' | 'done',
});

// Hook exposing write helper for an Action Handler:
function useOrderQuantityUpdater() {
  const draftStore = useOrderStore('draft');
  return (qty: number) => {
    const current = draftStore.getValue();
    draftStore.setValue({ ...current, qty });
  };
}

// Read inside a View component:
function OrderQuantityBadge() {
  const draftStore = useOrderStore('draft');
  const draft = useStoreValue(draftStore);
  return <span>{draft.qty}</span>;
}

export { OrderStoreProvider, useOrderQuantityUpdater, OrderQuantityBadge };
```

### 2.2 `createStore` (`@context-action/react`) — Standalone Single Store

Use `createStore` when you need a single independent store outside a Provider (module scope, direct prop/DI injection, or focused unit tests). Because `Store` generates Mutative JSON patches, it works directly with `useStorePath`.

<!-- @context-action-compile -->
```tsx
import { createStore, useStorePath } from '@context-action/react';

interface ProfileState {
  user: { name: string; age: number };
  theme: 'light' | 'dark';
}

const profileStore = createStore<ProfileState>('profile', {
  user: { name: 'Kim', age: 30 },
  theme: 'dark',
});

profileStore.update((prev) => ({
  ...prev,
  user: { ...prev.user, name: 'Lee' },
}));

export function UserNameLabel() {
  // Re-renders only when ['user', 'name'] is affected by patches
  const name = useStorePath<ProfileState, string>(profileStore, ['user', 'name']);
  return <span>{name}</span>;
}

// Call dispose() when a standalone store's lifecycle ends
profileStore.dispose();
```

### 2.3 `createTimeTravelStoreContext` & `createTimeTravelStore` (`@context-action/react`) — Undo / Redo

Use `TimeTravelStore` whenever users need undo, redo, or bounded history navigation.

- `createTimeTravelStore(name, initialValue, { maxHistory, mutable, notificationMode, readMode })` defaults `readMode` to `'reference'` for legacy structural-sharing compatibility.
- Declarative `createTimeTravelStoreContext` defaults `readMode` to `'safe'`.
- Always read via `store.getSafeValue()` when crossing an external serialization or host boundary.

<!-- @context-action-compile -->
```tsx
import { createTimeTravelStoreContext } from '@context-action/react';

const DocStores = createTimeTravelStoreContext('Doc', {
  content: { initialValue: { text: '' }, maxHistory: 50 },
});

export function HistoryToolbar() {
  const { canUndo, canRedo, undo, redo, position, historyLength } =
    DocStores.useTimeTravelControls('content');

  return (
    <div>
      <button type="button" disabled={!canUndo} onClick={() => undo()}>Undo</button>
      <button type="button" disabled={!canRedo} onClick={() => redo()}>Redo</button>
      <span>{position} / {historyLength}</span>
    </div>
  );
}
```

### 2.4 `createStateStore` (`@context-action/store-core`) — Zero-Dependency Reference Store

Use `createStateStore` when you want a lightweight, framework-neutral state container with zero React, Mutative, or DOM dependencies (`capabilities: { patches: false, timeline: false, immutableSnapshots: false }`). The caller owns immutability by passing fresh references; identical `Object.is(prev, next)` updates are skipped.

<!-- @context-action-compile -->
```ts
import { createStateStore } from '@context-action/store-core';

const counterStore = createStateStore('counter', { count: 0 });
const unsubscribe = counterStore.subscribe(() => {
  const snapshot = counterStore.getSnapshot(); // { value, name, version, lastUpdate }
  console.log(`v${snapshot.version}: ${snapshot.value.count}`);
});

counterStore.update((prev) => ({ count: prev.count + 1 }));
unsubscribe();
counterStore.dispose?.();
```

### 2.5 `createBackendStore` / `BackendStore` (`@context-action/react/backend`) — Custom Backend Bridge

Use `createBackendStore` to expose any `@context-action/store-core` `StateBackend<T, Patch>` (such as `createStateStore`, `MutativeStateBackend`, or a custom persistence/sync backend) to React's `useSyncExternalStore` hooks (`useStoreValue`, `useStoreSelector`, and `useStorePath` if the backend supplies patches).

- `ownership: 'shared'` (default): disposing the `BackendStore` wrapper keeps the underlying backend alive.
- `ownership: 'owned'`: disposing the wrapper also disposes the underlying backend.

<!-- @context-action-compile -->
```tsx
import { createStateStore } from '@context-action/store-core';
import { createBackendStore } from '@context-action/react/backend';
import { useStoreValue } from '@context-action/react';

const sharedBackend = createStateStore('session', { step: 1 });
const reactStore = createBackendStore('session', sharedBackend, { ownership: 'shared' });

export function SessionStep() {
  const state = useStoreValue(reactStore);
  return <span>Step {state.step}</span>;
}
```

### 2.6 `StoreTransactionCoordinator` & `bindActionTransactions` (`@context-action/react`) — Multi-Store Transactions

Use `StoreTransactionCoordinator` when a single logical action must update multiple stores without exposing intermediate states and with atomic rollback + single-step undo.

- Participants are registered explicitly (never discovered globally).
- Notifications are deferred until commit flush so readers never observe half-committed pairs.
- For framework-neutral coordination without React, use `bindActionDispatchTransactions` and `runInTransactionScope` from `@context-action/xstate/effect`.

<!-- @context-action-compile -->
```ts
import { StoreTransactionCoordinator, createTimeTravelStore } from '@context-action/react';

const cart = createTimeTravelStore('cart', { items: [] as string[] });
const totals = createTimeTravelStore('totals', { price: 0 });
const coordinator = new StoreTransactionCoordinator();

export async function addItemWithRollback() {
  await coordinator.run(
    [
      { name: 'cart', store: cart },
      { name: 'totals', store: totals },
    ],
    () => {
      cart.update((prev) => ({ items: [...prev.items, 'book'] }));
      totals.update((prev) => ({ price: prev.price + 25 }));
    },
    { label: 'addItem' },
  );

  // Undoing the transaction reverts both cart and totals together
  coordinator.undo();
}
```

### 2.7 `useLocalStore`, `useComputedStore`, and `StoreRegistry` (`@context-action/react/advanced`)

- **`useLocalStore(initialValue, name?)`**: creates a component-scoped `Store` and automatically calls `dispose()` on unmount, returning `{ value, name, lastUpdate, store }`.
- **`useComputedStore(store, computeFn, config?)`**: derives and memoizes a computed projection from an upstream store with optional `equalityFn`, `initialValue`, `onError`, and `debounceMs`.
- **`StoreRegistry`**: reserved for advanced dynamic store registration, lookup, and cleanup by string key.

### 2.8 Headless-First Composition (`ActionRegister` DI + `StateStore` / `BackendStore`)

Assemble pure TypeScript state (`createStateStore` from `@context-action/store-core` or standalone `createStore`) alongside a headless `ActionRegister`, then inject both into React through `<ActionContext.Provider register={...}>` (`ownership="shared"` by default) and `createBackendStore`:

<!-- @context-action-compile -->
```tsx
import { ActionRegister, type ActionPayloadMap } from '@context-action/core';
import { createStateStore } from '@context-action/store-core';
import { createActionContext, useStoreValue } from '@context-action/react';
import { createBackendStore } from '@context-action/react/backend';

interface CartActions extends ActionPayloadMap {
  addSku: { sku: string };
}

export const cartBackend = createStateStore('cart', { items: [] as string[] });
export const cartRegister = new ActionRegister<CartActions>({ name: 'HeadlessCart' });

cartRegister.registerCommand('addSku', ({ sku }) => {
  cartBackend.update((prev) => ({ items: [...prev.items, sku] }));
});

const cartStore = createBackendStore('cart', cartBackend, { ownership: 'shared' });
const CartActionsContext = createActionContext<CartActions>('Cart');

function CartSummary() {
  const dispatch = CartActionsContext.useActionDispatch();
  const cart = useStoreValue(cartStore);
  return (
    <button type="button" onClick={() => void dispatch('addSku', { sku: 'BOOK-1' })}>
      Items: {cart.items.length}
    </button>
  );
}

export function HeadlessCartView() {
  return (
    <CartActionsContext.Provider register={cartRegister} ownership="shared">
      <CartSummary />
    </CartActionsContext.Provider>
  );
}
```

---

## 3. Choosing the Right React Subscription Hook

| Hook | Subscription Granularity | Best Fit |
| --- | --- | --- |
| **`useStoreValue(store, options?)`** | Whole store value (with optional `condition` render gate) | Primitives or small flat objects where most fields render together |
| **`useStoreSelector(store, selector, equalityFn?)`** | Derived slice compared by `equalityFn` | Selecting a single field or computed projection from medium stores |
| **`useStorePath(store, path, options?)`** | Patch-aware path tracking (array segments or RFC 6901 JSON Pointer) | Deeply nested `PatchAwareStore` objects where siblings update independently |
| **`useStoreSelectorWithPaths(store, selector, { dependsOn, equalityFn })`** | Re-runs `selector` only when one of `dependsOn` paths was touched by patches | Expensive multi-field derived selectors over large nested trees |

---

## 4. Non-Store and Cross-Framework Boundaries

Do not force every stateful need into a reactive React `Store`:

1. **`createRefContext` (`@context-action/react`) — Non-Reactive Tier 3 State**: Keep DOM nodes, HTML5 Canvas handles, animation timers, and 120fps pointer coordinates in `createRefContext` so frequent updates never trigger React re-renders.
2. **`createActorStateReader` (`@context-action/xstate`) — Closed Statechart Projection**: Unlike open `StateStore` instances, an XState actor does not allow arbitrary external `setValue()` writes. Route intents through `ActionRegister` / `SyncActionPipeline` (`bindActorToActionRegister` / `bindActorToSyncPipeline`) and read monotonic versioned snapshots via `createActorStateReader(actor, { select, equals })`.
3. **Preact & Lit Read-Only Adapters**:
   - **Preact** (`@context-action/preact`): wrap any `ReadableSource` with `connectSourceSignal(store)` and pass it down via `createSourceContext`, projecting slices with `useProjection(signal, selector)`.
   - **Lit** (`@context-action/lit`): attach `new StoreController(this, store, { selector, equalityFn })` to subscribe on `hostConnected()` and clean up automatically on `hostDisconnected()`.
4. **`createDurableOperationStore` (`@context-action/tool-durable-operations`) — Durable Side-Effect Records**: Stores lease/claim status (`pending`, `completed`, `failed`, `unknown`) and reconciliation metadata for external HTTP, queue, or filesystem mutations—it is an idempotency/recovery store, not a UI view store.
