import { ActionRegister, type ActionPayloadMap, type ActionDispatchTrace } from '../../src/index';

interface Actions extends ActionPayloadMap {
  save: { id: string };
}

describe('dispatch trace contract', () => {
  it('emits one started and one settled event with metadata', async () => {
    const register = new ActionRegister<Actions>({ name: 'TraceTest' });
    register.register('save', () => undefined);
    const events: ActionDispatchTrace[] = [];
    const unsubscribe = register.subscribeDispatchTrace(event => events.push(event));

    await register.dispatch('save', { id: 'a' }, {
      trace: { transactionId: 'tx-1', origin: 'user', label: 'Save' },
    });

    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({
      phase: 'started', action: 'save', transactionId: 'tx-1', origin: 'user', label: 'Save',
    });
    expect(events[1]).toMatchObject({
      phase: 'settled', status: 'completed', action: 'save', transactionId: 'tx-1',
    });
    expect(events[0]?.dispatchId).toBe(events[1]?.dispatchId);
    expect(events[1]?.endedAt).toBeGreaterThanOrEqual(events[1]?.startedAt ?? 0);
    unsubscribe();
    await register.destroyAsync();
  });

  it('marks rejected dispatches as failed and isolates listener errors', async () => {
    const register = new ActionRegister<Actions>({ name: 'TraceFailureTest' });
    register.registerGuard('save', () => { throw new Error('invalid'); });
    const events: ActionDispatchTrace[] = [];
    register.subscribeDispatchTrace(event => events.push(event));
    register.subscribeDispatchTrace(() => { throw new Error('trace listener'); });

    await expect(register.dispatch('save', { id: 'bad' })).rejects.toThrow('invalid');
    expect(events[events.length - 1]).toMatchObject({ phase: 'settled', status: 'failed' });
    await register.destroyAsync();
  });

  it('marks explicit guard cancellation separately from failure', async () => {
    const register = new ActionRegister<Actions>({ name: 'TraceCancelTest' });
    register.registerGuard('save', (_payload, controller) => controller.abort('cancelled'));
    const events: ActionDispatchTrace[] = [];
    register.subscribeDispatchTrace(event => events.push(event));
    await register.dispatch('save', { id: 'cancel' });
    expect(events[events.length - 1]).toMatchObject({ phase: 'settled', status: 'cancelled' });
    await register.destroyAsync();
  });

  it('preserves timing and partial-success outcomes for result traces', async () => {
    const register = new ActionRegister<Actions>({ name: 'TraceOutcomeTest' });
    register.register('save', () => new Promise<void>(resolve => setTimeout(resolve, 20)));
    const events: ActionDispatchTrace[] = [];
    register.subscribeDispatchTrace(event => events.push(event));

    const first = register.dispatchWithResult('save', { id: 'first' }, { debounce: 100 });
    const second = register.dispatchWithResult('save', { id: 'second' }, { debounce: 100 });
    const [firstResult, secondResult] = await Promise.all([first, second]);
    const settledStatuses = events
      .filter(event => event.phase === 'settled')
      .map(event => event.status);

    expect([firstResult.outcome, secondResult.outcome]).toEqual(['debounced', 'completed']);
    expect(settledStatuses).toEqual(['debounced', 'completed']);
    await register.destroyAsync();
  });

  it('preserves completed_with_errors for void and result traces', async () => {
    const register = new ActionRegister<Actions>({ name: 'TracePartialTest' });
    register.register('save', () => {
      throw new Error('best effort failure');
    }, { blocking: false });
    const events: ActionDispatchTrace[] = [];
    register.subscribeDispatchTrace(event => events.push(event));

    await register.dispatch('save', { id: 'void' });
    const result = await register.dispatchWithResult('save', { id: 'result' });

    expect(result.outcome).toBe('completed_with_errors');
    expect(events.filter(event => event.phase === 'settled').map(event => event.status))
      .toEqual(['completed_with_errors', 'completed_with_errors']);
    await register.destroyAsync();
  });
});
