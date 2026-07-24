---
document_id: guide--patterns--store--useStoreManager-api
category: guide
source_path: en/guide/patterns/store/useStoreManager-api.md
character_limit: 2000
last_update: '2026-07-24T05:15:02.227Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
useStoreManager API

useStoreManager API The useStoreManager hook provides low-level access to the internal StoreManager instance for advanced store management scenarios in the Declarative Store Pattern. Prerequisites For basic store setup and context creation, see Basic Store Setup. This document demonstrates API usage using the store setup: - Store configuration → Type Inference Configurations - Context creation → Single Domain Store Context Basic Usage Getting Store Manager Store Operations API Reference manager.getStore(storeName) Get a typed store instance by name. This is the primary method for accessing stores. Store Instance Methods Once you have a store instance, you can use these methods: Manager Utility Methods Advanced Patterns Bulk Store Operations Conditional Store Updates Store Manager with Validation Integration with Actions Store Manager works seamlessly with Action Context for complex business logic: Performance Considerations Batch Updates Memoized Updates Error Handling Saf

Key points:
• Store configuration → [Type Inference Configurations](../setup/basic-store-setup.md#type-inference-configurations)
• Context creation → [Single Domain Store Context](../setup/basic-store-setup.md#single-domain-store-context)
• [User Profile Management](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/components/UserProfileDemo.tsx)
• [Shopping Cart Operations](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/components/CartDemo.tsx)
• [Settings...