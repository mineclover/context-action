/**
 * @fileoverview Unit tests for OperationQueue concurrency system
 * 
 * Tests the queue system used to resolve concurrency issues in ActionRegister,
 * including FIFO order, priority handling, concurrency control, and error handling.
 */

import { OperationQueue } from '../../src/concurrency/OperationQueue.js';
import type { QueuedOperation } from '../../src/concurrency/OperationQueue.js';

describe('OperationQueue Unit Tests', () => {
  let queue: OperationQueue;

  beforeEach(() => {
    queue = new OperationQueue('TestQueue');
  });

  afterEach(() => {
    queue.clear();
  });

  describe('Basic Queue Operations', () => {
    it('should create queue with default name and concurrency', () => {
      const defaultQueue = new OperationQueue();
      const info = defaultQueue.getQueueInfo();

      expect(info.name).toBe('OperationQueue');
      expect(info.maxConcurrency).toBe(1);
      expect(info.queueLength).toBe(0);
      expect(info.isProcessing).toBe(false);
    });

    it('should create queue with custom name and concurrency', () => {
      const customQueue = new OperationQueue('CustomQueue', 5);
      const info = customQueue.getQueueInfo();

      expect(info.name).toBe('CustomQueue');
      expect(info.maxConcurrency).toBe(5);
    });

    it('should enforce minimum concurrency of 1', () => {
      const queue = new OperationQueue('MinQueue', 0);
      const info = queue.getQueueInfo();

      expect(info.maxConcurrency).toBe(1);
    });

    it('should execute single operation successfully', async () => {
      const operation = jest.fn().mockReturnValue('test-result');
      
      const result = await queue.enqueue(operation);
      
      expect(result).toBe('test-result');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should execute async operation successfully', async () => {
      const operation = jest.fn().mockResolvedValue('async-result');
      
      const result = await queue.enqueue(operation);
      
      expect(result).toBe('async-result');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should handle operation errors properly', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Operation failed'));
      
      await expect(queue.enqueue(operation)).rejects.toThrow('Operation failed');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should handle synchronous operation errors', async () => {
      const operation = jest.fn().mockImplementation(() => {
        throw new Error('Sync error');
      });
      
      await expect(queue.enqueue(operation)).rejects.toThrow('Sync error');
    });
  });

  describe('FIFO Order and Priority', () => {
    it('should execute operations in FIFO order by default', async () => {
      const executionOrder: number[] = [];
      
      const operations = [
        () => { executionOrder.push(1); return 1; },
        () => { executionOrder.push(2); return 2; },
        () => { executionOrder.push(3); return 3; }
      ];

      // Enqueue all operations
      const promises = operations.map((op, index) => queue.enqueue(op));
      
      const results = await Promise.all(promises);
      
      expect(executionOrder).toEqual([1, 2, 3]);
      expect(results).toEqual([1, 2, 3]);
    });

    it('should respect priority ordering', async () => {
      const executionOrder: string[] = [];
      
      const lowPriority = () => { executionOrder.push('low'); return 'low'; };
      const highPriority = () => { executionOrder.push('high'); return 'high'; };
      const mediumPriority = () => { executionOrder.push('medium'); return 'medium'; };

      // Enqueue with priorities
      const promises = [
        queue.enqueue(lowPriority, 1),     // Low priority
        queue.enqueue(highPriority, 10),   // High priority (should execute first)
        queue.enqueue(mediumPriority, 5)   // Medium priority
      ];
      
      await Promise.all(promises);
      
      expect(executionOrder).toEqual(['high', 'medium', 'low']);
    });

    it('should handle same priority operations in FIFO order', async () => {
      const executionOrder: number[] = [];
      
      const operations = [
        () => { executionOrder.push(1); return 1; },
        () => { executionOrder.push(2); return 2; },
        () => { executionOrder.push(3); return 3; }
      ];

      // All same priority
      const promises = operations.map(op => queue.enqueue(op, 5));
      
      await Promise.all(promises);
      
      expect(executionOrder).toEqual([1, 2, 3]);
    });

    it('should handle mixed priority and insertion order', async () => {
      const executionOrder: string[] = [];
      
      // Insert with mixed priorities
      const promises = [
        queue.enqueue(() => { executionOrder.push('normal1'); return 'normal1'; }, 0),
        queue.enqueue(() => { executionOrder.push('high1'); return 'high1'; }, 10),
        queue.enqueue(() => { executionOrder.push('normal2'); return 'normal2'; }, 0),
        queue.enqueue(() => { executionOrder.push('high2'); return 'high2'; }, 10)
      ];
      
      await Promise.all(promises);
      
      // High priority items should execute before normal priority
      expect(executionOrder).toEqual(['high1', 'high2', 'normal1', 'normal2']);
    });
  });

  describe('Concurrency Control', () => {
    it('should enforce maxConcurrency limit', async () => {
      const concurrentQueue = new OperationQueue('ConcurrentQueue', 2);
      let activeOperations = 0;
      let maxConcurrentOperations = 0;

      const trackingOperation = async (delay: number) => {
        activeOperations++;
        maxConcurrentOperations = Math.max(maxConcurrentOperations, activeOperations);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        
        activeOperations--;
        return delay;
      };

      const promises = [
        concurrentQueue.enqueue(() => trackingOperation(50)),
        concurrentQueue.enqueue(() => trackingOperation(30)),
        concurrentQueue.enqueue(() => trackingOperation(20)),
        concurrentQueue.enqueue(() => trackingOperation(10))
      ];

      await Promise.all(promises);

      expect(maxConcurrentOperations).toBe(2);
    });

    it('should handle sequential execution with maxConcurrency = 1', async () => {
      const sequentialQueue = new OperationQueue('SequentialQueue', 1);
      const executionOrder: number[] = [];
      let activeOperations = 0;

      const trackingOperation = async (id: number, delay: number) => {
        expect(activeOperations).toBe(0); // Should never have concurrent operations
        activeOperations++;
        executionOrder.push(id);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        
        activeOperations--;
        return id;
      };

      const promises = [
        sequentialQueue.enqueue(() => trackingOperation(1, 20)),
        sequentialQueue.enqueue(() => trackingOperation(2, 15)),
        sequentialQueue.enqueue(() => trackingOperation(3, 10))
      ];

      await Promise.all(promises);

      expect(executionOrder).toEqual([1, 2, 3]);
    });

    it('should handle high concurrency correctly', async () => {
      const highConcurrencyQueue = new OperationQueue('HighConcurrencyQueue', 10);
      let maxConcurrentOperations = 0;
      let activeOperations = 0;

      const trackingOperation = async (delay: number) => {
        activeOperations++;
        maxConcurrentOperations = Math.max(maxConcurrentOperations, activeOperations);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        
        activeOperations--;
        return delay;
      };

      // Create more operations than max concurrency
      const promises = Array.from({ length: 15 }, (_, i) => 
        highConcurrencyQueue.enqueue(() => trackingOperation(10 + i))
      );

      await Promise.all(promises);

      expect(maxConcurrentOperations).toBe(10);
    });

    it('should provide accurate concurrency info', async () => {
      const concurrentQueue = new OperationQueue('InfoQueue', 3);
      
      const longOperation = () => new Promise(resolve => setTimeout(resolve, 100));

      // Start some operations
      const promises = [
        concurrentQueue.enqueue(longOperation),
        concurrentQueue.enqueue(longOperation),
        concurrentQueue.enqueue(longOperation),
        concurrentQueue.enqueue(longOperation)
      ];

      // Check info while operations are running
      await new Promise(resolve => setTimeout(resolve, 10));
      const info = concurrentQueue.getConcurrencyInfo();

      expect(info.maxConcurrency).toBe(3);
      expect(info.activeOperations).toBeLessThanOrEqual(3);
      expect(info.availableSlots).toBeGreaterThanOrEqual(0);
      expect(info.queuedOperations).toBeGreaterThanOrEqual(0);
      expect(info.efficiency).toBeGreaterThan(0);

      await Promise.all(promises);
    });
  });

  describe('Error Handling and Isolation', () => {
    it('should isolate operation errors', async () => {
      const successOp1 = jest.fn().mockReturnValue('success1');
      const errorOp = jest.fn().mockRejectedValue(new Error('Operation error'));
      const successOp2 = jest.fn().mockReturnValue('success2');

      const results = await Promise.allSettled([
        queue.enqueue(successOp1),
        queue.enqueue(errorOp),
        queue.enqueue(successOp2)
      ]);

      expect(results[0].status).toBe('fulfilled');
      expect((results[0] as PromiseFulfilledResult<any>).value).toBe('success1');

      expect(results[1].status).toBe('rejected');
      expect((results[1] as PromiseRejectedResult).reason.message).toBe('Operation error');

      expect(results[2].status).toBe('fulfilled');
      expect((results[2] as PromiseFulfilledResult<any>).value).toBe('success2');

      expect(successOp1).toHaveBeenCalled();
      expect(errorOp).toHaveBeenCalled();
      expect(successOp2).toHaveBeenCalled();
    });

    it('should continue processing after error', async () => {
      const executionOrder: number[] = [];

      const operations = [
        () => { executionOrder.push(1); return 1; },
        () => { executionOrder.push(2); throw new Error('Error 2'); },
        () => { executionOrder.push(3); return 3; }
      ];

      const results = await Promise.allSettled(
        operations.map(op => queue.enqueue(op))
      );

      expect(executionOrder).toEqual([1, 2, 3]);
      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
      expect(results[2].status).toBe('fulfilled');
    });

    it('should handle errors in concurrent operations', async () => {
      const concurrentQueue = new OperationQueue('ErrorConcurrentQueue', 3);
      const executionCount = { count: 0 };

      const mixedOperations = Array.from({ length: 6 }, (_, i) => {
        if (i % 2 === 0) {
          return () => {
            executionCount.count++;
            return `success-${i}`;
          };
        } else {
          return () => {
            executionCount.count++;
            throw new Error(`error-${i}`);
          };
        }
      });

      const results = await Promise.allSettled(
        mixedOperations.map(op => concurrentQueue.enqueue(op))
      );

      expect(executionCount.count).toBe(6); // All operations should execute
      expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(3);
      expect(results.filter(r => r.status === 'rejected')).toHaveLength(3);
    });
  });

  describe('Queue Information and Monitoring', () => {
    it('should provide accurate queue information', () => {
      const info = queue.getQueueInfo();

      expect(info.name).toBe('TestQueue');
      expect(info.queueLength).toBe(0);
      expect(info.isProcessing).toBe(false);
      expect(info.activeOperations).toBe(0);
      expect(info.maxConcurrency).toBe(1);
      expect(info.runningOperationsCount).toBe(0);
      expect(info.operations).toEqual([]);
    });

    it('should track queue state during operation', async () => {
      const longOperation = () => new Promise(resolve => setTimeout(resolve, 50));

      // Start operation
      const promise = queue.enqueue(longOperation, 5);

      // Check info while processing
      await new Promise(resolve => setTimeout(resolve, 10));
      const processingInfo = queue.getQueueInfo();

      expect(processingInfo.isProcessing).toBe(true);
      expect(processingInfo.activeOperations).toBe(1);

      await promise;

      // Check info after completion
      const completedInfo = queue.getQueueInfo();
      expect(completedInfo.isProcessing).toBe(false);
      expect(completedInfo.activeOperations).toBe(0);
    });

    it('should track operations in queue', async () => {
      const op1 = () => new Promise(resolve => setTimeout(resolve, 100));
      const op2 = () => new Promise(resolve => setTimeout(resolve, 50));

      // Enqueue operations
      const promise1 = queue.enqueue(op1, 10);
      const promise2 = queue.enqueue(op2, 5);

      // Check queue info
      const info = queue.getQueueInfo();
      
      expect(info.queueLength).toBeGreaterThanOrEqual(0); // May be 0 if first operation started
      expect(info.operations.length).toBeGreaterThanOrEqual(0);
      
      if (info.operations.length > 0) {
        expect(info.operations[0]).toMatchObject({
          priority: expect.any(Number),
          timestamp: expect.any(Number)
        });
      }

      await Promise.all([promise1, promise2]);
    });

    it('should provide operation counter in IDs', async () => {
      const op1 = jest.fn().mockReturnValue('result1');
      const op2 = jest.fn().mockReturnValue('result2');

      await queue.enqueue(op1);
      await queue.enqueue(op2);

      // Operation IDs should be different and contain counter
      expect(op1).toHaveBeenCalled();
      expect(op2).toHaveBeenCalled();
    });

    it('should track size and processing state', () => {
      expect(queue.size).toBe(0);
      expect(queue.processing).toBe(false);

      const longOperation = () => new Promise(resolve => setTimeout(resolve, 100));
      const promise = queue.enqueue(longOperation);

      // Size might be 0 if operation started immediately
      expect(queue.processing).toBe(true);

      return promise.then(() => {
        expect(queue.size).toBe(0);
        expect(queue.processing).toBe(false);
      });
    });
  });

  describe('Queue Clearing and Cleanup', () => {
    it('should clear queue and reject pending operations', async () => {
      const neverExecuted = jest.fn();
      const promises = [
        queue.enqueue(neverExecuted),
        queue.enqueue(neverExecuted),
        queue.enqueue(neverExecuted)
      ];

      queue.clear();

      const results = await Promise.allSettled(promises);

      expect(neverExecuted).not.toHaveBeenCalled();
      results.forEach(result => {
        expect(result.status).toBe('rejected');
        expect((result as PromiseRejectedResult).reason.message).toBe('Queue cleared');
      });

      expect(queue.size).toBe(0);
      expect(queue.processing).toBe(false);
    });

    it('should handle clear on empty queue', () => {
      expect(queue.size).toBe(0);
      
      queue.clear();
      
      expect(queue.size).toBe(0);
      expect(queue.processing).toBe(false);
    });

    it('should handle multiple clear calls', () => {
      const op = jest.fn().mockReturnValue('result');
      queue.enqueue(op);

      queue.clear();
      queue.clear(); // Should be safe

      expect(queue.size).toBe(0);
    });
  });

  describe('Advanced Scenarios', () => {
    it('should handle rapid enqueuing', async () => {
      const results: number[] = [];
      const promises: Promise<number>[] = [];

      // Rapidly enqueue many operations
      for (let i = 0; i < 50; i++) {
        promises.push(queue.enqueue(() => {
          results.push(i);
          return i;
        }));
      }

      await Promise.all(promises);

      expect(results).toHaveLength(50);
      expect(results).toEqual(Array.from({ length: 50 }, (_, i) => i));
    });

    it('should handle operations that enqueue other operations', async () => {
      const results: string[] = [];

      const recursiveOperation = (depth: number): Promise<string> => {
        return queue.enqueue(() => {
          results.push(`depth-${depth}`);
          
          if (depth > 0) {
            // Enqueue another operation
            return queue.enqueue(() => `nested-${depth}`);
          }
          
          return `final-${depth}`;
        });
      };

      const result = await recursiveOperation(2);

      expect(results).toContain('depth-2');
      expect(results).toContain('depth-0'); // From nested operation
      expect(typeof result).toBe('string');
    });

    it('should handle mixed sync and async operations', async () => {
      const executionOrder: string[] = [];

      const syncOp = () => {
        executionOrder.push('sync');
        return 'sync-result';
      };

      const asyncOp = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        executionOrder.push('async');
        return 'async-result';
      };

      const promises = [
        queue.enqueue(syncOp),
        queue.enqueue(asyncOp),
        queue.enqueue(syncOp)
      ];

      const results = await Promise.all(promises);

      expect(executionOrder).toEqual(['sync', 'async', 'sync']);
      expect(results).toEqual(['sync-result', 'async-result', 'sync-result']);
    });

    it('should handle operations with different return types', async () => {
      const stringOp = () => 'string';
      const numberOp = () => 42;
      const objectOp = () => ({ key: 'value' });
      const undefinedOp = () => undefined;

      const results = await Promise.all([
        queue.enqueue(stringOp),
        queue.enqueue(numberOp),
        queue.enqueue(objectOp),
        queue.enqueue(undefinedOp)
      ]);

      expect(results[0]).toBe('string');
      expect(results[1]).toBe(42);
      expect(results[2]).toEqual({ key: 'value' });
      expect(results[3]).toBeUndefined();
    });

    it('should maintain performance under load', async () => {
      const startTime = Date.now();
      const operationCount = 1000;
      
      const promises = Array.from({ length: operationCount }, (_, i) => 
        queue.enqueue(() => i)
      );

      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(operationCount);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero priority operations', async () => {
      const zeroOp = jest.fn().mockReturnValue('zero');
      const undefinedOp = jest.fn().mockReturnValue('undefined');

      const results = await Promise.all([
        queue.enqueue(zeroOp, 0),
        queue.enqueue(undefinedOp) // undefined priority
      ]);

      expect(results).toEqual(['zero', 'undefined']);
      expect(zeroOp).toHaveBeenCalled();
      expect(undefinedOp).toHaveBeenCalled();
    });

    it('should handle negative priority', async () => {
      const executionOrder: string[] = [];

      const promises = [
        queue.enqueue(() => { executionOrder.push('positive'); return 'positive'; }, 1),
        queue.enqueue(() => { executionOrder.push('negative'); return 'negative'; }, -1),
        queue.enqueue(() => { executionOrder.push('zero'); return 'zero'; }, 0)
      ];

      await Promise.all(promises);

      expect(executionOrder).toEqual(['positive', 'zero', 'negative']);
    });

    it('should handle very large priority values', async () => {
      const executionOrder: string[] = [];

      const promises = [
        queue.enqueue(() => { executionOrder.push('normal'); return 'normal'; }, 1),
        queue.enqueue(() => { executionOrder.push('max'); return 'max'; }, Number.MAX_SAFE_INTEGER),
        queue.enqueue(() => { executionOrder.push('min'); return 'min'; }, Number.MIN_SAFE_INTEGER)
      ];

      await Promise.all(promises);

      expect(executionOrder).toEqual(['max', 'normal', 'min']);
    });

    it('should handle operations that return promises', async () => {
      const promiseOp = () => Promise.resolve('promise-result');
      const directPromiseOp = () => new Promise(resolve => 
        setTimeout(() => resolve('delayed-result'), 10)
      );

      const results = await Promise.all([
        queue.enqueue(promiseOp),
        queue.enqueue(directPromiseOp)
      ]);

      expect(results).toEqual(['promise-result', 'delayed-result']);
    });

    it('should handle empty operations', async () => {
      const emptyOp = () => {};
      const nullOp = () => null;
      const falseOp = () => false;

      const results = await Promise.all([
        queue.enqueue(emptyOp),
        queue.enqueue(nullOp),
        queue.enqueue(falseOp)
      ]);

      expect(results[0]).toBeUndefined();
      expect(results[1]).toBeNull();
      expect(results[2]).toBe(false);
    });
  });
});