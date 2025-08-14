/**
 * Individual feature tests - Every method tested separately based on actual API
 */

import { ActionRegister, type ActionPayloadMap } from '../../src';

interface IndividualTestActions extends ActionPayloadMap {
  testAction: { value: string; count: number };
  voidAction: void;
  numberAction: number;
  booleanAction: boolean;
  objectAction: { data: any; metadata?: Record<string, any> };
  stringAction: string;
  arrayAction: string[];
  errorAction: { shouldFail: boolean };
  conditionalAction: { condition: boolean; data: any };
  priorityAction: { level: number };
  asyncAction: { delay: number; result: string };
}

describe('ActionRegister - Individual Method Tests', () => {
  let actionRegister: ActionRegister<IndividualTestActions>;

  beforeEach(() => {
    actionRegister = new ActionRegister<IndividualTestActions>({
      name: 'IndividualTestRegister',
      registry: {
        debug: false,
        defaultExecutionMode: 'sequential'
      }
    });
  });

  afterEach(() => {
    actionRegister.clearAll();
    jest.clearAllMocks();
  });

  describe('🏗️ Registration Methods', () => {
    describe('register() method', () => {
      it('should register handler with minimal configuration', () => {
        const handler = jest.fn();
        const unregister = actionRegister.register('testAction', handler);

        expect(typeof unregister).toBe('function');
        expect(actionRegister.hasHandlers('testAction')).toBe(true);
        expect(actionRegister.getHandlerCount('testAction')).toBe(1);
      });

      it('should register handler with full configuration', () => {
        const handler = jest.fn();
        
        actionRegister.register('testAction', handler, {
          id: 'full-config-handler',
          priority: 25,
          once: false,
          blocking: true,
          condition: (payload) => payload.value.length > 0,
          metadata: {
            description: 'Handler with full configuration',
            version: '1.0.0',
            tags: ['test', 'individual'],
            category: 'validation'
          }
        });

        expect(actionRegister.hasHandlers('testAction')).toBe(true);
        expect(actionRegister.getHandlerCount('testAction')).toBe(1);
      });

      it('should register multiple handlers with different priorities', () => {
        actionRegister.register('testAction', jest.fn(), { priority: 10 });
        actionRegister.register('testAction', jest.fn(), { priority: 30 });
        actionRegister.register('testAction', jest.fn(), { priority: 20 });

        expect(actionRegister.getHandlerCount('testAction')).toBe(3);
      });

      it('should replace handler with duplicate ID', () => {
        const handler1 = jest.fn();
        const handler2 = jest.fn();

        actionRegister.register('testAction', handler1, { id: 'duplicate-id' });
        actionRegister.register('testAction', handler2, { id: 'duplicate-id' });

        expect(actionRegister.getHandlerCount('testAction')).toBe(1);
      });

      it('should register handlers for different payload types', () => {
        actionRegister.register('voidAction', jest.fn());
        actionRegister.register('numberAction', jest.fn());
        actionRegister.register('booleanAction', jest.fn());
        actionRegister.register('stringAction', jest.fn());
        actionRegister.register('arrayAction', jest.fn());

        expect(actionRegister.hasHandlers('voidAction')).toBe(true);
        expect(actionRegister.hasHandlers('numberAction')).toBe(true);
        expect(actionRegister.hasHandlers('booleanAction')).toBe(true);
        expect(actionRegister.hasHandlers('stringAction')).toBe(true);
        expect(actionRegister.hasHandlers('arrayAction')).toBe(true);
      });
    });

    describe('hasHandlers() method', () => {
      it('should return false for unregistered actions', () => {
        expect(actionRegister.hasHandlers('testAction')).toBe(false);
      });

      it('should return true for registered actions', () => {
        actionRegister.register('testAction', jest.fn());
        expect(actionRegister.hasHandlers('testAction')).toBe(true);
      });

      it('should return false after all handlers unregistered', () => {
        const unregister = actionRegister.register('testAction', jest.fn());
        expect(actionRegister.hasHandlers('testAction')).toBe(true);
        
        unregister();
        expect(actionRegister.hasHandlers('testAction')).toBe(false);
      });
    });

    describe('getHandlerCount() method', () => {
      it('should return 0 for unregistered actions', () => {
        expect(actionRegister.getHandlerCount('testAction')).toBe(0);
      });

      it('should return correct count for multiple handlers', () => {
        actionRegister.register('testAction', jest.fn());
        expect(actionRegister.getHandlerCount('testAction')).toBe(1);

        actionRegister.register('testAction', jest.fn());
        expect(actionRegister.getHandlerCount('testAction')).toBe(2);

        actionRegister.register('testAction', jest.fn());
        expect(actionRegister.getHandlerCount('testAction')).toBe(3);
      });

      it('should decrease count when handlers unregistered', () => {
        const unregister1 = actionRegister.register('testAction', jest.fn());
        const unregister2 = actionRegister.register('testAction', jest.fn());

        expect(actionRegister.getHandlerCount('testAction')).toBe(2);
        unregister1();
        expect(actionRegister.getHandlerCount('testAction')).toBe(1);
        unregister2();
        expect(actionRegister.getHandlerCount('testAction')).toBe(0);
      });
    });

    describe('getRegisteredActions() method', () => {
      it('should return empty array for no registered actions', () => {
        expect(actionRegister.getRegisteredActions()).toEqual([]);
      });

      it('should return all registered action names', () => {
        actionRegister.register('testAction', jest.fn());
        actionRegister.register('voidAction', jest.fn());
        actionRegister.register('numberAction', jest.fn());

        const actions = actionRegister.getRegisteredActions();
        expect(actions).toHaveLength(3);
        expect(actions).toContain('testAction');
        expect(actions).toContain('voidAction');
        expect(actions).toContain('numberAction');
      });

      it('should not duplicate action names with multiple handlers', () => {
        actionRegister.register('testAction', jest.fn());
        actionRegister.register('testAction', jest.fn());
        actionRegister.register('testAction', jest.fn());

        expect(actionRegister.getRegisteredActions()).toEqual(['testAction']);
      });
    });

    describe('clearAll() method', () => {
      it('should clear all handlers and actions', () => {
        actionRegister.register('testAction', jest.fn());
        actionRegister.register('voidAction', jest.fn());
        actionRegister.register('numberAction', jest.fn());

        expect(actionRegister.getRegisteredActions()).toHaveLength(3);

        actionRegister.clearAll();

        expect(actionRegister.getRegisteredActions()).toHaveLength(0);
        expect(actionRegister.hasHandlers('testAction')).toBe(false);
      });

      it('should work when no handlers registered', () => {
        expect(() => actionRegister.clearAll()).not.toThrow();
      });
    });

    describe('getActionStats() method', () => {
      it('should return null for unregistered actions', () => {
        expect(actionRegister.getActionStats('testAction')).toBeNull();
      });

      it('should return correct stats for registered actions', () => {
        actionRegister.register('testAction', jest.fn(), { id: 'handler1' });
        actionRegister.register('testAction', jest.fn(), { id: 'handler2' });

        const stats = actionRegister.getActionStats('testAction');
        expect(stats).toMatchObject({
          action: 'testAction',
          handlerCount: 2
        });
        expect(stats?.handlersByPriority).toBeDefined();
      });
    });
  });

  describe('🎯 Dispatch Methods', () => {
    describe('dispatch() method', () => {
      it('should dispatch with object payload', async () => {
        const handler = jest.fn();
        actionRegister.register('testAction', handler);

        await actionRegister.dispatch('testAction', { value: 'test', count: 42 });

        expect(handler).toHaveBeenCalledWith(
          { value: 'test', count: 42 },
          expect.any(Object)
        );
      });

      it('should dispatch void actions', async () => {
        const handler = jest.fn();
        actionRegister.register('voidAction', handler);

        await actionRegister.dispatch('voidAction');

        expect(handler).toHaveBeenCalledWith(undefined, expect.any(Object));
      });

      it('should dispatch primitive types', async () => {
        const numberHandler = jest.fn();
        const stringHandler = jest.fn();
        const booleanHandler = jest.fn();
        const arrayHandler = jest.fn();

        actionRegister.register('numberAction', numberHandler);
        actionRegister.register('stringAction', stringHandler);
        actionRegister.register('booleanAction', booleanHandler);
        actionRegister.register('arrayAction', arrayHandler);

        await actionRegister.dispatch('numberAction', 42);
        await actionRegister.dispatch('stringAction', 'test');
        await actionRegister.dispatch('booleanAction', true);
        await actionRegister.dispatch('arrayAction', ['a', 'b']);

        expect(numberHandler).toHaveBeenCalledWith(42, expect.any(Object));
        expect(stringHandler).toHaveBeenCalledWith('test', expect.any(Object));
        expect(booleanHandler).toHaveBeenCalledWith(true, expect.any(Object));
        expect(arrayHandler).toHaveBeenCalledWith(['a', 'b'], expect.any(Object));
      });

      it('should handle dispatch without handlers gracefully', async () => {
        await expect(actionRegister.dispatch('testAction', { value: 'test', count: 1 })).resolves.not.toThrow();
      });

      it('should dispatch with execution options', async () => {
        const handler = jest.fn();
        actionRegister.register('testAction', handler);

        await actionRegister.dispatch('testAction', { value: 'test', count: 1 }, {
          executionMode: 'parallel',
          timeout: 5000
        });

        expect(handler).toHaveBeenCalled();
      });
    });

    describe('dispatchWithResult() method', () => {
      it('should return complete result structure', async () => {
        const handler = jest.fn(() => 'test-result');
        actionRegister.register('testAction', handler);

        const result = await actionRegister.dispatchWithResult('testAction', { value: 'test', count: 1 });

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
        expect(result.result).toBe('test-result');
      });

      it('should collect results when enabled', async () => {
        actionRegister.register('testAction', () => 'result1', { priority: 20 });
        actionRegister.register('testAction', () => 'result2', { priority: 10 });

        const result = await actionRegister.dispatchWithResult('testAction',
          { value: 'test', count: 1 },
          { result: { collect: true } }
        );

        expect(result.results).toEqual(['result1', 'result2']);
      });

      it('should handle aborted execution', async () => {
        actionRegister.register('testAction', (payload, controller) => {
          controller.abort('Test abort message');
        });

        const result = await actionRegister.dispatchWithResult('testAction', { value: 'test', count: 1 });

        expect(result).toMatchObject({
          success: false,
          aborted: true,
          abortReason: 'Test abort message'
        });
      });

      it('should handle terminated execution', async () => {
        actionRegister.register('testAction', (payload, controller) => {
          controller.return('early-return-value');
        });

        const result = await actionRegister.dispatchWithResult('testAction', { value: 'test', count: 1 });

        expect(result.success).toBe(true);
        expect(result.terminated).toBe(true);
        expect(result.result).toBe('early-return-value');
      });

      it('should provide accurate execution timing', async () => {
        actionRegister.register('asyncAction', async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return 'async-result';
        });

        const result = await actionRegister.dispatchWithResult('asyncAction', { delay: 10, result: 'test' });

        expect(result.execution.duration).toBeGreaterThanOrEqual(8);
        expect(result.execution.endTime).toBeGreaterThan(result.execution.startTime);
      });
    });
  });

  describe('🎛️ Controller Methods', () => {
    describe('controller.abort()', () => {
      it('should abort with custom reason', async () => {
        actionRegister.register('testAction', (payload, controller) => {
          controller.abort('Custom abort reason');
        });

        const result = await actionRegister.dispatchWithResult('testAction', { value: 'test', count: 1 });

        expect(result.aborted).toBe(true);
        expect(result.abortReason).toBe('Custom abort reason');
      });

      it('should abort without reason', async () => {
        actionRegister.register('testAction', (payload, controller) => {
          controller.abort();
        });

        const result = await actionRegister.dispatchWithResult('testAction', { value: 'test', count: 1 });

        expect(result.aborted).toBe(true);
        expect(result.abortReason).toBeUndefined();
      });

      it('should stop subsequent handlers', async () => {
        const executedHandlers: string[] = [];

        actionRegister.register('testAction', (payload, controller) => {
          executedHandlers.push('first');
          controller.abort('Stop execution');
        }, { priority: 20 });

        actionRegister.register('testAction', () => {
          executedHandlers.push('second');
        }, { priority: 10 });

        await actionRegister.dispatch('testAction', { value: 'test', count: 1 });

        expect(executedHandlers).toEqual(['first']);
      });
    });

    describe('controller.return()', () => {
      it('should terminate with return value', async () => {
        actionRegister.register('testAction', (payload, controller) => {
          controller.return('terminated-value');
        });

        const result = await actionRegister.dispatchWithResult('testAction', { value: 'test', count: 1 });

        expect(result.success).toBe(true);
        expect(result.terminated).toBe(true);
        expect(result.result).toBe('terminated-value');
      });

      it('should stop subsequent handlers', async () => {
        const executedHandlers: string[] = [];

        actionRegister.register('testAction', (payload, controller) => {
          executedHandlers.push('first');
          controller.return('early-return');
        }, { priority: 20 });

        actionRegister.register('testAction', () => {
          executedHandlers.push('second');
        }, { priority: 10 });

        await actionRegister.dispatch('testAction', { value: 'test', count: 1 });

        expect(executedHandlers).toEqual(['first']);
      });
    });

    describe('controller.modifyPayload()', () => {
      it('should modify payload for subsequent handlers', async () => {
        let finalPayload: any;

        actionRegister.register('testAction', (payload, controller) => {
          controller.modifyPayload(current => ({
            ...current,
            modified: true,
            timestamp: 12345
          }));
        }, { priority: 20 });

        actionRegister.register('testAction', (payload) => {
          finalPayload = payload;
        }, { priority: 10 });

        await actionRegister.dispatch('testAction', { value: 'original', count: 1 });

        expect(finalPayload).toMatchObject({
          value: 'original',
          count: 1,
          modified: true,
          timestamp: 12345
        });
      });

      it('should handle multiple modifications', async () => {
        let finalPayload: any;

        actionRegister.register('testAction', (payload, controller) => {
          controller.modifyPayload(current => ({ ...current, step1: true }));
        }, { priority: 30 });

        actionRegister.register('testAction', (payload, controller) => {
          controller.modifyPayload(current => ({ ...current, step2: true }));
        }, { priority: 20 });

        actionRegister.register('testAction', (payload) => {
          finalPayload = payload;
        }, { priority: 10 });

        await actionRegister.dispatch('testAction', { value: 'test', count: 1 });

        expect(finalPayload).toMatchObject({
          value: 'test',
          count: 1,
          step1: true,
          step2: true
        });
      });
    });

    describe('controller.getPayload()', () => {
      it('should return current payload', async () => {
        actionRegister.register('testAction', (payload, controller) => {
          const currentPayload = controller.getPayload();
          expect(currentPayload).toEqual(payload);
          expect(currentPayload.value).toBe('test');
          expect(currentPayload.count).toBe(42);
        });

        await actionRegister.dispatch('testAction', { value: 'test', count: 42 });
      });

      it('should return modified payload', async () => {
        actionRegister.register('testAction', (payload, controller) => {
          controller.modifyPayload(current => ({ ...current, modified: true }));
        }, { priority: 20 });

        actionRegister.register('testAction', (payload, controller) => {
          const currentPayload = controller.getPayload();
          expect(currentPayload).toMatchObject({
            value: 'test',
            count: 42,
            modified: true
          });
        }, { priority: 10 });

        await actionRegister.dispatch('testAction', { value: 'test', count: 42 });
      });
    });

    describe('controller.setResult()', () => {
      it('should set intermediate results', async () => {
        actionRegister.register('testAction', (payload, controller) => {
          controller.setResult({ intermediate: 'result1' });
          controller.setResult({ intermediate: 'result2' });
          return { final: 'result' };
        });

        const result = await actionRegister.dispatchWithResult('testAction',
          { value: 'test', count: 1 },
          { result: { collect: true } }
        );

        expect(result.results).toHaveLength(3);
        expect(result.results[0]).toEqual({ intermediate: 'result1' });
        expect(result.results[1]).toEqual({ intermediate: 'result2' });
        expect(result.results[2]).toEqual({ final: 'result' });
      });
    });

    describe('controller.getResults()', () => {
      it('should return results from previous handlers', async () => {
        let collectedResults: any[] = [];

        actionRegister.register('testAction', () => 'result1', { priority: 30 });

        actionRegister.register('testAction', (payload, controller) => {
          controller.setResult('intermediate');
          return 'result2';
        }, { priority: 20 });

        actionRegister.register('testAction', (payload, controller) => {
          collectedResults = controller.getResults();
          return 'result3';
        }, { priority: 10 });

        await actionRegister.dispatch('testAction', { value: 'test', count: 1 });

        expect(collectedResults).toEqual(['result1', 'intermediate', 'result2']);
      });
    });
  });

  describe('⚙️ Handler Configuration Options', () => {
    describe('once option', () => {
      it('should execute handler only once', async () => {
        const handler = jest.fn();
        actionRegister.register('testAction', handler, { once: true });

        await actionRegister.dispatch('testAction', { value: 'first', count: 1 });
        await actionRegister.dispatch('testAction', { value: 'second', count: 2 });

        expect(handler).toHaveBeenCalledTimes(1);
        expect(actionRegister.hasHandlers('testAction')).toBe(false);
      });
    });

    describe('priority option', () => {
      it('should execute in priority order (highest first)', async () => {
        const executionOrder: number[] = [];

        actionRegister.register('testAction', () => { executionOrder.push(1); }, { priority: 1 });
        actionRegister.register('testAction', () => { executionOrder.push(2); }, { priority: 50 });
        actionRegister.register('testAction', () => { executionOrder.push(3); }, { priority: 25 });

        await actionRegister.dispatch('testAction', { value: 'test', count: 1 });

        expect(executionOrder).toEqual([2, 3, 1]); // 50, 25, 1
      });
    });

    describe('condition option', () => {
      it('should execute when condition is true', async () => {
        const handler = jest.fn();
        actionRegister.register('conditionalAction', handler, {
          condition: (payload) => {
            if (!payload || typeof payload !== 'object') return false;
            return payload.condition === true;
          }
        });

        await actionRegister.dispatch('conditionalAction', { condition: true, data: 'test' });

        expect(handler).toHaveBeenCalledTimes(1);
      });

      it('should skip when condition is false', async () => {
        const handler = jest.fn();
        actionRegister.register('conditionalAction', handler, {
          condition: (payload) => {
            if (!payload || typeof payload !== 'object') return false;
            return payload.condition === true;
          }
        });

        await actionRegister.dispatch('conditionalAction', { condition: false, data: 'test' });

        expect(handler).not.toHaveBeenCalled();
      });
    });

    describe('blocking option', () => {
      it('should wait for blocking handlers in sequential mode', async () => {
        const executionOrder: string[] = [];

        actionRegister.register('asyncAction', async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          executionOrder.push('blocking');
        }, { priority: 20, blocking: true });

        actionRegister.register('asyncAction', () => {
          executionOrder.push('non-blocking');
        }, { priority: 10 });

        await actionRegister.dispatch('asyncAction', { delay: 10, result: 'test' });

        expect(executionOrder).toEqual(['blocking', 'non-blocking']);
      }, 15000);
    });
  });

  describe('🔧 Execution Mode Methods', () => {
    describe('getActionExecutionMode()', () => {
      it('should return default execution mode', () => {
        expect(actionRegister.getActionExecutionMode('testAction')).toBe('sequential');
      });

      it('should return configured mode', () => {
        actionRegister.setActionExecutionMode('testAction', 'parallel');
        expect(actionRegister.getActionExecutionMode('testAction')).toBe('parallel');
      });
    });

    describe('setActionExecutionMode()', () => {
      it('should set execution mode', () => {
        actionRegister.setActionExecutionMode('testAction', 'parallel');
        expect(actionRegister.getActionExecutionMode('testAction')).toBe('parallel');

        actionRegister.setActionExecutionMode('testAction', 'race');
        expect(actionRegister.getActionExecutionMode('testAction')).toBe('race');
      });
    });

    describe('removeActionExecutionMode()', () => {
      it('should remove override and return to default', () => {
        actionRegister.setActionExecutionMode('testAction', 'parallel');
        expect(actionRegister.getActionExecutionMode('testAction')).toBe('parallel');

        actionRegister.removeActionExecutionMode('testAction');
        expect(actionRegister.getActionExecutionMode('testAction')).toBe('sequential');
      });
    });
  });

  describe('🚨 Error Handling', () => {
    it('should handle synchronous errors', async () => {
      actionRegister.register('errorAction', () => {
        throw new Error('Sync error');
      });

      const result = await actionRegister.dispatchWithResult('errorAction', { shouldFail: true });

      expect(result.success).toBe(true); // Pipeline continues
      expect(result.execution.handlersExecuted).toBe(1);
    });

    it('should handle asynchronous errors', async () => {
      actionRegister.register('errorAction', async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
        throw new Error('Async error');
      });

      const result = await actionRegister.dispatchWithResult('errorAction', { shouldFail: true });

      expect(result.success).toBe(true);
      expect(result.execution.handlersExecuted).toBe(1);
    });

    it('should continue after handler errors', async () => {
      const executedHandlers: string[] = [];

      actionRegister.register('errorAction', () => {
        executedHandlers.push('error-handler');
        throw new Error('Handler fails');
      }, { priority: 20 });

      actionRegister.register('errorAction', () => {
        executedHandlers.push('success-handler');
        return 'success';
      }, { priority: 10 });

      const result = await actionRegister.dispatchWithResult('errorAction',
        { shouldFail: true },
        { result: { collect: true } }
      );

      expect(executedHandlers).toEqual(['error-handler', 'success-handler']);
      expect(result.results).toEqual(['success']);
    });
  });
});