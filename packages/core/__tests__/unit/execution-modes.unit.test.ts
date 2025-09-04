/**
 * @fileoverview Unit tests for execution-modes module
 * 
 * Tests the three execution strategies (sequential, parallel, race) in isolation
 * with comprehensive coverage of their specific behaviors and edge cases.
 */

import {
  executeSequential,
  executeParallel,
  executeRace
} from '../../src/execution-modes.js';
import type {
  PipelineContext,
  PipelineController,
  HandlerRegistration,
  HandlerError
} from '../../src/types.js';

describe('Execution Modes Unit Tests', () => {
  // Test helpers
  const createMockHandler = (
    id: string,
    priority: number = 0,
    blocking: boolean = false,
    behavior: 'success' | 'error' | 'async-success' | 'async-error' = 'success',
    result?: any,
    delay: number = 0
  ): HandlerRegistration<any, any> => {
    const handler = jest.fn(async (payload: any, controller: PipelineController<any, any>) => {
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      switch (behavior) {
        case 'success':
          return result;
        case 'error':
          throw new Error(`Error from ${id}`);
        case 'async-success':
          return Promise.resolve(result);
        case 'async-error':
          return Promise.reject(new Error(`Async error from ${id}`));
        default:
          return result;
      }
    });

    return {
      handler,
      config: {
        id,
        priority,
        blocking,
        once: false,
        throttle: undefined,
        debounce: undefined,
        replaceExisting: false,
        cleanup: undefined
      },
      id
    };
  };

  const createMockContext = <T>(
    payload: T,
    handlers: HandlerRegistration<T, any>[]
  ): PipelineContext<T, any> => ({
    action: 'testAction',
    payload,
    handlers,
    aborted: false,
    abortReason: undefined,
    currentIndex: 0,
    jumpToPriority: undefined,
    executionMode: 'sequential',
    results: [],
    terminated: false,
    terminationResult: undefined
  });

  const createMockController = (context: PipelineContext<any, any>): PipelineController<any, any> => ({
    abort: (reason?: string) => {
      context.aborted = true;
      context.abortReason = reason;
    },
    modifyPayload: (modifier) => {
      context.payload = modifier(context.payload);
    },
    getPayload: () => context.payload,
    jumpToPriority: (priority) => {
      context.jumpToPriority = priority;
    },
    return: (result) => {
      context.terminated = true;
      context.terminationResult = result;
    },
    setResult: (result) => {
      context.results.push(result);
    },
    getResults: () => [...context.results],
    mergeResult: (merger) => {
      const currentResult = context.results[context.results.length - 1];
      const previousResults = context.results.slice(0, -1);
      const mergedResult = merger(previousResults, currentResult);
      context.results[context.results.length - 1] = mergedResult;
    }
  });

  describe('executeSequential', () => {
    it('should execute handlers one by one in order', async () => {
      const executionOrder: string[] = [];
      const handler1 = createMockHandler('handler1', 10);
      const handler2 = createMockHandler('handler2', 5);
      const handler3 = createMockHandler('handler3', 1);

      handler1.handler.mockImplementation(() => {
        executionOrder.push('handler1');
        return 'result1';
      });
      handler2.handler.mockImplementation(() => {
        executionOrder.push('handler2');
        return 'result2';
      });
      handler3.handler.mockImplementation(() => {
        executionOrder.push('handler3');
        return 'result3';
      });

      const context = createMockContext('test-payload', [handler1, handler2, handler3]);
      const createController = jest.fn(() => createMockController(context));

      await executeSequential(context, createController);

      expect(executionOrder).toEqual(['handler1', 'handler2', 'handler3']);
      expect(context.results).toEqual(['result1', 'result2', 'result3']);
    });

    it('should handle blocking handlers correctly', async () => {
      const blockingHandler = createMockHandler('blocking', 10, true, 'async-success', 'blocked-result', 50);
      const normalHandler = createMockHandler('normal', 5, false, 'success', 'normal-result');

      const context = createMockContext('test-payload', [blockingHandler, normalHandler]);
      const createController = jest.fn(() => createMockController(context));

      const startTime = Date.now();
      await executeSequential(context, createController);
      const duration = Date.now() - startTime;

      expect(duration).toBeGreaterThanOrEqual(45); // Should wait for blocking handler
      expect(context.results).toEqual(['blocked-result', 'normal-result']);
    });

    it('should handle non-blocking handlers correctly', async () => {
      const nonBlockingHandler = createMockHandler('non-blocking', 10, false, 'async-success', 'nb-result', 50);
      const quickHandler = createMockHandler('quick', 5, false, 'success', 'quick-result');

      const context = createMockContext('test-payload', [nonBlockingHandler, quickHandler]);
      const createController = jest.fn(() => createMockController(context));

      const startTime = Date.now();
      await executeSequential(context, createController);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(30); // Should not wait for non-blocking handler
      expect(context.results).toEqual(['quick-result']); // Quick handler result immediate

      // Wait for non-blocking handler to complete
      await new Promise(resolve => setTimeout(resolve, 60));
      expect(context.results).toEqual(['quick-result', 'nb-result']); // Non-blocking result added later
    });

    it('should abort execution when context.aborted is true', async () => {
      const handler1 = createMockHandler('handler1', 10);
      const handler2 = createMockHandler('handler2', 5);
      const abortingHandler = createMockHandler('aborting', 0);

      handler1.handler.mockImplementation(() => 'result1');
      abortingHandler.handler.mockImplementation((payload, controller) => {
        controller.abort('Test abort');
        return 'abort-result';
      });
      handler2.handler.mockImplementation(() => 'result2');

      const context = createMockContext('test-payload', [handler1, abortingHandler, handler2]);
      const createController = jest.fn(() => createMockController(context));

      await executeSequential(context, createController);

      expect(context.aborted).toBe(true);
      expect(context.abortReason).toBe('Test abort');
      expect(context.results).toEqual(['result1', 'abort-result']);
      expect(handler2.handler).not.toHaveBeenCalled();
    });

    it('should handle termination via controller.return()', async () => {
      const handler1 = createMockHandler('handler1', 10);
      const terminatingHandler = createMockHandler('terminating', 5);
      const handler3 = createMockHandler('handler3', 0);

      handler1.handler.mockImplementation(() => 'result1');
      terminatingHandler.handler.mockImplementation((payload, controller) => {
        controller.return('termination-result');
        return 'handler-result';
      });
      handler3.handler.mockImplementation(() => 'result3');

      const context = createMockContext('test-payload', [handler1, terminatingHandler, handler3]);
      const createController = jest.fn(() => createMockController(context));

      await executeSequential(context, createController);

      expect(context.terminated).toBe(true);
      expect(context.terminationResult).toBe('termination-result');
      expect(context.results).toEqual(['result1', 'handler-result']);
      expect(handler3.handler).not.toHaveBeenCalled();
    });

    it('should handle priority jumping', async () => {
      const lowPriorityHandler = createMockHandler('low', 1);
      const highPriorityHandler = createMockHandler('high', 10);
      const mediumPriorityHandler = createMockHandler('medium', 5);

      const executionOrder: string[] = [];

      lowPriorityHandler.handler.mockImplementation((payload, controller) => {
        executionOrder.push('low');
        controller.jumpToPriority(10); // Jump to high priority
        return 'low-result';
      });
      
      highPriorityHandler.handler.mockImplementation(() => {
        executionOrder.push('high');
        return 'high-result';
      });
      
      mediumPriorityHandler.handler.mockImplementation(() => {
        executionOrder.push('medium');
        return 'medium-result';
      });

      const context = createMockContext('test-payload', [highPriorityHandler, mediumPriorityHandler, lowPriorityHandler]);
      const createController = jest.fn(() => createMockController(context));

      await executeSequential(context, createController);

      expect(executionOrder).toEqual(['high', 'medium', 'low', 'high']);
      expect(context.results).toEqual(['high-result', 'medium-result', 'low-result', 'high-result']);
    });

    it('should handle errors from blocking handlers', async () => {
      const successHandler = createMockHandler('success', 10, false, 'success', 'success-result');
      const errorHandler = createMockHandler('error', 5, true, 'error');
      const neverCalled = createMockHandler('never', 0);

      const context = createMockContext('test-payload', [successHandler, errorHandler, neverCalled]);
      const createController = jest.fn(() => createMockController(context));

      await expect(executeSequential(context, createController)).rejects.toThrow('Error from error');

      expect(successHandler.handler).toHaveBeenCalled();
      expect(errorHandler.handler).toHaveBeenCalled();
      expect(neverCalled.handler).not.toHaveBeenCalled();
      expect(context.results).toEqual(['success-result']);
    });

    it('should collect errors from non-blocking async handlers', async () => {
      const successHandler = createMockHandler('success', 10, false, 'success', 'success-result');
      const errorHandler = createMockHandler('error', 5, false, 'async-error');
      const finalHandler = createMockHandler('final', 0, false, 'success', 'final-result');

      const context = createMockContext('test-payload', [successHandler, errorHandler, finalHandler]);
      const createController = jest.fn(() => createMockController(context));

      await executeSequential(context, createController);

      expect(context.results).toEqual(['success-result', 'final-result']);

      // Check that errors are collected in context
      const contextWithErrors = context as any;
      expect(contextWithErrors.collectedErrors).toHaveLength(1);
      expect(contextWithErrors.collectedErrors[0]).toMatchObject({
        handlerId: 'error',
        severity: 'non-blocking'
      });
    });

    it('should handle empty handler list', async () => {
      const context = createMockContext('test-payload', []);
      const createController = jest.fn(() => createMockController(context));

      await executeSequential(context, createController);

      expect(context.results).toEqual([]);
      expect(context.aborted).toBe(false);
      expect(context.terminated).toBe(false);
    });

    it('should handle undefined results correctly', async () => {
      const undefinedHandler = createMockHandler('undefined', 10, false, 'success', undefined);
      const definedHandler = createMockHandler('defined', 5, false, 'success', 'defined-result');

      const context = createMockContext('test-payload', [undefinedHandler, definedHandler]);
      const createController = jest.fn(() => createMockController(context));

      await executeSequential(context, createController);

      expect(context.results).toEqual(['defined-result']);
    });
  });

  describe('executeParallel', () => {
    it('should execute all handlers simultaneously', async () => {
      const handler1 = createMockHandler('handler1', 10, false, 'async-success', 'result1', 50);
      const handler2 = createMockHandler('handler2', 5, false, 'async-success', 'result2', 30);
      const handler3 = createMockHandler('handler3', 1, false, 'async-success', 'result3', 20);

      const context = createMockContext('test-payload', [handler1, handler2, handler3]);
      const createController = jest.fn(() => createMockController(context));

      const startTime = Date.now();
      await executeParallel(context, createController);
      const duration = Date.now() - startTime;

      // Should complete in around 50ms (longest handler), not 100ms (sum of all)
      expect(duration).toBeLessThan(80);
      expect(context.results).toHaveLength(3);
      expect(context.results).toEqual(expect.arrayContaining(['result1', 'result2', 'result3']));
    });

    it('should handle blocking handler errors', async () => {
      const successHandler = createMockHandler('success', 10, false, 'async-success', 'success-result');
      const blockingErrorHandler = createMockHandler('blocking-error', 5, true, 'async-error');
      const anotherSuccess = createMockHandler('another', 1, false, 'async-success', 'another-result');

      const context = createMockContext('test-payload', [successHandler, blockingErrorHandler, anotherSuccess]);
      const createController = jest.fn(() => createMockController(context));

      await expect(executeParallel(context, createController)).rejects.toThrow('Async error from blocking-error');

      // Non-blocking handlers should still execute
      expect(successHandler.handler).toHaveBeenCalled();
      expect(anotherSuccess.handler).toHaveBeenCalled();
    });

    it('should not fail on non-blocking handler errors', async () => {
      const successHandler = createMockHandler('success', 10, false, 'async-success', 'success-result');
      const nonBlockingErrorHandler = createMockHandler('nb-error', 5, false, 'async-error');
      const anotherSuccess = createMockHandler('another', 1, false, 'async-success', 'another-result');

      const context = createMockContext('test-payload', [successHandler, nonBlockingErrorHandler, anotherSuccess]);
      const createController = jest.fn(() => createMockController(context));

      await executeParallel(context, createController);

      expect(context.results).toEqual(expect.arrayContaining(['success-result', 'another-result']));
      expect(context.results).toHaveLength(2);
    });

    it('should handle termination from any handler', async () => {
      const handler1 = createMockHandler('handler1', 10);
      const terminatingHandler = createMockHandler('terminating', 5);
      const handler3 = createMockHandler('handler3', 1);

      handler1.handler.mockImplementation(() => 'result1');
      terminatingHandler.handler.mockImplementation((payload, controller) => {
        controller.return('termination-result');
        return 'terminating-handler-result';
      });
      handler3.handler.mockImplementation(() => 'result3');

      const context = createMockContext('test-payload', [handler1, terminatingHandler, handler3]);
      const createController = jest.fn(() => createMockController(context));

      await executeParallel(context, createController);

      expect(context.terminated).toBe(true);
      expect(context.terminationResult).toBe('termination-result');
      expect(context.results).toEqual(expect.arrayContaining(['result1', 'terminating-handler-result', 'result3']));
    });

    it('should handle empty handler list', async () => {
      const context = createMockContext('test-payload', []);
      const createController = jest.fn(() => createMockController(context));

      await executeParallel(context, createController);

      expect(context.results).toEqual([]);
      expect(context.terminated).toBe(false);
    });

    it('should handle mixed sync and async handlers', async () => {
      const syncHandler = createMockHandler('sync', 10, false, 'success', 'sync-result');
      const asyncHandler = createMockHandler('async', 5, false, 'async-success', 'async-result', 20);

      const context = createMockContext('test-payload', [syncHandler, asyncHandler]);
      const createController = jest.fn(() => createMockController(context));

      await executeParallel(context, createController);

      expect(context.results).toEqual(expect.arrayContaining(['sync-result', 'async-result']));
      expect(context.results).toHaveLength(2);
    });

    it('should filter out undefined results', async () => {
      const undefinedHandler = createMockHandler('undefined', 10, false, 'success', undefined);
      const definedHandler = createMockHandler('defined', 5, false, 'success', 'defined-result');
      const nullHandler = createMockHandler('null', 1, false, 'success', null);

      const context = createMockContext('test-payload', [undefinedHandler, definedHandler, nullHandler]);
      const createController = jest.fn(() => createMockController(context));

      await executeParallel(context, createController);

      expect(context.results).toEqual(['defined-result', null]);
    });
  });

  describe('executeRace', () => {
    it('should complete when first handler finishes', async () => {
      const slowHandler = createMockHandler('slow', 10, false, 'async-success', 'slow-result', 100);
      const fastHandler = createMockHandler('fast', 5, false, 'async-success', 'fast-result', 20);
      const mediumHandler = createMockHandler('medium', 1, false, 'async-success', 'medium-result', 50);

      const context = createMockContext('test-payload', [slowHandler, fastHandler, mediumHandler]);
      const createController = jest.fn(() => createMockController(context));

      const startTime = Date.now();
      await executeRace(context, createController);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(40); // Should complete in ~20ms
      expect(context.results).toEqual(['fast-result']);
    });

    it('should handle winning handler that fails but is non-blocking', async () => {
      const errorHandler = createMockHandler('error', 10, false, 'async-error');
      const slowSuccessHandler = createMockHandler('slow-success', 5, false, 'async-success', 'success-result', 100);

      const context = createMockContext('test-payload', [errorHandler, slowSuccessHandler]);
      const createController = jest.fn(() => createMockController(context));

      await executeRace(context, createController);

      expect(context.results).toEqual([]);
    });

    it('should throw error if winning handler fails and is blocking', async () => {
      const blockingErrorHandler = createMockHandler('blocking-error', 10, true, 'async-error');
      const slowSuccessHandler = createMockHandler('slow-success', 5, false, 'async-success', 'success-result', 100);

      const context = createMockContext('test-payload', [blockingErrorHandler, slowSuccessHandler]);
      const createController = jest.fn(() => createMockController(context));

      await expect(executeRace(context, createController)).rejects.toThrow('Async error from blocking-error');
    });

    it('should handle termination from winning handler', async () => {
      const terminatingHandler = createMockHandler('terminating', 10);
      const slowHandler = createMockHandler('slow', 5, false, 'async-success', 'slow-result', 100);

      terminatingHandler.handler.mockImplementation((payload, controller) => {
        controller.return('termination-result');
        return 'handler-result';
      });

      const context = createMockContext('test-payload', [terminatingHandler, slowHandler]);
      const createController = jest.fn(() => createMockController(context));

      await executeRace(context, createController);

      expect(context.terminated).toBe(true);
      expect(context.terminationResult).toBe('handler-result');
      expect(context.results).toEqual(['handler-result']);
    });

    it('should handle empty handler list', async () => {
      const context = createMockContext('test-payload', []);
      const createController = jest.fn(() => createMockController(context));

      await executeRace(context, createController);

      expect(context.results).toEqual([]);
      expect(context.terminated).toBe(false);
    });

    it('should handle single handler', async () => {
      const singleHandler = createMockHandler('single', 10, false, 'success', 'single-result');

      const context = createMockContext('test-payload', [singleHandler]);
      const createController = jest.fn(() => createMockController(context));

      await executeRace(context, createController);

      expect(context.results).toEqual(['single-result']);
    });

    it('should handle undefined result from winning handler', async () => {
      const undefinedHandler = createMockHandler('undefined', 10, false, 'success', undefined);
      const slowHandler = createMockHandler('slow', 5, false, 'async-success', 'slow-result', 100);

      const context = createMockContext('test-payload', [undefinedHandler, slowHandler]);
      const createController = jest.fn(() => createMockController(context));

      await executeRace(context, createController);

      expect(context.results).toEqual([]);
    });

    it('should handle mixed sync and async handlers with sync winner', async () => {
      const syncHandler = createMockHandler('sync', 10, false, 'success', 'sync-result');
      const asyncHandler = createMockHandler('async', 5, false, 'async-success', 'async-result', 50);

      const context = createMockContext('test-payload', [syncHandler, asyncHandler]);
      const createController = jest.fn(() => createMockController(context));

      await executeRace(context, createController);

      expect(context.results).toEqual(['sync-result']);
    });
  });

  describe('Error Handling Utilities', () => {
    it('should create standardized HandlerError objects', async () => {
      const errorHandler = createMockHandler('error-handler', 10, true, 'error');
      const context = createMockContext('test-payload', [errorHandler]);
      const createController = jest.fn(() => createMockController(context));

      await expect(executeSequential(context, createController)).rejects.toThrow('Error from error-handler');
    });

    it('should distinguish between blocking and non-blocking errors', async () => {
      const blockingErrorHandler = createMockHandler('blocking', 10, true, 'async-error');
      const nonBlockingErrorHandler = createMockHandler('non-blocking', 5, false, 'async-error');
      
      const blockingContext = createMockContext('test-payload', [blockingErrorHandler]);
      const nonBlockingContext = createMockContext('test-payload', [nonBlockingErrorHandler]);
      
      const createController1 = jest.fn(() => createMockController(blockingContext));
      const createController2 = jest.fn(() => createMockController(nonBlockingContext));

      await expect(executeParallel(blockingContext, createController1)).rejects.toThrow();
      await expect(executeParallel(nonBlockingContext, createController2)).resolves.not.toThrow();
    });
  });
});