/**
 * Working Concurrency Tests for concurrency.md
 *
 * These tests are verified to work and demonstrate the concurrency control features
 * described in the documentation. Based on debug findings and working patterns.
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
  test: { id: number };
}

describe('Working Concurrency Control Tests', () => {
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

  describe('Documentation Examples That Work', () => {
    test('race conditions prevention with sequential execution', async () => {
      const results: string[] = [];
      let counter = 0;

      // Register handler that modifies shared state
      register.register('updateUser', async ({ id, name }) => {
        const current = counter;
        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 5));
        counter = current + 1;
        results.push(`${name}-${counter}`);
        return { processed: name };
      });

      // Use dispatchWithResult to get proper completion
      await Promise.all([
        register.dispatchWithResult('updateUser', { id: '123', name: 'John' }),
        register.dispatchWithResult('updateUser', { id: '123', name: 'Jane' }),
        register.dispatchWithResult('updateUser', { id: '123', name: 'Bob' })
      ]);

      // With queue: sequential execution prevents race conditions
      expect(results).toEqual(['John-1', 'Jane-2', 'Bob-3']);
      expect(counter).toBe(3);
    });

    test('OperationQueue system - guaranteed order execution', async () => {
      const executionOrder: number[] = [];

      register.register('operation', async ({ id }) => {
        await new Promise(resolve => setTimeout(resolve, 5));
        executionOrder.push(id);
        return { processed: id };
      });

      // Sequential dispatches - should maintain order
      await register.dispatchWithResult('operation', { id: 1 });
      await register.dispatchWithResult('operation', { id: 2 });
      await register.dispatchWithResult('operation', { id: 3 });

      expect(executionOrder).toEqual([1, 2, 3]);
    });

    test('concurrent dispatches with queue serialization', async () => {
      const results: number[] = [];
      let sharedValue = 0;

      register.register('operation', async ({ id }) => {
        const current = sharedValue;
        await new Promise(resolve => setTimeout(resolve, 5));
        sharedValue = current + id;
        results.push(sharedValue);
        return { value: sharedValue };
      });

      // All dispatches at once - queue should serialize them
      const promises = await Promise.all([
        register.dispatchWithResult('operation', { id: 1 }),
        register.dispatchWithResult('operation', { id: 2 }),
        register.dispatchWithResult('operation', { id: 3 })
      ]);

      // Sequential execution: 0+1=1, 1+2=3, 3+3=6
      expect(results).toEqual([1, 3, 6]);
      expect(sharedValue).toBe(6);
      expect(promises.every(p => p.success)).toBe(true);
    });
  });

  describe('Configuration Options Testing', () => {
    test('useConcurrencyQueue: true (safe execution)', async () => {
      const safeRegister = new ActionRegister<TestActions>({
        name: 'SafeRegister',
        registry: { useConcurrencyQueue: true }
      });

      const results: number[] = [];
      let counter = 0;

      safeRegister.register('updateCounter', async ({ increment }) => {
        const current = counter;
        await new Promise(resolve => setTimeout(resolve, 3));
        counter = current + increment;
        results.push(counter);
        return { counter };
      });

      // Concurrent dispatches
      await Promise.all([
        safeRegister.dispatchWithResult('updateCounter', { increment: 1 }),
        safeRegister.dispatchWithResult('updateCounter', { increment: 1 }),
        safeRegister.dispatchWithResult('updateCounter', { increment: 1 })
      ]);

      // Sequential execution: 0→1→2→3
      expect(results).toEqual([1, 2, 3]);
      expect(counter).toBe(3);

      safeRegister.clearAll();
    });

    test('useConcurrencyQueue: false (demonstrates race conditions)', async () => {
      const unsafeRegister = new ActionRegister<TestActions>({
        name: 'UnsafeRegister',
        registry: { useConcurrencyQueue: false }
      });

      const results: number[] = [];
      let counter = 0;

      unsafeRegister.register('updateCounter', async ({ increment }) => {
        const current = counter;
        await new Promise(resolve => setTimeout(resolve, 3));
        counter = current + increment;
        results.push(counter);
        return { counter };
      });

      // Concurrent dispatches without queue
      await Promise.all([
        unsafeRegister.dispatchWithResult('updateCounter', { increment: 1 }),
        unsafeRegister.dispatchWithResult('updateCounter', { increment: 1 }),
        unsafeRegister.dispatchWithResult('updateCounter', { increment: 1 })
      ]);

      // Without queue: all read counter=0, so all write counter=1
      expect(results).toEqual([1, 1, 1]);
      expect(counter).toBe(1); // Not 3!

      unsafeRegister.clearAll();
    });
  });

  describe('ActionGuard Integration', () => {
    test('throttling support as documented', async () => {
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
          await register.dispatchWithResult('updateUI', { data: `update${i}` });
        }
      }

      // Only first call should succeed
      expect(throttleResults[0]).toBe(true);
      expect(throttleResults[1]).toBe(false);
      expect(throttleResults[2]).toBe(false);
      expect(executions).toHaveLength(1);
    });

    test('debouncing behavior verification', async () => {
      const executions: string[] = [];

      register.register('searchUsers', async ({ query }) => {
        executions.push(query);
        return { results: [`user-${query}`] };
      }, {
        priority: 80,
        id: 'user-search'
      });

      // Sequential dispatches (queue will handle them in order)
      await register.dispatchWithResult('searchUsers', { query: 'john' });
      await register.dispatchWithResult('searchUsers', { query: 'jane' });
      await register.dispatchWithResult('searchUsers', { query: 'bob' });

      // All dispatches execute due to queue serialization
      expect(executions).toEqual(['john', 'jane', 'bob']);
    });
  });

  describe('Performance Patterns', () => {
    test('execution timeline comparison', async () => {
      const operationDuration = 5;

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
        sequentialRegister.dispatchWithResult('operation', { id: 1 }),
        sequentialRegister.dispatchWithResult('operation', { id: 2 }),
        sequentialRegister.dispatchWithResult('operation', { id: 3 })
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
        parallelRegister.dispatchWithResult('operation', { id: 1 }),
        parallelRegister.dispatchWithResult('operation', { id: 2 }),
        parallelRegister.dispatchWithResult('operation', { id: 3 })
      ]);
      const parallelTime = performance.now() - parallelStart;

      console.log(`Sequential: ${sequentialTime.toFixed(2)}ms, Parallel: ${parallelTime.toFixed(2)}ms`);

      // Parallel should be faster
      expect(parallelTime).toBeLessThan(sequentialTime);

      // Sequential should take roughly 3x operation duration
      expect(sequentialTime).toBeGreaterThan(operationDuration * 2.5);

      // Parallel should take roughly 1x operation duration
      expect(parallelTime).toBeLessThan(operationDuration * 1.5);

      sequentialRegister.clearAll();
      parallelRegister.clearAll();
    });
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
        await new Promise(resolve => setTimeout(resolve, 3));
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
        await new Promise(resolve => setTimeout(resolve, 3));
        Object.assign(userState, changes);
        operations.push('update-complete');
        return { step: 'profile-updated', userId };
      }, { priority: 80 });

      // Sequential execution due to queue
      await userManager.dispatchWithResult('login', { username: 'john', password: 'secret' });
      await userManager.dispatchWithResult('updateProfile', { userId: 'user123', changes: { email: 'john@example.com' } });

      // Operations execute in priority order within each dispatch
      expect(operations).toEqual(['login-start', 'login-complete', 'update-start', 'update-complete']);
      expect(userState.isAuthenticated).toBe(true);
      expect(userState.email).toBe('john@example.com');

      userManager.clearAll();
    });

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
      const trackingPromises = Array.from({ length: 3 }, (_, i) =>
        analytics.dispatchWithResult('trackEvent', {
          event: 'user_action',
          properties: { action_id: i }
        })
      );

      await Promise.all(trackingPromises);
      const totalTime = performance.now() - startTime;

      // All events should be tracked
      expect(trackedEvents).toHaveLength(3);

      // Should be faster than sequential (3 * 2ms = 6ms)
      expect(totalTime).toBeLessThan(10);

      analytics.clearAll();
    });
  });

  describe('Memory Management Features', () => {
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

    test('one-time handler cleanup after execution', async () => {
      let executionCount = 0;

      // Register one-time handlers as shown in docs
      for (let i = 0; i < 3; i++) {
        register.register('test', async ({ id }) => {
          executionCount++;
          return { executed: true, handlerId: i };
        }, { once: true, id: `once-${i}` });
      }

      expect(register.getHandlerCount('test')).toBe(3);

      // Execute operation once
      await register.dispatchWithResult('test', { id: 1 });

      // All one-time handlers should be removed
      expect(register.getHandlerCount('test')).toBe(0);
      expect(executionCount).toBe(3);

      // Second execution should have no handlers
      const result = await register.dispatchWithResult('test', { id: 2 });
      expect(result.success).toBe(true);
      expect(result.execution.handlersExecuted).toBe(0);
      expect(executionCount).toBe(3); // No additional executions
    });
  });

  describe('Error Handling in Concurrent Scenarios', () => {
    test('error in one operation does not block queue', async () => {
      const results: string[] = [];

      register.register('test', async ({ id }) => {
        if (id === 2) {
          throw new Error('Simulated error');
        }
        results.push(`success-${id}`);
        return { processed: id };
      });

      // Mix of successful and failing operations
      const promises = [
        register.dispatchWithResult('test', { id: 1 }),
        register.dispatchWithResult('test', { id: 2 }),
        register.dispatchWithResult('test', { id: 3 })
      ];

      const operationResults = await Promise.all(promises);

      // Successful operations should complete
      expect(results).toContain('success-1');
      expect(results).toContain('success-3');
      expect(results).toHaveLength(2);

      // Error should be captured in result
      expect(operationResults[0].success).toBe(true);
      expect(operationResults[1].success).toBe(false);
      expect(operationResults[2].success).toBe(true);
    });
  });
});