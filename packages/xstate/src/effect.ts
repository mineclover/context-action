import type {
  ActionDispatchTrace,
  ActionDispatchTraceListener,
  ActionGuardController,
  ActionNames,
  ActionPayloadMap,
  ActionRegister,
  ActionResultMap,
  ActionSchemaLike,
  PipelineController,
  UnregisterFunction,
} from '@context-action/core';
import type { SyncActionPipeline } from '@context-action/core/element';
import type {
  TransactionCoordinatorPort,
  TransactionHandle,
  TransactionOptions,
  TransactionParticipant,
} from '@context-action/store-core';
import {
  type ActorRefLike,
  type BoundActorController,
  type BoundActorHandle,
  isActorTerminated,
  resolveMappedActions,
  type StatechartEventLike,
  type StatechartSnapshotPort,
} from './contracts.js';
import {
  type BindActorActionRegisterOptions,
  bindActorToActionRegister,
} from './pipeline-binding.js';

/** Minimal Standard Schema v1 issue shape (satisfied by Effect v4 `Schema`, Zod, Valibot, etc.). */
export interface StandardSchemaV1Issue {
  readonly message: string;
  readonly path?: ReadonlyArray<PropertyKey | { readonly key: PropertyKey }> | undefined;
}

export type StandardSchemaV1Result<TOutput> =
  | { readonly value: TOutput; readonly issues?: undefined }
  | { readonly issues: readonly StandardSchemaV1Issue[] };

/** Minimal structural subset of `@standard-schema/spec` v1 (`Schema.toStandardSchemaV1`). */
export interface StandardSchemaV1Like<TInput = unknown, TOutput = TInput> {
  readonly '~standard': {
    readonly version?: number | undefined;
    readonly vendor?: string | undefined;
    readonly types?:
      | {
          readonly input?: TInput | undefined;
          readonly output?: TOutput | undefined;
        }
      | undefined;
    validate(
      value: unknown,
    ): StandardSchemaV1Result<TOutput> | Promise<StandardSchemaV1Result<TOutput>>;
  };
}

export interface StandardSchemaGuardOptions {
  readonly id?: string | undefined;
  readonly priority?: number | undefined;
  readonly once?: boolean | undefined;
}

export interface EffectRunOptions {
  readonly signal?: AbortSignal | undefined;
}

/**
 * Effect v3/v4 execution port: accepts either an Effect `ManagedRuntime.runPromise`
 * callable or `{ runPromise(effect, { signal }) }`.
 */
export type EffectRunnerPort<TEffect = unknown> =
  | (<TValue = unknown>(effect: TEffect, options?: EffectRunOptions) => Promise<TValue>)
  | {
      runPromise<TValue = unknown>(effect: TEffect, options?: EffectRunOptions): Promise<TValue>;
    };

export interface RegisterEffectHandlerOptions<TEffect = unknown> {
  readonly runner: EffectRunnerPort<TEffect>;
  readonly priority?: number | undefined;
  readonly id?: string | undefined;
  readonly once?: boolean | undefined;
  readonly blocking?: boolean | undefined;
  readonly abortOnError?: boolean | undefined;
  readonly mapError?: ((error: unknown) => string) | undefined;
}

export interface RegisterEffectGuardOptions<TEffect = unknown> {
  readonly runner: EffectRunnerPort<TEffect>;
  readonly priority?: number | undefined;
  readonly id?: string | undefined;
  readonly once?: boolean | undefined;
  readonly mapError?: ((error: unknown) => string) | undefined;
}

export type EffectGuardDirective<TPayload> =
  // biome-ignore lint/suspicious/noConfusingVoidType: allow Effect<void> guards that perform admission checks without payload transformation.
  | void
  | undefined
  | { readonly modifyPayload: TPayload };

export type EffectScopeCloseableLike =
  | (() => Promise<void> | void)
  | {
      readonly close?: (() => Promise<void> | void) | undefined;
      readonly closeScope?: (() => Promise<void> | void) | undefined;
    };

export interface BindEffectActorOptions<
  TActions extends ActionPayloadMap,
  TEvent extends StatechartEventLike = StatechartEventLike,
  TSnapshot extends StatechartSnapshotPort = StatechartSnapshotPort,
  TEmitted extends StatechartEventLike = StatechartEventLike,
