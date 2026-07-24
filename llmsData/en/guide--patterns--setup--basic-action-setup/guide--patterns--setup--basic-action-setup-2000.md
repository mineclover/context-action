---
document_id: guide--patterns--setup--basic-action-setup
category: guide
source_path: en/guide/patterns/setup/basic-action-setup.md
character_limit: 2000
last_update: '2026-07-24T05:15:02.181Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Basic Action Setup

Basic Action Setup Shared action context setup patterns for the Context-Action framework. Import Type Definitions Common Action Patterns Extended Action Interface Context Creation Patterns Single Domain Context Multi-Domain Context Setup Provider Setup Patterns Single Provider Setup Multiple Provider Setup Conditional Provider Setup Export Patterns Named Exports (Recommended) Barrel Exports Context Bundle Exports Best Practices Type Organization 1. Domain-Driven Types: Group actions by business domain 2. Consistent Naming: Use consistent verb-noun patterns (createUser, updateUser, deleteUser) 3. Payload Structure: Use objects for complex data, primitives for simple values 4. Void Actions: Use void for actions without payload Context Naming 1. Descriptive Names: Use clear domain names ('User', 'Events', 'API') 2. Hook Renaming: Create domain-specific hook names for clarity 3. Provider Naming: Follow Provider suffix convention Provider Organization 1. Logical Grouping: Group

Key points:
• **[Action Basic Usage](../action/basic-usage.md)** - Uses EventActions pattern
• **[Dispatch Access Patterns](../action/dispatch-access.md)** - Uses AppActions pattern
• **[Advanced Action Patterns](../action/advanced-patterns.md)** - Uses multiple domain patterns
• **[MVVM Architecture](../architecture/mvvm.md)** - Uses UserActions pattern
• **[Domain Context Architecture](../architecture/domain-context.md)** - Uses multi-domain patterns
• **[Basic Store Setup](./basic-store-setup.md)** - Store context setup patterns
• **[Multi-Context Setup](./multi-context-setup.md)** - Complex architecture setup
• **[Provider...