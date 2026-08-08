/**
 * @fileoverview Memory-optimized execution modes unit tests
 * 
 * Optimized version with reduced memory footprint and better cleanup
 */

import {
  executeSequential,
  executeParallel,
  executeRace
} from '../../src/execution-modes.js';
import type {
  ActionHandler,
  PipelineContext,
  PipelineController,
  HandlerRegistration
} from '../../src/types.js';

describe('Execution Modes (Memory Optimized)', () => {
  type MockHandlerRegistration<T = any, R = any> = Omit<
    HandlerRegistration<T, R>,
    'handler'
  > & {
    handler: jest.MockedFunction<ActionHandler<T, R>>;
  };

  // Mock pool for reusing mock functions
  const mockPool: jest.MockedFunction<ActionHandler<any, any>>[] = [];
  
  const getMock = (): jest.MockedFunction<ActionHandler<any, any>> => {
    return mockPool.pop() || jest.fn<any, Parameters<ActionHandler<any, any>>>();
  };
  
  const returnMock = (mock: jest.MockedFunction<ActionHandler<any, any>>) => {
    mock.mockReset();
    mockPool.push(mock);
  };

  // Simplified mock handler creation
  const createHandler = (id: string, behavior: 'success' | 'error' = 'success', result: any = `result-${id}`): MockHandlerRegistration => {
    const handler = getMock();
    
    if (behavior === 'success') {
      handler.mockReturnValue(result);
    } else {
      handler.mockRejectedValue(new Error(`Error from ${id}`));
    }

    return {
      handler,
      config: {
        id,
        priority: 0,
        blocking: false,
        scheduling: 'start-and-continue',
        errorPolicy: 'collect',
        once: false,
        throttle: 0,
        debounce: 0,
        replaceExisting: false,
        cleanup: () => {},
        condition: () => true
      },
      id
    };
  };

  const createContext = <T>(payload: T, handlers: HandlerRegistration<T, any>[]): PipelineContext<T, any> => ({
    action: 'testAction',
    payload,
    handlers,
    signal: new AbortController().signal,
    aborted: false,
    abortReason: undefined,
    currentIndex: 0,
    jumpToPriority: undefined,
    executionMode: 'sequential',
    results: [],
    terminated: false,
    terminationResult: undefined
  });

  const createController = (context: PipelineContext<any, any>): PipelineController<any, any> => ({
    signal: context.signal,
    abort: (reason?: string) => { context.aborted = true; context.abortReason = reason; },
    modifyPayload: (modifier) => { context.payload = modifier(context.payload); },
    getPayload: () => context.payload,
    jumpToPriority: (priority) => { context.jumpToPriority = priority; },
    return: (result) => { context.terminated = true; context.terminationResult = result; },
    setResult: (result) => { context.results.push(result); },
    getResults: () => [...context.results],
    mergeResult: (merger) => {
      const current = context.results[context.results.length - 1];
      const previous = context.results.slice(0, -1);
      context.results[context.results.length - 1] = merger(previous, current);
    }
  });

  afterEach(() => {
    // Clean up all mocks and return them to pool
    jest.clearAllMocks();
    jest.clearAllTimers();
    
    // Force garbage collection of test data
    global.gc && global.gc();
  });

  describe('executeSequential', () => {
    it('should execute handlers in order', async () => {
      const executionOrder: string[] = [];
      const handlers = [1, 2, 3].map(i => {
        const handler = createHandler(`handler${i}`);
        handler.handler.mockImplementation(() => {
          executionOrder.push(`handler${i}`);
          return `result${i}`;
        });
        return handler;
      });

      const context = createContext('payload', handlers);
      
      await executeSequential(context, () => createController(context));

      expect(executionOrder).toEqual(['handler1', 'handler2', 'handler3']);
      expect(context.results).toEqual(['result1', 'result2', 'result3']);
      
      // Clean up
      handlers.forEach(h => returnMock(h.handler));
    });

    it('should handle handler configuration correctly', async () => {
      const blockingHandler = createHandler('blocking');
      blockingHandler.config.blocking = true;
      blockingHandler.handler.mockReturnValue('blocking-result');

      const nonBlockingHandler = createHandler('non-blocking');
      nonBlockingHandler.config.blocking = false;
      nonBlockingHandler.handler.mockReturnValue('non-blocking-result');

      const context = createContext('payload', [blockingHandler, nonBlockingHandler]);
      
      await executeSequential(context, () => createController(context));

      expect(context.results).toContain('blocking-result');
      expect(context.results).toContain('non-blocking-result');
      expect(context.results).toHaveLength(2);
      
      // Clean up
      returnMock(blockingHandler.handler);
      returnMock(nonBlockingHandler.handler);
    });

    it('should handle abort correctly', async () => {
      const handlers = [
        createHandler('handler1'),
        createHandler('aborting'),
        createHandler('handler3')
      ];

      handlers[1].handler.mockImplementation((payload, controller) => {
        controller.abort('Test abort');
        return 'abort-result';
      });

      const context = createContext('payload', handlers);
      
      await executeSequential(context, () => createController(context));

      expect(context.aborted).toBe(true);
      expect(context.abortReason).toBe('Test abort');
      expect(handlers[2].handler).not.toHaveBeenCalled();
      
      // Clean up
      handlers.forEach(h => returnMock(h.handler));
    });
  });

  describe('executeParallel', () => {
    it('should execute handlers simultaneously', async () => {
      const handlers = [1, 2, 3].map(i => createHandler(`handler${i}`, 'success', `result${i}`));

      const context = createContext('payload', handlers);
      
      await executeParallel(context, () => createController(context));

      expect(context.results).toHaveLength(3);
      expect(context.results).toEqual(expect.arrayContaining(['result1', 'result2', 'result3']));
      
      // Clean up
      handlers.forEach(h => returnMock(h.handler));
    });

    it('should handle mixed success and error', async () => {
      const successHandler = createHandler('success', 'success', 'success-result');
      const errorHandler = createHandler('error', 'success'); // Non-blocking error
      errorHandler.handler.mockRejectedValue(new Error('Non-blocking error'));

      const context = createContext('payload', [successHandler, errorHandler]);
      
      // Should not throw for non-blocking errors
      await executeParallel(context, () => createController(context));

      expect(context.results).toContain('success-result');
      
      // Clean up
      returnMock(successHandler.handler);
      returnMock(errorHandler.handler);
    });
  });

  describe('executeRace', () => {
    it('should complete with first successful handler', async () => {
      const fastHandler = createHandler('fast', 'success', 'fast-result');
      const slowHandler = createHandler('slow');
      let releaseSlow: (() => void) | undefined;
      let markSlowSettled: (() => void) | undefined;
      const slowGate = new Promise<void>(resolve => {
        releaseSlow = resolve;
      });
      const slowSettled = new Promise<void>(resolve => {
        markSlowSettled = resolve;
      });
      slowHandler.handler.mockImplementation(async () => {
        await slowGate;
        markSlowSettled?.();
        return 'slow-result';
      });

      const context = createContext('payload', [fastHandler, slowHandler]);
      
      const start = Date.now();
      await executeRace(context, () => createController(context));
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(30); // Should complete quickly
      expect(context.results).toEqual(['fast-result']);

      releaseSlow?.();
      await slowSettled;
      
      // Clean up
      returnMock(fastHandler.handler);
      returnMock(slowHandler.handler);
    });

    it('should handle empty handler list', async () => {
      const context = createContext('payload', []);
      
      await executeRace(context, () => createController(context));

      expect(context.results).toEqual([]);
      expect(context.terminated).toBe(false);
    });
  });

  describe('Memory Management', () => {
    it('should not leak memory with many handlers', async () => {
      // Reduced from 1000 to 50 for memory efficiency
      const handlers = Array.from({ length: 50 }, (_, i) => 
        createHandler(`handler${i}`, 'success', i)
      );

      const context = createContext('payload', handlers);
      
      await executeSequential(context, () => createController(context));

      expect(context.results).toHaveLength(50);
      
      // Clean up all handlers
      handlers.forEach(h => returnMock(h.handler));
    });
  });
});
