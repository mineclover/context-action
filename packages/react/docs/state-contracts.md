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

For Core actions, `bindActionTransactions(register, coordinator, options)`
consumes the Core dispatch trace contract and opens/closes explicit Store
participants around the action. Core remains framework-agnostic; this bridge is
owned by the React store category.
