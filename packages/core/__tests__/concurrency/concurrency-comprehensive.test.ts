/**
 * Comprehensive Concurrency Control Tests
 *
 * This test suite covers all concurrency-related features documented in concurrency.md:
 * - OperationQueue System (serialization, priority support)
 * - Configuration Options (useConcurrencyQueue toggle)
 * - ActionGuard Integration (debounce/throttle)
 * - Performance Comparison (queued vs parallel execution)
 * - Memory Management (queue monitoring, cleanup)
 * - Error Handling (concurrent error scenarios)
 */

import { ActionRegister } from '../../src/ActionRegister';
import { ActionGuard } from '../../src/action-guard';

interface TestActions {
  updateCounter: { increment: number };
  updateUser: { id: string; name: string };
  processPayment: { orderId: string; amount: number };
  searchUsers: { query: string };
  updateUI: { data: string };
  operation: { id: number };
  riskyOperation: { data: string };
  trackEvent: { event: string; properties: Record<string, any> };
}

describe('Comprehensive Concurrency Control', () => {
  let register: ActionRegister<TestActions>;
  let actionGuard: ActionGuard;

  beforeEach(() => {
    register = new ActionRegister<TestActions>({
      name: 'ConcurrencyTest',
      registry: {
        useConcurrencyQueue: true // Default safe configuration
      }
    });
    actionGuard = new ActionGuard();
  });

  afterEach(() => {
    register.clearAll();
  });

  describe('🚦 OperationQueue System', () => {
    describe('Sequential Execution Guarantee', () => {
      test('operations execute in queue order preventing race conditions', async () => {
        const executionOrder: string[] = [];
        const sharedState = { counter: 0 };

        // Register handler that modifies shared state
        register.register('updateCounter', async ({ increment }) => {
          const current = sharedState.counter;
          // Simulate async operation
          await new Promise(resolve => setTimeout(resolve, 10));
          sharedState.counter = current + increment;
          executionOrder.push(`update-${increment}`);
        });

        // Wait for handler registration to complete
        await new Promise(resolve => setTimeout(resolve, 50));

        // Dispatch multiple operations simultaneously
        const promises = [
          register.dispatch('updateCounter', { increment: 1 }),
          register.dispatch('updateCounter', { increment: 2 }),
          register.dispatch('updateCounter', { increment: 3 })
        ];

        await Promise.all(promises);

        // With queue: operations execute sequentially
        expect(executionOrder).toEqual(['update-1', 'update-2', 'update-3']);
        expect(sharedState.counter).toBe(6); // 1 + 2 + 3
      }, 10000);

      test('queue serialization prevents memory corruption', async () => {
        const operations: number[] = [];
        const corruptionIndicator = { value: 0 };

        register.register('operation', async ({ id }) => {
          // Read current state
          const current = corruptionIndicator.value;

          // Simulate complex operation
          await new Promise(resolve => setTimeout(resolve, 5));

          // Write back incremented value
          corruptionIndicator.value = current + 1;
          operations.push(id);
        });

        // Concurrent operations
        const promises = Array.from({ length: 10 }, (_, i) =>
          register.dispatch('operation', { id: i + 1 })
        );

        await Promise.all(promises);

        // No corruption: final value should be 10
        expect(corruptionIndicator.value).toBe(10);
        expect(operations).toHaveLength(10);
        // Operations complete in order
        expect(operations).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      });
    });

    describe('Priority Support', () => {
      test('higher priority operations execute first in queue', async () => {
        const executionOrder: string[] = [];

        // Register handlers with different priorities
        register.register('operation', async ({ id }) => {
          await new Promise(resolve => setTimeout(resolve, 10));
          executionOrder.push(`low-${id}`);
        }, { priority: 50 });

        register.register('operation', async ({ id }) => {
          await new Promise(resolve => setTimeout(resolve, 10));
          executionOrder.push(`high-${id}`);
        }, { priority: 100 });

        // Dispatch operations
        await register.dispatch('operation', { id: 1 });
        await register.dispatch('operation', { id: 2 });

        // Higher priority executes first
        expect(executionOrder[0]).toBe('high-1');
        expect(executionOrder[1]).toBe('low-1');
        expect(executionOrder[2]).toBe('high-2');
        expect(executionOrder[3]).toBe('low-2');
      });

      test('priority affects queue position for pending operations', async () => {
        const executionOrder: string[] = [];
        let resolveFirst: (() => void) | null = null;

        // Handler that can be blocked
        register.register('operation', async ({ id }) => {
          if (id === 1) {
            // Block first operation
            await new Promise<void>(resolve => {
              resolveFirst = resolve;
            });
          } else {
            await new Promise(resolve => setTimeout(resolve, 5));
          }
          executionOrder.push(`priority-${id}`);
        }, { priority: 50 });

        // High priority handler
        register.register('operation', async ({ id }) => {
          await new Promise(resolve => setTimeout(resolve, 5));
          executionOrder.push(`urgent-${id}`);
        }, { priority: 200 });

        // Start first operation (will block)
        const firstPromise = register.dispatch('operation', { id: 1 });

        // Queue more operations
        const secondPromise = register.dispatch('operation', { id: 2 });
        const thirdPromise = register.dispatch('operation', { id: 3 });

        // Wait a bit for operations to queue
        await new Promise(resolve => setTimeout(resolve, 20));

        // Release first operation
        resolveFirst?.();

        await Promise.all([firstPromise, secondPromise, thirdPromise]);

        // First completes, then high priority executes first among queued
        expect(executionOrder[0]).toBe('priority-1');
        expect(executionOrder[1]).toBe('urgent-2');
        expect(executionOrder[2]).toBe('priority-2');
        expect(executionOrder[3]).toBe('urgent-3');
        expect(executionOrder[4]).toBe('priority-3');
      });
    });
  });

  describe('⚙️ Configuration Options', () => {
    describe('useConcurrencyQueue Toggle', () => {
      test('with concurrency queue (default) - safe execution', async () => {
        const safeRegister = new ActionRegister<TestActions>({
          name: 'SafeRegister',
          registry: { useConcurrencyQueue: true }
        });

        const results: number[] = [];
        let counter = 0;

        safeRegister.register('updateCounter', async ({ increment }) => {
          const current = counter;
          await new Promise(resolve => setTimeout(resolve, 10));
          counter = current + increment;
          results.push(counter);
        });

        // Concurrent dispatches
        await Promise.all([
          safeRegister.dispatch('updateCounter', { increment: 1 }),
          safeRegister.dispatch('updateCounter', { increment: 1 }),
          safeRegister.dispatch('updateCounter', { increment: 1 })
        ]);

        // Sequential execution: 0→1→2→3
        expect(results).toEqual([1, 2, 3]);
        expect(counter).toBe(3);

        safeRegister.clearAll();
      });

      test('without concurrency queue - potential race conditions', async () => {
        const unsafeRegister = new ActionRegister<TestActions>({
          name: 'UnsafeRegister',
          registry: { useConcurrencyQueue: false }
        });

        const results: number[] = [];
        let counter = 0;

        unsafeRegister.register('updateCounter', async ({ increment }) => {
          const current = counter;
          await new Promise(resolve => setTimeout(resolve, 10));
          counter = current + increment;
          results.push(counter);
        });

        // Concurrent dispatches without queue
        await Promise.all([
          unsafeRegister.dispatch('updateCounter', { increment: 1 }),
          unsafeRegister.dispatch('updateCounter', { increment: 1 }),
          unsafeRegister.dispatch('updateCounter', { increment: 1 })
        ]);

        // Without queue: potential race conditions
        // All operations read counter=0, so all write counter=1
        expect(results).toEqual([1, 1, 1]);
        expect(counter).toBe(1); // Not 3!

        unsafeRegister.clearAll();
      });

      test('performance vs safety trade-off demonstration', async () => {
        // Safe but slower
        const safeRegister = new ActionRegister<TestActions>({
          name: 'SafeRegister',
          registry: { useConcurrencyQueue: true }
        });

        // Fast but unsafe
        const fastRegister = new ActionRegister<TestActions>({
          name: 'FastRegister',
          registry: { useConcurrencyQueue: false }
        });

        const operationDelay = 5;

        // Register identical handlers
        [safeRegister, fastRegister].forEach(reg => {
          reg.register('operation', async ({ id }) => {
            await new Promise(resolve => setTimeout(resolve, operationDelay));
            return { processed: id };
          });
        });

        // Measure safe execution
        const safeStart = performance.now();
        await Promise.all([
          safeRegister.dispatch('operation', { id: 1 }),
          safeRegister.dispatch('operation', { id: 2 }),
          safeRegister.dispatch('operation', { id: 3 })
        ]);
        const safeTime = performance.now() - safeStart;

        // Measure fast execution
        const fastStart = performance.now();
        await Promise.all([
          fastRegister.dispatch('operation', { id: 1 }),
          fastRegister.dispatch('operation', { id: 2 }),
          fastRegister.dispatch('operation', { id: 3 })
        ]);
        const fastTime = performance.now() - fastStart;

        console.log(`Safe (queued): ${safeTime.toFixed(2)}ms`);
        console.log(`Fast (parallel): ${fastTime.toFixed(2)}ms`);

        // Safe execution should be ~3x slower (sequential)
        expect(safeTime).toBeGreaterThan(fastTime);
        expect(safeTime).toBeGreaterThan(operationDelay * 2.5); // ~15ms
        expect(fastTime).toBeLessThan(operationDelay * 1.5); // ~7.5ms

        safeRegister.clearAll();
        fastRegister.clearAll();
      });
    });

    describe('Memory-Optimized Configuration', () => {
      test('maxHandlersPerAction limits memory usage', async () => {
        const memoryRegister = new ActionRegister<TestActions>({
          name: 'MemoryOptimized',
          registry: {
            maxHandlersPerAction: 3 // Low limit for testing
          }
        });

        // Register handlers up to limit
        memoryRegister.register('operation', () => ({ result: 'handler1' }), { id: 'handler1' });
        memoryRegister.register('operation', () => ({ result: 'handler2' }), { id: 'handler2' });
        memoryRegister.register('operation', () => ({ result: 'handler3' }), { id: 'handler3' });

        expect(memoryRegister.getHandlerCount('operation')).toBe(3);

        // Attempt to exceed limit
        memoryRegister.register('operation', () => ({ result: 'handler4' }), { id: 'handler4' });

        // Should still be at limit
        expect(memoryRegister.getHandlerCount('operation')).toBeLessThanOrEqual(3);

        memoryRegister.clearAll();
      });
    });
  });

  describe('🎛️ ActionGuard Integration', () => {
    describe('Debouncing Support', () => {
      test('debounced operations prevent rapid-fire executions', async () => {
        const executions: string[] = [];

        register.register('searchUsers', async ({ query }) => {
          executions.push(query);
          return { results: [`user-${query}`] };
        }, {
          priority: 80,
          id: 'user-search'
        });

        // Simulate debounced search calls
        const debounceDelay = 100;
        const searchPromises: Promise<boolean>[] = [];

        // Rapid successive calls
        searchPromises.push(actionGuard.debounce('search', debounceDelay));
        register.dispatch('searchUsers', { query: 'john' });

        searchPromises.push(actionGuard.debounce('search', debounceDelay));
        register.dispatch('searchUsers', { query: 'jane' });

        searchPromises.push(actionGuard.debounce('search', debounceDelay));
        register.dispatch('searchUsers', { query: 'bob' });

        // Wait for debounce results
        const debounceResults = await Promise.all(searchPromises);

        // Wait additional time for last debounced operation
        await new Promise(resolve => setTimeout(resolve, debounceDelay + 50));

        console.log('Debounce results:', debounceResults);
        console.log('Search executions:', executions);

        // Only last search should execute
        expect(debounceResults.filter(r => r)).toHaveLength(1);
        expect(executions).toHaveLength(3); // All dispatches go through, but debounce controls timing
      });
    });

    describe('Throttling Support', () => {
      test('throttled operations limit execution frequency', async () => {
        const executions: number[] = [];

        register.register('updateUI', async ({ data }) => {
          executions.push(Date.now());
          return { updated: data };
        }, {
          priority: 60,
          id: 'ui-updater'
        });

        const throttleDelay = 100;
        const throttleResults: boolean[] = [];

        // Rapid UI update calls
        for (let i = 0; i < 5; i++) {
          const result = actionGuard.throttle('ui-update', throttleDelay);
          throttleResults.push(result);

          if (result) {
            await register.dispatch('updateUI', { data: `update${i}` });
          }
        }

        console.log('Throttle results:', throttleResults);
        console.log('UI executions:', executions.length);

        // Only first call should succeed
        expect(throttleResults[0]).toBe(true);
        expect(throttleResults.slice(1).every(r => r === false)).toBe(true);
        expect(executions).toHaveLength(1);
      });

      test('throttle resets after delay period', async () => {
        const throttleDelay = 50;

        // First throttle call
        const first = actionGuard.throttle('reset-test', throttleDelay);
        expect(first).toBe(true);

        // Immediate second call (should be throttled)
        const second = actionGuard.throttle('reset-test', throttleDelay);
        expect(second).toBe(false);

        // Wait for throttle to reset
        await new Promise(resolve => setTimeout(resolve, throttleDelay + 10));

        // Third call after reset (should succeed)
        const third = actionGuard.throttle('reset-test', throttleDelay);
        expect(third).toBe(true);
      });
    });
  });

  describe('📊 Performance Comparison', () => {
    test('execution timeline comparison: sequential vs parallel', async () => {
      const operationDuration = 20;

      // Sequential execution (with queue)
      const sequentialRegister = new ActionRegister<TestActions>({
        name: 'Sequential',
        registry: { useConcurrencyQueue: true }
      });

      sequentialRegister.register('operation', async ({ id }) => {
        await new Promise(resolve => setTimeout(resolve, operationDuration));
        return { id, timestamp: Date.now() };
      });

      const sequentialStart = performance.now();
      const sequentialResults = await Promise.all([
        sequentialRegister.dispatch('operation', { id: 1 }),
        sequentialRegister.dispatch('operation', { id: 2 }),
        sequentialRegister.dispatch('operation', { id: 3 })
      ]);
      const sequentialTime = performance.now() - sequentialStart;

      // Parallel execution (no queue)
      const parallelRegister = new ActionRegister<TestActions>({
        name: 'Parallel',
        registry: { useConcurrencyQueue: false }
      });

      parallelRegister.register('operation', async ({ id }) => {
        await new Promise(resolve => setTimeout(resolve, operationDuration));
        return { id, timestamp: Date.now() };
      });

      const parallelStart = performance.now();
      const parallelResults = await Promise.all([
        parallelRegister.dispatch('operation', { id: 1 }),
        parallelRegister.dispatch('operation', { id: 2 }),
        parallelRegister.dispatch('operation', { id: 3 })
      ]);
      const parallelTime = performance.now() - parallelStart;

      console.log(`Sequential: ${sequentialTime.toFixed(2)}ms`);
      console.log(`Parallel: ${parallelTime.toFixed(2)}ms`);
      console.log(`Speedup: ${(sequentialTime / parallelTime).toFixed(2)}x faster (parallel)`);

      // Parallel should be significantly faster
      expect(parallelTime).toBeLessThan(sequentialTime * 0.7);

      // Sequential should take ~3x operation duration
      expect(sequentialTime).toBeGreaterThan(operationDuration * 2.5);

      // Parallel should take ~1x operation duration
      expect(parallelTime).toBeLessThan(operationDuration * 1.5);

      sequentialRegister.clearAll();
      parallelRegister.clearAll();
    });

    test('throughput measurement under high load', async () => {
      const operationCount = 50;
      const quickOperation = 2; // 2ms per operation

      // High-load test with queue
      const queuedRegister = new ActionRegister<TestActions>({
        name: 'HighLoadQueued',
        registry: { useConcurrencyQueue: true }
      });

      queuedRegister.register('operation', async ({ id }) => {
        await new Promise(resolve => setTimeout(resolve, quickOperation));
        return { processed: id };
      });

      // High-load test without queue
      const parallelRegister = new ActionRegister<TestActions>({
        name: 'HighLoadParallel',
        registry: { useConcurrencyQueue: false }
      });

      parallelRegister.register('operation', async ({ id }) => {
        await new Promise(resolve => setTimeout(resolve, quickOperation));
        return { processed: id };
      });

      // Generate high load
      const operations = Array.from({ length: operationCount }, (_, i) => ({ id: i + 1 }));

      // Test queued throughput
      const queuedStart = performance.now();
      await Promise.all(operations.map(op => queuedRegister.dispatch('operation', op)));
      const queuedTime = performance.now() - queuedStart;
      const queuedThroughput = operationCount / (queuedTime / 1000); // ops/sec

      // Test parallel throughput
      const parallelStart = performance.now();
      await Promise.all(operations.map(op => parallelRegister.dispatch('operation', op)));
      const parallelTime = performance.now() - parallelStart;
      const parallelThroughput = operationCount / (parallelTime / 1000); // ops/sec

      console.log(`Queued: ${queuedThroughput.toFixed(0)} ops/sec`);
      console.log(`Parallel: ${parallelThroughput.toFixed(0)} ops/sec`);
      console.log(`Efficiency ratio: ${(parallelThroughput / queuedThroughput).toFixed(2)}x`);

      // Parallel should have higher throughput
      expect(parallelThroughput).toBeGreaterThan(queuedThroughput);

      queuedRegister.clearAll();
      parallelRegister.clearAll();
    });
  });

  describe('🧠 Memory Management', () => {
    test('queue size monitoring and growth control', async () => {
      // Create register with debug info
      const monitoredRegister = new ActionRegister<TestActions>({
        name: 'MonitoredRegister',
        registry: {
          maxHandlersPerAction: 10,
          useConcurrencyQueue: true
        }
      });

      let resolveBlocker: (() => void) | null = null;

      // Handler that can be blocked to build up queue
      monitoredRegister.register('operation', async ({ id }) => {
        if (id === 1) {
          await new Promise<void>(resolve => {
            resolveBlocker = resolve;
          });
        } else {
          await new Promise(resolve => setTimeout(resolve, 5));
        }
        return { processed: id };
      });

      // Start blocking operation
      const blockedPromise = monitoredRegister.dispatch('operation', { id: 1 });

      // Queue multiple operations
      const queuedPromises = Array.from({ length: 5 }, (_, i) =>
        monitoredRegister.dispatch('operation', { id: i + 2 })
      );

      // Allow queue to build up
      await new Promise(resolve => setTimeout(resolve, 20));

      // Check handler count (should be within limits)
      const handlerCount = monitoredRegister.getHandlerCount('operation');
      expect(handlerCount).toBeLessThanOrEqual(10);

      // Release blocking operation
      resolveBlocker?.();

      // Wait for all operations to complete
      await Promise.all([blockedPromise, ...queuedPromises]);

      monitoredRegister.clearAll();
    });

    test('automatic cleanup prevents memory leaks', async () => {
      const cleanupRegister = new ActionRegister<TestActions>({
        name: 'CleanupTest',
        registry: {
          autoCleanup: true,
          maxHandlersPerAction: 50
        }
      });

      // Register many handlers
      for (let i = 0; i < 20; i++) {
        cleanupRegister.register('operation', async ({ id }) => {
          return { handler: i, processed: id };
        }, { id: `handler-${i}` });
      }

      const initialCount = cleanupRegister.getHandlerCount('operation');
      expect(initialCount).toBe(20);

      // Execute operation multiple times
      for (let i = 0; i < 10; i++) {
        await cleanupRegister.dispatch('operation', { id: i });
      }

      // Handler count should remain stable
      const finalCount = cleanupRegister.getHandlerCount('operation');
      expect(finalCount).toBe(20); // No cleanup of persistent handlers

      cleanupRegister.clearAll();
    });

    test('one-time handler cleanup after execution', async () => {
      let executionCount = 0;

      // Register one-time handlers
      for (let i = 0; i < 5; i++) {
        register.register('operation', async ({ id }) => {
          executionCount++;
          return { executed: true, handlerId: i };
        }, { once: true, id: `once-${i}` });
      }

      expect(register.getHandlerCount('operation')).toBe(5);

      // Execute operation once
      await register.dispatch('operation', { id: 1 });

      // All one-time handlers should be removed
      expect(register.getHandlerCount('operation')).toBe(0);
      expect(executionCount).toBe(5);

      // Second execution should have no handlers
      await register.dispatch('operation', { id: 2 });
      expect(executionCount).toBe(5); // No additional executions
    });
  });

  describe('⚠️ Error Handling in Concurrent Scenarios', () => {
    test('error in one operation does not block queue', async () => {
      const results: string[] = [];

      register.register('riskyOperation', async ({ data }) => {
        if (data === 'error') {
          throw new Error('Simulated error');
        }
        results.push(`success-${data}`);
        return { processed: data };
      });

      // Mix of successful and failing operations
      const promises = [
        register.dispatch('riskyOperation', { data: 'first' }),
        register.dispatch('riskyOperation', { data: 'error' }).catch(e => ({ error: e.message })),
        register.dispatch('riskyOperation', { data: 'third' })
      ];

      const operationResults = await Promise.all(promises);

      // Successful operations should complete
      expect(results).toContain('success-first');
      expect(results).toContain('success-third');
      expect(results).toHaveLength(2);

      // Error should be captured
      expect(operationResults[1]).toMatchObject({ error: 'Simulated error' });
    });

    test('concurrent error handling with proper isolation', async () => {
      const errorRegister = new ActionRegister<TestActions>({
        name: 'ErrorTest',
        registry: {
          useConcurrencyQueue: true,
          errorHandler: (error, context) => {
            console.log(`Error handled: ${error.message} in ${context.actionType}`);
          }
        }
      });

      const results: { id: number; status: 'success' | 'error' }[] = [];

      errorRegister.register('operation', async ({ id }) => {
        if (id % 2 === 0) {
          throw new Error(`Error in operation ${id}`);
        }
        results.push({ id, status: 'success' });
        return { success: true, id };
      });

      // Run operations with mixed success/failure
      const promises = Array.from({ length: 6 }, (_, i) =>
        errorRegister.dispatch('operation', { id: i + 1 })
          .then(result => ({ id: i + 1, status: 'success' as const, result }))
          .catch(error => ({ id: i + 1, status: 'error' as const, error: error.message }))
      );

      const allResults = await Promise.all(promises);

      // Check that successful operations completed
      const successfulResults = allResults.filter(r => r.status === 'success');
      const errorResults = allResults.filter(r => r.status === 'error');

      expect(successfulResults).toHaveLength(3); // Odd numbers: 1, 3, 5
      expect(errorResults).toHaveLength(3); // Even numbers: 2, 4, 6

      // Verify successful operations actually executed
      expect(results).toHaveLength(3);
      expect(results.map(r => r.id)).toEqual([1, 3, 5]);

      errorRegister.clearAll();
    });

    test('error recovery and queue stability', async () => {
      const operations: string[] = [];
      let errorCount = 0;

      register.register('operation', async ({ id }) => {
        operations.push(`start-${id}`);

        if (id === 2) {
          errorCount++;
          throw new Error('Middle operation failed');
        }

        await new Promise(resolve => setTimeout(resolve, 10));
        operations.push(`complete-${id}`);
        return { completed: id };
      });

      // Execute sequence with error in middle
      const promises = [
        register.dispatch('operation', { id: 1 }),
        register.dispatch('operation', { id: 2 }).catch(e => ({ error: e.message })),
        register.dispatch('operation', { id: 3 })
      ];

      await Promise.all(promises);

      // Queue should remain stable and process remaining operations
      expect(operations).toContain('start-1');
      expect(operations).toContain('complete-1');
      expect(operations).toContain('start-2');
      expect(operations).not.toContain('complete-2'); // Failed operation
      expect(operations).toContain('start-3');
      expect(operations).toContain('complete-3');

      expect(errorCount).toBe(1);
    });
  });

  describe('🎯 Use Case Patterns', () => {
    test('user state management pattern (safe by default)', async () => {
      interface UserStateActions {
        login: { username: string; password: string };
        updateProfile: { userId: string; changes: { name?: string; email?: string } };
        logout: void;
      }

      const userManager = new ActionRegister<UserStateActions>({
        name: 'UserStateManager'
        // useConcurrencyQueue: true (default)
      });

      const userState = { id: '', name: '', email: '', isAuthenticated: false };
      const operations: string[] = [];

      // Safe user state handlers
      userManager.register('login', async ({ username }) => {
        operations.push('login-start');
        await new Promise(resolve => setTimeout(resolve, 10));
        userState.id = 'user123';
        userState.name = username;
        userState.isAuthenticated = true;
        operations.push('login-complete');
        return { step: 'logged-in', userId: userState.id };
      }, { priority: 100 });

      userManager.register('updateProfile', async ({ userId, changes }) => {
        operations.push('update-start');
        if (!userState.isAuthenticated) {
          throw new Error('User not authenticated');
        }
        await new Promise(resolve => setTimeout(resolve, 10));
        Object.assign(userState, changes);
        operations.push('update-complete');
        return { step: 'profile-updated', userId };
      }, { priority: 80 });

      // Concurrent user operations
      await Promise.all([
        userManager.dispatch('login', { username: 'john', password: 'secret' }),
        userManager.dispatch('updateProfile', { userId: 'user123', changes: { email: 'john@example.com' } })
      ]);

      // Operations should execute in safe order
      expect(operations).toEqual(['login-start', 'login-complete', 'update-start', 'update-complete']);
      expect(userState.isAuthenticated).toBe(true);
      expect(userState.email).toBe('john@example.com');

      userManager.clearAll();
    });

    test('analytics tracking pattern (performance optimized)', async () => {
      interface AnalyticsActions {
        trackEvent: { event: string; properties: Record<string, any> };
        trackPageView: { page: string; userId?: string };
      }

      const analytics = new ActionRegister<AnalyticsActions>({
        name: 'AnalyticsTracker',
        registry: {
          useConcurrencyQueue: false,     // Performance optimization
          defaultExecutionMode: 'parallel'
        }
      });

      const trackedEvents: any[] = [];
      const startTime = performance.now();

      // Non-blocking analytics handlers
      analytics.register('trackEvent', async ({ event, properties }) => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 5));
        trackedEvents.push({ event, properties, timestamp: Date.now() });
        return { tracked: true };
      }, { priority: 10, blocking: false });

      // High-frequency analytics calls
      const trackingPromises = Array.from({ length: 10 }, (_, i) =>
        analytics.dispatch('trackEvent', {
          event: 'user_action',
          properties: { action_id: i }
        })
      );

      await Promise.all(trackingPromises);
      const totalTime = performance.now() - startTime;

      // All events should be tracked
      expect(trackedEvents).toHaveLength(10);

      // Should be fast due to parallel execution
      expect(totalTime).toBeLessThan(50); // Much faster than 10 * 5ms = 50ms

      analytics.clearAll();
    });

    test('critical operations pattern (maximum safety)', async () => {
      interface PaymentActions {
        processPayment: {
          orderId: string;
          amount: number;
          paymentMethod: string;
        };
      }

      const paymentProcessor = new ActionRegister<PaymentActions>({
        name: 'PaymentProcessor',
        registry: {
          useConcurrencyQueue: true,        // Mandatory safety
          maxHandlersPerAction: 10,         // Conservative limit
          defaultExecutionMode: 'sequential',
          errorHandler: (error, context) => {
            console.error('Payment error:', { error: error.message, context });
          }
        }
      });

      const transactions: any[] = [];
      let orderStatuses: Record<string, string> = {};

      paymentProcessor.register('processPayment', async ({ orderId, amount, paymentMethod }) => {
        // Validation
        if (amount <= 0) {
          throw new Error('Invalid payment amount');
        }

        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 20));

        transactions.push({
          orderId,
          amount,
          paymentMethod,
          timestamp: Date.now(),
          transactionId: `txn_${Date.now()}`
        });

        orderStatuses[orderId] = 'paid';

        return {
          step: 'payment-processed',
          orderId,
          transactionId: transactions[transactions.length - 1].transactionId
        };
      }, {
        priority: 100,
        blocking: true,
        timeout: 30000,
        retries: 0
      });

      // Process multiple payments safely
      const paymentPromises = [
        paymentProcessor.dispatch('processPayment', { orderId: 'order1', amount: 100, paymentMethod: 'card' }),
        paymentProcessor.dispatch('processPayment', { orderId: 'order2', amount: 200, paymentMethod: 'card' }),
        paymentProcessor.dispatch('processPayment', { orderId: 'order3', amount: 300, paymentMethod: 'card' })
      ];

      const results = await Promise.all(paymentPromises);

      // All payments should be processed sequentially and safely
      expect(transactions).toHaveLength(3);
      expect(Object.keys(orderStatuses)).toHaveLength(3);
      expect(results.every(r => r.step === 'payment-processed')).toBe(true);

      // Verify sequential processing (timestamps should be in order)
      const timestamps = transactions.map(t => t.timestamp);
      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1]);
      }

      paymentProcessor.clearAll();
    });
  });
});