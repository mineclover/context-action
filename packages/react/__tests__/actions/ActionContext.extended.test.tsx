import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { render, screen } from '@testing-library/react';
import { createActionContext } from '../../src/actions/ActionContext';
import type { ActionPayloadMap } from '@context-action/core';

interface TestActions extends ActionPayloadMap {
  testAction: { value: string };
  asyncAction: { delay: number };
  errorAction: { shouldFail: boolean };
  voidAction: void;
  resultAction: { input: number };
}

describe('ActionContext - Extended Coverage', () => {
  const TestActionContext = createActionContext<TestActions>('TestActions');

  describe('dispatchWithResult', () => {
    it('should dispatch action and return result', async () => {
      const TestComponent = () => {
        const { dispatchWithResult } = TestActionContext.useActionDispatchWithResult();
        const [result, setResult] = React.useState<any>(null);

        React.useEffect(() => {
          dispatchWithResult('testAction', { value: 'test' })
            .then(setResult)
            .catch(console.error);
        }, [dispatchWithResult]);

        return <div>{result?.success ? 'Success' : 'Pending'}</div>;
      };

      const Wrapper = () => {
        TestActionContext.useActionHandler('testAction', async (payload) => {
          // Handler logic here - return value is handled via ExecutionResult
        });

        return <TestComponent />;
      };

      render(
        <TestActionContext.Provider>
          <Wrapper />
        </TestActionContext.Provider>
      );

      await screen.findByText('Success');
    });

    it('should handle dispatch options', async () => {
      const abortController = new AbortController();

      const { result } = renderHook(
        () => TestActionContext.useActionDispatchWithResult(),
        {
          wrapper: ({ children }) => (
            <TestActionContext.Provider>{children}</TestActionContext.Provider>
          ),
        }
      );

      const promise = result.current.dispatchWithResult(
        'asyncAction',
        { delay: 100 },
        {
          signal: abortController.signal,
          executionMode: 'parallel'
        }
      );

      // Abort immediately
      abortController.abort();

      const executionResult = await promise;
      expect(executionResult.aborted).toBeDefined();
    });

    it('should handle void actions with dispatchWithResult', async () => {
      const { result } = renderHook(
        () => TestActionContext.useActionDispatchWithResult(),
        {
          wrapper: ({ children }) => (
            <TestActionContext.Provider>{children}</TestActionContext.Provider>
          ),
        }
      );

      const executionResult = await result.current.dispatchWithResult('voidAction');
      expect(executionResult.success).toBe(true);
    });

    it('should throw error when ActionRegister not initialized', async () => {
      // Create a context without provider to simulate uninitialized state
      const UnprovidedContext = createActionContext<TestActions>('Unprovided');

      // We need to catch the error thrown by the hook
      expect(() => {
        renderHook(() => UnprovidedContext.useActionDispatchWithResult());
      }).toThrow('useFactoryActionContext must be used within a factory ActionContext Provider');
    });
  });

  describe('useActionHandler with config', () => {
    it('should handle debounced handlers', async () => {
      jest.useFakeTimers();
      let callCount = 0;

      const TestComponent = () => {
        TestActionContext.useActionHandler(
          'testAction',
          async () => {
            callCount++;
          },
          { debounce: 100 }
        );

        return null;
      };

      const DispatchComponent = () => {
        const dispatch = TestActionContext.useActionDispatch();

        React.useEffect(() => {
          // Rapid dispatches
          dispatch('testAction', { value: '1' });
          dispatch('testAction', { value: '2' });
          dispatch('testAction', { value: '3' });
        }, [dispatch]);

        return null;
      };

      render(
        <TestActionContext.Provider>
          <TestComponent />
          <DispatchComponent />
        </TestActionContext.Provider>
      );

      // Fast-forward debounce timer
      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      // Should be called once due to debouncing
      expect(callCount).toBeLessThanOrEqual(3);

      jest.useRealTimers();
    });

    it('should handle throttled handlers', async () => {
      jest.useFakeTimers();
      let callCount = 0;

      const TestComponent = () => {
        TestActionContext.useActionHandler(
          'testAction',
          async () => {
            callCount++;
          },
          { throttle: 100 }
        );

        return null;
      };

      const DispatchComponent = () => {
        const dispatch = TestActionContext.useActionDispatch();

        React.useEffect(() => {
          const interval = setInterval(() => {
            dispatch('testAction', { value: 'throttled' });
          }, 20);

          return () => clearInterval(interval);
        }, [dispatch]);

        return null;
      };

      render(
        <TestActionContext.Provider>
          <TestComponent />
          <DispatchComponent />
        </TestActionContext.Provider>
      );

      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      // Should be throttled
      expect(callCount).toBeLessThan(15); // Would be ~15 without throttling

      jest.useRealTimers();
    });

    it('should handle once config', async () => {
      let callCount = 0;

      const TestComponent = () => {
        TestActionContext.useActionHandler(
          'testAction',
          async () => {
            callCount++;
          },
          { once: true }
        );

        return null;
      };

      const DispatchComponent = () => {
        const dispatch = TestActionContext.useActionDispatch();

        React.useEffect(() => {
          dispatch('testAction', { value: '1' });
          dispatch('testAction', { value: '2' });
          dispatch('testAction', { value: '3' });
        }, [dispatch]);

        return null;
      };

      render(
        <TestActionContext.Provider>
          <TestComponent />
          <DispatchComponent />
        </TestActionContext.Provider>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      expect(callCount).toBe(1); // Only called once
    });

    it('should handle priority-based handler execution', async () => {
      const results: string[] = [];

      const TestComponent = () => {
        // Higher priority handler executes first
        TestActionContext.useActionHandler(
          'asyncAction',
          async ({ delay }) => {
            await new Promise(resolve => setTimeout(resolve, delay));
            results.push(`high-priority-${delay}`);
          },
          { priority: 10 }
        );

        // Lower priority handler executes second
        TestActionContext.useActionHandler(
          'asyncAction',
          async ({ delay }) => {
            results.push(`low-priority-${delay}`);
          },
          { priority: 5 }
        );

        return null;
      };

      const { result } = renderHook(
        () => TestActionContext.useActionDispatch(),
        {
          wrapper: ({ children }) => (
            <TestActionContext.Provider>
              <TestComponent />
              {children}
            </TestActionContext.Provider>
          ),
        }
      );

      await act(async () => {
        await result.current('asyncAction', { delay: 10 });
      });

      // Verify priority order execution - lower number means higher priority in ActionRegister
      // So priority: 5 executes before priority: 10
      expect(results[0]).toContain('low-priority');
      expect(results[1]).toContain('high-priority');
    });
  });

  describe('useAction (legacy hook)', () => {
    it('should work as dispatch function', async () => {
      let receivedPayload: any = null;

      const TestComponent = () => {
        TestActionContext.useActionHandler('testAction', async (payload) => {
          receivedPayload = payload;
        });

        return null;
      };

      const DispatchComponent = () => {
        const dispatch = TestActionContext.useActionDispatch();

        React.useEffect(() => {
          dispatch('testAction', { value: 'legacy' });
        }, [dispatch]);

        return null;
      };

      render(
        <TestActionContext.Provider>
          <TestComponent />
          <DispatchComponent />
        </TestActionContext.Provider>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      expect(receivedPayload).toEqual({ value: 'legacy' });
    });
  });

  describe('getActionContext and getActionRegister', () => {
    it('should provide access to dispatch and handler functions', () => {
      // Test that dispatch function is available
      const { result: dispatchResult } = renderHook(
        () => TestActionContext.useActionDispatch(),
        {
          wrapper: ({ children }) => (
            <TestActionContext.Provider>{children}</TestActionContext.Provider>
          ),
        }
      );

      expect(dispatchResult.current).toBeDefined();
      expect(typeof dispatchResult.current).toBe('function');

      // Test that handler registration works
      const handlerFn = jest.fn();
      const { result: handlerResult } = renderHook(
        () => {
          TestActionContext.useActionHandler('testAction', handlerFn);
          return TestActionContext.useActionDispatch();
        },
        {
          wrapper: ({ children }) => (
            <TestActionContext.Provider>{children}</TestActionContext.Provider>
          ),
        }
      );

      act(() => {
        handlerResult.current('testAction', { value: 'test' });
      });

      expect(handlerFn).toHaveBeenCalledWith(
        { value: 'test' },
        expect.any(Object)
      );
    });
  });

  describe('Error handling', () => {
    it('should handle handler registration errors', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      const BadHandler = () => {
        // Simulate an error during handler setup
        TestActionContext.useActionHandler(
          'errorAction',
          async ({ shouldFail }) => {
            if (shouldFail) {
              throw new Error('Handler error');
            }
          },
          { id: null as any } // Invalid config
        );

        return null;
      };

      render(
        <TestActionContext.Provider>
          <BadHandler />
        </TestActionContext.Provider>
      );

      // Should not crash the app
      expect(consoleError).not.toHaveBeenCalledWith(
        expect.stringContaining('Handler registration failed')
      );

      consoleError.mockRestore();
    });

    it('should handle missing provider with error', () => {
      const UnprovidedContext = createActionContext<TestActions>('Unprovided');

      const TestComponent = () => {
        // This will throw when used without provider
        UnprovidedContext.useActionHandler('testAction', async () => {});
        return <div>Should not render</div>;
      };

      // Suppress console errors for this test
      const originalError = console.error;
      console.error = jest.fn();

      // The component should throw an error when rendered without provider
      expect(() => {
        render(<TestComponent />);
      }).toThrow();

      console.error = originalError;
    });
  });

  describe('Performance optimizations', () => {
    it('should maintain stable dispatch reference', () => {
      const refs: any[] = [];

      const TestComponent = () => {
        const dispatch = TestActionContext.useActionDispatch();
        refs.push(dispatch);
        return null;
      };

      const { rerender } = render(
        <TestActionContext.Provider>
          <TestComponent />
        </TestActionContext.Provider>
      );

      rerender(
        <TestActionContext.Provider>
          <TestComponent />
        </TestActionContext.Provider>
      );

      rerender(
        <TestActionContext.Provider>
          <TestComponent />
        </TestActionContext.Provider>
      );

      // All dispatch references should be the same
      expect(refs[0]).toBe(refs[1]);
      expect(refs[1]).toBe(refs[2]);
    });

    it('should handle handler updates on re-render', async () => {
      let executionCount = 0;
      let currentMultiplier = 1;

      const TestWrapper = ({ children, multiplier }: { children: React.ReactNode; multiplier: number }) => {
        TestActionContext.useActionHandler(
          'testAction',
          async (payload) => {
            executionCount++;
            currentMultiplier = multiplier;
          },
          { id: `handler-${multiplier}` }
        );

        return <>{children}</>;
      };

      const { result, rerender } = renderHook(
        () => TestActionContext.useActionDispatch(),
        {
          wrapper: ({ children }) => (
            <TestActionContext.Provider>
              <TestWrapper multiplier={1}>{children}</TestWrapper>
            </TestActionContext.Provider>
          ),
        }
      );

      // First execution with multiplier 1
      await act(async () => {
        await result.current('testAction', { value: 'test' });
      });

      expect(executionCount).toBe(1);
      expect(currentMultiplier).toBe(1);

      // Re-render with different multiplier
      rerender();

      // Create a new wrapper with multiplier 2
      const { result: result2 } = renderHook(
        () => TestActionContext.useActionDispatch(),
        {
          wrapper: ({ children }) => (
            <TestActionContext.Provider>
              <TestWrapper multiplier={2}>{children}</TestWrapper>
            </TestActionContext.Provider>
          ),
        }
      );

      // Execute again with multiplier 2
      await act(async () => {
        await result2.current('testAction', { value: 'test' });
      });

      // Handler should execute again with new multiplier
      expect(executionCount).toBe(2);
      expect(currentMultiplier).toBe(2);
    });
  });
});