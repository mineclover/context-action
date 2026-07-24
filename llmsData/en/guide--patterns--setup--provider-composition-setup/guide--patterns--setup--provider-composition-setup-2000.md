---
document_id: guide--patterns--setup--provider-composition-setup
category: guide
source_path: en/guide/patterns/setup/provider-composition-setup.md
character_limit: 2000
last_update: '2026-07-24T05:15:02.175Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Provider Composition Setup

Provider Composition Setup Advanced provider composition utilities and patterns for managing multiple contexts in the Context-Action framework. Import Overview The composeProviders utility solves "Provider hell" by composing multiple Provider components into a single, clean component. This is essential for applications using multiple contexts (Store, Action, and RefContext). Before vs After Basic Composition Patterns Simple Provider Composition Multi-Domain Composition MVVM Layer Composition Advanced Composition Patterns Conditional Provider Composition Environment-Specific Composition Nested Domain Composition Micro-Frontend Composition Provider Composition with Filtering Array-Based Composition Conditional Array Filtering Performance Optimization Provider Memoization Lazy Provider Loading Export Patterns Composed Provider Exports Factory Pattern Exports Best Practices Composition Organization 1. Logical Grouping: Group providers by domain, layer, or feature 2. Pr

Key points:
• **[Context Splitting Patterns](../architecture/context-splitting.md)** - Uses provider composition
• **[MVVM Architecture](../architecture/mvvm.md)** - Uses layer-based composition
• **[Domain Context Architecture](../architecture/domain-context.md)** - Uses domain composition
• **[withProvider Pattern](../store/withProvider-pattern.md)** - Uses HOC with composition
• **[Basic Action Setup](./basic-action-setup.md)** - Action context patterns
• **[Basic Store Setup](./basic-store-setup.md)** - Store context patterns
• **[RefContext Setup](./ref-context-setup.md)** - RefContext patterns
•...