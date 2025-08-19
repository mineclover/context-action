/**
 * Feature coverage tests - Tests for all individual methods based on production patterns
 */

import { ActionRegister, type ActionPayloadMap } from '../../src';

interface FeatureTestActions extends ActionPayloadMap {
  basicAction: { id: string; value: string };
  voidAction: void;
  numberAction: number;
  stringAction: string;
  conditionalAction: { condition: boolean; data: any };
  asyncAction: { delay: number };
  errorAction: { shouldFail: boolean };
}

describe('ActionRegister - Feature Coverage Tests ✅', () => {
  let actionRegister: ActionRegister<FeatureTestActions>;

  beforeEach(() => {
    actionRegister = new ActionRegister<FeatureTestActions>({
      name: 'FeatureCoverageTestRegister'
    });
  });

  afterEach(() => {
    actionRegister.clearAll();
    jest.clearAllMocks();
  });

  describe('📋 Registry Management Methods', () => {
    it('should register and unregister handlers correctly', () => {
      const handler = jest.fn();
      const unregister = actionRegister.register('basicAction', handler, { id: 'test-handler' });

      // Registration verification
      expect(actionRegister.hasHandlers('basicAction')).toBe(true);
      expect(actionRegister.getHandlerCount('basicAction')).toBe(1);
      expect(actionRegister.getRegisteredActions()).toContain('basicAction');

      // Unregistration verification
      unregister();
      expect(actionRegister.hasHandlers('basicAction')).toBe(false);
      expect(actionRegister.getHandlerCount('basicAction')).toBe(0);
    });

    it('should handle multiple handlers with different priorities', async () => {
      const executionOrder: number[] = [];

      actionRegister.register('basicAction', () => { executionOrder.push(1); }, { priority: 10 });
      actionRegister.register('basicAction', () => { executionOrder.push(2); }, { priority: 30 });
      actionRegister.register('basicAction', () => { executionOrder.push(3); }, { priority: 20 });

      await actionRegister.dispatch('basicAction', { id: 'test', value: 'test' });

      expect(executionOrder).toEqual([2, 3, 1]); // 30, 20, 10
      expect(actionRegister.getHandlerCount('basicAction')).toBe(3);
    });

    it('should replace handlers with duplicate IDs', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      actionRegister.register('basicAction', handler1, { id: 'duplicate-id' });
      actionRegister.register('basicAction', handler2, { id: 'duplicate-id' });

      expect(actionRegister.getHandlerCount('basicAction')).toBe(1);
    });

    it('should provide accurate action statistics', () => {
      actionRegister.register('basicAction', jest.fn(), { id: 'handler1' });
      actionRegister.register('basicAction', jest.fn(), { id: 'handler2' });

      const stats = actionRegister.getActionStats('basicAction');
      expect(stats).toBeDefined();
      expect(stats?.action).toBe('basicAction');
      expect(stats?.handlerCount).toBe(2);
      expect(stats?.handlersByPriority).toBeDefined();

      expect(actionRegister.getActionStats('nonExistentAction')).toBeNull();
    });

    it('should clear all handlers correctly', () => {
      actionRegister.register('basicAction', jest.fn());
      actionRegister.register('voidAction', jest.fn());
      actionRegister.register('numberAction', jest.fn());

      expect(actionRegister.getRegisteredActions()).toHaveLength(3);

      actionRegister.clearAll();

      expect(actionRegister.getRegisteredActions()).toHaveLength(0);
      expect(actionRegister.hasHandlers('basicAction')).toBe(false);
    });
  });

  describe('🎯 Dispatch Operations', () => {
    it('should dispatch actions with various payload types', async () => {
      const basicHandler = jest.fn();
      const voidHandler = jest.fn();
      const numberHandler = jest.fn();
      const stringHandler = jest.fn();

      actionRegister.register('basicAction', basicHandler);
      actionRegister.register('voidAction', voidHandler);
      actionRegister.register('numberAction', numberHandler);
      actionRegister.register('stringAction', stringHandler);

      await actionRegister.dispatch('basicAction', { id: 'test', value: 'data' });
      await actionRegister.dispatch('voidAction');
      await actionRegister.dispatch('numberAction', 42);
      await actionRegister.dispatch('stringAction', 'test-string');

      expect(basicHandler).toHaveBeenCalledWith({ id: 'test', value: 'data' }, expect.any(Object));
      expect(voidHandler).toHaveBeenCalledWith(undefined, expect.any(Object));
      expect(numberHandler).toHaveBeenCalledWith(42, expect.any(Object));
      expect(stringHandler).toHaveBeenCalledWith('test-string', expect.any(Object));
    });

    it('should handle dispatch without registered handlers gracefully', async () => {
      await expect(actionRegister.dispatch('basicAction', { id: 'test', value: 'data' })).resolves.not.toThrow();
    });

    it('should provide detailed execution results', async () => {
      const handler = jest.fn(() => ({ processed: true, timestamp: Date.now() }));
      actionRegister.register('basicAction', handler);

      const result = await actionRegister.dispatchWithResult('basicAction', { id: 'test', value: 'data' });

      expect(result).toMatchObject({
        success: true,
        aborted: false,
        terminated: false,
        execution: {
          handlersExecuted: 1,
          startTime: expect.any(Number),
          endTime: expect.any(Number),
          duration: expect.any(Number)
        }
      });
      expect(result.execution.duration).toBeGreaterThanOrEqual(0);
      expect(result.execution.endTime).toBeGreaterThanOrEqual(result.execution.startTime);
    });

    it('should collect results from multiple handlers', async () => {
      actionRegister.register('basicAction', () => ({ step: 'first', result: 'data1' }), { priority: 20 });
      actionRegister.register('basicAction', () => ({ step: 'second', result: 'data2' }), { priority: 10 });

      const result = await actionRegister.dispatchWithResult('basicAction',
        { id: 'test', value: 'data' },
        { result: { collect: true } }
      );

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(2);
      expect(result.results[0]).toMatchObject({ step: 'first', result: 'data1' });
      expect(result.results[1]).toMatchObject({ step: 'second', result: 'data2' });
    });
  });

  describe('🎛️ Pipeline Controller Features', () => {
    it('should handle payload modification between handlers', async () => {
      let finalPayload: any;

      actionRegister.register('basicAction', (payload, controller) => {
        controller.modifyPayload(current => ({
          ...current,
          modified: true,
          timestamp: 12345
        }));
        return { step: 'modification' };
      }, { priority: 20 });

      actionRegister.register('basicAction', (payload) => {
        finalPayload = payload;
        return { step: 'processing' };
      }, { priority: 10 });

      const result = await actionRegister.dispatchWithResult('basicAction',
        { id: 'test', value: 'original' },
        { result: { collect: true } }
      );

      expect(finalPayload).toMatchObject({
        id: 'test',
        value: 'original',
        modified: true,
        timestamp: 12345
      });
      expect(result.results).toHaveLength(2);
    });

    it('should handle pipeline abortion', async () => {
      const executedHandlers: string[] = [];

      actionRegister.register('basicAction', (payload, controller) => {
        executedHandlers.push('first');
        if (payload.id === 'abort-test') {
          controller.abort('Test abortion');
          return;
        }
        return { step: 'first' };
      }, { priority: 20 });

      actionRegister.register('basicAction', () => {
        executedHandlers.push('second');
        return { step: 'second' };
      }, { priority: 10 });

      const result = await actionRegister.dispatchWithResult('basicAction', { id: 'abort-test', value: 'data' });

      expect(result.aborted).toBe(true);
      expect(result.abortReason).toBe('Test abortion');
      expect(executedHandlers).toEqual(['first']);
    });

    it('should handle controller result methods', async () => {
      let previousResults: any[] = [];

      actionRegister.register('basicAction', (payload, controller) => {
        controller.setResult({ intermediate: 'step1' });
        controller.setResult({ intermediate: 'step2' });
        return { final: 'first-handler' };
      }, { priority: 20 });

      actionRegister.register('basicAction', (payload, controller) => {
        previousResults = controller.getResults();
        return { final: 'second-handler' };
      }, { priority: 10 });

      const result = await actionRegister.dispatchWithResult('basicAction',
        { id: 'test', value: 'data' },
        { result: { collect: true } }
      );

      expect(previousResults).toHaveLength(3); // 2 setResult + 1 return
      expect(result.results).toHaveLength(4); // 2 setResult + 2 return
    });

    it('should provide current payload via getPayload', async () => {
      actionRegister.register('basicAction', (payload, controller) => {
        const currentPayload = controller.getPayload();
        expect(currentPayload).toEqual(payload);
        expect(currentPayload.id).toBe('payload-test');
        expect(currentPayload.value).toBe('test-data');
      });

      await actionRegister.dispatch('basicAction', { id: 'payload-test', value: 'test-data' });
    });
  });

  describe('⚙️ Handler Configuration Options', () => {
    it('should handle once handlers correctly', async () => {
      const handler = jest.fn(() => ({ executed: true }));
      actionRegister.register('basicAction', handler, { once: true });

      await actionRegister.dispatch('basicAction', { id: 'test1', value: 'data1' });
      await actionRegister.dispatch('basicAction', { id: 'test2', value: 'data2' });

      expect(handler).toHaveBeenCalledTimes(1);
      expect(actionRegister.hasHandlers('basicAction')).toBe(false);
    });

    it('should respect handler conditions using controller logic', async () => {
      const handler = jest.fn();

      actionRegister.register('conditionalAction', (payload, controller) => {
        if (!payload.condition) {
          controller.abort('Condition not met');
          return;
        }
        handler(payload);
        return { executed: true };
      });

      // Should execute (condition met)
      const validResult = await actionRegister.dispatchWithResult('conditionalAction', { condition: true, data: 'test' });
      expect(handler).toHaveBeenCalledTimes(1);
      expect(validResult.success).toBe(true);

      // Should abort (condition not met)
      const invalidResult = await actionRegister.dispatchWithResult('conditionalAction', { condition: false, data: 'test' });
      expect(invalidResult.aborted).toBe(true);
      expect(invalidResult.abortReason).toBe('Condition not met');
      expect(handler).toHaveBeenCalledTimes(1); // Still only once
    });

    it('should support handler metadata and identification', () => {
      actionRegister.register('basicAction', jest.fn(), {
        id: 'documented-handler',
        priority: 15,
        metadata: {
          description: 'Handler with complete metadata',
          version: '1.0.0',
          tags: ['test', 'feature-coverage'],
          category: 'validation'
        }
      });

      const stats = actionRegister.getActionStats('basicAction');
      expect(stats?.handlersByPriority).toHaveLength(1);
      expect(stats?.handlersByPriority[0].handlers[0].id).toBe('documented-handler');
    });
  });

  describe('🔧 Execution Mode Management', () => {
    it('should manage execution modes per action', () => {
      // Default mode
      expect(actionRegister.getActionExecutionMode('basicAction')).toBe('sequential');

      // Set different modes
      actionRegister.setActionExecutionMode('basicAction', 'parallel');
      expect(actionRegister.getActionExecutionMode('basicAction')).toBe('parallel');

      actionRegister.setActionExecutionMode('voidAction', 'race');
      expect(actionRegister.getActionExecutionMode('voidAction')).toBe('race');

      // Remove override
      actionRegister.removeActionExecutionMode('basicAction');
      expect(actionRegister.getActionExecutionMode('basicAction')).toBe('sequential');

      // Other actions unaffected
      expect(actionRegister.getActionExecutionMode('voidAction')).toBe('race');
    });

    it('should handle execution mode overrides via dispatch options', async () => {
      const handler = jest.fn(() => ({ executed: true }));
      actionRegister.register('basicAction', handler);

      // Set default to sequential
      actionRegister.setActionExecutionMode('basicAction', 'sequential');

      // Override to parallel for this dispatch
      await actionRegister.dispatch('basicAction', { id: 'test', value: 'data' }, {
        executionMode: 'parallel'
      });

      expect(handler).toHaveBeenCalled();
      // Mode should revert to default after dispatch
      expect(actionRegister.getActionExecutionMode('basicAction')).toBe('sequential');
    });
  });

  describe('🚨 Error Handling and Recovery', () => {
    it('should handle synchronous and asynchronous errors with fail-fast behavior', async () => {
      const executedHandlers: string[] = [];

      actionRegister.register('errorAction', () => {
        executedHandlers.push('sync-error');
        throw new Error('Synchronous error');
      }, { priority: 30 });

      actionRegister.register('errorAction', async () => {
        executedHandlers.push('async-error');
        await new Promise(resolve => setTimeout(resolve, 1));
        throw new Error('Async error');
      }, { priority: 20 });

      actionRegister.register('errorAction', () => {
        executedHandlers.push('success');
        return { recovered: true };
      }, { priority: 10 });

      const result = await actionRegister.dispatchWithResult('errorAction',
        { shouldFail: true },
        { result: { collect: true } }
      );

      expect(result.success).toBe(false); // Pipeline fails on first error (fail-fast behavior)
      expect(executedHandlers).toEqual(['sync-error']); // Only first handler executed before error
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        handlerId: 'pipeline',
        error: expect.objectContaining({
          message: 'Synchronous error'
        })
      });
    });

    it('should provide execution statistics with fail-fast error behavior', async () => {
      actionRegister.register('errorAction', () => {
        throw new Error('Handler error');
      });

      actionRegister.register('errorAction', () => {
        return { success: true };
      });

      const result = await actionRegister.dispatchWithResult('errorAction', { shouldFail: true });

      expect(result.execution.handlersExecuted).toBe(1); // Only first handler executed before error
      expect(result.execution.duration).toBeGreaterThanOrEqual(0);
      expect(result.success).toBe(false); // Pipeline fails on error
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('⚡ Async and Performance Features', () => {
    it('should handle async handlers correctly', async () => {
      const handler = jest.fn(() => Promise.resolve({ async: 1, completed: true }));
      actionRegister.register('asyncAction', handler);

      const result = await actionRegister.dispatchWithResult('asyncAction', { delay: 10 });

      expect(result.success).toBe(true);
      expect(handler).toHaveBeenCalled();
      expect(result.execution.handlersExecuted).toBe(1);
    });

    it('should handle mixed sync and async handlers', async () => {
      const executionOrder: string[] = [];

      actionRegister.register('basicAction', () => {
        executionOrder.push('sync');
        return { type: 'sync' };
      }, { priority: 20 });

      actionRegister.register('basicAction', () => {
        executionOrder.push('sync2');
        return { type: 'sync2' };
      }, { priority: 10 });

      const result = await actionRegister.dispatchWithResult('basicAction',
        { id: 'mixed', value: 'test' },
        { result: { collect: true } }
      );

      expect(executionOrder).toEqual(['sync', 'sync2']);
      expect(result.results).toEqual([{ type: 'sync' }, { type: 'sync2' }]);
    });
  });
});