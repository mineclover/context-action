/**
 * Performance and stress tests - High load scenarios and benchmarks
 */

import { ActionRegister, type ActionPayloadMap } from '../../src';

interface PerformanceTestActions extends ActionPayloadMap {
  lightAction: { id: number };
  heavyAction: { data: string; payload: any[] };
  stressAction: { iteration: number; data: Record<string, any> };
  batchAction: { batch: number; items: any[] };
  concurrentAction: { worker: number; task: string };
  memoryAction: { size: number; content: string };
}

describe('ActionRegister - Performance and Stress Tests', () => {
  let actionRegister: ActionRegister<PerformanceTestActions>;

  beforeEach(() => {
    actionRegister = new ActionRegister<PerformanceTestActions>({
      name: 'PerformanceTestRegister',
      registry: {
        debug: false,
        defaultExecutionMode: 'sequential'
      }
    });
  });

  afterEach(() => {
    actionRegister.clearAll();
    jest.clearAllMocks();
  });

  describe('⚡ Handler Registration Performance', () => {
    it('should handle mass handler registration efficiently', () => {
      const startTime = performance.now();

      // Register 1000 handlers
      for (let i = 0; i < 1000; i++) {
        actionRegister.register('lightAction', jest.fn(), { 
          id: `handler-${i}`, 
          priority: i % 100 
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(actionRegister.getHandlerCount('lightAction')).toBe(1000);
      expect(duration).toBeLessThan(100); // Should complete in under 100ms
    });

    it('should handle rapid registration/unregistration cycles', () => {
      const startTime = performance.now();
      const unregisterFunctions: (() => void)[] = [];

      // Register 500 handlers
      for (let i = 0; i < 500; i++) {
        const unregister = actionRegister.register('lightAction', jest.fn(), { id: `cycle-${i}` });
        unregisterFunctions.push(unregister);
      }

      // Unregister all
      unregisterFunctions.forEach(unregister => unregister());

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(actionRegister.getHandlerCount('lightAction')).toBe(0);
      expect(duration).toBeLessThan(50); // Should be very fast
    });

    it('should maintain performance with mixed priorities', () => {
      const startTime = performance.now();

      // Register handlers with random priorities
      for (let i = 0; i < 500; i++) {
        const priority = Math.floor(Math.random() * 1000);
        actionRegister.register('lightAction', jest.fn(), { 
          id: `mixed-${i}`, 
          priority 
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(actionRegister.getHandlerCount('lightAction')).toBe(500);
      expect(duration).toBeLessThan(100);
    });
  });

  describe('🚀 Dispatch Performance', () => {
    it('should dispatch lightweight actions rapidly', async () => {
      actionRegister.register('lightAction', (payload) => ({ processed: payload.id }));

      const startTime = performance.now();

      // Dispatch 1000 light actions
      const promises: Promise<any>[] = [];
      for (let i = 0; i < 1000; i++) {
        promises.push(actionRegister.dispatch('lightAction', { id: i }));
      }

      await Promise.all(promises);
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000); // Under 1 second for 1000 dispatches
    });

    it('should handle heavy payloads efficiently', async () => {
      actionRegister.register('heavyAction', (payload) => {
        return { 
          processed: true, 
          dataLength: payload.data.length,
          itemCount: payload.payload.length 
        };
      });

      const heavyData = 'x'.repeat(10000); // 10KB string
      const heavyPayload = Array.from({ length: 1000 }, (_, i) => ({ id: i, value: `item-${i}` }));

      const startTime = performance.now();

      const promises: Promise<any>[] = [];
      for (let i = 0; i < 100; i++) {
        promises.push(actionRegister.dispatch('heavyAction', { 
          data: heavyData, 
          payload: heavyPayload 
        }));
      }

      await Promise.all(promises);
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(2000); // Should handle heavy data reasonably fast
    });

    it('should execute many handlers in sequence efficiently', async () => {
      // Register 100 handlers
      for (let i = 0; i < 100; i++) {
        actionRegister.register('lightAction', (payload) => ({ handler: i, id: payload.id }), {
          priority: 100 - i, // Descending priority
          id: `seq-handler-${i}`
        });
      }

      const startTime = performance.now();

      const result = await actionRegister.dispatchWithResult('lightAction', 
        { id: 1 }, 
        { result: { collect: true } }
      );

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(result.results).toHaveLength(100);
      expect(result.execution.handlersExecuted).toBe(100);
      expect(duration).toBeLessThan(50); // Should be very fast for simple handlers
    });
  });

  describe('🔥 Stress Testing', () => {
    it('should handle high-frequency dispatches without degradation', async () => {
      actionRegister.register('stressAction', (payload) => {
        return { processed: payload.iteration };
      });

      const batches = 10;
      const batchSize = 100;
      const batchTimes: number[] = [];

      for (let batch = 0; batch < batches; batch++) {
        const batchStart = performance.now();

        const promises: Promise<any>[] = [];
        for (let i = 0; i < batchSize; i++) {
          promises.push(actionRegister.dispatch('stressAction', {
            iteration: batch * batchSize + i,
            data: { batch, item: i }
          }));
        }

        await Promise.all(promises);
        const batchEnd = performance.now();
        batchTimes.push(batchEnd - batchStart);
      }

      // Check that performance doesn't degrade significantly
      const firstBatchTime = batchTimes[0];
      const lastBatchTime = batchTimes[batchTimes.length - 1];
      const degradation = (lastBatchTime - firstBatchTime) / firstBatchTime;

      expect(degradation).toBeLessThan(0.5); // Less than 50% degradation
      expect(batchTimes.every(time => time < 1000)).toBe(true); // All batches under 1 second
    });

    it('should handle concurrent execution stress', async () => {
      // Register multiple handlers for concurrent action
      for (let i = 0; i < 10; i++) {
        actionRegister.register('concurrentAction', async (payload) => {
          await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
          return { worker: payload.worker, handler: i, task: payload.task };
        }, { id: `concurrent-handler-${i}` });
      }

      const startTime = performance.now();

      // Launch many concurrent operations
      const promises: Promise<any>[] = [];
      for (let worker = 0; worker < 50; worker++) {
        promises.push(
          actionRegister.dispatchWithResult('concurrentAction', 
            { worker, task: `task-${worker}` },
            { result: { collect: true } }
          )
        );
      }

      const results = await Promise.all(promises);
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(results).toHaveLength(50);
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.results).toHaveLength(10); // All handlers executed
        expect(result.execution.handlersExecuted).toBe(10);
      });

      expect(duration).toBeLessThan(3000); // Should complete within reasonable time
    });

    it('should maintain memory efficiency under load', async () => {
      // Function to get rough memory usage (not precise, but good for trends)
      const getMemoryUsage = () => {
        if (process.memoryUsage) {
          return process.memoryUsage().heapUsed;
        }
        return 0;
      };

      const initialMemory = getMemoryUsage();

      // Register handler that processes large data
      actionRegister.register('memoryAction', (payload) => {
        // Process the content but don't hold references
        const processed = payload.content.toUpperCase();
        return { size: payload.size, processed: processed.length };
      });

      // Execute many operations with large payloads
      for (let i = 0; i < 100; i++) {
        const largeContent = 'x'.repeat(payload.size || 10000);
        await actionRegister.dispatch('memoryAction', {
          size: largeContent.length,
          content: largeContent
        });
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = getMemoryUsage();
      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreaseMB = memoryIncrease / (1024 * 1024);

      // Memory increase should be reasonable (less than 50MB for this test)
      expect(memoryIncreaseMB).toBeLessThan(50);
    }, 10000); // Longer timeout for memory test

    it('should handle error recovery under stress', async () => {
      let successCount = 0;
      let errorCount = 0;

      actionRegister.register('stressAction', (payload) => {
        // Randomly throw errors to test error handling under load
        if (Math.random() < 0.3) { // 30% error rate
          errorCount++;
          throw new Error(`Random error for iteration ${payload.iteration}`);
        }
        successCount++;
        return { success: true, iteration: payload.iteration };
      });

      const promises: Promise<any>[] = [];
      for (let i = 0; i < 500; i++) {
        promises.push(
          actionRegister.dispatchWithResult('stressAction', {
            iteration: i,
            data: { stress: true }
          })
        );
      }

      const results = await Promise.all(promises);

      // All dispatches should complete successfully even with handler errors
      expect(results).toHaveLength(500);
      results.forEach(result => {
        expect(result.success).toBe(true); // Pipeline success, not handler success
        expect(result.execution.handlersExecuted).toBe(1);
      });

      expect(errorCount).toBeGreaterThan(0); // Should have had some errors
      expect(successCount).toBeGreaterThan(0); // Should have had some successes
      expect(errorCount + successCount).toBe(500);
    });
  });

  describe('📊 Benchmark Tests', () => {
    it('should benchmark single handler execution', async () => {
      actionRegister.register('lightAction', (payload) => payload.id * 2);

      const iterations = 10000;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        await actionRegister.dispatch('lightAction', { id: i });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const opsPerSecond = (iterations / duration) * 1000;

      console.log(`Single handler benchmark: ${opsPerSecond.toFixed(0)} ops/sec`);
      expect(opsPerSecond).toBeGreaterThan(1000); // Should handle > 1000 ops/sec
    });

    it('should benchmark multiple handler execution', async () => {
      // Register 10 handlers
      for (let i = 0; i < 10; i++) {
        actionRegister.register('lightAction', (payload) => ({ handler: i, result: payload.id }), {
          id: `benchmark-handler-${i}`
        });
      }

      const iterations = 1000;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        await actionRegister.dispatch('lightAction', { id: i });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const opsPerSecond = (iterations / duration) * 1000;

      console.log(`Multiple handler benchmark: ${opsPerSecond.toFixed(0)} ops/sec`);
      expect(opsPerSecond).toBeGreaterThan(100); // Should handle > 100 ops/sec with multiple handlers
    });

    it('should benchmark result collection overhead', async () => {
      // Register 10 handlers that return results
      for (let i = 0; i < 10; i++) {
        actionRegister.register('lightAction', (payload) => ({ 
          handler: i, 
          data: `result-${payload.id}-${i}`,
          timestamp: Date.now()
        }), { id: `collect-handler-${i}` });
      }

      const iterations = 500;

      // Benchmark without result collection
      const startWithoutCollection = performance.now();
      for (let i = 0; i < iterations; i++) {
        await actionRegister.dispatch('lightAction', { id: i });
      }
      const endWithoutCollection = performance.now();
      const durationWithoutCollection = endWithoutCollection - startWithoutCollection;

      // Benchmark with result collection
      const startWithCollection = performance.now();
      for (let i = 0; i < iterations; i++) {
        await actionRegister.dispatchWithResult('lightAction', 
          { id: i },
          { result: { collect: true } }
        );
      }
      const endWithCollection = performance.now();
      const durationWithCollection = endWithCollection - startWithCollection;

      const overhead = ((durationWithCollection - durationWithoutCollection) / durationWithoutCollection) * 100;

      console.log(`Result collection overhead: ${overhead.toFixed(1)}%`);
      expect(overhead).toBeLessThan(100); // Overhead should be less than 100%
    });
  });

  describe('🔄 Execution Mode Performance', () => {
    it('should compare sequential vs parallel performance', async () => {
      const handlerDelay = 10; // 10ms delay per handler
      const handlerCount = 5;

      // Register async handlers
      for (let i = 0; i < handlerCount; i++) {
        actionRegister.register('concurrentAction', async (payload) => {
          await new Promise(resolve => setTimeout(resolve, handlerDelay));
          return { handler: i, worker: payload.worker };
        }, { id: `perf-handler-${i}` });
      }

      // Test sequential execution
      actionRegister.setActionExecutionMode('concurrentAction', 'sequential');
      const sequentialStart = performance.now();
      
      const sequentialResult = await actionRegister.dispatchWithResult('concurrentAction', 
        { worker: 1, task: 'sequential-test' },
        { result: { collect: true } }
      );
      
      const sequentialEnd = performance.now();
      const sequentialDuration = sequentialEnd - sequentialStart;

      // Test parallel execution
      actionRegister.setActionExecutionMode('concurrentAction', 'parallel');
      const parallelStart = performance.now();
      
      const parallelResult = await actionRegister.dispatchWithResult('concurrentAction', 
        { worker: 2, task: 'parallel-test' },
        { result: { collect: true } }
      );
      
      const parallelEnd = performance.now();
      const parallelDuration = parallelEnd - parallelStart;

      console.log(`Sequential: ${sequentialDuration.toFixed(1)}ms, Parallel: ${parallelDuration.toFixed(1)}ms`);

      // Both should execute all handlers
      expect(sequentialResult.results).toHaveLength(handlerCount);
      expect(parallelResult.results).toHaveLength(handlerCount);

      // Sequential should take longer (approximately handlerCount * handlerDelay)
      expect(sequentialDuration).toBeGreaterThanOrEqual(handlerCount * handlerDelay * 0.8);
      
      // Parallel should be significantly faster
      expect(parallelDuration).toBeLessThan(sequentialDuration * 0.8);
    }, 15000); // Longer timeout for async test
  });

  describe('🧮 Large Scale Operations', () => {
    it('should handle batch processing efficiently', async () => {
      actionRegister.register('batchAction', (payload) => {
        // Process all items in the batch
        const processedItems = payload.items.map((item: any) => ({
          ...item,
          processed: true,
          batch: payload.batch
        }));
        
        return {
          batch: payload.batch,
          processed: processedItems.length,
          items: processedItems
        };
      });

      const batchSize = 1000;
      const batchCount = 10;
      const startTime = performance.now();

      const promises: Promise<any>[] = [];
      for (let batch = 0; batch < batchCount; batch++) {
        const items = Array.from({ length: batchSize }, (_, i) => ({
          id: batch * batchSize + i,
          data: `item-${i}`
        }));

        promises.push(
          actionRegister.dispatchWithResult('batchAction', 
            { batch, items },
            { result: { collect: true } }
          )
        );
      }

      const results = await Promise.all(promises);
      const endTime = performance.now();
      const duration = endTime - startTime;

      const totalItemsProcessed = results.reduce((total, result) => 
        total + result.results[0].processed, 0
      );

      console.log(`Batch processing: ${totalItemsProcessed} items in ${duration.toFixed(1)}ms`);
      
      expect(totalItemsProcessed).toBe(batchSize * batchCount);
      expect(duration).toBeLessThan(5000); // Should process 10k items in under 5 seconds
    });
  });
});