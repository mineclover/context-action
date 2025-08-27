/**
 * Result Collection Tests - Tests for dispatchWithResult and collect: true logic
 */

import { ActionRegister, type ActionPayloadMap } from '../../src';

interface ResultTestActions extends ActionPayloadMap {
  basicAction: { id: string; value: string };
  voidAction: void;
  numberAction: number;
  errorAction: { shouldFail: boolean; message?: string };
  asyncAction: { delay: number; result: any };
  mixedAction: { scenario: string };
}

describe('Result Collection - dispatchWithResult Tests', () => {
  let actionRegister: ActionRegister<ResultTestActions>;

  beforeEach(() => {
    actionRegister = new ActionRegister<ResultTestActions>({
      name: 'ResultCollectionTestRegister',
      registry: { debug: false }
    });
  });

  afterEach(() => {
    actionRegister.clearAll();
    jest.clearAllMocks();
  });

  describe('🎯 Basic Result Collection', () => {
    it('should collect results when collect: true', async () => {
      actionRegister.register('basicAction', () => ({ step: 'first', data: 'A' }), { priority: 20 });
      actionRegister.register('basicAction', () => ({ step: 'second', data: 'B' }), { priority: 10 });

      const result = await actionRegister.dispatchWithResult('basicAction', 
        { id: 'test', value: 'data' }, 
        { result: { collect: true } }
      );

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(2);
      expect(result.results[0]).toEqual({ step: 'first', data: 'A' });
      expect(result.results[1]).toEqual({ step: 'second', data: 'B' });
    });

    it('should collect results by default in dispatchWithResult', async () => {
      actionRegister.register('basicAction', () => ({ step: 'first', data: 'A' }));
      actionRegister.register('basicAction', () => ({ step: 'second', data: 'B' }));

      const result = await actionRegister.dispatchWithResult('basicAction', 
        { id: 'test', value: 'data' }
      );

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(2);
      expect(result.results[0]).toEqual({ step: 'first', data: 'A' });
      expect(result.results[1]).toEqual({ step: 'second', data: 'B' });
    });

    it('should handle dispatchWithResult without result options', async () => {
      actionRegister.register('basicAction', () => ({ processed: true }));

      const result = await actionRegister.dispatchWithResult('basicAction', { id: 'test', value: 'data' });

      expect(result.success).toBe(true);
      expect(result.aborted).toBe(false);
      expect(result.terminated).toBe(false);
      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toEqual({ processed: true });
      expect(result.execution).toBeDefined();
      expect(result.execution.handlersExecuted).toBe(1);
    });
  });

  describe('📊 Result Collection Strategies', () => {
    beforeEach(() => {
      actionRegister.register('mixedAction', (payload) => ({ handler: 'first', value: 1 }), { priority: 30 });
      actionRegister.register('mixedAction', (payload) => ({ handler: 'second', value: 2 }), { priority: 20 });
      actionRegister.register('mixedAction', (payload) => ({ handler: 'third', value: 3 }), { priority: 10 });
    });

    it('should use "first" strategy correctly', async () => {
      const result = await actionRegister.dispatchWithResult('mixedAction', 
        { scenario: 'first-strategy' }, 
        { result: { collect: true, strategy: 'first' } }
      );

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(3); // results always contains all results
      expect(result.result).toEqual({ handler: 'first', value: 1 }); // result contains processed result based on strategy
    });

    it('should use "last" strategy correctly', async () => {
      const result = await actionRegister.dispatchWithResult('mixedAction', 
        { scenario: 'last-strategy' }, 
        { result: { collect: true, strategy: 'last' } }
      );

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(3);
      expect(result.result).toEqual({ handler: 'third', value: 3 });
    });

    it('should use "all" strategy correctly (default)', async () => {
      const result = await actionRegister.dispatchWithResult('mixedAction', 
        { scenario: 'all-strategy' }, 
        { result: { collect: true, strategy: 'all' } }
      );

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(3);
      expect(result.result).toEqual([
        { handler: 'first', value: 1 },
        { handler: 'second', value: 2 },
        { handler: 'third', value: 3 }
      ]);
    });

    it('should use "merge" strategy correctly', async () => {
      actionRegister.clearAll();
      actionRegister.register('mixedAction', () => ({ name: 'John', age: 25 }), { priority: 20 });
      actionRegister.register('mixedAction', () => ({ email: 'john@example.com' }), { priority: 10 });

      const result = await actionRegister.dispatchWithResult('mixedAction', 
        { scenario: 'merge-strategy' }, 
        { result: { collect: true, strategy: 'merge' } }
      );

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(2);
      // Merge strategy without merger returns the last result by default
      expect(result.result).toEqual({ email: 'john@example.com' });
    });

    it('should use "custom" strategy with merger function', async () => {
      const customMerger = jest.fn((results) => ({
        totalValue: results.reduce((sum, r) => sum + (r?.value || 0), 0),
        handlerCount: results.length
      }));

      const result = await actionRegister.dispatchWithResult('mixedAction', 
        { scenario: 'custom-strategy' }, 
        { 
          result: { 
            collect: true, 
            strategy: 'custom',
            merger: customMerger
          } 
        }
      );

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(3);
      expect(result.result).toEqual({ totalValue: 6, handlerCount: 3 });
      expect(customMerger).toHaveBeenCalledWith([
        { handler: 'first', value: 1 },
        { handler: 'second', value: 2 },
        { handler: 'third', value: 3 }
      ]);
    });
  });

  describe('🔢 Result Collection Limits', () => {
    beforeEach(() => {
      // Register 5 handlers for testing limits
      for (let i = 1; i <= 5; i++) {
        actionRegister.register('basicAction', () => ({ handler: i, data: `result-${i}` }), { priority: 50 - i * 5 });
      }
    });

    it('should respect maxResults limit (affects result field, not results array)', async () => {
      const result = await actionRegister.dispatchWithResult('basicAction', 
        { id: 'test', value: 'data' }, 
        { result: { collect: true, maxResults: 3, strategy: 'all' } }
      );

      expect(result.success).toBe(true);
      // results array always contains ALL handler results
      expect(result.results).toHaveLength(5);
      expect(result.results[0]).toEqual({ handler: 1, data: 'result-1' });
      expect(result.results[1]).toEqual({ handler: 2, data: 'result-2' });
      expect(result.results[2]).toEqual({ handler: 3, data: 'result-3' });
      expect(result.results[3]).toEqual({ handler: 4, data: 'result-4' });
      expect(result.results[4]).toEqual({ handler: 5, data: 'result-5' });
      
      // But result field should only contain first 3 results due to maxResults
      expect(result.result).toHaveLength(3);
      expect(result.result[0]).toEqual({ handler: 1, data: 'result-1' });
      expect(result.result[1]).toEqual({ handler: 2, data: 'result-2' });
      expect(result.result[2]).toEqual({ handler: 3, data: 'result-3' });
    });

    it('should work without maxResults limit', async () => {
      const result = await actionRegister.dispatchWithResult('basicAction', 
        { id: 'test', value: 'data' }, 
        { result: { collect: true } }
      );

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(5);
    });

    it('should handle maxResults larger than actual results', async () => {
      const result = await actionRegister.dispatchWithResult('basicAction', 
        { id: 'test', value: 'data' }, 
        { result: { collect: true, maxResults: 10 } }
      );

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(5);
    });
  });

  describe('🚨 Error Handling in Result Collection', () => {
    it('should handle errors with includeErrors: false (default)', async () => {
      actionRegister.register('errorAction', (payload) => {
        if (payload.shouldFail) {
          throw new Error(payload.message || 'Test error');
        }
        return { success: true };
      });

      const result = await actionRegister.dispatchWithResult('errorAction', 
        { shouldFail: true, message: 'Test error message' },
        { result: { collect: true } }
      );

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.results).toEqual([]);
    });

    it('should include errors when includeErrors: true', async () => {
      actionRegister.register('errorAction', (payload) => {
        if (payload.shouldFail) {
          throw new Error(payload.message || 'Test error');
        }
        return { success: true };
      }, { priority: 20 });

      actionRegister.register('errorAction', () => ({ handler: 'success' }), { priority: 10 });

      const result = await actionRegister.dispatchWithResult('errorAction', 
        { shouldFail: true, message: 'Test error message' },
        { result: { collect: true, includeErrors: true } }
      );

      expect(result.success).toBe(false); // Pipeline fails on first error
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].handlerId).toBe('pipeline');
      expect(result.errors[0].error.message).toBe('Test error message');
    });

    it('should handle mixed success and error handlers with fail-fast behavior', async () => {
      const executionOrder: string[] = [];

      actionRegister.register('errorAction', (payload) => {
        executionOrder.push('success1');
        return { handler: 'success1' };
      }, { priority: 30 });

      actionRegister.register('errorAction', (payload) => {
        executionOrder.push('error');
        throw new Error('Middle error');
      }, { priority: 20 });

      actionRegister.register('errorAction', () => {
        executionOrder.push('success2');
        return { handler: 'success2' };
      }, { priority: 10 });

      const result = await actionRegister.dispatchWithResult('errorAction', 
        { shouldFail: false },
        { result: { collect: true, includeErrors: true } }
      );

      expect(result.success).toBe(false);
      expect(executionOrder).toEqual(['success1', 'error']); // Stops at error (fail-fast)
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error.message).toBe('Middle error');
    });
  });

  describe('⏱️ Async Result Collection', () => {
    it('should handle async handlers correctly', async () => {
      actionRegister.register('asyncAction', async () => {
        // Simple async handler without setTimeout to avoid timeout issues
        return Promise.resolve({ async: true });
      }, { priority: 20 });

      actionRegister.register('asyncAction', () => ({ sync: true }), { priority: 10 });

      const result = await actionRegister.dispatchWithResult('asyncAction', 
        { delay: 5, result: 'async-data' },
        { result: { collect: true } }
      );

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(2);
      // Results order might be different due to async execution - just check both are present
      const asyncResult = result.results.find(r => (r as any).async === true);
      const syncResult = result.results.find(r => (r as any).sync === true);
      expect(asyncResult).toEqual({ async: true });
      expect(syncResult).toEqual({ sync: true });
    });

    it('should handle Promise rejections in async handlers (non-blocking)', async () => {
      // Async errors might not fail the pipeline if they're non-blocking
      actionRegister.register('asyncAction', async () => {
        throw new Error('Async error');
      }, { blocking: false }); // Make it non-blocking

      const result = await actionRegister.dispatchWithResult('asyncAction', 
        { delay: 5, result: 'test' },
        { result: { collect: true, includeErrors: true } }
      );

      // Non-blocking async errors don't fail the pipeline
      expect(result.success).toBe(true);
      // But errors should still be collected if includeErrors is true
      // Note: This might depend on implementation details
    });
  });

  describe('🔄 Pipeline Controller Integration', () => {
    it('should collect results from controller.setResult', async () => {
      actionRegister.register('basicAction', (payload, controller) => {
        controller.setResult({ fromController: true, step: 1 });
        controller.setResult({ fromController: true, step: 2 });
        return { fromReturn: true };
      });

      const result = await actionRegister.dispatchWithResult('basicAction', 
        { id: 'test', value: 'data' },
        { result: { collect: true } }
      );

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(3);
      expect(result.results[0]).toEqual({ fromController: true, step: 1 });
      expect(result.results[1]).toEqual({ fromController: true, step: 2 });
      expect(result.results[2]).toEqual({ fromReturn: true });
    });

    it('should handle controller.return with result collection', async () => {
      const executionOrder: string[] = [];

      actionRegister.register('basicAction', (payload, controller) => {
        executionOrder.push('first');
        controller.return({ earlyReturn: true });
        return { shouldNotExecute: true }; // This won't be collected since controller.return terminates
      }, { priority: 20 });

      actionRegister.register('basicAction', () => {
        executionOrder.push('second'); // This handler won't execute
        return { shouldNotExecute: true };
      }, { priority: 10 });

      const result = await actionRegister.dispatchWithResult('basicAction', 
        { id: 'test', value: 'data' },
        { result: { collect: true } }
      );

      expect(result.success).toBe(true);
      expect(result.terminated).toBe(true);
      expect(executionOrder).toEqual(['first']);
      // results array might be empty if controller.return doesn't add to results
      // but result field should contain the termination result
      expect(result.result).toEqual({ earlyReturn: true });
    });

    it('should handle abort with result collection', async () => {
      const executionOrder: string[] = [];

      actionRegister.register('basicAction', (payload, controller) => {
        executionOrder.push('first');
        controller.setResult({ beforeAbort: true });
        controller.abort('Test abort');
        return { shouldNotReturn: true }; // This still gets collected
      }, { priority: 20 });

      actionRegister.register('basicAction', () => {
        executionOrder.push('second'); // This handler won't execute due to abort
        return { shouldNotExecute: true };
      }, { priority: 10 });

      const result = await actionRegister.dispatchWithResult('basicAction', 
        { id: 'test', value: 'data' },
        { result: { collect: true } }
      );

      // When aborted, success should be false
      expect(result.success).toBe(false);
      expect(result.aborted).toBe(true);
      expect(result.abortReason).toBe('Test abort');
      expect(executionOrder).toEqual(['first']);
      // Both setResult and return value are collected (abort doesn't prevent handler return collection)
      expect(result.results).toHaveLength(2);
      expect(result.results[0]).toEqual({ beforeAbort: true });
      expect(result.results[1]).toEqual({ shouldNotReturn: true });
    });
  });

  describe('🎭 Result Types and Edge Cases', () => {
    it('should handle undefined and null results', async () => {
      actionRegister.register('basicAction', () => undefined, { priority: 30 });
      actionRegister.register('basicAction', () => null, { priority: 20 });
      actionRegister.register('basicAction', () => ({ valid: true }), { priority: 10 });

      const result = await actionRegister.dispatchWithResult('basicAction', 
        { id: 'test', value: 'data' },
        { result: { collect: true } }
      );

      expect(result.success).toBe(true);
      // Note: undefined results may not be included in results array
      expect(result.results.length).toBeGreaterThanOrEqual(2);
      expect(result.results).toContain(null);
      expect(result.results).toContainEqual({ valid: true });
    });

    it('should handle falsy values correctly', async () => {
      actionRegister.register('numberAction', () => 0, { priority: 50 });
      actionRegister.register('numberAction', () => false, { priority: 40 });
      actionRegister.register('numberAction', () => '', { priority: 30 });
      actionRegister.register('numberAction', () => [], { priority: 20 });
      actionRegister.register('numberAction', () => ({}), { priority: 10 });

      const result = await actionRegister.dispatchWithResult('numberAction', 42,
        { result: { collect: true } }
      );

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(5);
      expect(result.results[0]).toBe(0);
      expect(result.results[1]).toBe(false);
      expect(result.results[2]).toBe('');
      expect(result.results[3]).toEqual([]);
      expect(result.results[4]).toEqual({});
    });

    it('should handle complex objects and arrays', async () => {
      actionRegister.register('basicAction', () => ({
        user: { id: 1, name: 'John', preferences: { theme: 'dark' } },
        items: [1, 2, 3],
        timestamp: Date.now()
      }), { priority: 20 });

      actionRegister.register('basicAction', () => [
        { type: 'event', data: { action: 'click' } },
        { type: 'event', data: { action: 'scroll' } }
      ], { priority: 10 });

      const result = await actionRegister.dispatchWithResult('basicAction', 
        { id: 'test', value: 'data' },
        { result: { collect: true } }
      );

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(2);
      expect(result.results[0]).toMatchObject({
        user: { id: 1, name: 'John' },
        items: [1, 2, 3]
      });
      expect(result.results[1]).toHaveLength(2);
      expect(result.results[1][0]).toMatchObject({ type: 'event' });
    });
  });

  describe('📈 Performance and Execution Metrics', () => {
    it('should provide accurate execution metrics', async () => {
      actionRegister.register('basicAction', () => ({ handler: 1 }), { priority: 30 });
      actionRegister.register('basicAction', () => ({ handler: 2 }), { priority: 20 });
      actionRegister.register('basicAction', () => ({ handler: 3 }), { priority: 10 });

      const result = await actionRegister.dispatchWithResult('basicAction', 
        { id: 'test', value: 'data' },
        { result: { collect: true } }
      );

      expect(result.success).toBe(true);
      expect(result.execution.handlersExecuted).toBe(3);
      expect(result.execution.startTime).toBeGreaterThan(0);
      expect(result.execution.endTime).toBeGreaterThanOrEqual(result.execution.startTime);
      expect(result.execution.duration).toBeGreaterThanOrEqual(0);
      expect(result.results).toHaveLength(3);
    });

    it('should handle no handlers scenario', async () => {
      const result = await actionRegister.dispatchWithResult('basicAction', 
        { id: 'test', value: 'data' },
        { result: { collect: true } }
      );

      expect(result.success).toBe(true);
      expect(result.execution.handlersExecuted).toBe(0);
      expect(result.results).toEqual([]);
    });
  });

  describe('🔄 Comparison: dispatch vs dispatchWithResult', () => {
    it('should show difference between dispatch and dispatchWithResult', async () => {
      actionRegister.register('basicAction', () => ({ result: 'test-data' }));

      // Regular dispatch
      const dispatchResult = await actionRegister.dispatch('basicAction', { id: 'test', value: 'data' });
      expect(dispatchResult).toBeUndefined();

      // dispatchWithResult - Always collects results in results array
      const withResultResult = await actionRegister.dispatchWithResult('basicAction', { id: 'test', value: 'data' });
      expect(withResultResult).toBeDefined();
      expect(withResultResult.success).toBe(true);
      expect(withResultResult.results).toEqual([{ result: 'test-data' }]); // Always collects in results array
      expect(withResultResult.result).toBeUndefined(); // No processed result without collect: true
      expect(withResultResult.execution).toBeDefined();
    });

    it('should show behavior with collect: true', async () => {
      actionRegister.register('basicAction', () => ({ collected: true }));

      // dispatchWithResult with collect: true
      const result = await actionRegister.dispatchWithResult('basicAction', 
        { id: 'test', value: 'data' },
        { result: { collect: true } }
      );

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toEqual({ collected: true });
    });
  });
});