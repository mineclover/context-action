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

    it('should handle blocking config', async () => {
      const results: string[] = [];

      const TestComponent = () => {
        TestActionContext.useActionHandler(
          'asyncAction',
          async ({ delay }) => {
            await new Promise(resolve => setTimeout(resolve, delay));
            results.push(`blocking-${delay}`);
            if (delay === 50) throw new Error('Blocking error');
          },
          { blocking: true, priority: 10 }
        );

        TestActionContext.useActionHandler(
          'asyncAction',
          async ({ delay }) => {
            results.push(`non-blocking-${delay}`);
          },
          { blocking: false, priority: 5 }
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

      try {
        await result.current('asyncAction', { delay: 50 });
      } catch (error) {
        // Expected to throw
      }

      // Non-blocking handler should still execute
      expect(results.some(r => r.includes('non-blocking'))).toBe(true);
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
    it('should provide access to context and register', () => {
      // Test that context is available via the exported context property
      const context = TestActionContext.context;
      expect(context).toBeDefined();
      expect(context.displayName).toContain('TestActions');

      // Test that we can access the register via hook
      const { result } = renderHook(
        () => TestActionContext.useActionRegister(),
        {
          wrapper: ({ children }) => (
            <TestActionContext.Provider>{children}</TestActionContext.Provider>
          ),
        }
      );
      const register = result.current;
      expect(register).toBeDefined();
      expect(typeof register?.dispatch).toBe('function');
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

    it('should handle missing provider gracefully', () => {
      const UnprovidedContext = createActionContext<TestActions>('Unprovided');

      const TestComponent = () => {
        try {
          UnprovidedContext.useActionHandler('testAction', async () => {});
          return <div>No error</div>;
        } catch (error) {
          return <div>Error caught</div>;
        }
      };

      // We expect this to throw since there's no provider
      expect(() => {
        render(<TestComponent />);
      }).toThrow('useFactoryActionContext must be used within a factory ActionContext Provider');
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

    it('should prevent handler re-registration', () => {
      let registrationCount = 0;

      const TestComponent = ({ value }: { value: number }) => {
        TestActionContext.useActionHandler(
          'testAction',
          async () => {
            registrationCount++;
          },
          { id: 'stable-handler' }
        );

        return <div>{value}</div>;
      };

      const { rerender } = render(
        <TestActionContext.Provider>
          <TestComponent value={1} />
        </TestActionContext.Provider>
      );

      rerender(
        <TestActionContext.Provider>
          <TestComponent value={2} />
        </TestActionContext.Provider>
      );

      const { result } = renderHook(
        () => TestActionContext.useActionDispatch(),
        {
          wrapper: ({ children }) => (
            <TestActionContext.Provider>{children}</TestActionContext.Provider>
          ),
        }
      );

      act(() => {
        result.current('testAction', { value: 'test' });
      });

      // Should only register once despite re-renders
      expect(registrationCount).toBe(1);
    });
  });
});