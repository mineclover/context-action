import { ActionRegister } from '../../src';

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>(release => { resolve = release; });
  return { promise, resolve };
}

describe('once registration execution contract', () => {
  let register: ActionRegister<{ run: void }>;

  beforeEach(() => {
    register = new ActionRegister({ registry: { autoCleanup: false } });
  });

  afterEach(() => {
    register.destroy();
  });

  it.each([
    ['dispatch', 'parallel'],
    ['dispatch', 'race'],
    ['dispatchWithResult', 'parallel'],
    ['dispatchWithResult', 'race'],
  ] as const)('%s in %s mode does not consume once handlers when a precondition throws', async (method, executionMode) => {
    const handler = jest.fn(() => 'once');
    const cleanup = jest.fn();
    const failure = new Error('precondition failed');
    let rejectAdmission = true;
    register.register('run', handler, { id: 'once', priority: 10, once: true, cleanup });
    register.register('run', () => 'regular', {
      id: 'conditional',
      condition: () => {
        if (rejectAdmission) throw failure;
        return true;
      },
    });

    if (method === 'dispatch') {
      await expect(register.dispatch('run', undefined, { executionMode })).rejects.toBe(failure);
    } else {
      const result = await register.dispatchWithResult('run', undefined, { executionMode });
      expect(result.outcome).toBe('failed');
      expect(result.execution.handlersExecuted).toBe(0);
    }
    expect(handler).not.toHaveBeenCalled();
    expect(cleanup).not.toHaveBeenCalled();
    expect(register.getHandlerCount('run')).toBe(2);

    rejectAdmission = false;
    const dispatch = () => method === 'dispatch'
      ? register.dispatch('run', undefined, { executionMode })
      : register.dispatchWithResult('run', undefined, { executionMode });
    await dispatch();
    await dispatch();
    await register.destroyAsync();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['dispatch', 'parallel'],
    ['dispatch', 'race'],
    ['dispatchWithResult', 'parallel'],
    ['dispatchWithResult', 'race'],
  ] as const)('%s in %s mode retains a once handler for a successful retry', async (method, executionMode) => {
    const handler = jest.fn(() => 'once');
    const cleanup = jest.fn();
    let attempts = 0;
    register.register('run', handler, { priority: 10, once: true, cleanup });
    register.register('run', jest.fn(), {
      condition: () => {
        attempts += 1;
        if (attempts === 1) throw new Error('retryable precondition');
        return false;
      },
    });
    const options = { executionMode, retryOnError: { maxAttempts: 2, delay: 0 } };
    if (method === 'dispatch') {
      await expect(register.dispatch('run', undefined, options)).resolves.toBeUndefined();
    } else {
      const result = await register.dispatchWithResult('run', undefined, options);
      expect(result.outcome).toBe('completed');
      expect(result.execution.handlersExecuted).toBe(1);
    }
    await register.destroyAsync();
    expect(attempts).toBe(2);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['dispatch', 'await-before-next'],
    ['dispatch', 'start-and-continue'],
    ['dispatchWithResult', 'await-before-next'],
    ['dispatchWithResult', 'start-and-continue'],
  ] as const)('%s invokes a %s once observer once even behind an awaited observer', async (method, scheduling) => {
    const bothStarted = deferred();
    const release = deferred();
    const observer = jest.fn();
    const cleanup = jest.fn();
    let started = 0;
    register.registerObserver('run', async () => {
      started += 1;
      if (started === 2) bothStarted.resolve();
      await release.promise;
    }, { priority: 10 });
    register.registerObserver('run', observer, { once: true, scheduling, cleanup });

    const dispatch = () => method === 'dispatch'
      ? register.dispatch('run')
      : register.dispatchWithResult('run');
    const first = dispatch();
    const second = dispatch();
    try {
      await bothStarted.promise;
      expect(observer).not.toHaveBeenCalled();
    } finally {
      release.resolve();
      await Promise.all([first, second]);
      await register.destroyAsync();
    }
    expect(observer).toHaveBeenCalledTimes(1);
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['dispatch', 'sequential'],
    ['dispatch', 'parallel'],
    ['dispatch', 'race'],
    ['dispatchWithResult', 'sequential'],
    ['dispatchWithResult', 'parallel'],
    ['dispatchWithResult', 'race'],
  ] as const)('%s in %s mode claims a once handler before concurrent invocations', async (method, executionMode) => {
    const started = deferred();
    const release = deferred();
    const cleanup = jest.fn();
    const handler = jest.fn(async () => {
      started.resolve();
      await release.promise;
      return 'once';
    });
    register.register('run', handler, { once: true, cleanup });
    const dispatch = () => method === 'dispatch'
      ? register.dispatch('run', undefined, { executionMode })
      : register.dispatchWithResult('run', undefined, { executionMode });
    const first = dispatch();
    try {
      await started.promise;
      await dispatch();
      expect(handler).toHaveBeenCalledTimes(1);
      expect(cleanup).not.toHaveBeenCalled();
    } finally {
      release.resolve();
      await first;
      await register.destroyAsync();
    }
    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});
