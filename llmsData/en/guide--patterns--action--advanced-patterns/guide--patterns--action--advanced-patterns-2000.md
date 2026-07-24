---
document_id: guide--patterns--action--advanced-patterns
category: guide
source_path: en/guide/patterns/action/advanced-patterns.md
character_limit: 2000
last_update: '2026-07-24T05:15:02.187Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Advanced Action Patterns

Advanced Action Patterns Overview of advanced action patterns in the Context-Action framework built on multi-context setup foundations. Prerequisites This guide builds on the complete multi-context setup patterns. For foundational architecture and type definitions: 📚 Multi-Context Setup → - Complete MVVM architecture, domain separation, and provider composition patterns Required Setup Components All advanced patterns in this guide require the multi-context setup including: - MVVM Architecture Setup: Model, ViewModel, and Performance layer contexts - Domain Context Architecture: User, Product, UI, Business, Validation, and Design domains - Provider Composition: Layer-based and domain-based composition patterns - Cross-Context Communication: Event bus and context bridge utilities - Type System: Complete interface definitions for stores, actions, and refs Pattern Categories The Context-Action framework provides core action pattern categories leveraging multi-context setup: 🚀

Key points:
• **MVVM Architecture Setup**: Model, ViewModel, and Performance layer contexts
• **Domain Context Architecture**: User, Product, UI, Business, Validation, and Design domains
• **Provider Composition**: Layer-based and domain-based composition patterns
• **Cross-Context Communication**: Event bus and context bridge utilities
• **Type System**: Complete interface definitions for stores, actions, and refs
• **Cross-Domain Execution**: Dispatch actions across User, Product, UI, and Business domains
• **Layer-Aware Filtering**: Model, ViewModel, Performance layer-specific execution
• **Multi-Context...