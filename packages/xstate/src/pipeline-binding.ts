import type {
  ActionGuardController,
  ActionNames,
  ActionPayloadMap,
  ActionRegister,
  ActionResultMap,
  DispatchArgs,
  DispatchOptions,
  PipelineController,
  UnregisterFunction,
} from '@context-action/core';
import type { SyncActionPipeline, SyncDispatchOutcome } from '@context-action/core/element';
import {
  type ActionToEventMap,
  type ActorRefLike,
  type BoundActorHandle,
  detachActorSubscription,
  type EmitArgs,
  isActorTerminated,
  resolveMappedActions,
  type StatechartEventLike,
  type StatechartSnapshotPort,
  type StatechartSubscriptionLike,
} from './contracts.js';

export interface WaitForActorOptions {
  readonly signal?: AbortSignal | undefined;
  readonly timeoutMs?: number | undefined;
}

export type ActorEmissionEntry<
  TActions extends ActionPayloadMap,
  TEmitted extends StatechartEventLike = StatechartEventLike,
> =
  | ActionNames<TActions>
  | ((
      emitted: TEmitted,
      emitter: ActorActionEmitter<TActions>,
    ) => void | Promise<void>);

export type ActorEmissionMap<
  TActions extends ActionPayloadMap,
  TEmitted extends StatechartEventLike = StatechartEventLike,
> = {
  readonly [TEmittedType in TEmitted['type']]?: ActorEmissionEntry<
    TActions,
    Extract<TEmitted, { readonly type: TEmittedType }>
  >;
};

export interface BindActorEmissionsOptions {
  readonly onError?: ((error: unknown, emittedType: string) => void) | undefined;
}

export interface BindActorPipelineOptions<
  TActions extends ActionPayloadMap,
  TEvent extends StatechartEventLike = StatechartEventLike,
  TEmitted extends StatechartEventLike = StatechartEventLike,
> {
  readonly map?: ActionToEventMap<TActions, TEvent> | undefined;
  readonly actions?: readonly ActionNames<TActions>[] | undefined;
  toEvent?<K extends ActionNames<TActions>>(action: K, payload: TActions[K]): TEvent;
  /** Routes outbound XState `emit()` events (`actor.on(type, ...)`) back into this pipeline/register. */
  readonly emissions?: ActorEmissionMap<TActions, TEmitted> | undefined;
  readonly onEmissionError?: ((error: unknown, emittedType: string) => void) | undefined;
  readonly enforceCanGuard?: boolean | undefined;
  readonly guardPriority?: number | undefined;
  readonly handlerPriority?: number | undefined;
}

export type WaitForPredicateByAction<
  TActions extends ActionPayloadMap,
  TEvent extends StatechartEventLike,
  TSnapshot extends StatechartSnapshotPort,
> = {
  readonly [K in ActionNames<TActions>]?: (
    snapshot: TSnapshot,
    event: TEvent,
    payload: TActions[K],
  ) => boolean;
};

export interface BindActorActionRegisterOptions<
  TActions extends ActionPayloadMap,
  TEvent extends StatechartEventLike = StatechartEventLike,
  TSnapshot extends StatechartSnapshotPort = StatechartSnapshotPort,
  TEmitted extends StatechartEventLike = StatechartEventLike,
> extends BindActorPipelineOptions<TActions, TEvent, TEmitted> {
  /** Optional global predicate for waiting until the actor settles after `send(event)`. */
  readonly waitFor?: ((snapshot: TSnapshot, event: TEvent) => boolean) | undefined;
  /** Optional per-action predicate overriding `waitFor` for specific actions. */
  readonly waitForByAction?: WaitForPredicateByAction<TActions, TEvent, TSnapshot> | undefined;
  /** Timeout (ms) applied when `waitFor` / `waitForByAction` is used. */
  readonly timeoutMs?: number | undefined;
  /** Sets `blocking` on registered handlers. Defaults to true when waiting, undefined otherwise. */
  readonly blocking?: boolean | undefined;
}

