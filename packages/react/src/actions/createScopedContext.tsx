import type { ActionPayloadMap, ActionResultMap } from '@context-action/core';
import React, {
  createContext,
  type ReactNode,
  useContext,
  useInsertionEffect,
  useRef,
} from 'react';
import type { ActionContextReturn, ActionProviderProps } from './ActionContext.types';

const UNSET_SCOPE = Symbol('ScopedContext.Unset');

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function shallowEqualPlainObjects(
  left: Record<string, unknown>,
  right: Record<string, unknown>,
): boolean {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) return false;
  for (let i = 0; i < leftKeys.length; i += 1) {
    const key = leftKeys[i]!;
    if (Object.getOwnPropertyDescriptor(right, key) === undefined) return false;
    if (!Object.is(left[key], right[key])) return false;
  }
  return true;
}

/**
 * Props accepted by the unified `Provider` returned from `createScopedContext()`.
 * Combines caller-defined setup props with `ActionProviderProps` (`register`, `ownership`)
 * and optional `children`.
 */
export type ScopedProviderProps<
  TActions extends ActionPayloadMap,
  TProps extends object = Record<never, never>,
  TResultMap extends ActionResultMap<TActions> = {},
> = Omit<TProps, 'children'> &
  Omit<ActionProviderProps<TActions, TResultMap>, keyof TProps | 'children'> & {
    children?: ReactNode;
  };

/**
 * Unified feature/widget scope combining `actions.Provider` and the setup
 * runtime context under one flat `Provider` without an artificial Bridge component.
 *
 * Use `createScopedContext()` for self-contained interactive widgets or feature scopes
 * that pair an `ActionContext` with component-scoped stores/refs (`useStoreInstance`,
 * `useRefRegistry`). For multi-store app/domain boundaries with separated layers,
 * prefer separate `createActionContext` + `createStoreContext` providers.
 */
export interface ScopedContextReturn<
  TActions extends ActionPayloadMap,
  TProps extends object = Record<never, never>,
  TRuntime = void,
  TResultMap extends ActionResultMap<TActions> = {},
> extends Omit<ActionContextReturn<TActions, TResultMap>, 'Provider'> {
  /** Single flat Provider mounting both `actions.Provider` and the setup runtime scope. */
  Provider: React.FC<ScopedProviderProps<TActions, TProps, TResultMap>>;
  /**
   * Read the runtime value returned by `useSetup` (for example `{ store, refs }`).
   * Distinct from the inherited `useActionScope()`, which returns `{ dispatch, dispatchWithResult, abortAll, resetAbortScope }`.
   */
  useScope: () => TRuntime;
  /** Explicit non-empty name passed to `createScopedContext()`. */
  contextName: string;
  /**
   * Underlying React Context holding the `useSetup` runtime value.
   * Defaults to an internal `symbol` sentinel outside `Provider`; prefer calling `useScope()`.
   */
  scopeContext: React.Context<TRuntime | symbol>;
}

/**
 * Binds an existing `ActionContextReturn` and a setup hook into a single flat
 * `Provider` so action handlers, ref registries, stores, and effects run
 * directly inside `actions.Provider` without needing a nested Bridge component.
 *
 * Plain-object values returned from `useSetup` are automatically shallow-stabilized
 * across re-renders so child `useScope()` consumers never re-render when setup
 * object identities stay unchanged.
 *
 * @example
 * ```tsx
 * const CounterActions = createActionContext<{ inc: void }>('CounterActions');
 *
 * const CounterScope = createScopedContext(
 *   'CounterScope',
 *   CounterActions,
 *   ({ initial = 0 }: { initial?: number }) => {
 *     const store = useStoreInstance({ count: initial });
 *     CounterActions.useActionCommandHandler('inc', () => {
 *       store.update((draft) => { draft.count += 1; });
 *     });
 *     return { store };
 *   },
 * );
 * ```
 */
export function createScopedContext<
  TActions extends ActionPayloadMap,
  TProps extends object = Record<never, never>,
  TRuntime = void,
  TResultMap extends ActionResultMap<TActions> = {},
>(
  contextName: string,
  actions: ActionContextReturn<TActions, TResultMap>,
  useSetup: (props: TProps) => TRuntime,
): ScopedContextReturn<TActions, TProps, TRuntime, TResultMap> {
  if (typeof contextName !== 'string' || contextName.trim().length === 0) {
    throw new TypeError(
      'createScopedContext requires a non-empty context name as its first argument.',
    );
  }

  const ScopeContext = createContext<TRuntime | typeof UNSET_SCOPE>(UNSET_SCOPE);

  function ScopeHost({
    setupProps,
    children,
  }: {
    setupProps: TProps;
    children?: ReactNode;
  }) {
    const committedRef = useRef<{ initialized: boolean; value: TRuntime }>({
      initialized: false,
      value: undefined as TRuntime,
    });

    const nextRuntime = useSetup(setupProps);
    const prev = committedRef.current;
    let stableRuntime = nextRuntime;

    if (prev.initialized) {
      if (
        Object.is(prev.value, nextRuntime) ||
        (isPlainObject(prev.value) &&
          isPlainObject(nextRuntime) &&
          shallowEqualPlainObjects(prev.value, nextRuntime))
      ) {
        stableRuntime = prev.value;
      }
    }

    useInsertionEffect(() => {
      committedRef.current = { initialized: true, value: stableRuntime };
    }, [stableRuntime]);

    return (
      <ScopeContext.Provider value={stableRuntime}>
        {children}
      </ScopeContext.Provider>
    );
  }

  const Provider: React.FC<ScopedProviderProps<TActions, TProps, TResultMap>> = (
    props,
  ) => {
    const { children, register, ownership, ...setupProps } = props as ScopedProviderProps<
      TActions,
      TProps,
      TResultMap
    > & {
      register?: ActionProviderProps<TActions, TResultMap>['register'];
      ownership?: ActionProviderProps<TActions, TResultMap>['ownership'];
    };

    return (
      <actions.Provider register={register} ownership={ownership}>
        <ScopeHost setupProps={setupProps as unknown as TProps}>
          {children}
        </ScopeHost>
      </actions.Provider>
    );
  };

  function useScope(): TRuntime {
    const value = useContext(ScopeContext);
    if (value === UNSET_SCOPE) {
      throw new Error(
        `${contextName}.useScope must be used within ${contextName}.Provider`,
      );
    }
    return value;
  }

  return {
    Provider,
    useScope,
    contextName,
    scopeContext: ScopeContext as unknown as React.Context<TRuntime | symbol>,
    useActionContext: actions.useActionContext,
    useActionDispatch: actions.useActionDispatch,
    useActionHandler: actions.useActionHandler,
    useActionGuard: actions.useActionGuard,
    useActionCommandHandler: actions.useActionCommandHandler,
    useActionObserver: actions.useActionObserver,
    useActionResultHandler: actions.useActionResultHandler,
    useActionRegister: actions.useActionRegister,
    useActionResultDispatch: actions.useActionResultDispatch,
    useActionScope: actions.useActionScope,
    context: actions.context,
  };
}
