# Core action contracts

The default `@context-action/core` entry is the action control plane. It does not
own Store state, React subscriptions, DOM, or time-travel history. The package also
contains opt-in [Element transport and React host entries](element-interop.md),
which are not reachable from the default runtime or declaration graph.

## Responsibilities by category

| Category | Contract | Owner |
|---|---|---|
| Registration | action key, handler role (`guard`/`command`/`result`/`observer`/`legacy`), priority, compiled pipeline cache (`CompiledActionPipeline`) | `ActionRegister` |
| Admission | guard, abort, payload normalization/validation, timeout, debounce/throttle | `ActionGuard` / `ActionRegister` |
| Execution | 2-tier fast sequential dispatch (`dispatchFastSequential`), plus general sequential, parallel, and race orchestration | `ActionRegister` / `execution-modes` |
| Results | typed result collection (`result`/`legacy`), aggregation strategies, and `errorPolicy` | result handlers / `dispatchWithResult` |
| Observation | immutable terminal `ActionObserverEvent` (`success`/`failure`/`always`) and `subscribeDispatchTrace` | observer handlers / `ActionRegister` |
| Lifecycle | closing, destroyed, active dispatch & handler promise draining, deferred cleanup | `ActionRegister` |
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

Without `immediate: true` (or a contract-level `actions: { inner: { queue: 'immediate' } }`
policy on `ActionRegister`), the nested dispatch waits behind the outer handler
while the outer handler waits for the nested promise, so the two operations
cannot settle. Explicit call-site `DispatchOptions.immediate` / `timeout` take
precedence over contract-level `actions[key]` defaults when supplied. `queuePriority`
only orders work that is already waiting; it does not make an awaited nested
dispatch re-entrant. Use a contract-level `queue: 'immediate'` policy or an
explicit immediate dispatch for nested orchestration, or dispatch the follow-up
after the outer action has settled.

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
These events are emitted for every public `dispatch` and `dispatchWithResult`.
This keeps the dependency direction `core → trace contract ← store adapter` and
prevents Core from importing React or Store classes.

## 2-Tier dispatch execution and parity invariant

`ActionRegister` maintains a per-action `CompiledActionPipeline` cache built lazily
on first dispatch and invalidated whenever handlers are registered, replaced,
removed, or cleared (`_performRegistrationSync`, `removeRegistration`,
`clearAction`, `clearAll`).

When an active `dispatch()` call has:
- `dispatchTraceListeners.size === 0`
- `options === undefined` (after merging contract `actions[key]` defaults)
- queueing disabled for the action
- no schema validation configured for the action
- zero guards, zero observers, no timing guards (`debounce`/`throttle`), and no `once` handlers
- `sequential` execution mode

it executes directly via the zero-allocation sequential fast path
(`dispatchFastSequential` / `continueFastSequentialAsync`), transitioning cleanly
to asynchronous continuation only if a handler returns a promise-like value.

Every fast-path optimization MUST remain observationally indistinguishable from
the canonical `_dispatchWithResult()` orchestration path with respect to:
- **Cooperative cancellation**: `state.aborted || lifecycleSignal.aborted` settles as
  cancelled (resolving `dispatch()` cleanly without invoking `errorHandler`), even if a
  cooperative handler throws or rejects (`AbortError`, etc.), while still draining any
  started `start-and-continue` promises.
- **Error normalization & original payload delivery**: thrown non-`Error` values from
  `condition` or handlers are normalized into `Error` instances, and global `errorHandler`
  receives the original dispatch `payload` rather than an intermediate mutated payload.
- **Role-scoped controller surfaces**: `createRoleController()` constructs exact
  own-property surfaces per role (`guard`, `command`, `result`, `legacy`) identically on
  both paths.
- **Thenable safety**: inspecting `.then` on a handler return value executes inside the
  handler's `errorPolicy` boundary so throwing `.then` getters cannot escape synchronously.