export interface ActorActionEmitterOptions {
  readonly onError?: ((error: unknown, action: string) => void) | undefined;
}

export interface ActorActionEmitter<TActions extends ActionPayloadMap> {
  emit<K extends ActionNames<TActions>>(
    action: K,
    ...args: EmitArgs<TActions[K]>
  ): Promise<void> | SyncDispatchOutcome<TActions[K], unknown>;
  enqueue<K extends ActionNames<TActions>>(
    enq: (effect: () => void) => void,
    action: K,
    ...args: EmitArgs<TActions[K]>
  ): void;
}

interface GenericActionRegistrar<TActions extends ActionPayloadMap> {
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

interface GenericActionDispatcher<TActions extends ActionPayloadMap> {
  dispatch<K extends ActionNames<TActions>>(action: K, ...args: DispatchArgs<TActions[K]>): Promise<void>;
  dispatchWithResult<K extends ActionNames<TActions>, R = unknown>(
    action: K,
    payload?: TActions[K],
    options?: DispatchOptions,
  ): Promise<{ result: R | undefined }>;
}

function toAbortError(signal: AbortSignal | undefined, fallbackMessage: string): Error {
  const reason = signal?.reason;
  if (reason instanceof Error) return reason;
  const error = new Error(typeof reason === 'string' && reason.length > 0 ? reason : fallbackMessage);
  error.name = 'AbortError';
  return error;
}

function toTerminalError(snapshot: StatechartSnapshotPort): Error {
  if (snapshot.error instanceof Error) return snapshot.error;
  return new Error(
    snapshot.error !== undefined
      ? String(snapshot.error)
      : `Actor terminated with status "${snapshot.status ?? 'stopped'}" before satisfying predicate`,
  );
}

/**
 * Awaits an `ActorRefLike` snapshot satisfying `predicate`.
 * Supports a 0ms synchronous fast-path if the current snapshot already matches,
 * plus cooperative cancellation via `AbortSignal` (`controller.signal`) and `timeoutMs`.
 */
export function waitForActorSnapshot<TSnapshot extends StatechartSnapshotPort>(
  actor: Pick<ActorRefLike<never, TSnapshot>, 'getSnapshot' | 'subscribe'>,
  predicate: (snapshot: TSnapshot) => boolean,
  options: WaitForActorOptions = {},
): Promise<TSnapshot> {
  const { signal, timeoutMs } = options;

  if (signal?.aborted) {
    return Promise.reject(toAbortError(signal, 'Aborted while waiting for actor snapshot'));
  }

  if (timeoutMs !== undefined && (!Number.isFinite(timeoutMs) || timeoutMs < 0)) {
    return Promise.reject(new RangeError('timeoutMs must be a non-negative finite number'));
  }

  const initial = actor.getSnapshot();
  if (predicate(initial)) {
    return Promise.resolve(initial);
  }
  if (initial.status === 'error' || initial.status === 'done' || initial.status === 'stopped') {
    return Promise.reject(toTerminalError(initial));
  }

  return new Promise<TSnapshot>((resolve, reject) => {
    let settled = false;
    let subscription: StatechartSubscriptionLike | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const cleanup = (): void => {
      detachActorSubscription(subscription);
      subscription = undefined;
      if (timer !== undefined) {
        clearTimeout(timer);
        timer = undefined;
      }
      if (signal) {
        signal.removeEventListener('abort', onAbort);
      }
    };

    const settleResolve = (snap: TSnapshot): void => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(snap);
    };

    const settleReject = (error: unknown): void => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };

    const inspectSnapshot = (snap: TSnapshot): void => {
      try {
        if (predicate(snap)) {
          settleResolve(snap);
          return;
        }
      } catch (predicateError) {
        settleReject(predicateError);
        return;
      }
      if (snap.status === 'error' || snap.status === 'done' || snap.status === 'stopped') {
        settleReject(toTerminalError(snap));
      }
    };

    const onAbort = (): void => {
      settleReject(toAbortError(signal, 'Aborted while waiting for actor snapshot'));
    };

    if (signal) {
      signal.addEventListener('abort', onAbort, { once: true });
    }

    if (timeoutMs !== undefined) {
      timer = setTimeout(() => {
        settleReject(new Error(`Timed out after ${timeoutMs}ms waiting for actor snapshot`));
      }, timeoutMs);
    }

    try {
      subscription = actor.subscribe({
        next(nextSnapshot) {
          inspectSnapshot(nextSnapshot);
        },
        error(err) {
          settleReject(err);
        },
        complete() {
          inspectSnapshot(actor.getSnapshot());
          if (!settled) {
            settleReject(new Error('Actor completed before satisfying predicate'));
          }
        },
      });

      if (settled) {
        cleanup();
      } else {
        inspectSnapshot(actor.getSnapshot());
      }
    } catch (error) {
      settleReject(error);
    }
  });
}

