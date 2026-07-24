---
document_id: troubleshooting--ref-issues
category: troubleshooting
source_path: en/troubleshooting/ref-issues.md
character_limit: 1000
last_update: '2026-07-24T05:15:02.255Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Ref System Issues

Ref System Issues RefContext and reference management problems in the Context-Action framework. 🔗 Unresolved Refs Ref Mount Timeout Problems The Problem Issue: RefContext promises never resolving, causing memory leaks and hanging async operations. Symptoms: - Components waiting indefinitely for refs - Memory usage growing over time in development - Async operations that never complete - Console

Key points:
• Components waiting indefinitely for refs
• Memory usage growing over time in development
• Async operations that never complete
• Console warnings about unmounted components
• **Ref Caching**: Avoid creating new ref handlers on...