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
});
