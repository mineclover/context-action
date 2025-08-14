/**
 * Edge case tests - Boundary conditions and unusual scenarios
 */

import { ActionRegister, type ActionPayloadMap } from '../../src';

interface EdgeCaseActions extends ActionPayloadMap {
  normalAction: { value: string };
  voidAction: void;
  nullAction: null;
  numberAction: number;
  booleanAction: boolean;
  arrayAction: any[];
  objectAction: Record<string, any>;
  nestedAction: { 
    deep: { 
      very: { 
        nested: { 
          data: string; 
          values: number[] 
        } 
      } 
    } 
  };
  circularAction: { self?: any };
  bigDataAction: { data: string; metadata: Record<string, any> };
}

describe('ActionRegister - Edge Cases and Boundary Conditions', () => {
  let actionRegister: ActionRegister<EdgeCaseActions>;

  beforeEach(() => {
    actionRegister = new ActionRegister<EdgeCaseActions>({
      name: 'EdgeCaseTestRegister'
    });
  });

  afterEach(() => {
    actionRegister.clearAll();
    jest.clearAllMocks();
  });

  describe('🔍 Payload Edge Cases', () => {
    it('should handle null payload', async () => {
      const handler = jest.fn();
      actionRegister.register('nullAction', handler);

      await actionRegister.dispatch('nullAction', null);

      expect(handler).toHaveBeenCalledWith(null, expect.any(Object));
    });

    it('should handle undefined payload for non-void actions', async () => {
      const handler = jest.fn();
      actionRegister.register('normalAction', handler);

      await actionRegister.dispatch('normalAction', undefined as any);

      expect(handler).toHaveBeenCalledWith(undefined, expect.any(Object));
    });

    it('should handle empty object payload', async () => {
      const handler = jest.fn();
      actionRegister.register('objectAction', handler);

      await actionRegister.dispatch('objectAction', {});

      expect(handler).toHaveBeenCalledWith({}, expect.any(Object));
    });

    it('should handle empty array payload', async () => {
      const handler = jest.fn();
      actionRegister.register('arrayAction', handler);

      await actionRegister.dispatch('arrayAction', []);

      expect(handler).toHaveBeenCalledWith([], expect.any(Object));
    });

    it('should handle zero and negative numbers', async () => {
      const handler = jest.fn();
      actionRegister.register('numberAction', handler);

      await actionRegister.dispatch('numberAction', 0);
      await actionRegister.dispatch('numberAction', -1);
      await actionRegister.dispatch('numberAction', -999.99);

      expect(handler).toHaveBeenNthCalledWith(1, 0, expect.any(Object));
      expect(handler).toHaveBeenNthCalledWith(2, -1, expect.any(Object));
      expect(handler).toHaveBeenNthCalledWith(3, -999.99, expect.any(Object));
    });

    it('should handle boolean false', async () => {
      const handler = jest.fn();
      actionRegister.register('booleanAction', handler);

      await actionRegister.dispatch('booleanAction', false);

      expect(handler).toHaveBeenCalledWith(false, expect.any(Object));
    });

    it('should handle deeply nested objects', async () => {
      const handler = jest.fn();
      actionRegister.register('nestedAction', handler);

      const deepPayload = {
        deep: {
          very: {
            nested: {
              data: 'test-value',
              values: [1, 2, 3, 4, 5]
            }
          }
        }
      };

      await actionRegister.dispatch('nestedAction', deepPayload);

      expect(handler).toHaveBeenCalledWith(deepPayload, expect.any(Object));
    });

    it('should handle circular reference objects safely', async () => {
      const handler = jest.fn();
      actionRegister.register('circularAction', handler);

      const circularPayload: any = { value: 'test' };
      circularPayload.self = circularPayload;

      await expect(actionRegister.dispatch('circularAction', circularPayload)).resolves.not.toThrow();
      expect(handler).toHaveBeenCalledWith(circularPayload, expect.any(Object));
    });

    it('should handle very large payloads', async () => {
      const handler = jest.fn();
      actionRegister.register('bigDataAction', handler);

      const largeString = 'x'.repeat(100000); // 100KB string
      const largeMetadata: Record<string, any> = {};
      for (let i = 0; i < 1000; i++) {
        largeMetadata[`key${i}`] = `value${i}`.repeat(100);
      }

      const bigPayload = {
        data: largeString,
        metadata: largeMetadata
      };

      await actionRegister.dispatch('bigDataAction', bigPayload);

      expect(handler).toHaveBeenCalledWith(bigPayload, expect.any(Object));
    });
  });

  describe('🎯 Handler Edge Cases', () => {
    it('should handle handler that returns undefined', async () => {
      const handler = jest.fn(() => undefined);
      actionRegister.register('normalAction', handler);

      const result = await actionRegister.dispatchWithResult('normalAction', { value: 'test' });

      expect(result.result).toBeUndefined();
      expect(result.success).toBe(true);
    });

    it('should handle handler that returns null', async () => {
      const handler = jest.fn(() => null);
      actionRegister.register('normalAction', handler);

      const result = await actionRegister.dispatchWithResult('normalAction', { value: 'test' });

      expect(result.result).toBeNull();
      expect(result.success).toBe(true);
    });

    it('should handle handler that returns 0', async () => {
      const handler = jest.fn(() => 0);
      actionRegister.register('normalAction', handler);

      const result = await actionRegister.dispatchWithResult('normalAction', { value: 'test' });

      expect(result.result).toBe(0);
      expect(result.success).toBe(true);
    });

    it('should handle handler that returns false', async () => {
      const handler = jest.fn(() => false);
      actionRegister.register('normalAction', handler);

      const result = await actionRegister.dispatchWithResult('normalAction', { value: 'test' });

      expect(result.result).toBe(false);
      expect(result.success).toBe(true);
    });

    it('should handle handler that returns empty string', async () => {
      const handler = jest.fn(() => '');
      actionRegister.register('normalAction', handler);

      const result = await actionRegister.dispatchWithResult('normalAction', { value: 'test' });

      expect(result.result).toBe('');
      expect(result.success).toBe(true);
    });

    it('should handle handler that returns empty array', async () => {
      const handler = jest.fn(() => []);
      actionRegister.register('normalAction', handler);

      const result = await actionRegister.dispatchWithResult('normalAction', { value: 'test' });

      expect(result.result).toEqual([]);
      expect(result.success).toBe(true);
    });

    it('should handle handler that returns empty object', async () => {
      const handler = jest.fn(() => ({}));
      actionRegister.register('normalAction', handler);

      const result = await actionRegister.dispatchWithResult('normalAction', { value: 'test' });

      expect(result.result).toEqual({});
      expect(result.success).toBe(true);
    });

    it('should handle handler that takes very long to execute', async () => {
      const handler = jest.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'long-running-result';
      });
      actionRegister.register('normalAction', handler);

      const startTime = Date.now();
      const result = await actionRegister.dispatchWithResult('normalAction', { value: 'test' });
      const endTime = Date.now();

      expect(result.result).toBe('long-running-result');
      expect(endTime - startTime).toBeGreaterThanOrEqual(90);
      expect(result.execution.duration).toBeGreaterThanOrEqual(90);
    });

    it('should handle handler that throws non-Error objects', async () => {
      actionRegister.register('normalAction', () => {
        throw 'string error';
      }, { priority: 20 });

      actionRegister.register('normalAction', () => {
        throw { custom: 'error object' };
      }, { priority: 15 });

      actionRegister.register('normalAction', () => {
        throw 12345;
      }, { priority: 10 });

      actionRegister.register('normalAction', () => {
        return 'success';
      }, { priority: 5 });

      const result = await actionRegister.dispatchWithResult('normalAction', 
        { value: 'test' }, 
        { result: { collect: true } }
      );

      expect(result.success).toBe(true);
      expect(result.results).toEqual(['success']);
    });
  });

  describe('🔧 Registration Edge Cases', () => {
    it('should handle registering empty string as handler ID', () => {
      const handler = jest.fn();

      expect(() => {
        actionRegister.register('normalAction', handler, { id: '' });
      }).not.toThrow();
    });

    it('should handle registering with extreme priority values', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      const handler3 = jest.fn();

      actionRegister.register('normalAction', handler1, { priority: Number.MAX_SAFE_INTEGER });
      actionRegister.register('normalAction', handler2, { priority: Number.MIN_SAFE_INTEGER });
      actionRegister.register('normalAction', handler3, { priority: 0 });

      expect(actionRegister.getHandlerCount('normalAction')).toBe(3);
    });

    it('should handle registering with NaN priority', () => {
      const handler = jest.fn();

      expect(() => {
        actionRegister.register('normalAction', handler, { priority: NaN });
      }).not.toThrow();
    });

    it('should handle registering with Infinity priority', () => {
      const handler = jest.fn();

      actionRegister.register('normalAction', handler, { priority: Infinity });
      actionRegister.register('normalAction', handler, { priority: -Infinity });

      expect(actionRegister.getHandlerCount('normalAction')).toBe(2);
    });

    it('should handle registering hundreds of handlers', () => {
      for (let i = 0; i < 500; i++) {
        actionRegister.register('normalAction', jest.fn(), { id: `handler-${i}` });
      }

      expect(actionRegister.getHandlerCount('normalAction')).toBe(500);
    });

    it('should handle rapid registration and unregistration', () => {
      const unregisterFunctions: (() => void)[] = [];

      // Rapid registration
      for (let i = 0; i < 100; i++) {
        const unregister = actionRegister.register('normalAction', jest.fn(), { id: `rapid-${i}` });
        unregisterFunctions.push(unregister);
      }

      expect(actionRegister.getHandlerCount('normalAction')).toBe(100);

      // Rapid unregistration
      unregisterFunctions.forEach(unregister => unregister());

      expect(actionRegister.getHandlerCount('normalAction')).toBe(0);
    });
  });

  describe('🎛️ Controller Edge Cases', () => {
    it('should handle multiple abort calls', async () => {
      actionRegister.register('normalAction', (payload, controller) => {
        controller.abort('First abort');
        controller.abort('Second abort');
        controller.abort('Third abort');
      });

      const result = await actionRegister.dispatchWithResult('normalAction', { value: 'test' });

      expect(result.aborted).toBe(true);
      expect(result.abortReason).toBe('First abort'); // Should use first abort reason
    });

    it('should handle multiple return calls', async () => {
      actionRegister.register('normalAction', (payload, controller) => {
        controller.return('First return');
        controller.return('Second return');
        controller.return('Third return');
      });

      const result = await actionRegister.dispatchWithResult('normalAction', { value: 'test' });

      expect(result.terminated).toBe(true);
      expect(result.result).toBe('First return'); // Should use first return value
    });

    it('should handle return after abort', async () => {
      actionRegister.register('normalAction', (payload, controller) => {
        controller.abort('Aborted');
        controller.return('Returned'); // Should be ignored
      });

      const result = await actionRegister.dispatchWithResult('normalAction', { value: 'test' });

      expect(result.aborted).toBe(true);
      expect(result.terminated).toBe(false);
      expect(result.abortReason).toBe('Aborted');
    });

    it('should handle abort after return', async () => {
      actionRegister.register('normalAction', (payload, controller) => {
        controller.return('Returned');
        controller.abort('Aborted'); // Should be ignored
      });

      const result = await actionRegister.dispatchWithResult('normalAction', { value: 'test' });

      expect(result.terminated).toBe(true);
      expect(result.aborted).toBe(false);
      expect(result.result).toBe('Returned');
    });

    it('should handle modifyPayload with null/undefined', async () => {
      let finalPayload: any;

      actionRegister.register('normalAction', (payload, controller) => {
        controller.modifyPayload(() => null);
      }, { priority: 20 });

      actionRegister.register('normalAction', (payload, controller) => {
        finalPayload = payload;
        controller.modifyPayload(() => undefined);
      }, { priority: 10 });

      await actionRegister.dispatch('normalAction', { value: 'original' });

      expect(finalPayload).toBeNull();
    });

    it('should handle setResult with various falsy values', async () => {
      actionRegister.register('normalAction', (payload, controller) => {
        controller.setResult(null);
        controller.setResult(undefined);
        controller.setResult(false);
        controller.setResult(0);
        controller.setResult('');
        controller.setResult([]);
        controller.setResult({});
      });

      const result = await actionRegister.dispatchWithResult('normalAction', 
        { value: 'test' },
        { result: { collect: true } }
      );

      expect(result.results).toEqual([null, undefined, false, 0, '', [], {}]);
    });

    it('should handle getResults with no previous handlers', async () => {
      actionRegister.register('normalAction', (payload, controller) => {
        const results = controller.getResults();
        expect(results).toEqual([]);
        return 'only-result';
      });

      const result = await actionRegister.dispatchWithResult('normalAction', { value: 'test' });

      expect(result.result).toBe('only-result');
    });
  });

  describe('📊 Execution Statistics Edge Cases', () => {
    it('should handle execution with no handlers', async () => {
      const result = await actionRegister.dispatchWithResult('normalAction', { value: 'test' });

      expect(result.success).toBe(true);
      expect(result.execution.handlersExecuted).toBe(0);
      expect(result.execution.duration).toBeGreaterThanOrEqual(0);
      expect(result.execution.startTime).toBeGreaterThan(0);
      expect(result.execution.endTime).toBeGreaterThanOrEqual(result.execution.startTime);
    });

    it('should handle extremely fast execution', async () => {
      actionRegister.register('normalAction', () => 'fast');

      const result = await actionRegister.dispatchWithResult('normalAction', { value: 'test' });

      expect(result.execution.duration).toBeGreaterThanOrEqual(0);
      expect(result.execution.duration).toBeLessThan(10); // Should be very fast
    });

    it('should track statistics across multiple dispatches', async () => {
      actionRegister.register('normalAction', () => 'result');

      for (let i = 0; i < 10; i++) {
        const result = await actionRegister.dispatchWithResult('normalAction', { value: `test-${i}` });
        expect(result.execution.handlersExecuted).toBe(1);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('🔄 Concurrent Execution Edge Cases', () => {
    it('should handle concurrent dispatches to same action', async () => {
      let executionCount = 0;
      actionRegister.register('normalAction', async () => {
        executionCount++;
        await new Promise(resolve => setTimeout(resolve, 10));
        return `result-${executionCount}`;
      });

      const promises = Array.from({ length: 10 }, (_, i) =>
        actionRegister.dispatchWithResult('normalAction', { value: `concurrent-${i}` })
      );

      const results = await Promise.all(promises);

      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.result).toMatch(/result-\d+/);
      });

      expect(executionCount).toBe(10);
    });

    it('should handle concurrent dispatches to different actions', async () => {
      actionRegister.register('normalAction', async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
        return 'normal-result';
      });

      actionRegister.register('voidAction', async () => {
        await new Promise(resolve => setTimeout(resolve, 15));
        return 'void-result';
      });

      actionRegister.register('numberAction', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'number-result';
      });

      const [normalResult, voidResult, numberResult] = await Promise.all([
        actionRegister.dispatchWithResult('normalAction', { value: 'test' }),
        actionRegister.dispatchWithResult('voidAction'),
        actionRegister.dispatchWithResult('numberAction', 42)
      ]);

      expect(normalResult.result).toBe('normal-result');
      expect(voidResult.result).toBe('void-result');
      expect(numberResult.result).toBe('number-result');
    });
  });

  describe('🧹 Memory and Cleanup Edge Cases', () => {
    it('should handle clearAll with many handlers', () => {
      // Register many handlers across multiple actions
      for (let action of ['normalAction', 'voidAction', 'numberAction', 'booleanAction']) {
        for (let i = 0; i < 100; i++) {
          actionRegister.register(action as keyof EdgeCaseActions, jest.fn(), { id: `${action}-${i}` });
        }
      }

      expect(actionRegister.getRegisteredActions()).toHaveLength(4);
      expect(actionRegister.getHandlerCount('normalAction')).toBe(100);

      actionRegister.clearAll();

      expect(actionRegister.getRegisteredActions()).toHaveLength(0);
      expect(actionRegister.getHandlerCount('normalAction')).toBe(0);
    });

    it('should handle repeated clearAll calls', () => {
      actionRegister.register('normalAction', jest.fn());

      actionRegister.clearAll();
      actionRegister.clearAll();
      actionRegister.clearAll();

      expect(actionRegister.getRegisteredActions()).toHaveLength(0);
    });

    it('should clean up once handlers properly', async () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      const handler3 = jest.fn();

      actionRegister.register('normalAction', handler1, { once: true });
      actionRegister.register('normalAction', handler2, { once: true });
      actionRegister.register('normalAction', handler3); // Not once

      expect(actionRegister.getHandlerCount('normalAction')).toBe(3);

      await actionRegister.dispatch('normalAction', { value: 'test' });

      expect(actionRegister.getHandlerCount('normalAction')).toBe(1); // Only non-once handler remains
      expect(actionRegister.hasHandlers('normalAction')).toBe(true);
    });
  });

  describe('⚠️ Configuration Edge Cases', () => {
    it('should handle invalid execution mode gracefully', () => {
      expect(() => {
        actionRegister.setActionExecutionMode('normalAction', 'invalid-mode' as any);
      }).not.toThrow();

      // Should fall back to default or handle gracefully
      expect(actionRegister.getActionExecutionMode('normalAction')).toBeTruthy();
    });

    it('should handle execution mode for non-existent actions', () => {
      expect(() => {
        actionRegister.setActionExecutionMode('nonExistentAction' as any, 'parallel');
      }).not.toThrow();

      expect(actionRegister.getActionExecutionMode('nonExistentAction' as any)).toBeTruthy();
    });

    it('should handle removing execution mode for non-existent actions', () => {
      expect(() => {
        actionRegister.removeActionExecutionMode('nonExistentAction' as any);
      }).not.toThrow();
    });
  });
});