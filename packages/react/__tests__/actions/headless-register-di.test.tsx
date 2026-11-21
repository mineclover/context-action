/**
 * @fileoverview Tests for headless-first ActionRegister dependency injection on ActionContext Provider.
 */

import { act, render, waitFor } from '@testing-library/react';
import React from 'react';
import {
  ActionRegister,
  ActionRegisterDestroyedError,
  type ActionPayloadMap,
  type ExecutionResult,
} from '@context-action/core';
import { createActionContext } from '@context-action/react';

interface OrderActions extends ActionPayloadMap {
  submit: { orderId: string; valid: boolean };
  notify: { message: string };
}

interface OrderResults {
  submit: { accepted: boolean; orderId: string };
}

describe('Headless ActionRegister DI on createActionContext.Provider', () => {
  it('routes React dispatches and role hooks onto an externally constructed register with shared ownership', async () => {
    const headlessRegister = new ActionRegister<OrderActions, OrderResults>({
      name: 'HeadlessOrders',
    });
    const events: string[] = [];

    headlessRegister.registerCommand('notify', payload => {
      events.push(`headless:notify:${payload.message}`);
    }, { id: 'headless-notify', priority: 10 });

    headlessRegister.registerResult('submit', payload => {
      events.push(`headless:submit:${payload.orderId}`);
      return { accepted: payload.valid, orderId: payload.orderId };
    }, { id: 'headless-submit', priority: 10 });

    const OrderContext = createActionContext<OrderActions, OrderResults>('OrderContext');
    let resolvedRegister: ActionRegister<OrderActions, OrderResults> | null = null;
    let dispatchApi: ReturnType<typeof OrderContext.useActionDispatchWithResult> | undefined;

    function Consumer() {
      resolvedRegister = OrderContext.useActionRegister();
      dispatchApi = OrderContext.useActionDispatchWithResult();

      OrderContext.useActionGuard('submit', (payload, controller) => {
        if (!payload.valid) {
          controller.abort('invalid-order');
        }
      }, { priority: 100 });

      OrderContext.useActionHandler('notify', payload => {
        events.push(`react:notify:${payload.message}`);
      }, { priority: 5 });

      OrderContext.useActionObserver('submit', event => {
        events.push(`react:observe:${event.outcome}`);
      }, { when: 'always' });

      return null;
    }

    const view = render(
      <OrderContext.Provider register={headlessRegister}>
        <Consumer />
      </OrderContext.Provider>
    );

    expect(resolvedRegister).toBe(headlessRegister);
    expect(headlessRegister.getHandlerCount('notify')).toBe(2);
    expect(headlessRegister.getHandlerCount('submit')).toBe(3);

    await act(async () => {
      await dispatchApi!.dispatch('notify', { message: 'ready' });
    });
    expect(events).toEqual([
      'headless:notify:ready',
      'react:notify:ready',
    ]);

    let result: ExecutionResult<OrderResults['submit']> | undefined;
    await act(async () => {
      result = await dispatchApi!.dispatchWithResult(
        'submit',
        { orderId: 'ORD-1', valid: true },
        { result: { collect: true, strategy: 'first' } },
      );
    });
    expect(result?.results).toEqual([{ accepted: true, orderId: 'ORD-1' }]);
    expect(events).toContain('headless:submit:ORD-1');
    expect(events).toContain('react:observe:completed');

    let blockedResult: ExecutionResult<OrderResults['submit']> | undefined;
    await act(async () => {
      blockedResult = await dispatchApi!.dispatchWithResult(
        'submit',
        { orderId: 'ORD-2', valid: false },
      );
    });
    expect(blockedResult?.aborted).toBe(true);
    expect(events).not.toContain('headless:submit:ORD-2');

    view.unmount();

    await waitFor(() => {
      expect(headlessRegister.getHandlerCount('notify')).toBe(1);
      expect(headlessRegister.getHandlerCount('submit')).toBe(1);
    });

    // External shared register must stay alive after Provider unmounts.
    const afterUnmountResult = await headlessRegister.dispatchWithResult(
      'submit',
      { orderId: 'ORD-3', valid: true },
      { result: { collect: true, strategy: 'first' } },
    );
    expect(afterUnmountResult.results).toEqual([{ accepted: true, orderId: 'ORD-3' }]);
    expect(events).toContain('headless:submit:ORD-3');

    await headlessRegister.destroyAsync();
  });

  it('aborts in-flight Provider dispatches without destroying a shared external register and supports remounting', async () => {
    const sharedRegister = new ActionRegister<{ slow: void; ping: string }>({
      name: 'SharedLifecycleOrders',
    });
    const pings: string[] = [];
    let releaseSlow!: () => void;
    let markSlowStarted!: () => void;
    const slowStarted = new Promise<void>(resolve => {
      markSlowStarted = resolve;
    });

    sharedRegister.registerCommand('slow', async () => {
      markSlowStarted();
      await new Promise<void>(resolve => {
        releaseSlow = resolve;
      });
    }, { id: 'headless-slow' });

    sharedRegister.registerCommand('ping', tag => {
      pings.push(`headless:${tag}`);
    }, { id: 'headless-ping' });

    const SharedContext = createActionContext<{ slow: void; ping: string }>('SharedContext');
    let dispatch: ReturnType<typeof SharedContext.useActionDispatch> | undefined;

    function Consumer({ label }: { label: string }) {
      dispatch = SharedContext.useActionDispatch();
      SharedContext.useActionHandler('ping', tag => {
        pings.push(`${label}:${tag}`);
      });
      return null;
    }

    const firstView = render(
      <SharedContext.Provider register={sharedRegister}>
        <Consumer label="mount-1" />
      </SharedContext.Provider>
    );

    const inFlight = dispatch!('slow');
    await slowStarted;

    firstView.unmount();
    await expect(inFlight).rejects.toMatchObject({ name: 'AbortError' });

    releaseSlow();
    await waitFor(() => {
      expect(sharedRegister.getHandlerCount('ping')).toBe(1);
    });

    // Remounting a new Provider on the same external register works cleanly.
    const secondView = render(
      <SharedContext.Provider register={sharedRegister}>
        <Consumer label="mount-2" />
      </SharedContext.Provider>
    );

    await act(async () => {
      await dispatch!('ping', 'ok');
    });
    expect(pings).toEqual(['headless:ok', 'mount-2:ok']);

    secondView.unmount();
    await sharedRegister.destroyAsync();
  });

  it('destroys an injected register on unmount when ownership is owned', async () => {
    const ownedRegister = new ActionRegister<{ ping: string }>({
      name: 'OwnedInjectedRegister',
    });
    const destroySpy = jest.spyOn(ownedRegister, 'destroyAsync');
    const OwnedContext = createActionContext<{ ping: string }>('OwnedContext');

    const view = render(
      <OwnedContext.Provider register={ownedRegister} ownership="owned">
        <div />
      </OwnedContext.Provider>
    );

    view.unmount();

    await waitFor(() => {
      expect(destroySpy).toHaveBeenCalledTimes(1);
    });
    await expect(ownedRegister.dispatch('ping', 'after')).rejects.toBeInstanceOf(
      ActionRegisterDestroyedError
    );
  });

  it('rebinds React handlers cleanly when swapping from one shared register to an owned register', async () => {
    const regA = new ActionRegister<{ work: string }>({ name: 'RegA' });
    const regB = new ActionRegister<{ work: string }>({ name: 'RegB' });
    const regADestroySpy = jest.spyOn(regA, 'destroyAsync');
    const regBDestroySpy = jest.spyOn(regB, 'destroyAsync');
    const received: string[] = [];

    const SwapContext = createActionContext<{ work: string }>('SwapContext');
    let dispatch: ReturnType<typeof SwapContext.useActionDispatch> | undefined;

    function Worker() {
      dispatch = SwapContext.useActionDispatch();
      SwapContext.useActionHandler('work', label => {
        received.push(label);
      });
      return null;
    }

    const view = render(
      <SwapContext.Provider register={regA}>
        <Worker />
      </SwapContext.Provider>
    );

    expect(regA.getHandlerCount('work')).toBe(1);
    await act(async () => {
      await dispatch!('work', 'a1');
    });

    view.rerender(
      <SwapContext.Provider register={regB} ownership="owned">
        <Worker />
      </SwapContext.Provider>
    );

    await waitFor(() => {
      expect(regA.getHandlerCount('work')).toBe(0);
      expect(regB.getHandlerCount('work')).toBe(1);
    });
    expect(regADestroySpy).not.toHaveBeenCalled();

    await act(async () => {
      await dispatch!('work', 'b1');
    });
    expect(received).toEqual(['a1', 'b1']);

    view.unmount();
    await waitFor(() => {
      expect(regBDestroySpy).toHaveBeenCalledTimes(1);
    });
    await expect(regB.dispatch('work', 'after')).rejects.toBeInstanceOf(
      ActionRegisterDestroyedError
    );
    await expect(regA.dispatch('work', 'still-alive')).resolves.toBeUndefined();
    await regA.destroyAsync();
  });
});