function extractEmittedPayload(emitted: StatechartEventLike): unknown {
  if ('payload' in emitted) {
    return emitted.payload;
  }
  const rest: Record<string, unknown> = {};
  let hasFields = false;
  for (const key of Object.keys(emitted)) {
    if (key === 'type') continue;
    rest[key] = emitted[key];
    hasFields = true;
  }
  return hasFields ? rest : undefined;
}

function createBoundActorHandle<
  TActions extends ActionPayloadMap,
  TEvent extends StatechartEventLike,
  TSnapshot extends StatechartSnapshotPort,
>(
  actor: ActorRefLike<TEvent, TSnapshot>,
  toEventByAction: Map<ActionNames<TActions>, (payload: TActions[ActionNames<TActions>]) => TEvent>,
  cleanupAll: () => void,
): BoundActorHandle<TActions, TSnapshot> {
  let disposed = false;

  const unbind = (): void => {
    if (disposed) return;
    disposed = true;
    cleanupAll();
  };

  const handle = (() => {
    unbind();
  }) as BoundActorHandle<TActions, TSnapshot>;

  return Object.assign(handle, {
    unbind,
    dispose: unbind,
    getSnapshot: () => actor.getSnapshot(),
    canDispatch<K extends ActionNames<TActions>>(
      action: K,
      ...args: EmitArgs<TActions[K]>
    ): boolean {
      if (disposed) return false;
      const toEvent = toEventByAction.get(action);
      if (!toEvent) return false;
      const snapshot = actor.getSnapshot();
      if (isActorTerminated(snapshot)) return false;
      const event = toEvent(args[0] as TActions[ActionNames<TActions>]);
      return typeof snapshot.can === 'function' ? snapshot.can(event) : true;
    },
    isDisposed: () => disposed,
  });
}

function attachEmissionsIfPresent<
  TActions extends ActionPayloadMap,
  TEmitted extends StatechartEventLike,
