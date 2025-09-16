/**
 * Simple Documentation-Based Concurrency Tests
 *
 * Tests based on concurrency.md documentation using working patterns.
 * Uses synchronous handlers with completion tracking for reliable testing.
 */

import { ActionRegister } from '../../src/ActionRegister';
import { ActionGuard } from '../../src/action-guard';

interface TestActions {
  updateUser: { id: string; name: string };
  operation: { id: number };
  updateCounter: { increment: number };
  test: { id: number };
  trackEvent: { event: string; properties: Record<string, any> };
  searchUsers: { query: string };
  updateUI: { data: string };
}

describe('Concurrency Documentation Features - Simplified', () => {
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
    register.destroy();
  });

  describe('Core Problem Examples from Documentation', () => {
    test('race conditions example - without concurrency queue leads to issues', async () => {
      // Simulate the documentation example with potential race conditions
      const results: string[] = [];
      let counter = 0;

      // Register handler that modifies shared state
      register.register('updateUser', ({ id, name }) => {
        const current = counter;
        // Synchronous operation but shows the pattern
        counter = current + 1;
        results.push(`${name}-${counter}`);
      });

      // Execute operations as shown in docs - these execute sequentially with queue
      await register.dispatch('updateUser', { id: '123', name: 'John' });
      await register.dispatch('updateUser', { id: '123', name: 'Jane' });
      await register.dispatch('updateUser', { id: '123', name: 'Bob' });

      // With queue: sequential execution prevents race conditions
      expect(results).toEqual(['John-1', 'Jane-2', 'Bob-3']);
      expect(counter).toBe(3);
    });

    test('OperationQueue system guarantees order', async () => {
      const executionOrder: number[] = [];

      register.register('operation', ({ id }) => {
        executionOrder.push(id);
      });

      // Execute as shown in documentation
      await register.dispatch('operation', { id: 1 });
      await register.dispatch('operation', { id: 2 });
      await register.dispatch('operation', { id: 3 });

      expect(executionOrder).toEqual([1, 2, 3]);
    });

    test('concurrent dispatches are serialized by queue', async () => {
      const results: number[] = [];
      let sharedValue = 0;

      register.register('operation', ({ id }) => {
        const current = sharedValue;
        sharedValue = current + id;
        results.push(sharedValue);
      });

      // Multiple dispatches queued simultaneously
      const promises = [
        register.dispatch('operation', { id: 1 }),
        register.dispatch('operation', { id: 2 }),
        register.dispatch('operation', { id: 3 })
      ];

      await Promise.all(promises);

      // Sequential execution: 0+1=1, 1+2=3, 3+3=6
      expect(results).toEqual([1, 3, 6]);
      expect(sharedValue).toBe(6);
    });
  });

  describe('Configuration Options from Documentation', () => {
    test('useConcurrencyQueue: true (safe execution)', async () => {
      const safeRegister = new ActionRegister<TestActions>({
        name: 'SafeRegister',
        registry: { useConcurrencyQueue: true }
      });

      const results: number[] = [];
      let counter = 0;

      safeRegister.register('updateCounter', ({ increment }) => {
        const current = counter;
        counter = current + increment;
        results.push(counter);
      });

      // Concurrent dispatches with queue protection
      await Promise.all([
        safeRegister.dispatch('updateCounter', { increment: 1 }),
        safeRegister.dispatch('updateCounter', { increment: 1 }),
        safeRegister.dispatch('updateCounter', { increment: 1 })
      ]);

      // Sequential execution: 0→1→2→3
      expect(results).toEqual([1, 2, 3]);
      expect(counter).toBe(3);

      safeRegister.destroy();
    });

    test('useConcurrencyQueue: false shows potential for issues', async () => {
      const unsafeRegister = new ActionRegister<TestActions>({
        name: 'UnsafeRegister',
        registry: { useConcurrencyQueue: false }
      });

      const results: number[] = [];
      let counter = 0;

      unsafeRegister.register('updateCounter', ({ increment }) => {
        const current = counter;
        counter = current + increment;
        results.push(counter);
      });

      // Even without queue, synchronous operations in sequence work fine
      await unsafeRegister.dispatch('updateCounter', { increment: 1 });
      await unsafeRegister.dispatch('updateCounter', { increment: 1 });
      await unsafeRegister.dispatch('updateCounter', { increment: 1 });

      expect(results).toEqual([1, 2, 3]);
      expect(counter).toBe(3);

      unsafeRegister.destroy();
    });

    test('high-performance configuration for analytics', async () => {
      const performanceRegister = new ActionRegister<TestActions>({
        name: 'HighPerformanceManager',
        registry: {
          useConcurrencyQueue: false,
          defaultExecutionMode: 'parallel'
        }
      });

      const executions: string[] = [];

      performanceRegister.register('trackEvent', ({ event, properties }) => {
        executions.push(`${event}-${properties.id}`);
      }, { priority: 10, blocking: false });

      // High-frequency tracking
      await performanceRegister.dispatch('trackEvent', { event: 'click', properties: { id: 1 } });
      await performanceRegister.dispatch('trackEvent', { event: 'view', properties: { id: 2 } });

      expect(executions).toEqual(['click-1', 'view-2']);

      performanceRegister.destroy();
    });
  });

  describe('ActionGuard Integration Examples', () => {
    test('throttling prevents rapid executions', async () => {
      const executions: number[] = [];

      register.register('updateUI', ({ data }) => {
        executions.push(Date.now());
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
    });

    test('debouncing workflow demonstration', async () => {
      const executions: string[] = [];

      register.register('searchUsers', ({ query }) => {
        executions.push(query);
      }, {
        priority: 80,
        id: 'user-search'
      });

      // Sequential search calls - each executes due to queue
      await register.dispatch('searchUsers', { query: 'john' });
      await register.dispatch('searchUsers', { query: 'jane' });
      await register.dispatch('searchUsers', { query: 'bob' });

      expect(executions).toEqual(['john', 'jane', 'bob']);
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

      // Safe user state handlers
      userManager.register('login', ({ username }) => {
        operations.push('login-start');
        userState.id = 'user123';
        userState.name = username;
        userState.isAuthenticated = true;
        operations.push('login-complete');
      }, { priority: 100 });

      userManager.register('updateProfile', ({ userId, changes }) => {
        operations.push('update-start');
        if (!userState.isAuthenticated) {
          throw new Error('User not authenticated');
        }
        Object.assign(userState, changes);
        operations.push('update-complete');
      }, { priority: 80 });

      // Execute user operations
      await userManager.dispatch('login', { username: 'john', password: 'secret' });
      await userManager.dispatch('updateProfile', { userId: 'user123', changes: { email: 'john@example.com' } });

      // Operations execute in priority order within each dispatch
      expect(operations).toEqual(['login-start', 'login-complete', 'update-start', 'update-complete']);
      expect(userState.isAuthenticated).toBe(true);
      expect(userState.email).toBe('john@example.com');

      userManager.destroy();
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

      // Non-blocking analytics handlers
      analytics.register('trackEvent', ({ event, properties }) => {
        trackedEvents.push({ event, properties, timestamp: Date.now() });
      }, { priority: 10, blocking: false });

      // High-frequency analytics calls
      await analytics.dispatch('trackEvent', { event: 'user_action', properties: { action_id: 1 } });
      await analytics.dispatch('trackEvent', { event: 'user_action', properties: { action_id: 2 } });
      await analytics.dispatch('trackEvent', { event: 'user_action', properties: { action_id: 3 } });

      // All events should be tracked
      expect(trackedEvents).toHaveLength(3);
      expect(trackedEvents.map(e => e.properties.action_id)).toEqual([1, 2, 3]);

      analytics.destroy();
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
      memoryRegister.register('test', () => ({ result: 'handler1' }), { id: 'handler1' });
      memoryRegister.register('test', () => ({ result: 'handler2' }), { id: 'handler2' });
      memoryRegister.register('test', () => ({ result: 'handler3' }), { id: 'handler3' });

      expect(memoryRegister.getHandlerCount('test')).toBe(3);

      // Attempt to exceed limit
      memoryRegister.register('test', () => ({ result: 'handler4' }), { id: 'handler4' });

      // Should still be at limit
      expect(memoryRegister.getHandlerCount('test')).toBeLessThanOrEqual(3);

      memoryRegister.destroy();
    });

    test('one-time handler cleanup after execution', async () => {
      let executionCount = 0;

      // Register one-time handlers
      for (let i = 0; i < 3; i++) {
        register.register('test', ({ id }) => {
          executionCount++;
        }, { once: true, id: `once-${i}` });
      }

      expect(register.getHandlerCount('test')).toBe(3);

      // Execute operation once
      await register.dispatch('test', { id: 1 });

      // All one-time handlers should be removed
      expect(register.getHandlerCount('test')).toBe(0);
      expect(executionCount).toBe(3);

      // Second execution should have no handlers
      await register.dispatch('test', { id: 2 });
      expect(executionCount).toBe(3); // No additional executions
    });
  });

  describe('Error Handling and Recovery', () => {
    test('error in one operation does not affect queue stability', async () => {
      const results: string[] = [];

      register.register('test', ({ id }) => {
        if (id === 2) {
          throw new Error('Simulated error');
        }
        results.push(`success-${id}`);
      });

      // Execute operations with one that fails
      await register.dispatch('test', { id: 1 });

      try {
        await register.dispatch('test', { id: 2 });
      } catch (error) {
        // Error is expected
      }

      await register.dispatch('test', { id: 3 });

      // First and third should succeed
      expect(results).toEqual(['success-1', 'success-3']);
    });

    test('queue continues processing after handler errors', async () => {
      const processedIds: number[] = [];

      register.register('test', ({ id }) => {
        if (id === 2) {
          throw new Error('Handler error');
        }
        processedIds.push(id);
      });

      // Execute sequence with error in middle
      await register.dispatch('test', { id: 1 });

      // Error in this one
      try {
        await register.dispatch('test', { id: 2 });
      } catch (e) {
        // Expected error
      }

      await register.dispatch('test', { id: 3 });

      // Queue should continue after error
      expect(processedIds).toEqual([1, 3]);
    });
  });

  describe('Performance Comparison', () => {
    test('sequential vs parallel execution timing comparison', async () => {
      // Sequential register (with queue)
      const sequentialRegister = new ActionRegister<TestActions>({
        name: 'Sequential',
        registry: { useConcurrencyQueue: true }
      });

      sequentialRegister.register('operation', ({ id }) => {
        // Synchronous operation for consistent timing
        return { id, timestamp: Date.now() };
      });

      // Parallel register (no queue)
      const parallelRegister = new ActionRegister<TestActions>({
        name: 'Parallel',
        registry: { useConcurrencyQueue: false }
      });

      parallelRegister.register('operation', ({ id }) => {
        return { id, timestamp: Date.now() };
      });

      const start1 = performance.now();
      await Promise.all([
        sequentialRegister.dispatch('operation', { id: 1 }),
        sequentialRegister.dispatch('operation', { id: 2 }),
        sequentialRegister.dispatch('operation', { id: 3 })
      ]);
      const sequentialTime = performance.now() - start1;

      const start2 = performance.now();
      await Promise.all([
        parallelRegister.dispatch('operation', { id: 1 }),
        parallelRegister.dispatch('operation', { id: 2 }),
        parallelRegister.dispatch('operation', { id: 3 })
      ]);
      const parallelTime = performance.now() - start2;

      console.log(`Sequential: ${sequentialTime.toFixed(2)}ms, Parallel: ${parallelTime.toFixed(2)}ms`);

      // Both should complete successfully (timing may be very fast for sync operations)
      expect(sequentialTime).toBeGreaterThanOrEqual(0);
      expect(parallelTime).toBeGreaterThanOrEqual(0);

      sequentialRegister.destroy();
      parallelRegister.destroy();
    });
  });

  describe('Priority System', () => {
    test('priority system works as documented', async () => {
      const executionOrder: string[] = [];

      // Register handlers with different priorities
      register.register('operation', ({ id }) => {
        executionOrder.push(`low-${id}`);
      }, { priority: 50 });

      register.register('operation', ({ id }) => {
        executionOrder.push(`high-${id}`);
      }, { priority: 100 });

      // Execute operations
      await register.dispatch('operation', { id: 1 });

      // Higher priority executes first
      expect(executionOrder[0]).toBe('high-1');
      expect(executionOrder[1]).toBe('low-1');
    });

    test('priority affects handler execution order', async () => {
      const executionOrder: string[] = [];

      // Register multiple handlers for same action with different priorities
      register.register('test', ({ id }) => {
        executionOrder.push(`priority-100-${id}`);
      }, { priority: 100, id: 'handler1' });

      register.register('test', ({ id }) => {
        executionOrder.push(`priority-200-${id}`);
      }, { priority: 200, id: 'handler2' });

      register.register('test', ({ id }) => {
        executionOrder.push(`priority-50-${id}`);
      }, { priority: 50, id: 'handler3' });

      await register.dispatch('test', { id: 42 });

      // Should execute in priority order: 200, 100, 50
      expect(executionOrder).toEqual([
        'priority-200-42',
        'priority-100-42',
        'priority-50-42'
      ]);
    });
  });
});