> extends BindActorActionRegisterOptions<TActions, TEvent, TSnapshot, TEmitted> {
  /** Effect `Scope` or close callback torn down when `handle.dispose()` runs. */
  readonly scope?: EffectScopeCloseableLike | undefined;
  /** Automatically invokes `actor.stop()` during `handle.dispose()`. Defaults to `true`. */
  readonly stopActorOnDispose?: boolean | undefined;
}

export type BoundEffectActorHandle<
  TActions extends ActionPayloadMap,
  TSnapshot extends StatechartSnapshotPort = StatechartSnapshotPort,
> = (() => void) &
  BoundActorController<TActions, TSnapshot> & {
    dispose(): Promise<void>;
  };

export interface DispatchTraceSource {
  subscribeDispatchTrace(listener: ActionDispatchTraceListener): () => void;
}

export interface ActionTransactionBridgeOptions {
  getParticipants(event: ActionDispatchTrace): readonly TransactionParticipant[];
}

export interface RunInTransactionScopeOptions extends TransactionOptions {
  readonly signal?: AbortSignal | undefined;
}

interface GenericRegistrar<TActions extends ActionPayloadMap> {
  registerGuard<K extends ActionNames<TActions>>(
    action: K,
    handler: (payload: TActions[K], controller: ActionGuardController<TActions[K]>) => void | Promise<void>,
    config?: { priority?: number; id?: string; once?: boolean },
  ): UnregisterFunction;
  register<K extends ActionNames<TActions>>(
    action: K,
    handler: (
      payload: TActions[K],
      controller: PipelineController<TActions[K], unknown>,
    ) => unknown,
    config?: { priority?: number; id?: string; once?: boolean; blocking?: boolean },
  ): UnregisterFunction;
}

function formatStandardIssues(issues: readonly StandardSchemaV1Issue[]): string {
  return issues
    .map((issue) => {
      if (!issue.path?.length) return issue.message;
      const pathText = issue.path
        .map((segment) => (typeof segment === 'object' ? String(segment.key) : String(segment)))
        .join('.');
      return `${pathText}: ${issue.message}`;
    })
    .join('; ');
}

function isPromiseLike<T>(value: unknown): value is PromiseLike<T> {
  return (
    (typeof value === 'object' || typeof value === 'function')
    && value !== null
    && typeof (value as { then?: unknown }).then === 'function'
  );
}

function isSyncActionPipeline(
  target: object,
): target is SyncActionPipeline<Record<string, unknown>> {
  return (
    'dispatch' in target
    && !('dispatchWithResult' in target)
  );
}

function formatEffectError(error: unknown, mapError?: (error: unknown) => string): string {
  if (mapError) return mapError(error);
  return error instanceof Error ? error.message : String(error);
}

async function runWithPort<TValue, TEffect>(
  runner: EffectRunnerPort<TEffect>,
  effect: TEffect,
  options: EffectRunOptions,
): Promise<TValue> {
  if (typeof runner === 'function') {
    return runner<TValue>(effect, options);
  }
  return runner.runPromise<TValue>(effect, options);
}

async function closeEffectScope(
  scope: EffectScopeCloseableLike | undefined,
  actor: unknown,
  stopActorOnDispose = true,
): Promise<void> {
  if (typeof scope === 'function') {
    await scope();
  } else if (scope?.closeScope) {
    await scope.closeScope();
  } else if (scope?.close) {
    await scope.close();
  } else {
    const actorScope = actor as {
      closeScope?: () => Promise<void> | void;
      close?: () => Promise<void> | void;
    } | null;
    if (typeof actorScope?.closeScope === 'function') {
      await actorScope.closeScope();
    } else if (typeof actorScope?.close === 'function') {
      await actorScope.close();
    }
  }

  if (stopActorOnDispose) {
    const stoppable = actor as { stop?: () => unknown } | null;
    if (typeof stoppable?.stop === 'function') {
      stoppable.stop();
    }
  }
}

/**
 * Adapts a `@standard-schema/spec` v1 schema (including Effect v4 `Schema.toStandardSchemaV1`)
 * into `@context-action/core`'s synchronous `ActionSchemaLike` contract for `new ActionRegister({ schema })`.
 */
