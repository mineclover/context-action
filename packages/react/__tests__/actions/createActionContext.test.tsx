/**
 * @fileoverview Tests for createActionContext factory
 */

import { renderHook, act } from '@testing-library/react';
import React, { useCallback } from 'react';
import { createActionContext } from '../../src/actions/ActionContext';

interface UserActions {
  login: { username: string; password: string };
  logout: void;
  updateProfile: { name: string; email: string };
}

describe('createActionContext', () => {
  it('should create action context with all hooks', () => {
    const UserActionContext = createActionContext<UserActions>('UserActions');

    expect(UserActionContext.Provider).toBeDefined();
    expect(UserActionContext.useActionDispatch).toBeDefined();
    expect(UserActionContext.useActionHandler).toBeDefined();
    expect(UserActionContext.useActionRegister).toBeDefined();
    expect(UserActionContext.useActionContext).toBeDefined();
  });

  it('should provide type-safe action dispatching', async () => {
    const AppActions = createActionContext<UserActions>('AppActions');
    let receivedPayload: any = null;

    function TestComponent() {
      const dispatch = AppActions.useActionDispatch();

      AppActions.useActionHandler('login', useCallback(async (payload) => {
        receivedPayload = payload;
      }, []));

      return { dispatch };
    }

    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <AppActions.Provider>{children}</AppActions.Provider>
    );

    const { result } = renderHook(() => TestComponent(), {
      wrapper: Wrapper
    });

    await act(async () => {
      await result.current.dispatch('login', { 
        username: 'test@example.com', 
        password: 'password123' 
      });
    });

    expect(receivedPayload).toEqual({
      username: 'test@example.com',
      password: 'password123'
    });
  });

  it('should handle void actions correctly', async () => {
    const AppActions = createActionContext<UserActions>('AppActions');
    let logoutCalled = false;

    function TestComponent() {
      const dispatch = AppActions.useActionDispatch();

      AppActions.useActionHandler('logout', useCallback(async () => {
        logoutCalled = true;
      }, []));

      return { dispatch };
    }

    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <AppActions.Provider>{children}</AppActions.Provider>
    );

    const { result } = renderHook(() => TestComponent(), {
      wrapper: Wrapper
    });

    await act(async () => {
      await result.current.dispatch('logout');
    });

    expect(logoutCalled).toBe(true);
  });

  it('should support multiple handlers with priorities', async () => {
    const AppActions = createActionContext<UserActions>('AppActions');
    const executionOrder: string[] = [];

    function TestComponent() {
      const dispatch = AppActions.useActionDispatch();

      AppActions.useActionHandler('updateProfile', useCallback(async (payload) => {
        executionOrder.push('validation');
      }, []), { priority: 10 });

      AppActions.useActionHandler('updateProfile', useCallback(async (payload) => {
        executionOrder.push('database');
      }, []), { priority: 5 });

      AppActions.useActionHandler('updateProfile', useCallback(async (payload) => {
        executionOrder.push('notification');
      }, []), { priority: 1 });

      return { dispatch };
    }

    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <AppActions.Provider>{children}</AppActions.Provider>
    );

    const { result } = renderHook(() => TestComponent(), {
      wrapper: Wrapper
    });

    await act(async () => {
      await result.current.dispatch('updateProfile', { 
        name: 'John Doe', 
        email: 'john@example.com' 
      });
    });

    expect(executionOrder).toEqual(['validation', 'database', 'notification']);
  });

  it('should provide access to action register', () => {
    const TestActions = createActionContext<UserActions>('TestActions');

    function TestComponent() {
      const register = TestActions.useActionRegister();
      return { register };
    }

    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestActions.Provider>{children}</TestActions.Provider>
    );

    const { result } = renderHook(() => TestComponent(), {
      wrapper: Wrapper
    });

    expect(result.current.register).toBeDefined();
    expect(typeof result.current.register.register).toBe('function');
    expect(typeof result.current.register.dispatch).toBe('function');
  });

  it('should provide access to action context', () => {
    const TestActions = createActionContext<UserActions>('TestActions');

    function TestComponent() {
      const context = TestActions.useActionContext();
      return { context };
    }

    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestActions.Provider>{children}</TestActions.Provider>
    );

    const { result } = renderHook(() => TestComponent(), {
      wrapper: Wrapper
    });

    expect(result.current.context).toBeDefined();
    expect(result.current.context.actionRegisterRef).toBeDefined();
  });

  it('should handle multiple action context instances independently', async () => {
    const ActionsA = createActionContext<{ test: string }>('A');
    const ActionsB = createActionContext<{ test: string }>('B');
    
    let receivedA: string | null = null;
    let receivedB: string | null = null;

    function ComponentA() {
      const dispatch = ActionsA.useActionDispatch();
      
      ActionsA.useActionHandler('test', useCallback(async (payload) => {
        receivedA = payload;
      }, []));
      
      return { dispatch };
    }

    function ComponentB() {
      const dispatch = ActionsB.useActionDispatch();
      
      ActionsB.useActionHandler('test', useCallback(async (payload) => {
        receivedB = payload;
      }, []));
      
      return { dispatch };
    }

    const WrapperA = ({ children }: { children: React.ReactNode }) => (
      <ActionsA.Provider>{children}</ActionsA.Provider>
    );

    const WrapperB = ({ children }: { children: React.ReactNode }) => (
      <ActionsB.Provider>{children}</ActionsB.Provider>
    );

    const { result: resultA } = renderHook(() => ComponentA(), {
      wrapper: WrapperA
    });

    const { result: resultB } = renderHook(() => ComponentB(), {
      wrapper: WrapperB
    });

    await act(async () => {
      await resultA.current.dispatch('test', 'message-A');
    });

    await act(async () => {
      await resultB.current.dispatch('test', 'message-B');
    });

    expect(receivedA).toBe('message-A');
    expect(receivedB).toBe('message-B');
  });

  it('should cleanup handlers on component unmount', async () => {
    const TestActions = createActionContext<{ test: void }>('TestActions');
    let handlerExecuted = false;

    function TestComponent() {
      const dispatch = TestActions.useActionDispatch();
      
      TestActions.useActionHandler('test', useCallback(async () => {
        handlerExecuted = true;
      }, []));
      
      return { dispatch };
    }

    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestActions.Provider>{children}</TestActions.Provider>
    );

    const { result, unmount } = renderHook(() => TestComponent(), {
      wrapper: Wrapper
    });

    // First dispatch should work
    await act(async () => {
      await result.current.dispatch('test');
    });
    expect(handlerExecuted).toBe(true);

    // Reset and unmount
    handlerExecuted = false;
    unmount();

    // Create new instance
    const { result: newResult } = renderHook(() => TestActions.useActionDispatch(), {
      wrapper: Wrapper
    });

    // Handler should be cleaned up
    await act(async () => {
      await newResult.current('test');
    });

    expect(handlerExecuted).toBe(false);
  });
});