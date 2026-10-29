# Unreleased changes

These changes are not included in the published versions listed in [CHANGELOG.md](./CHANGELOG.md).
They do not authorize a version change or publication.

## React 18/19 peer compatibility

- Restore the public peer range to `^18.0.0 || ^19.0.0` and add an installed
  React 18.3.1/types smoke to the compatibility matrix. React 19-only features
  such as Compiler optimization and `<Activity>` remain explicitly scoped to
  React 19 consumers.

## Backend path-subscription portability

- Derive legacy Store observation/metadata contracts from store-core while preserving optional snapshot versions, fixed-field metadata and convenience undo/redo methods. Keep the strict state-owning backend contract distinct.
- Accept canonical minimal participants in Coordinator begin/run and Action bridge; accept a begin-only `TransactionCoordinatorPort` in the bridge. Remove heterogeneous `any` participant storage, add `StoreTransactionOptions`, and re-export the canonical type-only protocols through `/backend`.
- Accept optional `StoreTransactionParticipant.batchControl` for operation-scoped admission/commit/rollback/publication. Capture participant identities and controls at begin; retain only the real Store in history so expired controls are not reused by undo/redo. Continue admission-failure cleanup even if another cleanup reports an error.
- Publication of the new lifecycle contract requires an approved store-core/React cohort and dependency floor; workspace/packed-candidate checks do not prove compatibility with an older registry store-core declaration.
- Omit absent optional transaction/origin fields in `bindActionTransactions` metadata rather than emitting explicit `undefined`, so durable JSON backends can participate without silently losing action grouping.
- Accept engine-neutral readonly `StorePathPatch` arrays and readonly dependency paths in `useStorePath` / `useStoreSelectorWithPaths`; export the structural `PatchAwareStore` and `StorePathPatch` types without removing the existing Mutative `Patches` export.
- Match array paths and RFC 6901 JSON Pointers, including escaped properties, numeric indexes, move sources and copy destination shifts. Unrecognized paths/operations conservatively invalidate rather than silently missing updates.
- Preserve intentional `null`/`undefined` snapshot values instead of falling back to `getValue()`.
- Remove the workspace Travels v3 path-hook conversion wrapper, and verify engine-independent behavior against source and installed production CJS consumers.
- Record readability/portability findings and remaining limits in [backend-portability-review.md](./docs/backend-portability-review.md).

## Public API functional validation

- Reset Time Travel path/selector equality history when replacing Store instances, and apply selector equality when the previous selection is `undefined`.
- Read Time Travel control history length through constant-time metadata rather than materializing historical states.
- Publish Ref waiting-state changes when mount waits start and when the last independent waiter settles; cover mount callbacks, live checkers, and saved callbacks after disposal through the public API.
- Add public Action guard/observer/result/reset-scope contracts, Time Travel controls and selection contracts, and functional `/advanced`, `/utils`, and `/backend` contracts to installed-production-CJS consumer verification.
- Record the API validation scope and remaining limits in [api-functional-validation.md](./docs/api-functional-validation.md).

## Cancellation and disposal reliability

- Give each Ref mount waiter its own deadline and abort cleanup; release grouped waits after settlement without affecting independent callers.
- Stop polling immediately on cancellation or Provider disposal, and avoid leaving intervals behind after an already-mounted ref succeeds.
- Ignore stale Ref setters after Provider disposal and fail new waits rather than recreating cleared state.
- Forward Provider/external cancellation to Ref operations, clear operation deadlines/listeners, and serialize actual work until settlement even after a caller times out or cancels.
- Ignore writes and queued updaters after Store disposal, including disposal triggered inside an updater or comparator.

## Provider and Ref isolation

- Keep Ref state and pending mount waits alive through StrictMode effect replay and Activity hide/reveal, reserving Provider cleanup for actual unmount.
- Read Ref mount state through the existing external-store subscription hook so callback refs attached before passive effects are observed, while keeping `setRef` stable across mount-state updates.

## Store subscription reliability

- Preserve full invalidation when patchable and unknown transitions share a notification frame so path subscribers cannot miss changes.
- Apply custom selection equality to `undefined` values and reset selection caches when switching Store instances in the basic value, selector, and path hooks.

## Basic package isolation

- Keep Action schema validation on core's structural `safeParse` contract instead of importing tool-protocol types into the default entry.
- Make WebMCP and tool-protocol optional peers for the explicit `/webmcp` adapter. Basic Action, Store, Context, and Ref use no longer installs these integrations; adapter users must install them explicitly.
