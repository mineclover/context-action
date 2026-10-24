import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { createRefContext, createStore } from '@context-action/react';

function setup() {
  const Refs = createRefContext<{ element: HTMLDivElement }>('CleanupRefs', { defaultMountTimeout: 100 });
  const wrapper = ({ children }: { children: React.ReactNode }) => <Refs.Provider>{children}</Refs.Provider>;
  return renderHook(() => ({
    ref: Refs.useRefHandler('element'),
    poll: Refs.useRefPolling(),
    wait: Refs.useWaitForRefs(),
    all: Refs.useGetAllRefs(),
  }), { wrapper });
}

function expectNoTimers() {
  // React's async act schedules a microtask; flush it without advancing any
  // timeout/interval so this assertion still detects leaked library timers.
  jest.runAllTicks();
  expect(jest.getTimerCount()).toBe(0);
}

describe('Ref and Store asynchronous cleanup contracts', () => {
  beforeEach(() => { jest.useFakeTimers(); });
  afterEach(() => { jest.clearAllTimers(); jest.useRealTimers(); });

  it('does not start an interval after polling an already mounted ref', async () => {
    const { result, unmount } = setup();
    try {
      const target = document.createElement('div');
      act(() => { result.current.ref.setRef(target); });
      const poll = result.current.poll('element', { interval: 10, timeout: 100 });
      await expect(poll.promise).resolves.toBe(target);
      expect(jest.getTimerCount()).toBe(0);
    } finally { unmount(); }
  });

  it('cancels polling immediately without another tick', async () => {
    const { result, unmount } = setup();
    const onTick = jest.fn();
    const polling = result.current.poll('element', { interval: 10, timeout: 100, onTick });
    const rejected = expect(polling.promise).rejects.toThrow('Polling cancelled');
    try {
      polling.cancel();
      expect(jest.getTimerCount()).toBe(0);
      await rejected;
      expect(onTick).toHaveBeenCalledTimes(1);
    } finally { unmount(); }
  });

  it('rejects polling and clears its timers when its Provider unmounts', async () => {
    const { result, unmount } = setup();
    const settled = jest.fn();
    const polling = result.current.poll('element', { interval: 10, timeout: 100 });
    void polling.promise.then(settled, settled);
    await act(async () => { unmount(); });
    expectNoTimers();
    expect(settled).toHaveBeenCalledWith(expect.objectContaining({ message: 'Context provider unmounted' }));
  });

  it('clears useWaitForRefs deadlines after a successful mount', async () => {
    const { result, unmount } = setup();
    try {
      const target = document.createElement('div');
      let wait!: ReturnType<typeof result.current.wait>;
      await act(async () => {
        wait = result.current.wait(100, 'element');
        result.current.ref.setRef(target);
        await expect(wait).resolves.toEqual({ element: target });
      });
      expectNoTimers();
    } finally { unmount(); }
  });

  it('does not let saved callbacks resurrect refs or start waits after Provider disposal', async () => {
    const { result, unmount } = setup();
    const saved = result.current;
    unmount();
    saved.ref.setRef(document.createElement('div'));
    expect(saved.all()).toEqual({});
    const settled = jest.fn();
    void saved.ref.waitForMount().then(settled, settled);
    await act(async () => { await Promise.resolve(); });
    expect(settled).toHaveBeenCalledWith(expect.objectContaining({ message: 'Context provider unmounted' }));
    await expect(saved.wait('element')).rejects.toThrow('Context provider unmounted');
    expect(() => saved.poll('element')).toThrow('Context provider unmounted');
    expectNoTimers();
  });

  it('does not let an older mount timeout reject a newer waiter after a null ref callback', async () => {
    const { result, unmount } = setup();
    const firstSettled = jest.fn();
    const secondSettled = jest.fn();
    try {
      act(() => { void result.current.ref.waitForMount().then(firstSettled, firstSettled); });
      await act(async () => { await jest.advanceTimersByTimeAsync(50); });
      act(() => {
        result.current.ref.setRef(null);
        void result.current.ref.waitForMount().then(secondSettled, secondSettled);
      });
      await act(async () => { await jest.advanceTimersByTimeAsync(50); });
      expect(firstSettled).toHaveBeenCalledWith(expect.any(Error));
      expect(secondSettled).not.toHaveBeenCalled();
      const target = document.createElement('div');
      await act(async () => { result.current.ref.setRef(target); });
      expect(secondSettled).toHaveBeenCalledWith(target);
      expectNoTimers();
    } finally { unmount(); }
  });

  it('fails an already-aborted operation without waiting for a mount', async () => {
    const { result, unmount } = setup();
    const controller = new AbortController();
    controller.abort();
    const operation = jest.fn();
    const settled = jest.fn();
    try {
      void result.current.ref.withTarget(operation, { signal: controller.signal }).then(settled);
      await act(async () => { await Promise.resolve(); });
      expect(settled).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
      expect(operation).not.toHaveBeenCalled();
      expectNoTimers();
    } finally { unmount(); }
  });

  it('clears operation timeouts after successful completion', async () => {
    const { result, unmount } = setup();
    try {
      act(() => { result.current.ref.setRef(document.createElement('div')); });
      await expect(result.current.ref.withTarget(() => 'done', { timeout: 100 }))
        .resolves.toMatchObject({ success: true, result: 'done' });
      expect(jest.getTimerCount()).toBe(0);
    } finally { unmount(); }
  });

  it('keeps a separate mount waiter alive when a useWaitForRefs deadline expires', async () => {
    const { result, unmount } = setup();
    const independent = jest.fn();
    try {
      let group!: ReturnType<typeof result.current.wait>;
      act(() => {
        void result.current.ref.waitForMount().then(independent, independent);
        group = result.current.wait(30, 'element');
      });
      const expired = expect(group).rejects.toThrow('Mount timeout after 30ms');
      await act(async () => { await jest.advanceTimersByTimeAsync(30); });
      await expired;
      expect(independent).not.toHaveBeenCalled();
      const target = document.createElement('div');
      await act(async () => { result.current.ref.setRef(target); });
      expect(independent).toHaveBeenCalledWith(target);
      expectNoTimers();
    } finally { unmount(); }
  });

  it('does not report polling success after onTick cancels that poll', async () => {
    const { result, unmount } = setup();
    const onSuccess = jest.fn();
    let poll!: ReturnType<typeof result.current.poll>;
    let ticks = 0;
    poll = result.current.poll('element', {
      interval: 10, timeout: 100, onSuccess,
      onTick: () => { if (++ticks === 2) poll.cancel(); },
    });
    const cancelled = expect(poll.promise).rejects.toThrow('Polling cancelled');
    try {
      act(() => { result.current.ref.setRef(document.createElement('div')); });
      await act(async () => { await jest.advanceTimersByTimeAsync(10); });
      await cancelled;
      expect(onSuccess).not.toHaveBeenCalled();
      expectNoTimers();
    } finally { unmount(); }
  });

  it('keeps a disposed Store snapshot stable without invoking a late updater or scheduling a frame', () => {
    const store = createStore('disposed-store', 0);
    const snapshot = store.getSnapshot();
    const updater = jest.fn(() => 2);
    store.dispose();
    store.setValue(1);
    store.update(updater);
    expect(updater).not.toHaveBeenCalled();
    expect(store.getValue()).toBe(0);
    expect(store.getSnapshot()).toBe(snapshot);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('does not run an update queued before Store disposal', async () => {
    const store = createStore('disposed-queued-update', 0);
    const queued = jest.fn(() => 2);
    store.update(() => {
      store.update(queued);
      return 1;
    });
    store.dispose();
    await Promise.resolve();
    expect(queued).not.toHaveBeenCalled();
    expect(store.getValue()).toBe(1);
    expect(jest.getTimerCount()).toBe(0);
  });

  it.each(['updater', 'comparator'] as const)('does not commit after disposal inside a %s', source => {
    const store = createStore('reentrant-disposal', 0);
    const snapshot = store.getSnapshot();
    if (source === 'updater') {
      store.update(() => { store.dispose(); return 1; });
    } else {
      store.setCustomComparator(() => { store.dispose(); return false; });
      store.setValue(1);
    }
    expect(store.getValue()).toBe(0);
    expect(store.getSnapshot()).toBe(snapshot);
    expect(jest.getTimerCount()).toBe(0);
  });
});