>(
  actor: Pick<ActorRefLike<StatechartEventLike, StatechartSnapshotPort>, 'on'>,
  target: ActionRegister<TActions, ActionResultMap<TActions>> | SyncActionPipeline<Record<string, unknown>>,
  emissions: ActorEmissionMap<TActions, TEmitted> | undefined,
  onError: ((error: unknown, emittedType: string) => void) | undefined,
): () => void {
  if (!emissions) return () => {};
  const entries = Object.entries(emissions);
  if (entries.length === 0) return () => {};
  if (typeof actor.on !== 'function') {
    throw new TypeError('bindActorEmissions requires an actor implementing actor.on(type, handler).');
  }

  const emitter = createActorActionEmitter(
    target as ActionRegister<TActions, ActionResultMap<TActions>>,
    onError ? { onError } : undefined,
  ) as unknown as ActorActionEmitter<TActions>;

  const subscriptions: StatechartSubscriptionLike[] = [];
  for (const [emittedType, handlerOrAction] of entries) {
    if (handlerOrAction === undefined) continue;
    subscriptions.push(
      actor.on(emittedType, (emittedEvent) => {
        try {
          let maybePromise: unknown;
          if (typeof handlerOrAction === 'function') {
            maybePromise = (
              handlerOrAction as (
                event: StatechartEventLike,
                e: ActorActionEmitter<TActions>,
              ) => unknown
            )(emittedEvent, emitter);
          } else if (typeof handlerOrAction === 'string') {
            const payload = extractEmittedPayload(emittedEvent);
            const emitFn = emitter.emit as (action: string, ...args: unknown[]) => unknown;
            maybePromise = payload !== undefined
              ? emitFn(handlerOrAction, payload)
              : emitFn(handlerOrAction);
          }
          if (maybePromise && typeof (maybePromise as Promise<unknown>).catch === 'function') {
            (maybePromise as Promise<unknown>).catch((error) => {
              onError?.(error, emittedType);
            });
          }
        } catch (error) {
          onError?.(error, emittedType);
        }
      }),
    );
  }

  return () => {
    for (const subscription of subscriptions) {
      detachActorSubscription(subscription);
    }
    subscriptions.length = 0;
  };
}

/**
 * Routes outbound XState v5/v6 `emit()` events (`actor.on(type, handler)`) directly into
 * a Context-Action `ActionRegister` or `SyncActionPipeline`.
 */
export function bindActorEmissions<
  TActions extends ActionPayloadMap,
  TResultMap extends ActionResultMap<TActions> = ActionResultMap<TActions>,
  TEmitted extends StatechartEventLike = StatechartEventLike,
>(
  actor: Pick<ActorRefLike<StatechartEventLike, StatechartSnapshotPort>, 'on'>,
  target: ActionRegister<TActions, TResultMap>,
  emissions: ActorEmissionMap<TActions, TEmitted>,
  options?: BindActorEmissionsOptions,
): () => void;
export function bindActorEmissions<
  TActions extends Record<string, unknown>,
  TEmitted extends StatechartEventLike = StatechartEventLike,
>(
  actor: Pick<ActorRefLike<StatechartEventLike, StatechartSnapshotPort>, 'on'>,
  target: SyncActionPipeline<TActions>,
  emissions: ActorEmissionMap<TActions, TEmitted>,
  options?: BindActorEmissionsOptions,
): () => void;
export function bindActorEmissions<
  TActions extends ActionPayloadMap,
  TEmitted extends StatechartEventLike = StatechartEventLike,
>(
  actor: Pick<ActorRefLike<StatechartEventLike, StatechartSnapshotPort>, 'on'>,
  target:
    | ActionRegister<TActions, ActionResultMap<TActions>>
    | SyncActionPipeline<Record<string, unknown>>,
  emissions: ActorEmissionMap<TActions, TEmitted>,
  options: BindActorEmissionsOptions = {},
): () => void {
  return attachEmissionsIfPresent(actor, target, emissions, options.onError);
}

/**
 * Mounts an XState v5/v6 `ActorRefLike` onto a synchronous `SyncActionPipeline`
 * (`@context-action/core/element`) for 0ms DOM interaction gating and dispatch.
 */
export function bindActorToSyncPipeline<
  TActions extends Record<string, unknown>,
  TEvent extends StatechartEventLike = StatechartEventLike,
  TSnapshot extends StatechartSnapshotPort = StatechartSnapshotPort,
  TEmitted extends StatechartEventLike = StatechartEventLike,
