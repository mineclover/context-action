---
document_id: en_concept_ref-mount-subscription
category: concept
source_path: en/concept/ref-mount-subscription.md
character_limit: 1000
last_update: '2025-08-29T04:23:12.778Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
RefContext Mount State Subscription

RefContext Mount State Subscription RefContext now provides reactive subscription capabilities for mount state changes, allowing components to respond to mounting/unmounting events with React re-renders. Overview While RefContext's traditional isMounted property uses lazy evaluation to provide the latest state without causing re-renders, the new subscription hooks enable reactive patterns when y

Key points:
• `isMounted`: boolean - Whether the element is currently mounted
• `isWaitingForMount`: boolean - Whether waiting for mount
• `mountedTarget`: T | null - The actual mounted element (or null)
• ✅ Building...