/**
 * @fileoverview Unit tests for react-helpers module
 * 
 * Tests React integration helpers including createActionHandler,
 * ReactDevUtils, ReactActionError and related utilities.
 */

import {
  createActionHandler,
  ReactDevUtils,
  ReactActionError,
  isReactActionError
} from '../../src/react-helpers.js';
import { ActionRegister } from '../../src/ActionRegister.js';
import type { ActionPayloadMap, ActionHandler } from '../../src/types.js';

// Mock window object for browser-specific tests
const mockWindow = {
  __CONTEXT_ACTION_REACT_DEBUG__: false
};

// Setup window mock
beforeEach(() => {
  (global as any).window = mockWindow;
  mockWindow.__CONTEXT_ACTION_REACT_DEBUG__ = false;
});

afterEach(() => {
  delete (global as any).window;
});

// Test interfaces
interface TestActions extends ActionPayloadMap {
  updateUser: { id: string; name: string };
  deleteUser: { id: string };
  resetApp: void;
}

describe('React Helpers Unit Tests', () => {
  let registry: ActionRegister<TestActions>;

  beforeEach(() => {
    registry = new ActionRegister<TestActions>({
      name: 'TestReactRegistry',
      registry: { debug: false }
    });
  });

  afterEach(() => {
    registry.destroy();
  });

  describe('createActionHandler', () => {
    it('should create handler manager with correct configuration', () => {
      const handler: ActionHandler<TestActions['updateUser']> = jest.fn();
      const config = { priority: 10, id: 'custom-id' };

      const handlerManager = createActionHandler(registry, 'updateUser', handler, config);

      expect(handlerManager.config).toMatchObject({
        priority: 10,
        id: 'custom-id',
        blocking: false,
        once: false,
        debounce: undefined,
        throttle: undefined,
        replaceExisting: true
      });
    });

    it('should generate unique IDs when not provided', () => {
      const handler: ActionHandler<TestActions['updateUser']> = jest.fn();

      const manager1 = createActionHandler(registry, 'updateUser', handler);
      const manager2 = createActionHandler(registry, 'updateUser', handler);

      expect(manager1.config.id).toMatch(/^react_updateUser_\d+_[a-z0-9]{5}$/);
      expect(manager2.config.id).toMatch(/^react_updateUser_\d+_[a-z0-9]{5}$/);
      expect(manager1.config.id).not.toBe(manager2.config.id);
    });

    it('should use React-optimized defaults', () => {
      const handler: ActionHandler<TestActions['updateUser']> = jest.fn();

      const handlerManager = createActionHandler(registry, 'updateUser', handler);

      expect(handlerManager.config.replaceExisting).toBe(true);
      expect(handlerManager.config.priority).toBe(0);
      expect(handlerManager.config.blocking).toBe(false);
      expect(handlerManager.config.once).toBe(false);
    });

    it('should register handler and return unregister function', () => {
      const handler: ActionHandler<TestActions['updateUser']> = jest.fn();
      const handlerManager = createActionHandler(registry, 'updateUser', handler, { priority: 5 });

      expect(registry.getHandlerCount('updateUser')).toBe(0);

      const unregister = handlerManager.register();

      expect(registry.getHandlerCount('updateUser')).toBe(1);
      expect(typeof unregister).toBe('function');

      unregister();

      expect(registry.getHandlerCount('updateUser')).toBe(0);
    });

    it('should handle multiple registrations with replacement', () => {
      const handler1: ActionHandler<TestActions['updateUser']> = jest.fn();
      const handler2: ActionHandler<TestActions['updateUser']> = jest.fn();
      const handlerManager = createActionHandler(registry, 'updateUser', handler1, { id: 'test-handler' });

      handlerManager.register();
      expect(registry.getHandlerCount('updateUser')).toBe(1);

      // Create new manager with same ID
      const handlerManager2 = createActionHandler(registry, 'updateUser', handler2, { id: 'test-handler' });
      handlerManager2.register();

      expect(registry.getHandlerCount('updateUser')).toBe(1); // Should replace, not add
    });

    it('should unregister existing handler when registering new one', () => {
      const handler: ActionHandler<TestActions['updateUser']> = jest.fn();
      const handlerManager = createActionHandler(registry, 'updateUser', handler);

      const unregister1 = handlerManager.register();
      const unregister2 = handlerManager.register();

      expect(registry.getHandlerCount('updateUser')).toBe(1);

      // First unregister should do nothing (already replaced)
      unregister1();
      expect(registry.getHandlerCount('updateUser')).toBe(1);

      // Second unregister should work
      unregister2();
      expect(registry.getHandlerCount('updateUser')).toBe(0);
    });

    it('should handle unregister method', () => {
      const handler: ActionHandler<TestActions['updateUser']> = jest.fn();
      const handlerManager = createActionHandler(registry, 'updateUser', handler);

      handlerManager.register();
      expect(registry.getHandlerCount('updateUser')).toBe(1);

      handlerManager.unregister();
      expect(registry.getHandlerCount('updateUser')).toBe(0);

      // Should be safe to call multiple times
      handlerManager.unregister();
      expect(registry.getHandlerCount('updateUser')).toBe(0);
    });

    it('should provide registerWithCleanup for React useEffect pattern', () => {
      const handler: ActionHandler<TestActions['updateUser']> = jest.fn();
      const handlerManager = createActionHandler(registry, 'updateUser', handler);

      expect(registry.getHandlerCount('updateUser')).toBe(0);

      const cleanup = handlerManager.registerWithCleanup();

      expect(registry.getHandlerCount('updateUser')).toBe(1);
      expect(typeof cleanup).toBe('function');

      cleanup();

      expect(registry.getHandlerCount('updateUser')).toBe(0);
    });

    it('should handle complex configuration', () => {
      const handler: ActionHandler<TestActions['updateUser']> = jest.fn();
      const config = {
        priority: 100,
        id: 'complex-handler',
        blocking: true,
        once: true,
        debounce: 300,
        throttle: 1000
      };

      const handlerManager = createActionHandler(registry, 'updateUser', handler, config);

      expect(handlerManager.config).toMatchObject({
        ...config,
        replaceExisting: true
      });
    });

    it('should work with void actions', () => {
      const handler: ActionHandler<TestActions['resetApp']> = jest.fn();
      const handlerManager = createActionHandler(registry, 'resetApp', handler);

      const unregister = handlerManager.register();

      expect(registry.getHandlerCount('resetApp')).toBe(1);

      unregister();

      expect(registry.getHandlerCount('resetApp')).toBe(0);
    });

    it('should handle edge case with empty action name', () => {
      const handler: ActionHandler<any> = jest.fn();
      
      // This should work but generate a different ID pattern
      const handlerManager = createActionHandler(registry as any, '', handler);

      expect(handlerManager.config.id).toMatch(/^react__\d+_[a-z0-9]{5}$/);
    });
  });

  describe('ReactDevUtils', () => {
    describe('Debug Mode Management', () => {
      it('should enable debug mode', () => {
        expect(ReactDevUtils.isDebugMode()).toBe(false);

        ReactDevUtils.enableDebugMode();

        expect(ReactDevUtils.isDebugMode()).toBe(true);
        expect(mockWindow.__CONTEXT_ACTION_REACT_DEBUG__).toBe(true);
      });

      it('should disable debug mode', () => {
        mockWindow.__CONTEXT_ACTION_REACT_DEBUG__ = true;

        ReactDevUtils.disableDebugMode();

        expect(ReactDevUtils.isDebugMode()).toBe(false);
        expect(mockWindow.__CONTEXT_ACTION_REACT_DEBUG__).toBe(false);
      });

      it('should handle missing window object', () => {
        delete (global as any).window;

        expect(ReactDevUtils.isDebugMode()).toBe(false);

        ReactDevUtils.enableDebugMode(); // Should not throw
        ReactDevUtils.disableDebugMode(); // Should not throw

        expect(ReactDevUtils.isDebugMode()).toBe(false);
      });
    });

    describe('Debug Logging', () => {
      let consoleSpy: jest.SpyInstance;

      beforeEach(() => {
        consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      });

      afterEach(() => {
        consoleSpy.mockRestore();
      });

      it('should log when debug mode is enabled', () => {
        ReactDevUtils.enableDebugMode();

        ReactDevUtils.log('TestComponent', 'updateUser', 'Handler registered', { priority: 10 });

        expect(consoleSpy).toHaveBeenCalledWith(
          '🎯 [React-ActionRegister] [TestComponent] updateUser: Handler registered',
          { priority: 10 }
        );
      });

      it('should not log when debug mode is disabled', () => {
        ReactDevUtils.disableDebugMode();

        ReactDevUtils.log('TestComponent', 'updateUser', 'Handler registered');

        expect(consoleSpy).not.toHaveBeenCalled();
      });

      it('should handle logging without data parameter', () => {
        ReactDevUtils.enableDebugMode();

        ReactDevUtils.log('TestComponent', 'updateUser', 'Simple message');

        expect(consoleSpy).toHaveBeenCalledWith(
          '🎯 [React-ActionRegister] [TestComponent] updateUser: Simple message',
          ''
        );
      });
    });

    describe('Statistics', () => {
      it('should collect React handler statistics', () => {
        const handler1: ActionHandler<TestActions['updateUser']> = jest.fn();
        const handler2: ActionHandler<TestActions['deleteUser']> = jest.fn();
        const handler3: ActionHandler<TestActions['resetApp']> = jest.fn();

        // Register React handlers with explicit IDs for testing (use react prefix)
        const manager1 = createActionHandler(registry, 'updateUser', handler1, { id: 'react_handler1' });
        const manager2 = createActionHandler(registry, 'deleteUser', handler2, { id: 'react_handler2' });

        manager1.register();
        manager2.register();
        
        // Register completely non-React handler (no 'react' substring)
        registry.register('resetApp', handler3, { id: 'manual-handler' });

        const stats = ReactDevUtils.getStats(registry);

        expect(stats.totalHandlers).toBe(3);
        expect(stats.reactHandlers).toBe(2);
        expect(stats.registryInfo.name).toBe('TestReactRegistry');
        expect(stats.registryInfo.totalActions).toBe(3);
      });

      it('should handle empty registry', () => {
        const stats = ReactDevUtils.getStats(registry);

        expect(stats.totalHandlers).toBe(0);
        expect(stats.reactHandlers).toBe(0);
        expect(stats.registryInfo.totalActions).toBe(0);
      });

      it('should count only React handlers', () => {
        const reactHandler: ActionHandler<TestActions['updateUser']> = jest.fn();
        const nonReactHandler: ActionHandler<TestActions['deleteUser']> = jest.fn();

        const reactManager = createActionHandler(registry, 'updateUser', reactHandler);
        reactManager.register();

        registry.register('deleteUser', nonReactHandler, { id: 'manual-handler' });

        const stats = ReactDevUtils.getStats(registry);

        expect(stats.totalHandlers).toBe(2);
        expect(stats.reactHandlers).toBe(1);
      });
    });
  });

  describe('ReactActionError', () => {
    it('should create error with all properties', () => {
      const error = new ReactActionError(
        'Update failed',
        'updateUser',
        { id: '123', name: 'John' },
        'user-handler'
      );

      expect(error.message).toBe('Update failed');
      expect(error.name).toBe('ReactActionError');
      expect(error.action).toBe('updateUser');
      expect(error.payload).toEqual({ id: '123', name: 'John' });
      expect(error.handlerId).toBe('user-handler');
      expect(error.timestamp).toBeGreaterThan(0);
      expect(error instanceof Error).toBe(true);
    });

    it('should create error with minimal properties', () => {
      const error = new ReactActionError('Simple error', 'resetApp');

      expect(error.message).toBe('Simple error');
      expect(error.action).toBe('resetApp');
      expect(error.payload).toBeUndefined();
      expect(error.handlerId).toBeUndefined();
    });

    it('should preserve original error stack', () => {
      const originalError = new Error('Original error');
      originalError.stack = 'Original stack trace';

      const reactError = new ReactActionError(
        'Wrapped error',
        'updateUser',
        {},
        'handler-id',
        originalError
      );

      expect(reactError.stack).toBe('Original stack trace');
    });

    it('should create from action error using static method', () => {
      const originalError = new Error('Database connection failed');
      const payload = { id: '123', name: 'John' };

      const reactError = ReactActionError.fromActionError(
        originalError,
        'updateUser',
        payload,
        'user-handler'
      );

      expect(reactError.message).toBe('Action \'updateUser\' failed: Database connection failed');
      expect(reactError.action).toBe('updateUser');
      expect(reactError.payload).toEqual(payload);
      expect(reactError.handlerId).toBe('user-handler');
    });

    it('should create from action error with minimal parameters', () => {
      const originalError = new Error('Network error');

      const reactError = ReactActionError.fromActionError(originalError, 'resetApp');

      expect(reactError.message).toBe('Action \'resetApp\' failed: Network error');
      expect(reactError.action).toBe('resetApp');
      expect(reactError.payload).toBeUndefined();
      expect(reactError.handlerId).toBeUndefined();
    });

    it('should be identifiable as ReactActionError', () => {
      const reactError = new ReactActionError('Test error', 'updateUser');
      const regularError = new Error('Regular error');

      expect(isReactActionError(reactError)).toBe(true);
      expect(isReactActionError(regularError)).toBe(false);
      expect(isReactActionError(null)).toBe(false);
      expect(isReactActionError(undefined)).toBe(false);
      expect(isReactActionError('string')).toBe(false);
      expect(isReactActionError({})).toBe(false);
    });

    it('should handle inheritance correctly', () => {
      const error = new ReactActionError('Test error', 'updateUser');

      expect(error instanceof Error).toBe(true);
      expect(error instanceof ReactActionError).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    it('should work with real ActionRegister dispatch', async () => {
      const handler: ActionHandler<TestActions['updateUser']> = jest.fn().mockImplementation((payload) => {
        return { success: true, updated: payload };
      });

      const handlerManager = createActionHandler(registry, 'updateUser', handler, { priority: 10 });
      const unregister = handlerManager.register();

      const result = await registry.dispatchWithResult('updateUser', { id: '123', name: 'John' });

      expect(result.success).toBe(true);
      expect(handler).toHaveBeenCalledWith(
        { id: '123', name: 'John' },
        expect.any(Object)
      );

      unregister();
    });

    it('should handle handler errors in integration', async () => {
      const handler: ActionHandler<TestActions['updateUser']> = jest.fn().mockImplementation(() => {
        throw new Error('Handler error');
      });

      const handlerManager = createActionHandler(registry, 'updateUser', handler, { blocking: true });
      const unregister = handlerManager.register();

      await expect(registry.dispatch('updateUser', { id: '123', name: 'John' }))
        .rejects.toThrow('Handler error');

      unregister();
    });

    it('should integrate with ReactDevUtils logging', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      ReactDevUtils.enableDebugMode();

      const handler: ActionHandler<TestActions['updateUser']> = jest.fn();
      const handlerManager = createActionHandler(registry, 'updateUser', handler, { id: 'test-integration' });

      handlerManager.register();

      // Simulate component logging
      ReactDevUtils.log('UserComponent', 'updateUser', 'Handler integrated', {
        handlerId: handlerManager.config.id
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        '🎯 [React-ActionRegister] [UserComponent] updateUser: Handler integrated',
        { handlerId: 'test-integration' }
      );

      consoleSpy.mockRestore();
    });

    it('should handle multiple handler managers for same action', () => {
      const handler1: ActionHandler<TestActions['updateUser']> = jest.fn();
      const handler2: ActionHandler<TestActions['updateUser']> = jest.fn();

      const manager1 = createActionHandler(registry, 'updateUser', handler1, { priority: 10 });
      const manager2 = createActionHandler(registry, 'updateUser', handler2, { priority: 20 });

      const unregister1 = manager1.register();
      const unregister2 = manager2.register();

      expect(registry.getHandlerCount('updateUser')).toBe(2);

      unregister1();
      expect(registry.getHandlerCount('updateUser')).toBe(1);

      unregister2();
      expect(registry.getHandlerCount('updateUser')).toBe(0);
    });
  });

  describe('Memory Management', () => {
    it('should clean up handlers properly', () => {
      const handlers: Array<() => void> = [];

      // Create multiple handlers
      for (let i = 0; i < 10; i++) {
        const handler: ActionHandler<TestActions['updateUser']> = jest.fn();
        const manager = createActionHandler(registry, 'updateUser', handler);
        handlers.push(manager.registerWithCleanup());
      }

      expect(registry.getHandlerCount('updateUser')).toBe(10);

      // Clean up all handlers
      handlers.forEach(cleanup => cleanup());

      expect(registry.getHandlerCount('updateUser')).toBe(0);
    });

    it('should handle registry destruction', () => {
      const handler: ActionHandler<TestActions['updateUser']> = jest.fn();
      const manager = createActionHandler(registry, 'updateUser', handler);
      
      manager.register();
      expect(registry.getHandlerCount('updateUser')).toBe(1);

      registry.destroy();

      expect(registry.getHandlerCount('updateUser')).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in action names', () => {
      const specialActionRegistry = registry as any;
      const handler: ActionHandler<any> = jest.fn();
      
      const manager = createActionHandler(specialActionRegistry, 'action-with-dashes', handler);
      
      expect(manager.config.id).toMatch(/^react_action-with-dashes_\d+_[a-z0-9]{5}$/);
    });

    it('should handle very high and low priorities', () => {
      const handler: ActionHandler<TestActions['updateUser']> = jest.fn();
      
      const highPriorityManager = createActionHandler(registry, 'updateUser', handler, { 
        priority: Number.MAX_SAFE_INTEGER 
      });
      const lowPriorityManager = createActionHandler(registry, 'updateUser', handler, { 
        priority: Number.MIN_SAFE_INTEGER 
      });

      expect(highPriorityManager.config.priority).toBe(Number.MAX_SAFE_INTEGER);
      expect(lowPriorityManager.config.priority).toBe(Number.MIN_SAFE_INTEGER);
    });

    it('should handle registration state edge cases', () => {
      const handler: ActionHandler<TestActions['updateUser']> = jest.fn();
      const manager = createActionHandler(registry, 'updateUser', handler);

      // Unregister before register should be safe
      manager.unregister();
      expect(registry.getHandlerCount('updateUser')).toBe(0);

      // Register normally
      const unregister = manager.register();
      expect(registry.getHandlerCount('updateUser')).toBe(1);

      // Manual unregister then manager unregister should be safe
      unregister();
      manager.unregister();
      expect(registry.getHandlerCount('updateUser')).toBe(0);
    });
  });
});