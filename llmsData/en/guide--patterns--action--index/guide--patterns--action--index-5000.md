---
document_id: guide--patterns--action--index
category: guide
source_path: en/guide/patterns/action/index.md
character_limit: 5000
last_update: '2026-07-24T05:15:02.195Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Action Patterns

Action Patterns Pure action dispatching patterns without state management overhead. Overview Action patterns are perfect for event systems, command patterns, and side effects handling. All Action patterns are built on the standardized setup specifications from the Basic Action Setup guide. Prerequisites Before implementing any Action pattern, complete the setup process: 1. Type Definitions → Common Action Patterns 2. Context Creation → Context Creation Patterns 3. Provider Setup → Provider Setup Patterns All examples in Action pattern documents use the standardized setup patterns, particularly: - EventActions type pattern for basic examples - Single Domain Context creation pattern - Single Provider Setup for component integration Available Action Patterns Core Patterns - Basic Usage - Fundamental Action Only pattern with type-safe dispatching - Uses EventActions setup pattern from Basic Action Setup - Type System - TypeScript integration and type safety - Built on ActionPayloadMap extension pattern from setup guide - Register Delegation - Modular handler organization for large applications - Uses Multi-Domain Context Setup pattern Advanced Patterns - Advanced Patterns - Overview of all advanced action patterns - Showcases multiple setup patterns for complex architectures - Dispatch Patterns - Execution modes, filtering, and performance - Uses AppActions extended interface pattern from setup - Advanced Filtering - Sophisticated handler filtering strategies - Handler ID, priority ranges, custom logic, and combined filtering patterns - Dispatch with Result - Result collection and processing - Built on setup patterns with result handling extensions - Register Patterns - Advanced handler registration and memory management - Uses conditional provider setup patterns for complex scenarios - Includes memory management and handler limit configuration - Dispatch Access - Hook-based vs register-based access - Demonstrates setup pattern variations for different access strategies - Handler State Access - ⚠️ Critical: Avoiding closure traps in handlers - Essential patterns for proper setup and handler lifecycle management Quick Reference All examples use the standardized Basic Action Setup specifications. Setup-Based Quick Start Pattern Reference | Pattern | Setup Foundation | Best For | |---------|------------------|----------| | Basic Usage | EventActions + Single Domain | Event systems, analytics, API calls | | Advanced Patterns | Multi-Domain Setup | Complex applications, domain separation | | Advanced Filtering | ProcessActions + Handler Registry | Conditional execution, workflow control, performance optimization | | Register Delegation | Multi-Context Setup | Large apps, team separation, modular architecture | When to Use Action Patterns Choose Action patterns (

Key points:
• **EventActions** type pattern for basic examples
• **Single Domain Context** creation pattern
• **Single Provider Setup** for component integration
• **[Basic Usage](./basic-usage.md)** - Fundamental Action Only pattern with type-safe dispatching
• **[Type System](./type-system.md)** - TypeScript integration and type safety
• **[Register Delegation](./register-delegation.md)** - Modular handler organization for large applications
• **[Advanced Patterns](./advanced-patterns.md)** - Overview of all advanced action patterns
• **[Dispatch Patterns](./dispatch-patterns.md)** - Execution modes, filtering, and performance
• **[Advanced Filtering](./advanced-filtering.md)** - Sophisticated handler filtering strategies
• **[Dispatch with Result](./dispatch-with-result.md)** - Result collection and processing
• **[Register Patterns](./register-patterns.md)** - Advanced handler registration and memory management
• **[Dispatch Access](./dispatch-access.md)** - Hook-based vs register-based access
• **[Handler State Access](./handler-state-access.md)** - ⚠️ **Critical**: Avoiding closure traps in handlers
• **Pure Side Effects**: Analytics, logging, notifications
• **Command Patterns**: User actions, system commands
• **Event Systems**: Cross-component communication
• **API Integration**: External service calls
• **Modular Architecture**: Team-based handler separation
• ✅ Type-safe action dispatching (via ActionPayloadMap extension)
• ✅ Priority-based handler execution (through proper context creation)
• ✅ Abort support and error handling (built into setup patterns)
• ✅ Result handling with async support (via useActionDispatchWithResult)
• ✅ Memory management and handler limits (configurable limits and monitoring)
• ✅ Lightweight (no store overhead, setup-optimized)
• ✅ Modular handler organization (through...