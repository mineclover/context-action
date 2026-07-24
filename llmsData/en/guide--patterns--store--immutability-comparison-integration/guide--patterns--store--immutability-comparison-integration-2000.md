---
document_id: guide--patterns--store--immutability-comparison-integration
category: guide
source_path: en/guide/patterns/store/immutability-comparison-integration.md
character_limit: 2000
last_update: '2026-07-24T05:15:02.215Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Immutability and Comparison Integration

Immutability and Comparison Integration Comprehensive guide to understanding how Immer-based immutability and comparison logic work together in Context-Action stores for optimal performance and correctness. Overview Context-Action uses a dual-layer optimization system within each individual store: - Immer: For safe immutable updates (Copy-on-Write) per store - Comparison Logic: For change detection and re-render optimization per store These two systems solve different problems and work together within each store independently, not as replacements for each other. Architecture Overview Two-Layer System Design Why Both Are Needed | System | Purpose | Problem Solved | Scope | |--------|---------|----------------|-------| | Immer | Immutability | Prevents mutation bugs, ensures safe copies | Per individual store | | Comparison | Change Detection | Prevents unnecessary re-renders, optimizes performance | Per individual store | Immer Integration Details 1. Safe

Key points:
• **Immer**: For safe immutable updates (Copy-on-Write) per store
• **Comparison Logic**: For change detection and re-render optimization per store
• **Security**: Updater functions cannot mutate internal state
• **Consistency**: All updates go through the same validation pipeline
• **Performance**: Immer's Copy-on-Write avoids unnecessary object creation
• Would trigger re-render even when value hasn't changed
• No performance optimization for identical values
• Breaks React's optimization assumptions
• "Immer returns same reference if unchanged, so comparison is not needed"
•...