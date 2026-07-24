---
document_id: guide--patterns--setup--multi-context-setup
category: guide
source_path: en/guide/patterns/setup/multi-context-setup.md
character_limit: 5000
last_update: '2026-07-24T05:15:02.182Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Multi-Context Setup

Multi-Context Setup Complex architecture setup patterns combining multiple contexts for large-scale applications. Import MVVM Architecture Setup Complete Type Definitions MVVM Context Creation Extract All Providers and Hooks Domain Context Architecture Setup Business Domain Setup Validation Domain Setup Design System Context Setup Provider Composition Patterns Layer-Based Composition (MVVM) Domain-Based Composition Conditional Multi-Context Setup Nested Domain Composition Cross-Context Communication Setup Event Bus Pattern Context Bridge Setup Export Patterns for Multi-Context Domain Bundle Exports Provider Composition Exports Best Practices for Multi-Context Setup Architecture Planning 1. Domain Boundaries: Clearly define business domain boundaries 2. Layer Separation: Separate Model, ViewModel, and Performance layers 3. Communication Patterns: Plan cross-context communication early 4. Performance Considerations: Consider provider tree depth and re-render impact Provider Organization 1. Logical Grouping: Group providers by architectural layer or business domain 2. Composition Utilities: Always use composeProviders for multiple providers 3. Conditional Loading: Use feature flags for optional context providers 4. Provider Ordering: Order providers by dependency requirements Type Management 1. Domain Types: Keep domain types in separate files 2. Shared Types: Create shared type libraries for common interfaces 3. Export Strategy: Use barrel exports for clean import statements 4. Type Safety: Maintain strict TypeScript configuration Common Architecture Reference This setup file provides reusable patterns for: - MVVM Architecture - Uses complete MVVM setup - Domain Context Architecture - Uses domain separation - Context Splitting Patterns - Uses provider composition - Performance Patterns - Uses RefContext patterns Related Setup Guides - Basic Action Setup - Single action context patterns - Basic Store Setup - Single store context patterns - Provider Composition - Advanced composition techniques

Key points:
• **[MVVM Architecture](../architecture/mvvm.md)** - Uses complete MVVM setup
• **[Domain Context Architecture](../architecture/domain-context.md)** - Uses domain separation
• **[Context Splitting Patterns](../architecture/context-splitting.md)** - Uses provider composition
• **[Performance Patterns](../performance/optimization-techniques.md)** - Uses RefContext patterns
• **[Basic Action Setup](./basic-action-setup.md)** - Single action context patterns
• **[Basic Store Setup](./basic-store-setup.md)** - Single store context patterns
• **[Provider Composition](../store/withProvider-pattern.md)** - Advanced composition techniques
• **Domain Boundaries**: Clearly define business domain boundaries
• **Layer Separation**: Separate Model, ViewModel, and Performance layers
• **Communication Patterns**: Plan cross-context communication early
• **Performance Considerations**: Consider provider tree depth and re-render impact
• **Logical Grouping**: Group providers by architectural layer or business domain
• **Composition Utilities**: Always use `composeProviders` for multiple providers
• **Conditional Loading**: Use feature flags for optional context providers
• **Provider Ordering**: Order providers by dependency requirements
• **Domain Types**: Keep domain types in separate files
• **Shared Types**: Create shared type libraries for common interfaces
• **Export Strategy**: Use barrel exports for clean import statements
• **Type Safety**: Maintain strict TypeScript configuration