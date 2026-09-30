# Store and time-travel contracts

The store system is divided into four roles:

```text
Domain/action        → mutation intent and transaction metadata
StoreWriter          → validate and commit a state transition
StoreReader          → immutable observation through getSnapshot/subscribe
Timeline             → undo, redo, reset, and bounded history
React adapter        → useSyncExternalStore and selector subscriptions
```

`StoreReader` is the read boundary. Components and selectors should observe a snapshot and subscribe to changes. `StoreWriter` is the mutation boundary. A future transaction coordinator will attach `transactionId`, `actionId`, `origin`, and `label` to every committed transition so one user action can group updates across multiple stores.

`getValue()` remains the low-level action-handler read and may preserve structural-sharing references for compatibility. Code crossing an external boundary should use `getSafeValue()` when the Store provides it; this returns a defensive copy without changing the internal read policy.

`TimelineReader` and `TimelineWriter` describe time-travel capability without requiring consumers to depend on `TimeTravelStore`. The timeline position is a cursor between history entries; the initial state is position `0`. `historyLength` is a metadata query and must remain O(1); materializing complete history is a development or inspection operation.

The following invariants are required:

- External mutation cannot change the current state without a committed transition.
- Every undo/redo/reset transition emits one observable version change.
- Invalid positions and step counts fail before patch application.
- Disposing a store removes its underlying timeline subscription and invalidates its controls.
- Array index subscriptions treat structural `add`/`remove`/`move` changes as affecting the collection or use stable entity IDs.
- A multi-store action uses one transaction ID when undo must be atomic.

The current public classes remain compatible while these contracts are introduced. New code should depend on the role interfaces and use the concrete classes only at composition boundaries.
