import { type ActionPayloadMap, ActionRegister } from '@context-action/core';
import {
  bindActionTransactions,
  createTimeTravelStore,
  StoreTransactionCoordinator,
  useStoreTransactionInspector,
  useStoreValue,
} from '@context-action/react';
import { createBackendStore } from '@context-action/react/backend';
import { createStateStore, type StateStore } from '@context-action/store-core';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CodeBlock,
} from '@/components/ui';

interface PricingPolicy {
  currency: 'USD' | 'EUR' | 'KRW';
  taxRate: number;
  memberDiscount: number;
}

interface InventoryState {
  stock: number;
  reserved: number;
}

interface CartState {
  items: number;
  totalUsd: number;
}

interface TransactionDemoActions extends ActionPayloadMap {
  reserveItem: { qty: number; unitPrice: number };
  clearOrder: void;
}

interface StoreRuntime {
  pricingStateStore: StateStore<PricingPolicy>;
  pricingBackendStore: ReturnType<typeof createBackendStore<PricingPolicy>>;
  inventoryStore: ReturnType<typeof createTimeTravelStore<InventoryState>>;
  cartStore: ReturnType<typeof createTimeTravelStore<CartState>>;
  coordinator: StoreTransactionCoordinator;
}

function createStoreDemoRuntime(): StoreRuntime {
  const pricingStateStore = createStateStore<PricingPolicy>('pricing-policy', {
    currency: 'USD',
    taxRate: 0.1,
    memberDiscount: 0.05,
  });
  const pricingBackendStore = createBackendStore(
    'pricing-policy',
    pricingStateStore,
    {
      ownership: 'shared',
    }
  );
  const inventoryStore = createTimeTravelStore<InventoryState>('inventory', {
    stock: 10,
    reserved: 0,
  });
  const cartStore = createTimeTravelStore<CartState>('cart', {
    items: 0,
    totalUsd: 0,
  });
  const coordinator = new StoreTransactionCoordinator();

  return {
    pricingStateStore,
    pricingBackendStore,
    inventoryStore,
    cartStore,
    coordinator,
  };
}

const CURRENCY_SYMBOLS: Record<PricingPolicy['currency'], string> = {
  USD: '$',
  EUR: '€',
  KRW: '₩',
};

const CURRENCY_RATES: Record<PricingPolicy['currency'], number> = {
  USD: 1,
  EUR: 0.92,
  KRW: 1380,
};

