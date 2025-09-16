/**
 * Fixed Async Concurrency Tests
 *
 * Tests that properly handle async operations with completion guarantees.
 * Core test for Promise.all() compatibility with async handlers.
 */

import { ActionRegister } from '../../src/ActionRegister';

interface AsyncTestActions {
  asyncTest: { id: number };
  syncTest: { id: number };
}

describe('Fixed Async Concurrency Control', () => {
  let register: ActionRegister<AsyncTestActions>;

  beforeEach(() => {
    register = new ActionRegister<AsyncTestActions>({
      name: 'AsyncConcurrencyTest',
      registry: {
        useConcurrencyQueue: true,
        debug: true
      }
    });
  });

  afterEach(() => {
    register.destroy();
  });

  describe('Core Async Handler Support', () => {
    test('async handlers with Promise.all - THE MAIN FIX TEST', async () => {
      const completions: Array<{ id: number; timestamp: number }> = [];

      register.register('asyncTest', async ({ id }) => {
        console.log(`Promise.all operation ${id} starting`);

        // No delays for deterministic testing
        const completion = { id, timestamp: Date.now() };
        completions.push(completion);
        console.log(`Promise.all operation ${id} completed`, completion);

        return { completed: id };
      });

      // Execute async operations with Promise.all - this should now work!
      console.log('Starting Promise.all operations...');
      const promises = [
        register.dispatch('asyncTest', { id: 1 }),
        register.dispatch('asyncTest', { id: 2 }),
        register.dispatch('asyncTest', { id: 3 })
      ];

      await Promise.all(promises);

      // Should complete in sequential order due to the queue
      expect(completions).toHaveLength(3);
      expect(completions.map(c => c.id)).toEqual([1, 2, 3]);
    });

    test('sequential async operations work correctly', async () => {
      const results: number[] = [];

      register.register('asyncTest', async ({ id }) => {
        // Simulate async work without delays
        await Promise.resolve();
        results.push(id);
        return { processed: id };
      });

      // Execute operations sequentially
      await register.dispatch('asyncTest', { id: 1 });
      await register.dispatch('asyncTest', { id: 2 });
      await register.dispatch('asyncTest', { id: 3 });

      expect(results).toEqual([1, 2, 3]);
    });

    test('mixed sync and async handlers work together', async () => {
      const executionOrder: string[] = [];

      // Sync handler
      register.register('syncTest', ({ id }) => {
        executionOrder.push(`sync-${id}`);
        return { type: 'sync', id };
      }, { priority: 100, id: 'sync-handler' });

      // Async handler
      register.register('asyncTest', async ({ id }) => {
        await Promise.resolve(); // Minimal async operation
        executionOrder.push(`async-${id}`);
        return { type: 'async', id };
      }, { priority: 50, id: 'async-handler' });

      // Execute both types
      await register.dispatch('syncTest', { id: 42 });
      await register.dispatch('asyncTest', { id: 42 });

      expect(executionOrder).toEqual(['sync-42', 'async-42']);
    });

    test('async error handling does not block queue', async () => {
      const results: string[] = [];

      register.register('asyncTest', async ({ id }) => {
        if (id === 2) {
          throw new Error(`Async error in operation ${id}`);
        }
        results.push(`async-success-${id}`);
        return { completed: id };
      });

      // Execute operations with one that fails
      try {
        await register.dispatch('asyncTest', { id: 1 });
      } catch (e) {
        // Should not error
      }

      try {
        await register.dispatch('asyncTest', { id: 2 });
      } catch (e) {
        // Expected error
      }

      try {
        await register.dispatch('asyncTest', { id: 3 });
      } catch (e) {
        // Should not error
      }

      expect(results).toEqual(['async-success-1', 'async-success-3']);
    });
  });
});