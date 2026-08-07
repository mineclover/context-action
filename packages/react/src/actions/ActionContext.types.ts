/**
 * @fileoverview ActionContext Type Definitions
 *
 * Core type definitions for the ActionContext system.
 * Only includes types that are actually used in ActionContext.tsx implementation.
 */

import {
  ActionRegister,
  ActionRegisterConfig,
  ActionResult,
  ActionResultHandler,
  ActionResultMap,
  ActionPayloadMap,
  HandlerConfig,
  PipelineController,
} from '@context-action/core';
import type { ActionSchemaMap } from '@context-action/tool-protocol';
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
 * Extends ActionRegisterConfig with optional Zod schema validation.
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
   * When provided, enables Zod-based validation on dispatch
   * Shorthand for config.registry.schema
   */
  schema?: ActionSchemaMap;
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

/** Internal Provider-owned dispatch and teardown lifecycle. */
export interface ProviderDispatchLifecycle {
  run<R>(
    externalSignals: Array<AbortSignal | undefined>,
    operation: (signal: AbortSignal) => Promise<R>
  ): Promise<R>;
  scheduleHandlerCleanup(cleanup: () => void): void;
  // biome-ignore lint/suspicious/noExplicitAny: cross-context lifecycle boundary.
  shutdown(register: ActionRegister<any, any>): Promise<void>;
}

/**
 * Return type for createActionContext with abort support
 */
export interface ActionContextReturn<
  T extends ActionPayloadMap,
  TResultMap extends ActionResultMap<T> = {},
> {
  Provider: React.FC<{ children: ReactNode }>;
  useActionContext: () => ActionContextType<T, TResultMap>;
  useActionDispatch: () => ActionRegister<T, TResultMap>['dispatch'];
  useActionHandler: <K extends keyof T, R = ActionResult<TResultMap, K>>(
    action: K,
    handler: K extends keyof TResultMap
      ? ActionResultHandler<T[K], ActionResult<TResultMap, K>>
      : ActionContextHandler<T[K], R>,
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
