/**
 * @fileoverview Tests for useActionHandler hook
 */

import { render, renderHook, act, waitFor } from '@testing-library/react';
import React, { useCallback } from 'react';
import { createActionContext } from '@context-action/react';

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

  it('should handle handler errors gracefully (non-blocking)', async () => {
    let handlerExecuted = false;
    let errorThrown = false;

    const TestComponent = () => {
      const dispatch = useActionDispatch();
      
      // Non-blocking handlers (default) do not throw errors to caller
      useActionHandler('fetchData', useCallback(async (payload) => {
        handlerExecuted = true;
        throw new Error('Handler error');
      }, []));
      
      return { dispatch };
    };

    const { result } = renderHook(() => TestComponent(), {
      wrapper: createWrapper()
    });

    // Non-blocking handlers should not throw errors to dispatch caller
    await act(async () => {
      try {
        await result.current.dispatch('fetchData', { id: 'test' });
      } catch (error) {
        errorThrown = true;
      }
    });

    // Handler should have executed, but error should not be thrown to caller
    expect(handlerExecuted).toBe(true);
    expect(errorThrown).toBe(false);
  });

  it('should propagate errors from blocking handlers', async () => {
    let handlerExecuted = false;
    let errorThrown = false;
    let caughtError: Error | null = null;

    const TestComponent = () => {
      const dispatch = useActionDispatch();
      
      // Blocking handlers throw errors to caller
      useActionHandler('fetchData', useCallback(async (payload) => {
        handlerExecuted = true;
        throw new Error('Blocking handler error');
      }, []), { blocking: true });
      
      return { dispatch };
    };

    const { result } = renderHook(() => TestComponent(), {
      wrapper: createWrapper()
    });

    // Blocking handlers should throw errors to dispatch caller
    await act(async () => {
      try {
        await result.current.dispatch('fetchData', { id: 'test' });
      } catch (error) {
        errorThrown = true;
        caughtError = error as Error;
      }
    });

    // Handler should have executed, and error should be thrown to caller
    expect(handlerExecuted).toBe(true);
    expect(errorThrown).toBe(true);
    expect((caughtError as unknown as Error)?.message).toBe('Blocking handler error');
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

  it('should preserve condition and cleanup handler config', async () => {
    const handler = jest.fn();
    const cleanup = jest.fn();

    const TestComponent = () => {
      const dispatch = useActionDispatch();

      useActionHandler(
        'fetchData',
        useCallback(handler, []),
        {
          condition: (payload: unknown) =>
            (payload as { id?: string }).id === 'allowed',
          cleanup,
        }
      );

      return { dispatch };
    };

    const { result, unmount } = renderHook(() => TestComponent(), {
      wrapper: createWrapper()
    });

    await act(async () => {
      await result.current.dispatch('fetchData', { id: 'blocked' });
      await result.current.dispatch('fetchData', { id: 'allowed' });
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'allowed' }),
      expect.any(Object)
    );

    unmount();

    await waitFor(() => expect(cleanup).toHaveBeenCalledTimes(1));
  });

  it('should preserve replaceExisting false for duplicate handler IDs', async () => {
    const firstHandler = jest.fn();
    const secondHandler = jest.fn();
    let dispatch: ReturnType<typeof useActionDispatch> | undefined;

    function FirstHandler() {
      useActionHandler(
        'fetchData',
        useCallback(firstHandler, []),
        { id: 'shared-handler', replaceExisting: false }
      );
      return null;
    }

    function IgnoredHandler() {
      useActionHandler(
        'fetchData',
        useCallback(secondHandler, []),
        { id: 'shared-handler', replaceExisting: false }
      );
      return null;
    }

    function DispatchProbe() {
      dispatch = useActionDispatch();
      return null;
    }

    const tree = (includeIgnoredHandler: boolean) => (
      <TestActionProvider>
        <FirstHandler />
        {includeIgnoredHandler ? <IgnoredHandler /> : null}
        <DispatchProbe />
      </TestActionProvider>
    );
    const view = render(tree(true));

    await act(async () => {
      await dispatch?.('fetchData', { id: 'before-ignored-unmount' });
    });

    expect(firstHandler).toHaveBeenCalledTimes(1);
    expect(secondHandler).not.toHaveBeenCalled();

    await act(async () => {
      view.rerender(tree(false));
      await Promise.resolve();
      await Promise.resolve();
    });
    await act(async () => {
      await dispatch?.('fetchData', { id: 'after-ignored-unmount' });
    });

    expect(firstHandler).toHaveBeenCalledTimes(2);
    expect(secondHandler).not.toHaveBeenCalled();
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
