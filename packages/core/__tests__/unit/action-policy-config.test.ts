import {
  ActionRegister,
  type ActionPayloadMap,
  ActionTimeoutError,
} from '../../src';

interface TestActions extends ActionPayloadMap {
  serialWork: { id: string };
  preempt: void;
  concurrentPeer: { label: string };
  timedWork: void;
}

interface TestResults {
  preempt: string;
}

describe('M2 · ActionRegister contract-level action queue & timeout policies', () => {
  it('allows actions with queue: "immediate" to preempt serial queues and re-enter nested dispatches without call-site flags', async () => {
    const events: string[] = [];
    let releaseOuter!: () => void;
    const outerGate = new Promise<void>((resolve) => {
      releaseOuter = resolve;
    });

    const register = new ActionRegister<TestActions, TestResults>({
      name: 'PolicyQueuePreempt',
      registry: { useConcurrencyQueue: true },
      actions: {
        preempt: { queue: 'immediate' },
      },
    });

    register.register('serialWork', async ({ id }) => {
      events.push(`serial:start:${id}`);
      if (id === 'nested') {
        const res = await register.dispatchWithResult('preempt');
        events.push(`serial:nested-result:${res.result}`);
      } else {
        await outerGate;
      }
      events.push(`serial:end:${id}`);
    });

    register.registerResult('preempt', () => {
      events.push('preempt:run');
      return 'ok';
    });

    // 1) Preempt an active queued operation while it waits externally
    const firstRun = register.dispatch('serialWork', { id: 'first' });
    await Promise.resolve();
    expect(events).toEqual(['serial:start:first']);

    const preemptResult = await register.dispatchWithResult('preempt');
    expect(preemptResult.success).toBe(true);
    expect(preemptResult.result).toBe('ok');
    expect(events).toEqual(['serial:start:first', 'preempt:run']);

    releaseOuter();
    await firstRun;

    // 2) Nested re-entry inside a queued handler works with no call-site { immediate: true }
    events.length = 0;
    await register.dispatch('serialWork', { id: 'nested' });
    expect(events).toEqual([
      'serial:start:nested',
      'preempt:run',
      'serial:nested-result:ok',
      'serial:end:nested',
    ]);

    // 3) Explicit call-site { immediate: false } overrides contract policy and serializes behind queue
    events.length = 0;
    let releaseSecond!: () => void;
    const secondGate = new Promise<void>((resolve) => {
      releaseSecond = resolve;
    });
    register.register('serialWork', async ({ id }) => {
      events.push(`gated:${id}`);
      await secondGate;
    });
    const gatedRun = register.dispatch('serialWork', { id: 'hold' });
    const queuedPreempt = register.dispatchWithResult('preempt', undefined, {
      immediate: false,
    });
    await Promise.resolve();
    expect(events).not.toContain('preempt:run');

    releaseSecond();
    await Promise.all([gatedRun, queuedPreempt]);
    expect(events).toContain('preempt:run');

    register.destroy();
  });

  it('serializes only actions marked queue: "serial" when registry.useConcurrencyQueue is false', async () => {
    const order: string[] = [];
    let releaseFirstSerial!: () => void;
    const firstGate = new Promise<void>((resolve) => {
      releaseFirstSerial = resolve;
    });

    const register = new ActionRegister<TestActions>({
      name: 'SelectiveSerialQueue',
      actions: {
        serialWork: { queue: 'serial' },
      },
    });

    register.register('serialWork', async ({ id }) => {
      order.push(`serial:start:${id}`);
      if (id === '1') {
        await firstGate;
      }
      order.push(`serial:end:${id}`);
    });

    register.register('concurrentPeer', ({ label }) => {
      order.push(`peer:${label}`);
    });

    const p1 = register.dispatch('serialWork', { id: '1' });
    const p2 = register.dispatch('serialWork', { id: '2' });
    await Promise.resolve();

    // Unconfigured sibling actions run immediately without waiting in the queue
    await register.dispatch('concurrentPeer', { label: 'fast' });
    expect(order).toEqual(['serial:start:1', 'peer:fast']);

    // Call-site { immediate: true } overrides queue: 'serial'
    await register.dispatch('serialWork', { id: 'bypass' }, { immediate: true });
    expect(order).toEqual([
      'serial:start:1',
      'peer:fast',
      'serial:start:bypass',
      'serial:end:bypass',
    ]);

    releaseFirstSerial();
    await Promise.all([p1, p2]);
    expect(order).toEqual([
      'serial:start:1',
      'peer:fast',
      'serial:start:bypass',
      'serial:end:bypass',
      'serial:end:1',
      'serial:start:2',
      'serial:end:2',
    ]);

    register.destroy();
  });

  it('applies contract-level action timeout defaults unless overridden at the call site', async () => {
    const register = new ActionRegister<TestActions>({
      name: 'PolicyTimeout',
      actions: {
        timedWork: { timeout: 15 },
      },
    });

    register.register('timedWork', async () => {
      await new Promise((resolve) => setTimeout(resolve, 60));
    });

    await expect(register.dispatch('timedWork')).rejects.toThrow(ActionTimeoutError);
    await expect(register.dispatch('timedWork', undefined, { timeout: 200 })).resolves.toBeUndefined();

    register.destroy();
  });

  it('validates invalid action queue or timeout policy eagerly on construction', () => {
    expect(
      () =>
        new ActionRegister<TestActions>({
          actions: {
            timedWork: { timeout: -5 },
          },
        })
    ).toThrow(RangeError);

    expect(
      () =>
        new ActionRegister<TestActions>({
          actions: {
            preempt: { queue: 'invalid' as 'serial' },
          },
        })
    ).toThrow(TypeError);
  });

  it('preserves frozen default action policy options across repeated dispatches and overrides', async () => {
    const register = new ActionRegister<TestActions>({
      name: 'CachedPolicyDefaults',
      actions: {
        timedWork: { queue: 'immediate', timeout: 25 },
      },
    });

    const observed: number[] = [];
    register.register('timedWork', async () => {
      observed.push(observed.length + 1);
      await new Promise((resolve) => setTimeout(resolve, 5));
    });

    await expect(register.dispatch('timedWork')).resolves.toBeUndefined();
    await expect(register.dispatch('timedWork', undefined, { timeout: 100 })).resolves.toBeUndefined();
    await expect(register.dispatch('timedWork')).resolves.toBeUndefined();
    expect(observed).toEqual([1, 2, 3]);

    register.destroy();
  });

  it('lazily initializes dispatchQueue for explicit immediate: false without global concurrency queue', async () => {
    const register = new ActionRegister<{ queuedWork: { id: string } }>({
      name: 'LazyImmediateFalseQueue',
    });

    const events: string[] = [];
    let releaseFirst!: () => void;
    const firstEntered = new Promise<void>((resolve) => {
      register.register('queuedWork', async (payload) => {
        events.push(`start:${payload.id}`);
        if (payload.id === 'first') {
          resolve();
          await new Promise<void>((done) => {
            releaseFirst = done;
          });
        }
        events.push(`end:${payload.id}`);
      });
    });

    const firstPromise = register.dispatch('queuedWork', { id: 'first' }, { immediate: false });
    await firstEntered;

    const secondPromise = register.dispatch('queuedWork', { id: 'second' }, { immediate: false });
    // Second queued call must stay queued until the first handler finishes.
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(events).toEqual(['start:first']);

    releaseFirst();
    await Promise.all([firstPromise, secondPromise]);

    expect(events).toEqual(['start:first', 'end:first', 'start:second', 'end:second']);
    register.destroy();
  });

  it('enforces lane: "fast" invariants fail-closed across construction, registration, execution mode, and trace subscription', async () => {
    const reg = new ActionRegister<TestActions>({
      name: 'FastLanePolicy',
      registry: { defaultExecutionMode: 'parallel' },
      actions: {
        preempt: { lane: 'fast' },
        serialWork: { lane: 'orchestrated', queue: 'serial', trace: true },
        concurrentPeer: { trace: false },
      },
    });

    expect(reg.getActionPolicy('preempt')).toEqual({
      lane: 'fast',
      queue: 'immediate',
      trace: false,
    });
    expect(reg.getActionPolicy('serialWork')).toEqual({
      lane: 'orchestrated',
      queue: 'serial',
      trace: true,
    });
    expect(reg.getActionPolicy('concurrentPeer')).toEqual({
      trace: false,
    });
    expect(reg.getActionExecutionMode('preempt')).toBe('sequential');
    expect(reg.getActionExecutionMode('serialWork')).toBe('parallel');

    // Global setExecutionMode('parallel') never overrides lane: 'fast'
    reg.setExecutionMode('parallel');
    expect(reg.getActionExecutionMode('preempt')).toBe('sequential');

    // Handler roles & options incompatible with lane: 'fast' fail closed
    expect(() => reg.registerGuard('preempt', () => undefined)).toThrow(TypeError);
    expect(() => reg.registerObserver('preempt', () => undefined)).toThrow(TypeError);
    expect(() => reg.register('preempt', () => undefined, { once: true })).toThrow(TypeError);
    expect(() => reg.register('preempt', () => undefined, { debounce: 10 })).toThrow(TypeError);
    expect(() => reg.register('preempt', () => undefined, { throttle: 10 })).toThrow(TypeError);
    expect(() => reg.setActionExecutionMode('preempt', 'parallel')).toThrow(TypeError);
    expect(() => reg.subscribeDispatchTrace(() => undefined, { actions: ['preempt'] })).toThrow(
      TypeError,
    );
    expect(() =>
      reg.subscribeDispatchTrace(() => undefined, { actions: ['concurrentPeer'] }),
    ).toThrow(TypeError);

    // Constructor rejections for contradictory lane: 'fast' / invalid lane / invalid trace
    expect(
      () =>
        new ActionRegister<TestActions>({
          actions: { preempt: { lane: 'fast', queue: 'serial' } },
        }),
    ).toThrow(TypeError);
    expect(
      () =>
        new ActionRegister<TestActions>({
          actions: { preempt: { lane: 'fast', timeout: 50 } },
        }),
    ).toThrow(TypeError);
    expect(
      () =>
        new ActionRegister<TestActions>({
          actions: { preempt: { lane: 'fast', trace: true } },
        }),
    ).toThrow(TypeError);
    expect(
      () =>
        new ActionRegister<TestActions>({
          actions: { preempt: { lane: 'fast' } },
          registry: {
            schema: {
              preempt: {
                safeParse: () => ({ success: true, data: undefined }),
              },
            },
          },
        }),
    ).toThrow(TypeError);
    expect(
      () =>
        new ActionRegister<TestActions>({
          actions: { preempt: { lane: 'unknown' as 'fast' } },
        }),
    ).toThrow(TypeError);
    expect(
      () =>
        new ActionRegister<TestActions>({
          actions: { preempt: { trace: 'yes' as unknown as boolean } },
        }),
    ).toThrow(TypeError);

    await reg.destroyAsync();
  });
});
