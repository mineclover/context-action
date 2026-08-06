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
});
