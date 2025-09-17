import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePersistedStore } from '../../../src/stores/hooks/usePersistedStore';

describe('usePersistedStore', () => {
  // Mock localStorage
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    length: 0,
    key: jest.fn()
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Reset localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    });
  });

  it('should initialize with initial value when no stored value exists', () => {
    localStorageMock.getItem.mockReturnValue(null);

    const { result } = renderHook(() =>
      usePersistedStore('test-key', { count: 0 })
    );

    expect(result.current.getValue()).toEqual({ count: 0 });
    expect(localStorageMock.getItem).toHaveBeenCalledWith('test-key');
  });

  it('should initialize with stored value when it exists', () => {
    const storedValue = JSON.stringify({ count: 10 });
    localStorageMock.getItem.mockReturnValue(storedValue);

    const { result } = renderHook(() =>
      usePersistedStore('test-key', { count: 0 })
    );

    expect(result.current.getValue()).toEqual({ count: 10 });
  });

  it('should persist value to storage when store updates', async () => {
    localStorageMock.getItem.mockReturnValue(null);

    const { result } = renderHook(() =>
      usePersistedStore('test-key', { count: 0 })
    );

    act(() => {
      result.current.setValue({ count: 5 });
    });

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify({ count: 5 })
      );
    });
  });

  it('should handle deserialization errors gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    localStorageMock.getItem.mockReturnValue('invalid-json');

    const { result } = renderHook(() =>
      usePersistedStore('test-key', { count: 0 })
    );

    expect(result.current.getValue()).toEqual({ count: 0 });
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to load persisted value'),
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it('should handle serialization errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    localStorageMock.getItem.mockReturnValue(null);

    // Create a circular reference that cannot be serialized
    const circularRef: any = { count: 0 };
    circularRef.self = circularRef;

    const { result } = renderHook(() =>
      usePersistedStore('test-key', { count: 0 })
    );

    act(() => {
      result.current.setValue(circularRef);
    });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to persist value'),
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });

  it('should sync with storage changes from other tabs', () => {
    localStorageMock.getItem.mockReturnValue(null);

    const { result } = renderHook(() =>
      usePersistedStore('test-key', { count: 0 })
    );

    // Simulate storage event from another tab
    const storageEvent = new StorageEvent('storage');
    Object.defineProperty(storageEvent, 'key', { value: 'test-key', writable: false });
    Object.defineProperty(storageEvent, 'newValue', { value: JSON.stringify({ count: 20 }), writable: false });
    Object.defineProperty(storageEvent, 'oldValue', { value: JSON.stringify({ count: 0 }), writable: false });

    act(() => {
      window.dispatchEvent(storageEvent);
    });

    expect(result.current.getValue()).toEqual({ count: 20 });
  });

  it('should ignore storage events for other keys', () => {
    localStorageMock.getItem.mockReturnValue(null);

    const { result } = renderHook(() =>
      usePersistedStore('test-key', { count: 0 })
    );

    // Simulate storage event for different key
    const storageEvent = new StorageEvent('storage');
    Object.defineProperty(storageEvent, 'key', { value: 'other-key', writable: false });
    Object.defineProperty(storageEvent, 'newValue', { value: JSON.stringify({ count: 99 }), writable: false });
    Object.defineProperty(storageEvent, 'oldValue', { value: null, writable: false });

    act(() => {
      window.dispatchEvent(storageEvent);
    });

    expect(result.current.getValue()).toEqual({ count: 0 });
  });

  it('should use custom storage option', async () => {
    const sessionStorageMock = {
      getItem: jest.fn().mockReturnValue(null),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
      length: 0,
      key: jest.fn()
    };

    const { result } = renderHook(() =>
      usePersistedStore('test-key', { value: 'test' }, {
        storage: sessionStorageMock as any
      })
    );

    expect(sessionStorageMock.getItem).toHaveBeenCalledWith('test-key');

    act(() => {
      result.current.setValue({ value: 'updated' });
    });

    await waitFor(() => {
      expect(sessionStorageMock.setItem).toHaveBeenCalled();
    });
  });

  it('should use custom serialize/deserialize functions', async () => {
    const customSerialize = jest.fn((value) => `custom:${JSON.stringify(value)}`);
    const customDeserialize = jest.fn((value) => JSON.parse(value.replace('custom:', '')));

    localStorageMock.getItem.mockReturnValue('custom:{"count":15}');

    const { result } = renderHook(() =>
      usePersistedStore('test-key', { count: 0 }, {
        serialize: customSerialize,
        deserialize: customDeserialize
      })
    );

    expect(customDeserialize).toHaveBeenCalledWith('custom:{"count":15}');
    expect(result.current.getValue()).toEqual({ count: 15 });

    act(() => {
      result.current.setValue({ count: 25 });
    });

    await waitFor(() => {
      expect(customSerialize).toHaveBeenCalledWith({ count: 25 });
    });
  });

  it('should cleanup subscriptions on unmount', () => {
    localStorageMock.getItem.mockReturnValue(null);

    const { unmount } = renderHook(() =>
      usePersistedStore('test-key', { count: 0 })
    );

    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('storage', expect.any(Function));
    removeEventListenerSpy.mockRestore();
  });

  it('should handle storage event deserialization errors gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    localStorageMock.getItem.mockReturnValue(null);

    const { result } = renderHook(() =>
      usePersistedStore('test-key', { count: 0 })
    );

    // Simulate storage event with invalid JSON
    const storageEvent = new StorageEvent('storage');
    Object.defineProperty(storageEvent, 'key', { value: 'test-key', writable: false });
    Object.defineProperty(storageEvent, 'newValue', { value: 'invalid-json-from-other-tab', writable: false });
    Object.defineProperty(storageEvent, 'oldValue', { value: null, writable: false });

    act(() => {
      window.dispatchEvent(storageEvent);
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to sync value'),
      expect.any(Error)
    );
    expect(result.current.getValue()).toEqual({ count: 0 });

    consoleSpy.mockRestore();
  });
});