>(
  pipeline: SyncActionPipeline<TActions>,
  actor: ActorRefLike<TEvent, TSnapshot>,
  options: BindActorPipelineOptions<TActions, TEvent, TEmitted>,
): BoundActorHandle<TActions, TSnapshot> {
  const enforceCanGuard = options.enforceCanGuard ?? true;
  const guardPriority = options.guardPriority ?? 100;
  const handlerPriority = options.handlerPriority ?? 20;
  const bindings = resolveMappedActions(options);
  const toEventByAction = new Map(bindings.map((entry) => [entry.action, entry.toEvent] as const));
  const unregisters: Array<() => void> = [];
  let detachEmissions: () => void = () => {};

  try {
    for (const { action, toEvent } of bindings) {
      if (enforceCanGuard) {
        unregisters.push(
          pipeline.registerGuard(
            action,
            (payload, controller) => {
              const event = toEvent(payload);
              const snapshot = actor.getSnapshot();
              if (isActorTerminated(snapshot)) {
                controller.abort(
                  `Transition "${event.type}" denied because actor status is "${snapshot.status}"`,
                );
                return;
              }
              if (typeof snapshot.can === 'function' && !snapshot.can(event)) {
                controller.abort(
                  `Transition "${event.type}" denied in state "${String(snapshot.value)}"`,
                );
              }
            },
            { priority: guardPriority, id: `statechart-can-${action}` },
          ),
        );
      }

      unregisters.push(
        pipeline.register(
          action,
          (payload) => {
            const event = toEvent(payload);
            actor.send(event);
            return actor.getSnapshot();
          },
          { priority: handlerPriority, id: `statechart-send-${action}` },
        ),
      );
    }

    detachEmissions = attachEmissionsIfPresent(
      actor,
      pipeline as SyncActionPipeline<Record<string, unknown>>,
      options.emissions,
      options.onEmissionError,
    );
  } catch (error) {
    for (const unregister of unregisters) {
      try {
        unregister();
      } catch {
        // Best-effort rollback of earlier registrations.
      }
    }
    unregisters.length = 0;
    throw error;
  }

  return createBoundActorHandle(actor, toEventByAction, () => {
    detachEmissions();
    for (const unregister of unregisters) {
      unregister();
    }
    unregisters.length = 0;
  });
}

/** Compatibility alias preserving earlier draft terminology. */
export const bindStatechartToSyncPipeline = bindActorToSyncPipeline;

/**
 * Mounts an XState v5/v6 or `@xstate/effect` `ActorRefLike` directly onto an
 * `@context-action/core` `ActionRegister` using Guard admission (`snapshot.can`)
 * and Result handler dispatch (`actor.send` + optional `waitForActorSnapshot`).
 */
export function bindActorToActionRegister<
  TActions extends ActionPayloadMap,
  TResultMap extends ActionResultMap<TActions> = ActionResultMap<TActions>,
  TEvent extends StatechartEventLike = StatechartEventLike,
  TSnapshot extends StatechartSnapshotPort = StatechartSnapshotPort,
  TEmitted extends StatechartEventLike = StatechartEventLike,
