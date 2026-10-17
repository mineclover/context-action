/**
 * @module source-context
 *
 * Purpose:
 *   Provides a read-only `ReadonlySignal<T>` context boundary so Preact views
 *   can project domain state slices without owning subscription lifecycles.
 *
 * Invariants:
 *   - The provided `sourceSignal` is borrowed from an external connection session
 *     (`connectSourceSignal`) and remains read-only across all consumers.
 *   - `useSourceSignal()` fails closed when called outside its matching `<Provider>`.
 */
import { createContext } from 'preact';
import type { ComponentChildren } from 'preact';
import { useContext } from 'preact/hooks';
import type { ReadonlySignal } from '@preact/signals';

export interface SourceContext<T> {
  Provider(props: {
    sourceSignal: ReadonlySignal<T>;
    children?: ComponentChildren;
  }): preact.JSX.Element;
  useSourceSignal(): ReadonlySignal<T>;
}

/**
 * Provides a borrowed source signal down the component tree without DOM ownership.
 */
export function createSourceContext<T>(name: string): SourceContext<T> {
  const Context = createContext<ReadonlySignal<T> | null>(null);

  function Provider(props: {
    sourceSignal: ReadonlySignal<T>;
    children?: ComponentChildren;
  }) {
    return <Context.Provider value={props.sourceSignal}>{props.children}</Context.Provider>;
  }

  function useSourceSignal(): ReadonlySignal<T> {
    const signal = useContext(Context);
    if (signal === null) {
      throw new Error(`${name}: useSourceSignal requires its Provider`);
    }
    return signal;
  }

  return { Provider, useSourceSignal };
}
