import { type ActionPayloadMap, ActionRegister } from '@context-action/core';
import {
  type ActorRefLike,
  bindActorToActionRegister,
  createActorStateReader,
  type StatechartObserverLike,
  type StatechartSnapshotPort,
} from '@context-action/xstate';
import {
  fromStandardSchema,
  registerStandardSchemaGuard,
  type StandardSchemaV1Like,
} from '@context-action/xstate/effect';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CodeBlock,
  Input,
  Label,
} from '@/components/ui';

type FulfillmentStatus =
  | 'idle'
  | 'reserved'
  | 'shipped'
  | 'completed'
  | 'cancelled';

interface FulfillmentContext {
  sku: string;
  qty: number;
  telemetryTicks: number;
}

type FulfillmentEvent =
  | { type: 'SUBMIT_ORDER'; sku: string; qty: number }
  | { type: 'SHIP' }
  | { type: 'COMPLETE' }
  | { type: 'CANCEL' }
  | { type: 'RESET' }
  | { type: 'TELEMETRY_TICK' };

interface FulfillmentSnapshot extends StatechartSnapshotPort {
  readonly value: FulfillmentStatus;
  readonly context: FulfillmentContext;
  readonly status: 'active' | 'done';
}

interface FulfillmentActions extends ActionPayloadMap {
  submitOrder: { sku: string; qty: number };
  shipOrder: void;
  completeOrder: void;
  cancelOrder: void;
  resetOrder: void;
}

const orderStandardSchema: StandardSchemaV1Like<
  { sku: string; qty: number },
  { sku: string; qty: number }
> = {
  '~standard': {
    version: 1,
    vendor: 'context-action-demo',
    validate(value: unknown) {
      if (typeof value !== 'object' || value === null) {
        return { issues: [{ message: 'Order payload must be an object' }] };
      }
      const candidate = value as { sku?: unknown; qty?: unknown };
      const issues: Array<{
        message: string;
        path?: ReadonlyArray<PropertyKey>;
      }> = [];
      const normalizedSku =
        typeof candidate.sku === 'string'
          ? candidate.sku.trim().toUpperCase()
          : '';
      if (normalizedSku.length < 3) {
        issues.push({
          message: 'SKU must contain at least 3 characters',
          path: ['sku'],
        });
      }
      const qty =
        typeof candidate.qty === 'number' && Number.isFinite(candidate.qty)
          ? Math.trunc(candidate.qty)
          : Number.NaN;
      if (!Number.isInteger(qty) || qty < 1 || qty > 50) {
        issues.push({
          message: 'Quantity must be between 1 and 50',
          path: ['qty'],
        });
      }
      if (issues.length > 0) return { issues };
      return { value: { sku: normalizedSku, qty } };
    },
  },
};

function canTransition(
  state: FulfillmentStatus,
  event: FulfillmentEvent
): boolean {
  switch (event.type) {
    case 'SUBMIT_ORDER':
      return state === 'idle';
    case 'SHIP':
      return state === 'reserved';
    case 'COMPLETE':
      return state === 'shipped';
    case 'CANCEL':
      return state === 'reserved' || state === 'shipped';
    case 'RESET':
      return state !== 'idle';
    case 'TELEMETRY_TICK':
      return true;
    default:
      return false;
  }
}

interface FulfillmentActor
  extends ActorRefLike<FulfillmentEvent, FulfillmentSnapshot> {
  getTelemetryTicks(): number;
}

