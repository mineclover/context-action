import { ActionRegister } from '@context-action/core';
import type { ActionDispatcher } from '@context-action/core';
import type { ReadableSource } from '@context-action/preact';

export interface CounterActions {
  increment: void;
  setValue: { value: number };
}

export interface CounterModel {
  source: ReadableSource<number>;
  dispatch: ActionDispatcher<CounterActions>;
  destroy(): void;
}

/** Domain state is plain data. Neither Preact nor Signals owns this register. */
export function createCounterModel(initialValue = 0): CounterModel {
  if (!Number.isFinite(initialValue)) throw new RangeError('Expected a finite value');
  let value = initialValue;
  let destroyed = false;
  const listeners = new Set<() => void>();
  const actions = new ActionRegister<CounterActions>({ name: 'PreactCounterExample' });
  const commit = (next: number) => {
    if (destroyed) throw new Error('Counter model is destroyed');
    if (!Number.isFinite(next)) throw new RangeError('Expected a finite value');
    if (Object.is(value, next)) return;
    value = next;
    for (const notify of Array.from(listeners)) notify();
  };
  actions.register('increment', () => commit(value + 1));
  actions.register('setValue', (payload) => commit(payload.value));
  return {
    source: {
      getSnapshot: () => value,
      subscribe(notify) {
        if (destroyed) throw new Error('Counter model is destroyed');
        listeners.add(notify);
        return () => { listeners.delete(notify); };
      },
    },
    dispatch: actions.dispatch.bind(actions),
    destroy() {
      if (destroyed) return;
      destroyed = true;
      listeners.clear();
      actions.destroy();
    },
  };
}
