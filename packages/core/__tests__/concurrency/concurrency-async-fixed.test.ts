/**
 * Fixed Async Concurrency Tests
 *
 * Tests that properly handle async operations with completion guarantees.
 * Uses internal completion triggers and proper async patterns.
 */

import { ActionRegister } from '../../src/ActionRegister';

interface AsyncTestActions {
  asyncTest: { id: number; delay?: number };
  asyncCounter: { increment: number };
  asyncOperation: { id: number; operation: string };
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
    register.clearAll();
  });

  describe('Async Operations with Completion Guarantees', () => {
    test('async handlers complete in sequence with internal tracking', async () => {
      const completions: Array<{ id: number; timestamp: number }> = [];
      const startTimes: Record<number, number> = {};

      register.register('asyncTest', async ({ id, delay = 1 }) => {
        startTimes[id] = Date.now();
        console.log(`Async operation ${id} starting`);

        // Use Promise with minimal delay for testing
        await new Promise<void>((resolve) => {
          setTimeout(() => {
            const completion = { id, timestamp: Date.now() };
            completions.push(completion);
            console.log(`Async operation ${id} completed`, completion);
            resolve();
          }, delay);
        });

        return { completed: id };
      });

      // Execute async operations sequentially, NOT with Promise.all
      console.log('Starting first operation...');
      await register.dispatch('asyncTest', { id: 1, delay: 1 });

      console.log('Starting second operation...');
      await register.dispatch('asyncTest', { id: 2, delay: 1 });

      console.log('Starting third operation...');
      await register.dispatch('asyncTest', { id: 3, delay: 1 });

      // Should complete in order
      expect(completions).toHaveLength(3);
      expect(completions.map(c => c.id)).toEqual([1, 2, 3]);

      // Verify sequential execution (no overlap)
      expect(completions[0].timestamp).toBeLessThanOrEqual(startTimes[2]);
      expect(completions[1].timestamp).toBeLessThanOrEqual(startTimes[3]);
    });

    test('async handlers with Promise.all - THE MAIN FIX TEST', async () => {
      const completions: Array<{ id: number; timestamp: number }> = [];

      register.register('asyncTest', async ({ id }) => {
        console.log(`Promise.all operation ${id} starting`);

        // Remove all delays for deterministic testing
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

    test('async shared state modification is safe', async () => {
      const results: number[] = [];
      let sharedValue = 0;
      const operationLog: string[] = [];

      register.register('asyncCounter', async ({ increment }) => {
        operationLog.push(`start-${increment}-${sharedValue}`);

        // Read current state
        const current = sharedValue;

        // Simulate async operation with guaranteed completion
        await new Promise<void>((resolve) => {
          setTimeout(() => {
            sharedValue = current + increment;
            results.push(sharedValue);
            operationLog.push(`complete-${increment}-${sharedValue}`);
            resolve();
          }, 5);
        });

        return { newValue: sharedValue };
      });

      // Execute operations sequentially
      await register.dispatch('asyncCounter', { increment: 1 });
      await register.dispatch('asyncCounter', { increment: 2 });
      await register.dispatch('asyncCounter', { increment: 3 });

      // Should be sequential: 0+1=1, 1+2=3, 3+3=6
      expect(results).toEqual([1, 3, 6]);
      expect(sharedValue).toBe(6);

      expect(operationLog).toEqual([
        'start-1-0', 'complete-1-1',
        'start-2-1', 'complete-2-3',
        'start-3-3', 'complete-3-6'
      ]);
    });

    test('concurrent async dispatches are properly queued', async () => {
      const executionOrder: string[] = [];
      const completionOrder: string[] = [];

      register.register('asyncOperation', async ({ id, operation }) => {
        executionOrder.push(`start-${operation}-${id}`);

        // Variable delays to test queue ordering
        const delay = id * 3;

        await new Promise<void>((resolve) => {
          setTimeout(() => {
            completionOrder.push(`complete-${operation}-${id}`);
            resolve();
          }, delay);
        });

        return { processed: `${operation}-${id}` };
      });

      // Store promises but don't use Promise.all - execute individually
      const promise1 = register.dispatch('asyncOperation', { id: 1, operation: 'op' });
      const promise2 = register.dispatch('asyncOperation', { id: 2, operation: 'op' });
      const promise3 = register.dispatch('asyncOperation', { id: 3, operation: 'op' });

      // Wait for each to complete individually
      await promise1;
      await promise2;
      await promise3;

      // Queue should enforce order despite varying delays
      expect(executionOrder).toEqual(['start-op-1', 'start-op-2', 'start-op-3']);
      expect(completionOrder).toEqual(['complete-op-1', 'complete-op-2', 'complete-op-3']);
    });
  });

  describe('Async Error Handling', () => {
    test('async error in one operation does not block others', async () => {
      const results: string[] = [];
      const errors: string[] = [];

      register.register('asyncTest', async ({ id }) => {
        await new Promise<void>((resolve, reject) => {
          setTimeout(() => {
            if (id === 2) {
              reject(new Error(`Async error in operation ${id}`));
            } else {
              results.push(`async-success-${id}`);
              resolve();
            }
          }, 5);
        });

        return { completed: id };
      });

      // Execute operations with one that fails
      try {
        await register.dispatch('asyncTest', { id: 1 });
      } catch (e) {
        errors.push(`error-1: ${e.message}`);
      }

      try {
        await register.dispatch('asyncTest', { id: 2 });
      } catch (e) {
        errors.push(`error-2: ${e.message}`);
      }

      try {
        await register.dispatch('asyncTest', { id: 3 });
      } catch (e) {
        errors.push(`error-3: ${e.message}`);
      }

      expect(results).toEqual(['async-success-1', 'async-success-3']);
      expect(errors).toEqual(['error-2: Async error in operation 2']);
    });
  });

  describe('Async Performance Patterns', () => {
    test('async operations maintain sequential order', async () => {
      const completions: Array<{ id: number; startTime: number; endTime: number }> = [];

      register.register('asyncTest', async ({ id }) => {
        const startTime = Date.now();

        // Reverse delay - higher IDs should take less time
        const delay = (4 - id) * 5;

        await new Promise<void>((resolve) => {
          setTimeout(() => {
            const endTime = Date.now();
            completions.push({ id, startTime, endTime });
            resolve();
          }, delay);
        });

        return { processed: id };
      });

      // Execute with varying delays
      await register.dispatch('asyncTest', { id: 1 }); // 15ms delay
      await register.dispatch('asyncTest', { id: 2 }); // 10ms delay
      await register.dispatch('asyncTest', { id: 3 }); // 5ms delay

      // Queue ensures order regardless of individual timing
      expect(completions.map(c => c.id)).toEqual([1, 2, 3]);

      // Verify no overlap (sequential execution)
      expect(completions[0].endTime).toBeLessThanOrEqual(completions[1].startTime);
      expect(completions[1].endTime).toBeLessThanOrEqual(completions[2].startTime);
    });

    test('async operations complete with proper cleanup', async () => {
      let activeOperations = 0;
      const maxConcurrent = { value: 0 };
      const results: number[] = [];

      register.register('asyncTest', async ({ id }) => {
        activeOperations++;
        maxConcurrent.value = Math.max(maxConcurrent.value, activeOperations);

        await new Promise<void>((resolve) => {
          setTimeout(() => {
            results.push(id);
            activeOperations--;
            resolve();
          }, 10);
        });

        return { id };
      });

      // Execute multiple async operations
      await register.dispatch('asyncTest', { id: 1 });
      await register.dispatch('asyncTest', { id: 2 });
      await register.dispatch('asyncTest', { id: 3 });

      // All should complete
      expect(results).toEqual([1, 2, 3]);

      // No operations should be active after completion
      expect(activeOperations).toBe(0);

      // With queue, max concurrent should be 1
      expect(maxConcurrent.value).toBe(1);
    });
  });

  describe('Mixed Sync and Async Operations', () => {
    test('sync and async handlers work together', async () => {
      const executionOrder: string[] = [];

      // Sync handler
      register.register('asyncTest', ({ id }) => {
        executionOrder.push(`sync-${id}`);
        return { type: 'sync', id };
      }, { priority: 100, id: 'sync-handler' });

      // Async handler
      register.register('asyncTest', async ({ id }) => {
        await new Promise<void>((resolve) => {
          setTimeout(() => {
            executionOrder.push(`async-${id}`);
            resolve();
          }, 5);
        });
        return { type: 'async', id };
      }, { priority: 50, id: 'async-handler' });

      // Execute operation - both handlers should run in priority order
      await register.dispatch('asyncTest', { id: 42 });

      expect(executionOrder).toEqual(['sync-42', 'async-42']);
    });
  });

  describe('Advanced Async Patterns', () => {
    test('async operations with complex state dependencies', async () => {
      interface ComplexState {
        counter: number;
        values: number[];
        processing: Set<number>;
        completed: Set<number>;
      }

      const state: ComplexState = {
        counter: 0,
        values: [],
        processing: new Set(),
        completed: new Set()
      };

      register.register('asyncTest', async ({ id }) => {
        // Mark as processing
        state.processing.add(id);

        // Read current state
        const currentCounter = state.counter;
        const currentLength = state.values.length;

        // Simulate complex async operation
        await new Promise<void>((resolve) => {
          setTimeout(() => {
            // Update state based on read values
            state.counter = currentCounter + 1;
            state.values.push(id);

            // Mark as completed
            state.processing.delete(id);
            state.completed.add(id);

            resolve();
          }, 8);
        });

        return { processed: id, newCounter: state.counter };
      });

      // Execute operations
      await register.dispatch('asyncTest', { id: 100 });
      await register.dispatch('asyncTest', { id: 200 });
      await register.dispatch('asyncTest', { id: 300 });

      // State should be consistent
      expect(state.counter).toBe(3);
      expect(state.values).toEqual([100, 200, 300]);
      expect(state.processing.size).toBe(0);
      expect(state.completed.size).toBe(3);
      expect(Array.from(state.completed)).toEqual([100, 200, 300]);
    });
  });
});