>(
  register: ActionRegister<TActions, TResultMap>,
  actor: ActorRefLike<TEvent, TSnapshot>,
  options: BindActorActionRegisterOptions<TActions, TEvent, TSnapshot, TEmitted>,
): BoundActorHandle<TActions, TSnapshot> {
  const registrar = register as unknown as GenericActionRegistrar<TActions>;
  const enforceCanGuard = options.enforceCanGuard ?? true;
  const guardPriority = options.guardPriority ?? 100;
  const handlerPriority = options.handlerPriority ?? 20;
  const bindings = resolveMappedActions(options);
  const toEventByAction = new Map(bindings.map((entry) => [entry.action, entry.toEvent] as const));
  const unregisters: UnregisterFunction[] = [];
  let detachEmissions: () => void = () => {};

  try {
    for (const { action, toEvent } of bindings) {
      if (enforceCanGuard) {
        unregisters.push(
          registrar.registerGuard(
            action,
            (payload, controller) => {
              const event = toEvent(payload);
              const snapshot = actor.getSnapshot();
              if (isActorTerminated(snapshot)) {
                controller.abort(
                  `Transition "${event.type}" denied because actor status is "${snapshot.status}"`,
                );
                return;
              }
              if (typeof snapshot.can === 'function' && !snapshot.can(event)) {
                controller.abort(
                  `Transition "${event.type}" denied in state "${String(snapshot.value)}"`,
                );
              }
            },
            { priority: guardPriority, id: `xstate-can-${action}` },
          ),
        );
      }

      const actionWaitFor = options.waitForByAction?.[action];
      const hasWaitFor = actionWaitFor !== undefined || options.waitFor !== undefined;
      const blocking = options.blocking ?? (hasWaitFor ? true : undefined);

      unregisters.push(
        registrar.register(
          action,
          async (payload, controller) => {
            const event = toEvent(payload);
            actor.send(event);

            if (!hasWaitFor) {
              const nextSnapshot = actor.getSnapshot();
              controller.setResult(nextSnapshot);
              return nextSnapshot;
            }

            const predicate = (snapshot: TSnapshot): boolean => {
              if (actionWaitFor) {
                return actionWaitFor(snapshot, event, payload);
              }
              return options.waitFor ? options.waitFor(snapshot, event) : true;
            };

            const settledSnapshot = await waitForActorSnapshot(actor, predicate, {
              signal: controller.signal,
              timeoutMs: options.timeoutMs,
            });
            controller.setResult(settledSnapshot);
            return settledSnapshot;
          },
          {
            priority: handlerPriority,
            id: `xstate-send-${action}`,
            ...(blocking !== undefined ? { blocking } : {}),
          },
        ),
      );
    }

    detachEmissions = attachEmissionsIfPresent(
      actor,
      register as unknown as ActionRegister<TActions, ActionResultMap<TActions>>,
      options.emissions,
      options.onEmissionError,
    );
  } catch (error) {
    for (const unregister of unregisters) {
      try {
        unregister();
      } catch {
        // Best-effort rollback of earlier registrations.
      }
    }
    unregisters.length = 0;
    throw error;
  }

  return createBoundActorHandle(actor, toEventByAction, () => {
    detachEmissions();
    for (const unregister of unregisters) {
      unregister();
    }
    unregisters.length = 0;
  });
}

/**
 * Standardized universal entrypoint mounting an `ActorRefLike` onto either an async
 * `ActionRegister` or a synchronous DOM `SyncActionPipeline`.
 */
export function bindActor<
  TActions extends ActionPayloadMap,
  TResultMap extends ActionResultMap<TActions> = ActionResultMap<TActions>,
  TEvent extends StatechartEventLike = StatechartEventLike,
  TSnapshot extends StatechartSnapshotPort = StatechartSnapshotPort,
  TEmitted extends StatechartEventLike = StatechartEventLike,
>(
  target: ActionRegister<TActions, TResultMap>,
  actor: ActorRefLike<TEvent, TSnapshot>,
  options: BindActorActionRegisterOptions<TActions, TEvent, TSnapshot, TEmitted>,
): BoundActorHandle<TActions, TSnapshot>;
export function bindActor<
  TActions extends Record<string, unknown>,
  TEvent extends StatechartEventLike = StatechartEventLike,
  TSnapshot extends StatechartSnapshotPort = StatechartSnapshotPort,
  TEmitted extends StatechartEventLike = StatechartEventLike,
>(
  target: SyncActionPipeline<TActions>,
  actor: ActorRefLike<TEvent, TSnapshot>,
  options: BindActorPipelineOptions<TActions, TEvent, TEmitted>,
): BoundActorHandle<TActions, TSnapshot>;
export function bindActor<
  TActions extends ActionPayloadMap,
  TEvent extends StatechartEventLike = StatechartEventLike,
  TSnapshot extends StatechartSnapshotPort = StatechartSnapshotPort,
  TEmitted extends StatechartEventLike = StatechartEventLike,
