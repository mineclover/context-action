# Unreleased changes

These changes are not included in the published versions listed in [CHANGELOG.md](./CHANGELOG.md).
They do not authorize a version change or publication.

## vNext Phase 1 (M3) Layer 1 Mutative & Timeline parity

- Align `MutativeStateBackend` (`createMutativeStateBackend`) and `MutativeTimelineBackend` (`createMutativeTimelineBackend`) with `@context-action/store-core`'s `StateStore<T>` and `TransactionBackend<T>` contracts (`getValue()`, `isDisposed()`, `getSnapshot()` / `subscribeWithPatches()`).
- Add dynamic notification mode controls (`notificationMode?: 'batched' | 'immediate'`, `getNotificationMode()`, `setNotificationMode(mode)`) with safe pending-frame flushing on mode transitions.
- Enable direct framework-neutral interoperability with `@context-action/react` hooks/Provider DI (`createStoreContext`, `createTimeTravelStoreContext`), `@context-action/lit`, and `@context-action/preact` without creating an extra package.
