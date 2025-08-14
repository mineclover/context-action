/**
 * Tests for execution modes (sequential, parallel, race)
 */

import { ActionRegister, type ActionPayloadMap } from '../../src';

interface ExecutionModeTestActions extends ActionPayloadMap {
  testSequential: { delay: number };
  testParallel: { delay: number };
  testRace: { delay: number };
}

describe('Execution Modes', () => {
  let actionRegister: ActionRegister<ExecutionModeTestActions>;

  beforeEach(() => {
    actionRegister = new ActionRegister<ExecutionModeTestActions>({
      name: 'ExecutionModeTest',
      registry: {
        debug: false,
        defaultExecutionMode: 'sequential'
      }
    });
  });

  afterEach(() => {
    actionRegister.clearAll();
    jest.clearAllTimers();
  });

  describe('Sequential Execution Mode', () => {
    it('should execute handlers in priority order sequentially', async () => {
      const executionOrder: string[] = [];
      const startTimes: number[] = [];

      actionRegister.register('testSequential', async (payload) => {
        startTimes.push(Date.now());
        await new Promise(resolve => setTimeout(resolve, 50));
        executionOrder.push('handler1');
      }, { priority: 100, id: 'handler1' });

      actionRegister.register('testSequential', async (payload) => {
        startTimes.push(Date.now());
        await new Promise(resolve => setTimeout(resolve, 30));
        executionOrder.push('handler2');
      }, { priority: 50, id: 'handler2' });

      actionRegister.register('testSequential', async (payload) => {
        startTimes.push(Date.now());
        await new Promise(resolve => setTimeout(resolve, 10));
        executionOrder.push('handler3');
      }, { priority: 10, id: 'handler3' });

      actionRegister.setActionExecutionMode('testSequential', 'sequential');

      await actionRegister.dispatch('testSequential', { delay: 0 });

      // Check execution order
      expect(executionOrder).toEqual(['handler1', 'handler2', 'handler3']);

      // Check that each handler started after the previous one completed
      // (allowing for some timing tolerance)
      expect(startTimes[1]).toBeGreaterThanOrEqual(startTimes[0] + 40);
      expect(startTimes[2]).toBeGreaterThanOrEqual(startTimes[1] + 20);
    });

    it('should stop execution on abort in sequential mode', async () => {
      const executed: string[] = [];

      actionRegister.register('testSequential', (payload, controller) => {
        executed.push('handler1');
        controller.abort('Test abort');
      }, { priority: 100 });

      actionRegister.register('testSequential', () => {
        executed.push('handler2');
      }, { priority: 50 });

      actionRegister.setActionExecutionMode('testSequential', 'sequential');

      await actionRegister.dispatch('testSequential', { delay: 0 });

      expect(executed).toEqual(['handler1']);
    });

    it('should handle errors and continue in sequential mode', async () => {
      const executed: string[] = [];

      actionRegister.register('testSequential', () => {
        executed.push('handler1');
        throw new Error('Handler 1 failed');
      }, { priority: 100 });

      actionRegister.register('testSequential', () => {
        executed.push('handler2');
      }, { priority: 50 });

      actionRegister.setActionExecutionMode('testSequential', 'sequential');

      await actionRegister.dispatch('testSequential', { delay: 0 });

      // Both handlers should have been called despite the error
      expect(executed).toEqual(['handler1', 'handler2']);
    });
  });

  describe('Parallel Execution Mode', () => {
    it('should execute handlers in parallel', async () => {
      const executionOrder: string[] = [];
      const startTimes: number[] = [];
      const endTimes: number[] = [];

      actionRegister.register('testParallel', async () => {
        startTimes.push(Date.now());
        await new Promise(resolve => setTimeout(resolve, 100));
        endTimes.push(Date.now());
        executionOrder.push('slow-handler');
      }, { priority: 100 });

      actionRegister.register('testParallel', async () => {
        startTimes.push(Date.now());
        await new Promise(resolve => setTimeout(resolve, 50));
        endTimes.push(Date.now());
        executionOrder.push('medium-handler');
      }, { priority: 50 });

      actionRegister.register('testParallel', async () => {
        startTimes.push(Date.now());
        await new Promise(resolve => setTimeout(resolve, 20));
        endTimes.push(Date.now());
        executionOrder.push('fast-handler');
      }, { priority: 10 });

      actionRegister.setActionExecutionMode('testParallel', 'parallel');

      await actionRegister.dispatch('testParallel', { delay: 0 });

      // In parallel mode, faster handlers complete first
      expect(executionOrder).toEqual(['fast-handler', 'medium-handler', 'slow-handler']);

      // All handlers should start around the same time
      const maxStartDiff = Math.max(...startTimes) - Math.min(...startTimes);
      expect(maxStartDiff).toBeLessThan(50); // Allow some tolerance
    });

    it('should handle abort in parallel mode', async () => {
      const executed: string[] = [];
      let abortCalled = false;

      actionRegister.register('testParallel', async (payload, controller) => {
        executed.push('handler1');
        await new Promise(resolve => setTimeout(resolve, 50));
        controller.abort('Test abort');
        abortCalled = true;
      }, { priority: 100 });

      actionRegister.register('testParallel', async () => {
        await new Promise(resolve => setTimeout(resolve, 30));
        executed.push('handler2');
      }, { priority: 50 });

      actionRegister.register('testParallel', async () => {
        await new Promise(resolve => setTimeout(resolve, 70));
        executed.push('handler3');
      }, { priority: 10 });

      actionRegister.setActionExecutionMode('testParallel', 'parallel');

      await actionRegister.dispatch('testParallel', { delay: 0 });

      expect(abortCalled).toBe(true);
      // In parallel mode, handlers that complete before abort should still execute
      expect(executed).toContain('handler1');
      expect(executed).toContain('handler2');
    });

    it('should collect results from all handlers in parallel mode', async () => {
      actionRegister.register('testParallel', async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return 'result1';
      }, { priority: 100 });

      actionRegister.register('testParallel', async () => {
        await new Promise(resolve => setTimeout(resolve, 30));
        return 'result2';
      }, { priority: 50 });

      actionRegister.register('testParallel', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'result3';
      }, { priority: 10 });

      actionRegister.setActionExecutionMode('testParallel', 'parallel');

      const result = await actionRegister.dispatchWithResult('testParallel', { delay: 0 }, {
        result: { collect: true, strategy: 'all' }
      });

      expect(result.results).toHaveLength(3);
      expect(result.results).toContain('result1');
      expect(result.results).toContain('result2');
      expect(result.results).toContain('result3');
    });
  });

  describe('Race Execution Mode', () => {
    it('should execute handlers in race mode and return first result', async () => {
      const executed: string[] = [];

      actionRegister.register('testRace', async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        executed.push('slow-handler');
        return 'slow-result';
      }, { priority: 100 });

      actionRegister.register('testRace', async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        executed.push('medium-handler');
        return 'medium-result';
      }, { priority: 50 });

      actionRegister.register('testRace', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        executed.push('fast-handler');
        return 'fast-result';
      }, { priority: 10 });

      actionRegister.setActionExecutionMode('testRace', 'race');

      const result = await actionRegister.dispatchWithResult('testRace', { delay: 0 });

      // Fast handler should win the race
      expect(result.result).toBe('fast-result');
      expect(executed).toContain('fast-handler');
      
      // Other handlers might not complete depending on implementation
      // This depends on whether race mode cancels other handlers or not
    });

    it('should handle first error in race mode', async () => {
      actionRegister.register('testRace', async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'success-result';
      });

      actionRegister.register('testRace', async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        throw new Error('Fast error');
      });

      actionRegister.register('testRace', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        throw new Error('Fastest error');
      });

      actionRegister.setActionExecutionMode('testRace', 'race');

      const result = await actionRegister.dispatchWithResult('testRace', { delay: 0 });

      // The fastest error should be the result
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error.message).toBe('Fastest error');
    });

    it('should handle abort in race mode', async () => {
      let abortCalled = false;

      actionRegister.register('testRace', async (payload, controller) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        controller.abort('Fast abort');
        abortCalled = true;
      });

      actionRegister.register('testRace', async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'slow-result';
      });

      actionRegister.setActionExecutionMode('testRace', 'race');

      const result = await actionRegister.dispatchWithResult('testRace', { delay: 0 });

      expect(abortCalled).toBe(true);
      expect(result.success).toBe(false);
      expect(result.aborted).toBe(true);
      expect(result.abortReason).toBe('Fast abort');
    });
  });

  describe('Execution Mode Management', () => {
    it('should set and get execution mode', () => {
      actionRegister.setActionExecutionMode('testSequential', 'parallel');
      const mode = actionRegister.getActionExecutionMode('testSequential');
      expect(mode).toBe('parallel');
    });

    it('should remove execution mode override', () => {
      actionRegister.setActionExecutionMode('testSequential', 'parallel');
      expect(actionRegister.getActionExecutionMode('testSequential')).toBe('parallel');

      actionRegister.removeActionExecutionMode('testSequential');
      expect(actionRegister.getActionExecutionMode('testSequential')).toBe('sequential'); // default
    });

    it('should use default execution mode when not specified', () => {
      const mode = actionRegister.getActionExecutionMode('testSequential');
      expect(mode).toBe('sequential');
    });

    it('should use registry default execution mode', () => {
      const parallelRegister = new ActionRegister<ExecutionModeTestActions>({
        registry: { defaultExecutionMode: 'parallel' }
      });

      const mode = parallelRegister.getActionExecutionMode('testParallel');
      expect(mode).toBe('parallel');
    });

    it('should override execution mode via dispatch options', async () => {
      const executed: string[] = [];

      actionRegister.register('testSequential', async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        executed.push('handler1');
      });

      actionRegister.register('testSequential', async () => {
        await new Promise(resolve => setTimeout(resolve, 30));
        executed.push('handler2');
      });

      actionRegister.register('testSequential', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        executed.push('handler3');
      });

      // Default is sequential, but override to parallel
      await actionRegister.dispatch('testSequential', { delay: 0 }, {
        executionMode: 'parallel'
      });

      // In parallel mode, fast handler completes first
      expect(executed).toEqual(['handler3', 'handler2', 'handler1']);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty handler list', async () => {
      const result = await actionRegister.dispatchWithResult('testSequential', { delay: 0 });
      
      expect(result.success).toBe(true);
      expect(result.execution.handlersExecuted).toBe(0);
      expect(result.results).toHaveLength(0);
    });

    it('should handle single handler in different modes', async () => {
      const handler = jest.fn(() => 'single-result');
      
      actionRegister.register('testSequential', handler);

      // Test sequential
      actionRegister.setActionExecutionMode('testSequential', 'sequential');
      await actionRegister.dispatch('testSequential', { delay: 0 });
      expect(handler).toHaveBeenCalledTimes(1);

      // Test parallel
      handler.mockClear();
      actionRegister.setActionExecutionMode('testSequential', 'parallel');
      await actionRegister.dispatch('testSequential', { delay: 0 });
      expect(handler).toHaveBeenCalledTimes(1);

      // Test race
      handler.mockClear();
      actionRegister.setActionExecutionMode('testSequential', 'race');
      await actionRegister.dispatch('testSequential', { delay: 0 });
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should handle mixed sync and async handlers', async () => {
      const executed: string[] = [];

      actionRegister.register('testParallel', () => {
        executed.push('sync-handler');
        return 'sync-result';
      });

      actionRegister.register('testParallel', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        executed.push('async-handler');
        return 'async-result';
      });

      actionRegister.setActionExecutionMode('testParallel', 'parallel');

      const result = await actionRegister.dispatchWithResult('testParallel', { delay: 0 }, {
        result: { collect: true }
      });

      expect(executed).toHaveLength(2);
      expect(executed).toContain('sync-handler');
      expect(executed).toContain('async-handler');
      expect(result.results).toContain('sync-result');
      expect(result.results).toContain('async-result');
    });
  });
});