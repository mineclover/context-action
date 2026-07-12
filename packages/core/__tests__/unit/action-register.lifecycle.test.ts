import {
  ActionRegister,
  ActionRegisterDestroyedError,
  type ActionPayloadMap,
} from '../../src';

interface LifecycleActions extends ActionPayloadMap {
  first: void;
  second: void;
  queued: { id: string };
}

describe('ActionRegister handler lifecycle', () => {
  it('releases handler resources when actions are cleared', () => {
    const register = new ActionRegister<LifecycleActions>();
    const firstCleanup = jest.fn();
    const secondCleanup = jest.fn();

    const unregisterFirst = register.register('first', jest.fn(), {
      id: 'first-handler',
      cleanup: firstCleanup,
    });
    register.register('second', jest.fn(), {
      id: 'second-handler',
      cleanup: secondCleanup,
    });

    expect(register.getUnregisterFunctionCount()).toBe(2);

    register.clearAction('first');

    expect(firstCleanup).toHaveBeenCalledTimes(1);
    expect(secondCleanup).not.toHaveBeenCalled();
    expect(register.getUnregisterFunctionCount()).toBe(1);

    unregisterFirst();
    expect(firstCleanup).toHaveBeenCalledTimes(1);

    register.clearAll();

    expect(secondCleanup).toHaveBeenCalledTimes(1);
    expect(register.getUnregisterFunctionCount()).toBe(0);

    register.destroy();
    expect(secondCleanup).toHaveBeenCalledTimes(1);
  });

  it('releases one-time handler resources after execution', async () => {
    const register = new ActionRegister<LifecycleActions>();
    const cleanup = jest.fn();
    const unregister = register.register('first', jest.fn(), {
      id: 'once-handler',
      once: true,
      cleanup,
    });

    await register.dispatch('first');

    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(register.getHandlerCount('first')).toBe(0);
    expect(register.getUnregisterFunctionCount()).toBe(0);

    unregister();
    await register.destroyAsync();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('removes abort listeners after dispatch completion', async () => {
    const register = new ActionRegister<LifecycleActions>();
    const controller = new AbortController();
    const addListenerSpy = jest.spyOn(controller.signal, 'addEventListener');
    const removeListenerSpy = jest.spyOn(controller.signal, 'removeEventListener');

    register.register('first', jest.fn());

    await register.dispatch('first', undefined, { signal: controller.signal });
    await register.dispatchWithResult('first', undefined, { signal: controller.signal });

    // Native AbortSignal.any() owns listener cleanup internally. The fallback
    // path must balance every listener it adds explicitly.
    expect(removeListenerSpy).toHaveBeenCalledTimes(addListenerSpy.mock.calls.length);

    register.destroy();
  });

  it('does not delay one-time cleanup for an unrelated active dispatch', async () => {
    const register = new ActionRegister<LifecycleActions>({
      registry: { autoCleanup: false, useConcurrencyQueue: false },
    });
    const cleanup = jest.fn();
    let releaseLongHandler: (() => void) | undefined;
    let markLongHandlerStarted: (() => void) | undefined;
    const longHandlerStarted = new Promise<void>(resolve => {
      markLongHandlerStarted = resolve;
    });
    const longHandlerGate = new Promise<void>(resolve => {
      releaseLongHandler = resolve;
    });

    register.register('first', async () => {
      markLongHandlerStarted?.();
      await longHandlerGate;
    }, { blocking: true });
    register.register('second', jest.fn(), {
      id: 'fast-once-handler',
      once: true,
      cleanup,
    });

    const longDispatch = register.dispatch('first', undefined, { immediate: true });
    await longHandlerStarted;

    try {
      await register.dispatch('second', undefined, { immediate: true });

      expect(cleanup).toHaveBeenCalledTimes(1);
      expect(register.getHandlerCount('second')).toBe(0);
    } finally {
      releaseLongHandler?.();
      await longDispatch;
      await register.destroyAsync();
    }
  });

  it('removes fallback signal listeners without waiting for an unrelated dispatch', async () => {
    const originalAnyDescriptor = Object.getOwnPropertyDescriptor(AbortSignal, 'any');
    Object.defineProperty(AbortSignal, 'any', {
      configurable: true,
      writable: true,
      value: undefined,
    });

    const register = new ActionRegister<LifecycleActions>({
      registry: { autoCleanup: false, useConcurrencyQueue: false },
    });
    const controller = new AbortController();
    const addListenerSpy = jest.spyOn(controller.signal, 'addEventListener');
    const removeListenerSpy = jest.spyOn(controller.signal, 'removeEventListener');
    let releaseLongHandler: (() => void) | undefined;
    let markLongHandlerStarted: (() => void) | undefined;
    const longHandlerStarted = new Promise<void>(resolve => {
      markLongHandlerStarted = resolve;
    });
    const longHandlerGate = new Promise<void>(resolve => {
      releaseLongHandler = resolve;
    });

    register.register('first', async () => {
      markLongHandlerStarted?.();
      await longHandlerGate;
    }, { blocking: true });
    register.register('second', jest.fn());

    const longDispatch = register.dispatch('first', undefined, { immediate: true });
    await longHandlerStarted;

    try {
      await register.dispatch('second', undefined, {
        immediate: true,
        signal: controller.signal,
      });

      expect(addListenerSpy).toHaveBeenCalled();
      expect(removeListenerSpy).toHaveBeenCalledTimes(addListenerSpy.mock.calls.length);
    } finally {
      releaseLongHandler?.();
      await longDispatch;
      await register.destroyAsync();
      if (originalAnyDescriptor) {
        Object.defineProperty(AbortSignal, 'any', originalAnyDescriptor);
      } else {
        Reflect.deleteProperty(AbortSignal, 'any');
      }
    }
  });

  it('keeps fallback signal forwarding active until same-race losers settle', async () => {
    const originalAnyDescriptor = Object.getOwnPropertyDescriptor(AbortSignal, 'any');
    Object.defineProperty(AbortSignal, 'any', {
      configurable: true,
      writable: true,
      value: undefined,
    });

    const register = new ActionRegister<LifecycleActions>({
      registry: { autoCleanup: false, useConcurrencyQueue: false },
    });
    const controller = new AbortController();
    const addListenerSpy = jest.spyOn(controller.signal, 'addEventListener');
    const removeListenerSpy = jest.spyOn(controller.signal, 'removeEventListener');
    let releaseLoser: (() => void) | undefined;
    let markLoserStarted: (() => void) | undefined;
    let loserSignal: AbortSignal | undefined;
    const loserStarted = new Promise<void>(resolve => {
      markLoserStarted = resolve;
    });
    const loserGate = new Promise<void>(resolve => {
      releaseLoser = resolve;
    });

    register.register('second', () => 'winner', {
      id: 'winner',
      priority: 10,
      blocking: true,
    });
    register.register<'second', string>('second', (_payload, pipelineController) => {
      loserSignal = pipelineController.signal;
      markLoserStarted?.();
      return {
        then(resolve: (value: string) => void) {
          void loserGate.then(() => resolve('loser'));
        },
      } as Promise<string>;
    }, {
      id: 'loser',
      blocking: true,
    });

    try {
      const result = await register.dispatchWithResult<'second', string>(
        'second',
        undefined,
        {
          executionMode: 'race',
          signal: controller.signal,
        }
      );
      await loserStarted;

      expect(result.result).toBe('winner');
      expect(addListenerSpy).toHaveBeenCalled();
      expect(removeListenerSpy.mock.calls.length).toBeLessThan(
        addListenerSpy.mock.calls.length
      );

      controller.abort('caller cancelled');
      expect(loserSignal?.aborted).toBe(true);

      releaseLoser?.();
      await new Promise<void>(resolve => setImmediate(resolve));
      expect(removeListenerSpy).toHaveBeenCalledTimes(addListenerSpy.mock.calls.length);
    } finally {
      releaseLoser?.();
      await register.destroyAsync();
      if (originalAnyDescriptor) {
        Object.defineProperty(AbortSignal, 'any', originalAnyDescriptor);
      } else {
        Reflect.deleteProperty(AbortSignal, 'any');
      }
    }
  });

  it('keeps one-time handlers that were skipped by their condition', async () => {
    const register = new ActionRegister<LifecycleActions>();
    const cleanup = jest.fn();
    const handler = jest.fn();

    register.register('first', handler, {
      id: 'conditional-once-handler',
      once: true,
      condition: () => false,
      cleanup,
    });

    await register.dispatch('first');

    expect(handler).not.toHaveBeenCalled();
    expect(cleanup).not.toHaveBeenCalled();
    expect(register.getHandlerCount('first')).toBe(1);
    expect(register.getUnregisterFunctionCount()).toBe(1);

    await register.destroyAsync();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('only removes one-time handlers actually executed by dispatchWithResult', async () => {
    const register = new ActionRegister<LifecycleActions>();
    const skippedHandler = jest.fn();
    const executedHandler = jest.fn();
    const skippedCleanup = jest.fn();
    const executedCleanup = jest.fn();

    register.register('first', skippedHandler, {
      id: 'skipped-once-handler',
      priority: 10,
      once: true,
      condition: () => false,
      cleanup: skippedCleanup,
    });
    register.register('first', executedHandler, {
      id: 'executed-once-handler',
      once: true,
      cleanup: executedCleanup,
    });

    await register.dispatchWithResult('first');

    expect(skippedHandler).not.toHaveBeenCalled();
    expect(executedHandler).toHaveBeenCalledTimes(1);
    expect(skippedCleanup).not.toHaveBeenCalled();
    expect(executedCleanup).toHaveBeenCalledTimes(1);
    expect(register.getHandlerCount('first')).toBe(1);
    expect(register.hasUnregisterFunction('skipped-once-handler')).toBe(true);

    await register.destroyAsync();
    expect(skippedCleanup).toHaveBeenCalledTimes(1);
    expect(executedCleanup).toHaveBeenCalledTimes(1);
  });

  it('rejects queued dispatches on destroy without unhandled rejections', async () => {
    const register = new ActionRegister<LifecycleActions>({
      registry: { autoCleanup: false },
    });
    const handledPayloads: string[] = [];
    let releaseRunning: (() => void) | undefined;
    let markRunningStarted: (() => void) | undefined;
    const runningStarted = new Promise<void>(resolve => {
      markRunningStarted = resolve;
    });
    const runningGate = new Promise<void>(resolve => {
      releaseRunning = resolve;
    });
    const unhandledRejection = jest.fn();
    const onUnhandledRejection = (reason: unknown) => {
      unhandledRejection(reason);
    };

    register.register('queued', async payload => {
      handledPayloads.push(payload.id);
      if (payload.id === 'running') {
        markRunningStarted?.();
        await runningGate;
      }
    }, { blocking: true });

    const runningDispatch = register.dispatch('queued', { id: 'running' });
    await runningStarted;

    const observedPendingDispatch = register.dispatch('queued', { id: 'observed-pending' });
    const pendingRejection = expect(observedPendingDispatch).rejects.toBeInstanceOf(
      ActionRegisterDestroyedError
    );

    process.on('unhandledRejection', onUnhandledRejection);
    void register.dispatch('queued', { id: 'fire-and-forget-pending' });

    try {
      register.destroy();

      await pendingRejection;
      await new Promise<void>(resolve => setImmediate(resolve));

      expect(unhandledRejection).not.toHaveBeenCalled();
      expect(handledPayloads).toEqual(['running']);
    } finally {
      process.off('unhandledRejection', onUnhandledRejection);
      releaseRunning?.();
      await runningDispatch;
    }
  });

  it('honors dispatch queue priority for pending actions', async () => {
    const register = new ActionRegister<LifecycleActions>({
      registry: { autoCleanup: false },
    });
    const executionOrder: string[] = [];
    let releaseFirst: (() => void) | undefined;
    let markFirstStarted: (() => void) | undefined;
    const firstStarted = new Promise<void>(resolve => {
      markFirstStarted = resolve;
    });
    const firstGate = new Promise<void>(resolve => {
      releaseFirst = resolve;
    });

    register.register('queued', async payload => {
      executionOrder.push(payload.id);
      if (payload.id === 'first') {
        markFirstStarted?.();
        await firstGate;
      }
    }, { blocking: true });

    const first = register.dispatch('queued', { id: 'first' });
    await firstStarted;
    const lowPriority = register.dispatch(
      'queued',
      { id: 'low' },
      { queuePriority: 1 }
    );
    const highPriority = register.dispatch(
      'queued',
      { id: 'high' },
      { queuePriority: 10 }
    );

    releaseFirst?.();
    await Promise.all([first, lowPriority, highPriority]);

    expect(executionOrder).toEqual(['first', 'high', 'low']);
    register.destroy();
  });

  it('does not dispatch after a signal aborts during debounce', async () => {
    jest.useFakeTimers();
    const register = new ActionRegister<LifecycleActions>({
      registry: { autoCleanup: false, useConcurrencyQueue: false },
    });
    const handler = jest.fn();
    const controller = new AbortController();
    register.register('first', handler);

    try {
      const dispatchPromise = register.dispatch('first', undefined, {
        debounce: 100,
        signal: controller.signal,
      });
      controller.abort();

      await jest.advanceTimersByTimeAsync(100);
      await expect(dispatchPromise).resolves.toBeUndefined();
      expect(handler).not.toHaveBeenCalled();
    } finally {
      register.destroy();
      jest.clearAllTimers();
      jest.useRealTimers();
    }
  });

  it('returns an aborted result when a signal aborts during debounce', async () => {
    jest.useFakeTimers();
    const register = new ActionRegister<LifecycleActions>({
      registry: { autoCleanup: false, useConcurrencyQueue: false },
    });
    const handler = jest.fn();
    const controller = new AbortController();
    register.register('first', handler);

    try {
      const dispatchPromise = register.dispatchWithResult('first', undefined, {
        debounce: 100,
        signal: controller.signal,
      });
      controller.abort();

      await jest.advanceTimersByTimeAsync(100);
      await expect(dispatchPromise).resolves.toMatchObject({
        success: false,
        aborted: true,
        abortReason: 'Action dispatch aborted by signal',
        execution: {
          handlersExecuted: 0,
          handlersSkipped: 1,
        },
      });
      expect(handler).not.toHaveBeenCalled();
    } finally {
      register.destroy();
      jest.clearAllTimers();
      jest.useRealTimers();
    }
  });

  it('makes shutdown terminal and returns one stable destroy promise', async () => {
    const register = new ActionRegister<LifecycleActions>();
    register.register('first', jest.fn());

    const firstShutdown = register.destroyAsync();
    const repeatedShutdown = register.destroyAsync();

    expect(repeatedShutdown).toBe(firstShutdown);
    await firstShutdown;
    expect(register.destroyAsync()).toBe(firstShutdown);

    expect(() => register.register('first', jest.fn())).toThrow(
      ActionRegisterDestroyedError
    );
    await expect(register.dispatch('first')).rejects.toBeInstanceOf(
      ActionRegisterDestroyedError
    );
    await expect(register.dispatchWithResult('first')).rejects.toBeInstanceOf(
      ActionRegisterDestroyedError
    );
  });

  it('keeps the same destroy promise during reentrant cleanup', async () => {
    const register = new ActionRegister<LifecycleActions>();
    let nestedShutdown: Promise<void> | undefined;
    register.register('first', jest.fn(), {
      cleanup: () => {
        nestedShutdown = register.destroyAsync();
      },
    });

    const outerShutdown = register.destroyAsync();
    await outerShutdown;
    expect(nestedShutdown).toBe(outerShutdown);
  });

  it('does not finalize before a handler that initiates shutdown settles', async () => {
    const register = new ActionRegister<LifecycleActions>();
    const cleanup = jest.fn();
    let releaseHandler: (() => void) | undefined;
    let shutdownFromHandler: Promise<void> | undefined;
    const gate = new Promise<void>(resolve => {
      releaseHandler = resolve;
    });

    register.register('first', () => {
      shutdownFromHandler = register.destroyAsync();
      return gate;
    }, { blocking: true, cleanup });

    const dispatch = register.dispatch('first', undefined, { immediate: true });
    await Promise.resolve();
    expect(cleanup).not.toHaveBeenCalled();

    let shutdownSettled = false;
    void shutdownFromHandler?.then(() => {
      shutdownSettled = true;
    });
    await Promise.resolve();
    expect(shutdownSettled).toBe(false);

    releaseHandler?.();
    await dispatch;
    await shutdownFromHandler;
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('keeps one destroy promise when an abort listener reenters shutdown', async () => {
    const register = new ActionRegister<LifecycleActions>();
    let releaseHandler: (() => void) | undefined;
    let markStarted: (() => void) | undefined;
    let nestedShutdown: Promise<void> | undefined;
    const started = new Promise<void>(resolve => {
      markStarted = resolve;
    });
    const gate = new Promise<void>(resolve => {
      releaseHandler = resolve;
    });

    register.register('first', async (_payload, controller) => {
      controller.signal?.addEventListener('abort', () => {
        nestedShutdown = register.destroyAsync();
      }, { once: true });
      markStarted?.();
      await gate;
    }, { blocking: true });

    const dispatch = register.dispatch('first', undefined, { immediate: true });
    await started;
    const outerShutdown = register.destroyAsync();

    expect(nestedShutdown).toBe(outerShutdown);
    releaseHandler?.();
    await dispatch;
    await outerShutdown;
  });

  it('waits for an active handler before running registered cleanup', async () => {
    const register = new ActionRegister<LifecycleActions>();
    const cleanup = jest.fn();
    let releaseHandler: (() => void) | undefined;
    let markStarted: (() => void) | undefined;
    let handlerSignal: AbortSignal | undefined;
    const started = new Promise<void>(resolve => {
      markStarted = resolve;
    });
    const gate = new Promise<void>(resolve => {
      releaseHandler = resolve;
    });

    register.register('first', async (_payload, controller) => {
      handlerSignal = controller.signal;
      markStarted?.();
      await gate;
    }, { blocking: true, cleanup });

    const dispatch = register.dispatch('first');
    await started;

    const shutdown = register.destroyAsync();
    expect(handlerSignal?.aborted).toBe(true);
    expect(cleanup).not.toHaveBeenCalled();

    releaseHandler?.();
    await dispatch;
    await shutdown;
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('drains race losers before final cleanup', async () => {
    const register = new ActionRegister<LifecycleActions>();
    const fastCleanup = jest.fn();
    const slowCleanup = jest.fn();
    let releaseSlow: (() => void) | undefined;
    let markSlowStarted: (() => void) | undefined;
    let slowSignal: AbortSignal | undefined;
    const slowStarted = new Promise<void>(resolve => {
      markSlowStarted = resolve;
    });
    const slowGate = new Promise<void>(resolve => {
      releaseSlow = resolve;
    });

    register.register('first', () => 'fast', {
      id: 'fast',
      priority: 10,
      blocking: true,
      once: true,
      cleanup: fastCleanup,
    });
    register.register<'first', string>('first', (_payload, controller) => {
      slowSignal = controller.signal;
      markSlowStarted?.();
      return {
        then(resolve: (value: string) => void) {
          void slowGate.then(() => resolve('slow'));
        },
      } as Promise<string>;
    }, {
      id: 'slow',
      blocking: true,
      once: true,
      cleanup: slowCleanup,
    });

    const result = await register.dispatchWithResult<'first', string>('first', undefined, {
      executionMode: 'race',
    });
    await slowStarted;
    expect(result.success).toBe(true);

    const shutdown = register.destroyAsync();
    expect(slowSignal?.aborted).toBe(true);
    expect(fastCleanup).not.toHaveBeenCalled();
    expect(slowCleanup).not.toHaveBeenCalled();

    releaseSlow?.();
    await shutdown;
    expect(fastCleanup).toHaveBeenCalledTimes(1);
    expect(slowCleanup).toHaveBeenCalledTimes(1);
  });
});
