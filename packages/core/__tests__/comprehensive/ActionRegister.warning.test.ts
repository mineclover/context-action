/**
 * Tests for warning messages when no handlers are registered
 * Tests console warnings and development mode behavior
 */

import { ActionRegister, type ActionPayloadMap } from '../../src';

interface TestActions extends ActionPayloadMap {
  userLogin: { userId: string; email: string };
  userLogout: void;
  processData: { data: any; type: string };
}

describe('ActionRegister - Warning Messages Tests', () => {
  let actionRegister: ActionRegister<TestActions>;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    actionRegister = new ActionRegister<TestActions>({
      name: 'WarningTestRegister',
      registry: { debug: false }
    });

    // Mock console.warn to capture warnings
    consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    actionRegister.destroy();
    consoleSpy.mockRestore();
  });

  describe('development mode warnings', () => {
    beforeEach(() => {
      // Set NODE_ENV to development
      process.env.NODE_ENV = 'development';
    });

    afterEach(() => {
      // Reset NODE_ENV
      delete process.env.NODE_ENV;
    });

    it('should show warning when dispatching to non-existent action', async () => {
      await actionRegister.dispatch('userLogin', { userId: '123', email: 'user@example.com' });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("⚠️ Action 'userLogin' has no registered handlers")
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('💡 Tip: Register a handler using registry.register()')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        '📋 Available actions:',
        expect.any(Array)
      );
    });

    it('should show warning when dispatching void action with no handlers', async () => {
      await actionRegister.dispatch('userLogout');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("⚠️ Action 'userLogout' has no registered handlers")
      );
    });

    it('should show warning when using dispatchWithResult with no handlers', async () => {
      await actionRegister.dispatchWithResult('processData', { data: { name: 'test' }, type: 'json' });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("⚠️ Action 'processData' has no registered handlers")
      );
    });

    it('should show available actions in warning', async () => {
      // Register one action to show in available actions
      actionRegister.register('userLogin', (payload) => {
        return { success: true, userId: payload.userId };
      }, { id: 'login-handler', priority: 100 });

      // Try to dispatch to non-existent action
      await actionRegister.dispatch('userLogout');

      expect(consoleSpy).toHaveBeenCalledWith(
        '📋 Available actions:',
        expect.arrayContaining(['userLogin'])
      );
    });
  });

  describe('production mode behavior', () => {
    beforeEach(() => {
      // Set NODE_ENV to production
      process.env.NODE_ENV = 'production';
    });

    afterEach(() => {
      // Reset NODE_ENV
      delete process.env.NODE_ENV;
    });

    it('should not show console warnings in production mode', async () => {
      await actionRegister.dispatch('userLogin', { userId: '123', email: 'user@example.com' });

      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should still execute successfully in production mode', async () => {
      await expect(
        actionRegister.dispatch('userLogin', { userId: '123', email: 'user@example.com' })
      ).resolves.toBeUndefined();

      const result = await actionRegister.dispatchWithResult('userLogout');
      expect(result.success).toBe(true);
    });
  });

  describe('warning message content', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    afterEach(() => {
      delete process.env.NODE_ENV;
    });

    it('should include action name in warning message', async () => {
      await actionRegister.dispatch('userLogin', { userId: '123', email: 'user@example.com' });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Action 'userLogin' has no registered handlers/)
      );
    });

    it('should include helpful tip in warning message', async () => {
      await actionRegister.dispatch('userLogout');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Register a handler using registry\.register\(\)/)
      );
    });

    it('should show empty available actions when no handlers are registered', async () => {
      await actionRegister.dispatch('processData', { data: { name: 'test' }, type: 'json' });

      expect(consoleSpy).toHaveBeenCalledWith(
        '📋 Available actions:',
        []
      );
    });
  });

  describe('multiple warnings', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    afterEach(() => {
      delete process.env.NODE_ENV;
    });

    it('should show warning for each dispatch to non-existent action', async () => {
      await actionRegister.dispatch('userLogin', { userId: '123', email: 'user@example.com' });
      await actionRegister.dispatch('userLogout');
      await actionRegister.dispatch('processData', { data: { name: 'test' }, type: 'json' });

      // Should show 3 warnings (one for each action)
      expect(consoleSpy).toHaveBeenCalledTimes(9); // 3 warnings × 3 console.warn calls each
    });

    it('should show warning for same action multiple times', async () => {
      await actionRegister.dispatch('userLogin', { userId: '123', email: 'user@example.com' });
      await actionRegister.dispatch('userLogin', { userId: '456', email: 'user2@example.com' });

      // Should show 2 warnings (one for each dispatch)
      expect(consoleSpy).toHaveBeenCalledTimes(6); // 2 warnings × 3 console.warn calls each
    });
  });

  describe('actions getter warnings', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    afterEach(() => {
      delete process.env.NODE_ENV;
    });

    it('should not show warnings when accessing actions getter', () => {
      // Accessing actions getter should not trigger warnings
      const actions = actionRegister.actions;
      const actionsWithResult = actionRegister.actionsWithResult;

      expect(actions).toBeDefined();
      expect(actionsWithResult).toBeDefined();
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should show warnings when calling actions functions', async () => {
      if (actionRegister.actions.userLogin) {
        await actionRegister.actions.userLogin({ userId: '123', email: 'user@example.com' });
        expect(consoleSpy).toHaveBeenCalled();
      }
    });
  });
});
