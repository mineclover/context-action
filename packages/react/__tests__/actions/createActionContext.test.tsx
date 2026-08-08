/**
 * @fileoverview Tests for createActionContext factory
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import React, { useCallback } from 'react';
import { createActionContext } from '@context-action/react';
import type { ActionPayloadMap, ExecutionResult } from '@context-action/core';

interface UserActions extends ActionPayloadMap {
  login: { username: string; password: string };
  logout: void;
  updateProfile: { name: string; email: string };
}

interface UserActionResults {
  login: { sessionId: string };
}

describe('createActionContext', () => {
  it('requires an explicit non-empty context name', () => {
    expect(() => (createActionContext as unknown as (config: unknown) => unknown)({
      name: 'LegacyConfigOnly',
    })).toThrow('requires a non-empty context name');
    expect(() => createActionContext('')).toThrow('requires a non-empty context name');
  });

  it('should create action context with all hooks', () => {
    const UserActionContext = createActionContext<UserActions>('UserActions');

    expect(UserActionContext.Provider).toBeDefined();
    expect(UserActionContext.useActionDispatch).toBeDefined();
    expect(UserActionContext.useActionHandler).toBeDefined();
    expect(UserActionContext.useActionRegister).toBeDefined();
    expect(UserActionContext.useActionContext).toBeDefined();
  });

  it('propagates action result maps through React hooks', () => {
    const MappedContext = createActionContext<UserActions, UserActionResults>('MappedActions');
    const resultApi = MappedContext.useActionDispatchWithResult;

    function ResultTypeComponent() {
      MappedContext.useActionHandler('login', async payload => ({
        sessionId: payload.username,
      }));

      const { dispatchWithResult } = resultApi();
      const typedResult: Promise<ExecutionResult<UserActionResults['login']>> =
        dispatchWithResult('login', { username: 'user', password: 'secret' });

      // @ts-expect-error mapped result types cannot be overridden at the React boundary
      dispatchWithResult<'login', string>('login', { username: 'user', password: 'secret' });
      return typedResult;
    }

    expect(ResultTypeComponent).toBeDefined();
  });

  it('supports effect-only React handlers for mapped result actions', () => {
    const MappedContext = createActionContext<UserActions, UserActionResults>('MappedEffects');

    function EffectComponent() {
      MappedContext.useActionEffectHandler('login', payload => {
        expect(payload.username).toBe('user');
      });
      MappedContext.useActionResultHandler('login', payload => ({
        sessionId: payload.username,
      }));
      return null;
    }

    expect(EffectComponent).toBeDefined();
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
    expect(typeof result.current.register?.register).toBe('function');
    expect(typeof result.current.register?.dispatch).toBe('function');
  });

  it('should keep one action register across re-renders and destroy it on unmount', async () => {
    const TestActions = createActionContext<UserActions>('LifecycleActions');

    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestActions.Provider>{children}</TestActions.Provider>
    );

    const { result, rerender, unmount } = renderHook(
      () => TestActions.useActionRegister(),
      { wrapper: Wrapper }
    );

    const register = result.current;
    expect(register).not.toBeNull();

    const destroySpy = jest.spyOn(register!, 'destroyAsync');

    rerender();
    rerender();

    expect(result.current).toBe(register);
    expect(destroySpy).not.toHaveBeenCalled();

    unmount();

    await waitFor(() => expect(destroySpy).toHaveBeenCalledTimes(1));
  });

  it('should not tear down handlers during StrictMode effect replay', async () => {
    const StrictActions = createActionContext<{ run: void }>('StrictActions');
    const handler = jest.fn();
    const handlerCleanup = jest.fn();

    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <React.StrictMode>
        <StrictActions.Provider>{children}</StrictActions.Provider>
      </React.StrictMode>
    );

    const { result, unmount } = renderHook(() => {
      StrictActions.useActionHandler(
        'run',
        useCallback(handler, []),
        { cleanup: handlerCleanup }
      );
      return {
        dispatch: StrictActions.useActionDispatch(),
        register: StrictActions.useActionRegister(),
      };
    }, { wrapper: Wrapper });

    const destroySpy = jest.spyOn(result.current.register!, 'destroyAsync');
    await act(async () => {});

    expect(handlerCleanup).not.toHaveBeenCalled();
    expect(destroySpy).not.toHaveBeenCalled();
    expect(result.current.register?.getHandlerCount('run')).toBe(1);

    await act(async () => {
      await result.current.dispatch('run');
    });
    expect(handler).toHaveBeenCalledTimes(1);

    unmount();
    await waitFor(() => {
      expect(handlerCleanup).toHaveBeenCalledTimes(1);
      expect(destroySpy).toHaveBeenCalledTimes(1);
    });
  });

  it('should reject active and queued dispatches before provider cleanup', async () => {
    const QueuedActions = createActionContext<{ run: { id: number } }>('QueuedActions');
    const events: string[] = [];
    const handlerCleanup = jest.fn();
    let releaseFirst!: () => void;
    let markFirstStarted!: () => void;
    const firstStarted = new Promise<void>(resolve => { markFirstStarted = resolve; });
    const gate = new Promise<void>(resolve => { releaseFirst = resolve; });

    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueuedActions.Provider>{children}</QueuedActions.Provider>
    );

    const { result, unmount } = renderHook(() => {
      QueuedActions.useActionHandler('run', useCallback(async ({ id }) => {
        events.push(`start:${id}`);
        if (id === 1) {
          markFirstStarted();
          await gate;
        }
        events.push(`finish:${id}`);
      }, []), { cleanup: handlerCleanup });
      return {
        dispatch: QueuedActions.useActionDispatch(),
        register: QueuedActions.useActionRegister(),
      };
    }, { wrapper: Wrapper });

    const destroySpy = jest.spyOn(result.current.register!, 'destroyAsync');
    const first = result.current.dispatch('run', { id: 1 }).catch(error => error as Error);
    await firstStarted;
    const second = result.current.dispatch('run', { id: 2 }).catch(error => error as Error);

    unmount();

    await expect(first).resolves.toMatchObject({ name: 'AbortError' });
    await expect(second).resolves.toMatchObject({ name: 'AbortError' });
    expect(events).toEqual(['start:1']);
    expect(handlerCleanup).not.toHaveBeenCalled();
    expect(destroySpy).toHaveBeenCalledTimes(1);

    releaseFirst();
    await waitFor(() => {
      expect(handlerCleanup).toHaveBeenCalledTimes(1);
      expect(destroySpy).toHaveBeenCalledTimes(1);
    });
    expect(events).toEqual(['start:1', 'finish:1']);
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

  it('preserves useActionHandler metadata in execution outcomes', async () => {
    const TestActions = createActionContext<
      { work: { id: string } },
      { work: string }
    >('MetadataActions');

    function TestComponent() {
      const { dispatchWithResult } = TestActions.useActionDispatchWithResult();
      TestActions.useActionHandler('work', () => 'completed', {
        metadata: { source: 'react-handler' },
      });
      return dispatchWithResult;
    }

    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestActions.Provider>{children}</TestActions.Provider>
    );
    const { result } = renderHook(() => TestComponent(), { wrapper: Wrapper });

    let execution: ExecutionResult<string> | undefined;
    await act(async () => {
      execution = await result.current('work', { id: 'metadata' });
    });

    expect(execution?.handlers[0]?.metadata).toEqual({ source: 'react-handler' });
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
