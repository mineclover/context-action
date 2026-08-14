import { act, render, waitFor } from '@testing-library/react';
import React, { startTransition } from 'react';
import { createRoot } from 'react-dom/client';
import { createActionContext } from '@context-action/react';

type ActivityBoundaryComponent = React.ExoticComponent<{
  children?: React.ReactNode;
  mode: 'visible' | 'hidden';
}>;

const ActivityBoundary = (React as unknown as {
  Activity?: ActivityBoundaryComponent;
}).Activity;
const activityTest = ActivityBoundary ? it : it.skip;

describe('ActionContext concurrent React lifecycle', () => {
  activityTest('preserves provider resources while an Activity is hidden', async () => {
    const Actions = createActionContext<{ run: void }>('ActivityActions');
    const Activity = ActivityBoundary!;
    const handler = jest.fn();
    let dispatch: ReturnType<typeof Actions.useActionDispatch> | undefined;
    let currentRegister: ReturnType<typeof Actions.useActionRegister> = null;

    function Consumer() {
      Actions.useActionHandler('run', handler);
      dispatch = Actions.useActionDispatch();
      currentRegister = Actions.useActionRegister();
      return null;
    }

    const tree = (mode: 'visible' | 'hidden') => (
      <Activity mode={mode}>
        <Actions.Provider>
          <Consumer />
        </Actions.Provider>
      </Activity>
    );

    const view = render(tree('visible'));
    await waitFor(() => expect(currentRegister?.getHandlerCount('run')).toBe(1));

    const firstRegister = currentRegister!;
    const destroySpy = jest.spyOn(firstRegister, 'destroyAsync');

    await act(async () => {
      view.rerender(tree('hidden'));
      await Promise.resolve();
    });
    expect(destroySpy).not.toHaveBeenCalled();

    await act(async () => {
      view.rerender(tree('visible'));
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(currentRegister).toBe(firstRegister);
      expect(currentRegister?.getHandlerCount('run')).toBe(1);
    });

    await act(async () => {
      await dispatch?.('run');
    });
    expect(handler).toHaveBeenCalledTimes(1);

    await act(async () => {
      view.unmount();
      await Promise.resolve();
    });
    expect(destroySpy).toHaveBeenCalledTimes(1);
  });

  activityTest('supports handler registration and dispatch during Activity reconnect effects', async () => {
    const Actions = createActionContext<{ run: void }>('ActivityEffectActions');
    const Activity = ActivityBoundary!;
    const handler = jest.fn();
    const dispatchErrors: unknown[] = [];

    function Consumer() {
      Actions.useActionHandler('run', handler);
      const dispatch = Actions.useActionDispatch();
      React.useEffect(() => {
        void dispatch('run').catch(error => dispatchErrors.push(error));
      }, [dispatch]);
      return null;
    }

    const tree = (mode: 'visible' | 'hidden') => (
      <Activity mode={mode}>
        <Actions.Provider>
          <Consumer />
        </Actions.Provider>
      </Activity>
    );

    const view = render(tree('visible'));
    await waitFor(() => expect(handler).toHaveBeenCalledTimes(1));

    await act(async () => {
      view.rerender(tree('hidden'));
      await Promise.resolve();
    });
    await act(async () => {
      view.rerender(tree('visible'));
      await Promise.resolve();
    });

    await waitFor(() => expect(handler).toHaveBeenCalledTimes(2));
    expect(dispatchErrors).toEqual([]);
  });

  activityTest('supports dispatch from descendant layout effects during Activity reveal', async () => {
    const Actions = createActionContext<{ run: void }>('ActivityLayoutActions');
    const Activity = ActivityBoundary!;
    const handler = jest.fn();
    const dispatchErrors: unknown[] = [];
    let layoutSetups = 0;

    function Consumer() {
      Actions.useActionHandler('run', handler);
      const dispatch = Actions.useActionDispatch();
      React.useLayoutEffect(() => {
        layoutSetups += 1;
        try {
          void dispatch('run').catch(error => dispatchErrors.push(error));
        } catch (error) {
          dispatchErrors.push(error);
        }
      }, [dispatch]);
      return null;
    }

    const child = (
      <Actions.Provider>
        <Consumer />
      </Actions.Provider>
    );
    const tree = (mode: 'visible' | 'hidden') => (
      <Activity mode={mode}>{child}</Activity>
    );

    const view = render(tree('visible'));
    await waitFor(() => expect(handler).toHaveBeenCalledTimes(1));

    await act(async () => {
      view.rerender(tree('hidden'));
      await Promise.resolve();
    });
    await act(async () => {
      view.rerender(tree('visible'));
      await Promise.resolve();
    });

    await waitFor(() => expect(handler).toHaveBeenCalledTimes(2));
    expect(layoutSetups).toBe(2);
    expect(dispatchErrors).toEqual([]);
  });

  activityTest.each(['dispatch', 'dispatchWithResult'] as const)(
    'keeps an in-flight enhanced %s alive while an Activity is hidden',
    async dispatchKind => {
      const Actions = createActionContext<{ run: void }, { run: string }>(
        `ActivityEnhanced${dispatchKind}`
      );
      const Activity = ActivityBoundary!;
      let api: ReturnType<typeof Actions.useActionDispatchWithResult> | undefined;
      let handlerSignal: AbortSignal | undefined;
      let markHandlerStarted!: () => void;
      let releaseHandler!: () => void;
      const handlerStarted = new Promise<void>(resolve => {
        markHandlerStarted = resolve;
      });
      const handlerGate = new Promise<void>(resolve => {
        releaseHandler = resolve;
      });

      function Consumer() {
        api = Actions.useActionDispatchWithResult();
        Actions.useActionResultHandler('run', async (_payload, controller) => {
          handlerSignal = controller.signal;
          markHandlerStarted();
          await handlerGate;
          return 'completed';
        });
        return null;
      }

      const tree = (mode: 'visible' | 'hidden') => (
        <Activity mode={mode}>
          <Actions.Provider>
            <Consumer />
          </Actions.Provider>
        </Activity>
      );
      const view = render(tree('visible'));
      let execution: Promise<unknown> | undefined;

      try {
        execution = dispatchKind === 'dispatch'
          ? api!.dispatch('run')
          : api!.dispatchWithResult('run');
        await handlerStarted;

        await act(async () => {
          view.rerender(tree('hidden'));
          await Promise.resolve();
          await Promise.resolve();
        });

        expect(handlerSignal?.aborted).toBe(false);

        await act(async () => {
          view.rerender(tree('visible'));
          await Promise.resolve();
        });
        expect(handlerSignal?.aborted).toBe(false);

        releaseHandler();
        if (dispatchKind === 'dispatchWithResult') {
          await expect(execution).resolves.toMatchObject({
            outcome: 'completed',
            aborted: false,
            result: 'completed',
          });
        } else {
          await expect(execution).resolves.toBeUndefined();
        }
      } finally {
        releaseHandler();
        await execution?.catch(() => {});
        view.unmount();
      }
    }
  );

  it('aborts an enhanced dispatch scope when its consumer actually unmounts', async () => {
    const Actions = createActionContext<{ run: void }, { run: string }>(
      'EnhancedConsumerUnmountActions'
    );
    let api: ReturnType<typeof Actions.useActionDispatchWithResult> | undefined;
    let handlerSignal: AbortSignal | undefined;
    let markHandlerStarted!: () => void;
    const handlerStarted = new Promise<void>(resolve => {
      markHandlerStarted = resolve;
    });

    function Consumer() {
      api = Actions.useActionDispatchWithResult();
      Actions.useActionResultHandler('run', (_payload, controller) => {
        handlerSignal = controller.signal;
        markHandlerStarted();
        return new Promise<string>(resolve => {
          controller.signal?.addEventListener(
            'abort',
            () => resolve('aborted'),
            { once: true }
          );
        });
      });
      return null;
    }

    const tree = (showConsumer: boolean) => (
      <Actions.Provider>
        {showConsumer ? <Consumer /> : null}
      </Actions.Provider>
    );
    const view = render(tree(true));
    const execution = api!.dispatchWithResult('run');
    await handlerStarted;

    await act(async () => {
      view.rerender(tree(false));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(handlerSignal?.aborted).toBe(true);
    await expect(execution).resolves.toMatchObject({
      outcome: 'cancelled',
      aborted: true,
    });
    view.unmount();
  });

  it('does not publish a handler from an abandoned suspended transition', async () => {
    const Actions = createActionContext<{ run: void }>('SuspenseActions');
    const calls: string[] = [];
    const renders: string[] = [];
    const suspendedForever = new Promise<never>(() => {});
    let dispatch: ReturnType<typeof Actions.useActionDispatch> | undefined;
    let markSuspendedRender!: () => void;
    const suspendedRender = new Promise<void>(resolve => {
      markSuspendedRender = resolve;
    });

    function DispatchProbe() {
      dispatch = Actions.useActionDispatch();
      return null;
    }

    function Handler({ label, suspend }: { label: string; suspend?: boolean }) {
      Actions.useActionHandler('run', () => {
        calls.push(label);
      });
      renders.push(label);

      if (suspend) {
        markSuspendedRender();
        throw suspendedForever;
      }
      return null;
    }

    const committedTree = (
      <Actions.Provider>
        <DispatchProbe />
        <React.Suspense fallback={null}>
          <Handler label="committed" />
        </React.Suspense>
      </Actions.Provider>
    );
    const suspendedTree = (
      <Actions.Provider>
        <DispatchProbe />
        <React.Suspense fallback={null}>
          <Handler label="abandoned" suspend />
        </React.Suspense>
      </Actions.Provider>
    );
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    try {
      await act(async () => {
        root.render(committedTree);
      });

      await act(async () => {
        startTransition(() => root.render(suspendedTree));
      });
      await suspendedRender;

      // Rendering the exact current element at a higher priority abandons the
      // suspended tree without rendering the committed Handler again.
      await act(async () => {
        root.render(committedTree);
      });
      expect(renders).toEqual(['committed', 'abandoned']);

      await act(async () => {
        await dispatch?.('run');
      });
      expect(calls).toEqual(['committed']);
    } finally {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    }
  });

  it('publishes the committed handler before descendant layout effects dispatch', async () => {
    const Actions = createActionContext<{ run: void }>('LayoutDispatchActions');
    const calls: string[] = [];

    function LayoutDispatch({ enabled }: { enabled: boolean }) {
      const dispatch = Actions.useActionDispatch();
      React.useLayoutEffect(() => {
        if (enabled) void dispatch('run');
      }, [dispatch, enabled]);
      return null;
    }

    function Handler({ label, dispatchOnLayout }: {
      label: string;
      dispatchOnLayout: boolean;
    }) {
      Actions.useActionHandler('run', () => {
        calls.push(label);
      });
      return <LayoutDispatch enabled={dispatchOnLayout} />;
    }

    const view = render(
      <Actions.Provider>
        <Handler label="old" dispatchOnLayout={false} />
      </Actions.Provider>
    );

    view.rerender(
      <Actions.Provider>
        <Handler label="new" dispatchOnLayout />
      </Actions.Provider>
    );

    await waitFor(() => expect(calls).toEqual(['new']));
  });

  it('runs replacement cleanup outside the insertion-effect commit phase', async () => {
    const Actions = createActionContext<{ run: void }>('DeferredCleanupActions');
    const cleanup = jest.fn();
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    function Consumer({ priority }: { priority: number }) {
      const [, setCleanupCount] = React.useState(0);
      const statefulCleanup = React.useCallback(() => {
        cleanup();
        setCleanupCount(count => count + 1);
      }, []);
      Actions.useActionHandler('run', () => {}, { priority, cleanup: statefulCleanup });
      return null;
    }

    const view = render(
      <Actions.Provider>
        <Consumer priority={0} />
      </Actions.Provider>
    );

    try {
      view.rerender(
        <Actions.Provider>
          <Consumer priority={1} />
        </Actions.Provider>
      );
      await waitFor(() => expect(cleanup).toHaveBeenCalledTimes(1));

      const insertionWarnings = consoleError.mock.calls
        .flatMap(args => args.map(String))
        .filter(message => message.includes('useInsertionEffect must not schedule updates'));
      expect(insertionWarnings).toEqual([]);
    } finally {
      view.unmount();
      await Promise.resolve();
      consoleError.mockRestore();
    }
  });

  it('runs a shared cleanup function once for every handler registration', async () => {
    const Actions = createActionContext<{ first: void; second: void }>('SharedCleanupActions');
    const sharedCleanup = jest.fn();

    function Consumer() {
      Actions.useActionHandler('first', () => {}, { cleanup: sharedCleanup });
      Actions.useActionHandler('second', () => {}, { cleanup: sharedCleanup });
      return null;
    }

    const view = render(
      <Actions.Provider>
        <Consumer />
      </Actions.Provider>
    );

    view.unmount();

    await waitFor(() => expect(sharedCleanup).toHaveBeenCalledTimes(2));
  });

  it('isolates throwing handler cleanup and still finalizes the lifecycle', async () => {
    const Actions = createActionContext<{ first: void; second: void }>('ThrowingCleanupActions');
    const cleanupError = new Error('cleanup failed');
    const survivingCleanup = jest.fn();
    const afterShutdownCleanup = jest.fn();
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    let dispatchLifecycle: ReturnType<typeof Actions.useActionContext>['dispatchLifecycle'] | undefined;

    function Consumer() {
      dispatchLifecycle = Actions.useActionContext().dispatchLifecycle;
      Actions.useActionHandler('first', () => {}, {
        cleanup: () => {
          throw cleanupError;
        },
      });
      Actions.useActionHandler('second', () => {}, { cleanup: survivingCleanup });
      return null;
    }

    const view = render(
      <Actions.Provider>
        <Consumer />
      </Actions.Provider>
    );

    try {
      view.unmount();

      await waitFor(() => {
        expect(survivingCleanup).toHaveBeenCalledTimes(1);
        expect(consoleError).toHaveBeenCalledWith(
          '[ContextAction] Action handler cleanup failed.',
          cleanupError
        );
      });

      dispatchLifecycle!.scheduleHandlerCleanup(afterShutdownCleanup);
      await waitFor(() => expect(afterShutdownCleanup).toHaveBeenCalledTimes(1));
    } finally {
      consoleError.mockRestore();
    }
  });

  it('rejects stale dispatch immediately after the Provider unmounts', async () => {
    const Actions = createActionContext<{ run: void }>('ImmediateUnmountActions');
    const handler = jest.fn();
    let dispatch: ReturnType<typeof Actions.useActionDispatch> | undefined;
    let register: ReturnType<typeof Actions.useActionRegister> = null;

    function Consumer() {
      dispatch = Actions.useActionDispatch();
      register = Actions.useActionRegister();
      return null;
    }

    const view = render(
      <Actions.Provider>
        <Consumer />
      </Actions.Provider>
    );
    register!.register('run', handler);

    view.unmount();
    const staleDispatch = dispatch!('run');

    expect(handler).not.toHaveBeenCalled();
    await expect(staleDispatch).rejects.toMatchObject({ name: 'AbortError' });
  });
});
