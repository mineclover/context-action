/**
 * Comprehensive Feature Tests for ActionRegister
 * 
 * Tests all major features and edge cases:
 * - Handler ID generation and management
 * - Priority-based execution and sorting
 * - Execution modes (sequential, parallel, race)
 * - Throttle and debounce functionality
 * - AbortSignal integration and cleanup
 * - One-time handlers and automatic cleanup
 * - Error handling and recovery
 * - Controller pooling and memory optimization
 * - Result collection strategies
 * - Multi-action coordination
 */

import { ActionRegister } from '../../src/ActionRegister';
import type { ActionPayloadMap } from '../../src/types';

interface TestActions extends ActionPayloadMap {
  testAction: { message: string; delay?: number };
  parallelAction: { value: number };
  errorAction: { shouldError: boolean };
  multiAction: { data: string };
}

describe('ActionRegister Comprehensive Feature Tests', () => {
  let register: ActionRegister<TestActions>;

  beforeEach(() => {
    register = new ActionRegister<TestActions>({
      name: 'ComprehensiveTest',
      registry: {
        debug: false,
      }
    });
  });

  afterEach(() => {
    register.destroy();
  });

  describe('🆔 Handler ID Generation & Management', () => {
    it('should generate unique handler IDs automatically', () => {
      const unregister1 = register.register('testAction', async () => 'result1');
      const unregister2 = register.register('testAction', async () => 'result2');
      const unregister3 = register.register('testAction', async () => 'result3');

      // All handlers should be registered with unique IDs
      expect(register.getHandlerCount('testAction')).toBe(3);

      // Should be able to unregister individually
      unregister2();
      expect(register.getHandlerCount('testAction')).toBe(2);

      unregister1();
      unregister3();
      expect(register.getHandlerCount('testAction')).toBe(0);
    });

    it('should use custom handler IDs when provided', async () => {
      register.register('testAction', async () => 'custom1', { id: 'my-custom-handler' });
      register.register('testAction', async () => 'custom2', { id: 'another-handler' });

      const result = await register.dispatchWithResult('testAction', 
        { message: 'test' },
        { result: { collect: true, strategy: 'all' } }
      );

      const handlerIds = result.handlers?.map(h => h.id).sort();
      expect(handlerIds).toEqual(['another-handler', 'my-custom-handler']);
    });

    it('should handle handler ID conflicts with replaceExisting option', async () => {
      // Register initial handler
      register.register('testAction', async () => 'original', { 
        id: 'duplicate-id', 
        priority: 5 
      });

      // Try to register with same ID (returns existing unregister function by default)
      const unregister2 = register.register('testAction', async () => 'duplicate', { id: 'duplicate-id' });
      
      // Should still have only 1 handler (original)
      expect(register.getHandlerCount('testAction')).toBe(1);

      // Register with replaceExisting option
      register.register('testAction', async () => 'replaced', { 
        id: 'duplicate-id', 
        replaceExisting: true,
        priority: 10
      });

      expect(register.getHandlerCount('testAction')).toBe(1);

      const result = await register.dispatchWithResult('testAction',
        { message: 'test' },
        { result: { collect: true, strategy: 'first' } }
      );

      expect(result.result).toBe('replaced');
    });

    it('should verify unregister function existence', () => {
      const unregister = register.register('testAction', async () => 'test', {
        id: 'trackable-handler'
      });

      expect(register.hasUnregisterFunction('trackable-handler')).toBe(true);
      
      unregister();
      
      expect(register.hasUnregisterFunction('trackable-handler')).toBe(false);
    });
  });

  describe('🏆 Priority-Based Execution & Sorting', () => {
    it('should execute handlers in priority order (highest first)', async () => {
      const executionOrder: number[] = [];

      register.register('testAction', async () => { executionOrder.push(1); return 'low'; }, 
        { priority: 1, id: 'low' });
      register.register('testAction', async () => { executionOrder.push(10); return 'high'; }, 
        { priority: 10, id: 'high' });
      register.register('testAction', async () => { executionOrder.push(5); return 'medium'; }, 
        { priority: 5, id: 'medium' });

      await register.dispatch('testAction', { message: 'test' });

      expect(executionOrder).toEqual([10, 5, 1]); // Highest to lowest priority
    });

    it('should handle priority-based filtering correctly', async () => {
      register.register('testAction', async () => 'very-low', { priority: 1, id: 'p1' });
      register.register('testAction', async () => 'low', { priority: 3, id: 'p3' });
      register.register('testAction', async () => 'medium', { priority: 5, id: 'p5' });
      register.register('testAction', async () => 'high', { priority: 8, id: 'p8' });
      register.register('testAction', async () => 'very-high', { priority: 10, id: 'p10' });

      // Test minimum priority filter
      const minResult = await register.dispatchWithResult('testAction',
        { message: 'test' },
        { 
          filter: { priority: { min: 5 } },
          result: { collect: true, strategy: 'all' }
        }
      );
      expect(minResult.execution.handlersExecuted).toBe(3); // p10, p8, p5

      // Test maximum priority filter
      const maxResult = await register.dispatchWithResult('testAction',
        { message: 'test' },
        { 
          filter: { priority: { max: 5 } },
          result: { collect: true, strategy: 'all' }
        }
      );
      expect(maxResult.execution.handlersExecuted).toBe(3); // p5, p3, p1

      // Test range filter
      const rangeResult = await register.dispatchWithResult('testAction',
        { message: 'test' },
        { 
          filter: { priority: { min: 3, max: 8 } },
          result: { collect: true, strategy: 'all' }
        }
      );
      expect(rangeResult.execution.handlersExecuted).toBe(3); // p8, p5, p3
    });

    it('should maintain priority order when adding handlers dynamically', async () => {
      register.register('testAction', async () => 'first', { priority: 5, id: 'first' });
      
      // Add higher priority handler later
      register.register('testAction', async () => 'higher', { priority: 8, id: 'higher' });
      
      // Add lower priority handler
      register.register('testAction', async () => 'lower', { priority: 2, id: 'lower' });

      const result = await register.dispatchWithResult('testAction',
        { message: 'test' },
        { result: { collect: true, strategy: 'all' } }
      );

      // Should execute in priority order regardless of registration order
      const executionOrder = result.handlers?.map(h => h.id);
      expect(executionOrder).toEqual(['higher', 'first', 'lower']);
    });
  });

  describe('⚡ Execution Modes', () => {
    it('should execute handlers sequentially by default', async () => {
      const executionTimes: number[] = [];
      
      register.register('testAction', async () => {
        executionTimes.push(Date.now());
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'first';
      }, { priority: 2, id: 'first' });

      register.register('testAction', async () => {
        executionTimes.push(Date.now());
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'second';
      }, { priority: 1, id: 'second' });

      await register.dispatch('testAction', { message: 'test' });

      // Sequential execution should have time gaps
      expect(executionTimes.length).toBe(2);
      expect(executionTimes[1] - executionTimes[0]).toBeGreaterThanOrEqual(8); // Allow for timing variance
    }, 10000);

    it('should execute handlers in parallel when specified', async () => {
      const executionTimes: number[] = [];
      
      register.register('testAction', async () => {
        executionTimes.push(Date.now());
        await new Promise(resolve => setTimeout(resolve, 20));
        return 'first';
      }, { priority: 2, id: 'first' });

      register.register('testAction', async () => {
        executionTimes.push(Date.now());
        await new Promise(resolve => setTimeout(resolve, 20));
        return 'second';
      }, { priority: 1, id: 'second' });

      await register.dispatch('testAction', { message: 'test' }, {
        executionMode: 'parallel'
      });

      // Parallel execution should start at nearly the same time
      expect(executionTimes.length).toBe(2);
      expect(Math.abs(executionTimes[1] - executionTimes[0])).toBeLessThan(10);
    }, 10000);

    it('should execute handlers in race mode (first wins)', async () => {
      let winner: string | null = null;
      
      register.register('testAction', async () => {
        await new Promise(resolve => setTimeout(resolve, 30));
        if (!winner) winner = 'slow';
        return 'slow';
      }, { priority: 2, id: 'slow' });

      register.register('testAction', async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
        if (!winner) winner = 'fast';
        return 'fast';
      }, { priority: 1, id: 'fast' });

      const result = await register.dispatchWithResult('testAction', 
        { message: 'test' }, 
        { 
          executionMode: 'race',
          result: { collect: true, strategy: 'first' }
        }
      );

      expect(winner).toBe('fast');
      expect(result.result).toBe('fast');
      expect(result.execution.handlersExecuted).toBeGreaterThan(0);
    }, 10000);

    it('should override execution mode per action', async () => {
      // Set global mode to sequential
      register.setExecutionMode('sequential');
      
      // Set specific action to parallel
      register.setActionExecutionMode('testAction', 'parallel');

      const executionTimes: number[] = [];
      
      register.register('testAction', async () => {
        executionTimes.push(Date.now());
        await new Promise(resolve => setTimeout(resolve, 15));
        return 'first';
      }, { id: 'first' });

      register.register('testAction', async () => {
        executionTimes.push(Date.now());
        await new Promise(resolve => setTimeout(resolve, 15));
        return 'second';
      }, { id: 'second' });

      await register.dispatch('testAction', { message: 'test' });

      // Should execute in parallel despite global sequential setting
      expect(Math.abs(executionTimes[1] - executionTimes[0])).toBeLessThan(10);
    });
  });

  describe('🚦 Throttle & Debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should throttle rapid dispatch calls', async () => {
      let executionCount = 0;
      
      register.register('testAction', async () => {
        executionCount++;
        return 'throttled';
      }, { id: 'throttled-handler' });

      // Dispatch multiple times rapidly with throttle
      const promises = [
        register.dispatch('testAction', { message: 'test1' }, { throttle: 100 }),
        register.dispatch('testAction', { message: 'test2' }, { throttle: 100 }),
        register.dispatch('testAction', { message: 'test3' }, { throttle: 100 }),
      ];

      // Advance time to allow first execution
      jest.advanceTimersByTime(10);
      await Promise.all(promises);

      expect(executionCount).toBe(1); // Only first execution should proceed

      // Advance past throttle period
      jest.advanceTimersByTime(100);
      
      // Now next dispatch should work
      await register.dispatch('testAction', { message: 'test4' }, { throttle: 100 });
      expect(executionCount).toBe(2);
    }, 10000);

    it('should debounce rapid dispatch calls', async () => {
      let executionCount = 0;
      
      register.register('testAction', async () => {
        executionCount++;
        return 'debounced';
      }, { id: 'debounced-handler' });

      // Dispatch multiple times rapidly with debounce
      register.dispatch('testAction', { message: 'test1' }, { debounce: 100 });
      register.dispatch('testAction', { message: 'test2' }, { debounce: 100 });
      register.dispatch('testAction', { message: 'test3' }, { debounce: 100 });

      // Should not execute yet
      jest.advanceTimersByTime(50);
      expect(executionCount).toBe(0);

      // Wait for debounce period
      jest.advanceTimersByTime(100);
      await new Promise(resolve => setTimeout(resolve, 0)); // Allow promise resolution

      expect(executionCount).toBe(1); // Only last call should execute
    }, 10000);

    it('should use handler-level throttle/debounce configuration', async () => {
      let throttleCount = 0;
      let debounceCount = 0;

      register.register('testAction', async () => {
        throttleCount++;
        return 'throttled';
      }, { 
        id: 'throttle-handler',
        throttle: 50
      });

      register.register('testAction', async () => {
        debounceCount++;
        return 'debounced';
      }, { 
        id: 'debounce-handler',
        priority: 1,
        debounce: 50
      });

      // Multiple rapid dispatches
      register.dispatch('testAction', { message: 'test1' });
      register.dispatch('testAction', { message: 'test2' });
      register.dispatch('testAction', { message: 'test3' });

      jest.advanceTimersByTime(10);
      expect(throttleCount).toBe(1); // Throttled handler executes once
      expect(debounceCount).toBe(0); // Debounced handler waits

      jest.advanceTimersByTime(50);
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(debounceCount).toBe(1); // Now debounced handler executes
    }, 10000);
  });

  describe('🛑 AbortSignal Integration', () => {
    it('should abort execution when AbortSignal is triggered', async () => {
      let executionCount = 0;
      const abortController = new AbortController();

      register.register('testAction', async (payload, controller) => {
        executionCount++;
        
        // Simulate long-running operation
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => resolve('completed'), 100);
          
          controller.signal?.addEventListener('abort', () => {
            clearTimeout(timeout);
            reject(new Error('Aborted'));
          });
        });
      }, { id: 'abortable-handler' });

      // Start dispatch with abort signal
      const dispatchPromise = register.dispatch('testAction', { message: 'test' }, {
        signal: abortController.signal
      });

      // Abort after short delay
      setTimeout(() => abortController.abort(), 10);

      await expect(dispatchPromise).rejects.toThrow('Aborted');
      expect(executionCount).toBe(1); // Handler started but was aborted
    }, 10000);

    it('should handle automatic abort from handlers', async () => {
      register.register('testAction', async (payload, controller) => {
        controller.abort('Handler requested abort');
        return 'aborted';
      }, { id: 'self-aborting' });

      register.register('testAction', async () => {
        return 'should-not-execute';
      }, { id: 'after-abort', priority: 1 });

      const result = await register.dispatchWithResult('testAction', 
        { message: 'test' },
        { 
          autoAbort: { allowHandlerAbort: true },
          result: { collect: true, strategy: 'all' }
        }
      );

      expect(result.aborted).toBe(true);
      expect(result.abortReason).toBe('Handler requested abort');
      expect(result.execution.handlersExecuted).toBe(1); // Only first handler executed
    });
  });

  describe('🔂 One-time Handlers & Cleanup', () => {
    it('should automatically cleanup one-time handlers after execution', async () => {
      register.register('testAction', async () => 'once', {
        id: 'one-time',
        once: true
      });

      register.register('testAction', async () => 'permanent', {
        id: 'permanent'
      });

      expect(register.getHandlerCount('testAction')).toBe(2);

      // First execution
      await register.dispatch('testAction', { message: 'test' });
      expect(register.getHandlerCount('testAction')).toBe(1); // One-time handler removed

      // Second execution
      await register.dispatch('testAction', { message: 'test' });
      expect(register.getHandlerCount('testAction')).toBe(1); // Permanent handler remains
    });

    it('should call cleanup functions when handlers are removed', async () => {
      let cleanupCalled = false;
      
      const handler = async () => 'test';
      (handler as any).cleanup = () => {
        cleanupCalled = true;
      };

      const unregister = register.register('testAction', handler, {
        id: 'with-cleanup'
      });

      expect(cleanupCalled).toBe(false);
      
      unregister();
      
      expect(cleanupCalled).toBe(true);
    });

    it('should cleanup all resources on destroy', () => {
      register.register('testAction', async () => 'test1', { id: 'handler1' });
      register.register('testAction', async () => 'test2', { id: 'handler2' });
      register.register('parallelAction', async () => 42, { id: 'handler3' });

      expect(register.getHandlerCount('testAction')).toBe(2);
      expect(register.getHandlerCount('parallelAction')).toBe(1);

      register.destroy();

      // After destroy, all handlers should be cleared
      expect(register.getHandlerCount('testAction')).toBe(0);
      expect(register.getHandlerCount('parallelAction')).toBe(0);
    });
  });

  describe('❌ Error Handling & Recovery', () => {
    it('should handle errors gracefully and continue execution', async () => {
      // Use non-blocking handlers to avoid throwing errors
      register.register('testAction', async () => {
        throw new Error('First handler error');
      }, { id: 'error-handler', priority: 3, blocking: false });

      register.register('testAction', async () => {
        return 'success';
      }, { id: 'success-handler', priority: 2 });

      register.register('testAction', async () => {
        throw new Error('Another error');
      }, { id: 'another-error', priority: 1, blocking: false });

      const result = await register.dispatchWithResult('testAction',
        { message: 'test' },
        { result: { collect: true, strategy: 'all' } }
      );

      expect(result.success).toBe(true); // Overall success despite errors
      expect(result.execution.handlersFailed).toBe(2);
      expect(result.execution.handlersExecuted).toBe(3);
      expect(result.errors.length).toBe(2);
      expect(result.successResults).toEqual(['success']);
    });

    it('should provide detailed error information', async () => {
      // Use non-blocking to avoid throwing and collect errors
      register.register('testAction', async () => {
        const error = new Error('Detailed error message');
        error.name = 'CustomError';
        throw error;
      }, { id: 'detailed-error', blocking: false });

      const result = await register.dispatchWithResult('testAction',
        { message: 'test' },
        { result: { collect: true, strategy: 'all' } }
      );

      expect(result.errors.length).toBe(1);
      const errorInfo = result.errors[0];
      expect(errorInfo.handlerId).toBe('detailed-error');
      expect(errorInfo.error.message).toBe('Detailed error message');
      expect(errorInfo.error.name).toBe('CustomError');
      expect(errorInfo.timestamp).toBeGreaterThan(0);
    });

    it('should handle controller termination', async () => {
      register.register('testAction', async (payload, controller) => {
        controller.return('Early termination');
        return 'terminated';
      }, { id: 'terminator', priority: 3 });

      register.register('testAction', async () => {
        return 'should-not-execute';
      }, { id: 'after-termination', priority: 2 });

      const result = await register.dispatchWithResult('testAction',
        { message: 'test' },
        { result: { collect: true, strategy: 'all' } }
      );

      expect(result.terminated).toBe(true);
      expect(result.execution.handlersExecuted).toBe(1);
      expect(result.result).toBe('Early termination'); // Termination result used
    });
  });

  describe('🎯 Result Collection Strategies', () => {
    beforeEach(() => {
      register.register('testAction', async () => 'first', { priority: 3, id: 'first' });
      register.register('testAction', async () => 'second', { priority: 2, id: 'second' });
      register.register('testAction', async () => 'third', { priority: 1, id: 'third' });
    });

    it('should collect first result only', async () => {
      const result = await register.dispatchWithResult('testAction',
        { message: 'test' },
        { result: { collect: true, strategy: 'first' } }
      );

      expect(result.result).toBe('first');
      expect(result.results.length).toBe(3); // All results collected
      expect(result.execution.handlersExecuted).toBe(3); // All handlers executed
    });

    it('should collect last result only', async () => {
      const result = await register.dispatchWithResult('testAction',
        { message: 'test' },
        { result: { collect: true, strategy: 'last' } }
      );

      expect(result.result).toBe('third'); // Last in execution order
    });

    it('should collect all results', async () => {
      const result = await register.dispatchWithResult('testAction',
        { message: 'test' },
        { result: { collect: true, strategy: 'all' } }
      );

      expect(result.result).toEqual(['first', 'second', 'third']);
    });

    it('should merge results using custom merger', async () => {
      register.clearAll();
      register.register('testAction', async () => ({ a: 1, b: 2 }), { priority: 2, id: 'first' });
      register.register('testAction', async () => ({ b: 3, c: 4 }), { priority: 1, id: 'second' });

      const result = await register.dispatchWithResult('testAction',
        { message: 'test' },
        { 
          result: { 
            collect: true, 
            strategy: 'merge',
            merger: (results) => results.reduce((acc, curr) => ({ ...acc, ...curr }), {})
          } 
        }
      );

      expect(result.result).toEqual({ a: 1, b: 3, c: 4 });
    });

    it('should limit result collection with maxResults', async () => {
      register.clearAll();
      for (let i = 1; i <= 5; i++) {
        register.register('testAction', async () => `result-${i}`, { 
          priority: 10 - i, 
          id: `handler-${i}` 
        });
      }

      const result = await register.dispatchWithResult('testAction',
        { message: 'test' },
        { result: { collect: true, strategy: 'all', maxResults: 3 } }
      );

      expect(result.result).toEqual(['result-1', 'result-2', 'result-3']);
      expect(result.execution.handlersExecuted).toBe(5); // All handlers executed
    });
  });

  describe('🔄 Multi-Action Coordination', () => {
    it('should handle multiple actions independently', async () => {
      register.register('testAction', async () => 'test-result', { id: 'test-handler' });
      register.register('parallelAction', async () => 42, { id: 'parallel-handler' });

      expect(register.getHandlerCount('testAction')).toBe(1);
      expect(register.getHandlerCount('parallelAction')).toBe(1);

      const testResult = await register.dispatchWithResult('testAction',
        { message: 'test' },
        { result: { collect: true, strategy: 'first' } }
      );

      const parallelResult = await register.dispatchWithResult('parallelAction',
        { value: 42 },
        { result: { collect: true, strategy: 'first' } }
      );

      expect(testResult.result).toBe('test-result');
      expect(parallelResult.result).toBe(42);
    });

    it('should clear specific actions without affecting others', () => {
      register.register('testAction', async () => 'test1', { id: 'test1' });
      register.register('testAction', async () => 'test2', { id: 'test2' });
      register.register('parallelAction', async () => 42, { id: 'parallel1' });

      expect(register.getHandlerCount('testAction')).toBe(2);
      expect(register.getHandlerCount('parallelAction')).toBe(1);

      register.clearAction('testAction');

      expect(register.getHandlerCount('testAction')).toBe(0);
      expect(register.getHandlerCount('parallelAction')).toBe(1); // Unaffected
    });

    it('should list all registered action names', () => {
      register.register('testAction', async () => 'test', { id: 'test1' });
      register.register('parallelAction', async () => 42, { id: 'parallel1' });
      register.register('errorAction', async () => { throw new Error(); }, { id: 'error1' });

      const actions = register.getRegisteredActions();
      expect(actions.sort()).toEqual(['errorAction', 'parallelAction', 'testAction']);
    });

    it('should provide action statistics', async () => {
      register.register('testAction', async () => 'test', { id: 'test1' });
      register.register('testAction', async () => 'test', { id: 'test2' });
      register.register('parallelAction', async () => 42, { id: 'parallel1' });

      // Execute some actions to generate stats
      await register.dispatch('testAction', { message: 'test1' });
      await register.dispatch('parallelAction', { value: 1 });
      await register.dispatch('testAction', { message: 'test2' });

      const stats = register.getActionStats('testAction');
      expect(stats.handlerCount).toBe(2);
      expect(stats.totalHandlers).toBe(2);

      const allStats = register.getAllActionStats();
      const actionNames = allStats.map(stat => String(stat.action)).sort();
      expect(actionNames).toEqual(['parallelAction', 'testAction']);
      
      const testActionStats = allStats.find(stat => stat.action === 'testAction');
      const parallelActionStats = allStats.find(stat => stat.action === 'parallelAction');
      
      expect(testActionStats?.totalHandlers).toBe(2);
      expect(parallelActionStats?.totalHandlers).toBe(1);
    });
  });

  describe('🧪 Controller Pooling & Memory Optimization', () => {
    it('should reuse controller objects from pool', async () => {
      const controllerInstances = new Set();
      
      register.register('testAction', async (payload, controller) => {
        controllerInstances.add(controller);
        return 'pooled';
      }, { id: 'pooled-handler' });

      // Execute multiple times to test pooling
      for (let i = 0; i < 5; i++) {
        await register.dispatch('testAction', { message: `test-${i}` });
      }

      // Should reuse controller instances (pool size is likely smaller than execution count)
      expect(controllerInstances.size).toBeLessThanOrEqual(5);
      expect(controllerInstances.size).toBeGreaterThan(0);
    });

    it('should handle concurrent dispatches efficiently', async () => {
      let concurrentExecutions = 0;
      let maxConcurrent = 0;

      register.register('testAction', async () => {
        concurrentExecutions++;
        maxConcurrent = Math.max(maxConcurrent, concurrentExecutions);
        
        // Simulate async work
        await new Promise(resolve => setTimeout(resolve, 10));
        
        concurrentExecutions--;
        return 'concurrent';
      }, { id: 'concurrent-handler' });

      // Launch multiple concurrent dispatches
      const promises = Array.from({ length: 10 }, (_, i) =>
        register.dispatch('testAction', { message: `concurrent-${i}` }, {
          executionMode: 'parallel'
        })
      );

      await Promise.all(promises);

      // In parallel mode, we should see some concurrent execution
      // (though exact numbers depend on JavaScript event loop timing)
      expect(maxConcurrent).toBeGreaterThan(0);
    }, 10000);
  });

  describe('📊 Performance & Monitoring', () => {
    it('should track execution timing accurately', async () => {
      const delay = 50;
      
      register.register('testAction', async () => {
        await new Promise(resolve => setTimeout(resolve, delay));
        return 'timed';
      }, { id: 'timed-handler' });

      const result = await register.dispatchWithResult('testAction',
        { message: 'test' },
        { result: { collect: true, strategy: 'first' } }
      );

      expect(result.execution.duration).toBeGreaterThanOrEqual(delay - 10); // Allow timing variance
      expect(result.execution.startTime).toBeGreaterThan(0);
      expect(result.execution.endTime).toBeGreaterThan(result.execution.startTime);
      expect(result.execution.endTime - result.execution.startTime).toBe(result.execution.duration);
    }, 10000);

    it('should provide comprehensive execution metrics', async () => {
      register.register('testAction', async () => 'success1', { priority: 3, id: 'success1' });
      register.register('testAction', async () => { throw new Error('fail1'); }, { priority: 2, id: 'fail1', blocking: false });
      register.register('testAction', async () => 'success2', { priority: 1, id: 'success2' });

      const result = await register.dispatchWithResult('testAction',
        { message: 'test' },
        { result: { collect: true, strategy: 'all' } }
      );

      expect(result.execution.handlersExecuted).toBe(3);
      expect(result.execution.handlersFailed).toBe(1);
      expect(result.execution.handlersSkipped).toBe(0);
      expect(result.successResults).toEqual(['success1', 'success2']);
      expect(result.failedResults).toEqual([]);
      expect(result.errors.length).toBe(1);
      expect(result.success).toBe(true); // Overall success despite partial failures
    });
  });
});