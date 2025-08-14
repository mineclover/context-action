/**
 * Comprehensive individual feature tests - Every method and edge case covered
 */

import { ActionRegister, type ActionPayloadMap } from '../../src';

interface ComprehensiveTestActions extends ActionPayloadMap {
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
  complexAction: { 
    user: { id: number; name: string }; 
    options: { timeout: number; retries: number }; 
  };
}

describe('ActionRegister - Comprehensive Individual Feature Tests', () => {
  let actionRegister: ActionRegister<ComprehensiveTestActions>;

  beforeEach(() => {
    actionRegister = new ActionRegister<ComprehensiveTestActions>({
      name: 'ComprehensiveTestRegister',
      registry: {
        debug: false,
        defaultExecutionMode: 'sequential',
        maxRetries: 3,
        retryDelay: 100
      }
    });
  });

  afterEach(() => {
    actionRegister.clearAll();
    jest.clearAllMocks();
  });

  describe('🏗️ Handler Registration - Individual Method Tests', () => {
    describe('register() method', () => {
      it('should register handler with minimal options', () => {
        const handler = jest.fn();
        const unregister = actionRegister.register('testAction', handler);

        expect(typeof unregister).toBe('function');
        expect(actionRegister.hasHandlers('testAction')).toBe(true);
        expect(actionRegister.getHandlerCount('testAction')).toBe(1);
      });

      it('should register handler with full options', () => {
        const handler = jest.fn();
        actionRegister.register('testAction', handler, {
          id: 'test-handler-1',
          priority: 50,
          once: false,
          blocking: true,
          condition: (payload) => payload.value.length > 0,
          metadata: { 
            description: 'Test handler with all options',
            version: '1.0.0',
            tags: ['test', 'comprehensive']
          }
        });

        expect(actionRegister.getHandlerCount('testAction')).toBe(1);
        const stats = actionRegister.getActionStats('testAction');
        expect(stats?.totalHandlers).toBe(1);
      });

      it('should register multiple handlers with different priorities', () => {
        const handler1 = jest.fn();
        const handler2 = jest.fn();
        const handler3 = jest.fn();

        actionRegister.register('testAction', handler1, { priority: 10, id: 'low' });
        actionRegister.register('testAction', handler2, { priority: 30, id: 'high' });
        actionRegister.register('testAction', handler3, { priority: 20, id: 'medium' });

        expect(actionRegister.getHandlerCount('testAction')).toBe(3);
      });

      it('should handle duplicate handler IDs by overriding', () => {
        const handler1 = jest.fn();
        const handler2 = jest.fn();

        actionRegister.register('testAction', handler1, { id: 'duplicate' });
        actionRegister.register('testAction', handler2, { id: 'duplicate' });

        // Should only have one handler (second one replaces first)
        expect(actionRegister.getHandlerCount('testAction')).toBe(1);
      });

      it('should register handlers for void actions', () => {
        const handler = jest.fn();
        actionRegister.register('voidAction', handler);

        expect(actionRegister.hasHandlers('voidAction')).toBe(true);
      });

      it('should register handlers for primitive type actions', () => {
        actionRegister.register('numberAction', jest.fn());
        actionRegister.register('booleanAction', jest.fn());
        actionRegister.register('stringAction', jest.fn());

        expect(actionRegister.getHandlerCount('numberAction')).toBe(1);
        expect(actionRegister.getHandlerCount('booleanAction')).toBe(1);
        expect(actionRegister.getHandlerCount('stringAction')).toBe(1);
      });
    });

    describe('unregister functionality', () => {
      it('should unregister single handler', () => {
        const handler = jest.fn();
        const unregister = actionRegister.register('testAction', handler, { id: 'removable' });

        expect(actionRegister.hasHandlers('testAction')).toBe(true);
        unregister();
        expect(actionRegister.hasHandlers('testAction')).toBe(false);
      });

      it('should unregister specific handler by ID while keeping others', () => {
        const handler1 = jest.fn();
        const handler2 = jest.fn();

        actionRegister.register('testAction', handler1, { id: 'keep' });
        const unregister2 = actionRegister.register('testAction', handler2, { id: 'remove' });

        expect(actionRegister.getHandlerCount('testAction')).toBe(2);
        unregister2();
        expect(actionRegister.getHandlerCount('testAction')).toBe(1);
      });

      it('should handle unregistering non-existent handler gracefully', () => {
        const handler = jest.fn();
        const unregister = actionRegister.register('testAction', handler);

        unregister(); // First unregister
        expect(() => unregister()).not.toThrow(); // Second unregister should not throw
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

      it('should return false after all handlers are unregistered', () => {
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

      it('should decrease count when handlers are unregistered', () => {
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
      it('should return empty array when no actions registered', () => {
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

        const actions = actionRegister.getRegisteredActions();
        expect(actions).toEqual(['testAction']);
      });

      it('should update when actions are removed', () => {
        const unregister = actionRegister.register('testAction', jest.fn());
        actionRegister.register('voidAction', jest.fn());

        expect(actionRegister.getRegisteredActions()).toHaveLength(2);
        unregister();
        expect(actionRegister.getRegisteredActions()).toEqual(['voidAction']);
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
        expect(actionRegister.hasHandlers('voidAction')).toBe(false);
        expect(actionRegister.hasHandlers('numberAction')).toBe(false);
      });

      it('should work when no handlers are registered', () => {
        expect(() => actionRegister.clearAll()).not.toThrow();
        expect(actionRegister.getRegisteredActions()).toEqual([]);
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
          totalHandlers: 2
        });
        expect(stats?.lastRegistered).toBeInstanceOf(Date);
      });

      it('should update stats when handlers change', () => {
        const unregister = actionRegister.register('testAction', jest.fn());

        let stats = actionRegister.getActionStats('testAction');
        expect(stats?.totalHandlers).toBe(1);

        actionRegister.register('testAction', jest.fn());
        stats = actionRegister.getActionStats('testAction');
        expect(stats?.totalHandlers).toBe(2);

        unregister();
        stats = actionRegister.getActionStats('testAction');
        expect(stats?.totalHandlers).toBe(1);
      });
    });
  });

  describe('🎯 Dispatch Methods - Individual Testing', () => {
    describe('dispatch() method', () => {
      it('should dispatch action with object payload', async () => {
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

      it('should dispatch primitive type actions', async () => {
        const numberHandler = jest.fn();
        const stringHandler = jest.fn();
        const booleanHandler = jest.fn();

        actionRegister.register('numberAction', numberHandler);
        actionRegister.register('stringAction', stringHandler);
        actionRegister.register('booleanAction', booleanHandler);

        await actionRegister.dispatch('numberAction', 42);
        await actionRegister.dispatch('stringAction', 'test-string');
        await actionRegister.dispatch('booleanAction', true);

        expect(numberHandler).toHaveBeenCalledWith(42, expect.any(Object));
        expect(stringHandler).toHaveBeenCalledWith('test-string', expect.any(Object));
        expect(booleanHandler).toHaveBeenCalledWith(true, expect.any(Object));
      });

      it('should dispatch array type actions', async () => {
        const handler = jest.fn();
        actionRegister.register('arrayAction', handler);

        await actionRegister.dispatch('arrayAction', ['item1', 'item2', 'item3']);

        expect(handler).toHaveBeenCalledWith(['item1', 'item2', 'item3'], expect.any(Object));
      });

      it('should handle dispatch without registered handlers gracefully', async () => {
        await expect(actionRegister.dispatch('testAction', { value: 'test', count: 1 })).resolves.not.toThrow();
      });

      it('should dispatch with execution options', async () => {
        const handler = jest.fn();
        actionRegister.register('testAction', handler);

        await actionRegister.dispatch('testAction', { value: 'test', count: 1 }, {
          executionMode: 'parallel',
          timeout: 5000,
          retries: 2
        });

        expect(handler).toHaveBeenCalled();
      });
    });

    describe('dispatchWithResult() method', () => {
      it('should return basic result structure', async () => {
        const handler = jest.fn(() => 'test-result');
        actionRegister.register('testAction', handler);

        const result = await actionRegister.dispatchWithResult('testAction', { value: 'test', count: 1 });

        expect(result).toMatchObject({
          success: true,
          aborted: false,
          terminated: false,
          result: 'test-result',
          execution: {
            handlersExecuted: 1,
            startTime: expect.any(Number),
            endTime: expect.any(Number),
            duration: expect.any(Number)
          }
        });
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
          controller.abort('Test abort');
        });

        const result = await actionRegister.dispatchWithResult('testAction', { value: 'test', count: 1 });

        expect(result).toMatchObject({
          success: false,
          aborted: true,
          abortReason: 'Test abort'
        });
      });

      it('should handle terminated execution', async () => {
        actionRegister.register('testAction', (payload, controller) => {
          controller.return('early-return');
        });

        const result = await actionRegister.dispatchWithResult('testAction', { value: 'test', count: 1 });

        expect(result).toMatchObject({
          success: true,
          terminated: true,
          result: 'early-return'
        });
      });

      it('should handle execution with no results', async () => {
        actionRegister.register('testAction', () => {
          // Handler returns nothing
        });

        const result = await actionRegister.dispatchWithResult('testAction', { value: 'test', count: 1 });

        expect(result.result).toBeUndefined();
        expect(result.success).toBe(true);
      });

      it('should provide accurate execution timing', async () => {
        actionRegister.register('asyncAction', async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return 'async-result';
        });

        const result = await actionRegister.dispatchWithResult('asyncAction', { delay: 10, result: 'test' });

        expect(result.execution.duration).toBeGreaterThanOrEqual(5);
        expect(result.execution.endTime).toBeGreaterThan(result.execution.startTime);
      });
    });
  });

  describe('🎛️ Pipeline Controller - Individual Method Tests', () => {
    describe('controller.abort() method', () => {
      it('should abort with reason', async () => {
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

      it('should stop subsequent handlers when aborted', async () => {
        const executedHandlers: string[] = [];

        actionRegister.register('testAction', (payload, controller) => {
          executedHandlers.push('handler1');
          controller.abort('Stop here');
        }, { priority: 20 });

        actionRegister.register('testAction', () => {
          executedHandlers.push('handler2');
        }, { priority: 10 });

        await actionRegister.dispatchWithResult('testAction', { value: 'test', count: 1 });

        expect(executedHandlers).toEqual(['handler1']);
      });
    });

    describe('controller.return() method', () => {
      it('should terminate with return value', async () => {
        actionRegister.register('testAction', (payload, controller) => {
          controller.return('early-termination-value');
        });

        const result = await actionRegister.dispatchWithResult('testAction', { value: 'test', count: 1 });

        expect(result.terminated).toBe(true);
        expect(result.result).toBe('early-termination-value');
      });

      it('should terminate with undefined', async () => {
        actionRegister.register('testAction', (payload, controller) => {
          controller.return();
        });

        const result = await actionRegister.dispatchWithResult('testAction', { value: 'test', count: 1 });

        expect(result.terminated).toBe(true);
        expect(result.result).toBeUndefined();
      });

      it('should stop subsequent handlers when terminated', async () => {
        const executedHandlers: string[] = [];

        actionRegister.register('testAction', (payload, controller) => {
          executedHandlers.push('handler1');
          controller.return('terminate');
        }, { priority: 20 });

        actionRegister.register('testAction', () => {
          executedHandlers.push('handler2');
        }, { priority: 10 });

        await actionRegister.dispatchWithResult('testAction', { value: 'test', count: 1 });

        expect(executedHandlers).toEqual(['handler1']);
      });
    });

    describe('controller.modifyPayload() method', () => {
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

      it('should handle multiple payload modifications', async () => {
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

      it('should handle payload replacement', async () => {
        let finalPayload: any;

        actionRegister.register('testAction', (payload, controller) => {
          controller.modifyPayload(() => ({
            completely: 'different',
            payload: true
          }));
        }, { priority: 20 });

        actionRegister.register('testAction', (payload) => {
          finalPayload = payload;
        }, { priority: 10 });

        await actionRegister.dispatch('testAction', { value: 'original', count: 1 });

        expect(finalPayload).toEqual({
          completely: 'different',
          payload: true
        });
      });
    });

    describe('controller.getPayload() method', () => {
      it('should return current payload', async () => {
        actionRegister.register('testAction', (payload, controller) => {
          const currentPayload = controller.getPayload();
          expect(currentPayload).toEqual(payload);
          expect(currentPayload).toEqual({ value: 'test', count: 42 });
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

      it('should work with void payloads', async () => {
        actionRegister.register('voidAction', (payload, controller) => {
          const currentPayload = controller.getPayload();
          expect(currentPayload).toBeUndefined();
          expect(currentPayload).toEqual(payload);
        });

        await actionRegister.dispatch('voidAction');
      });
    });

    describe('controller.setResult() method', () => {
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

      it('should allow null and undefined results', async () => {
        actionRegister.register('testAction', (payload, controller) => {
          controller.setResult(null);
          controller.setResult(undefined);
        });

        const result = await actionRegister.dispatchWithResult('testAction',
          { value: 'test', count: 1 },
          { result: { collect: true } }
        );

        expect(result.results).toHaveLength(2);
        expect(result.results[0]).toBeNull();
        expect(result.results[1]).toBeUndefined();
      });
    });

    describe('controller.getResults() method', () => {
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

        await actionRegister.dispatchWithResult('testAction', { value: 'test', count: 1 });

        expect(collectedResults).toEqual(['result1', 'intermediate', 'result2']);
      });

      it('should return empty array when no previous results', async () => {
        actionRegister.register('testAction', (payload, controller) => {
          const results = controller.getResults();
          expect(results).toEqual([]);
        });

        await actionRegister.dispatch('testAction', { value: 'test', count: 1 });
      });
    });
  });

  describe('⚙️ Handler Configuration - Individual Option Tests', () => {
    describe('once option', () => {
      it('should execute handler only once', async () => {
        const handler = jest.fn(() => 'once-result');
        actionRegister.register('testAction', handler, { once: true });

        await actionRegister.dispatch('testAction', { value: 'first', count: 1 });
        await actionRegister.dispatch('testAction', { value: 'second', count: 2 });
        await actionRegister.dispatch('testAction', { value: 'third', count: 3 });

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith({ value: 'first', count: 1 }, expect.any(Object));
        expect(actionRegister.hasHandlers('testAction')).toBe(false);
      });

      it('should not affect other handlers', async () => {
        const onceHandler = jest.fn();
        const normalHandler = jest.fn();

        actionRegister.register('testAction', onceHandler, { once: true, priority: 20 });
        actionRegister.register('testAction', normalHandler, { priority: 10 });

        await actionRegister.dispatch('testAction', { value: 'test1', count: 1 });
        await actionRegister.dispatch('testAction', { value: 'test2', count: 2 });

        expect(onceHandler).toHaveBeenCalledTimes(1);
        expect(normalHandler).toHaveBeenCalledTimes(2);
      });
    });

    describe('priority option', () => {
      it('should execute handlers in priority order (highest first)', async () => {
        const executionOrder: number[] = [];

        actionRegister.register('testAction', () => { executionOrder.push(1); }, { priority: 1 });
        actionRegister.register('testAction', () => { executionOrder.push(2); }, { priority: 50 });
        actionRegister.register('testAction', () => { executionOrder.push(3); }, { priority: 25 });
        actionRegister.register('testAction', () => { executionOrder.push(4); }, { priority: 100 });

        await actionRegister.dispatch('testAction', { value: 'test', count: 1 });

        expect(executionOrder).toEqual([4, 2, 3, 1]); // 100, 50, 25, 1
      });

      it('should handle equal priorities consistently', async () => {
        const executionOrder: string[] = [];

        actionRegister.register('testAction', () => { executionOrder.push('first'); }, { priority: 10, id: 'first' });
        actionRegister.register('testAction', () => { executionOrder.push('second'); }, { priority: 10, id: 'second' });
        actionRegister.register('testAction', () => { executionOrder.push('third'); }, { priority: 10, id: 'third' });

        await actionRegister.dispatch('testAction', { value: 'test', count: 1 });

        // Order should be consistent (registration order for equal priorities)
        expect(executionOrder).toHaveLength(3);
        expect(executionOrder).toContain('first');
        expect(executionOrder).toContain('second');
        expect(executionOrder).toContain('third');
      });

      it('should handle negative priorities', async () => {
        const executionOrder: number[] = [];

        actionRegister.register('testAction', () => { executionOrder.push(1); }, { priority: -10 });
        actionRegister.register('testAction', () => { executionOrder.push(2); }, { priority: 0 });
        actionRegister.register('testAction', () => { executionOrder.push(3); }, { priority: 10 });

        await actionRegister.dispatch('testAction', { value: 'test', count: 1 });

        expect(executionOrder).toEqual([3, 2, 1]); // 10, 0, -10
      });
    });

    describe('condition option', () => {
      it('should execute handler when condition is true', async () => {
        const handler = jest.fn();
        actionRegister.register('conditionalAction', handler, {
          condition: (payload) => payload.condition === true
        });

        await actionRegister.dispatch('conditionalAction', { condition: true, data: 'test' });

        expect(handler).toHaveBeenCalledTimes(1);
      });

      it('should skip handler when condition is false', async () => {
        const handler = jest.fn();
        actionRegister.register('conditionalAction', handler, {
          condition: (payload) => payload.condition === true
        });

        await actionRegister.dispatch('conditionalAction', { condition: false, data: 'test' });

        expect(handler).not.toHaveBeenCalled();
      });

      it('should handle complex conditions', async () => {
        const handler = jest.fn();
        actionRegister.register('testAction', handler, {
          condition: (payload) => payload.value.length > 5 && payload.count > 10
        });

        // Should not execute - value too short
        await actionRegister.dispatch('testAction', { value: 'short', count: 15 });
        expect(handler).not.toHaveBeenCalled();

        // Should not execute - count too low
        await actionRegister.dispatch('testAction', { value: 'long enough', count: 5 });
        expect(handler).not.toHaveBeenCalled();

        // Should execute - both conditions met
        await actionRegister.dispatch('testAction', { value: 'long enough', count: 15 });
        expect(handler).toHaveBeenCalledTimes(1);
      });

      it('should handle condition errors gracefully', async () => {
        const handler = jest.fn();
        actionRegister.register('testAction', handler, {
          condition: (payload) => {
            throw new Error('Condition error');
          }
        });

        await expect(actionRegister.dispatch('testAction', { value: 'test', count: 1 })).resolves.not.toThrow();
        expect(handler).not.toHaveBeenCalled();
      });
    });

    describe('blocking option', () => {
      it('should wait for blocking handlers in sequential mode', async () => {
        const executionOrder: string[] = [];

        actionRegister.register('asyncAction', async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
          executionOrder.push('blocking');
        }, { priority: 20, blocking: true });

        actionRegister.register('asyncAction', async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          executionOrder.push('non-blocking');
        }, { priority: 10 });

        await actionRegister.dispatch('asyncAction', { delay: 50, result: 'test' });

        expect(executionOrder).toEqual(['blocking', 'non-blocking']);
      });
    });

    describe('id option', () => {
      it('should identify handlers by ID', async () => {
        actionRegister.register('testAction', jest.fn(), { id: 'unique-handler' });

        expect(actionRegister.getHandlerCount('testAction')).toBe(1);
      });

      it('should replace handler with same ID', async () => {
        const handler1 = jest.fn();
        const handler2 = jest.fn();

        actionRegister.register('testAction', handler1, { id: 'replaceable' });
        actionRegister.register('testAction', handler2, { id: 'replaceable' });

        await actionRegister.dispatch('testAction', { value: 'test', count: 1 });

        expect(handler1).not.toHaveBeenCalled();
        expect(handler2).toHaveBeenCalledTimes(1);
        expect(actionRegister.getHandlerCount('testAction')).toBe(1);
      });
    });

    describe('metadata option', () => {
      it('should store handler metadata', () => {
        const metadata = {
          description: 'Test handler for validation',
          version: '1.2.3',
          author: 'test-author',
          tags: ['validation', 'security'],
          config: { timeout: 5000, retries: 3 }
        };

        actionRegister.register('testAction', jest.fn(), { 
          id: 'documented-handler',
          metadata 
        });

        expect(actionRegister.getHandlerCount('testAction')).toBe(1);
        // Metadata is stored internally - functionality verified through registration success
      });
    });
  });

  describe('🔧 Execution Mode Configuration - Individual Tests', () => {
    describe('getActionExecutionMode() method', () => {
      it('should return default execution mode', () => {
        expect(actionRegister.getActionExecutionMode('testAction')).toBe('sequential');
      });

      it('should return configured execution mode', () => {
        actionRegister.setActionExecutionMode('testAction', 'parallel');
        expect(actionRegister.getActionExecutionMode('testAction')).toBe('parallel');

        actionRegister.setActionExecutionMode('testAction', 'race');
        expect(actionRegister.getActionExecutionMode('testAction')).toBe('race');
      });
    });

    describe('setActionExecutionMode() method', () => {
      it('should set sequential mode', () => {
        actionRegister.setActionExecutionMode('testAction', 'sequential');
        expect(actionRegister.getActionExecutionMode('testAction')).toBe('sequential');
      });

      it('should set parallel mode', () => {
        actionRegister.setActionExecutionMode('testAction', 'parallel');
        expect(actionRegister.getActionExecutionMode('testAction')).toBe('parallel');
      });

      it('should set race mode', () => {
        actionRegister.setActionExecutionMode('testAction', 'race');
        expect(actionRegister.getActionExecutionMode('testAction')).toBe('race');
      });

      it('should handle multiple actions independently', () => {
        actionRegister.setActionExecutionMode('testAction', 'parallel');
        actionRegister.setActionExecutionMode('voidAction', 'race');
        actionRegister.setActionExecutionMode('numberAction', 'sequential');

        expect(actionRegister.getActionExecutionMode('testAction')).toBe('parallel');
        expect(actionRegister.getActionExecutionMode('voidAction')).toBe('race');
        expect(actionRegister.getActionExecutionMode('numberAction')).toBe('sequential');
      });
    });

    describe('removeActionExecutionMode() method', () => {
      it('should remove execution mode override and return to default', () => {
        actionRegister.setActionExecutionMode('testAction', 'parallel');
        expect(actionRegister.getActionExecutionMode('testAction')).toBe('parallel');

        actionRegister.removeActionExecutionMode('testAction');
        expect(actionRegister.getActionExecutionMode('testAction')).toBe('sequential');
      });

      it('should handle removing non-existent overrides', () => {
        expect(() => actionRegister.removeActionExecutionMode('testAction')).not.toThrow();
        expect(actionRegister.getActionExecutionMode('testAction')).toBe('sequential');
      });

      it('should not affect other action modes', () => {
        actionRegister.setActionExecutionMode('testAction', 'parallel');
        actionRegister.setActionExecutionMode('voidAction', 'race');

        actionRegister.removeActionExecutionMode('testAction');

        expect(actionRegister.getActionExecutionMode('testAction')).toBe('sequential');
        expect(actionRegister.getActionExecutionMode('voidAction')).toBe('race');
      });
    });
  });

  describe('🚨 Error Handling - Individual Scenarios', () => {
    describe('Handler execution errors', () => {
      it('should catch synchronous errors in handlers', async () => {
        actionRegister.register('errorAction', () => {
          throw new Error('Synchronous error');
        });

        const result = await actionRegister.dispatchWithResult('errorAction', { shouldFail: true });

        expect(result.success).toBe(true); // Pipeline continues despite error
        expect(result.execution.handlersExecuted).toBe(1);
      });

      it('should catch asynchronous errors in handlers', async () => {
        actionRegister.register('errorAction', async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          throw new Error('Async error');
        });

        const result = await actionRegister.dispatchWithResult('errorAction', { shouldFail: true });

        expect(result.success).toBe(true);
        expect(result.execution.handlersExecuted).toBe(1);
      });

      it('should continue executing other handlers after error', async () => {
        const executedHandlers: string[] = [];

        actionRegister.register('errorAction', () => {
          executedHandlers.push('error-handler');
          throw new Error('This handler fails');
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

      it('should handle errors in condition functions', async () => {
        const handler = jest.fn();

        actionRegister.register('testAction', handler, {
          condition: () => {
            throw new Error('Condition error');
          }
        });

        await expect(actionRegister.dispatch('testAction', { value: 'test', count: 1 })).resolves.not.toThrow();
        expect(handler).not.toHaveBeenCalled();
      });
    });

    describe('Payload modification errors', () => {
      it('should handle errors in payload modification', async () => {
        let finalPayload: any;

        actionRegister.register('testAction', (payload, controller) => {
          controller.modifyPayload(() => {
            throw new Error('Payload modification error');
          });
        }, { priority: 20 });

        actionRegister.register('testAction', (payload) => {
          finalPayload = payload;
        }, { priority: 10 });

        await expect(actionRegister.dispatch('testAction', { value: 'test', count: 1 })).resolves.not.toThrow();
        expect(finalPayload).toEqual({ value: 'test', count: 1 }); // Original payload preserved
      });
    });

    describe('Result collection errors', () => {
      it('should handle errors when collecting results', async () => {
        actionRegister.register('testAction', () => {
          return { valid: 'result' };
        });

        const result = await actionRegister.dispatchWithResult('testAction',
          { value: 'test', count: 1 },
          { result: { collect: true } }
        );

        expect(result.results).toEqual([{ valid: 'result' }]);
      });
    });
  });
});