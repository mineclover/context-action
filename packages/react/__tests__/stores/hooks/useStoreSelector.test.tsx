/**
 * @fileoverview Tests for useStoreSelector hook
 */

import { renderHook, act } from '@testing-library/react';
import { createStore } from '../../../src/stores/core/Store';
import { useStoreSelector } from '../../../src/stores/hooks/useStoreSelector';
import { shallowEqual } from '../../../src/stores/utils/comparison';

describe('useStoreSelector', () => {
  it('should return selected value from store', () => {
    const store = createStore('test', { name: 'John', age: 30 });
    const { result } = renderHook(() => 
      useStoreSelector(store, (state: any) => state.name)
    );
    
    expect(result.current).toBe('John');
  });

  it('should update when selected value changes', async () => {
    const store = createStore('test', { name: 'John', age: 30 });
    const { result } = renderHook(() => 
      useStoreSelector(store, (state: any) => state.name)
    );
    
    expect(result.current).toBe('John');
    
    act(() => {
      store.setValue({ name: 'Jane', age: 30 });
    });
    
    await act(async () => {
      await new Promise(resolve => requestAnimationFrame(resolve));
    });
    
    expect(result.current).toBe('Jane');
  });

  it('should not update when non-selected value changes', async () => {
    const store = createStore('test', { name: 'John', age: 30 });
    let renderCount = 0;
    
    const { result } = renderHook(() => {
      renderCount++;
      return useStoreSelector(store, (state: any) => state.name);
    });
    
    expect(result.current).toBe('John');
    expect(renderCount).toBe(1);
    
    // Change age (not selected)
    act(() => {
      store.setValue({ name: 'John', age: 31 });
    });
    
    await act(async () => {
      await new Promise(resolve => requestAnimationFrame(resolve));
    });
    
    expect(result.current).toBe('John');
    expect(renderCount).toBe(1); // Should not re-render
  });

  it('should work with custom equality function', async () => {
    const store = createStore('test', { user: { name: 'John' }, count: 0 });
    let renderCount = 0;
    
    const { result } = renderHook(() => {
      renderCount++;
      return useStoreSelector(
        store, 
        (state: any) => ({ name: state.user.name }),
        shallowEqual
      );
    });
    
    expect(result.current).toEqual({ name: 'John' });
    expect(renderCount).toBe(1);
    
    // Update count (should trigger re-render but result should be same)
    act(() => {
      store.setValue({ user: { name: 'John' }, count: 1 });
    });
    
    await act(async () => {
      await new Promise(resolve => requestAnimationFrame(resolve));
    });
    
    expect(result.current).toEqual({ name: 'John' });
    // Note: renderCount may increase but final result is same
  });

  it('should handle empty selector result', () => {
    const store = createStore('test', { items: [] });
    const { result } = renderHook(() => 
      useStoreSelector(store, (state: any) => state.items.length)
    );
    
    expect(result.current).toBe(0);
  });

  it('should handle complex object selection', async () => {
    const store = createStore('test', {
      users: [
        { id: 1, name: 'John', active: true },
        { id: 2, name: 'Jane', active: false }
      ]
    });
    
    const { result } = renderHook(() => 
      useStoreSelector(store, (state: any) => 
        state.users.filter((u: any) => u.active)
      )
    );
    
    expect(result.current).toHaveLength(1);
    expect(result.current[0].name).toBe('John');
    
    // Add active user
    act(() => {
      store.setValue({
        users: [
          { id: 1, name: 'John', active: true },
          { id: 2, name: 'Jane', active: true },
          { id: 3, name: 'Bob', active: true }
        ]
      });
    });
    
    await act(async () => {
      await new Promise(resolve => requestAnimationFrame(resolve));
    });
    
    expect(result.current).toHaveLength(3);
  });
});