export function fromStandardSchema<TInput = unknown, TOutput = TInput>(
  schema: StandardSchemaV1Like<TInput, TOutput>,
): ActionSchemaLike {
  return {
    safeParse(value: unknown) {
      const result = schema['~standard'].validate(value);
      if (isPromiseLike<StandardSchemaV1Result<TOutput>>(result)) {
        const message =
          'Async Standard Schema validation is not supported by ActionSchemaLike.safeParse; register via registerStandardSchemaGuard(register, ...) instead';
        return {
          success: false as const,
          error: {
            message,
            issues: [{ message }],
          },
        };
      }
      if (result.issues && result.issues.length > 0) {
        return {
          success: false as const,
          error: {
            message: formatStandardIssues(result.issues),
            issues: result.issues.map((issue) => {
              const path = issue.path?.map((segment) =>
                typeof segment === 'object' && segment !== null && 'key' in segment
                  ? segment.key
                  : segment,
              );
              return path === undefined
                ? { message: issue.message }
                : { message: issue.message, path };
            }),
          },
        };
      }
      return {
        success: true as const,
        data: (result as { readonly value: TOutput }).value,
      };
    },
  };
}

/**
 * Registers a Standard Schema v1 (or Effect v4 `Schema`) validation + normalization
 * Guard onto either an async `ActionRegister` or a synchronous `SyncActionPipeline`.
 */
export function registerStandardSchemaGuard<
  TActions extends ActionPayloadMap,
  TResultMap extends ActionResultMap<TActions>,
  K extends ActionNames<TActions>,
>(
  target: ActionRegister<TActions, TResultMap>,
  action: K,
  schema: StandardSchemaV1Like<TActions[K], TActions[K]>,
  options?: StandardSchemaGuardOptions,
): UnregisterFunction;
export function registerStandardSchemaGuard<
  TActions extends Record<string, unknown>,
  K extends keyof TActions & string,
>(
  target: SyncActionPipeline<TActions>,
  action: K,
  schema: StandardSchemaV1Like<TActions[K], TActions[K]>,
  options?: StandardSchemaGuardOptions,
): () => void;
export function registerStandardSchemaGuard<
  TActions extends ActionPayloadMap,
  K extends ActionNames<TActions>,
>(
  target: ActionRegister<TActions, ActionResultMap<TActions>> | SyncActionPipeline<Record<string, unknown>>,
  action: K,
  schema: StandardSchemaV1Like<TActions[K], TActions[K]>,
  options: StandardSchemaGuardOptions = {},
): UnregisterFunction {
  const guardConfig = {
    id: options.id ?? `standard-schema-${action}`,
    priority: options.priority ?? 100,
    ...(options.once !== undefined ? { once: options.once } : {}),
  };

  if (isSyncActionPipeline(target)) {
    return target.registerGuard(
      action,
      (payload, controller) => {
        const outcome = schema['~standard'].validate(payload);
        if (isPromiseLike(outcome)) {
          controller.abort('Async Standard Schema validation is not supported in SyncActionPipeline');
          return;
        }
        const syncResult = outcome as StandardSchemaV1Result<TActions[K]>;
        if (syncResult.issues && syncResult.issues.length > 0) {
          controller.abort(formatStandardIssues(syncResult.issues));
          return;
        }
        if ('value' in syncResult) {
          controller.modifyPayload(() => syncResult.value);
        }
      },
      guardConfig,
    );
  }

  const registrar = target as unknown as GenericRegistrar<TActions>;
  return registrar.registerGuard(
    action,
    async (payload, controller) => {
      const result = await schema['~standard'].validate(payload);
      if (result.issues && result.issues.length > 0) {
        controller.abort(formatStandardIssues(result.issues));
        return;
      }
      if ('value' in result) {
        controller.modifyPayload(() => result.value);
      }
    },
    guardConfig,
  );
}

/**
 * Registers an Effect program as an `ActionRegister` handler, forwarding `controller.signal`
 * into the Effect runner for Fiber interruption on timeout or abort.
 */
export function registerEffectHandler<
  TActions extends ActionPayloadMap,
  TResultMap extends ActionResultMap<TActions>,
  K extends ActionNames<TActions>,
  TEffect = unknown,
>(
  register: ActionRegister<TActions, TResultMap>,
  action: K,
  buildEffect: (payload: TActions[K], controller: PipelineController<TActions[K], unknown>) => TEffect,
  options: RegisterEffectHandlerOptions<TEffect>,
): UnregisterFunction {
  const registrar = register as unknown as GenericRegistrar<TActions>;
  return registrar.register(
    action,
    async (payload, controller) => {
      try {
        const effect = buildEffect(payload, controller);
        const value = await runWithPort(options.runner, effect, {
          signal: controller.signal,
        });
        if (value !== undefined) {
          controller.setResult(value);
        }
        return value;
      } catch (error) {
        if (options.abortOnError) {
          controller.abort(formatEffectError(error, options.mapError));
          return undefined;
        }
        throw error;
      }
    },
    {
      id: options.id ?? `effect-handler-${action}`,
      ...(options.priority !== undefined ? { priority: options.priority } : {}),
      ...(options.once !== undefined ? { once: options.once } : {}),
      ...(options.blocking !== undefined ? { blocking: options.blocking } : {}),
    },
  );
}

