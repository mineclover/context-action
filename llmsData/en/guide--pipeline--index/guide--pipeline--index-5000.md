---
document_id: guide--pipeline--index
category: guide
source_path: en/guide/pipeline/index.md
character_limit: 5000
last_update: '2026-07-24T05:15:02.161Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Pipeline System

Pipeline System Advanced action pipeline features for sophisticated business logic orchestration. Overview The Action Pipeline System provides advanced control mechanisms for managing complex business logic flows through priority-based handler execution, blocking operations, abort mechanisms, and comprehensive result collection. Core Features 🏆 Priority-Based Execution Handlers execute in priority order (highest first) ensuring critical operations run before optional ones. 🚧 Blocking Operations Control execution flow with blocking and non-blocking handlers. 🛑 Abort Mechanisms Stop pipeline execution when conditions aren't met. 📊 Result Collection Collect and coordinate results across handlers. Pipeline Features | Feature | Purpose | Documentation | |---------|---------|---------------| | Priority System | Control execution order | Priority-based handler execution | | Blocking Operations | Control execution flow | Blocking vs non-blocking handlers | | Concurrency Control | Thread safety & queuing | Pipeline concurrency and race condition prevention | | Dispatch Methods | Trigger pipelines | Basic dispatch vs result collection | | Abort Mechanisms | Stop execution | Graceful pipeline termination | | Result Handling | Collect results | Inter-handler communication | Quick Start 1. Basic Pipeline Setup 2. Register Handlers with Features 3. Execute Pipeline Real-World Pipeline Example E-commerce Order Processing Migration from Basic Actions Before: Simple Action Handlers After: Pipeline-Based Actions Architecture Integration MVVM Layer Integration Integration with Store Patterns Pipeline features work seamlessly with store integration: Best Practices Summary 1. Priority Guidelines - 90-100: Critical validation, security, input checking - 70-89: Business logic, data processing, core operations - 50-69: State updates, external API calls - 30-49: Notifications, secondary operations - 10-29: Analytics, logging, cleanup 2. Blocking Guidelines - Use blocking for operations that affect subsequent handlers - Use non-blocking for analytics, logging, optional enhancements 3. Abort Guidelines - Use abort for business rule violations, validation failures - Use throw for unexpected system errors 4. Result Guidelines - Use consistent result structures - Include meaningful step names and timing - Leverage results for handler coordination 5. Concurrency Guidelines - Keep default queue system for thread safety - Consider disabling only for pure analytics or read-only operations - Use debounce/throttle for high-frequency user interactions Advanced Patterns Explore specific pipeline patterns: - Priority System - Priority-based execution order and best practices - Blocking Operations - Controlling execution flow and performance - Concurrency Control - Thread safety, queuing, and race

Key points:
• **90-100**: Critical validation, security, input checking
• **70-89**: Business logic, data processing, core operations
• **50-69**: State updates, external API calls
• **30-49**: Notifications, secondary operations
• **10-29**: Analytics, logging, cleanup
• **Use blocking** for operations that affect subsequent handlers
• **Use non-blocking** for analytics, logging, optional enhancements
• **Use abort** for business rule violations, validation failures
• **Use throw** for unexpected system errors
• Use consistent result structures
• Include meaningful step names and timing
• Leverage results for handler coordination
• **Keep default** queue system for thread safety
• **Consider disabling** only for pure analytics or read-only operations
• **Use debounce/throttle** for high-frequency user interactions
• **[Priority System](./priority.md)** - Priority-based execution order and best practices
• **[Blocking Operations](./blocking.md)** - Controlling execution flow and performance
• **[Concurrency Control](./concurrency.md)** - Thread safety, queuing, and race condition prevention
• **[Dispatch Methods](./dispatch.md)** - Different ways to trigger pipelines
• **[Abort Mechanisms](./abort.md)** - Graceful pipeline termination
• **[Result Handling](./result-handling.md)** - Comprehensive result collection and usage
• **[Priority Performance Demo](https://mineclover.github.io/context-action/example/actionguard/priority-performance)** - Priority-based execution with performance tracking
• **[API Blocking Demo](https://mineclover.github.io/context-action/example/actionguard/api-blocking)** - Rate limiting with blocking/non-blocking patterns
• **[Enhanced Abortable Search](https://mineclover.github.io/context-action/example/examples/enhanced-search)** - Search cancellation and automatic cleanup
•...