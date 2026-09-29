import type { ActionDispatcher, ActionPayloadMap } from '@context-action/core';
import { createContext } from 'preact';
import type { ComponentChildren } from 'preact';
import { useContext } from 'preact/hooks';

/** A borrowed dispatcher: this adapter neither creates nor destroys a register. */
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
