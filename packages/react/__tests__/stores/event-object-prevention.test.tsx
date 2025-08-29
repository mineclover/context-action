/**
 * @fileoverview Event Object Prevention Tests
 * 
 * Tests for the enhanced event object detection and prevention system.
 * Verifies that DOM events and React events are blocked from being stored.
 */

import { createStore } from '../../src/stores/core/Store';
import { setErrorHandlingConfig, clearErrorLog, getErrorStatistics } from '../../src/stores/utils/error-handling';

describe('Event Object Prevention', () => {
  let store: ReturnType<typeof createStore>;
  let mockConsoleError: jest.SpyInstance;
  
  beforeEach(() => {
    store = createStore('test-event-prevention', { data: null });
    
    // Configure error handling for testing
    setErrorHandlingConfig({
      throwOnError: false,
      logLevel: 1, // ERROR level
    });
    
    clearErrorLog();
    
    // Mock console.error to capture error calls
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    mockConsoleError.mockRestore();
  });
  
  describe('DOM Event Prevention', () => {
    test('should prevent storing DOM click events', () => {
      const mockEvent = {
        type: 'click',
        target: document.createElement('div'),
        currentTarget: document.createElement('div'),
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        clientX: 100,
        clientY: 200,
        constructor: { name: 'MouseEvent' }
      };
      
      // Initial value should be unchanged
      const initialValue = store.getValue();
      
      // Attempt to store event object - should be prevented
      store.setValue({ event: mockEvent });
      
      // Store value should remain unchanged
      expect(store.getValue()).toEqual(initialValue);
      
      // Error should have been logged
      const stats = getErrorStatistics();
      expect(stats.totalErrors).toBeGreaterThan(0);
      expect(stats.errorsByType.STORE_ERROR).toBeGreaterThan(0);
    });
    
    test('should prevent storing keyboard events', () => {
      const mockKeyEvent = {
        type: 'keydown',
        target: document.createElement('input'),
        key: 'Enter',
        keyCode: 13,
        preventDefault: jest.fn(),
        constructor: { name: 'KeyboardEvent' }
      };
      
      const initialValue = store.getValue();
      
      store.setValue({ keyEvent: mockKeyEvent });
      
      // Store should remain unchanged
      expect(store.getValue()).toEqual(initialValue);
      
      const stats = getErrorStatistics();
      expect(stats.totalErrors).toBeGreaterThan(0);
    });
    
    test('should prevent storing form events', () => {
      const formElement = document.createElement('form');
      const mockFormEvent = {
        type: 'submit',
        target: formElement,
        currentTarget: formElement,
        preventDefault: jest.fn(),
        constructor: { name: 'SubmitEvent' }
      };
      
      const initialValue = store.getValue();
      
      store.setValue({ formEvent: mockFormEvent });
      
      expect(store.getValue()).toEqual(initialValue);
    });
  });
  
  describe('React Synthetic Event Prevention', () => {
    test('should prevent storing React synthetic events', () => {
      const mockSyntheticEvent = {
        type: 'click',
        nativeEvent: new Event('click'),
        currentTarget: document.createElement('button'),
        target: document.createElement('button'),
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        persist: jest.fn(),
        isDefaultPrevented: jest.fn().mockReturnValue(false),
        isPropagationStopped: jest.fn().mockReturnValue(false),
        $$typeof: Symbol.for('react.element'), // React marker
        _reactInternalFiber: {}, // React internal property
        constructor: { name: 'SyntheticEvent' }
      };
      
      const initialValue = store.getValue();
      
      store.setValue({ reactEvent: mockSyntheticEvent });
      
      expect(store.getValue()).toEqual(initialValue);
      
      const stats = getErrorStatistics();
      expect(stats.totalErrors).toBeGreaterThan(0);
    });
  });
  
  describe('Update Method Prevention', () => {
    test('should prevent event objects in update method', () => {
      const mockEvent = {
        type: 'change',
        target: document.createElement('input'),
        preventDefault: jest.fn(),
        constructor: { name: 'Event' }
      };
      
      const initialValue = store.getValue();
      
      // Attempt to update with event object
      store.update(() => ({ event: mockEvent }));
      
      // Store should remain unchanged
      expect(store.getValue()).toEqual(initialValue);
      
      const stats = getErrorStatistics();
      expect(stats.totalErrors).toBeGreaterThan(0);
    });
  });
  
  describe('Safe Data Extraction Examples', () => {
    test('should allow storing extracted event data', () => {
      const mockEvent = {
        type: 'click',
        target: document.createElement('button'),
        clientX: 150,
        clientY: 250,
        ctrlKey: true,
        preventDefault: jest.fn(),
        constructor: { name: 'MouseEvent' }
      };
      
      // Extract safe data from event
      const safeEventData = {
        type: mockEvent.type,
        clientX: mockEvent.clientX,
        clientY: mockEvent.clientY,
        ctrlKey: mockEvent.ctrlKey,
        targetTagName: mockEvent.target?.tagName,
        timestamp: Date.now()
      };
      
      // This should work fine
      store.setValue({ eventData: safeEventData });
      
      const storedValue = store.getValue();
      expect(storedValue.eventData).toEqual(safeEventData);
      
      // Should not have triggered any errors
      const stats = getErrorStatistics();
      expect(stats.totalErrors).toBe(0);
    });
    
    test('should allow storing form data without event object', () => {
      const formElement = document.createElement('form');
      const inputElement = document.createElement('input');
      inputElement.value = 'test value';
      formElement.appendChild(inputElement);
      
      // Extract form data without storing the event
      const formData = {
        values: {
          input: inputElement.value
        },
        isValid: true,
        timestamp: Date.now()
      };
      
      store.setValue({ formData });
      
      const storedValue = store.getValue();
      expect(storedValue.formData).toEqual(formData);
    });
  });
  
  describe('RefState Exception', () => {
    test('should allow RefState objects with target property', () => {
      const divElement = document.createElement('div');
      divElement.id = 'test-element';
      
      // RefState objects should be allowed (they legitimately have target property)
      const refState = {
        target: divElement,
        isMounted: true,
        // This should not trigger event object detection
        __contextActionRefState: true
      };
      
      store.setValue({ refState });
      
      const storedValue = store.getValue();
      expect(storedValue.refState).toEqual(refState);
      
      // Should not have triggered errors
      const stats = getErrorStatistics();
      expect(stats.totalErrors).toBe(0);
    });
  });
  
  describe('Error Context Information', () => {
    test('should provide detailed error context', () => {
      const mockEvent = {
        type: 'click',
        target: document.createElement('span'),
        preventDefault: jest.fn(),
        constructor: { name: 'MouseEvent' }
      };
      
      store.setValue({ problemEvent: mockEvent });
      
      const stats = getErrorStatistics();
      const recentError = stats.recentErrors[0];
      
      expect(recentError).toBeDefined();
      expect(recentError.context).toBeDefined();
      expect(recentError.context?.storeName).toBe('test-event-prevention');
      expect(recentError.context?.valueType).toBe('object');
      expect(recentError.context?.constructorName).toBe('Object');
    });
  });
  
  describe('Performance Impact', () => {
    test('should not significantly impact performance for normal objects', () => {
      const normalObject = {
        id: 1,
        name: 'test',
        nested: {
          value: 'nested data'
        }
      };
      
      const startTime = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        store.setValue({ data: { ...normalObject, iteration: i } });
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete quickly (under 100ms for 1000 operations)
      expect(duration).toBeLessThan(100);
    });
  });
});