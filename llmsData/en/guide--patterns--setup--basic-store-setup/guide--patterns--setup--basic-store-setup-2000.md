---
document_id: guide--patterns--setup--basic-store-setup
category: guide
source_path: en/guide/patterns/setup/basic-store-setup.md
character_limit: 2000
last_update: '2026-07-24T05:15:02.173Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Basic Store Setup

Basic Store Setup Shared store context setup patterns for the Context-Action framework. Import Type Definitions Common Store Patterns Type Inference Configurations Context Creation Patterns Single Domain Store Context Multi-Domain Store Setup Explicit Generic Types Pattern Provider Setup Patterns Single Provider Setup Multiple Provider Setup HOC Pattern Setup Conditional Store Setup Export Patterns Named Exports (Recommended) Barrel Exports Store Bundle Exports Best Practices Type Organization 1. Domain-Driven Types: Group stores by business domain 2. Consistent Structure: Use consistent property naming and structure 3. Type Safety: Use as const for literal types and proper array typing 4. Initial Values: Provide sensible default values for all stores Context Configuration 1. Strategy Selection: Use 'shallow' for objects, 'deep' for nested structures 2. Performance: Consider comparison strategy impact on re-renders 3. Initial Values: Match initial values with expected data ty

Key points:
• **[Store Basic Usage](../store/basic-usage.md)** - Uses UserStores pattern
• **[Store Performance Patterns](../store/performance-patterns.md)** - Uses optimized configurations
• **[useStoreValue Patterns](../store/useStoreValue-patterns.md)** - Uses access patterns
• **[MVVM Architecture](../architecture/mvvm.md)** - Uses domain store separation
• **[Domain Context Architecture](../architecture/domain-context.md)** - Uses multi-domain stores
• **[Basic Action Setup](./basic-action-setup.md)** - Action context setup patterns
• **[Multi-Context Setup](./multi-context-setup.md)** - Complex architecture setup
•...