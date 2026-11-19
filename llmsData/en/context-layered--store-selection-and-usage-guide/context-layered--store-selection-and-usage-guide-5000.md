---
document_id: context-layered--store-selection-and-usage-guide
category: context-layered
source_path: en/context-layered/store-selection-and-usage-guide.md
character_limit: 5000
last_update: '2026-11-19T22:10:08.357Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Store Selection and Usage Guide

Store Selection and Usage Guide Status: Active Spec / Decision ID: CA-SURFACE-CATALOG-001 Owner: Framework Core & React Runtime Related Specifications: - Store and Time-Travel Contracts - Store Conventions - Repository Surface Catalog - CA-STATECHART-EFFECT-001 Context-Action separates write ownership (StoreWriter / Action Handlers) from read ownership (StoreReader / reactive hooks or framework controllers). Every state mutation belongs inside an Action Handler following the three-step flow: read via store.getValue(), compute pure domain logic, and commit via store.setValue() or store.update(). --- 1. Store Selection Matrix | Store / State Mechanism | Package Entry | Primary Use Case | Undo/Redo | React Dependency | | --- | --- | --- | --- | --- | | createStoreContext | @context-action/react | Default choice. Scope multiple domain stores cleanly to a React component subtree | No | Yes | | createStore (Store) | @context-action/react | Standalone module-level store, dependency-injected store, or unit tests | No | Yes (Mutative built in) | | createTimeTravelStoreContext / createTimeTravelStore | @context-action/react | Editors, form drafts, and canvas state needing undo/redo history navigation | Yes (Mutative patches) | Yes | | createStateStore | @context-action/store-core | Minimal framework-neutral reference store for Vanilla JS, Node, Preact, Lit, or XState | No | No (0 deps) | | createBackendStore (BackendStore) | @context-action/react/backend | Bridge any user-owned StateBackend into React subscription hooks | Backend-dependent | Yes (wrapper only) | | StoreTransactionCoordinator + bindActionTransactions | @context-action/react | Group mutations across multiple stores into one atomic commit, rollback, and single undo step | Yes (atomic multi-store) | Yes | | useLocalStore / useComputedStore / StoreRegistry | @context-action/react/advanced | Component-lifetime local store / memoized derived value / dynamic named store registry | No | Yes | | createRefContext | @context-action/react | Non-reactive (Tier 3). DOM elements, Canvas handles, and 120fps pointer coordinates with zero React re-renders | No | Yes | | createActorStateReader | @context-action/xstate | Closed statechart read-only projection. Blocks external setValue(); transitions go through actor events only | No | No | | createSourceContext / StoreController | @context-action/preact, @context-action/lit | Read-only Signals or ReactiveController projections of external stores for Preact/Lit hosts | No | No | | createDurableOperationStore | @context-action/tool-durable-operations | Not UI state. Lease/claim idempotency and recovery records for external HTTP, queue, or filesystem side effects | No | No | --- 2. Store Usage Patterns 2.1 createStoreContext (@context-action

Key points:
• [Store and Time-Travel Contracts](../../../packages/react/docs/state-contracts.md)
• [Store Conventions](/en/concept/store-conventions)
• [Repository Surface Catalog](/en/context-layered/repository-surface-catalog)
• [CA-STATECHART-EFFECT-001](/en/context-layered/decisions/CA-STATECHART-EFFECT-001)
• `createTimeTravelStore(name, initialValue, { maxHistory, mutable, notificationMode, readMode })` defaults `readMode` to `'reference'` for legacy structural-sharing compatibility.
• Declarative `createTimeTravelStoreContext` defaults `readMode` to `'safe'`.
• Always read via `store.getSafeValue()` when crossing an external serialization or host boundary.
• `ownership: 'shared'` (default): disposing the `BackendStore` wrapper keeps the underlying backend alive.
• `ownership: 'owned'`: disposing the wrapper also disposes the underlying backend.
• Participants are registered explicitly (never discovered globally).
• Notifications are deferred until commit flush so readers never observe half-committed pairs.
• For framework-neutral coordination without React, use `bindActionDispatchTransactions` and `runInTransactionScope` from `@context-action/xstate/effect`.
• **`useLocalStore(initialValue, name?)`**: creates a component-scoped `Store` and automatically calls `dispose()` on unmount, returning `{ value, name, lastUpdate, store }`.
• **`useComputedStore(store, computeFn, config?)`**: derives and memoizes a computed projection from an upstream store with optional `equalityFn`, `initialValue`, `onError`, and `debounceMs`.
• **`StoreRegistry`**: reserved for advanced dynamic store registration, lookup, and cleanup by string key.
• **`createRefContext` (`@context-action/react`) — Non-Reactive Tier 3 State**: Keep DOM nodes, HTML5 Canvas handles, animation timers, and 120fps...