/**
 * Registers an Effect program as an `ActionRegister` admission guard (`registerGuard`).
 * Failures abort the dispatch; returning `{ modifyPayload }` transforms the action payload.
 */
export function registerEffectGuard<
  TActions extends ActionPayloadMap,
  TResultMap extends ActionResultMap<TActions>,
  K extends ActionNames<TActions>,
  TEffect = unknown,
>(
  register: ActionRegister<TActions, TResultMap>,
  action: K,
  buildEffect: (payload: TActions[K], controller: ActionGuardController<TActions[K]>) => TEffect,
  options: RegisterEffectGuardOptions<TEffect>,
): UnregisterFunction {
  const registrar = register as unknown as GenericRegistrar<TActions>;
  return registrar.registerGuard(
    action,
    async (payload, controller) => {
      try {
        const effect = buildEffect(payload, controller);
        const directive = await runWithPort<EffectGuardDirective<TActions[K]>, TEffect>(
          options.runner,
          effect,
          { signal: controller.signal },
        );
        if (directive && typeof directive === 'object' && 'modifyPayload' in directive) {
          controller.modifyPayload(() => directive.modifyPayload);
        }
      } catch (error) {
        controller.abort(formatEffectError(error, options.mapError));
      }
    },
    {
      id: options.id ?? `effect-guard-${action}`,
      priority: options.priority ?? 100,
      ...(options.once !== undefined ? { once: options.once } : {}),
    },
  );
}

/**
 * Mounts an `@xstate/effect` `ActorRefLike` onto an `@context-action/core` `ActionRegister`
 * and binds its lifecycle to an Effect `Scope` so `dispose()` unmounts handlers and
 * closes/interrupts the underlying Effect scope deterministically.
 */
export function bindEffectActorToActionRegister<
  TActions extends ActionPayloadMap,
  TResultMap extends ActionResultMap<TActions> = ActionResultMap<TActions>,
  TEvent extends StatechartEventLike = StatechartEventLike,
  TSnapshot extends StatechartSnapshotPort = StatechartSnapshotPort,
  TEmitted extends StatechartEventLike = StatechartEventLike,
>(
  register: ActionRegister<TActions, TResultMap>,
  actor: ActorRefLike<TEvent, TSnapshot>,
  options: BindEffectActorOptions<TActions, TEvent, TSnapshot, TEmitted>,
): BoundEffectActorHandle<TActions, TSnapshot> {
  const registrar = register as unknown as GenericRegistrar<TActions>;
  const mappedBindings = resolveMappedActions(options);
  const toEventByAction = new Map(
    mappedBindings.map((entry) => [entry.action, entry.toEvent] as const),
  );
  let unbound = false;
  let disposed = false;

  const disposalGuards: UnregisterFunction[] = [];
  for (const { action } of mappedBindings) {
    disposalGuards.push(
      registrar.registerGuard(
        action,
        (_payload, controller) => {
          if (disposed || unbound) {
            controller.abort(`Effect actor bridge for "${action}" has been disposed`);
          }
        },
        { priority: (options.guardPriority ?? 100) + 1, id: `effect-actor-alive-${action}` },
      ),
    );
  }

  let boundHandle: BoundActorHandle<TActions, TSnapshot>;
  try {
    boundHandle = bindActorToActionRegister(register, actor, options);
  } catch (error) {
    for (const unregister of disposalGuards) {
      try {
        unregister();
      } catch {
        // Best-effort rollback of earlier guards.
      }
    }
    disposalGuards.length = 0;
    throw error;
  }

  const unbind = (): void => {
    if (unbound) return;
    unbound = true;
    for (const unregister of disposalGuards) {
      unregister();
    }
    disposalGuards.length = 0;
    boundHandle.unbind();
  };

  const handle = (() => {
    unbind();
  }) as BoundEffectActorHandle<TActions, TSnapshot>;

  return Object.assign(handle, {
    unbind,
    getSnapshot: () => actor.getSnapshot(),
    canDispatch(action: ActionNames<TActions>, ...args: unknown[]) {
      if (disposed || unbound) return false;
      const toEvent = toEventByAction.get(action);
      if (!toEvent) return false;
      const snapshot = actor.getSnapshot();
      if (isActorTerminated(snapshot)) return false;
      const event = toEvent(args[0] as TActions[ActionNames<TActions>]);
      return typeof snapshot.can === 'function' ? snapshot.can(event) : true;
    },
    isDisposed: () => disposed || unbound,
    async dispose() {
      if (disposed) return;
      disposed = true;
      unbind();
      await closeEffectScope(options.scope, actor, options.stopActorOnDispose ?? true);
    },
  });
}

