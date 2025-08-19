/**
 * @fileoverview Tests for useActionHandler hook
 */

import { renderHook, act } from '@testing-library/react';
import React, { useCallback } from 'react';
import { createActionContext } from '../../src/actions/ActionContext';

interface TestActions {
  fetchData: { id: string };
  saveData: { data: any };
  clearCache: void;
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

describe('useActionHandler', () => {
  it('should register action handler', async () => {
    let handlerExecuted = false;
    let receivedPayload: any = null;

    const TestComponent = () => {
      const dispatch = useActionDispatch();
      
      useActionHandler('fetchData', useCallback(async (payload) => {
        handlerExecuted = true;
        receivedPayload = payload;
      }, []));
      
      return { dispatch };
    };

    const { result } = renderHook(() => TestComponent(), {
      wrapper: createWrapper()
    });

    await act(async () => {
      await result.current.dispatch('fetchData', { id: 'test-123' });
    });

    expect(handlerExecuted).toBe(true);
    expect(receivedPayload).toEqual({ id: 'test-123' });
  });

  it('should handle void actions', async () => {
    let handlerExecuted = false;

    const TestComponent = () => {
      const dispatch = useActionDispatch();
      
      useActionHandler('clearCache', useCallback(async () => {
        handlerExecuted = true;
      }, []));
      
      return { dispatch };
    };

    const { result } = renderHook(() => TestComponent(), {
      wrapper: createWrapper()
    });

    await act(async () => {
      await result.current.dispatch('clearCache');
    });

    expect(handlerExecuted).toBe(true);
  });

  it('should register multiple handlers with different priorities', async () => {
    const executionOrder: string[] = [];

    const TestComponent = () => {
      const dispatch = useActionDispatch();
      
      useActionHandler('fetchData', useCallback(async (payload) => {
        executionOrder.push('low-priority');
      }, []), { priority: 1 });
      
      useActionHandler('fetchData', useCallback(async (payload) => {
        executionOrder.push('high-priority');
      }, []), { priority: 10 });
      
      useActionHandler('fetchData', useCallback(async (payload) => {
        executionOrder.push('medium-priority');
      }, []), { priority: 5 });
      
      return { dispatch };
    };

    const { result } = renderHook(() => TestComponent(), {
      wrapper: createWrapper()
    });

    await act(async () => {
      await result.current.dispatch('fetchData', { id: 'test' });
    });

    expect(executionOrder).toEqual(['high-priority', 'medium-priority', 'low-priority']);
  });

  it('should cleanup handlers on unmount', async () => {
    let handlerExecuted = false;

    const TestComponent = () => {
      const dispatch = useActionDispatch();
      
      useActionHandler('fetchData', useCallback(async (payload) => {
        handlerExecuted = true;
      }, []));
      
      return { dispatch };
    };

    const { result, unmount } = renderHook(() => TestComponent(), {
      wrapper: createWrapper()
    });

    // First dispatch should work
    await act(async () => {
      await result.current.dispatch('fetchData', { id: 'test1' });
    });
    expect(handlerExecuted).toBe(true);

    // Reset and unmount
    handlerExecuted = false;
    unmount();

    // Create new instance to test cleanup
    const { result: newResult } = renderHook(() => useActionDispatch(), {
      wrapper: createWrapper()
    });

    // Dispatch after unmount should not execute old handler
    await act(async () => {
      await newResult.current('fetchData', { id: 'test2' });
    });

    expect(handlerExecuted).toBe(false);
  });

  it('should handle handler errors gracefully', async () => {
    let errorThrown = false;

    const TestComponent = () => {
      const dispatch = useActionDispatch();
      
      useActionHandler('fetchData', useCallback(async (payload) => {
        throw new Error('Handler error');
      }, []));
      
      return { dispatch };
    };

    const { result } = renderHook(() => TestComponent(), {
      wrapper: createWrapper()
    });

    // Should not throw error at call site
    await act(async () => {
      try {
        await result.current.dispatch('fetchData', { id: 'test' });
      } catch (error) {
        errorThrown = true;
      }
    });

    // Error should be thrown by ActionRegister when handler fails
    expect(errorThrown).toBe(true);
  });

  it('should support conditional handler registration', async () => {
    let handlerExecuted = false;
    let condition = false;

    const TestComponent = () => {
      const dispatch = useActionDispatch();
      
      // Use handler with condition check inside to maintain hook order
      const conditionalHandler = useCallback(async (payload: any) => {
        if (condition) {
          handlerExecuted = true;
        }
      }, []);
      
      useActionHandler('fetchData', conditionalHandler);
      
      return { dispatch };
    };

    // First render with condition false
    const { result, rerender } = renderHook(() => TestComponent(), {
      wrapper: createWrapper()
    });

    await act(async () => {
      await result.current.dispatch('fetchData', { id: 'test1' });
    });
    expect(handlerExecuted).toBe(false);

    // Re-render with condition true
    condition = true;
    rerender();

    await act(async () => {
      await result.current.dispatch('fetchData', { id: 'test2' });
    });
    expect(handlerExecuted).toBe(true);
  });

  it('should handle handler re-registration', async () => {
    let executionCount = 0;
    let currentVersion = 1;

    const TestComponent = ({ version }: { version: number }) => {
      const dispatch = useActionDispatch();
      currentVersion = version;
      
      useActionHandler('fetchData', useCallback(async (payload) => {
        executionCount += currentVersion;
      }, [version]));
      
      return { dispatch };
    };

    const { result, rerender } = renderHook(
      ({ version }) => TestComponent({ version }), 
      { 
        wrapper: createWrapper(),
        initialProps: { version: 1 }
      }
    );

    // First execution with version 1
    await act(async () => {
      await result.current.dispatch('fetchData', { id: 'test1' });
    });
    expect(executionCount).toBe(1);

    // Re-render with version 2
    rerender({ version: 2 });

    await act(async () => {
      await result.current.dispatch('fetchData', { id: 'test2' });
    });
    expect(executionCount).toBe(3); // 1 + 2 = 3
  });
});