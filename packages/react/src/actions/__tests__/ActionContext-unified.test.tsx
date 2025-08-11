/**
 * @fileoverview Tests for unified ActionContext with ActionProvider functionality
 */

import React, { useEffect } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { createActionContext } from '../ActionContext';
import { ActionPayloadMap } from '@context-action/core';

// Test action types
interface TestActions extends ActionPayloadMap {
  fetchData: { id: string };
  saveData: { data: string };
  search: { query: string };
  longRunning: { duration: number };
}

describe('Unified ActionContext (createActionContext factory)', () => {
  // Create typed action context
  const { 
    Provider: ActionProvider, 
    useActionDispatch, 
    useActionDispatchWithResult, 
    // useActionHandler, - Currently tested in separate section 
  } = createActionContext<TestActions>({ name: 'TestProvider' });

  // Test wrapper using factory-generated Provider
  const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) => (
      <ActionProvider>
        {children}
      </ActionProvider>
    );
  };

  describe('useActionDispatch with automatic abort', () => {
    it('should abort actions on component unmount', async () => {
      const handlerExecutions: string[] = [];
      
      const { result, unmount } = renderHook(() => {
        const dispatch = useActionDispatch();
        const register = useActionRegister();

        useEffect(() => {
          const unregister = register.register('fetchData', async ({ id }) => {
            handlerExecutions.push(`start-${id}`);
            await new Promise(resolve => setTimeout(resolve, 100));
            handlerExecutions.push(`complete-${id}`);
          });

          return unregister;
        }, [register]);

        return dispatch;
      }, { wrapper: createWrapper() });

      // Dispatch an action
      act(() => {
        result.current('fetchData', { id: '123' });
      });

      // Wait for handler to start
      await waitFor(() => {
        expect(handlerExecutions).toContain('start-123');
      });

      // Unmount component (should abort the action)
      unmount();

      // Wait to ensure handler would have completed if not aborted
      await new Promise(resolve => setTimeout(resolve, 150));

      // Handler should have started but not completed
      expect(handlerExecutions).toContain('start-123');
      expect(handlerExecutions).not.toContain('complete-123');
    });
  });

  describe('useActionDispatchWithResult with abort control', () => {
    it('should provide all dispatch functions and abort methods', () => {
      const { result } = renderHook(() => useActionDispatchWithResult(), {
        wrapper: createWrapper()
      });

      expect(result.current.dispatch).toBeDefined();
      expect(result.current.dispatchWithResult).toBeDefined();
      expect(result.current.abortAll).toBeDefined();
      expect(result.current.resetAbortScope).toBeDefined();
    });

    it('should reset abort scope for new operations', async () => {
      const searchResults: string[] = [];
      
      const { result } = renderHook(() => {
        const actions = useActionDispatchWithResult();
        const register = useActionRegister();

        useEffect(() => {
          const unregister = register.register('search', async ({ query }) => {
            await new Promise(resolve => setTimeout(resolve, 50));
            searchResults.push(query);
            return `Results for ${query}`;
          });

          return unregister;
        }, [register]);

        return actions;
      }, { wrapper: createWrapper() });

      // First search
      act(() => {
        result.current.resetAbortScope();
        result.current.dispatch('search', { query: 'first' });
      });

      // Second search (should abort first)
      await new Promise(resolve => setTimeout(resolve, 10));
      act(() => {
        result.current.resetAbortScope();
        result.current.dispatch('search', { query: 'second' });
      });

      // Wait for searches to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Only second search should complete
      expect(searchResults).toEqual(['second']);
    });
  });
});

describe('createActionContext with useActionHandler', () => {
  // Test wrapper using factory-based context with handler support
  const { Provider, useActionDispatch: useAction, useActionHandler, useActionRegister: useFactoryRegister } = createActionContext<TestActions>({
    name: 'HandlerTestProvider'
  });

  const createFactoryWrapper = () => {
    return ({ children }: { children: React.ReactNode }) => (
      <Provider>
        {children}
      </Provider>
    );
  };

  it('should provide type-safe dispatch function', () => {
    const { result } = renderHook(() => useAction(), {
      wrapper: createFactoryWrapper()
    });

    expect(typeof result.current).toBe('function');
  });

  it('should handle automatic cleanup of handlers', async () => {
    const handlerExecutions: string[] = [];

    const TestComponent = () => {
      const dispatch = useAction();

      useActionHandler('fetchData', async ({ id }) => {
        handlerExecutions.push(`handler-${id}`);
        await new Promise(resolve => setTimeout(resolve, 10));
        handlerExecutions.push(`handler-complete-${id}`);
      });

      return { dispatch };
    };

    const { result } = renderHook(() => TestComponent(), {
      wrapper: createFactoryWrapper()
    });

    await act(async () => {
      await result.current('fetchData', { id: 'test' });
    });

    expect(handlerExecutions).toEqual(['handler-test', 'handler-complete-test']);
  });

  it('should provide direct access to ActionRegister', () => {
    const { result } = renderHook(() => useFactoryRegister(), {
      wrapper: createFactoryWrapper()
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current?.register).toBe('function');
  });
});

describe('Factory-based API consistency', () => {
  it('should maintain type safety without manual type parameters', () => {
    // This test ensures factory-generated hooks don't need manual type annotations
    const { result } = renderHook(() => {
      const dispatch = useActionDispatch(); // No <TestActions> needed!
      const register = useActionRegister();
      return { dispatch, register };
    }, { wrapper: createWrapper() });

    expect(typeof result.current.dispatch).toBe('function');
    expect(typeof result.current.register?.register).toBe('function');
  });

  it('should work with both simple and enhanced dispatch patterns', () => {
    const { result } = renderHook(() => {
      const simpleDispatch = useActionDispatch();
      const enhancedActions = useActionDispatchWithResult();
      
      return { simpleDispatch, enhancedActions };
    }, { wrapper: createWrapper() });

    // Both patterns should be available
    expect(typeof result.current.simpleDispatch).toBe('function');
    expect(typeof result.current.enhancedActions.dispatch).toBe('function');
    expect(typeof result.current.enhancedActions.dispatchWithResult).toBe('function');
  });
});