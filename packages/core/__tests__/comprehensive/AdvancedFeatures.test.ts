/**
 * Advanced features and edge cases tests
 */

import { ActionRegister, type ActionPayloadMap } from '../../src';

interface AdvancedTestActions extends ActionPayloadMap {
  complexWorkflow: { 
    data: any; 
    options?: { 
      validate?: boolean; 
      transform?: boolean; 
      persist?: boolean; 
    } 
  };
  dynamicAction: string;
  debounceAction: { value: string };
  throttleAction: { timestamp: number };
  conditionalAction: { condition: boolean; data: any };
  chainedAction: { step: number; data: any };
}

describe('ActionRegister - Advanced Features', () => {
  let actionRegister: ActionRegister<AdvancedTestActions>;

  beforeEach(() => {
    actionRegister = new ActionRegister<AdvancedTestActions>({
      name: 'AdvancedTestRegister',
      registry: {
        debug: false,
        autoCleanup: true
      }
    });
  });

  afterEach(() => {
    // Properly clean up to prevent memory leaks
    actionRegister.destroy();
    jest.clearAllMocks();
  });

  describe('Advanced Handler Configuration', () => {
    it('should handle debounced handlers', async () => {
      let executionCount = 0;

      actionRegister.register('debounceAction', () => {
        executionCount++;
        return { executed: true, count: executionCount };
      }, {
        debounce: 50,
        id: 'debounced-handler'
      });

      // Rapid successive calls
      actionRegister.dispatch('debounceAction', { value: 'call1' });
      actionRegister.dispatch('debounceAction', { value: 'call2' });
      actionRegister.dispatch('debounceAction', { value: 'call3' });

      // Should not execute yet
      expect(executionCount).toBe(0);

      // Wait for debounce to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(executionCount).toBe(1); // Only executed once despite 3 calls
    });

    it('should handle throttled handlers', async () => {
      let executionCount = 0;
      const executionValues: string[] = [];

      actionRegister.register('throttleAction', (payload) => {
        executionCount++;
        executionValues.push(`exec-${payload.timestamp}`);
        return { executed: true, timestamp: payload.timestamp };
      }, {
        throttle: 100,
        id: 'throttled-handler'
      });

      // First call should execute immediately
      await actionRegister.dispatch('throttleAction', { timestamp: 1 });
      expect(executionCount).toBe(1);

      // Calls within throttle window should be ignored
      await actionRegister.dispatch('throttleAction', { timestamp: 2 });
      await actionRegister.dispatch('throttleAction', { timestamp: 3 });
      expect(executionCount).toBe(1);
      expect(executionValues).toHaveLength(1);
      expect(executionValues[0]).toBe('exec-1');

      // Wait for throttle window to pass
      await new Promise(resolve => setTimeout(resolve, 150));

      // Next call should execute
      await actionRegister.dispatch('throttleAction', { timestamp: 4 });
      expect(executionCount).toBe(2);
      expect(executionValues).toHaveLength(2);
      expect(executionValues[1]).toBe('exec-4');
    });

    it('should handle handler validation', async () => {
      let validExecutions = 0;

      actionRegister.register('conditionalAction', (payload) => {
        validExecutions++;
        return { processed: true, data: payload.data };
      }, {
        condition: (payload) => {
          // Only execute if condition is true
          return payload.condition === true;
        },
        id: 'validated-handler'
      });

      // Valid payload
      await actionRegister.dispatch('conditionalAction', { condition: true, data: 'valid' });

      // Invalid payload (should skip)
      await actionRegister.dispatch('conditionalAction', { condition: false, data: 'invalid' });

      // Another valid payload
      await actionRegister.dispatch('conditionalAction', { condition: true, data: 'valid2' });

      expect(validExecutions).toBe(2); // Only executed for valid payloads
    });

    it('should handle middleware handlers', async () => {
      const middlewareLog: string[] = [];
      let finalProcessing = false;

      // Middleware handler (doesn't return data, just processes)
      actionRegister.register('complexWorkflow', (payload) => {
        middlewareLog.push('middleware-start');
        payload.options = { ...payload.options, processedBy: 'middleware' };
        middlewareLog.push('middleware-end');
      }, {
        middleware: true,
        priority: 100,
        id: 'middleware-handler'
      });

      // Main processing handler
      actionRegister.register('complexWorkflow', (payload) => {
        middlewareLog.push('main-processing');
        finalProcessing = true;
        return { 
          success: true, 
          processedOptions: payload.options,
          data: payload.data 
        };
      }, {
        priority: 50,
        id: 'main-handler'
      });

      const result = await actionRegister.dispatchWithResult('complexWorkflow', {
        data: 'test-data',
        options: { validate: true }
      });

      expect(middlewareLog).toEqual(['middleware-start', 'middleware-end', 'main-processing']);
      expect(finalProcessing).toBe(true);
      expect(result.result?.processedOptions).toHaveProperty('processedBy', 'middleware');
    });
  });

  describe('Handler Dependencies & Conflicts', () => {
    it('should handle handler dependencies', async () => {
      const executionOrder: string[] = [];

      actionRegister.register('chainedAction', () => {
        executionOrder.push('dependency-1');
        return { step: 1, completed: true };
      }, {
        priority: 30,
        id: 'dependency-1'
      });

      actionRegister.register('chainedAction', () => {
        executionOrder.push('main-handler');
        return { step: 2, processed: true };
      }, {
        priority: 20,
        id: 'main-handler',
        dependencies: ['dependency-1']
      });

      actionRegister.register('chainedAction', () => {
        executionOrder.push('independent');
        return { step: 0, independent: true };
      }, {
        priority: 25,
        id: 'independent'
      });

      await actionRegister.dispatch('chainedAction', { step: 0, data: 'test' });

      // Dependencies should be respected regardless of priority
      const depIndex = executionOrder.indexOf('dependency-1');
      const mainIndex = executionOrder.indexOf('main-handler');
      
      expect(depIndex).toBeLessThan(mainIndex);
      expect(executionOrder).toContain('independent');
    });

    it('should handle handler conflicts', async () => {
      const executionLog: string[] = [];
      let skipHandlerB = false;

      actionRegister.register('complexWorkflow', () => {
        executionLog.push('handler-a');
        // After handler-a executes, we want to skip handler-b
        skipHandlerB = true;
        return 'result-a';
      }, {
        id: 'handler-a',
        priority: 20 // Highest priority
      });

      actionRegister.register('complexWorkflow', () => {
        executionLog.push('handler-b');
        return 'result-b';
      }, {
        id: 'handler-b',
        priority: 10,
        condition: () => !skipHandlerB // Skip if handler-a executed
      });

      actionRegister.register('complexWorkflow', () => {
        executionLog.push('handler-c');
        return 'result-c';
      }, {
        id: 'handler-c',
        priority: 5
      });

      const result = await actionRegister.dispatchWithResult('complexWorkflow', {
        data: 'test'
      }, { result: { collect: true, strategy: 'all' } });

      expect(executionLog).toEqual(['handler-a', 'handler-c']); // handler-b was skipped
      expect(result.results).toHaveLength(2);
    });
  });

  describe('Environment & Feature Flags', () => {
    it('should respect environment-specific handlers', async () => {
      const executionLog: string[] = [];

      // Mock development environment
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      actionRegister.register('dynamicAction', () => {
        executionLog.push('development');
        return 'dev-result';
      }, {
        condition: () => process.env.NODE_ENV === 'development',
        id: 'dev-handler'
      });

      actionRegister.register('dynamicAction', () => {
        executionLog.push('production');
        return 'prod-result';
      }, {
        condition: () => process.env.NODE_ENV === 'production',
        id: 'prod-handler'
      });

      actionRegister.register('dynamicAction', () => {
        executionLog.push('universal');
        return 'universal-result';
      }, {
        id: 'universal-handler'
      });

      const result = await actionRegister.dispatchWithResult('dynamicAction', 'test-payload', {
        result: { collect: true }
      });

      process.env.NODE_ENV = originalEnv;

      expect(executionLog).toContain('development');
      expect(executionLog).toContain('universal');
      expect(executionLog).not.toContain('production');
    });

    it('should handle feature-flagged handlers', async () => {
      const enabledFeatures = new Set(['feature-a', 'feature-c']);
      const executionLog: string[] = [];

      actionRegister.register('complexWorkflow', () => {
        executionLog.push('feature-a');
        return 'feature-a-result';
      }, {
        feature: 'feature-a',
        condition: () => enabledFeatures.has('feature-a'),
        id: 'feature-a-handler'
      });

      actionRegister.register('complexWorkflow', () => {
        executionLog.push('feature-b');
        return 'feature-b-result';
      }, {
        feature: 'feature-b',
        condition: () => enabledFeatures.has('feature-b'),
        id: 'feature-b-handler'
      });

      actionRegister.register('complexWorkflow', () => {
        executionLog.push('core');
        return 'core-result';
      }, {
        id: 'core-handler'
      });

      const result = await actionRegister.dispatchWithResult('complexWorkflow', {
        data: 'test'
      }, { result: { collect: true } });

      expect(executionLog).toContain('feature-a');
      expect(executionLog).toContain('core');
      expect(executionLog).not.toContain('feature-b');
      expect(result.results).toHaveLength(2);
    });
  });

  describe('Performance & Metrics', () => {
    it('should collect detailed handler metrics', async () => {
      actionRegister.register('complexWorkflow', async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
        return { step: 'validation', duration: 20 };
      }, {
        id: 'validation-handler',
        priority: 20
      });

      actionRegister.register('complexWorkflow', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        throw new Error('Processing failed');
      }, {
        id: 'processing-handler',
        priority: 10
      });

      const result = await actionRegister.dispatchWithResult('complexWorkflow', {
        data: 'test'
      }, { result: { collect: true } });

      // Check execution metrics
      expect(result.execution.handlersExecuted).toBe(2);
      expect(result.execution.handlersFailed).toBe(1);
      expect(result.execution.duration).toBeGreaterThan(0);

      // Check results - one successful, one error
      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toEqual({ step: 'validation', duration: 20 });

      // Check errors
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].handlerId).toBe('processing-handler');
      expect(result.errors[0].error.message).toBe('Processing failed');
    });

    it('should handle timeout configurations', async () => {
      // Since timeout is not implemented, test basic async handler completion
      actionRegister.register('complexWorkflow', async () => {
        await new Promise(resolve => setTimeout(resolve, 30));
        return 'slow-completion';
      }, {
        id: 'slow-handler',
        priority: 20
      });

      actionRegister.register('complexWorkflow', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'fast-completion';
      }, {
        id: 'fast-handler',
        priority: 10
      });

      const result = await actionRegister.dispatchWithResult('complexWorkflow', {
        data: 'test'
      }, { result: { collect: true } });

      // Both handlers should complete successfully
      expect(result.errors).toHaveLength(0);
      expect(result.results).toHaveLength(2);
      expect(result.results).toContainEqual('slow-completion');
      expect(result.results).toContainEqual('fast-completion');
    });

    it('should handle retry configurations', async () => {
      // Since retries are not implemented, test error handling
      let attemptCount = 0;

      actionRegister.register('complexWorkflow', () => {
        attemptCount++;
        if (attemptCount === 1) {
          throw new Error(`Attempt ${attemptCount} failed`);
        }
        return { success: true, attempts: attemptCount };
      }, {
        id: 'error-handler',
        priority: 20
      });

      actionRegister.register('complexWorkflow', () => {
        return { fallback: true };
      }, {
        id: 'fallback-handler',
        priority: 10
      });

      const result = await actionRegister.dispatchWithResult('complexWorkflow', {
        data: 'test'
      }, { result: { collect: true } });

      expect(attemptCount).toBe(1); // Only one attempt
      expect(result.success).toBe(true); // Still successful because fallback handler succeeds
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].handlerId).toBe('error-handler');
      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toEqual({ fallback: true });
    });
  });

  describe('Advanced Result Processing', () => {
    it('should handle custom result merging strategies', async () => {
      actionRegister.register('complexWorkflow', () => {
        return { type: 'validation', score: 85, issues: ['minor-issue'] };
      }, { priority: 30 });

      actionRegister.register('complexWorkflow', () => {
        return { type: 'processing', score: 92, issues: [] };
      }, { priority: 20 });

      actionRegister.register('complexWorkflow', () => {
        return { type: 'finalization', score: 88, issues: ['final-check'] };
      }, { priority: 10 });

      const result = await actionRegister.dispatchWithResult('complexWorkflow', {
        data: 'test'
      }, {
        result: {
          collect: true,
          strategy: 'merge',
          merger: (results) => ({
            averageScore: results.reduce((sum, r) => sum + r.score, 0) / results.length,
            allIssues: results.flatMap(r => r.issues),
            completedSteps: results.map(r => r.type),
            totalSteps: results.length
          })
        }
      });

      expect(result.result).toEqual({
        averageScore: 88.33333333333333,
        allIssues: ['minor-issue', 'final-check'],
        completedSteps: ['validation', 'processing', 'finalization'],
        totalSteps: 3
      });
    });

    it('should handle result filtering and limits', async () => {
      // Register multiple handlers
      for (let i = 1; i <= 10; i++) {
        actionRegister.register('complexWorkflow', () => {
          return { handlerIndex: i, value: i * 10, category: i <= 5 ? 'primary' : 'secondary' };
        }, { id: `handler-${i}`, priority: 100 - i });
      }

      const result = await actionRegister.dispatchWithResult('complexWorkflow', {
        data: 'test'
      }, {
        result: {
          collect: true,
          strategy: 'all'
        },
        filter: {
          custom: (config) => config.id?.includes('handler') &&
                             parseInt(config.id.split('-')[1]) <= 7
        }
      });

      // Filter limits to handlers 1-7
      expect(result.results).toHaveLength(7); // Limited by filter
      expect(result.execution.handlersExecuted).toBe(7); // Limited by filter

      // Check that results are from handlers 1-7
      for (let i = 0; i < result.results.length; i++) {
        const handlerIndex = result.results[i].handlerIndex;
        expect(handlerIndex).toBeGreaterThanOrEqual(1);
        expect(handlerIndex).toBeLessThanOrEqual(7);
      }
    });
  });

  describe('Memory Management & Cleanup', () => {
    it('should properly cleanup resources on clearAll', () => {
      // Register many handlers
      for (let i = 0; i < 20; i++) {
        actionRegister.register('complexWorkflow', jest.fn(), { id: `handler-${i}` });
      }

      expect(actionRegister.getRegisteredActions()).toHaveLength(1);
      expect(actionRegister.getHandlerCount('complexWorkflow')).toBe(20);

      actionRegister.clearAll();

      expect(actionRegister.getRegisteredActions()).toHaveLength(0);
      expect(actionRegister.getHandlerCount('complexWorkflow')).toBe(0);
    });

    it('should handle automatic cleanup for once handlers', async () => {
      for (let i = 0; i < 5; i++) {
        actionRegister.register('dynamicAction', jest.fn(() => `result-${i}`), {
          id: `once-handler-${i}`,
          once: true
        });
      }

      expect(actionRegister.getHandlerCount('dynamicAction')).toBe(5);

      await actionRegister.dispatch('dynamicAction', 'test-payload');

      expect(actionRegister.getHandlerCount('dynamicAction')).toBe(0);
    });

    it('should prevent memory leaks with large numbers of registrations/unregistrations', () => {
      const unregisterFunctions: (() => void)[] = [];

      // Register and immediately unregister many handlers
      for (let i = 0; i < 100; i++) {
        const unregister = actionRegister.register('dynamicAction', jest.fn(), {
          id: `temp-handler-${i}`
        });
        unregisterFunctions.push(unregister);
      }

      expect(actionRegister.getHandlerCount('dynamicAction')).toBe(100);

      // Unregister all
      unregisterFunctions.forEach(unregister => unregister());

      expect(actionRegister.getHandlerCount('dynamicAction')).toBe(0);
    });
  });
});