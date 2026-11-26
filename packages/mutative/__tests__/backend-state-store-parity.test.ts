import { describe, expect, it, vi } from 'vitest';
import {
  MutativeStateBackend,
  MutativeTimelineBackend,
  createMutativeStateBackend,
  createMutativeTimelineBackend,
} from '../src';

describe('M3 · Mutative backends StateStore parity and notificationMode controls', () => {
  it('exposes StateStore getValue() and isDisposed() on MutativeStateBackend', () => {
    const store = createMutativeStateBackend('doc', { title: 'init', count: 0 });
    expect(store.getValue()).toEqual({ title: 'init', count: 0 });
    expect(store.isDisposed?.()).toBe(false);

    store.update((draft) => {
      draft.count = 3;
    });
    expect(store.getValue()).toEqual({ title: 'init', count: 3 });

    store.dispose?.();
    expect(store.isDisposed?.()).toBe(true);
    expect(store instanceof MutativeStateBackend).toBe(true);
  });

  it('exposes getValue(), isDisposed(), and notificationMode switching without double microtask notification', async () => {
    const timeline = new MutativeTimelineBackend('timeline-parity', { count: 0 }, {
      notificationMode: 'batched',
    });
    expect(timeline.getNotificationMode()).toBe('batched');
    expect(timeline.getValue()).toEqual({ count: 0 });
    expect(timeline.isDisposed()).toBe(false);

    const listener = vi.fn();
    const patchListener = vi.fn();
    timeline.subscribe(listener);
    timeline.subscribeWithPatches(patchListener);

    timeline.update((draft) => {
      draft.count = 1;
    });
    timeline.update((draft) => {
      draft.count = 2;
    });

    // Batched microtask has not run yet
    expect(listener).toHaveBeenCalledTimes(0);

    // Switching to immediate flushes pending updates once and cancels queued microtask
    timeline.setNotificationMode('immediate');
    expect(timeline.getNotificationMode()).toBe('immediate');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(patchListener).toHaveBeenCalledTimes(1);
    expect(patchListener.mock.calls[0]?.[0]).toHaveLength(2);
    expect(timeline.getValue()).toEqual({ count: 2 });

    await Promise.resolve();
    // Queued microtask must not fire a second time
    expect(listener).toHaveBeenCalledTimes(1);

    // Undo / Redo notify immediately in immediate mode
    timeline.undo();
    expect(timeline.getValue()).toEqual({ count: 1 });
    expect(listener).toHaveBeenCalledTimes(2);

    timeline.redo();
    expect(timeline.getValue()).toEqual({ count: 2 });
    expect(listener).toHaveBeenCalledTimes(3);

    timeline.dispose();
    expect(timeline.isDisposed()).toBe(true);
    timeline.setNotificationMode('batched');
    expect(timeline.getNotificationMode()).toBe('immediate');

    // Factory preserves timeline & StateStore contracts without React dependency
    const viaFactory = createMutativeTimelineBackend('factory-timeline', { n: 1 });
    expect(viaFactory.getValue()).toEqual({ n: 1 });
    viaFactory.dispose?.();
  });
});
