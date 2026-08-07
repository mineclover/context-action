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
});
