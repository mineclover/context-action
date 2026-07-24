---
document_id: guide--patterns--store--immutability-comparison-integration
category: guide
source_path: en/guide/patterns/store/immutability-comparison-integration.md
character_limit: 1000
last_update: '2026-07-24T05:15:02.215Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Immutability and Comparison Integration

Immutability and Comparison Integration Comprehensive guide to understanding how Immer-based immutability and comparison logic work together in Context-Action stores for optimal performance and correctness. Overview Context-Action uses a dual-layer optimization system within each individual store: - Immer: For safe immutable updates (Copy-on-Write) per store - Compa

Key points:
• **Immer**: For safe immutable updates (Copy-on-Write) per store
• **Comparison Logic**: For change detection and re-render optimization per store
• **Security**: Updater functions...