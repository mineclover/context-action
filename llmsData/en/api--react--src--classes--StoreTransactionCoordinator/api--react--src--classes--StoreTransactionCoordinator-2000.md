---
document_id: api--react--src--classes--StoreTransactionCoordinator
category: api
source_path: en/api/react/src/classes/StoreTransactionCoordinator.md
character_limit: 2000
last_update: '2026-10-01T08:20:17.298Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Class: StoreTransactionCoordinator

context-action-monorepo v1.0.1 context-action-monorepo / packages/react/src / StoreTransactionCoordinator Class: StoreTransactionCoordinator Defined in: packages/react/src/stores/core/StoreTransactionCoordinator.ts:75 Groups updates across multiple TimeTravelStores into one history entry per participant. The participant list is explicit so a transaction cannot accidentally capture unrelated global stores. Constructors Constructor > new StoreTransactionCoordinator(): StoreTransactionCoordinator Returns Type parameter StoreTransactionCoordinator Methods subscribe() > subscribe(listener): () => void Defined in: packages/react/src/stores/core/StoreTransactionCoordinator.ts:90 Parameters listener StoreTransactionListener Returns () => void serializeHistory() > serializeHistory(): string Defined in: packages/react/src/stores/core/StoreTransactionCoordinator.ts:95 Returns string getInspectorSnapshot() > getInspectorSnapshot(): StoreTransactionInspectorSnapshot Defined i