/**
 * Comprehensive execution modes tests (Sequential, Parallel, Race)
 */

import { ActionRegister, type ActionPayloadMap } from '../../src';

interface ExecutionTestActions extends ActionPayloadMap {
  processData: { data: string; delay?: number };
  calculateResult: { numbers: number[] };
  performTask: { taskId: string; priority?: number };
  validateInput: { value: any };
}

describe('Execution Modes - Comprehensive', () => {
  let actionRegister: ActionRegister<ExecutionTestActions>;

  beforeEach(() => {
    actionRegister = new ActionRegister<ExecutionTestActions>({
      name: 'ExecutionTestRegister',
      registry: { debug: false }
    });
    jest.useFakeTimers();
  });

  afterEach(() => {
    actionRegister.clearAll();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('Sequential Execution Mode', () => {
    beforeEach(() => {
      actionRegister.setActionExecutionMode('processData', 'sequential');
    });

    it('should execute handlers in strict sequential order', async () => {
      const executionTimes: number[] = [];
      const executionOrder: string[] = [];

      actionRegister.register('processData', async () => {
        executionTimes.push(Date.now());
        executionOrder.push('handler-1');
        await new Promise(resolve => setTimeout(resolve, 100));
      }, { priority: 30, id: 'handler-1' });

      actionRegister.register('processData', async () => {
        executionTimes.push(Date.now());
        executionOrder.push('handler-2');
        await new Promise(resolve => setTimeout(resolve, 50));
      }, { priority: 20, id: 'handler-2' });

      actionRegister.register('processData', async () => {
        executionTimes.push(Date.now());
        executionOrder.push('handler-3');
        await new Promise(resolve => setTimeout(resolve, 25));
      }, { priority: 10, id: 'handler-3' });

      const dispatchPromise = actionRegister.dispatch('processData', { data: 'test' });
      
      // Fast-forward time to complete all handlers
      jest.advanceTimersByTime(200);
      await dispatchPromise;

      // Verify priority-based execution order
      expect(executionOrder).toEqual(['handler-1', 'handler-2', 'handler-3']);
      
      // Verify sequential timing (each handler starts after the previous completes)
      expect(executionTimes[1]).toBeGreaterThanOrEqual(executionTimes[0] + 100);
      expect(executionTimes[2]).toBeGreaterThanOrEqual(executionTimes[1] + 50);
    });

    it('should stop execution on abort in sequential mode', async () => {
      const executedHandlers: string[] = [];

      actionRegister.register('processData', (payload, controller) => {
        executedHandlers.push('validator');
        if (!payload.data) {
          controller.abort('Data is required');
        }
      }, { priority: 30, id: 'validator' });

      actionRegister.register('processData', () => {
        executedHandlers.push('processor');
        return 'processed';
      }, { priority: 20, id: 'processor' });

      actionRegister.register('processData', () => {
        executedHandlers.push('logger');
      }, { priority: 10, id: 'logger' });

      const result = await actionRegister.dispatchWithResult('processData', { data: '' });

      expect(result.aborted).toBe(true);
      expect(result.abortReason).toBe('Data is required');
      expect(executedHandlers).toEqual(['validator']);
    });

    it('should continue execution after handler errors', async () => {
      const executionLog: string[] = [];

      actionRegister.register('processData', () => {
        executionLog.push('handler-1');
        throw new Error('Handler 1 failed');
      }, { priority: 30 });

      actionRegister.register('processData', () => {
        executionLog.push('handler-2');
        return 'success';
      }, { priority: 20 });

      actionRegister.register('processData', () => {
        executionLog.push('handler-3');
      }, { priority: 10 });

      const result = await actionRegister.dispatchWithResult('processData', { data: 'test' }, {
        result: { collect: true }
      });

      expect(executionLog).toEqual(['handler-1', 'handler-2', 'handler-3']);
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(1);
      expect(result.results).toContainEqual('success');
    });
  });

  describe('Parallel Execution Mode', () => {
    beforeEach(() => {
      actionRegister.setActionExecutionMode('calculateResult', 'parallel');
    });

    it('should execute all handlers concurrently', async () => {
      const startTimes: number[] = [];
      const endTimes: number[] = [];
      const results: string[] = [];

      actionRegister.register('calculateResult', async () => {
        startTimes.push(Date.now());
        await new Promise(resolve => setTimeout(resolve, 100));
        endTimes.push(Date.now());
        results.push('slow-calculation');
      }, { priority: 30, id: 'slow' });

      actionRegister.register('calculateResult', async () => {
        startTimes.push(Date.now());
        await new Promise(resolve => setTimeout(resolve, 50));
        endTimes.push(Date.now());
        results.push('medium-calculation');
      }, { priority: 20, id: 'medium' });

      actionRegister.register('calculateResult', async () => {
        startTimes.push(Date.now());
        await new Promise(resolve => setTimeout(resolve, 25));
        endTimes.push(Date.now());
        results.push('fast-calculation');
      }, { priority: 10, id: 'fast' });

      const dispatchPromise = actionRegister.dispatch('calculateResult', { numbers: [1, 2, 3] });
      
      jest.advanceTimersByTime(150);
      await dispatchPromise;

      // All handlers should start at roughly the same time
      const maxStartDiff = Math.max(...startTimes) - Math.min(...startTimes);
      expect(maxStartDiff).toBeLessThan(10);

      // Results should complete in order of execution time (fast to slow)
      expect(results).toEqual(['fast-calculation', 'medium-calculation', 'slow-calculation']);
    });

    it('should collect all results from parallel handlers', async () => {
      actionRegister.register('calculateResult', async (payload) => {
        await new Promise(resolve => setTimeout(resolve, 30));
        return { operation: 'sum', result: payload.numbers.reduce((a, b) => a + b, 0) };
      }, { id: 'sum-calculator' });

      actionRegister.register('calculateResult', async (payload) => {
        await new Promise(resolve => setTimeout(resolve, 20));
        return { operation: 'average', result: payload.numbers.reduce((a, b) => a + b, 0) / payload.numbers.length };
      }, { id: 'avg-calculator' });

      actionRegister.register('calculateResult', async (payload) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return { operation: 'max', result: Math.max(...payload.numbers) };
      }, { id: 'max-calculator' });

      const dispatchPromise = actionRegister.dispatchWithResult('calculateResult', { numbers: [1, 2, 3, 4, 5] }, {
        result: { collect: true, strategy: 'all' }
      });

      jest.advanceTimersByTime(50);
      const result = await dispatchPromise;

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(3);
      expect(result.results).toContainEqual({ operation: 'sum', result: 15 });
      expect(result.results).toContainEqual({ operation: 'average', result: 3 });
      expect(result.results).toContainEqual({ operation: 'max', result: 5 });
    });

    it('should handle errors in parallel without stopping others', async () => {
      const completedTasks: string[] = [];

      actionRegister.register('performTask', async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        completedTasks.push('task-1');
        return 'task-1-complete';
      }, { id: 'task-1' });

      actionRegister.register('performTask', async () => {
        await new Promise(resolve => setTimeout(resolve, 30));
        throw new Error('Task 2 failed');
      }, { id: 'task-2' });

      actionRegister.register('performTask', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        completedTasks.push('task-3');
        return 'task-3-complete';
      }, { id: 'task-3' });

      const dispatchPromise = actionRegister.dispatchWithResult('performTask', { taskId: 'parallel-test' }, {
        result: { collect: true }
      });

      jest.advanceTimersByTime(100);
      const result = await dispatchPromise;

      expect(completedTasks).toEqual(['task-3', 'task-1']);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].handlerId).toBe('task-2');
      expect(result.results).toHaveLength(2);
    });
  });

  describe('Race Execution Mode', () => {
    beforeEach(() => {
      actionRegister.setActionExecutionMode('validateInput', 'race');
    });

    it('should return result from first completing handler', async () => {
      actionRegister.register('validateInput', async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { validator: 'slow', valid: true, confidence: 0.9 };
      }, { id: 'slow-validator' });

      actionRegister.register('validateInput', async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return { validator: 'medium', valid: true, confidence: 0.8 };
      }, { id: 'medium-validator' });

      actionRegister.register('validateInput', async () => {
        await new Promise(resolve => setTimeout(resolve, 25));
        return { validator: 'fast', valid: false, confidence: 0.7 };
      }, { id: 'fast-validator' });

      const dispatchPromise = actionRegister.dispatchWithResult('validateInput', { value: 'test-data' });

      jest.advanceTimersByTime(30);
      const result = await dispatchPromise;

      expect(result.success).toBe(true);
      expect(result.result).toEqual({ validator: 'fast', valid: false, confidence: 0.7 });
    });

    it('should return first error if it completes first', async () => {
      actionRegister.register('validateInput', async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { valid: true };
      }, { id: 'success-validator' });

      actionRegister.register('validateInput', async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        throw new Error('Medium validator failed');
      }, { id: 'medium-error' });

      actionRegister.register('validateInput', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        throw new Error('Fast validator failed');
      }, { id: 'fast-error' });

      const dispatchPromise = actionRegister.dispatchWithResult('validateInput', { value: 'invalid-data' });

      jest.advanceTimersByTime(20);
      const result = await dispatchPromise;

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].handlerId).toBe('fast-error');
      expect(result.errors[0].error.message).toBe('Fast validator failed');
    });

    it('should handle early abort in race mode', async () => {
      actionRegister.register('validateInput', async (payload, controller) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        controller.abort('Fast abort');
      }, { id: 'abort-handler' });

      actionRegister.register('validateInput', async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { valid: true };
      }, { id: 'slow-handler' });

      const dispatchPromise = actionRegister.dispatchWithResult('validateInput', { value: 'test' });

      jest.advanceTimersByTime(20);
      const result = await dispatchPromise;

      expect(result.success).toBe(false);
      expect(result.aborted).toBe(true);
      expect(result.abortReason).toBe('Fast abort');
    });
  });

  describe('Execution Mode Management', () => {
    it('should allow per-action execution mode configuration', () => {
      actionRegister.setActionExecutionMode('processData', 'parallel');
      actionRegister.setActionExecutionMode('calculateResult', 'race');
      
      expect(actionRegister.getActionExecutionMode('processData')).toBe('parallel');
      expect(actionRegister.getActionExecutionMode('calculateResult')).toBe('race');
      expect(actionRegister.getActionExecutionMode('performTask')).toBe('sequential'); // default
    });

    it('should override execution mode via dispatch options', async () => {
      actionRegister.setActionExecutionMode('processData', 'sequential');
      
      const results: string[] = [];

      actionRegister.register('processData', async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        results.push('slow');
      });

      actionRegister.register('processData', async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
        results.push('fast');
      });

      // Override to parallel execution
      const dispatchPromise = actionRegister.dispatch('processData', { data: 'test' }, {
        executionMode: 'parallel'
      });

      jest.advanceTimersByTime(60);
      await dispatchPromise;

      // In parallel mode, fast handler completes first
      expect(results).toEqual(['fast', 'slow']);
    });

    it('should handle execution mode removal', () => {
      actionRegister.setActionExecutionMode('processData', 'parallel');
      expect(actionRegister.getActionExecutionMode('processData')).toBe('parallel');

      actionRegister.removeActionExecutionMode('processData');
      expect(actionRegister.getActionExecutionMode('processData')).toBe('sequential');
    });
  });

  describe('Mixed Execution Scenarios', () => {
    it('should handle sync and async handlers in parallel mode', async () => {
      actionRegister.setActionExecutionMode('performTask', 'parallel');
      
      const results: string[] = [];

      actionRegister.register('performTask', () => {
        results.push('sync-handler');
        return 'sync-result';
      }, { id: 'sync' });

      actionRegister.register('performTask', async () => {
        await new Promise(resolve => setTimeout(resolve, 30));
        results.push('async-handler');
        return 'async-result';
      }, { id: 'async' });

      const dispatchPromise = actionRegister.dispatchWithResult('performTask', { taskId: 'mixed-test' }, {
        result: { collect: true }
      });

      jest.advanceTimersByTime(50);
      const result = await dispatchPromise;

      expect(results).toEqual(['sync-handler', 'async-handler']);
      expect(result.results).toContainEqual('sync-result');
      expect(result.results).toContainEqual('async-result');
    });

    it('should provide accurate execution statistics for different modes', async () => {
      // Test sequential mode statistics
      actionRegister.setActionExecutionMode('processData', 'sequential');
      
      actionRegister.register('processData', async () => {
        await new Promise(resolve => setTimeout(resolve, 30));
        return 'result1';
      });

      actionRegister.register('processData', () => {
        throw new Error('Handler error');
      });

      actionRegister.register('processData', async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
        return 'result2';
      });

      const sequentialPromise = actionRegister.dispatchWithResult('processData', { data: 'test' });
      jest.advanceTimersByTime(60);
      const sequentialResult = await sequentialPromise;

      expect(sequentialResult.execution.handlersExecuted).toBe(3);
      expect(sequentialResult.execution.handlersFailed).toBe(1);
      expect(sequentialResult.execution.duration).toBeGreaterThan(40); // 30 + 20 + processing time

      // Test parallel mode statistics
      actionRegister.setActionExecutionMode('calculateResult', 'parallel');
      
      actionRegister.register('calculateResult', async () => {
        await new Promise(resolve => setTimeout(resolve, 40));
        return 'parallel1';
      });

      actionRegister.register('calculateResult', async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return 'parallel2';
      });

      const parallelPromise = actionRegister.dispatchWithResult('calculateResult', { numbers: [1, 2] });
      jest.advanceTimersByTime(60);
      const parallelResult = await parallelPromise;

      expect(parallelResult.execution.handlersExecuted).toBe(2);
      expect(parallelResult.execution.handlersFailed).toBe(0);
      expect(parallelResult.execution.duration).toBeLessThan(60); // Should be close to 50ms, not 90ms
    });
  });
});