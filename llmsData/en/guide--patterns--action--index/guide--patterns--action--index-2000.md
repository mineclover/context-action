---
document_id: guide--patterns--action--index
category: guide
source_path: en/guide/patterns/action/index.md
character_limit: 2000
last_update: '2026-07-24T05:15:02.195Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Action Patterns

Action Patterns Pure action dispatching patterns without state management overhead. Overview Action patterns are perfect for event systems, command patterns, and side effects handling. All Action patterns are built on the standardized setup specifications from the Basic Action Setup guide. Prerequisites Before implementing any Action pattern, complete the setup process: 1. Type Definitions → Common Action Patterns 2. Context Creation → Context Creation Patterns 3. Provider Setup → Provider Setup Patterns All examples in Action pattern documents use the standardized setup patterns, particularly: - EventActions type pattern for basic examples - Single Domain Context creation pattern - Single Provider Setup for component integration Available Action Patterns Core Patterns - Basic Usage - Fundamental Action Only pattern with type-safe dispatching - Uses EventActions setup pattern from Basic Action Setup - Type System - TypeScript integration and type safety - Built on ActionPayloadMap extensi

Key points:
• **EventActions** type pattern for basic examples
• **Single Domain Context** creation pattern
• **Single Provider Setup** for component integration
• **[Basic Usage](./basic-usage.md)** - Fundamental Action Only pattern with type-safe dispatching
• **[Type System](./type-system.md)** - TypeScript integration and type safety
• **[Register Delegation](./register-delegation.md)** - Modular handler organization for large applications
• **[Advanced Patterns](./advanced-patterns.md)** - Overview of all advanced action patterns
• **[Dispatch Patterns](./dispatch-patterns.md)** - Execution modes, filtering, and performance
•...