# @context-action/xstate

All notable changes to this package will be documented in this file.

## [0.1.1] (2026-11-26)

### Compatibility

- Widen `@context-action/core` dependency range to `^1.3.1 || ^2.0.0` for Core 2.0 compatibility.

## [0.1.0] (2026-11-19)

### Features

- Add framework-neutral structural adapters for XState v5/v6 actors (`bindActor`, `bindActorToSyncPipeline`, `bindActorToActionRegister`, `bindStatechartToSyncPipeline`, `bindActorEmissions`, `createActorActionEmitter`, `createActorStateReader`, `enqueueSyncCommand`, `waitForActorSnapshot`).
- Add `./effect` subpath providing `@xstate/effect` / Effect v4 & Standard Schema v1 bridges (`fromStandardSchema`, `registerStandardSchemaGuard`, `registerEffectHandler`, `registerEffectGuard`, `bindEffectActorToActionRegister`, `runInTransactionScope`, `bindActionDispatchTransactions`).
