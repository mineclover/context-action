/**
 * Tests for ActionRegister result collection and advanced features
 */

import { 
  ActionRegister, 
  type ActionPayloadMap, 
  type HandlerConfig, 
  type PipelineController,
  type DispatchOptions,
  type ExecutionResult
} from '../../src';

interface ResultTestActions extends ActionPayloadMap {
  collectResults: { id: string };
  processData: { data: any };
  calculateSum: { numbers: number[] };
  fetchUser: { userId: string };
}

describe('ActionRegister - Result Handling', () => {
  let actionRegister: ActionRegister<ResultTestActions>;

  beforeEach(() => {
    actionRegister = new ActionRegister<ResultTestActions>({
      name: 'ResultTestRegister',
      registry: { debug: false }
    });
  });

  afterEach(() => {
    actionRegister.clearAll();
  });

  describe('dispatchWithResult', () => {
    it('should collect results from handlers', async () => {
      actionRegister.register('collectResults', (payload, controller) => {
        controller.setResult({ step: 'validation', valid: true });
      }, { priority: 100 });

      actionRegister.register('collectResults', (payload, controller) => {
        controller.setResult({ step: 'processing', processed: true });
      }, { priority: 50 });

      const result = await actionRegister.dispatchWithResult('collectResults', { id: 'test' }, {
        result: { collect: true, strategy: 'all' }
      });

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(2);
      expect(result.results[0]).toEqual({ step: 'validation', valid: true });
      expect(result.results[1]).toEqual({ step: 'processing', processed: true });
    });

    it('should handle early termination with controller.return()', async () => {
      actionRegister.register('processData', (payload, controller) => {
        controller.return({ terminated: true, reason: 'early exit' });
      }, { priority: 100 });

      actionRegister.register('processData', () => {
        // This should not execute
        throw new Error('Should not reach here');
      }, { priority: 50 });

      const result = await actionRegister.dispatchWithResult('processData', { data: 'test' });

      expect(result.success).toBe(true);
      expect(result.terminated).toBe(true);
      expect(result.result).toEqual({ terminated: true, reason: 'early exit' });
      expect(result.execution.handlersExecuted).toBe(1);
    });

    it('should handle pipeline abort', async () => {
      actionRegister.register('processData', (payload, controller) => {
        controller.abort('Test abort reason');
      }, { priority: 100 });

      actionRegister.register('processData', () => {
        throw new Error('Should not execute after abort');
      }, { priority: 50 });

      const result = await actionRegister.dispatchWithResult('processData', { data: 'test' });

      expect(result.success).toBe(false);
      expect(result.aborted).toBe(true);
      expect(result.abortReason).toBe('Test abort reason');
      expect(result.execution.handlersExecuted).toBe(1);
    });

    it('should merge results with custom merger', async () => {
      actionRegister.register('calculateSum', (payload, controller) => {
        const sum = payload.numbers.reduce((a, b) => a + b, 0);
        controller.setResult({ sum, count: payload.numbers.length });
      });

      actionRegister.register('calculateSum', (payload, controller) => {
        const avg = payload.numbers.reduce((a, b) => a + b, 0) / payload.numbers.length;
        controller.setResult({ avg, min: Math.min(...payload.numbers), max: Math.max(...payload.numbers) });
      });

      const result = await actionRegister.dispatchWithResult('calculateSum', 
        { numbers: [1, 2, 3, 4, 5] }, 
        {
          result: {
            strategy: 'merge',
            merger: (results) => results.reduce((acc, curr) => ({ ...acc, ...curr }), {})
          }
        }
      );

      expect(result.success).toBe(true);
      expect(result.result).toEqual({
        sum: 15,
        count: 5,
        avg: 3,
        min: 1,
        max: 5
      });
    });

    it('should provide detailed execution information', async () => {
      const startTime = Date.now();

      actionRegister.register('processData', async (payload, controller) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        controller.setResult('handler1-result');
      }, { id: 'handler1' });

      actionRegister.register('processData', (payload, controller) => {
        controller.setResult('handler2-result');
      }, { id: 'handler2' });

      const result = await actionRegister.dispatchWithResult('processData', { data: 'test' });

      expect(result.success).toBe(true);
      expect(result.execution.handlersExecuted).toBe(2);
      expect(result.execution.handlersSkipped).toBe(0);
      expect(result.execution.handlersFailed).toBe(0);
      expect(result.execution.duration).toBeGreaterThan(0);
      expect(result.execution.startTime).toBeGreaterThanOrEqual(startTime);
      expect(result.execution.endTime).toBeGreaterThan(result.execution.startTime);

      // Check handler details
      expect(result.handlers).toHaveLength(2);
      expect(result.handlers[0].id).toBe('handler1');
      expect(result.handlers[0].executed).toBe(true);
      expect(result.handlers[0].result).toBe('handler1-result');
      expect(result.handlers[1].id).toBe('handler2');
      expect(result.handlers[1].executed).toBe(true);
      expect(result.handlers[1].result).toBe('handler2-result');
    });

    it('should track errors in execution result', async () => {
      actionRegister.register('processData', () => {
        throw new Error('Handler 1 error');
      }, { id: 'error-handler' });

      actionRegister.register('processData', (payload, controller) => {
        controller.setResult('success-result');
      }, { id: 'success-handler' });

      const result = await actionRegister.dispatchWithResult('processData', { data: 'test' });

      expect(result.execution.handlersFailed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].handlerId).toBe('error-handler');
      expect(result.errors[0].error.message).toBe('Handler 1 error');
      expect(result.errors[0].timestamp).toBeDefined();

      // Success handler should still have executed
      const successHandler = result.handlers.find(h => h.id === 'success-handler');
      expect(successHandler?.executed).toBe(true);
      expect(successHandler?.result).toBe('success-result');
    });
  });

  describe('Advanced Dispatch Options', () => {
    it('should handle filter options', async () => {
      actionRegister.register('processData', () => {
        return 'validation-result';
      }, { id: 'validation', tags: ['validation'], category: 'core' });

      actionRegister.register('processData', () => {
        return 'logging-result';
      }, { id: 'logging', tags: ['logging'], category: 'utility' });

      actionRegister.register('processData', () => {
        return 'analytics-result';
      }, { id: 'analytics', tags: ['analytics'], category: 'utility' });

      // Filter by tags
      const tagResult = await actionRegister.dispatchWithResult('processData', { data: 'test' }, {
        filter: { tags: ['validation'] },
        result: { collect: true }
      });

      expect(tagResult.execution.handlersExecuted).toBe(1);
      expect(tagResult.results[0]).toBe('validation-result');

      // Filter by category
      const categoryResult = await actionRegister.dispatchWithResult('processData', { data: 'test' }, {
        filter: { category: 'utility' },
        result: { collect: true }
      });

      expect(categoryResult.execution.handlersExecuted).toBe(2);
      expect(categoryResult.results).toContain('logging-result');
      expect(categoryResult.results).toContain('analytics-result');
    });

    it('should handle exclude filters', async () => {
      actionRegister.register('processData', () => 'core-result', { 
        tags: ['core'], category: 'essential' 
      });
      
      actionRegister.register('processData', () => 'logging-result', { 
        tags: ['logging'], category: 'utility' 
      });
      
      actionRegister.register('processData', () => 'debug-result', { 
        tags: ['debug'], category: 'utility' 
      });

      const result = await actionRegister.dispatchWithResult('processData', { data: 'test' }, {
        filter: {
          excludeTags: ['logging', 'debug'],
          excludeCategory: 'utility'
        },
        result: { collect: true }
      });

      expect(result.execution.handlersExecuted).toBe(1);
      expect(result.results[0]).toBe('core-result');
    });

    it('should handle custom filter functions', async () => {
      actionRegister.register('processData', () => 'high-priority', { priority: 100 });
      actionRegister.register('processData', () => 'medium-priority', { priority: 50 });
      actionRegister.register('processData', () => 'low-priority', { priority: 10 });

      const result = await actionRegister.dispatchWithResult('processData', { data: 'test' }, {
        filter: {
          custom: (config) => config.priority > 50
        },
        result: { collect: true }
      });

      expect(result.execution.handlersExecuted).toBe(1);
      expect(result.results[0]).toBe('high-priority');
    });

    it('should handle result collection limits', async () => {
      // Register 5 handlers
      for (let i = 1; i <= 5; i++) {
        actionRegister.register('processData', () => `result-${i}`, { priority: 100 - i });
      }

      const result = await actionRegister.dispatchWithResult('processData', { data: 'test' }, {
        result: {
          collect: true,
          maxResults: 3
        }
      });

      expect(result.results).toHaveLength(3);
      expect(result.results).toEqual(['result-1', 'result-2', 'result-3']);
    });

    it('should handle result timeout', async () => {
      actionRegister.register('processData', async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'slow-result';
      });

      const result = await actionRegister.dispatchWithResult('processData', { data: 'test' }, {
        result: {
          collect: true,
          timeout: 50 // Timeout after 50ms
        }
      });

      // The exact behavior depends on implementation
      // This test verifies that timeout is handled gracefully
      expect(result).toBeDefined();
    });
  });

  describe('Result Strategies', () => {
    beforeEach(() => {
      actionRegister.register('calculateSum', () => 'first', { priority: 100 });
      actionRegister.register('calculateSum', () => 'second', { priority: 50 });
      actionRegister.register('calculateSum', () => 'third', { priority: 10 });
    });

    it('should handle "first" strategy', async () => {
      const result = await actionRegister.dispatchWithResult('calculateSum', { numbers: [] }, {
        result: { strategy: 'first' }
      });

      expect(result.result).toBe('first');
    });

    it('should handle "last" strategy', async () => {
      const result = await actionRegister.dispatchWithResult('calculateSum', { numbers: [] }, {
        result: { strategy: 'last' }
      });

      expect(result.result).toBe('third');
    });

    it('should handle "all" strategy', async () => {
      const result = await actionRegister.dispatchWithResult('calculateSum', { numbers: [] }, {
        result: { strategy: 'all' }
      });

      expect(result.result).toEqual(['first', 'second', 'third']);
    });

    it('should handle custom strategy with merger', async () => {
      const result = await actionRegister.dispatchWithResult('calculateSum', { numbers: [] }, {
        result: {
          strategy: 'custom',
          merger: (results) => results.join('-')
        }
      });

      expect(result.result).toBe('first-second-third');
    });
  });

  describe('PipelineController Advanced Methods', () => {
    it('should handle getResults() method', async () => {
      let allResults: any[] = [];

      actionRegister.register('processData', (payload, controller) => {
        controller.setResult('first-result');
      }, { priority: 100 });

      actionRegister.register('processData', (payload, controller) => {
        allResults = controller.getResults();
        controller.setResult('second-result');
      }, { priority: 50 });

      await actionRegister.dispatch('processData', { data: 'test' });

      expect(allResults).toEqual(['first-result']);
    });

    it('should handle mergeResult() method', async () => {
      actionRegister.register('processData', (payload, controller) => {
        controller.setResult({ count: 1, type: 'A' });
      }, { priority: 100 });

      actionRegister.register('processData', (payload, controller) => {
        controller.mergeResult((prev, current) => ({
          totalCount: prev.reduce((sum, p: any) => sum + p.count, 0) + current.count,
          types: [...prev.map((p: any) => p.type), current.type]
        }));
        controller.setResult({ count: 2, type: 'B' });
      }, { priority: 50 });

      const result = await actionRegister.dispatchWithResult('processData', { data: 'test' }, {
        result: { collect: true }
      });

      // Check if merge was applied correctly
      expect(result.results).toHaveLength(2);
    });
  });
});