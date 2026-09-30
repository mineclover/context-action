import { describe, expect, it, vi } from 'vitest';
import { ActionRegister } from '@context-action/core';
import { ActionController } from '../src/action-controller.js';
import { MockReactiveControllerHost, createDeferred } from './helpers.js';

interface TestActions {
  voidAction: void;
  userLogin: { username: string; email: string };
  slowAsync: { delayMs: number };
  failingAction: { message: string };
  calculateTax: { subtotal: number };
}

interface TestResults {
  calculateTax: { tax: number; total: number };
}

describe('ActionController', () => {
  describe('Host Registration & Initial State', () => {
    it('registers itself to host on instantiation', () => {
      const host = new MockReactiveControllerHost();
      const register = new ActionRegister<TestActions, TestResults>();
      const controller = new ActionController(host, register);

      expect(host.controllers).toContain(controller);
      expect(controller.isPending).toBe(false);
      expect(controller.activeCount).toBe(0);
      expect(controller.register).toBe(register);
    });

    it('validates invalid host or register inputs', () => {
      const host = new MockReactiveControllerHost();
      const register = new ActionRegister<TestActions, TestResults>();

      expect(() => new ActionController(null as any, register)).toThrow(TypeError);
      expect(() => new ActionController(host, null as any)).toThrow(TypeError);
    });
  });

  describe('Action Dispatching (dispatch)', () => {
    it('dispatches void actions without payload', async () => {
      const host = new MockReactiveControllerHost();
      const register = new ActionRegister<TestActions, TestResults>();
      const controller = new ActionController(host, register);
      const handlerSpy = vi.fn();

      register.register('voidAction', handlerSpy);

      await controller.dispatch('voidAction');
      expect(handlerSpy).toHaveBeenCalledTimes(1);
    });

    it('dispatches payload-bearing actions with typed payload', async () => {
      const host = new MockReactiveControllerHost();
      const register = new ActionRegister<TestActions, TestResults>();
      const controller = new ActionController(host, register);
      const handlerSpy = vi.fn();

      register.register('userLogin', handlerSpy);

      const payload = { username: 'alice', email: 'alice@example.com' };
      await controller.dispatch('userLogin', payload);

      expect(handlerSpy).toHaveBeenCalledWith(payload, expect.anything());
    });

    it('forwards dispatch options to ActionRegister', async () => {
      const host = new MockReactiveControllerHost();
      const register = new ActionRegister<TestActions, TestResults>();
      const controller = new ActionController(host, register);
      const handlerSpy = vi.fn();

      register.register('voidAction', handlerSpy);

      await controller.dispatch('voidAction', undefined, { immediate: true });
      expect(handlerSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Action Dispatching with Result (dispatchWithResult)', () => {
    it('dispatches action and returns detailed ExecutionResult with typed result', async () => {
      const host = new MockReactiveControllerHost();
      const register = new ActionRegister<TestActions, TestResults>();
      const controller = new ActionController(host, register);

      register.registerResult('calculateTax', async (payload) => {
        const tax = payload.subtotal * 0.1;
        return { tax, total: payload.subtotal + tax };
      });

      const result = await controller.dispatchWithResult('calculateTax', { subtotal: 100 });

      expect(result.success).toBe(true);
      expect(result.result).toEqual({ tax: 10, total: 110 });
    });
  });

  describe('Pending State Tracking (isPending) & Update Coalescing', () => {
    it('triggers host.requestUpdate() strictly on 0 -> 1 and 1 -> 0 transitions for single dispatch', async () => {
      const host = new MockReactiveControllerHost();
      const register = new ActionRegister<TestActions, TestResults>();
      const controller = new ActionController(host, register);
      const deferred = createDeferred<void>();

      register.register('slowAsync', async () => {
        await deferred.promise;
      });

      expect(controller.isPending).toBe(false);
      expect(host.requestUpdateCount).toBe(0);

      const dispatchPromise = controller.dispatch('slowAsync', { delayMs: 10 });

      // Synchronously after dispatch starts (0 -> 1)
      expect(controller.isPending).toBe(true);
      expect(controller.activeCount).toBe(1);
      expect(host.requestUpdateCount).toBe(1);

      // Resolve async task (1 -> 0)
      deferred.resolve();
      await dispatchPromise;

      expect(controller.isPending).toBe(false);
      expect(controller.activeCount).toBe(0);
      expect(host.requestUpdateCount).toBe(2);
    });

    it('coalesces pending state across concurrent dispatches: requestUpdate() called ONLY twice', async () => {
      const host = new MockReactiveControllerHost();
      const register = new ActionRegister<TestActions, TestResults>();
      const controller = new ActionController(host, register);
      const d1 = createDeferred<void>();
      const d2 = createDeferred<void>();

      register.register('slowAsync', async (payload) => {
        if (payload.delayMs === 1) await d1.promise;
        if (payload.delayMs === 2) await d2.promise;
      });

      // Start dispatch 1: transitions 0 -> 1 -> requestUpdate() called!
      const p1 = controller.dispatch('slowAsync', { delayMs: 1 });
      expect(controller.isPending).toBe(true);
      expect(controller.activeCount).toBe(1);
      expect(host.requestUpdateCount).toBe(1);

      // Start dispatch 2: transitions 1 -> 2 -> requestUpdate() SUPPRESSED!
      const p2 = controller.dispatch('slowAsync', { delayMs: 2 });
      expect(controller.isPending).toBe(true);
      expect(controller.activeCount).toBe(2);
      expect(host.requestUpdateCount).toBe(1); // Still 1!

      // Settle dispatch 1: transitions 2 -> 1 -> requestUpdate() SUPPRESSED!
      d1.resolve();
      await p1;
      expect(controller.isPending).toBe(true);
      expect(controller.activeCount).toBe(1);
      expect(host.requestUpdateCount).toBe(1); // Still 1!

      // Settle dispatch 2: transitions 1 -> 0 -> requestUpdate() called!
      d2.resolve();
      await p2;
      expect(controller.isPending).toBe(false);
      expect(controller.activeCount).toBe(0);
      expect(host.requestUpdateCount).toBe(2); // Finally 2!
    });

    it('resets isPending and triggers requestUpdate() even when action fails', async () => {
      const host = new MockReactiveControllerHost();
      const register = new ActionRegister<TestActions, TestResults>();
      const controller = new ActionController(host, register);

      register.register('failingAction', async (payload) => {
        throw new Error(payload.message);
      }, { errorPolicy: 'fatal' });

      await expect(
        controller.dispatch('failingAction', { message: 'Database failure' }),
      ).rejects.toThrow('Database failure');

      expect(controller.isPending).toBe(false);
      expect(controller.activeCount).toBe(0);
      expect(host.requestUpdateCount).toBe(2); // 1 on start, 1 on error settlement
    });
  });

  describe('Lifecycle Cleanup & In-Flight Abort (hostDisconnected)', () => {
    it('aborts in-flight dispatches when hostDisconnected() is invoked', async () => {
      const host = new MockReactiveControllerHost();
      const register = new ActionRegister<TestActions, TestResults>();
      const controller = new ActionController(host, register);

      register.register('slowAsync', async (_payload, pipelineCtrl) => {
        // Observe pipeline abort signal
        return new Promise<void>((resolve, reject) => {
          if (pipelineCtrl.signal?.aborted) {
            return reject(new Error('Aborted immediately'));
          }
          pipelineCtrl.signal?.addEventListener('abort', () => {
            reject(new Error('Aborted by signal'));
          });
        });
      });

      host.connected();

      const dispatchPromise = controller.dispatch('slowAsync', { delayMs: 100 });
      expect(controller.isPending).toBe(true);

      // Trigger disconnect while dispatch is pending
      host.disconnected();

      // In-flight dispatch should reject or settle cancelled
      await expect(dispatchPromise).rejects.toThrow();

      // Controller should cleanly reset pending state
      expect(controller.isPending).toBe(false);
      expect(controller.activeCount).toBe(0);
    });

    it('renews abort controller on hostConnected() allowing new dispatches after reconnection', async () => {
      const host = new MockReactiveControllerHost();
      const register = new ActionRegister<TestActions, TestResults>();
      const controller = new ActionController(host, register);
      const handlerSpy = vi.fn();

      register.register('voidAction', handlerSpy);

      host.connected();
      host.disconnected(); // Aborts internal controller

      // Reconnect element
      host.connected();

      // Dispatch should succeed normally without being aborted
      await controller.dispatch('voidAction');
      expect(handlerSpy).toHaveBeenCalledTimes(1);
    });

    it('merges caller options.signal with internal lifecycle signal', async () => {
      const host = new MockReactiveControllerHost();
      const register = new ActionRegister<TestActions, TestResults>();
      const controller = new ActionController(host, register);
      const userAbort = new AbortController();

      register.register('slowAsync', async (_payload, pipelineCtrl) => {
        return new Promise<void>((_resolve, reject) => {
          pipelineCtrl.signal?.addEventListener('abort', () => {
            reject(new Error('User abort'));
          });
        });
      });

      host.connected();

      const dispatchPromise = controller.dispatch(
        'slowAsync',
        { delayMs: 50 },
        { signal: userAbort.signal },
      );

      // Abort user signal
      userAbort.abort();

      await expect(dispatchPromise).rejects.toThrow();
      expect(controller.isPending).toBe(false);
    });

    it('supports manual controller.abort() method', async () => {
      const host = new MockReactiveControllerHost();
      const register = new ActionRegister<TestActions, TestResults>();
      const controller = new ActionController(host, register);

      register.register('slowAsync', async (_payload, pipelineCtrl) => {
        return new Promise<void>((_resolve, reject) => {
          pipelineCtrl.signal?.addEventListener('abort', () => {
            reject(new Error('Manually aborted'));
          });
        });
      });

      const dispatchPromise = controller.dispatch('slowAsync', { delayMs: 50 });
      expect(controller.isPending).toBe(true);

      controller.abort();

      await expect(dispatchPromise).rejects.toThrow();
      expect(controller.isPending).toBe(false);
    });
  });
});
