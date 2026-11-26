# Unreleased changes

These changes target the approved Core 1.3.0 element interop cohort and remain
unpublished until the protected candidate workflow binds them to an immutable
release commit.

## Element host interop candidate

- Add the framework-neutral `./element` and injected-runtime `./element/react`
  public entries for DOM bindings, facades, and React host bridges.
- Extend `createElementBinding` and `createReactElementBridge` with ownership-tracked
  `attributes` (`updateAttributes`) and `styles` (`updateStyles`, supporting CSS
  custom properties and inline styles) reconciled in
  `events -> attributes -> styles -> properties` order, plus `toReactPartProps`.
- Add framework-neutral headless interaction primitives to `./element`:
  `createSyncActionPipeline`, `createRovingFocusController`, and
  `createPointerGestureSession`.
- Core advances to `1.3.0` for the approved element interop cohort. The adapters
  depend on `@context-action/core@^1.3.0` and publish only after Core.

## Action execution reliability

- Preserve uninvoked `once` handlers when a parallel/race precondition throws, including their cleanup ownership for a later dispatch.
- Prevent concurrent dispatches from invoking the same `once` observer after waiting for a higher-priority observer.
- Add contract-level per-action policy defaults via `ActionRegisterConfig<T>.actions` (`ActionPolicyConfig`: `queue?: 'serial' | 'immediate'` and `timeout?: number`) while keeping `registry.useConcurrencyQueue` defaults and call-site `DispatchOptions` precedence intact (`CA-VNEXT-ARCHITECTURE-001` M2).

## Dispatch performance & execution stability

- Cache compiled per-action pipeline metadata (`CompiledActionPipeline`) with deterministic invalidation across register, replace, remove, and clear mutations.
- Add a zero-allocation fast sequential `dispatch()` path with seamless sync-to-async transition (`await-before-next` and `start-and-continue`) alongside single-attempt retry and zero-timeout/zero-trace allocation bypasses.
- Unify role controller creation (`createRoleController`) and lazily allocate controller/error/non-blocking tracking state in execution modes while enforcing fast/slow path differential parity (cooperative abort/destroy cancellation, non-`Error` `condition` normalization, original-payload `errorHandler` delivery, and throwing `.then` getter handling).
- Add explicit contract execution lanes (`ActionExecutionLane`: `lane?: 'fast' | 'orchestrated'`) and per-action `trace?: boolean` policy on `ActionPolicyConfig` with fail-closed validation, plus action-scoped `subscribeDispatchTrace(listener, { actions })` and scoped `bindActionTransactions` / `bindActionDispatchTransactions` (`{ actions }`) so transactional actions and fast-lane sibling actions coexist cleanly on one register.
