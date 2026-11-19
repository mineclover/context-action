import type { ReadonlyStateSnapshot, StateReader } from '@context-action/store-core';
import {
  type ActorRefLike,
  detachActorSubscription,
  type StatechartSnapshotPort,
  type StatechartSubscriptionLike,
} from './contracts.js';

export interface ActorStateReaderOptions<
  TSnapshot extends StatechartSnapshotPort,
  TSelected = TSnapshot,
> {
  /** Optional projection selector to avoid broadcasting unrelated context changes. */
  readonly select?: ((snapshot: TSnapshot) => TSelected) | undefined;
  /** Equality comparator for projected values. Defaults to `Object.is`. */
  readonly equals?: ((previous: TSelected, next: TSelected) => boolean) | undefined;
  /** Optional deterministic clock for `ReadonlyStateSnapshot.lastUpdate`. */
  readonly now?: (() => number) | undefined;
}

export interface ActorStateReader<TSelected> extends StateReader<TSelected> {
  getValue(): TSelected;
  isDisposed(): boolean;
  dispose(): void;
}

/**
 * Projects any XState v5/v6 or `@xstate/effect` `ActorRefLike` onto a versioned
 * `@context-action/store-core` `StateReader<TSelected>`.
 *
 * Guarantees fresh reads even before the first `subscribe()` call and suppresses
 * redundant subscriber notifications when `equals(prev, next)` holds.
 */
export function createActorStateReader<
  TSnapshot extends StatechartSnapshotPort,
  TSelected = TSnapshot,
>(
  name: string,
  actor: Pick<ActorRefLike<never, TSnapshot>, 'getSnapshot' | 'subscribe'>,
  options: ActorStateReaderOptions<TSnapshot, TSelected> = {},
): ActorStateReader<TSelected> {
  const select =
    options.select ?? ((current: TSnapshot) => current as unknown as TSelected);
  const equals = options.equals ?? Object.is;
  const now = options.now ?? Date.now;

  let disposed = false;
  let version = 0;
  let latestValue = select(actor.getSnapshot());
  let snapshot: ReadonlyStateSnapshot<TSelected> = {
    value: latestValue,
    name,
    version,
    lastUpdate: now(),
  };

  const listeners = new Set<() => void>();
  let actorSubscription: StatechartSubscriptionLike | undefined;

  const commitIfChanged = (nextValue: TSelected, notifyListeners: boolean): void => {
    if (disposed || equals(latestValue, nextValue)) return;
    const updatedAt = now();
    latestValue = nextValue;
    version += 1;
    snapshot = {
      value: nextValue,
      name,
      version,
      lastUpdate: updatedAt,
    };
    if (!notifyListeners) return;
    for (const listener of [...listeners]) {
      try {
        listener();
      } catch {
        // Isolate subscriber failures so remaining observers continue to update.
      }
    }
  };

  // Pull directly from the underlying actor when no active subscription is
  // forwarding events yet, preventing stale snapshot reads prior to subscribe().
  const syncBeforeReadOrSubscribe = (): void => {
    if (disposed || actorSubscription) return;
    const nextValue = select(actor.getSnapshot());
    commitIfChanged(nextValue, false);
  };

  const ensureSubscribed = (): void => {
    if (actorSubscription || disposed) return;
    syncBeforeReadOrSubscribe();
    actorSubscription = actor.subscribe({
      next(nextActorSnapshot) {
        commitIfChanged(select(nextActorSnapshot), true);
      },
    });
  };

  return {
    name,
    getSnapshot() {
      syncBeforeReadOrSubscribe();
      return snapshot;
    },
    getValue() {
      syncBeforeReadOrSubscribe();
      return snapshot.value;
    },
    subscribe(listener) {
      if (typeof listener !== 'function') {
        throw new TypeError('ActorStateReader subscriber must be a function.');
      }
      if (disposed) return () => {};
      ensureSubscribed();
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    isDisposed: () => disposed,
    dispose() {
      if (disposed) return;
      disposed = true;
      listeners.clear();
      detachActorSubscription(actorSubscription);
      actorSubscription = undefined;
    },
  };
}
