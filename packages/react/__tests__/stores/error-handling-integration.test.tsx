/**
 * @fileoverview Error Handling Integration Tests
 * 
 * Tests for centralized error handling system integration across all modules.
 * Verifies proper error context, logging, and recovery mechanisms.
 */

import { EventBus } from '../../src/stores/core/EventBus';
import { createStore } from '../../src/stores/core/Store';
import { 
  setErrorHandlingConfig, 
  clearErrorLog, 
  getErrorStatistics, 
  getFilteredErrors,
  ErrorHandlers,
  ContextActionErrorType 
} from '../../src/stores/utils/error-handling';

describe('Error Handling Integration', () => {
  let mockConsoleError: jest.SpyInstance;
  let mockConsoleWarn: jest.SpyInstance;
  let mockConsoleInfo: jest.SpyInstance;
  let mockConsoleDebug: jest.SpyInstance;
  let globalErrorBoundaryMock: any;
  let originalGlobalErrorBoundary: any;
  let testCounter: number;
  
  beforeEach(() => {
    // Initialize test counter for unique naming
    testCounter = Date.now() + Math.floor(Math.random() * 1000);
    
    // Save original globalErrorBoundary
    originalGlobalErrorBoundary = (globalThis as any).globalErrorBoundary;
    
    // Create isolated mock for each test
    let mockErrorCount = 0;
    let mockLastError: any = null;
    
    globalErrorBoundaryMock = {
      reset: jest.fn(() => {
        mockErrorCount = 0;
        mockLastError = null;
      }),
      getErrorCount: jest.fn(() => mockErrorCount),
      getLastError: jest.fn(() => mockLastError),
      reportError: jest.fn((error) => {
        mockErrorCount++;
        mockLastError = error;
      }),
    };
    
    // Set up isolated globalErrorBoundary for this test
    (globalThis as any).globalErrorBoundary = globalErrorBoundaryMock;
    
    // Configure error handling for testing - isolated config
    setErrorHandlingConfig({
      throwOnError: false,
      logLevel: 4, // DEBUG level to capture all
      suppressRepeatedErrors: true,
      maxLogEntries: 100,
      enableStackTrace: true,
      logErrors: true
    });
    
    // Clear error log to ensure isolation
    clearErrorLog();
    
    // Mock console methods with isolation
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockConsoleInfo = jest.spyOn(console, 'info').mockImplementation(() => {});
    mockConsoleDebug = jest.spyOn(console, 'debug').mockImplementation(() => {});
  });
  
  afterEach(() => {
    // Restore console methods
    mockConsoleError.mockRestore();
    mockConsoleWarn.mockRestore();
    mockConsoleInfo.mockRestore();
    mockConsoleDebug.mockRestore();
    
    // Restore original globalErrorBoundary
    (globalThis as any).globalErrorBoundary = originalGlobalErrorBoundary;
    
    // Clear error log for next test
    clearErrorLog();
    
    // Reset error handling config to defaults
    setErrorHandlingConfig({
      throwOnError: false,
      logLevel: 1, // ERROR level
      suppressRepeatedErrors: true,
      maxLogEntries: 100,
      enableStackTrace: true,
      logErrors: true
    });
  });
  
  describe('Store Error Integration', () => {
    test('should use centralized error handling for comparison errors', () => {
      const store = createStore(`error-test-${testCounter}`, { data: 'initial' });
      
      // Set up a custom comparator that throws
      store.setCustomComparator(() => {
        throw new Error('Comparison failed');
      });
      
      // This should trigger error handling but not crash
      store.setValue({ data: 'updated' });
      
      const stats = getErrorStatistics();
      expect(stats.totalErrors).toBeGreaterThan(0);
      expect(stats.errorsByType.STORE_ERROR).toBeGreaterThan(0);
      
      // Should fallback to reference comparison
      expect(store.getValue().data).toBe('updated');
    });
    
    test('should handle listener execution errors', async () => {
      const store = createStore(`listener-error-test-${testCounter}`, { value: 0 });
      
      // Add a listener that throws
      const unsubscribe = store.subscribe(() => {
        throw new Error('Listener error');
      });
      
      // This should not crash the store
      store.setValue({ value: 1 });
      
      // Store should still be updated
      expect(store.getValue().value).toBe(1);
      
      // Wait for batched updates and error handling to complete
      await new Promise(resolve => requestAnimationFrame(resolve));
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const stats = getErrorStatistics();
      expect(stats.totalErrors).toBeGreaterThan(0);
      
      unsubscribe();
    });
    
    test('should handle batch update errors', async () => {
      const store = createStore(`batch-error-test-${testCounter}`, { items: [] as number[] });
      
      // Add multiple listeners, one that throws
      store.subscribe(() => {
        throw new Error('Batch error');
      });
      
      const workingListener = jest.fn();
      store.subscribe(workingListener);
      
      store.setValue({ items: [1, 2, 3] });
      
      // Wait for batched updates and error handling to complete
      await new Promise(resolve => requestAnimationFrame(resolve));
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Working listener should still have been called
      expect(workingListener).toHaveBeenCalled();
      
      const stats = getErrorStatistics();
      expect(stats.errorsByType.STORE_ERROR).toBeGreaterThan(0);
    });
  });
  
  describe('EventBus Error Integration', () => {
    test('should handle event handler errors gracefully', async () => {
      const eventBus = new EventBus();
      
      // Add handlers - one that throws, one that works
      const workingHandler = jest.fn();
      const errorHandler = jest.fn(() => {
        throw new Error('Handler error');
      });
      
      eventBus.on('test-event', errorHandler);
      eventBus.on('test-event', workingHandler);
      
      // Emit event - should not crash
      eventBus.emit('test-event', { data: 'test' });
      
      // Working handler should still execute
      expect(workingHandler).toHaveBeenCalled();
      
      // Wait for async error handling to complete
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Error should be logged
      const stats = getErrorStatistics();
      expect(stats.errorsByType.STORE_ERROR).toBeGreaterThan(0);
    });
    
    test('should provide detailed error context for event handlers', async () => {
      const eventBus = new EventBus();
      
      // Clear error log before test
      clearErrorLog();
      
      eventBus.on('context-test', () => {
        throw new Error('Context test error');
      });
      
      eventBus.emit('context-test', { payload: 'test data' });
      
      // Wait for async error handling to complete (dynamic import + promise chain)
      await Promise.resolve();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const recentErrors = getErrorStatistics().recentErrors;
      
      const error = recentErrors.find(e => 
        e.type === 'STORE_ERROR' && e.context?.event === 'context-test'
      );
      
      expect(error).toBeDefined();
      expect(error?.context).toEqual(
        expect.objectContaining({
          event: 'context-test',
          handlerCount: 1
        })
      );
    });
  });
  
  describe('Error Statistics and Filtering', () => {
    test('should collect comprehensive error statistics', () => {
      // Generate different types of errors
      ErrorHandlers.store('Store error 1', { storeName: 'test1' });
      ErrorHandlers.action('Action error 1', { actionName: 'testAction' });
      ErrorHandlers.ref('Ref error 1', { refName: 'testRef' });
      ErrorHandlers.validation('Validation error 1', { field: 'testField' });
      
      const stats = getErrorStatistics();
      
      expect(stats.totalErrors).toBe(4);
      expect(stats.errorsByType.STORE_ERROR).toBe(1);
      expect(stats.errorsByType.ACTION_ERROR).toBe(1);
      expect(stats.errorsByType.REF_ERROR).toBe(1);
      expect(stats.errorsByType.VALIDATION_ERROR).toBe(1);
      
      expect(stats.recentErrors).toHaveLength(4);
      expect(stats.mostFrequentErrors).toHaveLength(4);
    });
    
    test('should filter errors by type', () => {
      ErrorHandlers.store('Store error', { storeName: 'test' });
      ErrorHandlers.action('Action error', { actionName: 'test' });
      
      const storeErrors = getFilteredErrors({ type: ContextActionErrorType.STORE_ERROR });
      const actionErrors = getFilteredErrors({ type: ContextActionErrorType.ACTION_ERROR });
      
      expect(storeErrors).toHaveLength(1);
      expect(actionErrors).toHaveLength(1);
      expect(storeErrors[0]?.error.type).toBe(ContextActionErrorType.STORE_ERROR);
    });
    
    test('should filter errors by time', async () => {
      
      ErrorHandlers.store('Old error', { time: 'old' });
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const midTime = Date.now();
      ErrorHandlers.store('New error', { time: 'new' });
      
      const recentErrors = getFilteredErrors({ since: midTime });
      expect(recentErrors).toHaveLength(1);
      expect(recentErrors[0]?.error.context?.time).toBe('new');
    });
    
    test('should limit error results', () => {
      for (let i = 0; i < 10; i++) {
        ErrorHandlers.store(`Error ${i}`, { index: i });
      }
      
      const limitedErrors = getFilteredErrors({ limit: 5 });
      expect(limitedErrors).toHaveLength(5);
      
      // Should be the most recent 5
      expect(limitedErrors[4]?.error.context?.index).toBe(9);
    });
  });
  
  describe('Error Suppression and Deduplication', () => {
    beforeEach(() => {
      // Additional isolation for suppression tests
      clearErrorLog();
      globalErrorBoundaryMock.reset();
      jest.clearAllMocks();
    });
    
    test('should suppress repeated errors', () => {
      const errorMessage = 'Repeated error';
      const context = { component: 'test' };
      
      // Generate same error multiple times
      for (let i = 0; i < 15; i++) {
        ErrorHandlers.store(errorMessage, context);
      }
      
      const stats = getErrorStatistics();
      
      // Should only have 1 unique error entry
      expect(stats.mostFrequentErrors).toHaveLength(1);
      expect(stats.mostFrequentErrors[0]?.count).toBe(15);
      
      // Should have warned about repeated errors (every 10th occurrence)
      expect(mockConsoleWarn).toHaveBeenCalled();
    });
    
    test('should treat different contexts as separate errors', () => {
      const errorMessage = 'Same message';
      
      ErrorHandlers.store(errorMessage, { component: 'ComponentA' });
      ErrorHandlers.store(errorMessage, { component: 'ComponentB' });
      
      const stats = getErrorStatistics();
      expect(stats.mostFrequentErrors).toHaveLength(2);
      expect(stats.totalErrors).toBe(2);
    });
  });
  
  describe('Error Recovery and Graceful Degradation', () => {
    beforeEach(() => {
      // Additional isolation for recovery tests
      clearErrorLog();
      globalErrorBoundaryMock.reset();
    });
    
    test('should maintain functionality after errors', () => {
      const store = createStore(`recovery-test-${testCounter}`, { data: 'initial' });
      
      // Cause an error in comparison
      store.setCustomComparator(() => {
        throw new Error('Comparison error');
      });
      
      store.setValue({ data: 'value1' });
      
      // Clear the problematic comparator
      store.clearCustomComparator();
      
      // Should continue working normally
      store.setValue({ data: 'value2' });
      expect(store.getValue().data).toBe('value2');
    });
    
    test('should handle error handling system failures', () => {
      // Test what happens when error handling itself fails
      const originalError = ErrorHandlers.store;
      
      // Mock error in error handler
      (ErrorHandlers as any).store = jest.fn(() => {
        throw new Error('Error handler error');
      });
      
      const store = createStore(`meta-error-test-${testCounter}`, { value: 0 });
      
      // Should not crash even if error handling fails
      expect(() => {
        // Trigger an error that would use error handling
        store.subscribe(() => {
          throw new Error('Original error');
        });
        store.setValue({ value: 1 });
      }).not.toThrow();
      
      // Restore original
      (ErrorHandlers as any).store = originalError;
    });
  });
  
  describe('Development vs Production Behavior', () => {
    test('should adjust logging based on environment', () => {
      const originalEnv = process.env.NODE_ENV;
      
      // Test production mode
      process.env.NODE_ENV = 'production';
      
      setErrorHandlingConfig({
        logLevel: 1, // ERROR only
        throwOnError: false
      });
      
      ErrorHandlers.store('Production error', { mode: 'production' });
      
      // Should log error but not debug info
      expect(mockConsoleError).toHaveBeenCalled();
      
      // Restore
      process.env.NODE_ENV = originalEnv;
    });
  });
  
  describe('Integration with Async Operations', () => {
    test('should handle async operation errors', () => {
      // Test that async errors don't crash the system
      // Note: EventBus doesn't currently have built-in async error handling
      // This test verifies the system remains stable
      
      const eventBus = new EventBus();
      
      // Add async handler that throws (wrapped to catch async errors)
      eventBus.on('async-test', (_data) => {
        // Simulate async error handling pattern
        Promise.resolve()
          .then(async () => {
            await new Promise(resolve => setTimeout(resolve, 10));
            throw new Error('Async error');
          })
          .catch(error => {
            // In real implementation, this would use ErrorHandlers
            ErrorHandlers.store('Async operation failed', { 
              event: 'async-test',
              error: error.message 
            });
          });
      });
      
      // This should not crash
      expect(() => {
        eventBus.emit('async-test', { data: 'test' });
      }).not.toThrow();
      
      // EventBus should continue working
      expect(eventBus.getHandlerCount('async-test')).toBe(1);
    });
  });
});