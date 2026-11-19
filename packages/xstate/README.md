# `@context-action/xstate`

Optional XState v5/v6 and Effect v4 / `@xstate/effect` adapters for `@context-action/core` and `@context-action/store-core`.

```text
Package ID and stability: @context-action/xstate (0.1.0, public candidate / experimental)
Primary responsibility: Adapt XState v5/v6 statecharts and Effect v4 / @xstate/effect runtimes to Context-Action pipelines, StateReader projections, and TransactionCoordinatorPort boundaries without polluting zero-dependency core packages
Public entry points and exports: "." (@context-action/xstate) and "./effect" (@context-action/xstate/effect)
Runtime dependencies: @context-action/core (^1.3.0), @context-action/store-core (^0.1.3)
Peer/optional dependencies: None forced (structural ports interoperate with xstate v5/v6, effect v3/v4, @xstate/effect, zod without conflicting peer diamond locks)
Owned source directories: packages/xstate/src, packages/xstate/test, packages/xstate/docs
Test and verification commands: pnpm --dir packages/xstate test && pnpm --dir packages/xstate type-check && pnpm --dir packages/xstate lint
Authoritative guide: docs/xstate-effect-integration.md
Specification or decision ID: CA-STATECHART-EFFECT-001
Migration/deprecation plan, if any: Extract "./effect" into standalone @context-action/effect only if non-XState Effect usage acquires an independent release cycle
```

## Public API Surface

- **Main entry (`@context-action/xstate`)**:
  - `bindActor(target, actor, options)` — universal mounting helper targeting either `ActionRegister` or `SyncActionPipeline` and returning a callable `BoundActorHandle`.
  - `bindActorToActionRegister(register, actor, options)` — mounts an XState v5/v6 actor onto `ActionRegister` with `snapshot.can` Guards, `actor.send`, optional `waitFor` / `waitForByAction` settlement, and optional outbound `emissions`.
  - `bindActorToSyncPipeline(pipeline, actor, options)` (alias: `bindStatechartToSyncPipeline`) — mounts onto `SyncActionPipeline` (`@context-action/core/element`) for 0ms synchronous DOM interactions.
  - `bindActorEmissions(actor, target, emissions, options)` — routes outbound XState `emit()` events (`actor.on(type, ...)`) back into `ActionRegister` or `SyncActionPipeline`.
  - `waitForActorSnapshot(actor, predicate, options)` — Promise helper with 0ms synchronous fast-path, `AbortSignal`, and `timeoutMs`.
  - `createActorStateReader(name, actor, options)` — projects an actor's snapshots onto a versioned `@context-action/store-core` `StateReader` with `select` & `equals` filtering and stale-free reads prior to `subscribe()`.
  - `createActorActionEmitter(target)` & `enqueueSyncCommand(enq, fn, payload)` — typed reverse bridge from XState v5 `enqueueActions` or XState v6 `(args, enq)` transitions back into Context-Action.

- **Effect subpath (`@context-action/xstate/effect`)**:
  - `fromStandardSchema(schema)` — adapts `@standard-schema/spec` v1 (e.g., Effect v4 `Schema.toStandardSchemaV1`, Zod v4) into `ActionSchemaLike` for `new ActionRegister({ schema })`.
  - `registerStandardSchemaGuard(target, action, schema, options)` — mounts sync/async validation + payload normalization onto either `ActionRegister` or `SyncActionPipeline`.
  - `registerEffectHandler` & `registerEffectGuard` — bridges Effect v3/v4 `ManagedRuntime.runPromise` with `controller.signal` Fiber interruption.
  - `bindEffectActorToActionRegister` — mounts `@xstate/effect` / XState actors onto `ActionRegister`, returning a callable `BoundEffectActorHandle` whose `dispose()` detaches handlers/emissions, closes the Effect `Scope`, and stops active actors.
  - `runInTransactionScope` & `bindActionDispatchTransactions` — pairs `@context-action/store-core`'s `TransactionCoordinatorPort` with Promise/`AbortSignal` scopes and `ActionRegister.subscribeDispatchTrace`.

See [docs/xstate-effect-integration.md](docs/xstate-effect-integration.md) and ADR [`CA-STATECHART-EFFECT-001`](../../docs/en/context-layered/decisions/CA-STATECHART-EFFECT-001.md) for the full architectural invariants.
