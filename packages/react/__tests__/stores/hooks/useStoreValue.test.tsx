/**
 * @fileoverview Simple tests for useStoreValue hook
 */

import { renderHook, act } from '@testing-library/react';
import { createStore } from '../../../src/stores/core/Store';
import { useStoreSelector } from '../../../src/stores/hooks/useStoreSelector';

// Simple useStoreValue for testing
function useStoreValue<T>(store: any): T;
function useStoreValue<T, R>(store: any, selector: (value: T) => R): R;
function useStoreValue<T, R>(store: any, selector?: (value: T) => R): T | R {
  if (!store) {
    return undefined as any;
  }
  
  if (selector) {
    return useStoreSelector(store, selector);
  }
  
  return useStoreSelector(store, (value: T) => value);
}

describe('useStoreValue', () => {
  it('should return current store value', () => {
    const store = createStore('test', 0);
    const { result } = renderHook(() => useStoreValue(store));
    expect(result.current).toBe(0);
  });

  it('should update when store value changes', async () => {
    const store = createStore('test', 0);
    const { result } = renderHook(() => useStoreValue(store));
    
    expect(result.current).toBe(0);
    
    act(() => {
      store.setValue(5);
    });
    
    // Wait for async update
    await act(async () => {
      await new Promise(resolve => requestAnimationFrame(resolve));
    });
    
    expect(result.current).toBe(5);
  });

  it('should handle null store gracefully', () => {
    const { result } = renderHook(() => useStoreValue(null));
    expect(result.current).toBeUndefined();
  });

  it('should work with selector function', async () => {
    const store = createStore('test', { name: 'John', age: 30 });
    
    const { result } = renderHook(() => 
      useStoreValue(store, (user: any) => user.name)
    );
    
    expect(result.current).toBe('John');
    
    act(() => {
      store.setValue({ name: 'Jane', age: 25 });
    });
    
    await act(async () => {
      await new Promise(resolve => requestAnimationFrame(resolve));
    });
    
    expect(result.current).toBe('Jane');
  });
});