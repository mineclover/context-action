---
document_id: guide--pipeline--index
category: guide
source_path: en/guide/pipeline/index.md
character_limit: 2000
last_update: '2026-07-24T05:15:02.160Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Pipeline System

Pipeline System Advanced action pipeline features for sophisticated business logic orchestration. Overview The Action Pipeline System provides advanced control mechanisms for managing complex business logic flows through priority-based handler execution, blocking operations, abort mechanisms, and comprehensive result collection. Core Features 🏆 Priority-Based Execution Handlers execute in priority order (highest first) ensuring critical operations run before optional ones. 🚧 Blocking Operations Control execution flow with blocking and non-blocking handlers. 🛑 Abort Mechanisms Stop pipeline execution when conditions aren't met. 📊 Result Collection Collect and coordinate results across handlers. Pipeline Features | Feature | Purpose | Documentation | |---------|---------|---------------| | Priority System | Control execution order | Priority-based handler execution | | Blocking Operations | Control execution flow | Blocking vs non-blocking handlers | | Concurrency Control | Thread safety & queui

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
• **Keep...