function createFulfillmentActor(): FulfillmentActor {
  let state: FulfillmentStatus = 'idle';
  let context: FulfillmentContext = {
    sku: '',
    qty: 0,
    telemetryTicks: 0,
  };
  const listeners = new Set<StatechartObserverLike<FulfillmentSnapshot>>();

  const buildSnapshot = (): FulfillmentSnapshot => ({
    value: state,
    context,
    status: 'active',
    can: (event) => canTransition(state, event as FulfillmentEvent),
  });

  let snapshot = buildSnapshot();

  const emitSnapshot = () => {
    snapshot = buildSnapshot();
    for (const observer of [...listeners]) {
      observer.next?.(snapshot);
    }
  };

  return {
    getSnapshot: () => snapshot,
    getTelemetryTicks: () => context.telemetryTicks,
    send(event) {
      if (!canTransition(state, event)) return;
      switch (event.type) {
        case 'SUBMIT_ORDER':
          state = 'reserved';
          context = { ...context, sku: event.sku, qty: event.qty };
          break;
        case 'SHIP':
          state = 'shipped';
          break;
        case 'COMPLETE':
          state = 'completed';
          break;
        case 'CANCEL':
          state = 'cancelled';
          break;
        case 'RESET':
          state = 'idle';
          context = { sku: '', qty: 0, telemetryTicks: context.telemetryTicks };
          break;
        case 'TELEMETRY_TICK':
          context = { ...context, telemetryTicks: context.telemetryTicks + 1 };
          break;
      }
      emitSnapshot();
    },
    subscribe(observerOrListener) {
      const observer: StatechartObserverLike<FulfillmentSnapshot> =
        typeof observerOrListener === 'function'
          ? { next: observerOrListener }
          : observerOrListener;
      listeners.add(observer);
      return {
        unsubscribe() {
          listeners.delete(observer);
        },
      };
    },
  };
}

interface XStateRuntime {
  actor: FulfillmentActor;
  reader: ReturnType<
    typeof createActorStateReader<
      FulfillmentSnapshot,
      { state: FulfillmentStatus; sku: string; qty: number }
    >
  >;
}

function createXStateRuntime(): XStateRuntime {
  const actor = createFulfillmentActor();
  const reader = createActorStateReader('fulfillment-projection', actor, {
    select: (snap) => ({
      state: snap.value,
      sku: snap.context.sku,
      qty: snap.context.qty,
    }),
    equals: (a, b) => a.state === b.state && a.sku === b.sku && a.qty === b.qty,
  });
  return { actor, reader };
}

