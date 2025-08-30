---
document_id: en_guide_withProvider-pattern
category: guide
source_path: en/guide/patterns/store/withProvider-pattern.md
character_limit: 2000
last_update: '2025-08-30T10:41:56.483Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
withProvider Pattern

withProvider Pattern Higher-Order Component pattern using withProvider for automatic Provider wrapping in Store Only pattern. Prerequisites Before using this pattern, you need to set up your store contexts. See the following guides for complete setup: - Basic Store Setup - Store context creation patterns - Provider Composition Setup - Advanced provider composition utilities Overview The HOC (Higher-Order Component) pattern provides automatic Provider wrapping, eliminating the need for manual Provider composition in your component tree. Basic HOC Usage Advanced HOC Configuration Multiple HOC Composition Conditional HOC Pattern Lazy HOC Pattern HOC with Props Passing Best Practices 1. Single Responsibility: Each HOC should handle one concern 2. Props Preservation: Ensure props are properly passed through 3. Type Safety: Maintain type safety through HOC composition 4. Performance: Use HOCs to avoid Provider hell and improve performance 5. Composition: Compose multiple HOCs for comple

Key points:
• **[Basic Store Setup](../setup/basic-store-setup.md)** - Store context creation patterns
• **[Provider Composition Setup](../setup/provider-composition-setup.md)** - Advanced provider composition utilities
• **Clean Component Trees**: Avoid deep Provider nesting
• **Reusable Components**: Components that need consistent store setup
• **Testing**: Easier to test components with automatic Provider wrapping
• **Large Applications**: Simplify complex Provider hierarchies
• **Team Development**: Standardize store setup across teams
• **Component Libraries**: Package components with their required providers
•...