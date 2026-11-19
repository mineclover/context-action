---
document_id: context-layered--store-selection-and-usage-guide
category: context-layered
source_path: en/context-layered/store-selection-and-usage-guide.md
character_limit: 2000
last_update: '2026-11-19T22:10:08.357Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Store Selection and Usage Guide

Store Selection and Usage Guide Status: Active Spec / Decision ID: CA-SURFACE-CATALOG-001 Owner: Framework Core & React Runtime Related Specifications: - Store and Time-Travel Contracts - Store Conventions - Repository Surface Catalog - CA-STATECHART-EFFECT-001 Context-Action separates write ownership (StoreWriter / Action Handlers) from read ownership (StoreReader / reactive hooks or framework controllers). Every state mutation belongs inside an Action Handler following the three-step flow: read via store.getValue(), compute pure domain logic, and commit via store.setValue() or store.update(). --- 1. Store Selection Matrix | Store / State Mechanism | Package Entry | Primary Use Case | Undo/Redo | React Dependency | | --- | --- | --- | --- | --- | | createStoreContext | @context-action/react | Default choice. Scope multiple domain stores cleanly to a React component subtree | No | Yes | | createStore (Store) | @context-action/react | Standalone module-level st

Key points:
• [Store and Time-Travel Contracts](../../../packages/react/docs/state-contracts.md)
• [Store Conventions](/en/concept/store-conventions)
• [Repository Surface Catalog](/en/context-layered/repository-surface-catalog)
• [CA-STATECHART-EFFECT-001](/en/context-layered/decisions/CA-STATECHART-EFFECT-001)
• `createTimeTravelStore(name, initialValue, { maxHistory, mutable, notificationMode, readMode })` defaults `readMode` to `'reference'` for legacy structural-sharing compatibility.
• Declarative `createTimeTravelStoreContext` defaults `readMode` to `'safe'`.
• Always read via...