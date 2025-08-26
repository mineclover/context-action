---
document_id: guide--basic-action-setup
category: guide
source_path: en/guide/patterns/setup/basic-action-setup.md
character_limit: 5000
last_update: '2025-08-26T00:34:27.283Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Basic Action Setup

Shared action context setup patterns for the Context-Action framework. Import

Type Definitions

Common Action Patterns

Extended Action Interface

Context Creation Patterns

Single Domain Context

Multi-Domain Context Setup

Provider Setup Patterns

Single Provider Setup

Multiple Provider Setup

Conditional Provider Setup

Export Patterns

Named Exports (Recommended)

Barrel Exports

Context Bundle Exports

Best Practices

Type Organization
1. Domain-Driven Types: Group actions by business domain
2. Consistent Naming: Use consistent verb-noun patterns (createUser, updateUser, deleteUser)
3. Payload Structure: Use objects for complex data, primitives for simple values
4. Void Actions: Use void for actions without payload

Context Naming
1. Descriptive Names: Use clear domain names ('User', 'Events', 'API')
2. Hook Renaming: Create domain-specific hook names for clarity
3. Provider Naming: Follow Provider suffix convention

Provider Organization
1. Logical Grouping: Group related action providers together
2. Feature Flags: Use conditional providers for optional features
3. Provider Composition: Prefer composeProviders over manual nesting
4. Performance: Consider provider placement in component tree

Common Patterns Reference

This setup file provides reusable patterns for:

- Action Basic Usage - Uses EventActions pattern
- Dispatch Access Patterns - Uses AppActions pattern  
- Advanced Action Patterns - Uses multiple domain patterns
- MVVM Architecture - Uses UserActions pattern
- Domain Context Architecture - Uses multi-domain patterns

Related Setup Guides

- Basic Store Setup - Store context setup patterns
- Multi-Context Setup - Complex architecture setup
- Provider Composition - Advanced provider patterns.
