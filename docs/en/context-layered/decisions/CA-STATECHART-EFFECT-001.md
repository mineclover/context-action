# CA-STATECHART-EFFECT-001: Separate `@context-action/xstate` Adapter Boundary and Core Integration Philosophy

**Status:** implemented; initial cohort promoted (`@context-action/core@1.3.1`, `@context-action/store-core@0.1.4`, `@context-action/xstate@0.1.0`)  
**Owner:** Framework Core & Runtime Integration  
**Related issue/spec:** CA-STATECHART-EFFECT-001 (`packages/xstate/docs/xstate-effect-integration.md`, [CA-ELEMENT-INTEROP-001](./CA-ELEMENT-INTEROP-001.md), [CA-SPEC-EVIDENCE-001](./CA-SPEC-EVIDENCE-001.md))

## Context

Integrations with XState v5, XState v6 (`xstate@beta`), Effect v4, and `@xstate/effect` cross both orchestration (`ActionRegister`, `SyncActionPipeline`) and state observation/transaction coordination (`StateReader`, `TransactionCoordinatorPort`). Placing those bridges inside `@context-action/core` and `@context-action/store-core` creates duplicate structural ports (because `@context-action/core` and `@context-action/store-core` cannot import each other), leaks async Fiber/Scope concepts into `./element`'s 0ms DOM transport layer, and introduces irreconcilable npm/pnpm peer dependency diamond conflicts between `xstate@^5` and `@xstate/effect` (which requires `xstate@^6.0.0-alpha`).

## Options considered

- **Keep ports split inside `@context-action/core/element` and `@context-action/store-core`**: Rejected because it duplicates 7+ structural interfaces, couples DOM transport to Effect scopes, and cannot bind `@context-action/core`'s main `ActionRegister` and `@context-action/store-core` together.
- **Create two separate runtime packages (`@context-action/xstate` and `@context-action/effect`)**: Held as future split option if standalone non-statechart Effect adapters outgrow `.`'s shared actor/guard contracts; rejected for now to avoid double versioning overhead for `@xstate/effect` workflows.
- **Option 1 (Accepted): Single optional package `@context-action/xstate` with `.` and `./effect` subpaths**: Keeps `@context-action/core` and `@context-action/store-core` zero-dependency while unifying synchronous and async Action, Store, Statechart, Schema, and Effect contracts through structural ports.

## Decision

Extract all XState v5/v6 and Effect v4 / `@xstate/effect` bridges into `@context-action/xstate` (`packages/xstate/`) with two subpath exports:

- **`@context-action/xstate` (`.`)**: `bindActor`, `bindActorToActionRegister`, `bindActorToSyncPipeline` (`bindStatechartToSyncPipeline`), `bindActorEmissions`, `waitForActorSnapshot`, `createActorStateReader`, `createActorActionEmitter`, and `enqueueSyncCommand`.
- **`@context-action/xstate/effect` (`./effect`)**: `fromStandardSchema`, `registerStandardSchemaGuard`, `registerEffectGuard`, `registerEffectHandler`, `bindEffectActorToActionRegister`, `runInTransactionScope`, and framework-neutral `bindActionDispatchTransactions`.

Declare runtime dependencies strictly on `@context-action/core` and `@context-action/store-core` without pinning mutually exclusive `xstate` / `@xstate/effect` peer version trees.

## Consequences and invariants

These five architectural invariants govern every XState and Effect integration in the repository:

1. **Zero-Dependency Core Purity**: `@context-action/core` and `@context-action/store-core` remain zero-dependency and runtime-agnostic. Neither package imports XState, Effect, Standard Schema, or `@context-action/xstate`.
2. **Single Intent Entry & Single Projection Exit**: UI hosts and external callers express intents strictly through Context-Action (`ActionRegister` / `SyncActionPipeline`) and observe state strictly through monotonic versioned `StateReader<TSelected>` snapshots (`createActorStateReader` with `select` + `equals` and stale-free reads prior to `subscribe()`).
3. **Open Store vs Closed Statechart Authority**: `StateStore<T>` allows external `setValue()`/`update()` mutations, whereas `ActorRefLike` is closed to arbitrary external writes—transitions execute exclusively through guarded events (`snapshot.can(event)` in Guard -> `actor.send(event)` in Handler), and outbound actor notifications (`enqueue` / `actor.on` via `bindActorEmissions`) route cleanly back through `createActorActionEmitter`.
4. **Cooperative Lifecycle & Scoped Interruption**: Cancellation propagates end-to-end (`controller.signal` -> `waitForActorSnapshot`, `registerEffectHandler`, `registerEffectGuard`, `runInTransactionScope`), `bindActionDispatchTransactions` / `runInTransactionScope` enforce single-shot atomic `commit()` / `rollback()` across named participants, and all bindings return uniform callable teardown handles (`BoundActorHandle` / `BoundEffectActorHandle`) closing Effect `Scope` and stopping active actors on `dispose()`.
5. **Three-Tier State Alignment ([CA-SPEC-EVIDENCE-001](./CA-SPEC-EVIDENCE-001.md))**: Tier 1 durable domain transitions and payloads map to `@standard-schema/spec` (`fromStandardSchema` + `ActionRegister` + XState actors), Tier 2 derived UI views map to `createActorStateReader` projections, and Tier 3 0ms DOM feedback stays inside `@context-action/core/element` `SyncActionPipeline`.

## Verification evidence

- Authoritative specification: [XState & Effect Integration Guide](../../../../packages/xstate/docs/xstate-effect-integration.md)
- Implementation: `packages/xstate/src/` (`contracts.ts`, `actor-state-reader.ts`, `pipeline-binding.ts`, `index.ts`, `effect.ts`)
- Executable contract & real-runtime proofs (`packages/xstate/test/xstate-effect.test.mjs`, `packages/xstate/test/real-runtime-integration.test.mjs` against real `xstate@5.33.4`, `effect@4.1.4`, `zod@4.6.6`): `pnpm --dir packages/xstate test`
- Repository boundary & packaging gates: `pnpm package-boundary:check`, `pnpm verify:package-exports`, `pnpm verify:package-tarballs`, `pnpm convention:check`

## Reversal or migration conditions

Split `@context-action/xstate/effect` into an independent `@context-action/effect` package only if Effect-only consumers (Schema, `EffectRunnerPort`, `TransactionCoordinatorPort`) develop a separate release cadence or dependency requirement from XState adapters. No upstream package version changes are implied by this decision alone.
