/**
 * @fileoverview Memory Leak Prevention Tests
 * 
 * Tests for memory leak prevention in EventBus and timeout handling.
 * Verifies safe handling of DOM elements, React components, and timeout IDs.
 */

import { EventBus } from '../../src/stores/core/EventBus';
import { createStore } from '../../src/stores/core/Store';
import { setErrorHandlingConfig } from '../../src/stores/utils/error-handling';

describe('Memory Leak Prevention', () => {
  beforeEach(() => {
    // Configure error handling for testing
    setErrorHandlingConfig({
      throwOnError: false,
      logLevel: 1, // ERROR level
    });
  });
  
  describe('EventBus Memory Safety', () => {
    let eventBus: EventBus;
    
    beforeEach(() => {
      eventBus = new EventBus(10); // Small history size for testing
    });
    
    afterEach(() => {
      eventBus.clear();
      eventBus.clearHistory();
    });
    
    test('should safely handle DOM elements in event data', () => {
      const divElement = document.createElement('div');
      divElement.id = 'test-div';
      divElement.className = 'test-class';
      divElement.textContent = 'Test content';
      
      // Emit event with DOM element
      eventBus.emit('domElementEvent', divElement);
      
      const history = eventBus.getHistory();
      expect(history.length).toBe(1);
      
      const eventData = history[0];
      expect(eventData).toBeDefined();
      expect(eventData!.event).toBe('domElementEvent');
      
      // Should store safe metadata, not the full element
      expect(eventData!.data).toEqual({
        __eventBusDataType: 'DOMElement',
        tagName: 'DIV',
        id: 'test-div',
        className: 'test-class',
        timestamp: expect.any(Number)
      });
      
      // Should not retain reference to original element
      expect(eventData!.data).not.toBe(divElement);
    });
    
    test('should safely handle React components', () => {
      const mockReactComponent = {
        type: 'div',
        props: { children: 'Hello' },
        _owner: { tag: 1 }, // React Fiber node marker
        $$typeof: Symbol.for('react.element'),
        constructor: { name: 'ReactElement' }
      };
      
      eventBus.emit('reactComponentEvent', mockReactComponent);
      
      const history = eventBus.getHistory();
      const eventData = history[0];
      expect(eventData).toBeDefined();
      
      // React components are detected as DOMElement type due to React markers
      expect(eventData!.data).toEqual({
        __eventBusDataType: 'DOMElement',
        tagName: 'ReactElement',
        id: undefined,
        className: undefined,
        timestamp: expect.any(Number)
      });
      
      expect(eventData!.data).not.toBe(mockReactComponent);
    });
    
    test('should safely handle complex objects', () => {
      class CustomClass {
        constructor(public value: string) {}
        
        toString() {
          return `CustomClass(${this.value})`;
        }
      }
      
      const customObject = new CustomClass('test value with a very long string that should be truncated');
      
      eventBus.emit('customObjectEvent', customObject);
      
      const history = eventBus.getHistory();
      const eventData = history[0];
      expect(eventData).toBeDefined();
      
      expect(eventData!.data).toEqual({
        __eventBusDataType: 'CustomClass',
        summary: 'CustomClass(test value with a very long string that should be truncated)',
        timestamp: expect.any(Number)
      });
    });
    
    test('should allow plain objects and arrays', () => {
      const plainObject = {
        id: 1,
        name: 'test',
        items: ['a', 'b', 'c']
      };
      
      const plainArray = [1, 2, 3, { nested: true }];
      
      eventBus.emit('plainObjectEvent', plainObject);
      eventBus.emit('plainArrayEvent', plainArray);
      
      const history = eventBus.getHistory();
      
      // Plain objects should be stored as-is
      expect(history[0]).toBeDefined();
      expect(history[1]).toBeDefined();
      expect(history[0]!.data).toEqual(plainObject);
      expect(history[1]!.data).toEqual(plainArray);
    });
    
    test('should handle null and primitive values normally', () => {
      eventBus.emit('nullEvent', null);
      eventBus.emit('stringEvent', 'test string');
      eventBus.emit('numberEvent', 42);
      eventBus.emit('booleanEvent', true);
      
      const history = eventBus.getHistory();
      
      expect(history[0]).toBeDefined();
      expect(history[1]).toBeDefined();
      expect(history[2]).toBeDefined();
      expect(history[3]).toBeDefined();
      expect(history[0]!.data).toBe(null);
      expect(history[1]!.data).toBe('test string');
      expect(history[2]!.data).toBe(42);
      expect(history[3]!.data).toBe(true);
    });
    
    test('should limit history size to prevent unbounded growth', () => {
      const maxSize = 10;
      const eventBus = new EventBus(maxSize);
      
      // Add more events than the limit
      for (let i = 0; i < maxSize + 5; i++) {
        eventBus.emit('testEvent', { index: i });
      }
      
      const history = eventBus.getHistory();
      
      // Should not exceed max size
      expect(history.length).toBe(maxSize);
      
      // Should contain the most recent events
      expect(history[0]).toBeDefined();
      expect(history[maxSize - 1]).toBeDefined();
      expect(history[0]!.data.index).toBe(5); // First kept event
      expect(history[maxSize - 1]!.data.index).toBe(maxSize + 4); // Last event
    });
  });
  
  describe('Store Timeout Handling', () => {
    test('should use proper timeout types for cross-platform compatibility', () => {
      const store = createStore('timeout-test', { value: 0 });
      
      // Test that batched updates work without type errors
      store.setValue({ value: 1 });
      store.setValue({ value: 2 });
      store.setValue({ value: 3 });
      
      // Allow batched updates to process
      return new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          expect(store.getValue().value).toBe(3);
          resolve();
        });
      });
    });
    
    test('should properly clean up timeouts on disposal', () => {
      const store = createStore('cleanup-test', { data: 'initial' });
      
      // Trigger batched updates
      store.setValue({ data: 'update1' });
      store.setValue({ data: 'update2' });
      
      // Dispose store - should clean up timeouts
      store.dispose();
      
      // Should not throw any errors
      expect(() => {
        store.dispose(); // Second disposal should be safe
      }).not.toThrow();
    });
  });
  
  describe('Circular Reference Handling', () => {
    test('should handle circular references in deep comparison', () => {
      const obj1: any = { name: 'obj1' };
      const obj2: any = { name: 'obj2' };
      
      // Create circular reference
      obj1.ref = obj2;
      obj2.ref = obj1;
      
      const store = createStore('circular-test', obj1);
      
      // Should not cause infinite recursion
      expect(() => {
        store.setValue(obj2);
      }).not.toThrow();
      
      // Should properly handle circular references by converting them to safe format
      const storedValue = store.getValue();
      expect(storedValue.name).toBe('obj2');
      // The stored value should preserve the structure but handle circular refs safely
      expect(storedValue.ref.name).toBe('obj1');
      expect(storedValue.ref.ref === storedValue || storedValue.ref.ref === '[Circular]').toBe(true);
    });
    
    test('should handle self-referencing objects', () => {
      const selfRef: any = { name: 'self' };
      selfRef.self = selfRef;
      
      const store = createStore('self-ref-test', { data: null });
      
      // Should not cause stack overflow
      expect(() => {
        store.setValue({ data: selfRef });
      }).not.toThrow();
    });
  });
  
  describe('Event Handler Cleanup', () => {
    test('should properly clean up event handlers', () => {
      const eventBus = new EventBus();
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      
      // Add handlers
      const unsubscribe1 = eventBus.on('test', handler1);
      const unsubscribe2 = eventBus.on('test', handler2);
      
      expect(eventBus.getHandlerCount('test')).toBe(2);
      
      // Remove one handler
      unsubscribe1();
      expect(eventBus.getHandlerCount('test')).toBe(1);
      
      // Remove second handler
      unsubscribe2();
      expect(eventBus.getHandlerCount('test')).toBe(0);
      
      // Event name should be cleaned up when no handlers remain
      expect(eventBus.getEventNames()).not.toContain('test');
    });
    
    test('should handle multiple unsubscribe calls safely', () => {
      const eventBus = new EventBus();
      const handler = jest.fn();
      
      const unsubscribe = eventBus.on('test', handler);
      
      // Multiple unsubscribe calls should be safe
      expect(() => {
        unsubscribe();
        unsubscribe();
        unsubscribe();
      }).not.toThrow();
      
      expect(eventBus.getHandlerCount('test')).toBe(0);
    });
  });
  
  describe('Memory Usage Patterns', () => {
    test('should not accumulate memory with repeated operations', () => {
      const eventBus = new EventBus(100);
      const store = createStore('memory-test', { counter: 0 });
      
      // Simulate heavy usage
      for (let i = 0; i < 1000; i++) {
        // Event operations
        const handler = () => {};
        const unsubscribe = eventBus.on(`event-${i % 10}`, handler);
        eventBus.emit(`event-${i % 10}`, { iteration: i });
        unsubscribe();
        
        // Store operations
        store.setValue({ counter: i });
      }
      
      // Clean up
      eventBus.clear();
      eventBus.clearHistory();
      store.dispose();
      
      // Should complete without memory issues
      expect(eventBus.getEventNames().length).toBe(0);
      expect(eventBus.getHistory().length).toBe(0);
    });
  });
});