/**
 * @fileoverview ActionContext Type Definitions
 *
 * Core type definitions for the ActionContext system.
 * Only includes types that are actually used in ActionContext.tsx implementation.
 */

import {
  ActionCommandHandler,
  ActionNames,
  ActionRegister,
  ActionRegisterConfig,
  ActionEffectHandler,
  ActionGuardHandler,
  ActionObserverHandler,
  CommandConfig,
  ObserverConfig,
  ActionResult,
  ActionResultHandler,
  ActionResultMap,
  ActionPayloadMap,
  HandlerConfig,
  EffectConfig,
  GuardConfig,
  PipelineController,
} from '@context-action/core';
import { ReactNode } from 'react';

/**
 * Inlined handler shape keeps callback contextual typing intact in the
 * modern compiler releases. The core ActionHandler alias has the same
 * runtime contract.
 */
export type ActionContextHandler<T, R = void> = (
  payload: T,
  controller: PipelineController<T, R>
) => R | Promise<R> | void | Promise<void>;

/**
 * Configuration options for createActionContext
 *
 * Extends ActionRegisterConfig with optional structural payload validation.
 * When schema is provided, payload validation is enabled on dispatch.
 *
 * @example
 * ```typescript
 * const { Provider } = createActionContext<UserActions>('User', {
 *   schema: userActionSchema,
 *   registry: {
 *     validationMode: 'strict', // 'strict' | 'warn' | 'silent'
 *   },
 * });
 * ```
 */
export interface ActionContextConfig extends Omit<ActionRegisterConfig, 'name'> {
  /**
   * Action schema map for runtime payload validation
   * Uses the core validator contract; no tool protocol or schema library is required.
   * Shorthand for config.registry.schema
   */
  schema?: NonNullable<ActionRegisterConfig['registry']>['schema'];
}

/**
 * Context type for ActionRegister with enhanced type safety and abort support
 */
export interface ActionContextType<
  T extends ActionPayloadMap,
  TResultMap extends ActionResultMap<T> = {},
> {
  actionRegisterRef: React.RefObject<ActionRegister<T, TResultMap> | null>;
  dispatchLifecycle: ProviderDispatchLifecycle;
}

/** Shutdown options passed to ProviderDispatchLifecycle.shutdown(). */
export interface ProviderShutdownOptions {
  /** Whether to destroy the underlying ActionRegister on shutdown (defaults to true). */
  destroyRegister?: boolean;
}

/** Props accepted by the Provider returned from createActionContext(). */
export interface ActionProviderProps<
  T extends ActionPayloadMap,
  TResultMap extends ActionResultMap<T> = {},
> {
  children: ReactNode;
  /**
   * Optional externally constructed ActionRegister instance for headless-first
   * orchestration and dependency injection. When omitted, the Provider creates
   * and owns its own ActionRegister instance.
   */
  register?: ActionRegister<T, TResultMap>;
  /**
   * Controls whether Provider unmount destroys an injected external `register`.
   * Defaults to `'shared'` when `register` is supplied (Provider unregisters
   * React-mounted handlers and aborts Provider dispatches without destroying
   * the external register). Set to `'owned'` to transfer destruction ownership
   * to the Provider. Ignored when `register` is omitted (always `'owned'`).
   */
  ownership?: 'shared' | 'owned';
}

/** Internal Provider-owned dispatch and teardown lifecycle. */
export interface ProviderDispatchLifecycle {
  run<R>(
    externalSignals: Array<AbortSignal | undefined>,
    operation: (signal: AbortSignal) => Promise<R>
  ): Promise<R>;
  scheduleHandlerCleanup(cleanup: () => void): void;
  // biome-ignore lint/suspicious/noExplicitAny: cross-context lifecycle boundary.
  shutdown(register: ActionRegister<any, any>, options?: ProviderShutdownOptions): Promise<void>;
}

/**
 * Return type for createActionContext with abort support
 */
export interface ActionContextReturn<
  T extends ActionPayloadMap,
  TResultMap extends ActionResultMap<T> = {},
> {
  Provider: React.FC<ActionProviderProps<T, TResultMap>>;
  useActionContext: () => ActionContextType<T, TResultMap>;
  useActionDispatch: () => ActionRegister<T, TResultMap>['dispatch'];
  useActionHandler: <K extends ActionNames<T>, R = ActionResult<TResultMap, K>>(
    action: K,
    handler: K extends keyof TResultMap
      ? ActionResultHandler<T[K], ActionResult<TResultMap, K>>
      : ActionContextHandler<T[K], R>,
    config?: HandlerConfig<T[K]>
  ) => void;
  useActionEffectHandler: {
    <K extends ActionNames<T>>(
      action: K,
      handler: ActionGuardHandler<T[K]>,
      config: EffectConfig<T[K]> & { effectKind: 'guard' },
    ): void;
    <K extends ActionNames<T>>(
      action: K,
      handler: ActionEffectHandler<T[K]>,
      config: EffectConfig<T[K]> & { effectKind: 'observer' },
    ): void;
  };
  useActionGuard: <K extends ActionNames<T>>(
    action: K,
    handler: ActionGuardHandler<T[K]>,
    config?: GuardConfig<T[K]>
  ) => void;
  useActionCommandHandler: <K extends ActionNames<T>>(
    action: K,
    handler: ActionCommandHandler<T[K]>,
    config?: CommandConfig<T[K]>
  ) => void;
  useActionObserver: <K extends ActionNames<T>, R = ActionResult<TResultMap, K>>(
    action: K,
    handler: ActionObserverHandler<T[K], R>,
    config?: ObserverConfig<T[K]>
  ) => void;
  useActionResultHandler: <K extends ActionNames<T> & keyof TResultMap>(
    action: K,
    handler: ActionResultHandler<T[K], ActionResult<TResultMap, K>>,
    config?: HandlerConfig<T[K]>
  ) => void;
  useActionRegister: () => ActionRegister<T, TResultMap> | null;
  useActionDispatchWithResult: () => {
    dispatch: ActionRegister<T, TResultMap>['dispatch'];
    dispatchWithResult: ActionRegister<T, TResultMap>['dispatchWithResult'];
    abortAll: () => void;
    resetAbortScope: () => void;
  };
  context: React.Context<ActionContextType<T, TResultMap> | null>;
}
