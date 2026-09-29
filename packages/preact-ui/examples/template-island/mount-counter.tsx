import { connectSourceSignal, createDispatchContext } from '@context-action/preact';
import { useSignal } from '@preact/signals';
import type { ReadonlySignal } from '@preact/signals';
import { createDisposalScope, mountTemplate } from '../../src/index.js';
import type { CounterActions, CounterModel } from '../shared/counter-model.js';

const CounterDispatch = createDispatchContext<CounterActions>('Counter');

function CounterValue({ count, label }: { count: ReadonlySignal<number>; label: string }) {
  const dispatch = CounterDispatch.useDispatch();
  const error = useSignal('');
  return <div>
    <span>{label}: <output>{count}</output></span>
    <button type="button" onClick={() => {
      error.value = '';
      void dispatch('increment').catch((reason: unknown) => {
        error.value = reason instanceof Error ? reason.message : String(reason);
      });
    }}>Increment</button>
    <p role="alert">{error}</p>
  </div>;
}

/** Public controller has no VNode, signal, or internal DOM references. */
export function mountCounter(
  host: HTMLElement,
  template: HTMLTemplateElement,
  model: CounterModel,
  initialLabel: string,
) {
  const scope = createDisposalScope();
  const connection = connectSourceSignal(model.source);
  scope.add(() => connection.dispose());
  try {
    const mount = mountTemplate(host, template, ({ input }: { input: { label: string } }) => (
      <CounterDispatch.Provider dispatch={model.dispatch}>
        <CounterValue count={connection.signal} label={input.label} />
      </CounterDispatch.Provider>
    ), { label: initialLabel });
    scope.add(() => mount.destroy());
    return {
      setLabel(label: string) { mount.update({ label }); },
      setValue(value: number) {
        if (scope.disposed) return Promise.reject(new Error('Counter UI is destroyed'));
        return model.dispatch('setValue', { value });
      },
      destroy() { scope.dispose(); },
    };
  } catch (error) {
    try { scope.dispose(); } catch (cleanupError) {
      throw new AggregateError([error, cleanupError], 'Counter mount failed');
    }
    throw error;
  }
}
