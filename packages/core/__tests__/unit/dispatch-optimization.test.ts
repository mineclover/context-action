import {
  ActionRegister,
  type ActionDispatchTrace,
  type ActionPayloadMap,
} from '../../src/index';

interface OptActions extends ActionPayloadMap {
  compute: { value: number; log?: string[] };
  ping: void;
}

describe('ActionRegister dispatch optimization & compiled pipeline cache', () => {
  it('preserves sequential multi-handler semantics on the default fast path', async () => {
    const register = new ActionRegister<OptActions>({ name: 'FastPathParity' });
    const traceLog: string[] = [];

    register.register<'compute', number>(
      'compute',
      (payload, controller) => {
        traceLog.push(`high:${payload.value}`);
        controller.setResult(payload.value);
        controller.modifyPayload(prev => ({ ...prev, value: prev.value * 2 }));
      },
      { priority: 30, id: 'high' },
    );

    register.register<'compute', number>(
      'compute',
      (payload, controller) => {
        traceLog.push(`mid:${payload.value}`);
        controller.setResult(payload.value);
        controller.mergeResult((prev, cur) => (prev[0] ?? 0) + cur);
        expect(controller.getResults()).toEqual([15]);
      },
      { priority: 20, id: 'mid' },
    );

    register.register<'compute', number>(
      'compute',
      payload => {
        traceLog.push(`low:${payload.value}`);
      },
      { priority: 10, id: 'low' },
    );

    await register.dispatch('compute', { value: 5 });
    expect(traceLog).toEqual(['high:5', 'mid:10', 'low:10']);
    await register.destroyAsync();
  });

  it('honors narrow role controller surfaces on fast and async fast paths', async () => {
    const register = new ActionRegister<OptActions>({ name: 'FastRoleShape' });
    let seenCommand = false;
    let seenResult = false;

    register.registerCommand('ping', (_payload, controller) => {
      seenCommand = true;
      expect('getPayload' in controller).toBe(true);
      expect('abort' in controller).toBe(true);
      expect('modifyPayload' in controller).toBe(false);
      expect('setResult' in controller).toBe(false);
    }, { priority: 20 });

    register.register('ping', async (_payload, controller) => {
      seenResult = true;
      await Promise.resolve();
      expect('getPayload' in controller).toBe(true);
      expect('setResult' in controller).toBe(true);
    }, { priority: 10 });

    await register.dispatch('ping');
    expect(seenCommand).toBe(true);
    expect(seenResult).toBe(true);
    await register.destroyAsync();
  });

  it('honors condition skips, throws, fatal vs non-fatal errors, abort, return, and jumpToPriority bounds', async () => {
    const reported: Array<{ message: string; phase: string }> = [];
    const register = new ActionRegister<OptActions>({
      name: 'FastControlFlow',
      registry: {
        maxJumps: 2,
        errorHandler: (error, context) => {
          reported.push({
            message: error.message,
            phase: String((context as { phase?: string } | undefined)?.phase ?? ''),
          });
        },
      },
    });

    const seen: string[] = [];
    let loops = 0;
    register.register('compute', payload => {
      seen.push(`h1:${payload.value}`);
    }, {
      priority: 30,
      id: 'h1',
      condition: payload => payload.value > 0,
    });
    register.register('compute', (_payload, controller) => {
      loops += 1;
      seen.push(`jump:${loops}`);
      controller.jumpToPriority(30);
    }, { priority: 20, id: 'jumper' });
    register.register('compute', () => {
      seen.push('unreachable-after-max-jumps');
    }, { priority: 10, id: 'tail' });

    await register.dispatch('compute', { value: 1 });
    // maxJumps = 2: executes jumper -> jump 1 -> jumper -> jump 2 -> jumper aborts on 3rd jump
    expect(seen).toEqual(['h1:1', 'jump:1', 'h1:1', 'jump:2', 'h1:1', 'jump:3']);
    expect(reported).toEqual([]);

    // Non-fatal error continues pipeline without rejecting; fatal error rejects and invokes errorHandler
    const reg2 = new ActionRegister<OptActions>({
      name: 'FastErrors',
      registry: {
        errorHandler: (error, context) => {
          reported.push({
            message: error.message,
            phase: String((context as { phase?: string } | undefined)?.phase ?? ''),
          });
        },
      },
    });
    const ran: string[] = [];
    reg2.register('ping', () => { throw new Error('soft fail'); }, { priority: 30, blocking: false });
    reg2.register('ping', () => { ran.push('after-soft'); }, { priority: 20, blocking: false });
    await expect(reg2.dispatch('ping')).resolves.toBeUndefined();
    expect(ran).toEqual(['after-soft']);
    expect(reported).toEqual([]);

    // controller.return() stops subsequent handlers on the fast path
    const terminatedLog: string[] = [];
    reg2.register('compute', (_payload, controller) => {
      terminatedLog.push('first');
      controller.return(undefined);
    }, { priority: 40, id: 'early-return' });
    reg2.register('compute', () => {
      terminatedLog.push('skipped-after-return');
    }, { priority: 35, id: 'after-return' });
    await reg2.dispatch('compute', { value: 1 });
    expect(terminatedLog).toEqual(['first']);

    reg2.clearAction('compute');
    reg2.register('compute', () => { throw new Error('fatal fail'); }, { priority: 30, blocking: true });
    await expect(reg2.dispatch('compute', { value: 1 })).rejects.toThrow('fatal fail');
    expect(reported).toEqual([{ message: 'fatal fail', phase: 'execution' }]);

    await Promise.all([register.destroyAsync(), reg2.destroyAsync()]);
  });

  it('transitions cleanly from sync to async handlers (await-before-next and start-and-continue)', async () => {
    const reported: string[] = [];
    const register = new ActionRegister<OptActions>({
      name: 'FastAsyncTransition',
      registry: {
        errorHandler: error => {
          reported.push(error.message);
        },
      },
    });
    const order: string[] = [];

    register.register('ping', () => { order.push('sync-1'); }, { priority: 40 });
    register.register('ping', async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      order.push('async-await-2');
    }, { priority: 30, scheduling: 'await-before-next' });
    register.register('ping', async () => {
      await new Promise(resolve => setTimeout(resolve, 15));
      order.push('async-bg-3');
    }, { priority: 20, scheduling: 'start-and-continue', blocking: false });
    register.register('ping', () => { order.push('sync-4'); }, { priority: 10 });

    await register.dispatch('ping');
    expect(order).toEqual(['sync-1', 'async-await-2', 'sync-4', 'async-bg-3']);

    // Condition throwing in async fast continuation rejects cleanly and notifies errorHandler
    register.register('ping', () => undefined, {
      priority: 5,
      condition: () => { throw new Error('late condition boom'); },
    });
    await expect(register.dispatch('ping')).rejects.toThrow('late condition boom');
    expect(reported).toEqual(['late condition boom']);

    await register.destroyAsync();
  });

  it('invalidates compiled pipeline cache across register, replaceExisting, unregister, clearAction, clearAll, and once', async () => {
    const register = new ActionRegister<OptActions>({ name: 'CacheInvalidation' });
    const calls: string[] = [];

    const unregA = register.register('ping', () => { calls.push('a1'); }, { id: 'a', priority: 20 });
    await register.dispatch('ping');

    // Replace existing handler with same ID
    const unregA2 = register.register('ping', () => { calls.push('a2'); }, {
      id: 'a',
      priority: 20,
      replaceExisting: true,
    });
    await register.dispatch('ping');

    // Add once handler (automatically bypasses fast path via hasOnce and removes itself)
    register.register('ping', () => { calls.push('once'); }, { id: 'b', priority: 10, once: true });
    await register.dispatch('ping');
    await register.dispatch('ping');

    // Unregister and verify cache cleared
    unregA(); // stale handle from replaced registration must be no-op
    unregA2();
    await register.dispatch('ping');

    register.register('ping', () => { calls.push('c'); }, { id: 'c' });
    await register.dispatch('ping');
    register.clearAction('ping');
    await register.dispatch('ping');

    register.register('ping', () => { calls.push('d'); }, { id: 'd' });
    register.clearAll();
    await register.dispatch('ping');

    expect(calls).toEqual(['a1', 'a2', 'a2', 'once', 'a2', 'c']);
    await register.destroyAsync();
  });

  it('drains mid-dispatch destroyAsync() and supports runtime trace subscriptions after cache warm-up', async () => {
    const register = new ActionRegister<OptActions>({ name: 'DestroyAndTrace' });
    let completedAsync = false;
    let unmountedRan = false;

    register.register('ping', async () => {
      await new Promise(resolve => setTimeout(resolve, 15));
      completedAsync = true;
    }, { cleanup: () => { unmountedRan = true; } });

    // Warm compiled pipeline cache with fast path first
    await register.dispatch('ping');
    expect(completedAsync).toBe(true);
    completedAsync = false;

    // Attach trace listener dynamically -> must bypass fast path cleanly
    const traceEvents: ActionDispatchTrace[] = [];
    const unsubscribeTrace = register.subscribeDispatchTrace(event => traceEvents.push(event));
    await register.dispatch('ping');
    expect(traceEvents.map(event => `${event.phase}:${event.status ?? ''}`)).toEqual([
      'started:',
      'settled:completed',
    ]);
    unsubscribeTrace();

    // Start fast-path dispatch then destroyAsync mid-flight
    completedAsync = false;
    const inflight = register.dispatch('ping');
    await register.destroyAsync();
    await inflight;

    expect(completedAsync).toBe(true);
    expect(unmountedRan).toBe(true);
  });

  it('resolves cooperative AbortError on mid-dispatch destroyAsync() without invoking errorHandler', async () => {
    const errorHandler = jest.fn();
    const cleanup = jest.fn();
    const register = new ActionRegister<OptActions>({
      name: 'FastDestroyAbortError',
      registry: { errorHandler },
    });

    let startedResolve!: () => void;
    const started = new Promise<void>(resolve => {
      startedResolve = resolve;
    });

    register.register(
      'ping',
      (_payload, controller) =>
        new Promise<void>((_resolve, reject) => {
          const onAbort = () => {
            const abortError = Object.assign(new Error('Aborted'), { name: 'AbortError' });
            reject(abortError);
          };
          if (controller.signal?.aborted) {
            onAbort();
            return;
          }
          controller.signal?.addEventListener('abort', onAbort, { once: true });
          startedResolve();
        }),
      { blocking: true, scheduling: 'await-before-next', cleanup },
    );

    const inflight = register.dispatch('ping');
    await started;
    const shutdown = register.destroyAsync();

    await expect(inflight).resolves.toBeUndefined();
    await shutdown;
    expect(errorHandler).not.toHaveBeenCalled();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('matches slow-path cancellation when controller.abort() is followed by throw or rejection', async () => {
    const createRegister = (mode: 'sync' | 'await' | 'bg', errorHandler: jest.Mock) => {
      const register = new ActionRegister<OptActions>({
        name: `FastAbortParity-${mode}`,
        registry: { errorHandler },
      });

      if (mode === 'sync') {
        register.register(
          'ping',
          (_payload, controller) => {
            controller.abort('stop-sync');
            throw new Error('after-abort-sync');
          },
          { blocking: true },
        );
      } else if (mode === 'await') {
        register.register(
          'ping',
          async (_payload, controller) => {
            controller.abort('stop-await');
            await Promise.resolve();
            throw new Error('after-abort-await');
          },
          { blocking: true, scheduling: 'await-before-next' },
        );
      } else {
        register.register(
          'ping',
          async (_payload, controller) => {
            controller.abort('stop-bg');
            await Promise.resolve();
            throw new Error('after-abort-bg');
          },
          { blocking: true, scheduling: 'start-and-continue' },
        );
      }

      return register;
    };

    for (const mode of ['sync', 'await', 'bg'] as const) {
      const fastErrors = jest.fn();
      const slowErrors = jest.fn();
      const fastReg = createRegister(mode, fastErrors);
      const slowReg = createRegister(mode, slowErrors);

      await expect(fastReg.dispatch('ping')).resolves.toBeUndefined();
      const slowResult = await slowReg.dispatchWithResult('ping', undefined, {});
      expect(slowResult.aborted).toBe(true);
      expect(slowResult.outcome).toBe('cancelled');
      await expect(slowReg.dispatch('ping', undefined, {})).resolves.toBeUndefined();

      expect(fastErrors).not.toHaveBeenCalled();
      expect(slowErrors).not.toHaveBeenCalled();
      await Promise.all([fastReg.destroyAsync(), slowReg.destroyAsync()]);
    }
  });

  it('normalizes non-Error condition throws and passes original dispatch payload to errorHandler', async () => {
    const fastErrors: Array<{ isError: boolean; message: string; payload: unknown }> = [];
    const slowErrors: Array<{ isError: boolean; message: string; payload: unknown }> = [];

    const setupNonErrorCondition = (
      targetErrors: Array<{ isError: boolean; message: string; payload: unknown }>,
    ) => {
      const reg = new ActionRegister<OptActions>({
        name: 'NonErrorCondition',
        registry: {
          errorHandler: (error, context) => {
            targetErrors.push({
              isError: error instanceof Error,
              message: error.message,
              payload: (context as { payload?: unknown } | undefined)?.payload,
            });
          },
        },
      });
      reg.register('compute', () => undefined, {
        condition: () => {
          throw 'bad-condition';
        },
      });
      return reg;
    };

    const fastCondReg = setupNonErrorCondition(fastErrors);
    const slowCondReg = setupNonErrorCondition(slowErrors);

    await expect(fastCondReg.dispatch('compute', { value: 42 })).rejects.toThrow('bad-condition');
    await expect(slowCondReg.dispatch('compute', { value: 42 }, {})).rejects.toThrow('bad-condition');
    expect(fastErrors).toEqual([{ isError: true, message: 'bad-condition', payload: { value: 42 } }]);
    expect(fastErrors).toEqual(slowErrors);

    const fastMutationErrors: Array<{ message: string; payload: unknown }> = [];
    const slowMutationErrors: Array<{ message: string; payload: unknown }> = [];

    const setupModifiedPayloadError = (
      targetErrors: Array<{ message: string; payload: unknown }>,
    ) => {
      const reg = new ActionRegister<OptActions>({
        name: 'OriginalPayloadError',
        registry: {
          errorHandler: (error, context) => {
            targetErrors.push({
              message: error.message,
              payload: (context as { payload?: unknown } | undefined)?.payload,
            });
          },
        },
      });
      reg.register(
        'compute',
        (_payload, controller) => {
          controller.modifyPayload(prev => ({ ...prev, value: prev.value + 100 }));
        },
        { priority: 20 },
      );
      reg.register(
        'compute',
        () => {
          throw new Error('fatal-after-modify');
        },
        { priority: 10, blocking: true },
      );
      return reg;
    };

    const fastMutReg = setupModifiedPayloadError(fastMutationErrors);
    const slowMutReg = setupModifiedPayloadError(slowMutationErrors);

    await expect(fastMutReg.dispatch('compute', { value: 7 })).rejects.toThrow('fatal-after-modify');
    await expect(slowMutReg.dispatch('compute', { value: 7 }, {})).rejects.toThrow('fatal-after-modify');

    expect(fastMutationErrors).toEqual([
      { message: 'fatal-after-modify', payload: { value: 7 } },
    ]);
    expect(fastMutationErrors).toEqual(slowMutationErrors);

    await Promise.all([
      fastCondReg.destroyAsync(),
      slowCondReg.destroyAsync(),
      fastMutReg.destroyAsync(),
      slowMutReg.destroyAsync(),
    ]);
  });

  it('catches handlers returning objects with throwing .then getters according to errorPolicy', async () => {
    const errorHandler = jest.fn();
    const regNonFatal = new ActionRegister<OptActions>({
      name: 'ThrowingThenableNonFatal',
      registry: { errorHandler },
    });
    const ran: string[] = [];
    const throwingThenable = Object.defineProperty({}, 'then', {
      get() {
        throw new Error('broken-thenable');
      },
    });

    regNonFatal.register('ping', () => throwingThenable as Promise<void>, {
      priority: 20,
      blocking: false,
    });
    regNonFatal.register(
      'ping',
      () => {
        ran.push('continued');
      },
      { priority: 10 },
    );

    const nonFatalPromise = regNonFatal.dispatch('ping');
    await expect(nonFatalPromise).resolves.toBeUndefined();
    expect(ran).toEqual(['continued']);
    expect(errorHandler).not.toHaveBeenCalled();

    const regFatal = new ActionRegister<OptActions>({
      name: 'ThrowingThenableFatal',
      registry: { errorHandler },
    });
    regFatal.register('ping', () => throwingThenable as Promise<void>, { blocking: true });

    let fatalPromise!: Promise<void>;
    expect(() => {
      fatalPromise = regFatal.dispatch('ping');
    }).not.toThrow();
    await expect(fatalPromise).rejects.toThrow('broken-thenable');
    expect(errorHandler).toHaveBeenCalledTimes(1);
    expect(errorHandler.mock.calls[0]?.[0]).toMatchObject({ message: 'broken-thenable' });

    await Promise.all([regNonFatal.destroyAsync(), regFatal.destroyAsync()]);
  });

  it('maintains full differential parity between default fast path and explicit slow path across complex pipelines', async () => {
    interface ParityActions extends ActionPayloadMap {
      pipeline: { value: number };
      control: { step: number };
      aborted: void;
      fatal: { tag: string };
    }

    type ErrorRecord = { message: string; payload: unknown; phase: string };

    const runSuite = async (useSlowPath: boolean) => {
      const log: string[] = [];
      const errors: ErrorRecord[] = [];
      const register = new ActionRegister<ParityActions>({
        name: useSlowPath ? 'SlowParity' : 'FastParity',
        registry: {
          maxJumps: 1,
          errorHandler: (error, context) => {
            errors.push({
              message: error.message,
              payload: (context as { payload?: unknown } | undefined)?.payload,
              phase: String((context as { phase?: string } | undefined)?.phase ?? ''),
            });
          },
        },
      });

      const send = <K extends keyof ParityActions>(
        action: K,
        ...payloadArg: ParityActions[K] extends void ? [] : [ParityActions[K]]
      ) => {
        if (payloadArg.length === 0) {
          return useSlowPath
            ? (register.dispatch as (a: K, p?: undefined, o?: Record<string, never>) => Promise<void>)(action, undefined, {})
            : (register.dispatch as (a: K) => Promise<void>)(action);
        }
        return useSlowPath
          ? register.dispatch(action, payloadArg[0] as never, {})
          : register.dispatch(action, payloadArg[0] as never);
      };

      // 1. Mixed pipeline: command + modifyPayload + condition false + start-and-continue + await-before-next + soft fail
      register.registerCommand(
        'pipeline',
        (payload, controller) => {
          log.push(`cmd:${payload.value}:${'setResult' in controller}`);
        },
        { priority: 50 },
      );
      register.register(
        'pipeline',
        (payload, controller) => {
          log.push(`mod:${payload.value}`);
          controller.modifyPayload(prev => ({ value: prev.value + 10 }));
        },
        { priority: 40 },
      );
      register.register(
        'pipeline',
        () => {
          log.push('skipped-cond');
        },
        { priority: 35, condition: () => false },
      );
      register.register(
        'pipeline',
        async payload => {
          await new Promise(resolve => setTimeout(resolve, 12));
          log.push(`bg:${payload.value}`);
        },
        { priority: 30, scheduling: 'start-and-continue', blocking: false },
      );
      register.register(
        'pipeline',
        () => {
          log.push('soft-throw');
          throw new Error('soft');
        },
        { priority: 25, blocking: false },
      );
      register.register(
        'pipeline',
        async payload => {
          await new Promise(resolve => setTimeout(resolve, 5));
          log.push(`await:${payload.value}`);
        },
        { priority: 20, scheduling: 'await-before-next' },
      );

      // 2. Return & jumpToPriority bounds
      let jumpCounter = 0;
      register.register(
        'control',
        (payload, controller) => {
          log.push(`ctrl-top:${payload.step}`);
          if (payload.step < 0) controller.return(undefined);
        },
        { priority: 30 },
      );
      register.register(
        'control',
        () => {
          jumpCounter += 1;
          log.push(`ctrl-jump:${jumpCounter}`);
        },
        { priority: 20 },
      );
      register.register(
        'control',
        (_payload, controller) => {
          log.push('ctrl-requester');
          controller.jumpToPriority(20);
        },
        { priority: 10 },
      );
      register.register(
        'control',
        () => {
          log.push('ctrl-tail-never');
        },
        { priority: 5 },
      );

      // 3. Aborted fatal throw
      register.register(
        'aborted',
        (_payload, controller) => {
          log.push('abort-call');
          controller.abort('done');
          throw new Error('post-abort');
        },
        { blocking: true },
      );

      // 4. Modified payload + fatal error
      register.register(
        'fatal',
        (_payload, controller) => {
          controller.modifyPayload(prev => ({ tag: `${prev.tag}-mutated` }));
        },
        { priority: 20 },
      );
      register.register(
        'fatal',
        payload => {
          log.push(`fatal:${payload.tag}`);
          throw new Error('fatal-boom');
        },
        { priority: 10, blocking: true },
      );

      await send('pipeline', { value: 5 });
      await send('control', { step: 1 });
      await send('control', { step: -1 });
      await send('aborted');

      let caughtFatal = '';
      try {
        await send('fatal', { tag: 'orig' });
      } catch (err) {
        caughtFatal = err instanceof Error ? err.message : String(err);
      }

      await register.destroyAsync();
      return { log, errors, caughtFatal };
    };

    const [fastOutcome, slowOutcome] = await Promise.all([runSuite(false), runSuite(true)]);
    expect(fastOutcome.caughtFatal).toBe('fatal-boom');
    expect(fastOutcome).toEqual(slowOutcome);
  });

  it('keeps immediate-only fast-path parity for contract queue:"immediate" and call-site { immediate: true }', async () => {
    interface ImmediateActions extends ActionPayloadMap {
      ping: { seq: number };
      timedPing: { seq: number };
      boom: { id: string };
    }

    const immediateErrors: Array<{ action?: string; options?: unknown; message: string }> = [];
    const reg = new ActionRegister<ImmediateActions>({
      name: 'ImmediateFastPath',
      actions: {
        ping: { queue: 'immediate' },
        timedPing: { queue: 'immediate', timeout: 25 },
      },
      registry: {
        useConcurrencyQueue: true,
        errorHandler: (error, context) => {
          const ctx = context as { action?: string; options?: unknown } | undefined;
          immediateErrors.push({
            action: ctx?.action,
            options: ctx?.options,
            message: error.message,
          });
        },
      },
    });

    const seen: number[] = [];
    reg.registerCommand('ping', payload => {
      seen.push(payload.seq);
    });
    reg.register('timedPing', async payload => {
      await new Promise(resolve => setTimeout(resolve, 60));
      seen.push(payload.seq);
    });
    reg.register(
      'boom',
      () => {
        throw new Error('boom-immediate');
      },
      { blocking: true },
    );

    // Contract actions.ping: { queue: 'immediate' } -> bypasses global queue on fast path
    await reg.dispatch('ping', { seq: 1 });
    // Call-site { immediate: true } -> bypasses global queue on fast path and preserves options in errorHandler
    await expect(reg.dispatch('boom', { id: 'x' }, { immediate: true })).rejects.toThrow(
      'boom-immediate',
    );
    // Contract actions.timedPing: { queue: 'immediate', timeout: 25 } -> must stay on slow path and enforce timeout
    await expect(reg.dispatch('timedPing', { seq: 2 })).rejects.toThrow(
      'Action "timedPing" timed out after 25ms',
    );

    expect(seen).toEqual([1]);
    expect(immediateErrors).toEqual([
      { action: 'boom', options: { immediate: true }, message: 'boom-immediate' },
      {
        action: 'timedPing',
        options: { immediate: true, timeout: 25 },
        message: 'Action "timedPing" timed out after 25ms',
      },
    ]);

    await reg.destroyAsync();
  });

  it('keeps fast-lane and sibling actions untraced while a scoped trace listener watches another action', async () => {
    interface LaneActions extends ActionPayloadMap {
      compute: { value: number };
      ping: void;
      other: { count: number };
      emptyOrchestrated: void;
    }

    const debugWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const reg = new ActionRegister<LaneActions>({
        name: 'ScopedTraceFastIsolation',
        registry: { debug: true },
        actions: {
          ping: { lane: 'fast' },
          emptyOrchestrated: { lane: 'orchestrated' },
        },
      });

      const ran: string[] = [];
      reg.register('compute', payload => { ran.push(`compute:${payload.value}`); });
      reg.registerCommand('ping', () => { ran.push('ping'); });
      reg.registerCommand('other', payload => { ran.push(`other:${payload.count}`); });

      const traced: ActionDispatchTrace[] = [];
      const unsub = reg.subscribeDispatchTrace(event => traced.push(event), {
        actions: ['compute'],
      });

      await reg.dispatch('compute', { value: 7 });
      await reg.dispatch('ping');
      await reg.dispatch('other', { count: 3 });

      expect(ran).toEqual(['compute:7', 'ping', 'other:3']);
      expect(traced.map(event => `${event.action}:${event.phase}:${event.status ?? ''}`)).toEqual([
        'compute:started:',
        'compute:settled:completed',
      ]);

      // lane: 'orchestrated' stays on full orchestration path (debug warning emitted even with no handlers)
      debugWarn.mockClear();
      await reg.dispatch('emptyOrchestrated');
      expect(debugWarn).toHaveBeenCalled();

      unsub();
      await reg.destroyAsync();
    } finally {
      debugWarn.mockRestore();
    }
  });
});
