/**
 * Final comprehensive tests for actions and actionsWithResult getters
 */

import { ActionRegister, type ActionPayloadMap } from '../../src';

interface TestActions extends ActionPayloadMap {
  userLogin: { userId: string; email: string };
  userLogout: void;
  processData: { data: any; type: string };
  sendNotification: { message: string; userId: string };
  resetApp: void;
}

describe('ActionRegister - Actions and ActionsWithResult Getters', () => {
  let actionRegister: ActionRegister<TestActions>;

  beforeEach(() => {
    actionRegister = new ActionRegister<TestActions>({
      name: 'ActionsTestRegister',
      registry: { debug: false }
    });

    // Register handlers for all actions
    actionRegister.register('userLogin', (payload) => {
      return { success: true, userId: payload.userId };
    }, { id: 'login-handler', priority: 100 });

    actionRegister.register('userLogout', () => {
      return { success: true };
    }, { id: 'logout-handler', priority: 100 });

    actionRegister.register('processData', (payload) => {
      return { processed: true, type: payload.type };
    }, { id: 'data-processor', priority: 100 });

    actionRegister.register('sendNotification', (payload) => {
      return { sent: true, message: payload.message };
    }, { id: 'notification-sender', priority: 100 });

    actionRegister.register('resetApp', () => {
      return { reset: true };
    }, { id: 'app-resetter', priority: 100 });
  });

  afterEach(() => {
    actionRegister.destroy();
  });

  describe('actions getter', () => {
    it('should provide function-based dispatching for actions with payload', async () => {
      await actionRegister.actions.userLogin({ userId: '123', email: 'user@example.com' });
      await actionRegister.actions.processData({ data: { name: 'test' }, type: 'json' });
      await actionRegister.actions.sendNotification({ message: 'Hello!', userId: '123' });
    });

    it('should provide function-based dispatching for actions without payload', async () => {
      await actionRegister.actions.userLogout();
      await actionRegister.actions.resetApp();
    });

    it('should support options parameter', async () => {
      await actionRegister.actions.processData(
        { data: { name: 'test' }, type: 'json' },
        { executionMode: 'parallel' }
      );

      await actionRegister.actions.sendNotification(
        { message: 'Debounced message', userId: '123' },
        { debounce: 100 }
      );
    });

    it('should handle options as first parameter for void actions', async () => {
      await actionRegister.actions.userLogout({ executionMode: 'parallel' });
      await actionRegister.actions.resetApp({ debounce: 100 });
    });

    it('should return undefined for non-existent actions', () => {
      // @ts-expect-error - Testing runtime behavior
      expect(actionRegister.actions.nonExistentAction).toBeUndefined();
    });
  });

  describe('actionsWithResult getter', () => {
    it('should provide function-based dispatching with results for actions with payload', async () => {
      const loginResult = await actionRegister.actionsWithResult.userLogin({ 
        userId: '123', 
        email: 'user@example.com' 
      });

      expect(loginResult.success).toBe(true);
      expect(loginResult.aborted).toBe(false);
      expect(loginResult.execution.handlersExecuted).toBe(1);
      expect(loginResult.results).toHaveLength(1);
      expect(loginResult.results[0]).toEqual({ success: true, userId: '123' });

      const processResult = await actionRegister.actionsWithResult.processData({ 
        data: { name: 'test' }, 
        type: 'json' 
      });

      expect(processResult.success).toBe(true);
      expect(processResult.execution.handlersExecuted).toBe(1);
      expect(processResult.results[0]).toEqual({ processed: true, type: 'json' });
    });

    it('should provide function-based dispatching with results for actions without payload', async () => {
      const logoutResult = await actionRegister.actionsWithResult.userLogout();

      expect(logoutResult.success).toBe(true);
      expect(logoutResult.aborted).toBe(false);
      expect(logoutResult.execution.handlersExecuted).toBe(1);
      expect(logoutResult.results).toHaveLength(1);
      expect(logoutResult.results[0]).toEqual({ success: true });

      const resetResult = await actionRegister.actionsWithResult.resetApp();

      expect(resetResult.success).toBe(true);
      expect(resetResult.execution.handlersExecuted).toBe(1);
      expect(resetResult.results[0]).toEqual({ reset: true });
    });

    it('should support options parameter with result collection', async () => {
      const processResult = await actionRegister.actionsWithResult.processData(
        { data: { name: 'test' }, type: 'json' },
        { executionMode: 'parallel' }
      );

      expect(processResult.success).toBe(true);
      expect(processResult.execution.handlersExecuted).toBe(1);

      const notificationResult = await actionRegister.actionsWithResult.sendNotification(
        { message: 'Debounced message', userId: '123' },
        { debounce: 100 }
      );

      expect(notificationResult.success).toBe(true);
      expect(notificationResult.execution.handlersExecuted).toBe(1);
    });

    it('should handle options as first parameter for void actions with result collection', async () => {
      const logoutResult = await actionRegister.actionsWithResult.userLogout({ 
        executionMode: 'parallel' 
      });

      expect(logoutResult.success).toBe(true);
      expect(logoutResult.execution.handlersExecuted).toBe(1);

      const resetResult = await actionRegister.actionsWithResult.resetApp({ 
        debounce: 100 
      });

      expect(resetResult.success).toBe(true);
      expect(resetResult.execution.handlersExecuted).toBe(1);
    });

    it('should return undefined for non-existent actions', () => {
      // @ts-expect-error - Testing runtime behavior
      expect(actionRegister.actionsWithResult.nonExistentAction).toBeUndefined();
    });

    it('should provide detailed execution statistics', async () => {
      const result = await actionRegister.actionsWithResult.userLogin({ 
        userId: '123', 
        email: 'user@example.com' 
      });

      expect(result.execution).toMatchObject({
        handlersExecuted: 1,
        handlersSkipped: 0,
        handlersFailed: 0,
        startTime: expect.any(Number),
        endTime: expect.any(Number),
        duration: expect.any(Number)
      });

      expect(result.execution.duration).toBeGreaterThanOrEqual(0);
      expect(result.execution.endTime).toBeGreaterThanOrEqual(result.execution.startTime);
    });

    it('should handle multiple handlers with result collection', async () => {
      // Register additional handler
      actionRegister.register('userLogin', (payload) => {
        return { additional: true, userId: payload.userId };
      }, { id: 'additional-login-handler', priority: 90 });

      const result = await actionRegister.actionsWithResult.userLogin({ 
        userId: '123', 
        email: 'user@example.com' 
      });

      expect(result.success).toBe(true);
      expect(result.execution.handlersExecuted).toBe(2);
      expect(result.results).toHaveLength(2);
      expect(result.results[0]).toEqual({ success: true, userId: '123' });
      expect(result.results[1]).toEqual({ additional: true, userId: '123' });
    });
  });

  describe('type safety', () => {
    it('should provide correct type inference for actions', () => {
      const actions = actionRegister.actions;
      
      // Actions with payload
      expect(typeof actions.userLogin).toBe('function');
      expect(typeof actions.processData).toBe('function');
      expect(typeof actions.sendNotification).toBe('function');
      
      // Actions without payload
      expect(typeof actions.userLogout).toBe('function');
      expect(typeof actions.resetApp).toBe('function');
    });

    it('should provide correct type inference for actionsWithResult', () => {
      const actionsWithResult = actionRegister.actionsWithResult;
      
      // Actions with payload
      expect(typeof actionsWithResult.userLogin).toBe('function');
      expect(typeof actionsWithResult.processData).toBe('function');
      expect(typeof actionsWithResult.sendNotification).toBe('function');
      
      // Actions without payload
      expect(typeof actionsWithResult.userLogout).toBe('function');
      expect(typeof actionsWithResult.resetApp).toBe('function');
    });
  });

  describe('edge cases', () => {
    it('should handle empty registry', () => {
      const emptyRegister = new ActionRegister<TestActions>({
        name: 'EmptyRegister',
        registry: { debug: false }
      });

      // Actions should return undefined for non-existent actions
      // @ts-expect-error - Testing runtime behavior
      expect(emptyRegister.actions.userLogin).toBeUndefined();
      // @ts-expect-error - Testing runtime behavior
      expect(emptyRegister.actionsWithResult.userLogin).toBeUndefined();

      emptyRegister.destroy();
    });

    it('should handle actions with no handlers', async () => {
      const emptyRegister = new ActionRegister<TestActions>({
        name: 'EmptyRegister',
        registry: { debug: false }
      });

      // Actions should be undefined for non-existent actions
      // @ts-expect-error - Testing runtime behavior
      expect(emptyRegister.actions.userLogin).toBeUndefined();
      // @ts-expect-error - Testing runtime behavior
      expect(emptyRegister.actionsWithResult.userLogin).toBeUndefined();

      emptyRegister.destroy();
    });
  });
});
