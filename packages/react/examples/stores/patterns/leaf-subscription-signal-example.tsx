/**
 * @fileoverview Leaf-Subscription Pseudo-Signal & Intentional useEffect Coexistence Example
 *
 * Demonstrates the idiomatic placement of hooks to achieve signal-like precision
 * inside React while preserving standard React `useEffect` lifecycles:
 *
 * 1. Top-level Shell holds ONLY `useActionDispatch()` (stable reference, 0 re-renders).
 * 2. Mutations use `store.update(draft => ...)` (never whole-object `setValue`) so
 *    Mutative emits exact JSON patches (e.g. `['price']` vs `['theme']`).
 * 3. Leaf components subscribe via `useStorePath(store, path)`, so only the affected
 *    Leaf re-renders and runs its `useEffect` + cleanup cycle.
 * 4. High-frequency pointer updates run on `lane: 'fast'` + `useRefController`, updating
 *    DOM nodes imperatively with 0 React re-renders and 0 `useEffect` churn.
 */

import React, { useCallback, useEffect, useRef } from 'react';
import {
  createActionContext,
  createStore,
  useStorePath,
} from '@context-action/react';
import { createRefContext } from '@context-action/react/refs';

export interface TickerStoreState {
  price: number;
  theme: 'light' | 'dark';
  meta: {
    symbol: string;
  };
}

export interface TickerActionMap {
  pointerHover: { x: number; y: number };
  setPrice: { price: number };
  toggleTheme: undefined;
}

export const TickerActions = createActionContext<TickerActionMap>('LeafSignalTicker', {
  actions: {
    pointerHover: { lane: 'fast' },
    setPrice: { lane: 'orchestrated', queue: 'serial' },
    toggleTheme: { lane: 'orchestrated', queue: 'serial' },
  },
});

export const TickerRefs = createRefContext('LeafSignalTickerRefs', {
  hoverBadge: {
    name: 'hoverBadge',
    autoCleanup: true,
    validator: (target: unknown): target is HTMLSpanElement =>
      target instanceof HTMLSpanElement,
  },
});

export const tickerStore = createStore<TickerStoreState>('leafSignalTickerStore', {
  price: 100,
  theme: 'light',
  meta: { symbol: 'ACME' },
});

function PriceLeaf({
  onTelemetry,
}: {
  onTelemetry?: (event: string) => void;
}) {
  const price = useStorePath<TickerStoreState, number>(tickerStore, ['price']);
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;

  // Standard React useEffect stays intentionally scoped to this Leaf only.
  useEffect(() => {
    onTelemetry?.(`mount-price:${price}`);
    return () => {
      onTelemetry?.(`cleanup-price:${price}`);
    };
  }, [price, onTelemetry]);

  return (
    <div style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }}>
      <strong>Price Leaf:</strong> ${price} (renders: {renderCountRef.current})
    </div>
  );
}

function ThemeLeaf({
  onTelemetry,
}: {
  onTelemetry?: (event: string) => void;
}) {
  const theme = useStorePath<TickerStoreState, TickerStoreState['theme']>(tickerStore, ['theme']);
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;

  useEffect(() => {
    onTelemetry?.(`mount-theme:${theme}`);
    return () => {
      onTelemetry?.(`cleanup-theme:${theme}`);
    };
  }, [theme, onTelemetry]);

  return (
    <div style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }}>
      <strong>Theme Leaf:</strong> {theme} (renders: {renderCountRef.current})
    </div>
  );
}

function HoverOverlay() {
  const hoverBadge = TickerRefs.useRefController('hoverBadge');
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;

  const onHover = useCallback(
    (payload: { x: number; y: number }) => {
      hoverBadge.executeIfMounted(el => {
        el.dataset.coords = `${payload.x},${payload.y}`;
        el.textContent = `Hover (${payload.x}, ${payload.y}) — 0 React renders`;
      });
    },
    [hoverBadge],
  );
  TickerActions.useActionCommandHandler('pointerHover', onHover);

  return (
    <div style={{ padding: 8, border: '1px dashed #94a3b8', borderRadius: 6 }}>
      <span ref={hoverBadge.setRef}>Hover (0, 0) — 0 React renders</span>{' '}
      <small>(overlay renders: {renderCountRef.current})</small>
    </div>
  );
}

function DashboardShell({
  onTelemetry,
}: {
  onTelemetry?: (event: string) => void;
}) {
  // Shell never reads stores; dispatch reference is stable (0 Shell re-renders).
  const dispatch = TickerActions.useActionDispatch();
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;

  const handleSetPrice = useCallback((payload: { price: number }) => {
    // Use Mutative `update()` so only ['price'] emits a patch.
    tickerStore.update(draft => {
      draft.price = payload.price;
    });
  }, []);
  TickerActions.useActionCommandHandler('setPrice', handleSetPrice);

  const handleToggleTheme = useCallback(() => {
    tickerStore.update(draft => {
      draft.theme = draft.theme === 'light' ? 'dark' : 'light';
    });
  }, []);
  TickerActions.useActionCommandHandler('toggleTheme', handleToggleTheme);

  return (
    <div
      style={{ display: 'grid', gap: 12, padding: 16, fontFamily: 'system-ui, sans-serif' }}
      onPointerMove={e => {
        void dispatch('pointerHover', {
          x: Math.round(e.clientX),
          y: Math.round(e.clientY),
        });
      }}
    >
      <h3>
        Leaf-Subscription Pseudo-Signal Example (Shell renders: {renderCountRef.current})
      </h3>

      <PriceLeaf onTelemetry={onTelemetry} />
      <ThemeLeaf onTelemetry={onTelemetry} />
      <HoverOverlay />

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={() => void dispatch('setPrice', { price: tickerStore.getValue().price + 10 })}
        >
          Increment Price (PriceLeaf + Effect only)
        </button>
        <button type="button" onClick={() => void dispatch('toggleTheme')}>
          Toggle Theme (ThemeLeaf + Effect only)
        </button>
      </div>
    </div>
  );
}

export function LeafSubscriptionSignalExample({
  onTelemetry,
}: {
  onTelemetry?: (event: string) => void;
}) {
  return (
    <TickerActions.Provider>
      <TickerRefs.Provider>
        <DashboardShell onTelemetry={onTelemetry} />
      </TickerRefs.Provider>
    </TickerActions.Provider>
  );
}

export default LeafSubscriptionSignalExample;
