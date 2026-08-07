import {
  ActionRegister,
  ActionTimeoutError,
  type ActionPayloadMap,
} from '../../src';

interface ContractActions extends ActionPayloadMap {
  work: { id: string };
  nestedOuter: void;
  nestedInner: void;
}

describe('DispatchOptions runtime contract', () => {
  let register: ActionRegister<ContractActions>;

  beforeEach(() => {
    register = new ActionRegister<ContractActions>({
      registry: { autoCleanup: false, useConcurrencyQueue: true },
    });
  });

  afterEach(() => {
    register.destroy();
    jest.useRealTimers();
  });

  it('retries a failing dispatch up to maxAttempts', async () => {
    let attempts = 0;
    register.register('work', () => {
      attempts += 1;
      if (attempts < 3) throw new Error(`failure-${attempts}`);
    }, { blocking: true });

    await expect(register.dispatch('work', { id: 'retry' }, {
      retryOnError: { maxAttempts: 3, delay: 0 },
    })).resolves.toBeUndefined();

    expect(attempts).toBe(3);
  });

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects an invalid timeout value (%p) before dispatching',
    timeout => {
      const handler = jest.fn();
      register.register('work', handler);

      expect(() => register.dispatch('work', { id: 'invalid-timeout' }, { timeout }))
        .toThrow('timeout must be a non-negative finite number');
      expect(handler).not.toHaveBeenCalled();
    },
  );

  it('releases a timed-out caller but drains a non-cooperative handler during shutdown', async () => {
    jest.useFakeTimers();
    let releaseHandler: (() => void) | undefined;
    let markStarted: (() => void) | undefined;
    const started = new Promise<void>(resolve => {
      markStarted = resolve;
    });
    const gate = new Promise<void>(resolve => {
      releaseHandler = resolve;
    });

    register.register('work', async () => {
      markStarted?.();
      // Intentionally ignore controller.signal: timeout cannot force-stop JS.
      await gate;
    }, { blocking: true });

    const dispatch = register.dispatch('work', { id: 'non-cooperative' }, {
      immediate: true,
      timeout: 10,
    });
    await started;

    await jest.advanceTimersByTimeAsync(10);
    await expect(dispatch).rejects.toBeInstanceOf(ActionTimeoutError);

    let shutdownFinished = false;
    const shutdown = register.destroyAsync().then(() => {
      shutdownFinished = true;
    });
    await Promise.resolve();
    expect(shutdownFinished).toBe(false);

    releaseHandler?.();
    await shutdown;
    expect(shutdownFinished).toBe(true);
  });

  it('retries failed result dispatches and returns the successful attempt', async () => {
    let attempts = 0;
    register.register('work', () => {
      attempts += 1;
      if (attempts === 1) throw new Error('first attempt failed');
      return 'recovered';
    }, { blocking: true });

    const result = await register.dispatchWithResult<'work', string>('work', { id: 'result-retry' }, {
      retryOnError: { maxAttempts: 2, delay: 0 },
      result: { collect: true, strategy: 'first' },
    });

    expect(attempts).toBe(2);
    expect(result.success).toBe(true);
    expect(result.result).toBe('recovered');
  });

  it('does not turn a failed once handler into a no-handler retry success', async () => {
    const handler = jest.fn(() => {
      throw new Error('once failed');
    });
    const cleanup = jest.fn();
    register.register('work', handler, {
      blocking: true,
      once: true,
      cleanup,
    });

    const result = await register.dispatchWithResult('work', { id: 'once' }, {
      retryOnError: { maxAttempts: 2, delay: 0 },
    });

    expect(result.success).toBe(false);
    expect(result.errors[0]?.error.message).toBe('once failed');
    expect(handler).toHaveBeenCalledTimes(1);
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('runs throttle preflight once and retries handler execution', async () => {
    let attempts = 0;
    register.register('work', () => {
      attempts += 1;
      if (attempts === 1) throw new Error('retry after throttle');
    }, { blocking: true });

    await register.dispatch('work', { id: 'throttle-retry' }, {
      throttle: 10_000,
      retryOnError: { maxAttempts: 2, delay: 0 },
    });

    expect(attempts).toBe(2);
  });

  it('validates only once when an execution is retried', async () => {
    const safeParse = jest.fn(() => ({ success: true as const, data: { id: 'validated' } }));
    register.destroy();
    register = new ActionRegister<ContractActions>({
      registry: {
        autoCleanup: false,
        schema: { work: { safeParse } } as any,
      },
    });
    let attempts = 0;
    register.register('work', () => {
      attempts += 1;
      if (attempts === 1) throw new Error('retry me');
    }, { blocking: true });

    await register.dispatch('work', { id: 'validation' }, {
      retryOnError: { maxAttempts: 2, delay: 0 },
    });

    expect(attempts).toBe(2);
    expect(safeParse).toHaveBeenCalledTimes(1);
  });

  it('never retries or bypasses a validator that throws', async () => {
    const safeParse = jest.fn(() => {
      throw new Error('validator crashed');
    });
    register.destroy();
    register = new ActionRegister<ContractActions>({
      registry: {
        autoCleanup: false,
        schema: { work: { safeParse } } as any,
      },
    });
    const handler = jest.fn();
    register.register('work', handler, { blocking: true });

    await expect(register.dispatch('work', { id: 'invalid' }, {
      retryOnError: { maxAttempts: 3, delay: 0 },
    })).rejects.toMatchObject({ name: 'ActionValidationError' });

    expect(safeParse).toHaveBeenCalledTimes(1);
    expect(handler).not.toHaveBeenCalled();
  });

  it('rejects callers on timeout while allowing the active handler to drain', async () => {
    jest.useFakeTimers();
    let releaseHandler: (() => void) | undefined;
    let markHandlerFinished: (() => void) | undefined;
    const handlerGate = new Promise<void>(resolve => {
      releaseHandler = resolve;
    });
    const handlerFinished = new Promise<void>(resolve => {
      markHandlerFinished = resolve;
    });
    register.register('work', async () => {
      await handlerGate;
      markHandlerFinished?.();
    }, { blocking: true });

    const dispatch = register.dispatch('work', { id: 'timeout' }, {
      immediate: true,
      timeout: 50,
    });

    await jest.advanceTimersByTimeAsync(50);
    await expect(dispatch).rejects.toBeInstanceOf(ActionTimeoutError);

    releaseHandler?.();
    await handlerFinished;
  });

  it('clears a successful race timeout while the losing handler drains', async () => {
    jest.useFakeTimers();
    let releaseLoser: (() => void) | undefined;
    let markLoserStarted: (() => void) | undefined;
    const loserGate = new Promise<void>(resolve => {
      releaseLoser = resolve;
    });
    const loserStarted = new Promise<void>(resolve => {
      markLoserStarted = resolve;
    });

    register.register('work', () => 'winner', {
      id: 'winner',
      priority: 10,
      blocking: true,
    });
    register.register('work', () => {
      markLoserStarted?.();
      return {
        then(resolve: (value: string) => void) {
          void loserGate.then(() => resolve('loser'));
        },
      } as Promise<string>;
    }, { id: 'loser', blocking: true });

    const result = await register.dispatchWithResult<'work', string>(
      'work',
      { id: 'race-timeout' },
      { executionMode: 'race', timeout: 10_000 }
    );
    await loserStarted;

    expect(result.result).toBe('winner');
    expect(jest.getTimerCount()).toBe(0);

    releaseLoser?.();
    await register.destroyAsync();
  });

  it('requires explicit undefined for void action proxy options', async () => {
    const explicitOptionsHandler = jest.fn();
    register.register('nestedInner', explicitOptionsHandler, { blocking: true });

    await register.actions.nestedInner(undefined, { throttle: 10_000 });
    await register.actions.nestedInner(undefined, { throttle: 10_000 });

    expect(explicitOptionsHandler).toHaveBeenCalledTimes(1);
  });

  it('applies options through the result proxy after an explicit undefined payload', async () => {
    register.register<'nestedOuter', string>('nestedOuter', () => 'proxy-result', {
      blocking: true,
    });

    const result = await register.actionsWithResult.nestedOuter(undefined, {
      result: { collect: true, strategy: 'first' },
    });

    expect(result.result).toBe('proxy-result');
  });

  it('invokes the global error handler once after retries are exhausted', async () => {
    const errorHandler = jest.fn();
    register.destroy();
    register = new ActionRegister<ContractActions>({
      registry: { autoCleanup: false, errorHandler },
    });
    const handler = jest.fn(() => {
      throw new Error('terminal failure');
    });
    register.register('work', handler, { blocking: true });

    await expect(register.dispatch('work', { id: 'failure' }, {
      retryOnError: { maxAttempts: 2, delay: 0 },
    })).rejects.toThrow('terminal failure');

    expect(handler).toHaveBeenCalledTimes(2);
    expect(errorHandler).toHaveBeenCalledTimes(1);
    expect(errorHandler.mock.calls[0]?.[1]).toMatchObject({
      action: 'work',
      attempts: 2,
      phase: 'execution',
    });
  });

  it('observes rejected async error handlers without replacing the dispatch error', async () => {
    const unhandled = jest.fn();
    const onUnhandled = (reason: unknown) => unhandled(reason);
    register.destroy();
    register = new ActionRegister<ContractActions>({
      registry: {
        autoCleanup: false,
        errorHandler: async () => {
          throw new Error('async error handler failed');
        },
      },
    });
    register.register('work', () => {
      throw new Error('original failure');
    }, { blocking: true });
    process.on('unhandledRejection', onUnhandled);

    try {
      await expect(register.dispatch('work', { id: 'async-error-handler' }))
        .rejects.toThrow('original failure');
      await new Promise<void>(resolve => setImmediate(resolve));
      expect(unhandled).not.toHaveBeenCalled();
    } finally {
      process.off('unhandledRejection', onUnhandled);
    }
  });

  it('removes a timed-out operation that is still waiting in the queue', async () => {
    jest.useFakeTimers();
    const handled: string[] = [];
    let releaseHead: (() => void) | undefined;
    let markHeadStarted: (() => void) | undefined;
    const headGate = new Promise<void>(resolve => {
      releaseHead = resolve;
    });
    const headStarted = new Promise<void>(resolve => {
      markHeadStarted = resolve;
    });
    register.register('work', async payload => {
      handled.push(payload.id);
      if (payload.id === 'head') {
        markHeadStarted?.();
        await headGate;
      }
    }, { blocking: true });

    const head = register.dispatch('work', { id: 'head' });
    await headStarted;
    const timed = register.dispatch('work', { id: 'timed' }, { timeout: 25 });

    await jest.advanceTimersByTimeAsync(25);
    await expect(timed).rejects.toBeInstanceOf(ActionTimeoutError);
    expect((register as any).dispatchQueue.getQueueInfo().queueLength).toBe(0);

    releaseHead?.();
    await head;
    expect(handled).toEqual(['head']);
  });

  it('serializes result dispatches and honors queue priority', async () => {
    const executionOrder: string[] = [];
    let releaseFirst: (() => void) | undefined;
    let markFirstStarted: (() => void) | undefined;
    const firstGate = new Promise<void>(resolve => {
      releaseFirst = resolve;
    });
    const firstStarted = new Promise<void>(resolve => {
      markFirstStarted = resolve;
    });
    register.register('work', async payload => {
      executionOrder.push(payload.id);
      if (payload.id === 'first') {
        markFirstStarted?.();
        await firstGate;
      }
      return payload.id;
    }, { blocking: true });

    const first = register.dispatchWithResult('work', { id: 'first' }, { queuePriority: 0 });
    await firstStarted;
    const low = register.dispatchWithResult('work', { id: 'low' }, { queuePriority: 1 });
    const high = register.dispatchWithResult('work', { id: 'high' }, { queuePriority: 10 });

    releaseFirst?.();
    await Promise.all([first, low, high]);

    expect(executionOrder).toEqual(['first', 'high', 'low']);
  });

  it('queues result dispatches by default when the registry queue is enabled', async () => {
    let releaseFirst: (() => void) | undefined;
    let markFirstStarted: (() => void) | undefined;
    const firstStarted = new Promise<void>(resolve => {
      markFirstStarted = resolve;
    });
    const firstGate = new Promise<void>(resolve => {
      releaseFirst = resolve;
    });
    const handled: string[] = [];

    register.register('work', async payload => {
      handled.push(payload.id);
      if (payload.id === 'first') {
        markFirstStarted?.();
        await firstGate;
      }
      return payload.id;
    }, { blocking: true });

    const first = register.dispatchWithResult('work', { id: 'first' });
    await firstStarted;
    const second = register.dispatchWithResult('work', { id: 'second' });

    expect(handled).toEqual(['first']);
    releaseFirst?.();

    await expect(first).resolves.toMatchObject({ success: true, result: 'first' });
    await expect(second).resolves.toMatchObject({ success: true, result: 'second' });
    expect(handled).toEqual(['first', 'second']);
  });

  it('preserves debounce behavior for default immediate result dispatches', async () => {
    jest.useFakeTimers();
    const handler = jest.fn();
    register.register('work', handler, { blocking: true });

    const first = register.dispatchWithResult('work', { id: 'first' }, { debounce: 40 });
    const second = register.dispatchWithResult('work', { id: 'second' }, { debounce: 40 });
    const third = register.dispatchWithResult('work', { id: 'third' }, { debounce: 40 });

    await jest.advanceTimersByTimeAsync(40);
    await Promise.all([first, second, third]);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(
      { id: 'third' },
      expect.any(Object)
    );
  });

  it('serializes timing-guarded executions after they are admitted', async () => {
    jest.useFakeTimers();
    const executionOrder: string[] = [];
    let releaseFirst: (() => void) | undefined;
    let markFirstStarted: (() => void) | undefined;
    const firstStarted = new Promise<void>(resolve => {
      markFirstStarted = resolve;
    });
    const firstGate = new Promise<void>(resolve => {
      releaseFirst = resolve;
    });

    register.register('work', async payload => {
      executionOrder.push(payload.id);
      if (payload.id === 'first') {
        markFirstStarted?.();
        await firstGate;
      }
    }, { blocking: true });

    const first = register.dispatch('work', { id: 'first' });
    await firstStarted;
    const debounced = register.dispatch('work', { id: 'debounced' }, { debounce: 20 });
    const after = register.dispatch('work', { id: 'after' });

    await jest.advanceTimersByTimeAsync(20);
    expect(executionOrder).toEqual(['first']);

    releaseFirst?.();
    await Promise.all([first, debounced, after]);
    expect(executionOrder).toEqual(['first', 'debounced', 'after']);
  });

  it('requires immediate mode for nested result dispatches in a serial queue', async () => {
    const inner = jest.fn(() => 'inner-result');
    register.register('nestedInner', inner, { blocking: true });
    register.register('nestedOuter', async () => {
      const result = await register.dispatchWithResult<'nestedInner', string>('nestedInner', undefined, {
        immediate: true,
      });
      return result.result;
    }, { blocking: true });

    const result = await register.dispatchWithResult<'nestedOuter', string>('nestedOuter');

    expect(result.success).toBe(true);
    expect(result.result).toBe('inner-result');
    expect(inner).toHaveBeenCalledTimes(1);
  });

  it('allows an explicitly immediate nested void dispatch in the current queue turn', async () => {
    const inner = jest.fn();
    register.register('nestedInner', inner, { blocking: true });
    register.register('nestedOuter', async () => {
      await register.dispatch('nestedInner', undefined, { immediate: true });
    }, { blocking: true });

    await register.dispatch('nestedOuter');

    expect(inner).toHaveBeenCalledTimes(1);
  });
});
