/**
 * Real-world Order Checkout + High-Frequency Metric Tracking example.
 * Run directly with Node 24+:
 *   node packages/core/examples/order-checkout-demo.ts
 */

import { performance } from 'node:perf_hooks';
import {
  ActionRegister,
  isActionRegisterDestroyedError,
  isActionTimeoutError,
  type ActionPayloadMap,
  type ActionResultMap,
} from '@context-action/core';

interface CheckoutItem {
  sku: string;
  qty: number;
  unitPrice: number;
}

interface CheckoutActions extends ActionPayloadMap {
  checkoutOrder: {
    orderId: string;
    customerId: string;
    items: CheckoutItem[];
    couponCode?: string;
    simulateDelayMs?: number;
    failOnceKey?: string;
  };
  trackMetric: {
    name: string;
    value: number;
  };
}

interface CheckoutResults extends ActionResultMap<CheckoutActions> {
  checkoutOrder: {
    receiptId: string;
    chargedAmount: number;
    discounted: boolean;
    normalizedCoupon?: string;
  };
}

function waitWithSignal(ms: number, signal?: AbortSignal): Promise<boolean> {
  if (signal?.aborted) return Promise.resolve(false);
  if (ms <= 0) return Promise.resolve(true);

  return new Promise(resolve => {
    const onAbort = () => {
      clearTimeout(timer);
      resolve(false);
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve(true);
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

async function main() {
  const inventoryReservations = new Map<string, number>();
  const transientFailuresRemaining = new Set<string>(['net-glitch']);
  const phaseCounts = new Map<string, { guard: number; command: number; result: number }>();
  const reportedErrors: Array<{ orderId?: string; phase: string; message: string }> = [];
  const abortedSignalsObserved: Array<{ orderId: string; aborted: boolean }> = [];
  const metricTotals = new Map<string, number>();

  const bumpPhase = (orderId: string, phase: 'guard' | 'command' | 'result') => {
    const entry = phaseCounts.get(orderId) ?? { guard: 0, command: 0, result: 0 };
    entry[phase] += 1;
    phaseCounts.set(orderId, entry);
  };

  const register = new ActionRegister<CheckoutActions, CheckoutResults>({
    name: 'OrderCheckoutDemo',
    actions: {
      checkoutOrder: { lane: 'orchestrated', queue: 'serial', timeout: 2000 },
      // lane: 'fast' implies queue:'immediate' + trace:false + fail-closed invariants
      trackMetric: { lane: 'fast' },
    },
    registry: {
      errorHandler: (error, context) => {
        const ctx = context as { payload?: { orderId?: string }; phase?: string } | undefined;
        reportedErrors.push({
          orderId: ctx?.payload?.orderId,
          phase: ctx?.phase ?? 'execution',
          message: error.message,
        });
      },
    },
  });

  // 1. Guard Phase (Admission & Payload Normalization — runs once outside retry)
  register.registerGuard(
    'checkoutOrder',
    (payload, controller) => {
      bumpPhase(payload.orderId, 'guard');
      if (payload.items.length === 0) {
        console.log(`  [Guard:100] ${payload.orderId} -> abort("Cart cannot be empty")`);
        controller.abort('Cart cannot be empty');
        return;
      }
      for (const item of payload.items) {
        if (item.qty <= 0) {
          console.log(`  [Guard:100] ${payload.orderId} -> abort(invalid qty)`);
          controller.abort(`Invalid quantity for SKU "${item.sku}"`);
          return;
        }
      }
      console.log(`  [Guard:100] ${payload.orderId} validated (${payload.items.length} line item(s))`);
    },
    { id: 'guard-items', priority: 100 },
  );

  register.registerGuard(
    'checkoutOrder',
    (payload, controller) => {
      if (typeof payload.couponCode === 'string') {
        const normalized = payload.couponCode.trim().toUpperCase();
        console.log(
          `  [Guard:90]  ${payload.orderId} modifyPayload coupon "${payload.couponCode}" -> "${normalized}"`,
        );
        controller.modifyPayload(prev => ({
          ...prev,
          couponCode: normalized.length > 0 ? normalized : undefined,
        }));
      }
    },
    { id: 'guard-normalize-coupon', priority: 90 },
  );

  // 2. Command Phase (Phase 2 void side-effect; idempotent across retries)
  register.registerCommand(
    'checkoutOrder',
    payload => {
      bumpPhase(payload.orderId, 'command');
      const totalUnits = payload.items.reduce((sum, item) => sum + item.qty, 0);
      inventoryReservations.set(payload.orderId, totalUnits);
      console.log(`  [Command:50] ${payload.orderId} reserved ${totalUnits} unit(s) (idempotent)`);
    },
    { id: 'cmd-reserve-inventory', priority: 50 },
  );

  // 3. Result Phase (Typed result generation with cooperative signal & retry simulation)
  register.registerResult(
    'checkoutOrder',
    async (payload, controller) => {
      bumpPhase(payload.orderId, 'result');
      if (payload.simulateDelayMs !== undefined) {
        console.log(
          `  [Result:40]  ${payload.orderId} waiting ${payload.simulateDelayMs}ms for gateway...`,
        );
        const completed = await waitWithSignal(payload.simulateDelayMs, controller.signal);
        if (!completed) {
          abortedSignalsObserved.push({
            orderId: payload.orderId,
            aborted: controller.signal?.aborted === true,
          });
          console.log(`  [Result:40]  ${payload.orderId} observed signal.aborted=true -> draining`);
          throw new Error('Payment gateway request aborted by signal');
        }
      }

      if (payload.failOnceKey && transientFailuresRemaining.has(payload.failOnceKey)) {
        transientFailuresRemaining.delete(payload.failOnceKey);
        console.log(`  [Result:40]  ${payload.orderId} attempt failed transiently -> will retry`);
        throw new Error(`Transient network error for "${payload.failOnceKey}"`);
      }

      const subtotal = payload.items.reduce(
        (sum, item) => sum + item.qty * item.unitPrice,
        0,
      );
      const discounted = payload.couponCode === 'SAVE10';
      const chargedAmount = discounted ? Math.round(subtotal * 0.9) : subtotal;
      console.log(`  [Result:40]  ${payload.orderId} charged ${chargedAmount} (discounted=${discounted})`);

      return {
        receiptId: `rcpt-${payload.orderId}`,
        chargedAmount,
        discounted,
        normalizedCoupon: payload.couponCode,
      };
    },
    {
      id: 'res-charge-payment',
      priority: 40,
      scheduling: 'await-before-next',
      errorPolicy: 'fatal',
    },
  );

  // 4. Observer Phase (Immutable terminal notifications)
  register.registerObserver(
    'checkoutOrder',
    event => {
      console.log('  [Observer:success (when:"success")]', {
        outcome: event.outcome,
        result: event.result,
      });
    },
    { id: 'obs-audit-success', when: 'success' },
  );

  register.registerObserver(
    'checkoutOrder',
    event => {
      console.log('  [Observer:non-success (when:"failure")]', {
        outcome: event.outcome,
        errorCount: event.errors.length,
        note: 'when:"failure" fires for failed | cancelled | debounced | throttled',
      });
    },
    { id: 'obs-audit-failure', when: 'failure' },
  );

  // 5. Fast-Path Eligible Metric Handler (immediate-only policy, no guard/observer/timing/once/schema)
  register.registerCommand(
    'trackMetric',
    payload => {
      metricTotals.set(
        payload.name,
        (metricTotals.get(payload.name) ?? 0) + payload.value,
      );
    },
    { id: 'cmd-track-metric' },
  );

  console.log('=== Scenario 1: Normal Checkout (SAVE10 coupon normalization) ===');
  const normalResult = await register.actionsWithResult.checkoutOrder(
    {
      orderId: 'ORD-101',
      customerId: 'cust-1',
      items: [
        { sku: 'KB-1', qty: 1, unitPrice: 12000 },
        { sku: 'MS-2', qty: 2, unitPrice: 4000 },
      ],
      couponCode: '  save10  ',
    },
    { result: { collect: true, strategy: 'first' } },
  );
  console.log('Result:', {
    outcome: normalResult.outcome,
    result: normalResult.result,
    reservedUnits: inventoryReservations.get('ORD-101'),
    phaseCounts: phaseCounts.get('ORD-101'),
  });

  console.log('\n=== Scenario 2: Guard Cancellation (Empty Cart) ===');
  const cancelledResult = await register.dispatchWithResult('checkoutOrder', {
    orderId: 'ORD-102',
    customerId: 'cust-2',
    items: [],
  });
  console.log('Result:', {
    outcome: cancelledResult.outcome,
    aborted: cancelledResult.aborted,
    abortReason: cancelledResult.abortReason,
    reservedUnits: inventoryReservations.get('ORD-102') ?? 0,
    phaseCounts: phaseCounts.get('ORD-102'),
  });

  console.log('\n=== Scenario 3: Wall-Clock Timeout & Cooperative Signal ===');
  try {
    await register.dispatchWithResult(
      'checkoutOrder',
      {
        orderId: 'ORD-103',
        customerId: 'cust-3',
        items: [{ sku: 'MN-1', qty: 1, unitPrice: 50000 }],
        simulateDelayMs: 120,
      },
      { timeout: 30 },
    );
  } catch (error) {
    if (isActionTimeoutError(error)) {
      await Promise.resolve();
      console.log('Timeout caught:', {
        name: error.name,
        action: error.action,
        timeout: error.timeout,
        abortedSignalsObserved,
        phaseCounts: phaseCounts.get('ORD-103'),
      });
    } else {
      throw error;
    }
  }

  console.log('\n=== Scenario 4: Transient Error Retry + Action-Scoped Dispatch Trace ===');
  const traceLog: Array<{ action: string; phase: string; status?: string }> = [];
  const unsubscribeTrace = register.subscribeDispatchTrace(
    event => {
      traceLog.push({ action: event.action, phase: event.phase, status: event.status });
    },
    { actions: ['checkoutOrder'] },
  );

  const retryResult = await register.dispatchWithResult(
    'checkoutOrder',
    {
      orderId: 'ORD-104',
      customerId: 'cust-4',
      items: [{ sku: 'HD-1', qty: 1, unitPrice: 30000 }],
      failOnceKey: 'net-glitch',
    },
    {
      result: { collect: true, strategy: 'first' },
      retryOnError: { maxAttempts: 2, delay: 10 },
    },
  );

  console.log('Retry result:', {
    outcome: retryResult.outcome,
    result: retryResult.result,
    phaseCounts: phaseCounts.get('ORD-104'), // guard=1 (preflight), command=2, result=2
    attemptCount: retryResult.execution.attempts?.length,
    attemptOutcomes: retryResult.execution.attempts?.map(attempt => attempt.outcome),
    traces: traceLog,
  });

  console.log(
    '\n=== Scenario 5: Fast Lane (lane:"fast" while scoped trace stays active) vs Slow Path ===',
  );
  // Proves scoped trace fails closed when targeting a lane:'fast' action
  let fastTraceRejected = false;
  try {
    register.subscribeDispatchTrace(() => undefined, { actions: ['trackMetric'] });
  } catch (error) {
    fastTraceRejected = error instanceof TypeError;
  }

  const traceCountBeforeMetrics = traceLog.length;
  const warmupCount = 500;
  for (let i = 0; i < warmupCount; i++) {
    await register.dispatch('trackMetric', { name: 'warmup', value: 1 });
    await register.dispatchWithResult('trackMetric', { name: 'warmup', value: 1 });
  }

  const metricCount = 10_000;
  const tFast0 = performance.now();
  for (let i = 0; i < metricCount; i++) {
    await register.dispatch('trackMetric', { name: 'fast_page_view', value: 1 });
  }
  const fastMs = performance.now() - tFast0;

  const tSlow0 = performance.now();
  for (let i = 0; i < metricCount; i++) {
    await register.dispatchWithResult('trackMetric', { name: 'slow_page_view', value: 1 });
  }
  const slowMs = performance.now() - tSlow0;
  unsubscribeTrace();

  console.log('Metric benchmark (10,000 dispatches each, scoped checkout trace active):', {
    fastPathTotal: metricTotals.get('fast_page_view'),
    fastPathMs: Number(fastMs.toFixed(2)),
    slowPathTotal: metricTotals.get('slow_page_view'),
    slowPathMs: Number(slowMs.toFixed(2)),
    fastPathSpeedup: `${(slowMs / Math.max(fastMs, 0.01)).toFixed(1)}x`,
    checkoutTraceLeakCount: traceLog.length - traceCountBeforeMetrics,
    fastTraceSubscriptionRejected: fastTraceRejected,
  });

  await register.destroyAsync();
  try {
    await register.dispatch('trackMetric', { name: 'after_destroy', value: 1 });
  } catch (error) {
    console.log('Post-destroy rejection:', {
      isDestroyedError: isActionRegisterDestroyedError(error),
      message: error instanceof Error ? error.message : String(error),
    });
  }

  console.log('\nTerminal errors reported to registry.errorHandler:', reportedErrors);
}

main().catch(error => {
  console.error('Example failed unexpectedly:', error);
  process.exitCode = 1;
});