/**
 * Framework-neutral equivalent of React's `bindActionTransactions()`:
 * connects `ActionRegister.subscribeDispatchTrace` directly to a
 * `@context-action/store-core` `TransactionCoordinatorPort`.
 */
export function bindActionDispatchTransactions(
  source: DispatchTraceSource,
  coordinator: TransactionCoordinatorPort,
  options: ActionTransactionBridgeOptions,
): () => void {
  const pending = new Map<string, TransactionHandle>();
  const unsubscribe = source.subscribeDispatchTrace((event) => {
    if (event.phase === 'started') {
      const participants = options.getParticipants(event);
      if (participants.length === 0) return;
      const handle = coordinator.begin(participants, {
        ...(event.transactionId === undefined ? {} : { transactionId: event.transactionId }),
        actionId: event.dispatchId,
        ...(event.origin === undefined ? {} : { origin: event.origin }),
        label: event.label ?? event.action,
      });
      pending.set(event.dispatchId, handle);
      return;
    }

    const handle = pending.get(event.dispatchId);
    if (!handle) return;
    pending.delete(event.dispatchId);
    if (event.status === 'completed' || event.status === 'completed_with_errors') {
      handle.commit();
    } else {
      handle.rollback();
    }
  });

  return () => {
    unsubscribe();
    for (const handle of pending.values()) {
      handle.rollback();
    }
    pending.clear();
  };
}

function toTransactionAbortError(signal: AbortSignal, fallback: string): Error {
  const reason = signal.reason;
  if (reason instanceof Error) return reason;
  return new Error(typeof reason === 'string' && reason.length > 0 ? reason : fallback);
}

/**
 * Coordinates a multi-store `@context-action/store-core` transaction across async Effect/Promise
 * execution: commits on normal completion and guarantees idempotent `rollback()` on error or
 * `AbortSignal` / Fiber interruption.
 */
export async function runInTransactionScope<TResult>(
  coordinator: TransactionCoordinatorPort,
  participants: readonly TransactionParticipant[],
  task: (tx: TransactionHandle) => TResult | Promise<TResult>,
  options: RunInTransactionScopeOptions = {},
): Promise<TResult> {
  const { signal, ...txOptions } = options;

  if (signal?.aborted) {
    throw toTransactionAbortError(signal, 'Transaction aborted before start');
  }

  const tx = coordinator.begin(participants, txOptions);
  let settled = false;

  const rollbackOnce = (): void => {
    if (settled) return;
    settled = true;
    tx.rollback();
  };

  if (!signal) {
    try {
      const result = await task(tx);
      settled = true;
      tx.commit();
      return result;
    } catch (error) {
      rollbackOnce();
      throw error;
    }
  }

  return new Promise<TResult>((resolve, reject) => {
    const onAbort = (): void => {
      try {
        rollbackOnce();
      } catch {
        // Ensure the returned promise still rejects with the abort reason.
      }
      reject(toTransactionAbortError(signal, 'Transaction aborted by signal'));
    };

    signal.addEventListener('abort', onAbort, { once: true });

    Promise.resolve()
      .then(() => task(tx))
      .then(
        (result) => {
          signal.removeEventListener('abort', onAbort);
          if (settled || signal.aborted) {
            try {
              rollbackOnce();
            } catch {
              // Ensure the returned promise still rejects with the abort reason.
            }
            reject(toTransactionAbortError(signal, 'Transaction aborted by signal'));
            return;
          }
          settled = true;
          try {
            tx.commit();
            resolve(result);
          } catch (commitError) {
            reject(commitError);
          }
        },
        (error) => {
          signal.removeEventListener('abort', onAbort);
          if (settled) return;
          try {
            rollbackOnce();
          } catch {
            // Preserve the task rejection if rollback also throws.
          }
          reject(error);
        },
      );
  });
}
