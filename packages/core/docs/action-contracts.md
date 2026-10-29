# Core action contracts

The default `@context-action/core` entry is the action control plane. It does not
own Store state, React subscriptions, DOM, or time-travel history. The package also
contains opt-in [Element transport and React host entries](element-interop.md),
which are not reachable from the default runtime or declaration graph.

## Responsibilities by category

| Category | Contract | Owner |
|---|---|---|
| Registration | action key, handler role, priority, lifecycle | `ActionRegister` |
| Admission | guard, abort, payload validation, timeout | `ActionGuard` / pipeline controller |
| Execution | sequential, parallel, race, scheduling | execution modes |
| Results | typed result collection and error policy | result handlers / `dispatchWithResult` |
| Observation | success/failure/always observers | observer handlers |
| Lifecycle | closing, destroyed, active dispatch cleanup | `ActionRegister` |
| State commit | snapshot, store mutation, undo/redo | `@context-action/react` store layer |

Handlers should express intent and domain work. A handler may call a Store
writer, but the action runtime does not infer which state changes belong to one
user action. Atomic multi-store undo therefore requires an explicit transaction
coordinator at the application/store layer.

## Stable boundary

The public action contract is:

```ts
interface ActionBoundary<Actions> {
  dispatch<K extends keyof Actions>(action: K, payload: Actions[K]): Promise<unknown>;
  register<K extends keyof Actions>(action: K, handler: unknown, config?: unknown): () => void;
  destroy(): Promise<void> | void;
}
```

The concrete `ActionRegister` exposes additional controls for guards, results,
observers, and scheduling. Adapters should depend on the smallest role they
need. State metadata such as `transactionId`, `origin`, and `label` should be
introduced at the commit boundary and passed through explicitly rather than
being inferred from handler names.

### Queue re-entry

`registry: { useConcurrencyQueue: true }` uses a single execution slot. A
handler that awaits another dispatch on the same register must bypass that
slot explicitly:

```ts
register.register('outer', async () => {
  await register.dispatch('inner', undefined, { immediate: true });
});
```

Without `immediate: true`, the nested dispatch waits behind the outer handler
while the outer handler waits for the nested promise, so the two operations
cannot settle. `queuePriority` only orders work that is already waiting; it
does not make an awaited nested dispatch re-entrant. Use an explicit immediate
dispatch for nested orchestration, or dispatch the follow-up after the outer
action has settled.

## Maintenance rule

Changes to execution order, once-handler claiming, abort semantics, result
selection, or destroy behavior are action contract changes. They require a
focused contract test and a downstream Store integration test when a handler
commits state. Changes to Store history or snapshot identity belong to the
React store contracts and must not be hidden as ActionRegister refactors.

## Dispatch trace bridge

`subscribeDispatchTrace()` emits exactly one `started` and one `settled` event
per public dispatch. The event carries a stable `dispatchId`, action name,
terminal status, timing, and optional trace metadata from `DispatchOptions.trace`.
Core does not create or mutate Store transactions. The React adapter can bind
these events to explicit Store participants with `bindActionTransactions()`.
This keeps the dependency direction `core → trace contract ← store adapter` and
prevents Core from importing React or Store classes.
