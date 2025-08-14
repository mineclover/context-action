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
        maxHandlers: 50,
        autoCleanup: true
      }
    });
    jest.useFakeTimers();
  });

  afterEach(() => {
    actionRegister.clearAll();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('Advanced Handler Configuration', () => {
    it('should handle debounced handlers', async () => {
      let executionCount = 0;
      
      actionRegister.register('debounceAction', () => {
        executionCount++;
        return { executed: true, count: executionCount };
      }, {
        debounce: 100,
        id: 'debounced-handler'
      });

      // Rapid successive calls
      actionRegister.dispatch('debounceAction', { value: 'call1' });
      actionRegister.dispatch('debounceAction', { value: 'call2' });
      actionRegister.dispatch('debounceAction', { value: 'call3' });

      // Wait less than debounce time
      jest.advanceTimersByTime(50);
      expect(executionCount).toBe(0);

      // Add another call within debounce window
      actionRegister.dispatch('debounceAction', { value: 'call4' });

      // Wait for debounce to complete
      jest.advanceTimersByTime(100);
      
      expect(executionCount).toBe(1); // Only executed once despite 4 calls
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

      // Wait for throttle window to pass
      jest.advanceTimersByTime(100);

      // Next call should execute
      await actionRegister.dispatch('throttleAction', { timestamp: 4 });
      expect(executionCount).toBe(2);
      expect(executionValues).toEqual(['exec-1', 'exec-4']);
    });

    it('should handle handler validation', async () => {
      let validExecutions = 0;
      let invalidAttempts = 0;

      actionRegister.register('conditionalAction', (payload) => {
        validExecutions++;
        return { processed: true, data: payload.data };
      }, {
        validation: (payload) => {
          if (!payload.condition) {
            invalidAttempts++;
            return false;
          }
          return true;
        },
        id: 'validated-handler'
      });

      // Valid payload
      await actionRegister.dispatch('conditionalAction', { condition: true, data: 'valid' });
      
      // Invalid payload
      await actionRegister.dispatch('conditionalAction', { condition: false, data: 'invalid' });
      
      // Another valid payload
      await actionRegister.dispatch('conditionalAction', { condition: true, data: 'valid2' });

      expect(validExecutions).toBe(2);
      expect(invalidAttempts).toBe(1);
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

      actionRegister.register('complexWorkflow', () => {
        executionLog.push('handler-a');
        return 'result-a';
      }, {
        id: 'handler-a',
        conflicts: ['handler-b']
      });

      actionRegister.register('complexWorkflow', () => {
        executionLog.push('handler-b');
        return 'result-b';
      }, {
        id: 'handler-b',
        priority: 10 // Lower priority, should be skipped due to conflict
      });

      actionRegister.register('complexWorkflow', () => {
        executionLog.push('handler-c');
        return 'result-c';
      }, {
        id: 'handler-c'
      });

      const result = await actionRegister.dispatchWithResult('complexWorkflow', {
        data: 'test'
      }, { result: { collect: true } });

      expect(executionLog).toEqual(['handler-a', 'handler-c']);
      expect(result.results).toHaveLength(2);
      expect(result.execution.handlersSkipped).toBe(1);
    });
  });

  describe('Environment & Feature Flags', () => {
    it('should respect environment-specific handlers', async () => {
      const executionLog: string[] = [];

      actionRegister.register('dynamicAction', () => {
        executionLog.push('development');
        return 'dev-result';
      }, {
        environment: 'development',
        id: 'dev-handler'
      });

      actionRegister.register('dynamicAction', () => {
        executionLog.push('production');
        return 'prod-result';
      }, {
        environment: 'production',
        id: 'prod-handler'
      });

      actionRegister.register('dynamicAction', () => {
        executionLog.push('universal');
        return 'universal-result';
      }, {
        id: 'universal-handler'
      });

      // Mock development environment
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

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
        await new Promise(resolve => setTimeout(resolve, 50));
        return { step: 'validation', duration: 50 };
      }, {
        id: 'validation-handler',
        metrics: {
          collectTiming: true,
          collectErrors: true,
          customMetrics: { type: 'validation' }
        }
      });

      actionRegister.register('complexWorkflow', async () => {
        await new Promise(resolve => setTimeout(resolve, 30));
        throw new Error('Processing failed');
      }, {
        id: 'processing-handler',
        metrics: {
          collectTiming: true,
          collectErrors: true,
          customMetrics: { type: 'processing' }
        }
      });

      const dispatchPromise = actionRegister.dispatchWithResult('complexWorkflow', {
        data: 'test'
      }, { result: { collect: true } });

      jest.advanceTimersByTime(100);
      const result = await dispatchPromise;

      // Check handler-level metrics
      expect(result.handlers).toHaveLength(2);
      
      const validationHandler = result.handlers.find(h => h.id === 'validation-handler');
      expect(validationHandler?.executed).toBe(true);
      expect(validationHandler?.duration).toBeGreaterThan(0);
      expect(validationHandler?.metadata).toHaveProperty('type', 'validation');

      const processingHandler = result.handlers.find(h => h.id === 'processing-handler');
      expect(processingHandler?.executed).toBe(true);
      expect(processingHandler?.error).toBeInstanceOf(Error);
    });

    it('should handle timeout configurations', async () => {
      actionRegister.register('complexWorkflow', async () => {
        await new Promise(resolve => setTimeout(resolve, 200)); // Longer than timeout
        return 'should-not-complete';
      }, {
        id: 'slow-handler',
        timeout: 100
      });

      actionRegister.register('complexWorkflow', async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return 'fast-completion';
      }, {
        id: 'fast-handler'
      });

      const dispatchPromise = actionRegister.dispatchWithResult('complexWorkflow', {
        data: 'test'
      }, { result: { collect: true } });

      jest.advanceTimersByTime(250);
      const result = await dispatchPromise;

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].handlerId).toBe('slow-handler');
      expect(result.results).toContainEqual('fast-completion');
    });

    it('should handle retry configurations', async () => {
      let attemptCount = 0;

      actionRegister.register('complexWorkflow', () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error(`Attempt ${attemptCount} failed`);
        }
        return { success: true, attempts: attemptCount };
      }, {
        id: 'retry-handler',
        retries: 2
      });

      const result = await actionRegister.dispatchWithResult('complexWorkflow', {
        data: 'test'
      });

      expect(attemptCount).toBe(3); // Initial + 2 retries
      expect(result.success).toBe(true);
      expect(result.result).toEqual({ success: true, attempts: 3 });
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
          maxResults: 5,
          strategy: 'all'
        },
        filter: {
          custom: (config) => config.id?.includes('handler') && 
                             parseInt(config.id.split('-')[1]) <= 7
        }
      });

      expect(result.results).toHaveLength(5); // Limited by maxResults
      expect(result.execution.handlersExecuted).toBe(7); // Limited by filter
      expect(result.results.every((r: any) => r.handlerIndex <= 5)).toBe(true); // First 5 due to limit
    });
  });

  describe('Memory Management & Cleanup', () => {
    it('should properly cleanup resources on clearAll', () => {
      // Register many handlers
      for (let i = 0; i < 20; i++) {
        actionRegister.register('complexWorkflow', jest.fn(), { id: `handler-${i}` });
      }

      expect(actionRegister.getRegisteredActions()).toHaveLength(1);
      expect(actionRegister.getHandlers('complexWorkflow')).toHaveLength(20);

      actionRegister.clearAll();

      expect(actionRegister.getRegisteredActions()).toHaveLength(0);
      expect(actionRegister.getHandlers('complexWorkflow')).toHaveLength(0);
    });

    it('should handle automatic cleanup for once handlers', async () => {
      for (let i = 0; i < 5; i++) {
        actionRegister.register('dynamicAction', jest.fn(() => `result-${i}`), {
          id: `once-handler-${i}`,
          once: true
        });
      }

      expect(actionRegister.getHandlers('dynamicAction')).toHaveLength(5);

      await actionRegister.dispatch('dynamicAction', 'test-payload');

      expect(actionRegister.getHandlers('dynamicAction')).toHaveLength(0);
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

      expect(actionRegister.getHandlers('dynamicAction')).toHaveLength(100);

      // Unregister all
      unregisterFunctions.forEach(unregister => unregister());

      expect(actionRegister.getHandlers('dynamicAction')).toHaveLength(0);
    });
  });
});