# Core action contracts

`@context-action/core` is the action control plane. It does not own Store state,
React subscriptions, DOM, or time-travel history.

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

## Maintenance rule

Changes to execution order, once-handler claiming, abort semantics, result
selection, or destroy behavior are action contract changes. They require a
focused contract test and a downstream Store integration test when a handler
commits state. Changes to Store history or snapshot identity belong to the
React store contracts and must not be hidden as ActionRegister refactors.
