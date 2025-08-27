/**
 * Memory Management Tests
 * Tests for v0.4.1 memory management improvements
 */

import { ActionRegister, type ActionPayloadMap } from '../../src';

interface MemoryTestActions extends ActionPayloadMap {
  testAction: { id: string; data: string };
  bulkAction: { items: string[] };
  memoryIntensive: { size: number };
}

describe('Memory Management Tests - v0.4.1', () => {
  let actionRegister: ActionRegister<MemoryTestActions>;

  beforeEach(() => {
    actionRegister = new ActionRegister<MemoryTestActions>({
      name: 'MemoryTestRegistry',
      registry: { debug: false }
    });
  });

  afterEach(() => {
    actionRegister.destroy();
  });

  describe('🧠 Handler Limits', () => {
    it('should respect maxHandlersPerAction limit', () => {
      const limitedRegister = new ActionRegister<MemoryTestActions>({
        registry: { maxHandlersPerAction: 2 }
      });
      
      // 2개까지는 성공
      const unregister1 = limitedRegister.register('testAction', jest.fn());
      const unregister2 = limitedRegister.register('testAction', jest.fn());
      expect(limitedRegister.getHandlerCount('testAction')).toBe(2);
      
      // 3번째는 무시됨
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const unregister3 = limitedRegister.register('testAction', jest.fn());
      
      expect(limitedRegister.getHandlerCount('testAction')).toBe(2);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Handler limit (2) reached')
      );
      expect(typeof unregister3).toBe('function'); // no-op function
      
      consoleSpy.mockRestore();
      limitedRegister.destroy();
    });

    it('should handle default handler limit (1000)', () => {
      const handlers: (() => void)[] = [];
      
      // Register up to limit
      for (let i = 0; i < 1000; i++) {
        const unregister = actionRegister.register('testAction', jest.fn());
        handlers.push(unregister);
      }
      
      expect(actionRegister.getHandlerCount('testAction')).toBe(1000);
      
      // Attempt to exceed limit
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const exceededUnregister = actionRegister.register('testAction', jest.fn());
      
      expect(actionRegister.getHandlerCount('testAction')).toBe(1000);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Handler limit (1000) reached')
      );
      
      consoleSpy.mockRestore();
      
      // Cleanup
      handlers.forEach(unregister => unregister());
    });

    it('should allow configuring custom handler limits', () => {
      const customRegister = new ActionRegister<MemoryTestActions>({
        registry: { maxHandlersPerAction: 5 }
      });
      
      // Register exactly 5 handlers
      for (let i = 0; i < 5; i++) {
        customRegister.register('testAction', jest.fn());
      }
      
      expect(customRegister.getHandlerCount('testAction')).toBe(5);
      
      // 6th should be rejected
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      customRegister.register('testAction', jest.fn());
      
      expect(customRegister.getHandlerCount('testAction')).toBe(5);
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
      customRegister.destroy();
    });

    it('should allow unregistering to make room for new handlers', () => {
      const limitedRegister = new ActionRegister<MemoryTestActions>({
        registry: { maxHandlersPerAction: 3 }
      });
      
      // Fill to capacity
      const unregister1 = limitedRegister.register('testAction', jest.fn());
      const unregister2 = limitedRegister.register('testAction', jest.fn());
      const unregister3 = limitedRegister.register('testAction', jest.fn());
      
      expect(limitedRegister.getHandlerCount('testAction')).toBe(3);
      
      // Remove one handler
      unregister2();
      expect(limitedRegister.getHandlerCount('testAction')).toBe(2);
      
      // Should be able to add again
      const unregister4 = limitedRegister.register('testAction', jest.fn());
      expect(limitedRegister.getHandlerCount('testAction')).toBe(3);
      
      // Cleanup
      unregister1();
      unregister3();
      unregister4();
      limitedRegister.destroy();
    });
  });

  describe('🗑️ Memory Cleanup', () => {
    it('should properly clean up all resources on destroy', () => {
      // Register multiple handlers and actions
      actionRegister.register('testAction', jest.fn());
      actionRegister.register('bulkAction', jest.fn());
      actionRegister.register('memoryIntensive', jest.fn());
      
      expect(actionRegister.getRegisteredActions()).toHaveLength(3);
      expect(actionRegister.getHandlerCount('testAction')).toBe(1);
      
      // Destroy should clean up everything
      actionRegister.destroy();
      
      expect(actionRegister.getRegisteredActions()).toHaveLength(0);
      expect(actionRegister.getHandlerCount('testAction')).toBe(0);
    });

    it('should handle repeated destroy calls safely', () => {
      actionRegister.register('testAction', jest.fn());
      
      // Multiple destroy calls should not cause errors
      expect(() => {
        actionRegister.destroy();
        actionRegister.destroy();
        actionRegister.destroy();
      }).not.toThrow();
    });

    it('should clean up handler references to prevent memory leaks', () => {
      const handler = jest.fn();
      const unregister = actionRegister.register('testAction', handler);
      
      expect(actionRegister.hasHandlers('testAction')).toBe(true);
      
      // Unregister should remove reference
      unregister();
      expect(actionRegister.hasHandlers('testAction')).toBe(false);
      expect(actionRegister.getHandlerCount('testAction')).toBe(0);
      
      // Handler should no longer be called
      actionRegister.dispatch('testAction', { id: 'test', data: 'data' });
      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle large numbers of registrations and cleanup efficiently', () => {
      const startTime = Date.now();
      const unregisterFunctions: (() => void)[] = [];
      
      // Register many handlers
      for (let i = 0; i < 100; i++) {
        const unregister = actionRegister.register('bulkAction', jest.fn());
        unregisterFunctions.push(unregister);
      }
      
      const registrationTime = Date.now() - startTime;
      expect(registrationTime).toBeLessThan(100); // Should be fast
      
      expect(actionRegister.getHandlerCount('bulkAction')).toBe(100);
      
      // Cleanup all at once
      const cleanupStartTime = Date.now();
      unregisterFunctions.forEach(unregister => unregister());
      const cleanupTime = Date.now() - cleanupStartTime;
      
      expect(cleanupTime).toBeLessThan(50); // Cleanup should also be fast
      expect(actionRegister.getHandlerCount('bulkAction')).toBe(0);
    });
  });

  describe('📊 Memory Usage Optimization', () => {
    it('should not accumulate memory with repeated registrations', () => {
      const iterationCount = 50;
      
      for (let i = 0; i < iterationCount; i++) {
        const unregister = actionRegister.register('testAction', jest.fn(), { 
          id: `handler-${i}` 
        });
        
        // Immediately unregister to test cleanup
        unregister();
        
        // Should not accumulate handlers
        expect(actionRegister.getHandlerCount('testAction')).toBe(0);
      }
      
      // The action key remains in registry but with no handlers
      // This is expected behavior - only handlers are cleaned up, not action keys
      expect(actionRegister.getHandlerCount('testAction')).toBe(0);
      expect(actionRegister.hasHandlers('testAction')).toBe(false);
    });

    it('should handle replaceExisting efficiently without memory bloat', () => {
      const handlerId = 'replaceable-handler';
      
      // Register and replace multiple times
      for (let i = 0; i < 20; i++) {
        actionRegister.register('testAction', jest.fn(), { 
          id: handlerId,
          replaceExisting: true
        });
        
        // Should always have only one handler
        expect(actionRegister.getHandlerCount('testAction')).toBe(1);
      }
      
      // Verify only the last handler is present
      const stats = actionRegister.getActionStats('testAction');
      expect(stats?.handlerCount).toBe(1);
    });

    it('should efficiently handle clearAll operations', () => {
      // Create multiple actions with multiple handlers
      for (let actionIndex = 0; actionIndex < 10; actionIndex++) {
        for (let handlerIndex = 0; handlerIndex < 10; handlerIndex++) {
          actionRegister.register('testAction', jest.fn());
          actionRegister.register('bulkAction', jest.fn());
        }
      }
      
      expect(actionRegister.getHandlerCount('testAction')).toBe(100);
      expect(actionRegister.getHandlerCount('bulkAction')).toBe(100);
      
      const startTime = Date.now();
      actionRegister.clearAll();
      const clearTime = Date.now() - startTime;
      
      expect(clearTime).toBeLessThan(50); // Should be fast
      expect(actionRegister.getRegisteredActions()).toHaveLength(0);
    });
  });

  describe('⚡ Performance Under Memory Constraints', () => {
    it('should maintain performance with handler limit warnings', () => {
      const limitedRegister = new ActionRegister<MemoryTestActions>({
        registry: { maxHandlersPerAction: 10 }
      });
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const startTime = Date.now();
      
      // Fill to capacity
      for (let i = 0; i < 10; i++) {
        limitedRegister.register('testAction', jest.fn());
      }
      
      // Attempt to exceed (should be fast despite warnings)
      for (let i = 0; i < 5; i++) {
        limitedRegister.register('testAction', jest.fn());
      }
      
      const totalTime = Date.now() - startTime;
      
      expect(totalTime).toBeLessThan(100);
      expect(limitedRegister.getHandlerCount('testAction')).toBe(10);
      expect(consoleSpy).toHaveBeenCalledTimes(5); // One warning per exceeded registration
      
      consoleSpy.mockRestore();
      limitedRegister.destroy();
    });

    it('should handle dispatch efficiently even with memory limits', async () => {
      const limitedRegister = new ActionRegister<MemoryTestActions>({
        registry: { maxHandlersPerAction: 5 }
      });
      
      // Fill to capacity with working handlers
      for (let i = 0; i < 5; i++) {
        limitedRegister.register('testAction', jest.fn(() => ({ result: i })));
      }
      
      const startTime = Date.now();
      const result = await limitedRegister.dispatchWithResult('testAction', 
        { id: 'perf-test', data: 'test' },
        { result: { collect: true } }
      );
      const dispatchTime = Date.now() - startTime;
      
      expect(dispatchTime).toBeLessThan(50);
      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(5);
      
      limitedRegister.destroy();
    });
  });
});