export default function StoreBackendTransactionsPage() {
  const [runtime] = useState<StoreRuntime>(() => createStoreDemoRuntime());
  const registerRef = useRef<ActionRegister<TransactionDemoActions> | null>(
    null
  );
  const [statusMessage, setStatusMessage] = useState<string>(
    'Ready: direct StateBackend updates and atomic multi-store transactions are active.'
  );
  const [transactionLog, setTransactionLog] = useState<string[]>([]);

  const pricing = useStoreValue(runtime.pricingBackendStore);
  const backendSnapshot = useSyncExternalStore(
    (cb) => runtime.pricingBackendStore.subscribe(cb),
    () => runtime.pricingBackendStore.getSnapshot(),
    () => runtime.pricingBackendStore.getSnapshot()
  );
  const inventory = useStoreValue(runtime.inventoryStore);
  const cart = useStoreValue(runtime.cartStore);
  const inspector = useStoreTransactionInspector(runtime.coordinator);

  useEffect(() => {
    const register = new ActionRegister<TransactionDemoActions>({
      name: 'StoreBackendTransactionActions',
    });
    registerRef.current = register;

    const unregisterReserve = register.register(
      'reserveItem',
      ({ qty, unitPrice }, controller) => {
        const beforeInventory = runtime.inventoryStore.getValue();
        // Step 1: mutate inventory first so over-reserve exercises real rollback.
        runtime.inventoryStore.update((draft) => {
          draft.stock -= qty;
          draft.reserved += qty;
        });

        if (qty > beforeInventory.stock) {
          controller.abort(
            `Insufficient stock (requested ${qty}, available ${beforeInventory.stock})`
          );
          setStatusMessage(
            `Rolled back: requested ${qty}, only ${beforeInventory.stock} left in stock. Zero partial state persisted.`
          );
          return;
        }

        // Step 2: update cart only when stock invariant holds.
        runtime.cartStore.update((draft) => {
          draft.items += qty;
          draft.totalUsd += qty * unitPrice;
        });
        setStatusMessage(
          `Committed transaction: reserved ${qty} items ($${qty * unitPrice}) across inventory + cart.`
        );
      }
    );

    const unregisterClear = register.register('clearOrder', () => {
      runtime.inventoryStore.setValue({ stock: 10, reserved: 0 });
      runtime.cartStore.setValue({ items: 0, totalUsd: 0 });
      setStatusMessage('Committed atomic reset across inventory and cart.');
    });

    const unbindBridge = bindActionTransactions(register, runtime.coordinator, {
      getParticipants: () => [
        { name: 'inventory', store: runtime.inventoryStore },
        { name: 'cart', store: runtime.cartStore },
      ],
    });

    const unsubscribeCoordinator = runtime.coordinator.subscribe((event) => {
      const summary = `${event.phase.toUpperCase()} — ${event.record.meta.label ?? event.record.meta.id} (${event.record.participants
        .map((p) => `${p.name}:${p.before}->${p.after}`)
        .join(', ')})`;
      setTransactionLog((prev) => [summary, ...prev].slice(0, 8));
    });

    return () => {
      unsubscribeCoordinator();
      unbindBridge();
      unregisterReserve();
      unregisterClear();
      registerRef.current = null;
      void register.destroyAsync();
    };
  }, [runtime]);

  const baseSubtotal = cart.totalUsd;
  const discounted = baseSubtotal * (1 - pricing.memberDiscount);
  const finalUsd = discounted * (1 + pricing.taxRate);
  const convertedTotal = finalUsd * CURRENCY_RATES[pricing.currency];
  const formattedTotal =
    pricing.currency === 'KRW'
      ? `${CURRENCY_SYMBOLS[pricing.currency]}${Math.round(convertedTotal).toLocaleString()}`
      : `${CURRENCY_SYMBOLS[pricing.currency]}${convertedTotal.toFixed(2)}`;

  const handleToggleCurrency = () => {
    const order: PricingPolicy['currency'][] = ['USD', 'EUR', 'KRW'];
    const next =
      order[(order.indexOf(pricing.currency) + 1) % order.length] ?? 'USD';
    runtime.pricingStateStore.update((prev) => ({
      ...prev,
      currency: next,
    }));
  };

  const handleAdjustTax = (delta: number) => {
    runtime.pricingStateStore.update((prev) => ({
      ...prev,
      taxRate: Math.max(
        0,
        Math.min(0.3, Number((prev.taxRate + delta).toFixed(2)))
      ),
    }));
  };

  const handleToggleMemberDiscount = () => {
    runtime.pricingStateStore.update((prev) => ({
      ...prev,
      memberDiscount:
        prev.memberDiscount === 0
          ? 0.1
          : prev.memberDiscount === 0.05
            ? 0.1
            : 0,
    }));
  };

  const handleReserve = async (qty: number, unitPrice: number) => {
    await registerRef.current?.dispatch(
      'reserveItem',
      { qty, unitPrice },
      {
        trace: {
          origin: 'user',
          label: `Reserve ${qty} ($${unitPrice})`,
        },
      }
    );
  };

  const handleClearOrder = async () => {
    await registerRef.current?.dispatch('clearOrder', undefined, {
      trace: {
        origin: 'user',
        label: 'Clear order',
      },
    });
  };

  const handleUndoTransaction = () => {
    if (!runtime.coordinator.canUndo()) return;
    runtime.coordinator.undo();
    setStatusMessage('Undid last atomic transaction across inventory + cart.');
  };

  const handleRedoTransaction = () => {
    if (!runtime.coordinator.canRedo()) return;
    runtime.coordinator.redo();
    setStatusMessage('Redid atomic transaction across inventory + cart.');
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="primary">@context-action/store-core</Badge>
          <Badge variant="outline">@context-action/react/backend</Badge>
          <Badge variant="success">StoreTransactionCoordinator</Badge>
        </div>
        <h1 className="text-3xl font-bold text-slate-900">
          StateBackend Adapter &amp; Atomic Multi-Store Transactions
        </h1>
        <p className="text-slate-600">
          Demonstrates adapting a framework-neutral{' '}
          <code>@context-action/store-core</code> backend with{' '}
          <code>createBackendStore</code> and coordinating atomic commits,
          rollbacks, and undo/redo across multiple stores with{' '}
          <code>StoreTransactionCoordinator</code> +{' '}
          <code>bindActionTransactions</code>.
        </p>
      </div>

      <div
        className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900"
        data-testid="transaction-status"
      >
        {statusMessage}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              1. @context-action/store-core → @context-action/react/backend
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              <code>createStateStore</code> owns plain reference transitions
              without Mutative or React. <code>createBackendStore</code> wraps
              it into an <code>IStore</code> for <code>useStoreValue</code>.
            </p>

            <div className="grid grid-cols-3 gap-3 rounded-lg bg-slate-50 p-3 text-sm">
              <div>
                <div className="text-xs text-slate-500">Currency</div>
                <div
                  className="font-mono text-lg font-semibold"
                  data-testid="pricing-currency"
                >
                  {pricing.currency}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Tax Rate</div>
                <div
                  className="font-mono text-lg font-semibold"
                  data-testid="pricing-tax"
                >
                  {Math.round(pricing.taxRate * 100)}%
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Member Discount</div>
                <div
                  className="font-mono text-lg font-semibold"
                  data-testid="pricing-discount"
                >
                  {Math.round(pricing.memberDiscount * 100)}%
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={handleToggleCurrency}>
                Cycle Currency
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAdjustTax(0.05)}
              >
                +5% Tax
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleToggleMemberDiscount}
              >
                Toggle Member Discount
              </Button>
            </div>

            <div className="rounded border border-slate-200 p-3 text-xs text-slate-600 space-y-1">
              <div>
                Backend Snapshot Version:{' '}
                <strong data-testid="backend-version">
                  {backendSnapshot.version}
                </strong>
              </div>
              <div>
                Capabilities:{' '}
                <code>
                  {JSON.stringify(runtime.pricingStateStore.capabilities)}
                </code>
              </div>
              <div>
                Computed Total (with policy):{' '}
                <strong data-testid="computed-total">{formattedTotal}</strong>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              2. Atomic Multi-Store Transactions &amp; Rollback
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 text-sm">
              <div>
                <div className="text-xs text-slate-500">
                  Inventory Store (TimeTravel)
                </div>
                <div className="font-mono">
                  stock:{' '}
                  <strong data-testid="inventory-stock">
                    {inventory.stock}
                  </strong>
                  {' · '}reserved:{' '}
                  <strong data-testid="inventory-reserved">
                    {inventory.reserved}
                  </strong>
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">
                  Cart Store (TimeTravel)
                </div>
                <div className="font-mono">
                  items: <strong data-testid="cart-items">{cart.items}</strong>
                  {' · '}subtotal:{' '}
                  <strong data-testid="cart-total">${cart.totalUsd}</strong>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => void handleReserve(2, 45)}>
                Reserve 2 Items ($45 each)
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => void handleReserve(99, 45)}
              >
                Attempt Over-Reserve (Triggers Rollback)
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={!inspector.canUndo}
                onClick={handleUndoTransaction}
              >
                Undo Transaction
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={!inspector.canRedo}
                onClick={handleRedoTransaction}
              >
                Redo Transaction
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void handleClearOrder()}
              >
                Reset Order
              </Button>
            </div>

            <div
              className="rounded border border-slate-200 p-3 text-xs text-slate-700 space-y-1"
              data-testid="inspector-summary"
            >
              <div>
                Inspector Snapshot: position{' '}
                <strong data-testid="tx-position">{inspector.position}</strong>{' '}
                /{' '}
                <strong data-testid="tx-history-length">
                  {inspector.historyLength}
                </strong>{' '}
                · canUndo: <strong>{String(inspector.canUndo)}</strong> ·
                canRedo: <strong>{String(inspector.canRedo)}</strong>
              </div>
              <div>
                Latest Transaction:{' '}
                <strong>{inspector.latest?.meta.label ?? 'none'}</strong>
              </div>
            </div>

            {transactionLog.length > 0 && (
              <div className="rounded bg-slate-900 p-3 font-mono text-xs text-slate-100 space-y-1">
                {transactionLog.map((entry, idx) => (
                  <div key={`${entry}-${idx}`}>{entry}</div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contract Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <CodeBlock size="sm">
            {`const stateStore = createStateStore('pricing-policy', { currency: 'USD', taxRate: 0.1, memberDiscount: 0.05 });
const pricingBackendStore = createBackendStore('pricing-policy', stateStore, { ownership: 'shared' });
const coordinator = new StoreTransactionCoordinator();

const unbind = bindActionTransactions(register, coordinator, {
  getParticipants: () => [
    { name: 'inventory', store: inventoryStore },
    { name: 'cart', store: cartStore },
  ],
});`}
          </CodeBlock>
        </CardContent>
      </Card>
    </div>
  );
}
