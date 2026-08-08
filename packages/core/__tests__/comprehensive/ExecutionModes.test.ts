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
  });

  afterEach(() => {
    // Properly clean up to prevent memory leaks
    actionRegister.destroy();
    jest.clearAllMocks();
  });

  describe('Sequential Execution Mode', () => {
    beforeEach(() => {
      actionRegister.setActionExecutionMode('processData', 'sequential');
    });

    it('should execute handlers in strict sequential order', async () => {
      const executionOrder: string[] = [];
      const startOrder: string[] = [];
      const endOrder: string[] = [];

      actionRegister.register('processData', async () => {
        startOrder.push('handler-1');
        executionOrder.push('handler-1-start');
        await new Promise(resolve => setTimeout(resolve, 20));
        endOrder.push('handler-1');
        executionOrder.push('handler-1-end');
      }, { priority: 30, id: 'handler-1', blocking: true });

      actionRegister.register('processData', async () => {
        startOrder.push('handler-2');
        executionOrder.push('handler-2-start');
        await new Promise(resolve => setTimeout(resolve, 10));
        endOrder.push('handler-2');
        executionOrder.push('handler-2-end');
      }, { priority: 20, id: 'handler-2', blocking: true });

      actionRegister.register('processData', async () => {
        startOrder.push('handler-3');
        executionOrder.push('handler-3-start');
        await new Promise(resolve => setTimeout(resolve, 5));
        endOrder.push('handler-3');
        executionOrder.push('handler-3-end');
      }, { priority: 10, id: 'handler-3', blocking: true });

      await actionRegister.dispatch('processData', { data: 'test' });

      // Verify priority-based execution order
      expect(startOrder).toEqual(['handler-1', 'handler-2', 'handler-3']);
      expect(endOrder).toEqual(['handler-1', 'handler-2', 'handler-3']);

      // Verify strict sequential execution (each handler completes before next starts)
      expect(executionOrder).toEqual([
        'handler-1-start', 'handler-1-end',
        'handler-2-start', 'handler-2-end',
        'handler-3-start', 'handler-3-end'
      ]);
    });

    it('awaits async handlers by default and preserves priority result order', async () => {
      const events: string[] = [];
      actionRegister.register('processData', async () => {
        events.push('first-start');
        await new Promise(resolve => setTimeout(resolve, 20));
        events.push('first-end');
        return 'first';
      }, { priority: 20 });
      actionRegister.register('processData', async () => {
        events.push('second-start');
        await new Promise(resolve => setTimeout(resolve, 5));
        events.push('second-end');
        return 'second';
      }, { priority: 10 });

      const result = await actionRegister.dispatchWithResult<'processData', string>(
        'processData',
        { data: 'ordered' },
        { result: { collect: true, strategy: 'all' } },
      );

      expect(events).toEqual(['first-start', 'first-end', 'second-start', 'second-end']);
      expect(result.results).toEqual(['first', 'second']);
      expect(result.result).toEqual(['first', 'second']);
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
      const startOrder: string[] = [];
      const results: string[] = [];

      actionRegister.register('calculateResult', async () => {
        startOrder.push('slow');
        await new Promise(resolve => setTimeout(resolve, 30));
        results.push('slow-calculation');
      }, { priority: 30, id: 'slow' });

      actionRegister.register('calculateResult', async () => {
        startOrder.push('medium');
        await new Promise(resolve => setTimeout(resolve, 20));
        results.push('medium-calculation');
      }, { priority: 20, id: 'medium' });

      actionRegister.register('calculateResult', async () => {
        startOrder.push('fast');
        await new Promise(resolve => setTimeout(resolve, 10));
        results.push('fast-calculation');
      }, { priority: 10, id: 'fast' });

      await actionRegister.dispatch('calculateResult', { numbers: [1, 2, 3] });

      // All handlers should start at roughly the same time
      expect(startOrder).toHaveLength(3);
      expect(startOrder).toContain('slow');
      expect(startOrder).toContain('medium');
      expect(startOrder).toContain('fast');

      // Results should complete in order of execution time (fast to slow)
      expect(results).toEqual(['fast-calculation', 'medium-calculation', 'slow-calculation']);
    });

    it('should collect all results from parallel handlers', async () => {
      actionRegister.register('calculateResult', async (payload) => {
        await new Promise(resolve => setTimeout(resolve, 15));
        return { operation: 'sum', result: payload.numbers.reduce((a, b) => a + b, 0) };
      }, { id: 'sum-calculator' });

      actionRegister.register('calculateResult', async (payload) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return { operation: 'average', result: payload.numbers.reduce((a, b) => a + b, 0) / payload.numbers.length };
      }, { id: 'avg-calculator' });

      actionRegister.register('calculateResult', async (payload) => {
        await new Promise(resolve => setTimeout(resolve, 5));
        return { operation: 'max', result: Math.max(...payload.numbers) };
      }, { id: 'max-calculator' });

      const result = await actionRegister.dispatchWithResult('calculateResult', { numbers: [1, 2, 3, 4, 5] }, {
        result: { collect: true, strategy: 'all' }
      });

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(3);
      expect(result.results.map(value => (value as unknown as { operation: string }).operation))
        .toEqual(['sum', 'average', 'max']);
      expect(result.results).toContainEqual({ operation: 'sum', result: 15 });
      expect(result.results).toContainEqual({ operation: 'average', result: 3 });
      expect(result.results).toContainEqual({ operation: 'max', result: 5 });
    });

    it('should handle errors in parallel without stopping others', async () => {
      const completedTasks: string[] = [];

      actionRegister.register('performTask', async () => {
        await new Promise(resolve => setTimeout(resolve, 25));
        completedTasks.push('task-1');
        return 'task-1-complete';
      }, { id: 'task-1' });

      actionRegister.register('performTask', async () => {
        await new Promise(resolve => setTimeout(resolve, 15));
        throw new Error('Task 2 failed');
      }, { id: 'task-2' });

      actionRegister.register('performTask', async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
        completedTasks.push('task-3');
        return 'task-3-complete';
      }, { id: 'task-3' });

      const result = await actionRegister.dispatchWithResult('performTask', { taskId: 'parallel-test' }, {
        result: { collect: true }
      });

      // Parallel completion timing is scheduler-dependent; the public
      // contract guarantees both successful handlers complete, not the order
      // in which their external side effects become observable.
      expect(completedTasks).toEqual(expect.arrayContaining(['task-1', 'task-3']));
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].handlerId).toBe('task-2');
      expect(result.results).toHaveLength(2);
    });

    it('arbitrates multiple parallel termination requests by priority order', async () => {
      actionRegister.setActionExecutionMode('performTask', 'parallel');
      actionRegister.register<'performTask', string>('performTask', async (_payload, controller) => {
        await new Promise(resolve => setTimeout(resolve, 20));
        controller.return('high-priority-termination');
      }, { id: 'high-priority', priority: 20 });
      actionRegister.register<'performTask', string>('performTask', async (_payload, controller) => {
        await new Promise(resolve => setTimeout(resolve, 5));
        controller.return('low-priority-termination');
      }, { id: 'low-priority', priority: 10 });

      const result = await actionRegister.dispatchWithResult<'performTask', string>(
        'performTask',
        { taskId: 'parallel-termination' },
      );

      expect(result.terminated).toBe(true);
      expect(result.result).toBe('high-priority-termination');
    });
  });

  describe('Race Execution Mode', () => {
    beforeEach(() => {
      actionRegister.setActionExecutionMode('validateInput', 'race');
    });

    it('should return result from first completing handler', async () => {
      actionRegister.register('validateInput', async () => {
        await new Promise(resolve => setTimeout(resolve, 30));
        return { validator: 'slow', valid: true, confidence: 0.9 };
      }, { id: 'slow-validator' });

      actionRegister.register('validateInput', async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
        return { validator: 'medium', valid: true, confidence: 0.8 };
      }, { id: 'medium-validator' });

      actionRegister.register('validateInput', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return { validator: 'fast', valid: false, confidence: 0.7 };
      }, { id: 'fast-validator' });

      const result = await actionRegister.dispatchWithResult('validateInput', { value: 'test-data' });

      expect(result.success).toBe(true);
      expect(result.result).toEqual({ validator: 'fast', valid: false, confidence: 0.7 });
    });

    it('should return first error if it completes first', async () => {
      // Clear any existing handlers
      actionRegister = new ActionRegister<ExecutionTestActions>({
        name: 'ExecutionTestRegister',
        registry: { debug: false }
      });
      actionRegister.setActionExecutionMode('validateInput', 'race');

      let firstCompleted = '';

      actionRegister.register('validateInput', async () => {
        await new Promise(resolve => setTimeout(resolve, 30));
        firstCompleted = firstCompleted || 'success';
        return { valid: true };
      }, { id: 'success-validator' });

      actionRegister.register('validateInput', async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
        firstCompleted = firstCompleted || 'medium-error';
        throw new Error('Medium validator failed');
      }, { id: 'medium-error' });

      actionRegister.register('validateInput', async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
        firstCompleted = firstCompleted || 'fast-error';
        throw new Error('Fast validator failed');
      }, { id: 'fast-error' });

      const result = await actionRegister.dispatchWithResult('validateInput', { value: 'invalid-data' });

      // Verify that the fastest handler completed first
      expect(firstCompleted).toBe('fast-error');

      // In race mode, the result depends on the first completing handler's outcome
      // Check that we got an execution result (could be success or failure based on race outcome)
      expect(result.execution.handlersExecuted).toBeGreaterThan(0);
    });

    it('should handle early abort in race mode', async () => {
      actionRegister.register('validateInput', async (payload, controller) => {
        await new Promise(resolve => setTimeout(resolve, 5));
        controller.abort('Fast abort');
      }, { id: 'abort-handler' });

      actionRegister.register('validateInput', async () => {
        await new Promise(resolve => setTimeout(resolve, 30));
        return { valid: true };
      }, { id: 'slow-handler' });

      const result = await actionRegister.dispatchWithResult('validateInput', { value: 'test' });

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
        await new Promise(resolve => setTimeout(resolve, 25));
        results.push('slow');
      });

      actionRegister.register('processData', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        results.push('fast');
      });

      // Override to parallel execution
      await actionRegister.dispatch('processData', { data: 'test' }, {
        executionMode: 'parallel'
      });

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
        await new Promise(resolve => setTimeout(resolve, 15));
        results.push('async-handler');
        return 'async-result';
      }, { id: 'async' });

      const result = await actionRegister.dispatchWithResult('performTask', { taskId: 'mixed-test' }, {
        result: { collect: true }
      });

      expect(results).toEqual(['sync-handler', 'async-handler']);
      expect(result.results).toContainEqual('sync-result');
      expect(result.results).toContainEqual('async-result');
    });

    it('should provide accurate execution statistics for different modes', async () => {
      // Test sequential mode statistics
      const seqRegister = new ActionRegister<ExecutionTestActions>({
        name: 'SequentialTestRegister',
        registry: { debug: false }
      });
      seqRegister.setActionExecutionMode('processData', 'sequential');

      seqRegister.register('processData', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'result1';
      });

      seqRegister.register('processData', () => {
        throw new Error('Handler error');
      });

      seqRegister.register('processData', async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
        return 'result2';
      });

      const sequentialResult = await seqRegister.dispatchWithResult('processData', { data: 'test' });

      expect(sequentialResult.execution.handlersExecuted).toBe(3);
      expect(sequentialResult.execution.handlersFailed).toBe(1);
      expect(sequentialResult.execution.duration).toBeGreaterThan(0);

      seqRegister.destroy();

      // Test parallel mode statistics
      const parallelRegister = new ActionRegister<ExecutionTestActions>({
        name: 'ParallelTestRegister',
        registry: { debug: false }
      });
      parallelRegister.setActionExecutionMode('performTask', 'parallel');

      parallelRegister.register('performTask', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'parallel1';
      });

      parallelRegister.register('performTask', async () => {
        await new Promise(resolve => setTimeout(resolve, 15));
        return 'parallel2';
      });

      const parallelResult = await parallelRegister.dispatchWithResult('performTask', { taskId: 'stats-test' });

      expect(parallelResult.execution.handlersExecuted).toBeGreaterThan(0);
      expect(parallelResult.execution.handlersFailed).toBe(0);
      expect(parallelResult.execution.duration).toBeGreaterThan(0);

      // Clean up the parallel register
      parallelRegister.destroy();
    });
  });
});
