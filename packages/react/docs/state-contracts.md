# Store and time-travel contracts

The store system is divided into four roles:

```text
Domain/action        → mutation intent and transaction metadata
StoreWriter          → validate and commit a state transition
StoreReader          → immutable observation through getSnapshot/subscribe
Timeline             → undo, redo, reset, and bounded history
React adapter        → useSyncExternalStore and selector subscriptions
```

`StoreReader` is the read boundary. Components and selectors should observe a snapshot and subscribe to changes. `StoreWriter` is the mutation boundary. `StoreTransactionCoordinator` attaches `transactionId`, `actionId`, `origin`, and `label` to the transaction callback and groups each explicit participant's updates into one timeline entry. `TimeTravelStore.getLastTransitionMeta()` exposes the metadata of the latest committed transition for devtools and audit adapters.

The React `useStoreValue` `condition` option gates the value rendered by a
consumer. It does not pause the underlying subscription: while false, the hook
retains its last visible value and continues observing snapshots so the
`useSyncExternalStore` contract remains valid.

`getValue()` remains the low-level action-handler read. Direct factory usage defaults to the legacy `readMode: 'reference'` for compatibility; declarative TimeTravelStore managers default to `readMode: 'safe'`. Code crossing an external boundary should use `getSafeValue()` when the Store provides it; this returns a defensive copy without changing the internal read policy.

`TimelineReader` and `TimelineWriter` describe time-travel capability without requiring consumers to depend on `TimeTravelStore`. The timeline position is a cursor between history entries; the initial state is position `0`. `historyLength` is a metadata query and must remain O(1); materializing complete history is a development or inspection operation.

The following invariants are required:

- External mutation cannot change the current state without a committed transition.
- Every undo/redo/reset transition emits one observable version change.
- Invalid positions and step counts fail before patch application.
- Disposing a store removes its underlying timeline subscription and invalidates its controls.
- Array index subscriptions treat structural `add`/`remove`/`move` changes as affecting the collection or use stable entity IDs.
- A multi-store action uses one transaction ID when undo must be atomic.

Use `StoreTransactionCoordinator.run(participants, callback, meta)` when an
action changes more than one store. Participant registration is explicit; the
coordinator does not discover global stores implicitly. The coordinator keeps
transaction records with each participant's before/after timeline position and
provides `canUndo`, `canRedo`, `undo`, `redo`, and `getHistory`. If a participant
has moved outside the coordinator, undo/redo fails with a history conflict
instead of silently applying a partial transaction. A rejected callback rolls
participant positions back to their starting positions.

`subscribe()` observes `started`, `committed`, `rolled_back`, `undone`, and
`redone` events. `getHistory()` and `serializeHistory()` expose metadata and
positions only; they never serialize Store instances or live references.

`getInspectorSnapshot()` and `useStoreTransactionInspector()` expose a stable
DevTools-facing snapshot containing only version, cursor, history length, undo/
redo availability, and the latest serializable record. They do not expose Store
instances or state object references.

`bindInspector(sink)` is the protocol boundary for non-React tooling. A sink
receives the initial snapshot and every subsequent snapshot; it must treat the
payload as immutable and must not call Store methods from the write callback.

Coordinator participants defer notifications while a transaction is committing.
All participant snapshots are updated before notification flush, so a reader
cannot observe the first Store's new value with another participant's old value
through the coordinator path.

The current public classes remain compatible while these contracts are introduced. New code should depend on the role interfaces and use the concrete classes only at composition boundaries.

## Shared contracts and legacy compatibility

The canonical type-only protocols live in `@context-action/store-core` and are
also available through `@context-action/react/backend`:

- `TransactionParticipantBackend<T>` describes snapshot observation, retained IDs,
  cursor/length, entry navigation, batch lifecycle and disposal status. It does
  **not** require `setValue`, `update`, materialized history, individual undo/redo,
  positional navigation or reset.
- `TransactionParticipant<T>` pairs that stable identity with a name and optional
  `batchControl`. Coordinator `begin()` / `run()` and the Action bridge accept
  these minimal participants directly.
- `TransactionCoordinatorPort` requires only `begin()`; `TransactionHandle`
  supplies `meta`, `commit()` and `rollback()`. The Action bridge accepts this
  port, not a concrete class. Core actions still import no Store protocol.
