/**
 * @fileoverview Tests for useStoreActions hook
 */

import { renderHook, act } from '@testing-library/react';
import { createStore } from '../../../src/stores/core/Store';
import { useStoreActions } from '../../../src/stores/hooks/useStoreActions';

describe('useStoreActions', () => {
  describe('Basic functionality', () => {
    it('should return memoized store actions', () => {
      const store = createStore('test', 0);
      
      const { result } = renderHook(() => useStoreActions(store));
      
      expect(result.current.setValue).toBeInstanceOf(Function);
      expect(result.current.update).toBeInstanceOf(Function);
      expect(result.current.getValue).toBeInstanceOf(Function);
    });

    it('should work with setValue action', () => {
      const store = createStore('test', 0);
      
      const { result } = renderHook(() => useStoreActions(store));
      
      act(() => {
        result.current.setValue(42);
      });
      
      expect(store.getValue()).toBe(42);
    });

    it('should work with update action', () => {
      const store = createStore('test', 0);
      
      const { result } = renderHook(() => useStoreActions(store));
      
      act(() => {
        result.current.update(prev => prev + 10);
      });
      
      expect(store.getValue()).toBe(10);
      
      act(() => {
        result.current.update(prev => prev * 2);
      });
      
      expect(store.getValue()).toBe(20);
    });

    it('should work with getValue action', () => {
      const store = createStore('test', 42);
      
      const { result } = renderHook(() => useStoreActions(store));
      
      const value = result.current.getValue();
      expect(value).toBe(42);
    });
  });

  describe('Memoization', () => {
    it('should return same action functions across re-renders', () => {
      const store = createStore('test', 0);
      
      const { result, rerender } = renderHook(() => useStoreActions(store));
      
      const initialActions = result.current;
      
      rerender();
      
      expect(result.current.setValue).toBe(initialActions.setValue);
      expect(result.current.update).toBe(initialActions.update);
      expect(result.current.getValue).toBe(initialActions.getValue);
    });

    it('should return new actions when store changes', () => {
      const store1 = createStore('test1', 0);
      
      const { result, rerender } = renderHook(
        ({ store }) => useStoreActions(store),
        { initialProps: { store: store1 } }
      );
      
      const initialActions = result.current;
      
      const store2 = createStore('test2', 0);
      rerender({ store: store2 });
      
      expect(result.current.setValue).not.toBe(initialActions.setValue);
      expect(result.current.update).not.toBe(initialActions.update);
      expect(result.current.getValue).not.toBe(initialActions.getValue);
    });
  });

  describe('Null/undefined store handling', () => {
    it('should handle null store gracefully', () => {
      const { result } = renderHook(() => useStoreActions(null));
      
      expect(result.current.setValue).toBeInstanceOf(Function);
      expect(result.current.update).toBeInstanceOf(Function);
      expect(result.current.getValue).toBeInstanceOf(Function);
      
      // Should not throw when called
      result.current.setValue(42);
      result.current.update(() => 100);
      const value = result.current.getValue();
      expect(value).toBeUndefined();
    });

    it('should handle undefined store gracefully', () => {
      const { result } = renderHook(() => useStoreActions(undefined));
      
      expect(result.current.setValue).toBeInstanceOf(Function);
      expect(result.current.update).toBeInstanceOf(Function);
      expect(result.current.getValue).toBeInstanceOf(Function);
      
      // Should not throw when called
      result.current.setValue(42);
      result.current.update(() => 100);
      const value = result.current.getValue();
      expect(value).toBeUndefined();
    });
  });

  describe('Complex data types', () => {
    it('should work with object stores', () => {
      const store = createStore('user', { name: 'John', age: 30 });
      
      const { result } = renderHook(() => useStoreActions(store));
      
      act(() => {
        result.current.setValue({ name: 'Jane', age: 25 });
      });
      
      expect(store.getValue()).toEqual({ name: 'Jane', age: 25 });
      
      act(() => {
        result.current.update(user => ({ ...user, age: user.age + 1 }));
      });
      
      expect(store.getValue()).toEqual({ name: 'Jane', age: 26 });
    });

    it('should work with array stores', () => {
      const store = createStore('items', [1, 2, 3]);
      
      const { result } = renderHook(() => useStoreActions(store));
      
      act(() => {
        result.current.update(items => [...items, 4]);
      });
      
      expect(store.getValue()).toEqual([1, 2, 3, 4]);
      
      act(() => {
        result.current.setValue([10, 20]);
      });
      
      expect(store.getValue()).toEqual([10, 20]);
    });
  });
});