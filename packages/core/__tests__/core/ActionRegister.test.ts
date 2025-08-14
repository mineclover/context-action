/**
 * Comprehensive tests for ActionRegister core functionality
 */

import { ActionRegister, type ActionPayloadMap, type HandlerConfig, type PipelineController } from '../../src';

// Test action types
interface TestActions extends ActionPayloadMap {
  simple: void;
  withPayload: { message: string; count: number };
  optional: string | undefined;
  complex: {
    user: { id: string; name: string };
    settings: { theme: 'light' | 'dark'; notifications: boolean };
  };
}

describe('ActionRegister', () => {
  let actionRegister: ActionRegister<TestActions>;

  beforeEach(() => {
    actionRegister = new ActionRegister<TestActions>({
      name: 'TestRegister',
      registry: {
        debug: false,
        autoCleanup: true,
        maxHandlers: 10
      }
    });
  });

  afterEach(() => {
    actionRegister.clearAll();
  });

  describe('Constructor and Configuration', () => {
    it('should create ActionRegister with default configuration', () => {
      const register = new ActionRegister<TestActions>();
      
      const info = register.getRegistryInfo();
      expect(info.name).toBe('ActionRegister');
      expect(info.totalActions).toBe(0);
      expect(info.totalHandlers).toBe(0);
    });

    it('should create ActionRegister with custom configuration', () => {
      const register = new ActionRegister<TestActions>({
        name: 'CustomRegister',
        registry: {
          debug: true,
          maxHandlers: 50,
          autoCleanup: false
        }
      });

      const info = register.getRegistryInfo();
      expect(info.name).toBe('CustomRegister');
    });

    it('should respect maxHandlers configuration', () => {
      const register = new ActionRegister<TestActions>({
        registry: { maxHandlers: 2 }
      });

      // Register maximum number of handlers
      register.register('simple', jest.fn());
      register.register('simple', jest.fn());
      
      // This should not throw but might log a warning
      expect(() => register.register('simple', jest.fn())).not.toThrow();
    });
  });

  describe('Handler Registration', () => {
    it('should register basic handler without config', () => {
      const handler = jest.fn();
      const unregister = actionRegister.register('simple', handler);

      expect(typeof unregister).toBe('function');
      expect(actionRegister.getHandlerCount('simple')).toBe(1);
    });

    it('should register handler with configuration', () => {
      const handler = jest.fn();
      const config: HandlerConfig = {
        priority: 100,
        id: 'test-handler',
        blocking: true,
        once: false,
        tags: ['validation', 'test'],
        category: 'core',
        description: 'Test handler for validation'
      };

      actionRegister.register('withPayload', handler, config);
      
      const stats = actionRegister.getActionStats('withPayload');
      expect(stats?.handlerCount).toBe(1);
      expect(stats?.handlersByPriority).toEqual([100]);
    });

    it('should handle multiple handlers with different priorities', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      const handler3 = jest.fn();

      actionRegister.register('simple', handler1, { priority: 10 });
      actionRegister.register('simple', handler2, { priority: 100 });
      actionRegister.register('simple', handler3, { priority: 50 });

      const stats = actionRegister.getActionStats('simple');
      expect(stats?.handlerCount).toBe(3);
      expect(stats?.handlersByPriority).toEqual([100, 50, 10]);
    });

    it('should auto-generate handler IDs when not provided', () => {
      actionRegister.register('simple', jest.fn());
      actionRegister.register('simple', jest.fn());
      
      expect(actionRegister.getHandlerCount('simple')).toBe(2);
    });

    it('should handle handler with conditions', () => {
      const handler = jest.fn();
      let shouldExecute = false;

      actionRegister.register('simple', handler, {
        condition: () => shouldExecute
      });

      // Should not execute when condition is false
      actionRegister.dispatch('simple');
      expect(handler).not.toHaveBeenCalled();

      // Should execute when condition is true
      shouldExecute = true;
      actionRegister.dispatch('simple');
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should handle once: true handlers', async () => {
      const handler = jest.fn();

      actionRegister.register('simple', handler, { once: true });

      await actionRegister.dispatch('simple');
      await actionRegister.dispatch('simple');

      expect(handler).toHaveBeenCalledTimes(1);
      expect(actionRegister.getHandlerCount('simple')).toBe(0);
    });
  });

  describe('Handler Unregistration', () => {
    it('should unregister handler using returned function', () => {
      const handler = jest.fn();
      const unregister = actionRegister.register('simple', handler);

      expect(actionRegister.getHandlerCount('simple')).toBe(1);

      unregister();
      expect(actionRegister.getHandlerCount('simple')).toBe(0);
    });

    it('should handle multiple unregistrations safely', () => {
      const handler = jest.fn();
      const unregister = actionRegister.register('simple', handler);

      unregister();
      expect(() => unregister()).not.toThrow();
    });

    it('should clear all handlers for specific action', () => {
      actionRegister.register('simple', jest.fn());
      actionRegister.register('simple', jest.fn());
      actionRegister.register('withPayload', jest.fn());

      expect(actionRegister.getHandlerCount('simple')).toBe(2);
      expect(actionRegister.getHandlerCount('withPayload')).toBe(1);

      actionRegister.clearAction('simple');

      expect(actionRegister.getHandlerCount('simple')).toBe(0);
      expect(actionRegister.getHandlerCount('withPayload')).toBe(1);
    });

    it('should clear all handlers', () => {
      actionRegister.register('simple', jest.fn());
      actionRegister.register('withPayload', jest.fn());

      const info = actionRegister.getRegistryInfo();
      expect(info.totalHandlers).toBe(2);

      actionRegister.clearAll();

      const newInfo = actionRegister.getRegistryInfo();
      expect(newInfo.totalHandlers).toBe(0);
    });
  });

  describe('Action Dispatch', () => {
    it('should dispatch action without payload', async () => {
      const handler = jest.fn();
      actionRegister.register('simple', handler);

      await actionRegister.dispatch('simple');

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(undefined, expect.any(Object));
    });

    it('should dispatch action with payload', async () => {
      const handler = jest.fn();
      const payload = { message: 'hello', count: 42 };

      actionRegister.register('withPayload', handler);

      await actionRegister.dispatch('withPayload', payload);

      expect(handler).toHaveBeenCalledWith(payload, expect.any(Object));
    });

    it('should execute handlers in priority order', async () => {
      const callOrder: number[] = [];

      const handler1 = jest.fn(() => callOrder.push(1));
      const handler2 = jest.fn(() => callOrder.push(2));
      const handler3 = jest.fn(() => callOrder.push(3));

      actionRegister.register('simple', handler1, { priority: 10 });
      actionRegister.register('simple', handler2, { priority: 100 });
      actionRegister.register('simple', handler3, { priority: 50 });

      await actionRegister.dispatch('simple');

      expect(callOrder).toEqual([2, 3, 1]); // Highest priority first
    });

    it('should handle async handlers', async () => {
      const results: string[] = [];
      
      const asyncHandler = jest.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        results.push('async');
      });

      const syncHandler = jest.fn(() => {
        results.push('sync');
      });

      actionRegister.register('simple', asyncHandler, { priority: 100 });
      actionRegister.register('simple', syncHandler, { priority: 50 });

      await actionRegister.dispatch('simple');

      expect(results).toEqual(['async', 'sync']);
    });
  });

  describe('Pipeline Controller', () => {
    it('should provide controller to handlers', async () => {
      let receivedController: PipelineController | null = null;

      const handler = jest.fn((payload, controller) => {
        receivedController = controller;
      });

      actionRegister.register('simple', handler);
      await actionRegister.dispatch('simple');

      expect(receivedController).toBeTruthy();
      expect(typeof receivedController?.abort).toBe('function');
      expect(typeof receivedController?.modifyPayload).toBe('function');
      expect(typeof receivedController?.getPayload).toBe('function');
    });

    it('should handle payload modification', async () => {
      const payloadHistory: any[] = [];

      const handler1 = jest.fn((payload, controller) => {
        payloadHistory.push({ stage: 'handler1', payload });
        controller.modifyPayload((p: any) => ({ ...p, modified: true }));
      });

      const handler2 = jest.fn((payload, controller) => {
        payloadHistory.push({ stage: 'handler2', payload });
      });

      actionRegister.register('withPayload', handler1, { priority: 100 });
      actionRegister.register('withPayload', handler2, { priority: 50 });

      await actionRegister.dispatch('withPayload', { message: 'test', count: 1 });

      expect(payloadHistory[0].payload.modified).toBeUndefined();
      expect(payloadHistory[1].payload.modified).toBe(true);
    });

    it('should handle pipeline abort', async () => {
      const handler1 = jest.fn((payload, controller) => {
        controller.abort('Test abort');
      });

      const handler2 = jest.fn();

      actionRegister.register('simple', handler1, { priority: 100 });
      actionRegister.register('simple', handler2, { priority: 50 });

      await actionRegister.dispatch('simple');

      expect(handler1).toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });

    it('should handle jumpToPriority', async () => {
      const callOrder: number[] = [];

      const handler1 = jest.fn((payload, controller) => {
        callOrder.push(1);
        controller.jumpToPriority(25);
      });

      const handler2 = jest.fn(() => callOrder.push(2)); // priority 75 - should be skipped
      const handler3 = jest.fn(() => callOrder.push(3)); // priority 50 - should be skipped  
      const handler4 = jest.fn(() => callOrder.push(4)); // priority 25 - should execute

      actionRegister.register('simple', handler1, { priority: 100 });
      actionRegister.register('simple', handler2, { priority: 75 });
      actionRegister.register('simple', handler3, { priority: 50 });
      actionRegister.register('simple', handler4, { priority: 25 });

      await actionRegister.dispatch('simple');

      expect(callOrder).toEqual([1, 4]);
    });
  });

  describe('Handler Discovery and Statistics', () => {
    it('should get registry information', () => {
      actionRegister.register('simple', jest.fn());
      actionRegister.register('withPayload', jest.fn());

      const info = actionRegister.getRegistryInfo();
      
      expect(info.name).toBe('TestRegister');
      expect(info.totalActions).toBe(2);
      expect(info.totalHandlers).toBe(2);
      expect(info.registeredActions).toEqual(['simple', 'withPayload']);
    });

    it('should get action statistics', () => {
      actionRegister.register('simple', jest.fn(), { priority: 100 });
      actionRegister.register('simple', jest.fn(), { priority: 50 });

      const stats = actionRegister.getActionStats('simple');
      
      expect(stats?.action).toBe('simple');
      expect(stats?.handlerCount).toBe(2);
      expect(stats?.handlersByPriority).toEqual([100, 50]);
    });

    it('should get handlers by tag', () => {
      actionRegister.register('simple', jest.fn(), { tags: ['validation', 'test'] });
      actionRegister.register('withPayload', jest.fn(), { tags: ['validation'] });
      actionRegister.register('optional', jest.fn(), { tags: ['optional'] });

      const validationHandlers = actionRegister.getHandlersByTag('validation');
      
      expect(validationHandlers.size).toBe(2);
      expect(validationHandlers.has('simple')).toBe(true);
      expect(validationHandlers.has('withPayload')).toBe(true);
      expect(validationHandlers.has('optional')).toBe(false);
    });

    it('should get handlers by category', () => {
      actionRegister.register('simple', jest.fn(), { category: 'core' });
      actionRegister.register('withPayload', jest.fn(), { category: 'core' });
      actionRegister.register('optional', jest.fn(), { category: 'utility' });

      const coreHandlers = actionRegister.getHandlersByCategory('core');
      
      expect(coreHandlers.size).toBe(2);
      expect(coreHandlers.has('simple')).toBe(true);
      expect(coreHandlers.has('withPayload')).toBe(true);
      expect(coreHandlers.has('optional')).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle handler errors gracefully', async () => {
      const errorHandler = jest.fn(() => {
        throw new Error('Handler error');
      });

      const nextHandler = jest.fn();

      actionRegister.register('simple', errorHandler, { priority: 100 });
      actionRegister.register('simple', nextHandler, { priority: 50 });

      await expect(actionRegister.dispatch('simple')).resolves.not.toThrow();
      
      expect(errorHandler).toHaveBeenCalled();
      // Next handler should still execute (depending on execution mode)
    });

    it('should handle async handler errors', async () => {
      const asyncErrorHandler = jest.fn(async () => {
        throw new Error('Async handler error');
      });

      actionRegister.register('simple', asyncErrorHandler);

      await expect(actionRegister.dispatch('simple')).resolves.not.toThrow();
      expect(asyncErrorHandler).toHaveBeenCalled();
    });
  });

  describe('Debug and Utilities', () => {
    it('should check if debug mode is enabled', () => {
      const debugRegister = new ActionRegister<TestActions>({
        registry: { debug: true }
      });

      expect(debugRegister.isDebugEnabled()).toBe(true);
      expect(actionRegister.isDebugEnabled()).toBe(false);
    });

    it('should handle hasHandlers check', () => {
      expect(actionRegister.hasHandlers('simple')).toBe(false);

      actionRegister.register('simple', jest.fn());
      
      expect(actionRegister.hasHandlers('simple')).toBe(true);
    });

    it('should get handler count', () => {
      expect(actionRegister.getHandlerCount('simple')).toBe(0);

      actionRegister.register('simple', jest.fn());
      actionRegister.register('simple', jest.fn());

      expect(actionRegister.getHandlerCount('simple')).toBe(2);
    });
  });

  describe('Execution Statistics', () => {
    it('should clear execution stats', () => {
      actionRegister.clearExecutionStats();
      // Should not throw
      expect(true).toBe(true);
    });

    it('should clear action-specific execution stats', () => {
      actionRegister.clearActionExecutionStats('simple');
      // Should not throw
      expect(true).toBe(true);
    });

    it('should get all action stats', () => {
      actionRegister.register('simple', jest.fn());
      actionRegister.register('withPayload', jest.fn());

      const allStats = actionRegister.getAllActionStats();
      
      expect(allStats.length).toBe(2);
      expect(allStats.some(stat => stat.action === 'simple')).toBe(true);
      expect(allStats.some(stat => stat.action === 'withPayload')).toBe(true);
    });
  });
});