- `TransactionMeta` / `TransactionOptions` are the common correlation fields;
  React's `StoreTransactionMeta` / `StoreTransactionOptions` preserve those shapes.

Two differences are intentional compatibility boundaries:

1. Legacy React `StoreReader` snapshots may omit `version`, using the shared
   `StateSnapshot` shape. Default core `StateReader` and state-owning `StateBackend`
   still require `ReadonlyStateSnapshot.version`. There is no silent weakening
   of backend version guarantees.
2. Legacy React writer/transition metadata keeps its fixed fields without a
   catch-all index signature. Existing named metadata interfaces remain usable.
   The legacy `StoreTransactionParticipant` still exposes its convenience
   undo/redo surface; it is accepted wherever the smaller canonical role is used.

The core `TransactionBackend` exported by `/backend` remains a **full state-owning
timeline**; it is not the legacy React participant facade. Prefer the unambiguous
`TransactionParticipantBackend` name for new coordination integrations.
`transaction-participant.contract.test.ts` exercises minimal versionless participants
and the begin-only Action bridge; strict packed ESM/CJS fixtures verify both
compatibility boundaries. Publishing these new shared types still requires an
approved store-core/React version cohort and dependency floor.

## Scoped transaction lifecycle authority

`StoreTransactionParticipant.batchControl` optionally supplies the
`TransactionBatchControl` lifecycle for the current handle. Without it, the
participant Store supplies the same methods as before. The Coordinator captures
the real Store and control once at admission; replacing fields on the caller's
participant object does not redirect an open handle.

Conflict/duplicate checks and history records always use the real Store identity.
The optional control is used only for begin/end/cancel/resume/flush of the current
operation. Later undo/redo uses the retained Store, not an expired scoped control.
The controller must operate on that same Store and provide the normal notification
hold contract. Arbitrary controller failures are not distributed rollback.

This separates lifecycle authority from identity; it does not automatically isolate
every backend. The workspace journal prototype uses token-checked controllers to
reserve writer authority **before** Coordinator `started` observers run. It keeps
direct writers blocked until commit/rollback notifications finish, then releases
the reservation. Scoped writers are revoked before publication and cannot write
into a later operation.

The public contract is covered by
`__tests__/stores/core/transaction-batch-control.contract.test.ts`, including real
identity checks, expired controls, rollback, participant-field replacement and
best-effort cleanup after admission failure.

## Engine-neutral path subscriptions

`useStorePath` and `useStoreSelectorWithPaths` accept the public structural
`PatchAwareStore<T>` interface. Its observation channel uses
`readonly StorePathPatch[] | null`, not an engine-specific mutable patch array.
Existing Store/TimeTravelStore patches remain compatible, and a structurally
compatible `BackendStore` can connect directly without copying patch arrays.

`StorePathPatch` observes `op`, `path`, and optional `from`/`value`. Paths can be
readonly segment arrays or RFC 6901 JSON Pointers (`''` is root; `~1` and `~0`
decode to slash and tilde). Hook input paths and selector dependency paths also
accept readonly arrays, including `as const` tuples.

Move invalidates both source and destination collections; copy invalidates
destination shifts without treating its source as a write. Array length edits
retain conservative descendant invalidation. Numeric segments match the same
string property used by JS indexing, but `'01'` remains different from `1`.

Unknown operations, unrecognized paths and opaque collection keys trigger full
invalidation. This trades extra reads for correctness; it is not patch validation
or a promise of Map/Set traversal. A backend with nonstandard patch semantics
should translate them or emit `null`. Existing empty/null patch invalidation and
the public Mutative `Patches` type export are preserved.

Snapshot availability, not a nullish state value, determines the legacy
`getValue()` fallback. Intentional `null`/`undefined` snapshots are authoritative.

See [the readability and portability review](./backend-portability-review.md)
for the scope, test evidence and remaining boundaries.

For Core actions, `bindActionTransactions(register, coordinator, options)`
consumes the Core dispatch trace contract and opens/closes explicit Store
participants around the action. Core remains framework-agnostic; this bridge is
owned by the React store category.
