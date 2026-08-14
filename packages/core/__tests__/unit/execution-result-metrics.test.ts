import {
  ActionRegister,
  ActionTimeoutError,
  type ActionObserverEvent,
  type ActionPayloadMap,
} from '../../src';

interface MetricsActions extends ActionPayloadMap {
  run: { id: string };
}

describe('ExecutionResult metrics', () => {
  it('counts handlers from actual parallel invocations', async () => {
    const register = new ActionRegister<MetricsActions>();
    register.setActionExecutionMode('run', 'parallel');
    register.register('run', async () => 'first', { id: 'first' });
    register.register('run', async () => 'second', { id: 'second' });
    register.register('run', async () => 'third', { id: 'third' });

    const result = await register.dispatchWithResult('run', { id: 'parallel' });

    expect(result.execution.handlersExecuted).toBe(3);
    expect(result.execution.handlersSkipped).toBe(0);
    expect(result.execution.handlersFailed).toBe(0);
    expect(result.handlers.every(handler => handler.executed)).toBe(true);

    register.destroy();
  });

  it('copies handler metadata into execution outcomes', async () => {
    const register = new ActionRegister<MetricsActions>();
    register.register('run', () => 'ok', {
      id: 'annotated',
      metadata: { source: 'test', sensitive: false },
    });

    const result = await register.dispatchWithResult<'run', string>('run', { id: 'metadata' });

    expect(result.handlers[0]?.metadata).toEqual({ source: 'test', sensitive: false });
    register.destroy();
  });

  it('counts conditional handlers as skipped', async () => {
    const register = new ActionRegister<MetricsActions>();
    register.register('run', () => 'executed', { id: 'executed' });
    register.register('run', () => 'skipped', {
      id: 'skipped',
      condition: () => false,
    });

    const result = await register.dispatchWithResult('run', { id: 'conditional' });

    expect(result.execution.handlersExecuted).toBe(1);
    expect(result.execution.handlersSkipped).toBe(1);
    expect(result.handlers.find(handler => handler.id === 'skipped')?.executed).toBe(false);

    register.destroy();
  });

  it('keeps blocking handler errors distinguishable from pipeline errors', async () => {
    const register = new ActionRegister<MetricsActions>();
    register.register('run', () => {
      throw new Error('blocked');
    }, { id: 'blocked', blocking: true });

    const result = await register.dispatchWithResult('run', { id: 'blocking' });

    expect(result.execution.handlersFailed).toBe(1);
    expect(result.errors.find(error => error.handlerId === 'pipeline')?.severity).toBe('blocking');
    expect(result.failedResults).toHaveLength(1);

    register.destroy();
  });

  it('preserves controller.return values in parallel mode', async () => {
    const register = new ActionRegister<MetricsActions>();
    register.setActionExecutionMode('run', 'parallel');
    register.register('run', (_payload, controller) => {
      controller.return({ source: 'cache' } as never);
    }, { id: 'cache' });
    register.register('run', () => undefined, { id: 'fallback' });

    const result = await register.dispatchWithResult<'run', { source: string }>(
      'run',
      { id: 'termination' },
    );

    expect(result.terminated).toBe(true);
    expect(result.result).toEqual({ source: 'cache' });
    expect(result.handlers.find(handler => handler.id === 'cache')).toMatchObject({
      executed: true,
      status: 'succeeded',
    });

    register.destroy();
  });

  it('lets controller.return(undefined) override an earlier collected result', async () => {
    const register = new ActionRegister<MetricsActions>();
    register.register<'run', string | undefined>('run', () => 'earlier', {
      id: 'earlier',
      priority: 2,
    });
    register.register<'run', string | undefined>('run', (_payload, controller) => {
      controller.return(undefined);
    }, { id: 'terminate', priority: 1 });

    const result = await register.dispatchWithResult<'run', string | undefined>(
      'run',
      { id: 'undefined-termination' },
    );

    expect(result.results).toContain('earlier');
    expect(result.terminated).toBe(true);
    expect(result.result).toBeUndefined();
    register.destroy();
  });

  it('counts a handler that aborts after invocation', async () => {
    const register = new ActionRegister<MetricsActions>();
    register.register('run', (_payload, controller) => {
      controller.abort('stop');
    }, { id: 'aborting' });
    register.register('run', () => 'not-run', { id: 'after-abort' });

    const result = await register.dispatchWithResult('run', { id: 'abort' });

    expect(result.execution.handlersExecuted).toBe(1);
    expect(result.execution.handlersSkipped).toBe(1);
    expect(result.handlers.find(handler => handler.id === 'aborting')).toMatchObject({
      executed: true,
      status: 'succeeded',
    });
    expect(result.handlers.find(handler => handler.id === 'aborting')?.duration)
      .toEqual(expect.any(Number));

    register.destroy();
  });

  it('freezes race handler outcomes at result resolution', async () => {
    const register = new ActionRegister<MetricsActions>();
    let releaseSlow: (() => void) | undefined;
    const slowGate = new Promise<void>(resolve => {
      releaseSlow = resolve;
    });
    register.setActionExecutionMode('run', 'race');
    register.register<'run', string>('run', async () => {
      await slowGate;
      return 'slow';
    }, { id: 'slow' });
    register.register<'run', string>('run', () => 'fast', { id: 'fast' });

    const result = await register.dispatchWithResult('run', { id: 'race' });
    const slowOutcome = result.handlers.find(handler => handler.id === 'slow');
    expect(slowOutcome?.status).toBe('running');

    releaseSlow?.();
    await Promise.resolve();
    expect(slowOutcome?.status).toBe('running');
    register.destroy();
  });

  it('does not let a losing race handler abort a successful winner', async () => {
    const register = new ActionRegister<MetricsActions>();
    let releaseLoser: (() => void) | undefined;
    const loserGate = new Promise<void>(resolve => {
      releaseLoser = resolve;
    });
    register.setActionExecutionMode('run', 'race');
    register.register<'run', string>('run', async (_payload, controller) => {
      controller.abort('loser failed');
      await loserGate;
      return 'loser';
    }, { id: 'loser' });
    register.register<'run', string>('run', () => 'winner', { id: 'winner' });

    const result = await register.dispatchWithResult('run', { id: 'race-abort' });
    expect(result.success).toBe(true);
    expect(result.aborted).toBe(false);
    expect(result.result).toBe('winner');

    releaseLoser?.();
    register.destroy();
  });

  it('runs race guards before a result candidate can succeed', async () => {
    const register = new ActionRegister<MetricsActions>();
    register.setActionExecutionMode('run', 'race');
    const resultHandler = jest.fn(() => 'sensitive');
    register.registerGuard('run', (_payload, controller) => {
      controller.abort('permission denied');
    }, { id: 'authorization', priority: 100 });
    register.register('run', resultHandler, { id: 'result' });

    const result = await register.dispatchWithResult<'run', string>('run', { id: 'guarded' });
    expect(result.aborted).toBe(true);
    expect(result.result).toBeUndefined();
    expect(resultHandler).not.toHaveBeenCalled();
    register.destroy();
  });

  it('fails closed when an unsafe runtime guard configuration requests collect', async () => {
    const register = new ActionRegister<MetricsActions>();
    const resultHandler = jest.fn(() => 'must not run');
    register.registerGuard('run', () => {
      throw new Error('authorization unavailable');
    }, { errorPolicy: 'collect' } as never);
    register.register('run', resultHandler);

    const result = await register.dispatchWithResult<'run', string>('run', { id: 'protected' });
    expect(result.outcome).toBe('failed');
    expect(resultHandler).not.toHaveBeenCalled();
    expect(result.errors).toHaveLength(1);
    register.destroy();
  });

  it('includes guard outcomes in final execution metrics', async () => {
    const register = new ActionRegister<MetricsActions>();
    register.registerGuard('run', () => {});
    register.register<'run', string>('run', () => 'ok');

    const result = await register.dispatchWithResult<'run', string>('run', { id: 'metrics' });
    expect(result.handlers).toHaveLength(2);
    expect(result.execution.handlersExecuted).toBe(2);
    register.destroy();
  });

  it('does not let an observer configuration alter dispatch admission', async () => {
    const register = new ActionRegister<MetricsActions>();
    register.register<'run', string>('run', () => 'ok');
    register.registerObserver('run', () => {}, { debounce: 50 } as never);

    const debounce = jest.spyOn((register as any).actionGuard, 'debounce');
    await register.dispatchWithResult<'run', string>('run', { id: 'admission' });
    expect(debounce).not.toHaveBeenCalled();
    register.destroy();
  });

  it('does not allow dispatch filters to bypass guards', async () => {
    const register = new ActionRegister<MetricsActions>();
    const resultHandler = jest.fn(() => 'sensitive');
    register.registerGuard('run', (_payload, controller) => controller.abort('denied'), {
      id: 'authorization',
    });
    register.register('run', resultHandler, { id: 'mutation' });

    const result = await register.dispatchWithResult<'run', string>('run', { id: 'filtered' }, {
      filter: { handlerIds: ['mutation'] },
    });
    expect(result.outcome).toBe('cancelled');
    expect(resultHandler).not.toHaveBeenCalled();
    expect(result.handlers.find(handler => handler.id === 'authorization')?.executed).toBe(true);
    register.destroy();
  });

  it('rejects cross-role replacement of an authorization guard', () => {
    const register = new ActionRegister<MetricsActions>();
    register.registerGuard('run', () => {}, { id: 'access-control' });

    expect(() => register.registerObserver('run', () => {}, {
      id: 'access-control',
    })).toThrow('role conflict');
    expect(() => register.register<'run', string>('run', () => 'unsafe', {
      id: 'access-control',
    })).toThrow('role conflict');
    register.destroy();
  });

  it('claims once guards before concurrent dispatches can invoke them', async () => {
    const register = new ActionRegister<MetricsActions>();
    let releaseGuard: (() => void) | undefined;
    const guardGate = new Promise<void>(resolve => { releaseGuard = resolve; });
    const guard = jest.fn(async () => { await guardGate; });
    register.registerGuard('run', guard, { once: true });
    register.register<'run', string>('run', () => 'ok');

    const first = register.dispatchWithResult<'run', string>('run', { id: 'first' });
    await Promise.resolve();
    const second = register.dispatchWithResult<'run', string>('run', { id: 'second' });
    await second;
    expect(guard).toHaveBeenCalledTimes(1);
    releaseGuard?.();
    await first;
    register.destroy();
  });

  it('claims once result handlers before concurrent dispatches can invoke them', async () => {
    const register = new ActionRegister<MetricsActions>();
    let releaseHandler: (() => void) | undefined;
    const handlerGate = new Promise<void>(resolve => { releaseHandler = resolve; });
    const handler = jest.fn(async () => {
      await handlerGate;
      return 'once';
    });
    register.register<'run', string>('run', handler, { once: true });

    const first = register.dispatchWithResult<'run', string>('run', { id: 'first' });
    await Promise.resolve();
    const second = register.dispatchWithResult<'run', string>('run', { id: 'second' });
    await second;
    expect(handler).toHaveBeenCalledTimes(1);
    releaseHandler?.();
    await first;
    register.destroy();
  });

  it('gives void-dispatch observers the aggregated handler result', async () => {
    const register = new ActionRegister<MetricsActions>();
    const observer = jest.fn();
    register.register<'run', { accepted: boolean }>('run', () => ({ accepted: true }));
    register.registerObserver('run', observer);

    await register.dispatch('run', { id: 'void-observer' });
    expect(observer).toHaveBeenCalledWith(expect.objectContaining({
      result: { accepted: true },
      outcome: 'completed',
    }));
    register.destroy();
  });

  it('rejects void dispatch when a guard throws but resolves explicit aborts', async () => {
    const register = new ActionRegister<MetricsActions>();
    register.registerGuard('run', () => { throw new Error('authorization unavailable'); });

    await expect(register.dispatch('run', { id: 'guard-error' }))
      .rejects.toThrow('authorization unavailable');
    register.destroy();
  });

  it('isolates observer condition errors and preserves the canonical result', async () => {
    const register = new ActionRegister<MetricsActions>();
    register.register<'run', { accepted: boolean }>('run', () => ({ accepted: true }));
    register.registerObserver('run', () => {
      throw new Error('must not run');
    }, { condition: () => { throw new Error('condition failed'); } });

    await expect(register.dispatchWithResult<'run', { accepted: boolean }>('run', { id: 'condition' }))
      .resolves.toMatchObject({ result: { accepted: true } });
    register.destroy();
  });

  it.each(['dispatch', 'dispatchWithResult'] as const)(
    '%s evaluates observer conditions after awaited higher-priority observers',
    async dispatchKind => {
      const register = new ActionRegister<MetricsActions>();
      let enabled = false;
      const observed: string[] = [];

      register.register<'run', string>('run', () => 'committed');
      register.registerObserver<'run', string>('run', () => {
        observed.push('higher');
        enabled = true;
      }, { id: 'higher', priority: 10 });
      register.registerObserver<'run', string>('run', () => {
        observed.push('lower');
      }, { id: 'lower', condition: () => enabled });

      if (dispatchKind === 'dispatch') {
        await register.dispatch('run', { id: dispatchKind });
      } else {
        await register.dispatchWithResult<'run', string>('run', { id: dispatchKind });
      }

      expect(observed).toEqual(['higher', 'lower']);
      register.destroy();
    },
  );

  it('does not let an observer snapshot failure reject the canonical result', async () => {
    const register = new ActionRegister<MetricsActions>();
    const resultValue = new Proxy({}, {
      getPrototypeOf: () => { throw new Error('snapshot denied'); },
    });
    register.register('run', () => resultValue);
    register.registerObserver('run', () => {});

    const result = await register.dispatchWithResult<'run', object>('run', { id: 'proxy-result' });
    expect(result.result).toBe(resultValue);
    expect(result.outcome).toBe('completed');
    register.destroy();
  });

  it('preserves an existing observer for a duplicate id with replaceExisting false', async () => {
    const register = new ActionRegister<MetricsActions>();
    const original = jest.fn();
    const replacement = jest.fn();
    register.register<'run', string>('run', () => 'ok');
    register.registerObserver('run', original, { id: 'audit' });
    const ignoredUnregister = register.registerObserver('run', replacement, { id: 'audit', replaceExisting: false });
    ignoredUnregister();

    await register.dispatchWithResult('run', { id: 'duplicate' });
    expect(original).toHaveBeenCalledTimes(1);
    expect(replacement).not.toHaveBeenCalled();
    register.destroy();
  });

  it('prepares guard payload once and reuses it across retries', async () => {
    const register = new ActionRegister<MetricsActions>();
    let guardRuns = 0;
    let resultRuns = 0;
    register.registerGuard('run', (_payload, controller) => {
      guardRuns += 1;
      controller.modifyPayload(payload => ({ id: `prepared:${payload.id}` }));
    });
    register.register<'run', string>('run', payload => {
      resultRuns += 1;
      if (resultRuns === 1) throw new Error('retry');
      return payload.id;
    }, { errorPolicy: 'fatal' });

    await expect(register.dispatchWithResult<'run', string>('run', { id: 'source' }, {
      retryOnError: { maxAttempts: 2, delay: 0 },
    })).resolves.toMatchObject({ result: 'prepared:source' });
    expect(guardRuns).toBe(1);
    register.destroy();
  });

  it('runs observers after aggregation without letting them affect a race winner', async () => {
    const register = new ActionRegister<MetricsActions>();
    register.setActionExecutionMode('run', 'race');
    register.register<'run', string>('run', () => 'winner', { id: 'winner' });
    const observer = jest.fn(event => {
      expect(event.result).toBe('winner');
      expect(event.outcome).toBe('completed');
    });
    register.registerObserver('run', observer, { id: 'audit' });

    const result = await register.dispatchWithResult<'run', string>('run', { id: 'observed' });
    expect(result.result).toBe('winner');
    expect(result.handlers.find(handler => handler.id === 'audit')).toBeUndefined();
    expect(observer).toHaveBeenCalledTimes(1);
    register.destroy();
  });

  it('keeps awaited observers inside timeout and async shutdown ownership', async () => {
    const register = new ActionRegister<MetricsActions>();
    let releaseObserver: (() => void) | undefined;
    const observerGate = new Promise<void>(resolve => { releaseObserver = resolve; });
    register.register<'run', string>('run', () => 'committed');
    register.registerObserver('run', async () => { await observerGate; });

    await expect(register.dispatchWithResult<'run', string>('run', { id: 'timeout' }, {
      timeout: 10,
    })).rejects.toMatchObject({ name: 'ActionTimeoutError' });

    let shutdownComplete = false;
    const shutdown = register.destroyAsync().then(() => { shutdownComplete = true; });
    await Promise.resolve();
    expect(shutdownComplete).toBe(false);
    releaseObserver?.();
    await expect(shutdown).resolves.toBeUndefined();
  });

  it('reports an awaited observer timeout to the global error handler', async () => {
    const errorHandler = jest.fn();
    const register = new ActionRegister<MetricsActions>({ registry: { errorHandler } });
    let releaseObserver: (() => void) | undefined;
    const observerGate = new Promise<void>(resolve => { releaseObserver = resolve; });
    register.register<'run', string>('run', () => 'committed');
    register.registerObserver('run', async () => { await observerGate; });

    await expect(register.dispatchWithResult<'run', string>('run', { id: 'observer-timeout' }, {
      timeout: 10,
    })).rejects.toMatchObject({ name: 'ActionTimeoutError' });
    expect(errorHandler).toHaveBeenCalledWith(expect.objectContaining({
      name: 'ActionTimeoutError',
    }), expect.any(Object));
    releaseObserver?.();
    await register.destroyAsync();
  });

  it.each([
    ['dispatch', 'success'],
    ['dispatch', 'always'],
    ['dispatchWithResult', 'success'],
    ['dispatchWithResult', 'always'],
  ] as const)(
    '%s reports a timeout from an awaited %s observer to failure observers once',
    async (dispatchKind, blockerWhen) => {
      const register = new ActionRegister<MetricsActions>();
      let releaseObserver: (() => void) | undefined;
      let markObserverStarted: (() => void) | undefined;
      const observerGate = new Promise<void>(resolve => { releaseObserver = resolve; });
      const observerStarted = new Promise<void>(resolve => { markObserverStarted = resolve; });
      const completedEvents: ActionObserverEvent<MetricsActions['run'], string>[] = [];
      const failureEvents: ActionObserverEvent<MetricsActions['run'], string>[] = [];

      register.register<'run', string>('run', () => 'committed');
      register.registerObserver<'run', string>('run', async event => {
        completedEvents.push(event);
        markObserverStarted?.();
        await observerGate;
      }, { id: 'blocking-observer', priority: 10, when: blockerWhen });
      register.registerObserver<'run', string>('run', event => {
        failureEvents.push(event);
      }, { id: 'failure-observer', when: 'failure' });

      const execution = dispatchKind === 'dispatch'
        ? register.dispatch('run', { id: `${dispatchKind}-${blockerWhen}` }, { timeout: 10 })
        : register.dispatchWithResult<'run', string>(
            'run',
            { id: `${dispatchKind}-${blockerWhen}` },
            { timeout: 10 },
          );

      await observerStarted;
      await expect(execution).rejects.toBeInstanceOf(ActionTimeoutError);
      expect(completedEvents).toHaveLength(1);
      expect(completedEvents[0]?.outcome).toBe('completed');
      expect(failureEvents).toHaveLength(1);
      expect(failureEvents[0]?.outcome).toBe('failed');
      expect(failureEvents[0]?.errors).toHaveLength(1);
      expect(failureEvents[0]?.errors[0]?.error).toBeInstanceOf(ActionTimeoutError);

      releaseObserver?.();
      await register.destroyAsync();
      expect(completedEvents).toHaveLength(1);
      expect(failureEvents).toHaveLength(1);
    },
  );

  it.each(['dispatch', 'dispatchWithResult'] as const)(
    '%s settles its timeout while a pending failure observer remains shutdown-owned',
    async dispatchKind => {
      jest.useFakeTimers();
      const register = new ActionRegister<MetricsActions>();
      let releaseCompletedObserver: (() => void) | undefined;
      let releaseFailureObserver: (() => void) | undefined;
      let markCompletedObserverStarted: (() => void) | undefined;
      let markFailureObserverStarted: (() => void) | undefined;
      const completedObserverGate = new Promise<void>(resolve => {
        releaseCompletedObserver = resolve;
      });
      const failureObserverGate = new Promise<void>(resolve => {
        releaseFailureObserver = resolve;
      });
      const completedObserverStarted = new Promise<void>(resolve => {
        markCompletedObserverStarted = resolve;
      });
      const failureObserverStarted = new Promise<void>(resolve => {
        markFailureObserverStarted = resolve;
      });
      const failureEvents: ActionObserverEvent<MetricsActions['run'], string>[] = [];

      register.register<'run', string>('run', () => 'committed');
      register.registerObserver<'run', string>('run', async () => {
        markCompletedObserverStarted?.();
        await completedObserverGate;
      }, { id: 'completed-observer', when: 'success', priority: 10 });
      register.registerObserver<'run', string>('run', async event => {
        failureEvents.push(event);
        markFailureObserverStarted?.();
        // Intentionally ignore the aborted signal until the test releases us.
        await failureObserverGate;
      }, { id: 'failure-observer', when: 'failure' });

      try {
        const execution = dispatchKind === 'dispatch'
          ? register.dispatch('run', { id: dispatchKind }, { timeout: 10 })
          : register.dispatchWithResult<'run', string>(
              'run',
              { id: dispatchKind },
              { timeout: 10 },
            );
        let callerSettled = false;
        let callerError: unknown;
        void execution.then(
          () => { callerSettled = true; },
          error => {
            callerSettled = true;
            callerError = error;
          },
        );

        await completedObserverStarted;
        await jest.advanceTimersByTimeAsync(10);
        await failureObserverStarted;
        await Promise.resolve();

        expect(callerSettled).toBe(true);
        expect(callerError).toBeInstanceOf(ActionTimeoutError);
        expect(failureEvents).toHaveLength(1);
        expect(failureEvents[0]?.outcome).toBe('failed');

        let shutdownSettled = false;
        const shutdown = register.destroyAsync().then(() => {
          shutdownSettled = true;
        });
        await Promise.resolve();
        expect(shutdownSettled).toBe(false);

        releaseCompletedObserver?.();
        await Promise.resolve();
        expect(shutdownSettled).toBe(false);

        releaseFailureObserver?.();
        await shutdown;
        expect(shutdownSettled).toBe(true);
        expect(failureEvents).toHaveLength(1);
      } finally {
        releaseCompletedObserver?.();
        releaseFailureObserver?.();
        await register.destroyAsync();
        jest.clearAllTimers();
        jest.useRealTimers();
      }
    },
  );

  it.each([
    ['higher', 10],
    ['lower', -10],
  ] as const)(
    'delivers the canonical completed event to an %s-priority always observer after timeout',
    async (_priorityPosition, alwaysPriority) => {
      jest.useFakeTimers();
      const register = new ActionRegister<MetricsActions>();
      let releaseCompletedObserver: (() => void) | undefined;
      let markCompletedObserverStarted: (() => void) | undefined;
      let markAlwaysObserved: (() => void) | undefined;
      let markFailureObserved: (() => void) | undefined;
      const completedObserverGate = new Promise<void>(resolve => {
        releaseCompletedObserver = resolve;
      });
      const completedObserverStarted = new Promise<void>(resolve => {
        markCompletedObserverStarted = resolve;
      });
      const alwaysObserved = new Promise<void>(resolve => {
        markAlwaysObserved = resolve;
      });
      const failureObserved = new Promise<void>(resolve => {
        markFailureObserved = resolve;
      });
      const alwaysEvents: ActionObserverEvent<MetricsActions['run'], string>[] = [];
      const failureEvents: ActionObserverEvent<MetricsActions['run'], string>[] = [];

      register.register<'run', string>('run', () => 'committed');
      register.registerObserver<'run', string>('run', async () => {
        markCompletedObserverStarted?.();
        await completedObserverGate;
      }, { id: 'completed-observer', when: 'success', priority: 0 });
      register.registerObserver<'run', string>('run', event => {
        alwaysEvents.push(event);
        markAlwaysObserved?.();
      }, { id: 'always-observer', when: 'always', priority: alwaysPriority });
      register.registerObserver<'run', string>('run', event => {
        failureEvents.push(event);
        markFailureObserved?.();
      }, { id: 'failure-observer', when: 'failure', priority: -20 });

      try {
        const execution = register.dispatchWithResult<'run', string>(
          'run',
          { id: `always-${alwaysPriority}` },
          { timeout: 10 },
        );
        let callerError: unknown;
        void execution.catch(error => { callerError = error; });

        await completedObserverStarted;
        await jest.advanceTimersByTimeAsync(10);
        await failureObserved;
        await Promise.resolve();

        expect(callerError).toBeInstanceOf(ActionTimeoutError);
        expect(failureEvents).toHaveLength(1);
        expect(failureEvents[0]?.outcome).toBe('failed');
        expect(alwaysEvents).toHaveLength(alwaysPriority > 0 ? 1 : 0);

        releaseCompletedObserver?.();
        await alwaysObserved;
        expect(alwaysEvents).toHaveLength(1);
        expect(alwaysEvents[0]?.outcome).toBe('completed');

        await register.destroyAsync();
        expect(failureEvents).toHaveLength(1);
      } finally {
        releaseCompletedObserver?.();
        await register.destroyAsync();
        jest.clearAllTimers();
        jest.useRealTimers();
      }
    },
  );

  it.each(['dispatch', 'dispatchWithResult'] as const)(
    '%s reserves a conditional always observer to the canonical event across timeout',
    async dispatchKind => {
      jest.useFakeTimers();
      const register = new ActionRegister<MetricsActions>();
      let enabled = false;
      let releaseCompletedObserver: (() => void) | undefined;
      let markCompletedObserverStarted: (() => void) | undefined;
      let markAlwaysObserved: (() => void) | undefined;
      const completedObserverGate = new Promise<void>(resolve => {
        releaseCompletedObserver = resolve;
      });
      const completedObserverStarted = new Promise<void>(resolve => {
        markCompletedObserverStarted = resolve;
      });
      const alwaysObserved = new Promise<void>(resolve => {
        markAlwaysObserved = resolve;
      });
      const alwaysEvents: ActionObserverEvent<MetricsActions['run'], string>[] = [];

      register.register<'run', string>('run', () => 'committed');
      register.registerObserver<'run', string>('run', async () => {
        markCompletedObserverStarted?.();
        await completedObserverGate;
      }, { id: 'completed-observer', when: 'success', priority: 10 });
      register.registerObserver<'run', string>('run', event => {
        alwaysEvents.push(event);
        markAlwaysObserved?.();
      }, {
        id: 'conditional-always-observer',
        when: 'always',
        condition: () => enabled,
      });

      try {
        const execution = dispatchKind === 'dispatch'
          ? register.dispatch('run', { id: dispatchKind }, { timeout: 10 })
          : register.dispatchWithResult<'run', string>(
              'run',
              { id: dispatchKind },
              { timeout: 10 },
            );
        const timeoutRejection = expect(execution).rejects.toBeInstanceOf(ActionTimeoutError);

        await completedObserverStarted;
        enabled = true;
        await jest.advanceTimersByTimeAsync(10);
        await timeoutRejection;
        await Promise.resolve();

        expect(alwaysEvents).toHaveLength(0);

        releaseCompletedObserver?.();
        await alwaysObserved;
        expect(alwaysEvents).toHaveLength(1);
        expect(alwaysEvents[0]?.outcome).toBe('completed');
      } finally {
        releaseCompletedObserver?.();
        await register.destroyAsync();
        jest.clearAllTimers();
        jest.useRealTimers();
      }
    },
  );

  it('keeps cancelled preflight metrics aligned with skipped handler outcomes', async () => {
    const controller = new AbortController();
    controller.abort();
    const register = new ActionRegister<MetricsActions>();
    register.registerGuard('run', () => {}, { id: 'guard' });
    register.register<'run', string>('run', () => 'never', { id: 'result' });
    register.registerObserver('run', () => {}, { id: 'observer' });

    const result = await register.dispatchWithResult<'run', string>('run', { id: 'cancelled' }, {
      signal: controller.signal,
    });
    expect(result.execution.handlersSkipped).toBe(result.handlers.length);
    expect(result.handlers.map(handler => handler.id).sort()).toEqual(['guard', 'result']);
    expect(result.handlers.every(handler => handler.status === 'skipped')).toBe(true);
    register.destroy();
  });

  it('notifies failure observers when a void dispatch is rejected by a guard', async () => {
    const register = new ActionRegister<MetricsActions>();
    const observer = jest.fn();
    register.registerGuard('run', (_payload, controller) => {
      controller.abort('not authorized');
    });
    register.registerObserver('run', observer, { when: 'failure' });

    await expect(register.dispatch('run', { id: 'guarded-void' })).resolves.toBeUndefined();
    expect(observer).toHaveBeenCalledWith(expect.objectContaining({
      outcome: 'cancelled',
      payload: { id: 'guarded-void' },
    }));
    register.destroy();
  });

  it('runs a once observer only once across concurrent detached dispatches', async () => {
    const register = new ActionRegister<MetricsActions>();
    let releaseObserver: (() => void) | undefined;
    const observerGate = new Promise<void>(resolve => { releaseObserver = resolve; });
    const observer = jest.fn(async () => { await observerGate; });
    register.register('run', () => 'committed');
    register.registerObserver('run', observer, { once: true, scheduling: 'start-and-continue' });

    await Promise.all([
      register.dispatch('run', { id: 'first' }),
      register.dispatch('run', { id: 'second' }),
    ]);
    expect(observer).toHaveBeenCalledTimes(1);
    releaseObserver?.();
    await register.destroyAsync();
  });

  it('runs a once awaited observer only once while its first dispatch is pending', async () => {
    const register = new ActionRegister<MetricsActions>();
    let releaseObserver: (() => void) | undefined;
    const observerGate = new Promise<void>(resolve => { releaseObserver = resolve; });
    const observer = jest.fn(async () => { await observerGate; });
    register.register('run', () => 'committed');
    register.registerObserver('run', observer, { once: true });

    const first = register.dispatch('run', { id: 'first' });
    await Promise.resolve();
    const second = register.dispatch('run', { id: 'second' });
    await second;
    expect(observer).toHaveBeenCalledTimes(1);
    releaseObserver?.();
    await first;
    register.destroy();
  });

  it('does not let a fatal race effect failure be ignored by result arbitration', async () => {
    const register = new ActionRegister<MetricsActions>();
    register.setActionExecutionMode('run', 'race');
    const resultHandler = jest.fn(() => 'sensitive');
    register.registerEffect('run', () => {
      throw new Error('audit gate failed');
    }, { id: 'effect-gate', errorPolicy: 'fatal', effectKind: 'guard' });
    register.register('run', resultHandler, { id: 'result' });

    const result = await register.dispatchWithResult<'run', string>('run', { id: 'effect-failed' });
    expect(result.outcome).toBe('failed');
    expect(resultHandler).not.toHaveBeenCalled();
    expect(result.errors[result.errors.length - 1]?.error.message).toBe('audit gate failed');
    register.destroy();
  });

  it('keeps race loser failures in diagnostics, not the winner result contract', async () => {
    const register = new ActionRegister<MetricsActions>();
    register.setActionExecutionMode('run', 'race');
    register.register('run', () => 'winner', { id: 'winner' });
    register.register('run', () => { throw new Error('loser failed'); }, {
      id: 'loser', errorPolicy: 'collect',
    });

    const result = await register.dispatchWithResult<'run', string>('run', { id: 'diagnostics' });
    expect(result.success).toBe(true);
    expect(result.execution.handlersFailed).toBe(0);
    expect(result.raceDiagnostics?.winnerId).toBe('winner');
    expect(result.raceDiagnostics?.loserSnapshots).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'loser', status: 'failed' }),
    ]));
    register.destroy();
  });

  it('drains race losers before starting a whole-action retry', async () => {
    const register = new ActionRegister<MetricsActions>();
    register.setActionExecutionMode('run', 'race');
    let fastAttempts = 0;
    let releaseLoser: (() => void) | undefined;
    const loserGate = new Promise<void>(resolve => { releaseLoser = resolve; });
    register.register('run', async () => {
      fastAttempts += 1;
      if (fastAttempts === 1) throw new Error('first provider failed');
      return 'recovered';
    }, { id: 'fast', errorPolicy: 'fatal' });
    register.register('run', async () => {
      await loserGate;
      return 'slow';
    }, { id: 'slow' });

    const execution = register.dispatchWithResult<'run', string>('run', { id: 'retry' }, {
      retryOnError: { maxAttempts: 2, delay: 0 },
    });
    await Promise.resolve();
    await Promise.resolve();
    expect(fastAttempts).toBe(1);
    releaseLoser?.();
    await expect(execution).resolves.toMatchObject({ result: 'recovered' });
    expect(fastAttempts).toBe(2);
    register.destroy();
  });

  it('starts a retry without draining losers when abort-and-overlap is selected', async () => {
    const register = new ActionRegister<MetricsActions>();
    register.setActionExecutionMode('run', 'race');
    let attempts = 0;
    let releaseLoser: (() => void) | undefined;
    const loserGate = new Promise<void>(resolve => { releaseLoser = resolve; });
    register.register<'run', string>('run', () => {
      attempts += 1;
      if (attempts === 1) throw new Error('retry');
      return 'recovered';
    }, { id: 'fast', errorPolicy: 'fatal' });
    register.register('run', async () => {
      await loserGate;
      return 'slow';
    }, { id: 'slow' });

    const execution = register.dispatchWithResult<'run', string>('run', { id: 'overlap' }, {
      retryOnError: { maxAttempts: 2, delay: 0, attemptBarrier: 'abort-and-overlap' },
    });
    await new Promise<void>(resolve => setTimeout(resolve, 0));
    expect(attempts).toBe(2);
    releaseLoser?.();
    await expect(execution).resolves.toMatchObject({ result: 'recovered' });
    await register.destroyAsync();
  });

  it('aborts the prior race attempt before its retry barrier drains', async () => {
    const register = new ActionRegister<MetricsActions>();
    register.setActionExecutionMode('run', 'race');
    let attempts = 0;
    let loserAborted = false;
    register.register<'run', string>('run', () => {
      attempts += 1;
      if (attempts === 1) throw new Error('retry');
      return 'recovered';
    }, { id: 'fast', errorPolicy: 'fatal' });
    register.register('run', (_payload, controller) => new Promise<void>(resolve => {
      controller.signal?.addEventListener('abort', () => {
        loserAborted = true;
        resolve();
      }, { once: true });
    }), { id: 'loser' });

    await expect(register.dispatchWithResult<'run', string>('run', { id: 'abort-attempt' }, {
      retryOnError: { maxAttempts: 2, delay: 0 },
    })).resolves.toMatchObject({ result: 'recovered' });
    expect(loserAborted).toBe(true);
    register.destroy();
  });

  it('does not create an extra retry attempt when cancellation interrupts backoff', async () => {
    const register = new ActionRegister<MetricsActions>();
    const controller = new AbortController();
    const handler = jest.fn(() => { throw new Error('retry me'); });
    register.register('run', handler, { errorPolicy: 'fatal' });

    const execution = register.dispatchWithResult('run', { id: 'abort-backoff' }, {
      signal: controller.signal,
      retryOnError: { maxAttempts: 3, delay: 10_000 },
    });
    await Promise.resolve();
    controller.abort('cancel retry');
    await expect(execution).resolves.toMatchObject({ outcome: 'cancelled', aborted: true });
    expect(handler).toHaveBeenCalledTimes(1);
    register.destroy();
  });

  it('resolves void dispatch when cancellation interrupts retry backoff', async () => {
    const register = new ActionRegister<MetricsActions>();
    const controller = new AbortController();
    let markAttemptSuperseded: (() => void) | undefined;
    const attemptSuperseded = new Promise<void>(resolve => { markAttemptSuperseded = resolve; });
    const handler = jest.fn((_payload: MetricsActions['run'], pipelineController: {
      signal?: AbortSignal;
    }) => {
      pipelineController.signal?.addEventListener('abort', () => markAttemptSuperseded?.(), {
        once: true,
      });
      throw new Error('retry me');
    });
    register.register('run', handler, { errorPolicy: 'fatal' });

    const execution = register.dispatch('run', { id: 'abort-void-backoff' }, {
      signal: controller.signal,
      retryOnError: { maxAttempts: 3, delay: 10_000 },
    });
    await attemptSuperseded;
    controller.abort('cancel retry');

    await expect(execution).resolves.toBeUndefined();
    expect(handler).toHaveBeenCalledTimes(1);
    register.destroy();
  });

  it.each(['dispatch', 'dispatchWithResult'] as const)(
    '%s reports timeout rather than cancellation when timeout interrupts retry backoff',
    async dispatchKind => {
      jest.useFakeTimers();
      const register = new ActionRegister<MetricsActions>();
      let markAttemptSuperseded: (() => void) | undefined;
      const attemptSuperseded = new Promise<void>(resolve => {
        markAttemptSuperseded = resolve;
      });
      const failureEvents: ActionObserverEvent<MetricsActions['run'], string>[] = [];
      const alwaysEvents: ActionObserverEvent<MetricsActions['run'], string>[] = [];

      register.register('run', (_payload, pipelineController) => {
        pipelineController.signal?.addEventListener('abort', () => {
          markAttemptSuperseded?.();
        }, { once: true });
        throw new Error('retry me');
      }, { errorPolicy: 'fatal' });
      register.registerObserver<'run', string>('run', event => {
        failureEvents.push(event);
      }, { id: 'failure-observer', when: 'failure' });
      register.registerObserver<'run', string>('run', event => {
        alwaysEvents.push(event);
      }, { id: 'always-observer', when: 'always' });

      try {
        const execution = dispatchKind === 'dispatch'
          ? register.dispatch('run', { id: dispatchKind }, {
              timeout: 10,
              retryOnError: { maxAttempts: 3, delay: 10_000 },
            })
          : register.dispatchWithResult<'run', string>('run', { id: dispatchKind }, {
              timeout: 10,
              retryOnError: { maxAttempts: 3, delay: 10_000 },
            });
        const timeoutRejection = expect(execution).rejects.toBeInstanceOf(ActionTimeoutError);

        await attemptSuperseded;
        await jest.advanceTimersByTimeAsync(10);
        await timeoutRejection;
        await Promise.resolve();

        expect(failureEvents).toHaveLength(1);
        expect(failureEvents[0]?.outcome).toBe('failed');
        expect(failureEvents[0]?.errors[0]?.error).toBeInstanceOf(ActionTimeoutError);
        expect(alwaysEvents).toHaveLength(1);
        expect(alwaysEvents[0]?.outcome).toBe('failed');
        expect(alwaysEvents[0]?.errors[0]?.error).toBeInstanceOf(ActionTimeoutError);
      } finally {
        await register.destroyAsync();
        jest.clearAllTimers();
        jest.useRealTimers();
      }
    },
  );
});
