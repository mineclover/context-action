import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { createRefContext } from '@context-action/react';

function setup() {
  const Refs = createRefContext<{ element: HTMLDivElement }>('PublicRefCallbacks');
  const onStateChange = jest.fn();
  const wrapper = ({ children }: { children: React.ReactNode }) => <Refs.Provider>{children}</Refs.Provider>;
  return {
    onStateChange,
    ...renderHook(() => {
      Refs.useOnMountStateChange('element', onStateChange);
      return {
        ref: Refs.useRefHandler('element'),
        state: Refs.useRefMountState('element'),
        check: Refs.useRefMountChecker('element'),
        wait: Refs.useWaitForRefs(),
      };
    }, { wrapper }),
  };
}

describe('Public Ref callback and mount-state APIs', () => {
  it('runs onMount for future and already-mounted targets and honors unsubscribe', () => {
    const { result, unmount } = setup();
    const future = jest.fn();
    const immediate = jest.fn();
    const target = document.createElement('div');
    const next = document.createElement('div');
    try {
      const stopFuture = result.current.ref.onMount(future);
      expect(future).not.toHaveBeenCalled();
      act(() => { result.current.ref.setRef(target); });
      expect(future).toHaveBeenCalledTimes(1);
      expect(future).toHaveBeenLastCalledWith(target);
      const stopImmediate = result.current.ref.onMount(immediate);
      expect(immediate).toHaveBeenCalledWith(target);
      stopFuture();
      stopImmediate();
      act(() => {
        result.current.ref.setRef(null);
        result.current.ref.setRef(next);
      });
      expect(future).toHaveBeenCalledTimes(1);
      expect(immediate).toHaveBeenCalledTimes(1);
    } finally { unmount(); }
  });

  it('reports attachment/detachment to state hooks, callbacks and a stable live checker', () => {
    const { result, onStateChange, unmount } = setup();
    const target = document.createElement('div');
    const checker = result.current.check;
    try {
      expect(onStateChange).toHaveBeenLastCalledWith(false, null);
      expect(checker()).toMatchObject({ isMounted: false, target: null });
      act(() => { result.current.ref.setRef(target); });
      expect(result.current.state).toMatchObject({ isMounted: true, mountedTarget: target });
      expect(result.current.check).toBe(checker);
      expect(checker()).toMatchObject({ isMounted: true, target });
      expect(onStateChange).toHaveBeenLastCalledWith(true, target);
      act(() => { result.current.ref.setRef(null); });
      expect(result.current.state).toMatchObject({ isMounted: false, mountedTarget: null });
      expect(onStateChange).toHaveBeenLastCalledWith(false, null);
      expect(checker()).toMatchObject({ isMounted: false, target: null });
    } finally { unmount(); }
  });

  it('executes only on a mounted target and cannot run a saved operation or callback after disposal', () => {
    const { result, unmount } = setup();
    const operation = jest.fn((target: HTMLDivElement) => target.tagName);
    const target = document.createElement('div');
    expect(result.current.ref.executeIfMounted(operation)).toBeNull();
    expect(operation).not.toHaveBeenCalled();
    act(() => { result.current.ref.setRef(target); });
    expect(result.current.ref.executeIfMounted(operation)).toBe('DIV');
    expect(operation).toHaveBeenCalledWith(target);
    const saved = result.current.ref;
    unmount();
    expect(saved.executeIfMounted(operation)).toBeNull();
    expect(operation).toHaveBeenCalledTimes(1);
    const late = jest.fn();
    const unsubscribe = saved.onMount(late);
    saved.setRef(document.createElement('div'));
    unsubscribe();
    expect(late).not.toHaveBeenCalled();
  });

  it('publishes waiting state when a mount wait starts and clears it on settlement', async () => {
    const { result, unmount } = setup();
    let pending!: Promise<HTMLDivElement>;
    const initialWait = result.current.ref.waitForMount;
    const initialOnMount = result.current.ref.onMount;
    try {
      act(() => {
        pending = result.current.ref.waitForMount();
        void pending.catch(() => {});
      });
      expect(result.current.state.isWaitingForMount).toBe(true);
      expect(result.current.ref.isWaitingForMount).toBe(true);
      expect(result.current.ref.waitForMount).toBe(initialWait);
      expect(result.current.ref.onMount).toBe(initialOnMount);
      expect(result.current.check().isWaitingForMount).toBe(true);
      const target = document.createElement('div');
      await act(async () => {
        result.current.ref.setRef(target);
        await expect(pending).resolves.toBe(target);
      });
      expect(result.current.state).toMatchObject({ isMounted: true, isWaitingForMount: false });
    } finally { unmount(); }
  });

  it('keeps waiting state until the last independent waiter times out', async () => {
    jest.useFakeTimers();
    const { result, unmount } = setup();
    try {
      let first!: Promise<{ element: HTMLDivElement }>;
      let second!: Promise<{ element: HTMLDivElement }>;
      act(() => {
        first = result.current.wait(10, 'element');
        second = result.current.wait(20, 'element');
      });
      const firstExpired = expect(first).rejects.toThrow('Mount timeout after 10ms');
      const secondExpired = expect(second).rejects.toThrow('Mount timeout after 20ms');
      expect(result.current.state.isWaitingForMount).toBe(true);
      await act(async () => { await jest.advanceTimersByTimeAsync(10); });
      await firstExpired;
      expect(result.current.state.isWaitingForMount).toBe(true);
      await act(async () => { await jest.advanceTimersByTimeAsync(10); });
      await secondExpired;
      expect(result.current.state.isWaitingForMount).toBe(false);
      expect(result.current.ref.isWaitingForMount).toBe(false);
      expect(result.current.check().isWaitingForMount).toBe(false);
    } finally {
      unmount();
      jest.clearAllTimers();
      jest.useRealTimers();
    }
  });
});
