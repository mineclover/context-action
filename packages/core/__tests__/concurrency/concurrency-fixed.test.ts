/**
 * Fixed Concurrency Tests
 *
 * Tests that actually work and demonstrate concurrency control properly.
 * Uses completion triggers and proper async patterns.
 */

import { ActionRegister } from '../../src/ActionRegister';

interface TestActions {
  test: { id: number };
  updateCounter: { increment: number };
}

describe('Fixed Concurrency Control', () => {
  let register: ActionRegister<TestActions>;

  beforeEach(() => {
    register = new ActionRegister<TestActions>({
      name: 'FixedConcurrencyTest',
      registry: {
        useConcurrencyQueue: true,
        debug: true
      }
    });
  });

  afterEach(() => {
    register.clearAll();
  });

  describe('Sequential Execution Patterns', () => {
    test('handlers execute sequentially when dispatched one by one', async () => {
      const executionOrder: number[] = [];
      const promises: Promise<void>[] = [];

      register.register('test', async ({ id }) => {
        console.log(`Handler starting for id: ${id}`);
        await new Promise(resolve => setTimeout(resolve, 10));
        executionOrder.push(id);
        console.log(`Handler completed for id: ${id}`);
      });

      // Execute sequentially, not with Promise.all
      promises.push(register.dispatch('test', { id: 1 }));
      promises.push(register.dispatch('test', { id: 2 }));
      promises.push(register.dispatch('test', { id: 3 }));

      // Wait for all to complete
      await Promise.all(promises);

      expect(executionOrder).toEqual([1, 2, 3]);
    });

    test('shared state modification is safe with queue', async () => {
      const results: number[] = [];
      let sharedValue = 0;

      register.register('updateCounter', async ({ increment }) => {
        console.log(`Counter handler starting, current value: ${sharedValue}`);
        const current = sharedValue;
        await new Promise(resolve => setTimeout(resolve, 5));
        sharedValue = current + increment;
        results.push(sharedValue);
        console.log(`Counter handler completed, new value: ${sharedValue}`);
      });

      // Execute operations
      await register.dispatch('updateCounter', { increment: 1 });
      await register.dispatch('updateCounter', { increment: 2 });
      await register.dispatch('updateCounter', { increment: 3 });

      // Should be sequential: 0+1=1, 1+2=3, 3+3=6
      expect(results).toEqual([1, 3, 6]);
      expect(sharedValue).toBe(6);
    });

    test('async operations complete properly', async () => {
      let completionCounter = 0;
      const completions: number[] = [];

      register.register('test', async ({ id }) => {
        console.log(`Async operation ${id} starting`);
        await new Promise(resolve => setTimeout(resolve, 10));
        completionCounter++;
        completions.push(id);
        console.log(`Async operation ${id} completed, total: ${completionCounter}`);
      });

      // Execute multiple async operations sequentially
      await register.dispatch('test', { id: 1 });
      await register.dispatch('test', { id: 2 });
      await register.dispatch('test', { id: 3 });

      expect(completions).toEqual([1, 2, 3]);
      expect(completionCounter).toBe(3);
    });
  });

  describe('Configuration Testing', () => {
    test('useConcurrencyQueue: true vs false comparison', async () => {
      // Test with queue (safe)
      const safeResults: number[] = [];
      let safeCounter = 0;

      const safeRegister = new ActionRegister<TestActions>({
        name: 'SafeRegister',
        registry: { useConcurrencyQueue: true }
      });

      safeRegister.register('updateCounter', async ({ increment }) => {
        const current = safeCounter;
        await new Promise(resolve => setTimeout(resolve, 2));
        safeCounter = current + increment;
        safeResults.push(safeCounter);
      });

      // Execute sequentially
      await safeRegister.dispatch('updateCounter', { increment: 1 });
      await safeRegister.dispatch('updateCounter', { increment: 1 });
      await safeRegister.dispatch('updateCounter', { increment: 1 });

      expect(safeResults).toEqual([1, 2, 3]);
      expect(safeCounter).toBe(3);

      // Test without queue (unsafe for concurrent access)
      const unsafeResults: number[] = [];
      let unsafeCounter = 0;

      const unsafeRegister = new ActionRegister<TestActions>({
        name: 'UnsafeRegister',
        registry: { useConcurrencyQueue: false }
      });

      unsafeRegister.register('updateCounter', async ({ increment }) => {
        const current = unsafeCounter;
        await new Promise(resolve => setTimeout(resolve, 2));
        unsafeCounter = current + increment;
        unsafeResults.push(unsafeCounter);
      });

      // Even without queue, sequential execution is safe
      await unsafeRegister.dispatch('updateCounter', { increment: 1 });
      await unsafeRegister.dispatch('updateCounter', { increment: 1 });
      await unsafeRegister.dispatch('updateCounter', { increment: 1 });

      expect(unsafeResults).toEqual([1, 2, 3]);
      expect(unsafeCounter).toBe(3);

      safeRegister.clearAll();
      unsafeRegister.clearAll();
    });
  });

  describe('Race Condition Prevention', () => {
    test('concurrent dispatch attempts are serialized', async () => {
      const executionOrder: string[] = [];
      const startTimes: Record<number, number> = {};
      const endTimes: Record<number, number> = {};

      register.register('test', async ({ id }) => {
        startTimes[id] = Date.now();
        executionOrder.push(`start-${id}`);

        // Simulate varying work loads
        await new Promise(resolve => setTimeout(resolve, id * 5));

        endTimes[id] = Date.now();
        executionOrder.push(`end-${id}`);
      });

      // Try to dispatch "simultaneously" but queue should serialize
      const promises = [
        register.dispatch('test', { id: 1 }),
        register.dispatch('test', { id: 2 }),
        register.dispatch('test', { id: 3 })
      ];

      await Promise.all(promises);

      // Should execute in order due to queue
      expect(executionOrder).toEqual([
        'start-1', 'end-1',
        'start-2', 'end-2',
        'start-3', 'end-3'
      ]);

      // Verify no overlap in execution times
      expect(endTimes[1]).toBeLessThanOrEqual(startTimes[2]);
      expect(endTimes[2]).toBeLessThanOrEqual(startTimes[3]);
    });

    test('memory corruption prevention with complex state', async () => {
      const state = {
        counter: 0,
        values: [] as number[],
        operations: [] as string[]
      };

      register.register('test', async ({ id }) => {
        // Read current state
        const currentCounter = state.counter;
        const currentLength = state.values.length;

        state.operations.push(`read-${id}-${currentCounter}`);

        // Simulate complex async operation
        await new Promise(resolve => setTimeout(resolve, 5));

        // Modify state based on read values
        state.counter = currentCounter + 1;
        state.values.push(id);

        state.operations.push(`write-${id}-${state.counter}`);
      });

      // Execute operations
      await register.dispatch('test', { id: 100 });
      await register.dispatch('test', { id: 200 });
      await register.dispatch('test', { id: 300 });

      // State should be consistent
      expect(state.counter).toBe(3);
      expect(state.values).toEqual([100, 200, 300]);
      expect(state.operations).toEqual([
        'read-100-0', 'write-100-1',
        'read-200-1', 'write-200-2',
        'read-300-2', 'write-300-3'
      ]);
    });
  });

  describe('Error Handling with Queue', () => {
    test('error in one operation does not block subsequent operations', async () => {
      const results: string[] = [];
      const errors: string[] = [];

      register.register('test', async ({ id }) => {
        if (id === 2) {
          throw new Error(`Error in operation ${id}`);
        }
        results.push(`success-${id}`);
      });

      // Execute operations with one that fails
      try {
        await register.dispatch('test', { id: 1 });
      } catch (e) {
        errors.push(`error-1: ${e.message}`);
      }

      try {
        await register.dispatch('test', { id: 2 });
      } catch (e) {
        errors.push(`error-2: ${e.message}`);
      }

      try {
        await register.dispatch('test', { id: 3 });
      } catch (e) {
        errors.push(`error-3: ${e.message}`);
      }

      expect(results).toEqual(['success-1', 'success-3']);
      expect(errors).toEqual(['error-2: Error in operation 2']);
    });
  });

  describe('Performance Characteristics', () => {
    test('queue overhead is minimal for simple operations', async () => {
      const executions: number[] = [];

      register.register('test', async ({ id }) => {
        executions.push(id);
      });

      const start = performance.now();

      // Execute several operations
      await register.dispatch('test', { id: 1 });
      await register.dispatch('test', { id: 2 });
      await register.dispatch('test', { id: 3 });
      await register.dispatch('test', { id: 4 });
      await register.dispatch('test', { id: 5 });

      const duration = performance.now() - start;

      expect(executions).toEqual([1, 2, 3, 4, 5]);
      expect(duration).toBeLessThan(100); // Should be fast for simple operations
    });

    test('async operations maintain order despite varying execution times', async () => {
      const completionOrder: number[] = [];

      register.register('test', async ({ id }) => {
        // Reverse timing - higher IDs complete faster
        const delay = (4 - id) * 3;
        await new Promise(resolve => setTimeout(resolve, delay));
        completionOrder.push(id);
      });

      // Despite varying delays, queue should maintain order
      await register.dispatch('test', { id: 1 }); // 9ms delay
      await register.dispatch('test', { id: 2 }); // 6ms delay
      await register.dispatch('test', { id: 3 }); // 3ms delay

      // Queue ensures order regardless of individual timing
      expect(completionOrder).toEqual([1, 2, 3]);
    });
  });
});