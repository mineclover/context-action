import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { createRefContext } from '@context-action/react';

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>(release => { resolve = release; });
  return { promise, resolve };
}

function setup() {
  const Refs = createRefContext<{ element: HTMLDivElement }>('OperationCleanup');
  const wrapper = ({ children }: { children: React.ReactNode }) => <Refs.Provider>{children}</Refs.Provider>;
  return renderHook(() => Refs.useRefHandler('element'), { wrapper });
}

function expectNoTimers() {
  jest.runAllTicks();
  expect(jest.getTimerCount()).toBe(0);
}

describe('Ref operation cancellation and serialization', () => {
  beforeEach(() => { jest.useFakeTimers(); });
  afterEach(() => { jest.clearAllTimers(); jest.useRealTimers(); });

  it('cancels a mount wait without invoking its operation', async () => {
    const { result, unmount } = setup();
    const controller = new AbortController();
    const operation = jest.fn();
    const execution = result.current.withTarget(operation, { signal: controller.signal });
    try {
      await act(async () => { controller.abort(); });
      await expect(execution).resolves.toMatchObject({ success: false });
      expect(operation).not.toHaveBeenCalled();
      expectNoTimers();
    } finally { unmount(); }
  });

  it('releases an active caller on unmount and forwards cancellation to its operation', async () => {
    const { result, unmount } = setup();
    const started = deferred();
    const release = deferred();
    let operationSignal: AbortSignal | undefined;
    act(() => { result.current.setRef(document.createElement('div')); });
    const execution = result.current.withTarget(async (_target, options) => {
      operationSignal = options?.signal;
      started.resolve();
      await release.promise;
      return 'late';
    }, { timeout: 100 });
    try {
      await started.promise;
      await act(async () => { unmount(); });
      await expect(execution).resolves.toMatchObject({
        success: false, error: { message: 'Context provider unmounted' },
      });
      expect(operationSignal?.aborted).toBe(true);
      expectNoTimers();
    } finally {
      release.resolve();
      await execution;
      unmount();
    }
  });

  it.each(['abort', 'timeout'] as const)(
    'keeps the serialization slot until actual work settles after %s', async reason => {
      const { result, unmount } = setup();
      const started = deferred();
      const release = deferred();
      const controller = new AbortController();
      act(() => { result.current.setRef(document.createElement('div')); });
      const first = result.current.withTarget(async () => {
        started.resolve();
        await release.promise;
        return 'late';
      }, reason === 'abort' ? { signal: controller.signal } : { timeout: 10 });
      let second: ReturnType<typeof result.current.withTarget> | undefined;
      try {
        await started.promise;
        const next = jest.fn(() => 'next');
        second = result.current.withTarget(next);
        await act(async () => {
          if (reason === 'abort') controller.abort();
          else await jest.advanceTimersByTimeAsync(10);
        });
        await expect(first).resolves.toMatchObject({ success: false });
        expect(next).not.toHaveBeenCalled();
        expectNoTimers();
        // The queued operation must read the replacement target, not the one
        // captured by the preceding operation before its asynchronous work.
        const replacement = document.createElement('div');
        await act(async () => {
          result.current.setRef(replacement);
          release.resolve();
          await expect(second).resolves.toMatchObject({ success: true, result: 'next' });
        });
        expect(next).toHaveBeenCalledWith(replacement, expect.objectContaining({ signal: expect.any(AbortSignal) }));
        expectNoTimers();
      } finally {
        release.resolve();
        await first;
        await second;
        unmount();
      }
    },
  );

  it('skips an aborted queued operation without blocking the next operation', async () => {
    const { result, unmount } = setup();
    const started = deferred();
    const release = deferred();
    const controller = new AbortController();
    act(() => { result.current.setRef(document.createElement('div')); });
    const first = result.current.withTarget(async () => {
      started.resolve();
      await release.promise;
      return 'first';
    });
    const skipped = jest.fn();
    const next = jest.fn(() => 'third');
    const second = result.current.withTarget(skipped, { signal: controller.signal });
    const third = result.current.withTarget(next);
    try {
      await started.promise;
      controller.abort();
      await expect(second).resolves.toMatchObject({ success: false });
      expect(skipped).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
      expectNoTimers();
      release.resolve();
      await expect(third).resolves.toMatchObject({ success: true, result: 'third' });
      expect(skipped).not.toHaveBeenCalled();
    } finally {
      release.resolve();
      await Promise.all([first, second, third]);
      unmount();
    }
  });

  it.each(['success', 'throw'] as const)('removes external abort listeners and deadlines after %s', async outcome => {
    const { result, unmount } = setup();
    const controller = new AbortController();
    const added = jest.spyOn(controller.signal, 'addEventListener');
    const removed = jest.spyOn(controller.signal, 'removeEventListener');
    try {
      act(() => { result.current.setRef(document.createElement('div')); });
      const execution = await result.current.withTarget(() => {
        if (outcome === 'throw') throw new Error('operation failed');
        return 'done';
      }, { signal: controller.signal, timeout: 100 });
      expect(execution.success).toBe(outcome === 'success');
      expect(added).toHaveBeenCalledTimes(1);
      expect(removed).toHaveBeenCalledWith('abort', added.mock.calls[0]![1]);
      expectNoTimers();
    } finally {
      added.mockRestore();
      removed.mockRestore();
      unmount();
    }
  });
});
