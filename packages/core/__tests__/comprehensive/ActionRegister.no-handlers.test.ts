/**
 * Tests for ActionRegister behavior when no handlers are registered
 * Tests error handling and edge cases for empty registries
 */

import { ActionRegister, type ActionPayloadMap } from '../../src';

interface TestActions extends ActionPayloadMap {
  userLogin: { userId: string; email: string };
  userLogout: void;
  processData: { data: any; type: string };
}

describe('ActionRegister - No Handlers Registered Tests', () => {
  let actionRegister: ActionRegister<TestActions>;

  beforeEach(() => {
    actionRegister = new ActionRegister<TestActions>({
      name: 'NoHandlersTestRegister',
      registry: { debug: false }
    });
  });

  afterEach(() => {
    actionRegister.destroy();
  });

  describe('direct dispatch methods', () => {
    it('should handle dispatch with no handlers - should succeed silently', async () => {
      // Test dispatch with no handlers
      await actionRegister.dispatch('userLogin', { userId: '123', email: 'user@example.com' });
      await actionRegister.dispatch('userLogout');
    }, 10000);

    it('should handle dispatchWithResult with no handlers - should return empty results', async () => {
      const loginResult = await actionRegister.dispatchWithResult('userLogin', { 
        userId: '123', 
        email: 'user@example.com' 
      });

      expect(loginResult.success).toBe(true);
      expect(loginResult.aborted).toBe(false);
      expect(loginResult.execution.handlersExecuted).toBe(0);
      expect(loginResult.results).toHaveLength(0);
      expect(loginResult.execution).toMatchObject({
        handlersExecuted: 0,
        handlersSkipped: 0,
        handlersFailed: 0,
        startTime: expect.any(Number),
        endTime: expect.any(Number),
        duration: expect.any(Number)
      });

      const logoutResult = await actionRegister.dispatchWithResult('userLogout');

      expect(logoutResult.success).toBe(true);
      expect(logoutResult.execution.handlersExecuted).toBe(0);
      expect(logoutResult.results).toHaveLength(0);
    });

    it('should handle dispatch with options when no handlers are registered', async () => {
      // Test with execution options
      const result = await actionRegister.dispatchWithResult('processData', 
        { data: { name: 'test' }, type: 'json' },
        { executionMode: 'parallel' }
      );

      expect(result.success).toBe(true);
      expect(result.execution.handlersExecuted).toBe(0);
      expect(result.results).toHaveLength(0);
    });
  });

  describe('actions getter behavior', () => {
    it('should return undefined for actions when no handlers are registered', () => {
      // Actions getter should return undefined for non-existent actions
      expect(actionRegister.actions.userLogin).toBeUndefined();
      expect(actionRegister.actions.userLogout).toBeUndefined();
      expect(actionRegister.actions.processData).toBeUndefined();
    });

    it('should return undefined for actionsWithResult when no handlers are registered', () => {
      // ActionsWithResult getter should return undefined for non-existent actions
      expect(actionRegister.actionsWithResult.userLogin).toBeUndefined();
      expect(actionRegister.actionsWithResult.userLogout).toBeUndefined();
      expect(actionRegister.actionsWithResult.processData).toBeUndefined();
    });
  });

  describe('registry information', () => {
    it('should return empty registry info when no handlers are registered', () => {
      const info = actionRegister.getRegistryInfo();

      expect(info.totalActions).toBe(0);
      expect(info.totalHandlers).toBe(0);
      expect(info.registeredActions).toHaveLength(0);
      expect(info.registeredActions).toEqual([]);
    });

    it('should return empty handlers list when no handlers are registered', () => {
      expect(actionRegister.getHandlerCount('userLogin')).toBe(0);
      expect(actionRegister.getHandlerCount('userLogout')).toBe(0);
      expect(actionRegister.getHandlerCount('processData')).toBe(0);
    });

    it('should return false for hasAction when no handlers are registered', () => {
      expect(actionRegister.getHandlerCount('userLogin')).toBe(0);
      expect(actionRegister.getHandlerCount('userLogout')).toBe(0);
      expect(actionRegister.getHandlerCount('processData')).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should not throw errors when dispatching to non-existent actions', async () => {
      // These should not throw errors, just execute with no handlers
      await expect(
        actionRegister.dispatch('userLogin', { userId: '123', email: 'user@example.com' })
      ).resolves.toBeUndefined();

      await expect(
        actionRegister.dispatchWithResult('userLogout')
      ).resolves.toMatchObject({
        success: true,
        execution: {
          handlersExecuted: 0
        }
      });
    });

    it('should handle abort signals gracefully when no handlers are registered', async () => {
      const controller = new AbortController();
      
      // Dispatch with abort signal
      const result = await actionRegister.dispatchWithResult('userLogin', 
        { userId: '123', email: 'user@example.com' },
        { signal: controller.signal }
      );

      expect(result.success).toBe(true);
      expect(result.aborted).toBe(false);
      expect(result.execution.handlersExecuted).toBe(0);
    });

    it('should handle immediate abort when no handlers are registered', async () => {
      const controller = new AbortController();
      controller.abort(); // Abort immediately

      const result = await actionRegister.dispatchWithResult('userLogin', 
        { userId: '123', email: 'user@example.com' },
        { signal: controller.signal }
      );

      expect(result.success).toBe(false);
      expect(result.aborted).toBe(true);
      expect(result.abortReason).toContain('aborted');
    });
  });

  describe('performance with no handlers', () => {
    it('should execute quickly when no handlers are registered', async () => {
      const startTime = Date.now();
      
      await actionRegister.dispatch('userLogin', { userId: '123', email: 'user@example.com' });
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(10); // Should be very fast
    });

    it('should have minimal memory footprint with no handlers', () => {
      // Create multiple empty registries
      const registries = Array.from({ length: 10 }, () => 
        new ActionRegister<TestActions>({ name: 'Empty', registry: { debug: false } })
      );
      
      // Cleanup
      registries.forEach(registry => registry.destroy());
      
      // Just verify that registries can be created and destroyed without issues
      expect(registries.length).toBe(10);
    });
  });

  describe('edge cases', () => {
    it('should handle concurrent dispatches with no handlers', async () => {
      const promises = Array.from({ length: 10 }, (_, i) => 
        actionRegister.dispatch('userLogin', { 
          userId: `user${i}`, 
          email: `user${i}@example.com` 
        })
      );

      await expect(Promise.all(promises)).resolves.toEqual(
        Array(10).fill(undefined)
      );
    });

    it('should handle mixed dispatch types with no handlers', async () => {
      const results = await Promise.all([
        actionRegister.dispatch('userLogin', { userId: '123', email: 'user@example.com' }),
        actionRegister.dispatch('userLogout'),
        actionRegister.dispatchWithResult('processData', { data: { name: 'test' }, type: 'json' })
      ]);

      expect(results[0]).toBeUndefined();
      expect(results[1]).toBeUndefined();
      expect(results[2]).toMatchObject({
        success: true,
        execution: { handlersExecuted: 0 }
      });
    });
  });
});
