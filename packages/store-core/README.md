# @context-action/store-core

Framework-neutral contracts for Context-Action state and timeline adapters.

See the [Store Selection and Usage Guide](../../docs/en/context-layered/store-selection-and-usage-guide.md) when choosing between `createStateStore`, React stores, and cross-framework adapters.

## Quick Start

```bash
npm install @context-action/store-core
```

<!-- @context-action-compile -->
```ts
import { createStateStore } from '@context-action/store-core';

const counterStore = createStateStore('counter', { count: 0 });
const unsubscribe = counterStore.subscribe(() => {
  const snapshot = counterStore.getSnapshot();
  console.log(`v${snapshot.version}: ${snapshot.value.count}`);
});

counterStore.update(prev => ({ count: prev.count + 1 }));
unsubscribe();
counterStore.dispose?.();
```

This package intentionally has no React, Mutative, immutable runtime, or DOM
dependency. Applications and integrations can provide their own `StateBackend`
or `TimelineBackend`. `@context-action/mutative` is one optional implementation.

The contracts are capability-oriented: a backend may support only snapshots and
subscriptions, or may additionally provide patches and timeline entry
identity. Consumers must not assume immutability or undo/redo unless the
backend exposes that capability.

`TransactionBackend.beginBatch(..., { deferNotification: true })` is an explicit
notification hold. Pair it with `resumeNotifications()` and then call
`flushNotifications()` when the surrounding integration is ready to publish the
coalesced transition.

`TransactionBatchControl` describes only that lifecycle authority. It is also
inherited by `TransactionBackend`, so existing backend implementations keep the
same methods. A coordinator may use an operation-scoped control for admission,
commit, rollback and publication while retaining the original backend identity
for conflict detection and later undo/redo. The type alone does not isolate
writers; a backend must enforce its scoped authority.

## Ownership and coordination are different roles

| Contract | Responsibility |
| --- | --- |
| `StateSnapshot<T>` | Readonly observation shape; legacy Stores may omit `version` |
| `ReadonlyStateSnapshot<T>` | Backend snapshot with required monotonic `version` |
| `StateReader<T>` / `StateBackend<T>` | Strict versioned observation (with optional `getValue?(): T`) / state ownership |
| `StateStore<T>` | Synchronous `StateBackend<T>` extension with required `getValue(): T`, returned by `createStateStore(name, initialValue, options?)` |
| `TransactionParticipantBackend<T>` | Observation, retained-entry navigation, batch lifecycle and disposal status; no state writer or materialized history required |
| `TransactionParticipant<T>` | Stable backend identity plus optional operation-scoped `batchControl` |
| `TransactionCoordinatorPort` | `begin(participants, options)` returning a `TransactionHandle` with metadata, commit and rollback |

`TransactionMeta` and `TransactionOptions` define the shared correlation fields.
They do not inherit `StateMutationMeta`'s arbitrary metadata index signature.
`TransactionBackend` remains the full state-owning timeline plus batch capability;
it is not renamed or weakened to match the minimal participant role.

The optional second parameter of `StateReader<T, Snapshot>` selects an observation
shape explicitly. Its default, and `StateBackend`'s contract, still require a
versioned snapshot. These are type-only protocols, not runtime isolation or
distributed transaction implementations. Their definitions live in
`src/contracts.ts` and `src/transaction-contracts.ts`; the public import remains
`@context-action/store-core`, with no new private-path imports or runtime dependencies.

For XState (`ActorRefLike` projection onto `StateReader`) and Effect `TransactionCoordinatorPort`
scoped adapters, use `@context-action/xstate` and `@context-action/xstate/effect`.
