---
document_id: guide--patterns--store--basic-usage
category: guide
source_path: en/guide/patterns/store/basic-usage.md
character_limit: 2000
last_update: '2026-07-24T05:15:02.198Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Store Basic Usage

Store Basic Usage Fundamental Store Only pattern with excellent type inference and simplified API. Import Key Features - ✅ Excellent type inference without manual type annotations - ✅ Simplified API focused on store management - ✅ Direct value or configuration object support - ✅ No need for separate createStore calls Prerequisites For complete setup instructions including store definitions, context creation, and provider configuration, see Basic Store Setup. This document demonstrates usage patterns using the store setup: - Store definitions → Type Inference Configurations - Context creation → Single Domain Store Context - Provider setup → Single Provider Setup Usage Patterns Basic Store Access Pattern Explicit Generic Types Pattern Provider Setup Component Usage Available Hooks - useUserStore(name) - Get typed user domain store by name (primary API) - useUserStoreManager() - Access user store manager (advanced use) - useStoreInfo() - Get registry information (from setup context) -

Key points:
• ✅ Excellent type inference without manual type annotations
• ✅ Simplified API focused on store management
• ✅ Direct value or configuration object support
• ✅ No need for separate `createStore` calls
• Store definitions → [Type Inference Configurations](../setup/basic-store-setup.md#type-inference-configurations)
• Context creation → [Single Domain Store Context](../setup/basic-store-setup.md#single-domain-store-context)
• Provider setup → [Single Provider Setup](../setup/basic-store-setup.md#single-provider-setup)
• `useUserStore(name)` - Get typed user domain store by name (primary API)
• `useUserStoreManager()` -...