>(
  target:
    | ActionRegister<TActions, ActionResultMap<TActions>>
    | SyncActionPipeline<Record<string, unknown>>,
  actor: ActorRefLike<TEvent, TSnapshot>,
  options: BindActorActionRegisterOptions<TActions, TEvent, TSnapshot, TEmitted>,
): BoundActorHandle<TActions, TSnapshot> {
  if (isActionRegisterTarget(target)) {
    return bindActorToActionRegister(
      target as unknown as ActionRegister<TActions, ActionResultMap<TActions>>,
      actor,
      options,
    );
  }
  return bindActorToSyncPipeline(
    target as SyncActionPipeline<Record<string, unknown>>,
    actor,
    options as BindActorPipelineOptions<Record<string, unknown>, TEvent, TEmitted>,
  ) as unknown as BoundActorHandle<TActions, TSnapshot>;
}

/**
 * Schedules a Context-Action command function safely inside XState v6's `(args, enq)` queue.
 */
export function enqueueSyncCommand<TPayload = void, TResult = unknown>(
  enq: (effect: () => void) => void,
  command: (payload: TPayload) => TResult,
  ...args: EmitArgs<TPayload>
): void {
  enq(() => {
    command(args[0] as TPayload);
  });
}

function isActionRegisterTarget(
  target: object,
): target is GenericActionDispatcher<ActionPayloadMap> {
  return (
    'dispatchWithResult' in target
    && typeof (target as Partial<GenericActionDispatcher<ActionPayloadMap>>).dispatchWithResult === 'function'
  );
}

/**
 * Creates a bidirectional typed emitter enabling XState v5 actions, XState v6 `enq`
 * transitions, or `@xstate/effect` handlers to dispatch back into Context-Action.
 */
export function createActorActionEmitter<
  TActions extends ActionPayloadMap,
  TResultMap extends ActionResultMap<TActions> = ActionResultMap<TActions>,
>(
  register: ActionRegister<TActions, TResultMap>,
  options?: ActorActionEmitterOptions,
): {
  emit<K extends ActionNames<TActions>>(action: K, ...args: EmitArgs<TActions[K]>): Promise<void>;
  enqueue<K extends ActionNames<TActions>>(
    enq: (effect: () => void) => void,
    action: K,
    ...args: EmitArgs<TActions[K]>
  ): void;
};
export function createActorActionEmitter<TActions extends Record<string, unknown>>(
  pipeline: SyncActionPipeline<TActions>,
  options?: ActorActionEmitterOptions,
): {
  emit<K extends keyof TActions & string>(
    action: K,
    ...args: EmitArgs<TActions[K]>
  ): SyncDispatchOutcome<TActions[K], unknown>;
  enqueue<K extends keyof TActions & string>(
    enq: (effect: () => void) => void,
    action: K,
    ...args: EmitArgs<TActions[K]>
  ): void;
};
export function createActorActionEmitter<TActions extends ActionPayloadMap>(
  target:
    | ActionRegister<TActions, ActionResultMap<TActions>>
    | SyncActionPipeline<Record<string, unknown>>,
  options: ActorActionEmitterOptions = {},
): ActorActionEmitter<TActions> {
  const emit = <K extends ActionNames<TActions>>(
    action: K,
    ...args: EmitArgs<TActions[K]>
  ): Promise<void> | SyncDispatchOutcome<TActions[K], unknown> => {
    if (isActionRegisterTarget(target)) {
      const dispatcher = target as unknown as GenericActionDispatcher<TActions>;
      const dispatchArgs = (
        args.length > 0 ? [args[0]] : []
      ) as DispatchArgs<TActions[K]>;
      return dispatcher.dispatch(action, ...dispatchArgs);
    }
    return (target as SyncActionPipeline<Record<string, unknown>>).dispatch(
      action,
      args[0],
    ) as SyncDispatchOutcome<TActions[K], unknown>;
  };

  return {
    emit,
    enqueue(enq, action, ...args) {
      enq(() => {
        try {
          const outcome = emit(action, ...args);
          if (outcome && typeof (outcome as Promise<void>).catch === 'function') {
            (outcome as Promise<void>).catch((error) => {
              options.onError?.(error, action);
            });
          }
        } catch (error) {
          options.onError?.(error, action);
        }
      });
    },
  };
}
