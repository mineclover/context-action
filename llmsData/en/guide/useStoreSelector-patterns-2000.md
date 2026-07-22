---
document_id: en_guide_useStoreSelector-patterns
category: guide
source_path: en/guide/patterns/store/useStoreSelector-patterns.md
character_limit: 2000
last_update: '2025-08-30T10:42:00.901Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
useStoreSelector Patterns

useStoreSelector Patterns Advanced store selection patterns with useStoreSelector for selective subscription and performance optimization. Prerequisites This guide builds upon the Setup specification. Ensure you have: - Basic understanding of Store Setup Patterns - Familiarity with UserStores and ProductStores naming patterns - Knowledge of Store Provider Setup Core Features The useStoreSelector hook provides: - Selective Subscription: Subscribe to specific parts of store data only - Automatic Selector Stabilization: Internal useRef ensures selectors work without memoization - Performance Optimization: Prevents unnecessary re-renders through intelligent equality checking - Type Safety: Full TypeScript support with generic type parameters Internal Selector Stabilization Key Feature: useStoreSelector internally uses useRef to stabilize selector functions, meaning you can pass inline selectors without performance issues: How it works internally: - Selector functions are stored

Key points:
• Basic understanding of [Store Setup Patterns](../setup/store-setup.md)
• Familiarity with `UserStores` and `ProductStores` naming patterns
• Knowledge of [Store Provider Setup](../setup/provider-setup.md)
• **Selective Subscription**: Subscribe to specific parts of store data only
• **Automatic Selector Stabilization**: Internal `useRef` ensures selectors work without memoization
• **Performance Optimization**: Prevents unnecessary re-renders through intelligent equality checking
• **Type Safety**: Full TypeScript support with generic type parameters
• Selector functions are stored in `useRef` to maintain...