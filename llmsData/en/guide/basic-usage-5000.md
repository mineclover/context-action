---
document_id: en_guide_basic-usage
category: guide
source_path: en/guide/patterns/store/basic-usage.md
character_limit: 5000
last_update: '2025-08-30T10:41:53.708Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Store Basic Usage

Store Basic Usage Fundamental Store Only pattern with excellent type inference and simplified API. Import Key Features - ✅ Excellent type inference without manual type annotations - ✅ Simplified API focused on store management - ✅ Direct value or configuration object support - ✅ No need for separate createStore calls Prerequisites For complete setup instructions including store definitions, context creation, and provider configuration, see Basic Store Setup. This document demonstrates usage patterns using the store setup: - Store definitions → Type Inference Configurations - Context creation → Single Domain Store Context - Provider setup → Single Provider Setup Usage Patterns Basic Store Access Pattern Explicit Generic Types Pattern Provider Setup Component Usage Available Hooks - useUserStore(name) - Get typed user domain store by name (primary API) - useUserStoreManager() - Access user store manager (advanced use) - useStoreInfo() - Get registry information (from setup context) - useStoreClear() - Clear all stores (from setup context) Real-World Examples Live Examples in Codebase - Todo List Demo - Complete CRUD with filtering and sorting - Chat Demo - Real-time message state management - User Profile Demo - Profile data management - Store Basics Page - Basic store operations - React Provider Page - Provider composition patterns - Store Scenarios Index - Central store configuration Best Practices 1. Use Type Inference: Let TypeScript infer types automatically 2. Direct Values: Use direct values for simple types 3. Configuration Objects: Use configuration objects for complex types 4. Domain Naming: Use descriptive domain names for contexts 5. Subscription Management: Only subscribe to stores you actually need to prevent unnecessary re-renders

Key points:
• ✅ Excellent type inference without manual type annotations
• ✅ Simplified API focused on store management
• ✅ Direct value or configuration object support
• ✅ No need for separate `createStore` calls
• Store definitions → [Type Inference Configurations](../setup/basic-store-setup.md#type-inference-configurations)
• Context creation → [Single Domain Store Context](../setup/basic-store-setup.md#single-domain-store-context)
• Provider setup → [Single Provider Setup](../setup/basic-store-setup.md#single-provider-setup)
• `useUserStore(name)` - Get typed user domain store by name (primary API)
• `useUserStoreManager()` - Access user store manager (advanced use)
• `useStoreInfo()` - Get registry information (from setup context)
• `useStoreClear()` - Clear all stores (from setup context)
• **[Todo List Demo](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/components/TodoListDemo.tsx)** - Complete CRUD with filtering and sorting
• **[Chat Demo](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/components/ChatDemo.tsx)** - Real-time message state management
• **[User Profile Demo](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/components/UserProfileDemo.tsx)** - Profile data management
• **[Store Basics Page](https://github.com/mineclover/context-action/blob/main/example/src/pages/store/StoreBasicsPage.tsx)** - Basic store operations
• **[React Provider Page](https://github.com/mineclover/context-action/blob/main/example/src/pages/react/ReactProviderPage.tsx)** - Provider composition patterns
• **[Store Scenarios Index](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/stores/index.ts)** - Central store configuration
• **Use Type Inference**: Let TypeScript infer types automatically
• **Direct Values**: Use direct values for simple types
• **Configuration Objects**: Use configuration objects for complex types
• **Domain Naming**: Use descriptive domain names for contexts
• **Subscription Management**: Only subscribe to stores you actually need to prevent unnecessary re-renders