# Deferred View Subscription (`useStorePath` / `useStoreValue` + `useDeferredValue`)

Separate **urgent external Store reads** (input controls, live store snapshots) from **non-blocking derived UI rendering** (large filtered lists, heavy charts, markdown/code previews) by layering React's `useDeferredValue` on top of `useStorePath` or `useStoreValue`.

- **React Compatibility**: React 18 / 19
- **Why a Usage Pattern (not a Wrapper API)**: `useDeferredValue` is a standard React scheduling primitive that belongs at the **view boundary** where render cost exists — not inside the Store runtime. Keeping Store subscriptions urgent (`useSyncExternalStore`) while deferring expensive view props prevents tearing without introducing custom Store scheduling APIs.

## Prerequisites

- [useStoreValue Patterns](./useStoreValue-patterns.md)
- [Path-Based Subscription](./path-based-subscription.md)
- [Code Patterns](../../code-patterns.md)

---

## Why `useDeferredValue` Is Needed with `useSyncExternalStore`

Context-Action Store hooks (`useStoreValue`, `useStoreSelector`, `useStorePath`) are built on `useSyncExternalStore`. By React's contract, external store updates execute synchronously (urgently) when notified to guarantee tear-free UI consistency — wrapping an external store mutation in `startTransition` does **not** make `useSyncExternalStore` yield during rendering.

At the same time, Context-Action's default `Store` uses **RAF batching (`notificationMode: 'batched'`, ~16ms)** before notifying subscribers. Binding a controlled `<input value={query} />` directly to an RAF-batched `Store` can delay the input echo by 1 frame and cause cursor jumps or IME composition glitches in real browsers.

To keep typing crisp **and** keep heavy downstream rendering non-blocking:

1. Keep the controlled `<input>` synchronous with local `useState` (or use an `immediate`-notification store such as `TimeTravelStore` with default `notificationMode: 'immediate'`) and push updates into the shared Store.
2. Read the Store in the results view with `useStorePath` or `useStoreValue`.
3. Pass the read value through `useDeferredValue(query)` and wrap the expensive child subtree in `React.memo(...)` so it renders only with the deferred value and yields cleanly when urgent input arrives.

---

## Canonical Pattern: Synchronous Input Control + Deferred Subtree

<!-- @context-action-compile -->
```tsx
import React, { memo, useDeferredValue, useMemo, useState } from 'react';
import {
  createStoreContext,
  useStorePath,
} from '@context-action/react';

export interface CatalogItem {
  readonly id: string;
  readonly name: string;
  readonly category: string;
}

export interface CatalogFilterState {
  query: string;
  items: CatalogItem[];
}

const {
  Provider: CatalogStoreProvider,
  useStore: useCatalogStore,
} = createStoreContext('DeferredCatalog', {
  filterState: {
    query: '',
    items: [
      { id: '1', name: 'ActionRegister Pipeline', category: 'core' },
      { id: '2', name: 'Store Path Subscription', category: 'react' },
      { id: '3', name: 'TimeTravel Snapshot', category: 'mutative' },
    ],
  } as CatalogFilterState,
});

interface HeavyCatalogListProps {
  readonly query: string;
  readonly items: readonly CatalogItem[];
}

// React.memo is essential: when `query` updates, HeavyCatalogList
// keeps showing its previous `deferredQuery` output until React completes
// the background render with the new deferred value.
const HeavyCatalogList = memo(function HeavyCatalogList({
  query,
  items,
}: HeavyCatalogListProps) {
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(normalized) ||
        item.category.toLowerCase().includes(normalized),
    );
  }, [items, query]);

  return (
    <ul aria-label="Catalog results">
      {filtered.map((item) => (
        <li key={item.id}>
          {item.name} ({item.category})
        </li>
      ))}
    </ul>
  );
});

function CatalogSearchBar() {
  const filterStore = useCatalogStore('filterState');
  // Local state keeps controlled `<input>` synchronous across keystrokes and IME,
  // independent of default Store RAF batching (~16ms).
  const [draftQuery, setDraftQuery] = useState('');

  return (
    <input
      aria-label="Filter catalog"
      value={draftQuery}
      onChange={(event) => {
        const nextQuery = event.target.value;
        setDraftQuery(nextQuery);
        // Mutate the Mutative draft in place so `useStorePath` receives a granular
        // `['query']` patch instead of a root-replace patch.
        filterStore.update((draft) => {
          draft.query = nextQuery;
        });
      }}
    />
  );
}

function CatalogResultsView() {
  const filterStore = useCatalogStore('filterState');

  // Granular Store reads
  const query = useStorePath<CatalogFilterState, string>(filterStore, ['query']);
  const items = useStorePath<CatalogFilterState, readonly CatalogItem[]>(
    filterStore,
    ['items'],
  );

  // Non-blocking deferred value for expensive downstream derivation
  const deferredQuery = useDeferredValue(query);
  const isStale = query !== deferredQuery;

  return (
    <div>
      {isStale && <span aria-live="polite">Updating results...</span>}
      <div style={{ opacity: isStale ? 0.7 : 1 }}>
        <HeavyCatalogList query={deferredQuery} items={items} />
      </div>
    </div>
  );
}

export function DeferredCatalogScreen() {
  return (
    <CatalogStoreProvider>
      <section>
        <CatalogSearchBar />
        <CatalogResultsView />
      </section>
    </CatalogStoreProvider>
  );
}
```

---

## Decision Guide: `useDeferredValue` vs Timing Controls (`debounce` / `throttle` / `ActionGuard`)

| Scenario | Recommended Mechanism | Why |
|---|---|---|
| **Expensive client-side rendering** (filtering 5,000 rows, syntax highlighting, SVG/chart layout) | `useDeferredValue` around `useStorePath` / `useStoreValue` + `React.memo` | Adapts dynamically to device speed with zero artificial timer delay and stays interruptible by new keystrokes. |
| **Suppressing network API calls or expensive handler pipelines** | Handler `debounce` / `throttle` config or `ActionGuard` | `useDeferredValue` only schedules React renders; it does **not** prevent side effects inside handlers from firing on every action dispatch. |
| **Limiting Store subscription update frequency from external bursts** (e.g., WebSocket tick telemetry) | `useStoreValue(store, { throttle: 100 })` or `debounce` | Bounds how often the UI view commits visible snapshots from high-rate external pushes. |

## Key Invariants

- **Memoize the deferred child (`React.memo`)**: Without `React.memo` (or `useMemo` keyed on `deferredQuery`), the heavy subtree re-runs during the urgent render anyway, defeating `useDeferredValue`.
- **Keep controlled `<input>` synchronous**: Never drive a controlled text `<input>` directly from an RAF-batched `Store` (`notificationMode: 'batched'`); keep the input synchronous via local `useState` (or use an `immediate`-mode store such as `TimeTravelStore` when the input value must live solely in a Store), and never bind `<input value>` to `deferredQuery`.
- **Avoid passing inline object/array literals alongside `deferredQuery`**: Pass stable Store slices (`items` from `useStorePath`) so `React.memo` shallow prop checks pass during urgent renders.
