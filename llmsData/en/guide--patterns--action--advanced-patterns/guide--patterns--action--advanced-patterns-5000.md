---
document_id: guide--patterns--action--advanced-patterns
category: guide
source_path: en/guide/patterns/action/advanced-patterns.md
character_limit: 5000
last_update: '2026-07-24T05:15:02.187Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Advanced Action Patterns

Advanced Action Patterns Overview of advanced action patterns in the Context-Action framework built on multi-context setup foundations. Prerequisites This guide builds on the complete multi-context setup patterns. For foundational architecture and type definitions: 📚 Multi-Context Setup → - Complete MVVM architecture, domain separation, and provider composition patterns Required Setup Components All advanced patterns in this guide require the multi-context setup including: - MVVM Architecture Setup: Model, ViewModel, and Performance layer contexts - Domain Context Architecture: User, Product, UI, Business, Validation, and Design domains - Provider Composition: Layer-based and domain-based composition patterns - Cross-Context Communication: Event bus and context bridge utilities - Type System: Complete interface definitions for stores, actions, and refs Pattern Categories The Context-Action framework provides core action pattern categories leveraging multi-context setup: 🚀 Dispatch Patterns Cross-domain action dispatching using multi-context setup with MVVM architecture separation. - Cross-Domain Execution: Dispatch actions across User, Product, UI, and Business domains - Layer-Aware Filtering: Model, ViewModel, Performance layer-specific execution - Multi-Context Performance: Domain-isolated execution with shared event bus View Dispatch Patterns → 📊 Result Collection Patterns Advanced result aggregation for complex business workflows across domain boundaries. - Domain Result Aggregation: Collect results from User, Product, and Business contexts - Cross-Context Validation: Validation domain integration with result processing - Enterprise Result Processing: Large-scale data processing with domain separation View Dispatch with Result Patterns → ⚙️ Registration Patterns Domain-aware handler registration with MVVM layer configuration and cross-context coordination. - Domain-Specific Configuration: Priority and tags based on business domains - Layer-Aware Registration: Model, ViewModel, Performance layer targeting - Cross-Context Coordination: Event bus integration and context bridge patterns View Register Patterns → 🔌 Dispatch Access Patterns Multi-context dispatch access using domain-specific hooks and context bridge utilities. - Domain Hook Access: useUserActionDispatch(), useProductActionDispatch() patterns - Context Bridge Access: Cross-domain dispatch using useContextBridge() utility - MVVM Layer Access: Layer-specific dispatch patterns for complex architectures View Dispatch Access Patterns → 🔧 Handler State Access Patterns Advanced state access patterns across domain contexts with MVVM architecture integration. - Cross-Domain State Access: Access User, Product, UI state from any domain - Store Manager Integration: Advanced state ma

Key points:
• **MVVM Architecture Setup**: Model, ViewModel, and Performance layer contexts
• **Domain Context Architecture**: User, Product, UI, Business, Validation, and Design domains
• **Provider Composition**: Layer-based and domain-based composition patterns
• **Cross-Context Communication**: Event bus and context bridge utilities
• **Type System**: Complete interface definitions for stores, actions, and refs
• **Cross-Domain Execution**: Dispatch actions across User, Product, UI, and Business domains
• **Layer-Aware Filtering**: Model, ViewModel, Performance layer-specific execution
• **Multi-Context Performance**: Domain-isolated execution with shared event bus
• **Domain Result Aggregation**: Collect results from User, Product, and Business contexts
• **Cross-Context Validation**: Validation domain integration with result processing
• **Enterprise Result Processing**: Large-scale data processing with domain separation
• **Domain-Specific Configuration**: Priority and tags based on business domains
• **Layer-Aware Registration**: Model, ViewModel, Performance layer targeting
• **Cross-Context Coordination**: Event bus integration and context bridge patterns
• **Domain Hook Access**: `useUserActionDispatch()`, `useProductActionDispatch()` patterns
• **Context Bridge Access**: Cross-domain dispatch using `useContextBridge()` utility
• **MVVM Layer Access**: Layer-specific dispatch patterns for complex architectures
• **Cross-Domain State Access**: Access User, Product, UI state from any domain
• **Store Manager Integration**: Advanced state management with `useStoreManager()` patterns
• **Context Bridge State Access**: Unified state access across domain boundaries
• [Priority Performance...