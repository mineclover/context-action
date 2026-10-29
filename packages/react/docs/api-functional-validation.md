# Public API functional validation

## Scope

This inventory covers `@context-action/core` and the public React entries:
the root, `/advanced`, `/utils`, `/backend`, and the explicit experimental
`/webmcp` adapter. It is not a claim that every possible input, branch, browser,
integration package, or consumer application has been tested.

An export-presence or TypeScript compilation check is not a functional test.
The tests below exercise behavior; the package-consumer gates separately check
published-shape exports, strict declarations, module formats, and peer isolation.

## Functional test map

| API group | Exercised behavior | Test evidence |
| --- | --- | --- |
| Core `ActionRegister`, execution modes, `resolveHandlerConfig` | Registration, dispatch/results, ordering, guards/observers, once admission/concurrency, retries, timeout/cancellation, queue drain, shutdown | `packages/core/__tests__/unit/`, `schema/`, `feature-coverage/`, `concurrency/` |
| Core `ActionGuard` | Guard lifecycle and cancellation | `packages/core/__tests__/unit/action-guard.lifecycle.test.ts` |
| Core public errors and type guards | Real error identity, negative/forged inputs, validation and lifecycle failures | `packages/core/__tests__/unit/public-error-guards.contract.test.ts`, `schema/validation-integration.test.ts`, lifecycle/dispatch contracts |
| `createActionContext` and returned hooks | Dispatch/results, effect/result/guard/observer registration, observer outcomes, scope reset, registration cleanup, Provider isolation | `__tests__/actions/`, `__tests__/provider-isolation.contract.test.tsx` |
| `Store`, `createStore`, value/selector/path hooks | Reads/writes, patch/full-invalidation batching, equality including `undefined`, Store replacement, subscriptions, disposal | `__tests__/stores/core/Store.test.ts`, `__tests__/stores/hooks/` |
| Engine-neutral `PatchAwareStore`, `StorePathPatch` and path hooks | Readonly patches/const paths, array and JSON Pointer paths, move sources, copy destination shifts, escaped keys, conservative fallback, intentional nullish snapshots | `__tests__/stores/hooks/path-subscription-portability.contract.test.tsx`, `__tests__/stores/utils/patch-affects-path.test.ts` |
| `TimeTravelStore`, factories/type guard, history hooks | Undo/redo/goTo/reset, history limits, selection replacement/equality, stable controls, subscription cleanup | `__tests__/stores/core/TimeTravelStore.test.ts`, `__tests__/stores/hooks/time-travel-api.contract.test.tsx`, `path-subscription-stability.test.tsx` |
| Store Context factories/managers, `asStoreValue` | Configuration/value discrimination, explicit values, Provider/HOC lifecycle, StrictMode/Activity preservation, context subscriptions | `__tests__/stores/patterns/`, `__tests__/provider-isolation.contract.test.tsx` |
| `StoreTransactionCoordinator`, `bindActionTransactions`, inspector hook | Commit/rollback, atomic undo, retained-entry conflicts, action trace bridge, omitted optional metadata and reactive inspection | `__tests__/stores/core/StoreTransaction*.test.*`, `ActionTransactionBridge.test.ts`, `action-transaction-metadata.contract.test.ts` |
| Optional transaction `batchControl` | Scoped lifecycle authority, real participant identity, undo/redo after control expiry, captured participant fields and admission-failure cleanup | `__tests__/stores/core/transaction-batch-control.contract.test.ts` |
| Shared minimal transaction protocols | Versionless observation, ownership-free participants, retained-entry undo/redo, rollback and begin-only Action bridge | `__tests__/stores/core/transaction-participant.contract.test.ts`, strict packed ESM/CJS type fixtures |
| `createRefContext` and returned hooks | Ref attachment, mount waits and reactive waiting flags, independent deadlines, mount callbacks/unsubscribe, state-change callbacks/live checkers, polling, conditional/async operations, cancellation/serialization, disposal and Provider lifetime | `__tests__/refs/`, including `ref-public-api.contract.test.tsx` |
| Error boundaries and React helpers | Fallback/recovery and helper/error behavior | `__tests__/stores/components/StoreErrorBoundary.test.tsx`, `__tests__/actions/react-helpers.test.ts` |
| `/advanced` | Registry operations, computed/local Store reads and updates, error utilities/boundaries | `__tests__/public-subpaths.contract.test.tsx`, `stores/core/StoreRegistry.test.ts`, `stores/hooks/useComputedStore.test.tsx`, `useLocalStore.test.tsx` |
| `/utils` | Immutable clone/read/write/produce, comparison, Provider composition | `__tests__/public-subpaths.contract.test.tsx`, `__tests__/stores/utils/` |
| `/backend` | User-owned backend reads/writes/subscriptions, patch channels, registration rollback, disposal ownership | `__tests__/public-subpaths.contract.test.tsx`, `__tests__/stores/core/BackendStore.test.ts` |
| `/webmcp` (opt-in) | Browser API registration/cleanup, pending-registration cancellation, option freshness, profile selection | `__tests__/tools/useWebMCPToolScope.test.tsx` (browser API doubles, not real browser support certification) |

Paths without a package prefix above are relative to `packages/react`.

The workspace-only `travels-v3-journal.experimental.test.tsx` additionally connects
the upstream controlled journal prototype to the existing Coordinator, Action
bridge and React hooks. This is source integration evidence, not publication or
real-browser certification of the prototype.

## Installed-package boundary

`pnpm verify:react-compatibility` builds and packs the dependency chain and checks
the configured React versions. Before installing integration peers, it runs:

- strict ESM/CJS consumer declaration compilation (`skipLibCheck: false`);
- ESM runtime/SSR smoke and CJS root loading without integration packages;
- public Action, Store, Time Travel, Provider, Ref, and basic-subpath functional
  contracts against the **installed production CJS bundle**, with no Context-Action
  source aliases.

After explicit integration-peer installation it checks `/webmcp` declarations
and runtime loading, then runs the complete React source suite. Detailed
installed-bundle lifecycle contracts currently target CJS, not both formats;
WebMCP behavioral tests currently use source and browser API doubles.

The framework-neutral history-length metadata is also checked in
`packages/mutative/__tests__/time-travel.behavior.test.ts` across automatic/manual
archive modes, zero/bounded history, pending edits, branching, rollback and reset.

## Completion criteria and limitations

Use the result for the exact current commit, not a historical count:

```sh
pnpm build
pnpm --filter @context-action/core test
pnpm --filter @context-action/mutative test
pnpm --filter @context-action/react type-check
pnpm verify:react-compatibility
pnpm verify
pnpm verify:receipt
```

Coverage measurements identify missing paths but are not proof of all API
combinations. The initial audit found zero direct execution of the root
`useTimeTravelControls` hook despite a passing suite; the added public contracts
close that specific gap and the reproduced Time Travel selection regressions.
Remaining uncovered branches, development diagnostics, real-browser optional
adapter coverage, and application-specific behavior must not be labeled complete
solely because the repository suites pass.
