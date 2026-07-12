import { ActionGuard } from '../../src/action-guard';

describe('ActionGuard lifecycle', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not allocate a maintenance timer until a guard is used', () => {
    const guard = new ActionGuard();

    expect(jest.getTimerCount()).toBe(0);

    guard.destroy();
    expect(jest.getTimerCount()).toBe(0);
  });

  it('releases guard and maintenance timers when cleared', async () => {
    const guard = new ActionGuard();
    const pendingDebounce = guard.debounce('search', 100);

    expect(jest.getTimerCount()).toBe(2);

    guard.clearAll();

    await expect(pendingDebounce).resolves.toBe(false);
    expect(jest.getTimerCount()).toBe(0);
  });
});
