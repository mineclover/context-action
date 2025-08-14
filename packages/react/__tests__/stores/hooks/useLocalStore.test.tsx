/**
 * @fileoverview Simple tests for useLocalStore hook
 */

import { renderHook, act } from '@testing-library/react';
import { useLocalStore } from '../../../src/stores/hooks/useLocalStore';

describe('useLocalStore', () => {
  it('should create a local store with initial value', () => {
    const { result } = renderHook(() => useLocalStore(0));
    
    expect(result.current.value).toBe(0);
    expect(result.current.store).toBeDefined();
  });

  it('should update store value', async () => {
    const { result } = renderHook(() => useLocalStore(0));
    
    expect(result.current.value).toBe(0);
    
    act(() => {
      result.current.store.setValue(5);
    });
    
    await act(async () => {
      await new Promise(resolve => requestAnimationFrame(resolve));
    });
    
    expect(result.current.value).toBe(5);
  });

  it('should work with custom name', () => {
    const { result } = renderHook(() => useLocalStore(0, 'testStore'));
    
    expect(result.current.store.name).toBe('testStore');
    expect(result.current.value).toBe(0);
  });

  it('should work with complex objects', async () => {
    const initialValue = { count: 0, name: 'test' };
    const { result } = renderHook(() => useLocalStore(initialValue));
    
    expect(result.current.value).toEqual(initialValue);
    
    act(() => {
      result.current.store.setValue({ count: 1, name: 'updated' });
    });
    
    await act(async () => {
      await new Promise(resolve => requestAnimationFrame(resolve));
    });
    
    expect(result.current.value).toEqual({ count: 1, name: 'updated' });
  });
});