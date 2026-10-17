/**
 * @module dispatch-context
 *
 * Purpose:
 *   Provides a write-only Action Dispatch context boundary for Preact component
 *   trees without owning or coupling to an `ActionRegister` lifecycle.
 *
 * Invariants:
 *   - The adapter borrows `ActionDispatcher<A>` from an external owner session;
 *     it never creates, mutates, or disposes the underlying register.
 *   - `useDispatch()` fails closed with a descriptive error when invoked outside
 *     its matching `<Provider>`.
 */
import type { ActionDispatcher, ActionPayloadMap } from '@context-action/core';
import { createContext } from 'preact';
import type { ComponentChildren } from 'preact';
import { useContext } from 'preact/hooks';

/** Creates a borrowed dispatcher context that neither creates nor destroys a register. */
export function createDispatchContext<A extends ActionPayloadMap>(name: string) {
  const Context = createContext<ActionDispatcher<A> | null>(null);

  function Provider(props: {
    dispatch: ActionDispatcher<A>;
    children?: ComponentChildren;
  }) {
    return <Context.Provider value={props.dispatch}>{props.children}</Context.Provider>;
  }

  function useDispatch(): ActionDispatcher<A> {
    const dispatch = useContext(Context);
    if (dispatch === null) {
      throw new Error(`${name}: useDispatch requires its Provider`);
    }
    return dispatch;
  }

  return { Provider, useDispatch };
}
