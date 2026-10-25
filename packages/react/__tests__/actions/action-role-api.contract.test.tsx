import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { createActionContext, type ActionPayloadMap } from '@context-action/react';

interface Actions extends ActionPayloadMap {
  save: { allowed: boolean; value: string };
  hold: { wait: boolean };
}
interface Results { save: string; hold: string }

describe('Public Action role hooks', () => {
  it.each(['dispatch', 'dispatchWithResult'] as const)(
    '%s runs guards before results, reports outcomes to observers and cleans up handlers', async mode => {
      const Actions = createActionContext<Actions, Results>('PublicRoles');
      const order: string[] = [];
      const observe = jest.fn();
      const wrapper = ({ children }: { children: React.ReactNode }) => <Actions.Provider>{children}</Actions.Provider>;
      const { result, unmount } = renderHook(() => {
        Actions.useActionGuard('save', (payload, controller) => {
          order.push('guard');
          if (!payload.allowed) controller.abort('denied');
        });
        Actions.useActionResultHandler('save', payload => {
          order.push('result');
          return payload.value;
        });
        Actions.useActionObserver('save', event => {
          order.push('observer');
          observe(event);
        });
        return {
          dispatch: Actions.useActionDispatch(),
          results: Actions.useActionDispatchWithResult(),
          register: Actions.useActionRegister()!,
        };
      }, { wrapper });
      const register = result.current.register;
      try {
        await act(async () => {
          if (mode === 'dispatch') await result.current.dispatch('save', { allowed: true, value: 'saved' });
          else await expect(result.current.results.dispatchWithResult('save', { allowed: true, value: 'saved' }))
            .resolves.toMatchObject({ result: 'saved', outcome: 'completed' });
        });
        expect(order).toEqual(['guard', 'result', 'observer']);
        expect(observe).toHaveBeenLastCalledWith(expect.objectContaining({ result: 'saved', outcome: 'completed' }));
        order.length = 0;
        await act(async () => {
          if (mode === 'dispatch') await result.current.dispatch('save', { allowed: false, value: 'blocked' });
          else await expect(result.current.results.dispatchWithResult('save', { allowed: false, value: 'blocked' }))
            .resolves.toMatchObject({ aborted: true });
        });
        expect(order).toEqual(['guard', 'observer']);
        expect(observe).toHaveBeenLastCalledWith(expect.objectContaining({ outcome: 'cancelled' }));
      } finally {
        await act(async () => { unmount(); });
        expect(register.getHandlerCount('save')).toBe(0);
      }
    },
  );

  it('resetAbortScope cancels pending work without poisoning future dispatches', async () => {
    const Actions = createActionContext<Actions, Results>('ResetScope');
    const wrapper = ({ children }: { children: React.ReactNode }) => <Actions.Provider>{children}</Actions.Provider>;
    let started!: () => void;
    const ready = new Promise<void>(resolve => { started = resolve; });
    let signal: AbortSignal | undefined;
    const { result, unmount } = renderHook(() => {
      Actions.useActionResultHandler('hold', async (payload, controller) => {
        if (payload.wait) {
          signal = controller.signal;
          await new Promise<void>(resolve => {
            controller.signal!.addEventListener('abort', () => resolve(), { once: true });
            started();
          });
        }
        return 'fresh';
      });
      return Actions.useActionDispatchWithResult();
    }, { wrapper });
    try {
      const execution = result.current.dispatchWithResult('hold', { wait: true });
      await ready;
      await act(async () => { result.current.resetAbortScope(); });
      expect(signal?.aborted).toBe(true);
      await expect(execution).resolves.toMatchObject({ aborted: true });
      await act(async () => {
        await expect(result.current.dispatchWithResult('hold', { wait: false }))
          .resolves.toMatchObject({ result: 'fresh', outcome: 'completed' });
      });
    } finally { unmount(); }
  });
});
