/**
 * Comprehensive core functionality tests for ActionRegister
 */

import { ActionRegister, type ActionPayloadMap } from '../../src';

interface CoreTestActions extends ActionPayloadMap {
  userLogin: { username: string; password: string };
  userLogout: void;
  updateProfile: { name?: string; email?: string; avatar?: string };
  sendNotification: { message: string; type: 'info' | 'warning' | 'error' };
  processPayment: { amount: number; currency: string; method: string };
  uploadFile: { file: File; metadata?: Record<string, any> };
}

describe('ActionRegister - Core Functionality', () => {
  let actionRegister: ActionRegister<CoreTestActions>;

  beforeEach(() => {
    actionRegister = new ActionRegister<CoreTestActions>({
      name: 'CoreTestRegister',
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

  describe('Handler Registration & Management', () => {
    it('should register handlers with different priorities', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      const handler3 = jest.fn();

      actionRegister.register('userLogin', handler1, { priority: 10, id: 'auth-validation' });
      actionRegister.register('userLogin', handler2, { priority: 20, id: 'auth-process' });
      actionRegister.register('userLogin', handler3, { priority: 5, id: 'auth-logging' });

      const handlers = actionRegister.getHandlers('userLogin');
      expect(handlers).toHaveLength(3);
      
      // Should be sorted by priority (highest first)
      expect(handlers[0].config.priority).toBe(20);
      expect(handlers[1].config.priority).toBe(10);
      expect(handlers[2].config.priority).toBe(5);
    });

    it('should unregister handlers properly', () => {
      const handler = jest.fn();
      const unregister = actionRegister.register('userLogout', handler, { id: 'logout-handler' });

      expect(actionRegister.getHandlers('userLogout')).toHaveLength(1);

      unregister();
      expect(actionRegister.getHandlers('userLogout')).toHaveLength(0);
    });

    it('should handle "once" handlers correctly', async () => {
      const handler = jest.fn();
      actionRegister.register('sendNotification', handler, { once: true });

      await actionRegister.dispatch('sendNotification', { message: 'Test', type: 'info' });
      await actionRegister.dispatch('sendNotification', { message: 'Test2', type: 'info' });

      expect(handler).toHaveBeenCalledTimes(1);
      expect(actionRegister.getHandlers('sendNotification')).toHaveLength(0);
    });

    it('should respect handler conditions', async () => {
      const handler = jest.fn();
      actionRegister.register('processPayment', handler, {
        condition: (payload) => payload.amount > 0
      });

      // Should call handler (condition met)
      await actionRegister.dispatch('processPayment', { amount: 100, currency: 'USD', method: 'credit' });
      expect(handler).toHaveBeenCalledTimes(1);

      // Should not call handler (condition not met)
      await actionRegister.dispatch('processPayment', { amount: 0, currency: 'USD', method: 'credit' });
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('Action Dispatch & Execution', () => {
    it('should dispatch actions with correct payloads', async () => {
      const loginHandler = jest.fn();
      const logoutHandler = jest.fn();

      actionRegister.register('userLogin', loginHandler);
      actionRegister.register('userLogout', logoutHandler);

      await actionRegister.dispatch('userLogin', { username: 'test', password: 'secret' });
      await actionRegister.dispatch('userLogout');

      expect(loginHandler).toHaveBeenCalledWith(
        { username: 'test', password: 'secret' },
        expect.any(Object)
      );
      expect(logoutHandler).toHaveBeenCalledWith(undefined, expect.any(Object));
    });

    it('should execute handlers in priority order', async () => {
      const executionOrder: string[] = [];

      actionRegister.register('updateProfile', () => {
        executionOrder.push('validation');
      }, { priority: 100, id: 'validation' });

      actionRegister.register('updateProfile', () => {
        executionOrder.push('processing');
      }, { priority: 50, id: 'processing' });

      actionRegister.register('updateProfile', () => {
        executionOrder.push('logging');
      }, { priority: 10, id: 'logging' });

      await actionRegister.dispatch('updateProfile', { name: 'John' });

      expect(executionOrder).toEqual(['validation', 'processing', 'logging']);
    });

    it('should handle async handlers correctly', async () => {
      const results: string[] = [];

      actionRegister.register('sendNotification', async (payload) => {
        await new Promise(resolve => setTimeout(resolve, 50));
        results.push('handler1');
      }, { priority: 20 });

      actionRegister.register('sendNotification', async () => {
        await new Promise(resolve => setTimeout(resolve, 30));
        results.push('handler2');
      }, { priority: 10 });

      await actionRegister.dispatch('sendNotification', { message: 'Test', type: 'info' });

      expect(results).toEqual(['handler1', 'handler2']);
    });
  });

  describe('Pipeline Controller Features', () => {
    it('should handle payload modification', async () => {
      let modifiedPayload: any;

      actionRegister.register('updateProfile', (payload, controller) => {
        controller.modifyPayload(current => ({
          ...current,
          timestamp: Date.now(),
          processed: true
        }));
      }, { priority: 20 });

      actionRegister.register('updateProfile', (payload) => {
        modifiedPayload = payload;
      }, { priority: 10 });

      await actionRegister.dispatch('updateProfile', { name: 'John' });

      expect(modifiedPayload).toMatchObject({
        name: 'John',
        timestamp: expect.any(Number),
        processed: true
      });
    });

    it('should handle pipeline abort correctly', async () => {
      const executedHandlers: string[] = [];

      actionRegister.register('processPayment', (payload, controller) => {
        executedHandlers.push('validation');
        if (payload.amount <= 0) {
          controller.abort('Invalid amount');
        }
      }, { priority: 30 });

      actionRegister.register('processPayment', () => {
        executedHandlers.push('processing');
      }, { priority: 20 });

      actionRegister.register('processPayment', () => {
        executedHandlers.push('completion');
      }, { priority: 10 });

      await actionRegister.dispatch('processPayment', { amount: -100, currency: 'USD', method: 'credit' });

      expect(executedHandlers).toEqual(['validation']);
    });

    it('should handle priority jumping', async () => {
      const executionOrder: string[] = [];

      actionRegister.register('uploadFile', (payload, controller) => {
        executionOrder.push('start');
        controller.jumpToPriority(15); // Skip to priority 15 or lower
      }, { priority: 30 });

      actionRegister.register('uploadFile', () => {
        executionOrder.push('skipped-high');
      }, { priority: 25 });

      actionRegister.register('uploadFile', () => {
        executionOrder.push('skipped-medium');
      }, { priority: 20 });

      actionRegister.register('uploadFile', () => {
        executionOrder.push('executed');
      }, { priority: 10 });

      const mockFile = new File(['test'], 'test.txt');
      await actionRegister.dispatch('uploadFile', { file: mockFile });

      expect(executionOrder).toEqual(['start', 'executed']);
    });
  });

  describe('Result Collection & Handling', () => {
    it('should collect results from handlers', async () => {
      actionRegister.register('updateProfile', () => {
        return { step: 'validation', success: true };
      }, { priority: 20 });

      actionRegister.register('updateProfile', () => {
        return { step: 'processing', userId: 123 };
      }, { priority: 10 });

      const result = await actionRegister.dispatchWithResult('updateProfile', { name: 'John' }, {
        result: { collect: true, strategy: 'all' }
      });

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(2);
      expect(result.results).toContainEqual({ step: 'validation', success: true });
      expect(result.results).toContainEqual({ step: 'processing', userId: 123 });
    });

    it('should handle controller.setResult and getResults', async () => {
      actionRegister.register('processPayment', (payload, controller) => {
        controller.setResult({ step: 1, validated: true });
        return { step: 1, completed: true };
      }, { priority: 20 });

      actionRegister.register('processPayment', (payload, controller) => {
        const previousResults = controller.getResults();
        expect(previousResults).toHaveLength(1);
        expect(previousResults[0]).toEqual({ step: 1, completed: true });
        
        return { step: 2, amount: payload.amount * 1.05 }; // Add 5% processing fee
      }, { priority: 10 });

      const result = await actionRegister.dispatchWithResult('processPayment', { 
        amount: 100, currency: 'USD', method: 'credit' 
      }, { result: { collect: true } });

      expect(result.results).toHaveLength(2);
    });

    it('should handle early termination with controller.return', async () => {
      actionRegister.register('userLogin', (payload, controller) => {
        if (payload.username === 'admin') {
          controller.return({ success: true, role: 'admin', skipValidation: true });
        }
      }, { priority: 30 });

      actionRegister.register('userLogin', () => {
        // This should not execute for admin user
        return { success: true, role: 'user' };
      }, { priority: 20 });

      const result = await actionRegister.dispatchWithResult('userLogin', { 
        username: 'admin', password: 'secret' 
      });

      expect(result.success).toBe(true);
      expect(result.terminated).toBe(true);
      expect(result.result).toEqual({ success: true, role: 'admin', skipValidation: true });
      expect(result.execution.handlersExecuted).toBe(1);
    });
  });

  describe('Error Handling & Recovery', () => {
    it('should handle handler errors gracefully', async () => {
      actionRegister.register('sendNotification', () => {
        throw new Error('Network error');
      }, { priority: 20, id: 'network-handler' });

      actionRegister.register('sendNotification', () => {
        return { sent: true, fallback: true };
      }, { priority: 10, id: 'fallback-handler' });

      const result = await actionRegister.dispatchWithResult('sendNotification', { 
        message: 'Hello', type: 'info' 
      }, { result: { collect: true } });

      expect(result.success).toBe(true); // Pipeline continues despite error
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].handlerId).toBe('network-handler');
      expect(result.errors[0].error.message).toBe('Network error');
      expect(result.results).toContainEqual({ sent: true, fallback: true });
    });

    it('should provide detailed execution statistics', async () => {
      const startTime = Date.now();

      actionRegister.register('uploadFile', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return { uploaded: true };
      });

      actionRegister.register('uploadFile', () => {
        throw new Error('Metadata error');
      });

      const mockFile = new File(['test'], 'test.txt');
      const result = await actionRegister.dispatchWithResult('uploadFile', { file: mockFile }, {
        result: { collect: true }
      });

      expect(result.execution.handlersExecuted).toBe(2);
      expect(result.execution.handlersSkipped).toBe(0);
      expect(result.execution.handlersFailed).toBe(1);
      expect(result.execution.duration).toBeGreaterThan(0);
      expect(result.execution.startTime).toBeGreaterThanOrEqual(startTime);
      expect(result.execution.endTime).toBeGreaterThan(result.execution.startTime);
    });
  });

  describe('Registry Statistics & Debugging', () => {
    it('should provide action statistics', () => {
      actionRegister.register('userLogin', jest.fn());
      actionRegister.register('userLogin', jest.fn());
      actionRegister.register('userLogout', jest.fn());

      const stats = actionRegister.getActionStats('userLogin');
      expect(stats.totalHandlers).toBe(2);
      expect(stats.action).toBe('userLogin');

      const allActions = actionRegister.getRegisteredActions();
      expect(allActions).toContain('userLogin');
      expect(allActions).toContain('userLogout');
      expect(allActions).toHaveLength(2);
    });

    it('should clear all handlers correctly', () => {
      actionRegister.register('userLogin', jest.fn());
      actionRegister.register('userLogout', jest.fn());
      actionRegister.register('updateProfile', jest.fn());

      expect(actionRegister.getRegisteredActions()).toHaveLength(3);

      actionRegister.clearAll();

      expect(actionRegister.getRegisteredActions()).toHaveLength(0);
    });

    it('should handle registry configuration options', () => {
      const debugRegister = new ActionRegister<CoreTestActions>({
        name: 'DebugRegister',
        registry: {
          debug: true,
          maxHandlers: 5,
          autoCleanup: true,
          defaultExecutionMode: 'parallel'
        }
      });

      expect(debugRegister.name).toBe('DebugRegister');
      expect(debugRegister.getActionExecutionMode('userLogin')).toBe('parallel');
    });
  });

  describe('Performance & Memory Management', () => {
    it('should handle many handlers efficiently', () => {
      const handlerCount = 100;
      const handlers = Array.from({ length: handlerCount }, (_, i) => 
        jest.fn().mockImplementation(() => `result-${i}`)
      );

      handlers.forEach((handler, index) => {
        actionRegister.register('updateProfile', handler, { priority: index });
      });

      expect(actionRegister.getHandlers('updateProfile')).toHaveLength(handlerCount);
    });

    it('should properly cleanup resources', () => {
      const unregisterFunctions: (() => void)[] = [];

      for (let i = 0; i < 10; i++) {
        const unregister = actionRegister.register('sendNotification', jest.fn(), {
          id: `handler-${i}`
        });
        unregisterFunctions.push(unregister);
      }

      expect(actionRegister.getHandlers('sendNotification')).toHaveLength(10);

      // Unregister half of them
      unregisterFunctions.slice(0, 5).forEach(unregister => unregister());

      expect(actionRegister.getHandlers('sendNotification')).toHaveLength(5);
    });
  });
});