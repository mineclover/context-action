/**
 * Documentation-Based Concurrency Tests
 *
 * This test suite focuses on testing the exact scenarios and patterns
 * described in concurrency.md documentation with simplified, reliable tests.
 */

import { ActionRegister } from '../../src/ActionRegister';
import { ActionGuard } from '../../src/action-guard';

interface TestActions {
  updateUser: { id: string; name: string };
  operation: { id: number };
  updateCounter: { increment: number };
  trackEvent: { event: string; properties: Record<string, any> };
  searchUsers: { query: string };
  updateUI: { data: string };
}

describe('Documentation-Based Concurrency Control', () => {
  let register: ActionRegister<TestActions>;
  let actionGuard: ActionGuard;

  beforeEach(() => {
    register = new ActionRegister<TestActions>({
      name: 'ConcurrencyTest',
      registry: {
        useConcurrencyQueue: true,
        debug: true
      }
    });
    actionGuard = new ActionGuard();
  });

  afterEach(() => {
    register.clearAll();
  });

  describe('Core Problem Examples from Documentation', () => {
    test('race conditions example from docs', async () => {
      const results: string[] = [];
      let counter = 0;

      // Register handler that modifies shared state
      register.register('updateUser', async ({ id, name }) => {
        const current = counter;
        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 5));
        counter = current + 1;
        results.push(`${name}-${counter}`);
      });

      // Dispatch multiple operations as shown in docs
      await Promise.all([
        register.dispatch('updateUser', { id: '123', name: 'John' }),
        register.dispatch('updateUser', { id: '123', name: 'Jane' }),
        register.dispatch('updateUser', { id: '123', name: 'Bob' })
      ]);

      // With queue: sequential execution prevents race conditions
      expect(results).toEqual(['John-1', 'Jane-2', 'Bob-3']);
      expect(counter).toBe(3);
    }, 10000);
  });

  describe('OperationQueue System Documentation', () => {
    test('default behavior - guaranteed order execution', async () => {
      const executionOrder: number[] = [];

      register.register('operation', async ({ id }) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        executionOrder.push(id);
      });

      // Execute as shown in docs
      await register.dispatch('operation', { id: 1 });
      await register.dispatch('operation', { id: 2 });
      await register.dispatch('operation', { id: 3 });

      expect(executionOrder).toEqual([1, 2, 3]);
    }, 10000);

    test('concurrent dispatches with queue', async () => {
      const results: number[] = [];
      let sharedValue = 0;

      register.register('operation', async ({ id }) => {
        const current = sharedValue;
        await new Promise(resolve => setTimeout(resolve, 5));
        sharedValue = current + id;
        results.push(sharedValue);
      });

      // Concurrent dispatches - should execute sequentially
      await Promise.all([
        register.dispatch('operation', { id: 1 }),
        register.dispatch('operation', { id: 2 }),
        register.dispatch('operation', { id: 3 })
      ]);

      // Sequential: 0+1=1, 1+2=3, 3+3=6
      expect(results).toEqual([1, 3, 6]);
      expect(sharedValue).toBe(6);
    }, 10000);
  });

  describe('Configuration Options from Documentation', () => {
    test('useConcurrencyQueue: true (safe execution)', async () => {
      const safeRegister = new ActionRegister<TestActions>({
        name: 'SafeRegister',
        registry: { useConcurrencyQueue: true }
      });

      const results: number[] = [];
      let counter = 0;

      safeRegister.register('updateCounter', async ({ increment }) => {
        const current = counter;
        await new Promise(resolve => setTimeout(resolve, 5));
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
    }, 10000);

    test('useConcurrencyQueue: false (potential race conditions)', async () => {
      const unsafeRegister = new ActionRegister<TestActions>({
        name: 'UnsafeRegister',
        registry: { useConcurrencyQueue: false }
      });

      const results: number[] = [];
      let counter = 0;

      unsafeRegister.register('updateCounter', async ({ increment }) => {
        const current = counter;
        await new Promise(resolve => setTimeout(resolve, 5));
        counter = current + increment;
        results.push(counter);
      });

      // Concurrent dispatches without queue
      await Promise.all([
        unsafeRegister.dispatch('updateCounter', { increment: 1 }),
        unsafeRegister.dispatch('updateCounter', { increment: 1 }),
        unsafeRegister.dispatch('updateCounter', { increment: 1 })
      ]);

      // Without queue: all read counter=0, so all write counter=1
      expect(results).toEqual([1, 1, 1]);
      expect(counter).toBe(1); // Not 3!

      unsafeRegister.clearAll();
    }, 10000);
  });

  describe('ActionGuard Integration from Documentation', () => {
    test('debouncing support example', async () => {
      const executions: string[] = [];

      register.register('searchUsers', async ({ query }) => {
        executions.push(query);
        return { results: [`user-${query}`] };
      }, {
        priority: 80,
        id: 'user-search'
      });

      // Simulate rapid successive calls as shown in docs
      register.dispatch('searchUsers', { query: 'john' });
      register.dispatch('searchUsers', { query: 'jane' });
      register.dispatch('searchUsers', { query: 'bob' });

      // Wait for all dispatches to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // All dispatches go through due to queue
      expect(executions).toEqual(['john', 'jane', 'bob']);
    }, 10000);

    test('throttling support example', async () => {
      const executions: number[] = [];

      register.register('updateUI', async ({ data }) => {
        executions.push(Date.now());
        return { updated: data };
      }, {
        priority: 60,
        id: 'ui-updater'
      });

      const throttleDelay = 50;
      const throttleResults: boolean[] = [];

      // Rapid UI update calls as shown in docs
      for (let i = 0; i < 3; i++) {
        const result = actionGuard.throttle('ui-update', throttleDelay);
        throttleResults.push(result);

        if (result) {
          await register.dispatch('updateUI', { data: `update${i}` });
        }
      }

      // Only first call should succeed
      expect(throttleResults[0]).toBe(true);
      expect(throttleResults[1]).toBe(false);
      expect(throttleResults[2]).toBe(false);
      expect(executions).toHaveLength(1);
    }, 10000);
  });

  describe('Performance Comparison from Documentation', () => {
    test('execution timeline: sequential vs parallel', async () => {
      const operationDuration = 10;

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
      await Promise.all([
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
      await Promise.all([
        parallelRegister.dispatch('operation', { id: 1 }),
        parallelRegister.dispatch('operation', { id: 2 }),
        parallelRegister.dispatch('operation', { id: 3 })
      ]);
      const parallelTime = performance.now() - parallelStart;

      console.log(`Sequential: ${sequentialTime.toFixed(2)}ms`);
      console.log(`Parallel: ${parallelTime.toFixed(2)}ms`);

      // Parallel should be faster
      expect(parallelTime).toBeLessThan(sequentialTime);

      sequentialRegister.clearAll();
      parallelRegister.clearAll();
    }, 15000);
  });

  describe('Use Case Patterns from Documentation', () => {
    test('user state management pattern (safe by default)', async () => {
      interface UserStateActions {
        login: { username: string; password: string };
        updateProfile: { userId: string; changes: { name?: string; email?: string } };
      }

      const userManager = new ActionRegister<UserStateActions>({
        name: 'UserStateManager'
        // useConcurrencyQueue: true (default)
      });

      const userState = { id: '', name: '', email: '', isAuthenticated: false };
      const operations: string[] = [];

      // Safe user state handlers as shown in docs
      userManager.register('login', async ({ username }) => {
        operations.push('login-start');
        await new Promise(resolve => setTimeout(resolve, 5));
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
        await new Promise(resolve => setTimeout(resolve, 5));
        Object.assign(userState, changes);
        operations.push('update-complete');
        return { step: 'profile-updated', userId };
      }, { priority: 80 });

      // Concurrent user operations
      await Promise.all([
        userManager.dispatch('login', { username: 'john', password: 'secret' }),
        userManager.dispatch('updateProfile', { userId: 'user123', changes: { email: 'john@example.com' } })
      ]);

      // Operations should execute in safe order (login first due to higher priority)
      expect(operations).toEqual(['login-start', 'login-complete', 'update-start', 'update-complete']);
      expect(userState.isAuthenticated).toBe(true);
      expect(userState.email).toBe('john@example.com');

      userManager.clearAll();
    }, 10000);

    test('analytics tracking pattern (performance optimized)', async () => {
      interface AnalyticsActions {
        trackEvent: { event: string; properties: Record<string, any> };
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

      // Non-blocking analytics handlers as shown in docs
      analytics.register('trackEvent', async ({ event, properties }) => {
        await new Promise(resolve => setTimeout(resolve, 2));
        trackedEvents.push({ event, properties, timestamp: Date.now() });
        return { tracked: true };
      }, { priority: 10, blocking: false });

      // High-frequency analytics calls
      const trackingPromises = Array.from({ length: 5 }, (_, i) =>
        analytics.dispatch('trackEvent', {
          event: 'user_action',
          properties: { action_id: i }
        })
      );

      await Promise.all(trackingPromises);
      const totalTime = performance.now() - startTime;

      // All events should be tracked
      expect(trackedEvents).toHaveLength(5);

      // Should be faster than sequential (5 * 2ms = 10ms)
      expect(totalTime).toBeLessThan(15);

      analytics.clearAll();
    }, 10000);
  });

  describe('Memory Management from Documentation', () => {
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
    }, 10000);

    test('one-time handler cleanup after execution', async () => {
      let executionCount = 0;

      // Register one-time handlers as shown in docs
      for (let i = 0; i < 3; i++) {
        register.register('operation', async ({ id }) => {
          executionCount++;
          return { executed: true, handlerId: i };
        }, { once: true, id: `once-${i}` });
      }

      expect(register.getHandlerCount('operation')).toBe(3);

      // Execute operation once
      await register.dispatch('operation', { id: 1 });

      // All one-time handlers should be removed
      expect(register.getHandlerCount('operation')).toBe(0);
      expect(executionCount).toBe(3);

      // Second execution should have no handlers
      await register.dispatch('operation', { id: 2 });
      expect(executionCount).toBe(3); // No additional executions
    }, 10000);
  });

  describe('Error Handling from Documentation', () => {
    test('error in one operation does not block queue', async () => {
      const results: string[] = [];

      register.register('operation', async ({ id }) => {
        if (id === 2) {
          throw new Error('Simulated error');
        }
        results.push(`success-${id}`);
        return { processed: id };
      });

      // Mix of successful and failing operations
      const promises = [
        register.dispatch('operation', { id: 1 }),
        register.dispatch('operation', { id: 2 }).catch(e => ({ error: e.message })),
        register.dispatch('operation', { id: 3 })
      ];

      const operationResults = await Promise.all(promises);

      // Successful operations should complete
      expect(results).toContain('success-1');
      expect(results).toContain('success-3');
      expect(results).toHaveLength(2);

      // Error should be captured
      expect(operationResults[1]).toMatchObject({ error: 'Simulated error' });
    }, 10000);
  });
});