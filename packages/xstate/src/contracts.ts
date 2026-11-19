import type { ActionNames, ActionPayloadMap } from '@context-action/core';

/** Minimum event contract shared across XState v5, XState v6, and `@xstate/effect` actors. */
export interface StatechartEventLike {
  readonly type: string;
  readonly [key: string]: unknown;
}

/** Structural snapshot contract exposed by XState v5, XState v6, and `@xstate/effect` actors. */
export interface StatechartSnapshotPort<TValue = unknown, TContext = unknown> {
  readonly value: TValue;
  readonly context: TContext;
  readonly status?: 'active' | 'done' | 'error' | 'stopped' | undefined;
  readonly error?: unknown;
  can?(event: StatechartEventLike): boolean;
  matches?(stateValue: unknown): boolean;
  hasTag?(tag: string): boolean;
}

export interface StatechartObserverLike<TSnapshot> {
  next?(snapshot: TSnapshot): void;
  error?(error: unknown): void;
  complete?(): void;
}

export type StatechartSubscriptionLike = { unsubscribe(): void } | (() => void);

/**
 * Standard runtime contract implemented by XState v5 `createActor()`, XState v6
 * `createActor()`, and `@xstate/effect` `createEffectActor()` instances.
 */
export interface ActorRefLike<
  TEvent extends StatechartEventLike = StatechartEventLike,
  TSnapshot extends StatechartSnapshotPort = StatechartSnapshotPort,
> {
  getSnapshot(): TSnapshot;
  send(event: TEvent): void;
  subscribe(
    listenerOrObserver: StatechartObserverLike<TSnapshot> | ((snapshot: TSnapshot) => void),
  ): StatechartSubscriptionLike;
  stop?(): unknown;
  on?(
    type: string,
    handler: (emitted: StatechartEventLike) => void,
  ): StatechartSubscriptionLike;
}

/** Alias retained for clarity when emphasizing synchronous v5/v6 core actors. */
export type SyncStatechartActorPort<
  TEvent extends StatechartEventLike = StatechartEventLike,
  TSnapshot extends StatechartSnapshotPort = StatechartSnapshotPort,
> = ActorRefLike<TEvent, TSnapshot>;

// biome-ignore lint/suspicious/noConfusingVoidType: ActionPayloadMap uses void for payload-less action keys.
export type EmitArgs<TPayload> = [TPayload] extends [void]
  ? [payload?: undefined]
  : undefined extends TPayload
    ? [payload?: TPayload]
    : [payload: TPayload];

/** Declarative mapping entry from a Context-Action action key/payload to an XState event. */
export type ActionToEventEntry<
  TPayload,
  TEvent extends StatechartEventLike = StatechartEventLike,
> = TEvent['type'] | ((payload: TPayload) => TEvent);

/** Type-safe action-to-event mapping keyed by ActionPayloadMap keys. */
export type ActionToEventMap<
  TActions extends ActionPayloadMap,
  TEvent extends StatechartEventLike = StatechartEventLike,
> = {
  readonly [K in ActionNames<TActions>]?: ActionToEventEntry<TActions[K], TEvent>;
};

/**
 * Shared read/capability inspection controller exposed by all `@context-action/xstate` bindings.
 */
export interface BoundActorController<
  TActions extends ActionPayloadMap,
  TSnapshot extends StatechartSnapshotPort = StatechartSnapshotPort,
> {
  unbind(): void;
  getSnapshot(): TSnapshot;
  canDispatch<K extends ActionNames<TActions>>(
    action: K,
    ...args: EmitArgs<TActions[K]>
  ): boolean;
  isDisposed(): boolean;
}

/**
 * Uniform synchronous binding handle returned by `bindActor`, `bindActorToSyncPipeline`,
 * and `bindActorToActionRegister`. Callable as `handle()` for `UnregisterFunction` compatibility.
 */
export type BoundActorHandle<
  TActions extends ActionPayloadMap,
  TSnapshot extends StatechartSnapshotPort = StatechartSnapshotPort,
> = (() => void) &
  BoundActorController<TActions, TSnapshot> & {
    dispose(): void;
  };

export interface MappedActionBinding<
  TActions extends ActionPayloadMap,
  TEvent extends StatechartEventLike,
> {
  readonly action: ActionNames<TActions>;
  readonly toEvent: (payload: TActions[ActionNames<TActions>]) => TEvent;
}

export function detachActorSubscription(subscription: StatechartSubscriptionLike | undefined): void {
  if (!subscription) return;
  if (typeof subscription === 'function') {
    subscription();
  } else if (typeof subscription.unsubscribe === 'function') {
    subscription.unsubscribe();
  }
}

export function isActorTerminated(snapshot: StatechartSnapshotPort): boolean {
  return (
    snapshot.status === 'done'
    || snapshot.status === 'stopped'
    || snapshot.status === 'error'
  );
}

export function defaultActionToEvent<TEvent extends StatechartEventLike>(
  eventType: string,
  payload: unknown,
): TEvent {
  return (
    payload !== undefined ? { type: eventType, payload } : { type: eventType }
  ) as unknown as TEvent;
}

export function resolveMappedActions<
  TActions extends ActionPayloadMap,
  TEvent extends StatechartEventLike,
>(options: {
  readonly map?: ActionToEventMap<TActions, TEvent> | undefined;
  readonly actions?: readonly ActionNames<TActions>[] | undefined;
  readonly toEvent?: (<K extends ActionNames<TActions>>(action: K, payload: TActions[K]) => TEvent) | undefined;
}): MappedActionBinding<TActions, TEvent>[] {
  const ordered = new Set<ActionNames<TActions>>();
  if (options.map) {
    for (const key of Object.keys(options.map)) {
      ordered.add(key as ActionNames<TActions>);
    }
  }
  if (options.actions) {
    for (const action of options.actions) {
      ordered.add(action);
    }
  }
  if (ordered.size === 0 && !options.map && !options.actions) {
    throw new TypeError('Actor binding requires either a "map" object or an "actions" array.');
  }

  const bindings: MappedActionBinding<TActions, TEvent>[] = [];
  for (const action of ordered) {
    const mapEntry = options.map?.[action];
    const toEvent = (payload: TActions[ActionNames<TActions>]): TEvent => {
      if (typeof mapEntry === 'function') {
        return (mapEntry as (p: unknown) => TEvent)(payload);
      }
      if (typeof mapEntry === 'string') {
        return defaultActionToEvent<TEvent>(mapEntry, payload);
      }
      if (options.toEvent) {
        return options.toEvent(action, payload);
      }
      return defaultActionToEvent<TEvent>(action, payload);
    };
    bindings.push({ action, toEvent });
  }
  return bindings;
}
