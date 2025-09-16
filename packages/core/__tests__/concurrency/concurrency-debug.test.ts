/**
 * Debug Concurrency Tests
 *
 * Simple tests to debug why other concurrency tests are failing
 */

import { ActionRegister } from '../../src/ActionRegister';

interface DebugActions {
  test: { id: number };
}

describe('Debug Concurrency', () => {
  let register: ActionRegister<DebugActions>;

  beforeEach(() => {
    register = new ActionRegister<DebugActions>({
      name: 'DebugTest',
      registry: {
        useConcurrencyQueue: true,
        debug: true
      }
    });
  });

  afterEach(() => {
    register.clearAll();
  });

  test('basic handler registration and dispatch', async () => {
    console.log('Starting basic test...');

    const results: number[] = [];

    console.log('Registering handler...');
    register.register('test', ({ id }) => {
      console.log(`Handler executed with id: ${id}`);
      results.push(id);
      return { processed: id };
    });

    console.log('Handler count:', register.getHandlerCount('test'));

    console.log('Dispatching action...');
    const result = await register.dispatch('test', { id: 1 });
    console.log('Dispatch result:', result);

    console.log('Results array:', results);
    expect(results).toContain(1);
    expect(results).toHaveLength(1);
  });

  test('async handler with timeout', async () => {
    console.log('Starting async test...');

    const results: number[] = [];

    register.register('test', async ({ id }) => {
      console.log(`Async handler started with id: ${id}`);
      await new Promise(resolve => setTimeout(resolve, 10));
      console.log(`Async handler completed with id: ${id}`);
      results.push(id);
      return { processed: id };
    });

    console.log('Dispatching async action...');
    const result = await register.dispatch('test', { id: 2 });
    console.log('Async dispatch result:', result);

    console.log('Async results array:', results);
    expect(results).toContain(2);
    expect(results).toHaveLength(1);
  });

  test('sequential execution order', async () => {
    console.log('Starting sequential test...');

    const results: number[] = [];

    register.register('test', async ({ id }) => {
      console.log(`Sequential handler started with id: ${id}`);
      await new Promise(resolve => setTimeout(resolve, 5));
      results.push(id);
      console.log(`Sequential handler completed with id: ${id}, results:`, results);
      return { processed: id };
    });

    console.log('Dispatching multiple actions...');
    const promises = [
      register.dispatchWithResult('test', { id: 1 }),
      register.dispatchWithResult('test', { id: 2 }),
      register.dispatchWithResult('test', { id: 3 })
    ];

    const allResults = await Promise.all(promises);
    console.log('All dispatch results:', allResults);
    console.log('Final results array:', results);

    expect(results).toEqual([1, 2, 3]);
  });

  test('simple concurrency control test', async () => {
    console.log('Starting simple concurrency test...');

    let sharedValue = 0;
    const executionOrder: number[] = [];

    register.register('test', async ({ id }) => {
      console.log(`Handler ${id} started, sharedValue:`, sharedValue);
      const current = sharedValue;
      await new Promise(resolve => setTimeout(resolve, 10));
      sharedValue = current + 1;
      executionOrder.push(id);
      console.log(`Handler ${id} completed, sharedValue:`, sharedValue);
      return { processed: id, finalValue: sharedValue };
    });

    // Dispatch multiple operations that should execute sequentially
    await Promise.all([
      register.dispatch('test', { id: 1 }),
      register.dispatch('test', { id: 2 }),
      register.dispatch('test', { id: 3 })
    ]);

    console.log('Final shared value:', sharedValue);
    console.log('Execution order:', executionOrder);

    // With queue: sequential execution, final value should be 3
    expect(sharedValue).toBe(3);
    expect(executionOrder).toEqual([1, 2, 3]);
  });
});