import { ActionRegister, type ActionPayloadMap } from '../../src';

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
    }, { id: 'authorization', errorPolicy: 'fatal', priority: 100 });
    register.register('run', resultHandler, { id: 'result' });

    const result = await register.dispatchWithResult<'run', string>('run', { id: 'guarded' });
    expect(result.aborted).toBe(true);
    expect(result.result).toBeUndefined();
    expect(resultHandler).not.toHaveBeenCalled();
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
    await execution;
    expect(handler).toHaveBeenCalledTimes(1);
    register.destroy();
  });
});
