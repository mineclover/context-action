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
  const reportedErrors: Array<{ message: string; payload: unknown }> = [];
  const abortedSignalsObserved: Array<{ orderId: string; aborted: boolean }> = [];
  const metricTotals = new Map<string, number>();

  const register = new ActionRegister<CheckoutActions, CheckoutResults>({
    name: 'OrderCheckoutDemo',
    actions: {
      checkoutOrder: { queue: 'serial', timeout: 2000 },
      trackMetric: { queue: 'immediate' },
    },
    registry: {
      errorHandler: (error, context) => {
        reportedErrors.push({
          message: error.message,
          payload: (context as { payload?: unknown } | undefined)?.payload,
        });
      },
    },
  });

  // 1. Guard Phase (Admission & Payload Normalization)
  register.registerGuard(
    'checkoutOrder',
    (payload, controller) => {
      if (payload.items.length === 0) {
        controller.abort('Cart cannot be empty');
        return;
      }
      for (const item of payload.items) {
        if (item.qty <= 0) {
          controller.abort(`Invalid quantity for SKU "${item.sku}"`);
          return;
        }
      }
    },
    { id: 'guard-items', priority: 100 },
  );

  register.registerGuard(
    'checkoutOrder',
    (payload, controller) => {
      if (typeof payload.couponCode === 'string') {
        const normalized = payload.couponCode.trim().toUpperCase();
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
      const totalUnits = payload.items.reduce((sum, item) => sum + item.qty, 0);
      inventoryReservations.set(payload.orderId, totalUnits);
    },
    { id: 'cmd-reserve-inventory', priority: 50 },
  );

  // 3. Result Phase (Typed result generation with cooperative signal & retry simulation)
  register.registerResult(
    'checkoutOrder',
    async (payload, controller) => {
      if (payload.simulateDelayMs !== undefined) {
        const completed = await waitWithSignal(payload.simulateDelayMs, controller.signal);
        if (!completed) {
          abortedSignalsObserved.push({
            orderId: payload.orderId,
            aborted: controller.signal?.aborted === true,
          });
          throw new Error('Payment gateway request aborted by signal');
        }
      }

      if (payload.failOnceKey && transientFailuresRemaining.has(payload.failOnceKey)) {
        transientFailuresRemaining.delete(payload.failOnceKey);
        throw new Error(`Transient network error for "${payload.failOnceKey}"`);
      }

      const subtotal = payload.items.reduce(
        (sum, item) => sum + item.qty * item.unitPrice,
        0,
      );
      const discounted = payload.couponCode === 'SAVE10';
      const chargedAmount = discounted ? Math.round(subtotal * 0.9) : subtotal;

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
      console.log('[Observer:success]', {
        outcome: event.outcome,
        result: event.result,
      });
    },
    { id: 'obs-audit-success', when: 'success' },
  );

  register.registerObserver(
    'checkoutOrder',
    event => {
      console.log('[Observer:failure]', {
        outcome: event.outcome,
        errorCount: event.errors.length,
      });
    },
    { id: 'obs-audit-failure', when: 'failure' },
  );

  // 5. Fast-Path Eligible Metric Handler (no guard/observer/timing/once/queue/schema)
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
      // Allow the cooperatively aborted handler microtask to settle cleanly
      await Promise.resolve();
      console.log('Timeout caught:', {
        name: error.name,
        action: error.action,
        timeout: error.timeout,
        abortedSignalsObserved,
      });
    } else {
      throw error;
    }
  }

  console.log('\n=== Scenario 4: Transient Error Retry + Dispatch Trace ===');
  const traceLog: Array<{ phase: string; status?: string }> = [];
  const unsubscribeTrace = register.subscribeDispatchTrace(event => {
    if (event.action === 'checkoutOrder') {
      traceLog.push({ phase: event.phase, status: event.status });
    }
  });

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
  unsubscribeTrace();

  console.log('Retry result:', {
    outcome: retryResult.outcome,
    result: retryResult.result,
    attemptCount: retryResult.execution.attempts?.length,
    attemptOutcomes: retryResult.execution.attempts?.map(attempt => attempt.outcome),
    traces: traceLog,
  });

  console.log('\n=== Scenario 5: Fast Sequential Path (10,000 metrics) & Graceful Shutdown ===');
  const metricCount = 10_000;
  const t0 = performance.now();
  for (let i = 0; i < metricCount; i++) {
    await register.dispatch('trackMetric', { name: 'page_view', value: 1 });
  }
  const elapsedMs = performance.now() - t0;
  console.log('Fast path metrics:', {
    dispatches: metricCount,
    recordedTotal: metricTotals.get('page_view'),
    elapsedMs: Number(elapsedMs.toFixed(2)),
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

  console.log('\nReported terminal errors via registry.errorHandler:', reportedErrors.length);
}

main().catch(error => {
  console.error('Example failed unexpectedly:', error);
  process.exitCode = 1;
});