export default function XStateStatechartPage() {
  const [runtime] = useState<XStateRuntime>(() => createXStateRuntime());
  const registerRef = useRef<ActionRegister<FulfillmentActions> | null>(null);
  const [skuInput, setSkuInput] = useState('WIDGET-01');
  const [qtyInput, setQtyInput] = useState('3');
  const [telemetryCount, setTelemetryCount] = useState(0);
  const [traceLog, setTraceLog] = useState<string[]>([
    'Statechart ready in "idle". Standard Schema + actor.can() guards active.',
  ]);

  const projectedSnapshot = useSyncExternalStore(
    (cb) => runtime.reader.subscribe(cb),
    () => runtime.reader.getSnapshot(),
    () => runtime.reader.getSnapshot()
  );

  const appendLog = (entry: string) => {
    setTraceLog((prev) => [entry, ...prev].slice(0, 10));
  };

  useEffect(() => {
    const register = new ActionRegister<FulfillmentActions>({
      name: 'XStateFulfillmentActions',
    });
    registerRef.current = register;

    const unregisterSchema = registerStandardSchemaGuard(
      register,
      'submitOrder',
      orderStandardSchema,
      { priority: 110, id: 'order-standard-schema' }
    );

    const binding = bindActorToActionRegister(register, runtime.actor, {
      enforceCanGuard: true,
      guardPriority: 100,
      map: {
        submitOrder: (payload) => ({
          type: 'SUBMIT_ORDER' as const,
          sku: payload.sku,
          qty: payload.qty,
        }),
        shipOrder: () => ({ type: 'SHIP' as const }),
        completeOrder: () => ({ type: 'COMPLETE' as const }),
        cancelOrder: () => ({ type: 'CANCEL' as const }),
        resetOrder: () => ({ type: 'RESET' as const }),
      },
    });

    const unregisterTrace = register.subscribeDispatchTrace((trace) => {
      if (trace.phase !== 'settled') return;
      if (trace.status === 'cancelled') {
        appendLog(
          `BLOCKED (${trace.action}): rejected by Standard Schema or actor.can() guard`
        );
      } else {
        appendLog(
          `SETTLED (${trace.action}): status=${trace.status}, state=${runtime.actor.getSnapshot().value}`
        );
      }
    });

    return () => {
      unregisterTrace();
      binding.unbind();
      unregisterSchema();
      registerRef.current = null;
      void register.destroyAsync();
    };
  }, [runtime]);

  const handleSubmitOrder = async () => {
    const parsedQty = Number(qtyInput);
    await registerRef.current?.dispatch('submitOrder', {
      sku: skuInput,
      qty: Number.isNaN(parsedQty) ? 0 : parsedQty,
    });
  };

  const handleAction = async (
    action: 'shipOrder' | 'completeOrder' | 'cancelOrder' | 'resetOrder'
  ) => {
    await registerRef.current?.dispatch(action);
  };

  const handleTelemetryTick = () => {
    runtime.actor.send({ type: 'TELEMETRY_TICK' });
    setTelemetryCount(runtime.actor.getTelemetryTicks());
  };

  const schemaAdapter = fromStandardSchema(orderStandardSchema);
  const previewValidation = schemaAdapter.safeParse({
    sku: skuInput,
    qty: Number(qtyInput),
  });

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="primary">@context-action/xstate</Badge>
          <Badge variant="outline">@context-action/xstate/effect</Badge>
          <Badge variant="success">Standard Schema v1</Badge>
        </div>
        <h1 className="text-3xl font-bold text-slate-900">
          XState Actor Binding &amp; Standard Schema Effect Adapter
        </h1>
        <p className="text-slate-600">
          Demonstrates <code>bindActorToActionRegister</code> (enforcing{' '}
          <code>actor.can(event)</code> at the action guard phase),{' '}
          <code>registerStandardSchemaGuard</code> /{' '}
          <code>fromStandardSchema</code>, and memoized projection via{' '}
          <code>createActorStateReader</code>.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              1. Projected Actor State &amp; Noise-Free Filtering
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 text-sm">
              <div>
                <div className="text-xs text-slate-500">Statechart Status</div>
                <div
                  className="font-mono text-lg font-bold text-blue-700"
                  data-testid="actor-state"
                >
                  {projectedSnapshot.value.state}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">
                  Reader Snapshot Version
                </div>
                <div
                  className="font-mono text-lg font-bold"
                  data-testid="reader-version"
                >
                  {projectedSnapshot.version}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Normalized Order</div>
                <div className="font-mono" data-testid="projected-order">
                  {projectedSnapshot.value.sku || '—'} ×{' '}
                  {projectedSnapshot.value.qty}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">
                  Actor Telemetry Ticks (Unprojected)
                </div>
                <div className="font-mono" data-testid="telemetry-ticks">
                  {telemetryCount}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="sku-input">SKU (min 3 chars)</Label>
                <Input
                  id="sku-input"
                  value={skuInput}
                  onChange={(e) => setSkuInput(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="qty-input">Qty (1..50)</Label>
                <Input
                  id="qty-input"
                  type="number"
                  value={qtyInput}
                  onChange={(e) => setQtyInput(e.target.value)}
                />
              </div>
            </div>

            <div
              className="rounded border border-slate-200 px-3 py-2 text-xs"
              data-testid="schema-preview"
            >
              Standard Schema Preview:{' '}
              {previewValidation.success ? (
                <span className="text-emerald-700 font-medium">
                  Valid ({JSON.stringify(previewValidation.data)})
                </span>
              ) : (
                <span className="text-rose-700 font-medium">
                  Invalid ({previewValidation.error?.message})
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => void handleSubmitOrder()}>
                Submit Order
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void handleAction('shipOrder')}
              >
                Ship Order
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void handleAction('completeOrder')}
              >
                Complete Order
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => void handleAction('cancelOrder')}
              >
                Cancel Order
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void handleAction('resetOrder')}
              >
                Reset
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleTelemetryTick}
              >
                Send Unrelated Telemetry Tick
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Guard &amp; Transition Trace Log</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className="rounded bg-slate-900 p-3 font-mono text-xs text-slate-100 space-y-1 min-h-48"
              data-testid="xstate-trace-log"
            >
              {traceLog.map((line, idx) => (
                <div key={`${line}-${idx}`}>{line}</div>
              ))}
            </div>

            <CodeBlock size="sm">
              {`registerStandardSchemaGuard(register, 'submitOrder', orderStandardSchema);
const handle = bindActorToActionRegister(register, actor, {
  enforceCanGuard: true,
  map: { submitOrder, shipOrder, completeOrder, cancelOrder, resetOrder },
});
const reader = createActorStateReader('fulfillment-projection', actor, {
  select: (snap) => ({ state: snap.value, sku: snap.context.sku, qty: snap.context.qty }),
  equals: (a, b) => a.state === b.state && a.sku === b.sku && a.qty === b.qty,
});`}
            </CodeBlock>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
