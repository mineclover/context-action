/**
 * @fileoverview Tests for useActionDispatch hook
 */

import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { createActionContext } from '../../src/actions/ActionContext';

interface TestActions {
  updateUser: { id: string; name: string };
  deleteUser: { id: string };
  resetApp: void;
}

const { 
  Provider: TestActionProvider,
  useActionDispatch,
  useActionHandler
} = createActionContext<TestActions>('TestActions');

function createWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <TestActionProvider>{children}</TestActionProvider>
  );
}

describe('useActionDispatch', () => {
  it('should return dispatch function', () => {
    const { result } = renderHook(() => useActionDispatch(), {
      wrapper: createWrapper()
    });
    
    expect(typeof result.current).toBe('function');
  });

  it('should dispatch actions to registered handlers', async () => {
    let handlerCalled = false;
    let receivedPayload: any = null;

    const TestComponent = () => {
      const dispatch = useActionDispatch();
      
      useActionHandler('updateUser', async (payload) => {
        handlerCalled = true;
        receivedPayload = payload;
      });
      
      return { dispatch };
    };

    const { result } = renderHook(() => TestComponent(), {
      wrapper: createWrapper()
    });

    await act(async () => {
      await result.current.dispatch('updateUser', { id: '1', name: 'John' });
    });

    expect(handlerCalled).toBe(true);
    expect(receivedPayload).toEqual({ id: '1', name: 'John' });
  });

  it('should handle void actions', async () => {
    let handlerCalled = false;

    const TestComponent = () => {
      const dispatch = useActionDispatch();
      
      useActionHandler('resetApp', async () => {
        handlerCalled = true;
      });
      
      return { dispatch };
    };

    const { result } = renderHook(() => TestComponent(), {
      wrapper: createWrapper()
    });

    await act(async () => {
      await result.current.dispatch('resetApp');
    });

    expect(handlerCalled).toBe(true);
  });

  it('should handle multiple handlers for same action', async () => {
    const executionOrder: string[] = [];

    const TestComponent = () => {
      const dispatch = useActionDispatch();
      
      useActionHandler('updateUser', async (payload) => {
        executionOrder.push('handler1');
      }, { priority: 1 });
      
      useActionHandler('updateUser', async (payload) => {
        executionOrder.push('handler2');
      }, { priority: 2 });
      
      return { dispatch };
    };

    const { result } = renderHook(() => TestComponent(), {
      wrapper: createWrapper()
    });

    await act(async () => {
      await result.current.dispatch('updateUser', { id: '1', name: 'John' });
    });

    expect(executionOrder).toEqual(['handler2', 'handler1']); // Higher priority first
  });

  it('should handle action without registered handlers', async () => {
    const { result } = renderHook(() => useActionDispatch(), {
      wrapper: createWrapper()
    });

    // Should not throw error
    await act(async () => {
      await result.current('updateUser', { id: '1', name: 'John' });
    });

    // Test passes if no error is thrown
    expect(true).toBe(true);
  });

  it('should be stable across re-renders', () => {
    const { result, rerender } = renderHook(() => useActionDispatch(), {
      wrapper: createWrapper()
    });

    const firstDispatch = result.current;
    
    rerender();
    
    const secondDispatch = result.current;
    
    expect(firstDispatch).toBe(secondDispatch);
  });
});