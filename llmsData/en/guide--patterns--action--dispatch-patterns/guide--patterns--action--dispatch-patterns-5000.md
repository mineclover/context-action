---
document_id: guide--patterns--action--dispatch-patterns
category: guide
source_path: en/guide/patterns/action/dispatch-patterns.md
character_limit: 5000
last_update: '2026-07-24T05:15:02.192Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Dispatch Patterns

Dispatch Patterns Core action dispatching patterns for the Context-Action framework, including execution modes, filtering, and performance optimization. Import Prerequisites For complete setup instructions including type definitions, context creation, and provider configuration, see Basic Action Setup. This document uses the AppActions pattern from the setup guide: - Type definitions → Extended Action Interface - Context creation → Single Domain Context - Provider setup → Single Provider Setup The examples assume you have configured the following context: Basic Dispatch Simple action dispatching without result collection. Execution Modes Control how multiple handlers for the same action are executed. Sequential Execution (Default) Handlers execute in sequence, allowing early handlers to modify payload for later ones. Parallel Execution Best for independent operations like analytics, logging, and notifications. Race Execution Useful for fallback mechanisms and performance-critical operations. Handler Filtering Fine-grained control over which handlers execute. Tag-Based Filtering Category Filtering Custom Handler Filtering Performance Optimization Timeout Control Priority-Based Execution Error Handling Basic Error Handling Silent Failures Real-World Examples - Search Page - Debounced search with filtering - Scroll Page - Performance-optimized scroll handling - Priority Demo - Priority-based execution patterns Related Patterns - Action Basic Usage - Fundamental action patterns - Dispatch with Result - Result collection patterns - Register Patterns - Handler registration patterns - Type System - TypeScript integration - Basic Action Setup - Setup patterns and type definitions

Key points:
• Type definitions → [Extended Action Interface](../setup/basic-action-setup.md#extended-action-interface)
• Context creation → [Single Domain Context](../setup/basic-action-setup.md#single-domain-context)
• Provider setup → [Single Provider Setup](../setup/basic-action-setup.md#single-provider-setup)
• [Search Page](https://github.com/mineclover/context-action/blob/main/example/src/pages/actionguard/SearchPage.tsx) - Debounced search with filtering
• [Scroll Page](https://github.com/mineclover/context-action/blob/main/example/src/pages/actionguard/ScrollPage.tsx) - Performance-optimized scroll handling
• [Priority Demo](https://github.com/mineclover/context-action/tree/main/example/src/pages/actionguard/priority-performance) - Priority-based execution patterns
• **[Action Basic Usage](./basic-usage.md)** - Fundamental action patterns
• **[Dispatch with Result](./dispatch-with-result.md)** - Result collection patterns
• **[Register Patterns](./register-patterns.md)** - Handler registration patterns
• **[Type System](./type-system.md)** - TypeScript integration
• **[Basic Action Setup](../setup/basic-action-setup.md)** - Setup patterns and type definitions