/**
 * Practical working tests for ActionRegister that match the actual implementation
 */

import { ActionRegister, type ActionPayloadMap } from '../../src';

interface PracticalTestActions extends ActionPayloadMap {
  userAuth: { username: string; password: string };
  dataProcess: { data: any; options?: Record<string, any> };
  fileUpload: { filename: string; size: number };
  notification: { message: string; type: 'info' | 'warning' | 'error' };
  simpleAction: void;
}

describe('ActionRegister - Practical Tests', () => {
  let actionRegister: ActionRegister<PracticalTestActions>;

  beforeEach(() => {
    actionRegister = new ActionRegister<PracticalTestActions>({
      name: 'PracticalTestRegister'
    });
  });

  afterEach(() => {
    actionRegister.clearAll();
  });

  describe('Basic Functionality', () => {
    it('should register and dispatch actions correctly', async () => {
      const authHandler = jest.fn();
      const processHandler = jest.fn();

      actionRegister.register('userAuth', authHandler);
      actionRegister.register('dataProcess', processHandler);

      await actionRegister.dispatch('userAuth', { username: 'test', password: 'secret' });
      await actionRegister.dispatch('dataProcess', { data: { key: 'value' } });

      expect(authHandler).toHaveBeenCalledWith(
        { username: 'test', password: 'secret' },
        expect.any(Object)
      );
      expect(processHandler).toHaveBeenCalledWith(
        { data: { key: 'value' } },
        expect.any(Object)
      );
    });

    it('should handle handler registration and unregistration', () => {
      const handler = jest.fn();
      const unregister = actionRegister.register('simpleAction', handler);

      // Check that action is registered
      const registeredActions = actionRegister.getRegisteredActions();
      expect(registeredActions).toContain('simpleAction');
      expect(actionRegister.hasHandlers('simpleAction')).toBe(true);

      // Unregister and check
      unregister();
      expect(actionRegister.hasHandlers('simpleAction')).toBe(false);
    });

    it('should handle multiple handlers with priorities', async () => {
      const executionOrder: number[] = [];

      actionRegister.register('dataProcess', () => {
        executionOrder.push(1);
      }, { priority: 10 });

      actionRegister.register('dataProcess', () => {
        executionOrder.push(2);
      }, { priority: 20 });

      actionRegister.register('dataProcess', () => {
        executionOrder.push(3);
      }, { priority: 15 });

      await actionRegister.dispatch('dataProcess', { data: 'test' });

      // Should execute in priority order: 20, 15, 10
      expect(executionOrder).toEqual([2, 3, 1]);
    });
  });

  describe('Handler Configuration', () => {
    it('should handle once handlers', async () => {
      const handler = jest.fn(() => 'result');

      actionRegister.register('notification', handler, { once: true });

      await actionRegister.dispatch('notification', { message: 'First', type: 'info' });
      await actionRegister.dispatch('notification', { message: 'Second', type: 'info' });

      expect(handler).toHaveBeenCalledTimes(1);
      expect(actionRegister.hasHandlers('notification')).toBe(false);
    });

    it('should handle conditional handlers', async () => {
      const handler = jest.fn();

      actionRegister.register('fileUpload', handler, {
        condition: (payload) => payload.size < 1000000 // Only files under 1MB
      });

      // Should execute (under 1MB)
      await actionRegister.dispatch('fileUpload', { filename: 'small.txt', size: 500000 });
      expect(handler).toHaveBeenCalledTimes(1);

      // Should not execute (over 1MB)
      await actionRegister.dispatch('fileUpload', { filename: 'large.txt', size: 2000000 });
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should handle blocking handlers', async () => {
      let order: string[] = [];

      actionRegister.register('dataProcess', async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        order.push('blocking');
      }, { priority: 20, blocking: true });

      actionRegister.register('dataProcess', () => {
        order.push('non-blocking');
      }, { priority: 10 });

      await actionRegister.dispatch('dataProcess', { data: 'test' });

      expect(order).toEqual(['blocking', 'non-blocking']);
    });
  });

  describe('Pipeline Controller', () => {
    it('should handle payload modification', async () => {
      let finalPayload: any;

      actionRegister.register('dataProcess', (payload, controller) => {
        controller.modifyPayload(current => ({
          ...current,
          processed: true,
          timestamp: Date.now()
        }));
      }, { priority: 20 });

      actionRegister.register('dataProcess', (payload) => {
        finalPayload = payload;
      }, { priority: 10 });

      await actionRegister.dispatch('dataProcess', { data: 'original' });

      expect(finalPayload).toMatchObject({
        data: 'original',
        processed: true,
        timestamp: expect.any(Number)
      });
    });

    it('should handle pipeline abort', async () => {
      const executedHandlers: string[] = [];

      actionRegister.register('userAuth', (payload, controller) => {
        executedHandlers.push('validation');
        if (!payload.username) {
          controller.abort('Username required');
        }
      }, { priority: 30 });

      actionRegister.register('userAuth', () => {
        executedHandlers.push('authentication');
      }, { priority: 20 });

      actionRegister.register('userAuth', () => {
        executedHandlers.push('authorization');
      }, { priority: 10 });

      await actionRegister.dispatch('userAuth', { username: '', password: 'test' });

      expect(executedHandlers).toEqual(['validation']);
    });

    it('should get current payload', async () => {
      actionRegister.register('dataProcess', (payload, controller) => {
        const currentPayload = controller.getPayload();
        expect(currentPayload).toEqual(payload);
        expect(currentPayload.data).toBe('test-data');
      });

      await actionRegister.dispatch('dataProcess', { data: 'test-data' });
    });
  });

  describe('Result Collection', () => {
    it('should collect results from handlers', async () => {
      actionRegister.register('fileUpload', () => {
        return { step: 'validation', success: true };
      }, { priority: 20 });

      actionRegister.register('fileUpload', () => {
        return { step: 'upload', fileId: '12345' };
      }, { priority: 10 });

      const result = await actionRegister.dispatchWithResult('fileUpload', 
        { filename: 'test.txt', size: 1024 }, 
        { result: { collect: true } }
      );

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(2);
      expect(result.results).toContainEqual({ step: 'validation', success: true });
      expect(result.results).toContainEqual({ step: 'upload', fileId: '12345' });
    });

    it('should handle controller.setResult and getResults', async () => {
      actionRegister.register('dataProcess', (payload, controller) => {
        controller.setResult({ phase: 'preprocessing', status: 'complete' });
        return { phase: 'processing', data: payload.data };
      }, { priority: 20 });

      actionRegister.register('dataProcess', (payload, controller) => {
        const previousResults = controller.getResults();
        expect(previousResults).toHaveLength(1);
        expect(previousResults[0]).toEqual({ phase: 'processing', data: payload.data });
        
        return { phase: 'postprocessing', final: true };
      }, { priority: 10 });

      const result = await actionRegister.dispatchWithResult('dataProcess', 
        { data: 'test' }, 
        { result: { collect: true } }
      );

      expect(result.results).toHaveLength(2);
    });

    it('should handle early termination with controller.return', async () => {
      actionRegister.register('userAuth', (payload, controller) => {
        if (payload.username === 'admin') {
          controller.return({ success: true, role: 'administrator', fastTrack: true });
        }
      }, { priority: 30 });

      actionRegister.register('userAuth', () => {
        // This should not execute for admin user
        return { success: true, role: 'user' };
      }, { priority: 20 });

      const result = await actionRegister.dispatchWithResult('userAuth', 
        { username: 'admin', password: 'secret' }
      );

      expect(result.success).toBe(true);
      expect(result.terminated).toBe(true);
      expect(result.result).toEqual({ success: true, role: 'administrator', fastTrack: true });
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      actionRegister.register('dataProcess', () => {
        throw new Error('Processing failed');
      }, { priority: 20, id: 'processor' });

      actionRegister.register('dataProcess', () => {
        return { fallback: true };
      }, { priority: 10, id: 'fallback' });

      const result = await actionRegister.dispatchWithResult('dataProcess', 
        { data: 'test' }, 
        { result: { collect: true } }
      );

      expect(result.success).toBe(true);
      expect(result.results).toContainEqual({ fallback: true });
    });

    it('should provide execution statistics', async () => {
      const startTime = Date.now();

      actionRegister.register('notification', () => {
        return 'success';
      });

      actionRegister.register('notification', () => {
        throw new Error('Handler failed');
      });

      const result = await actionRegister.dispatchWithResult('notification', 
        { message: 'Test', type: 'info' }
      );

      expect(result.execution.handlersExecuted).toBe(2);
      expect(result.execution.startTime).toBeGreaterThanOrEqual(startTime);
      expect(result.execution.endTime).toBeGreaterThan(result.execution.startTime);
      expect(result.execution.duration).toBeGreaterThan(0);
    });
  });

  describe('Registry Management', () => {
    it('should provide action statistics', () => {
      actionRegister.register('userAuth', jest.fn());
      actionRegister.register('userAuth', jest.fn());
      actionRegister.register('dataProcess', jest.fn());

      const userAuthStats = actionRegister.getActionStats('userAuth');
      expect(userAuthStats?.action).toBe('userAuth');
      expect(userAuthStats?.totalHandlers).toBe(2);

      const registeredActions = actionRegister.getRegisteredActions();
      expect(registeredActions).toHaveLength(2);
      expect(registeredActions).toContain('userAuth');
      expect(registeredActions).toContain('dataProcess');
    });

    it('should clear all handlers', () => {
      actionRegister.register('userAuth', jest.fn());
      actionRegister.register('dataProcess', jest.fn());
      actionRegister.register('fileUpload', jest.fn());

      expect(actionRegister.getRegisteredActions()).toHaveLength(3);

      actionRegister.clearAll();

      expect(actionRegister.getRegisteredActions()).toHaveLength(0);
    });

    it('should get handler count', () => {
      expect(actionRegister.getHandlerCount('userAuth')).toBe(0);

      actionRegister.register('userAuth', jest.fn());
      actionRegister.register('userAuth', jest.fn());

      expect(actionRegister.getHandlerCount('userAuth')).toBe(2);
    });
  });

  describe('Execution Modes', () => {
    it('should handle execution mode configuration', () => {
      // Default mode
      expect(actionRegister.getActionExecutionMode('dataProcess')).toBe('sequential');

      // Set mode
      actionRegister.setActionExecutionMode('dataProcess', 'parallel');
      expect(actionRegister.getActionExecutionMode('dataProcess')).toBe('parallel');

      // Remove mode override
      actionRegister.removeActionExecutionMode('dataProcess');
      expect(actionRegister.getActionExecutionMode('dataProcess')).toBe('sequential');
    });

    it('should override execution mode via dispatch options', async () => {
      actionRegister.setActionExecutionMode('dataProcess', 'sequential');
      
      const executionTimes: number[] = [];

      actionRegister.register('dataProcess', async () => {
        executionTimes.push(Date.now());
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      actionRegister.register('dataProcess', async () => {
        executionTimes.push(Date.now());
        await new Promise(resolve => setTimeout(resolve, 30));
      });

      // Override to parallel
      await actionRegister.dispatch('dataProcess', { data: 'test' }, {
        executionMode: 'parallel'
      });

      // In parallel mode, both handlers start around the same time
      const timeDiff = Math.abs(executionTimes[1] - executionTimes[0]);
      expect(timeDiff).toBeLessThan(20); // Should start nearly simultaneously
    });
  });

  describe('Async Operations', () => {
    it('should handle async handlers correctly', async () => {
      const results: string[] = [];

      actionRegister.register('dataProcess', async () => {
        await new Promise(resolve => setTimeout(resolve, 30));
        results.push('async-1');
        return 'result-1';
      });

      actionRegister.register('dataProcess', async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
        results.push('async-2');
        return 'result-2';
      });

      const result = await actionRegister.dispatchWithResult('dataProcess', 
        { data: 'test' },
        { result: { collect: true } }
      );

      expect(results).toEqual(['async-1', 'async-2']);
      expect(result.results).toEqual(['result-1', 'result-2']);
    });

    it('should handle mixed sync and async handlers', async () => {
      const results: string[] = [];

      actionRegister.register('notification', () => {
        results.push('sync');
        return 'sync-result';
      });

      actionRegister.register('notification', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        results.push('async');
        return 'async-result';
      });

      const result = await actionRegister.dispatchWithResult('notification', 
        { message: 'test', type: 'info' },
        { result: { collect: true } }
      );

      expect(results).toEqual(['sync', 'async']);
      expect(result.results).toEqual(['sync-result', 'async-result']);
    });
  });
});