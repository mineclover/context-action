---
document_id: en_guide_batching-patterns
category: guide
source_path: en/guide/patterns/store/batching-patterns.md
character_limit: 2000
last_update: '2025-08-30T10:41:54.620Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Batched Updates

Batched Updates Optimization patterns for batching multiple store updates to prevent unnecessary re-renders and improve performance. Store Update Batching Use React's unstablebatchedUpdates to batch multiple store updates: Store Batch API Use the store's built-in batch method for optimal performance: When to Use Batching Ideal Scenarios - Multiple Store Updates: When updating several stores simultaneously - Related Operations: When operations are logically related and should appear atomic - Performance Critical: When minimizing re-renders is crucial for performance - Form Submissions: When processing complex form data across multiple stores Performance Benefits - Reduced Re-renders: Multiple updates trigger only one re-render - Better UX: Atomic updates prevent intermediate inconsistent states - Improved Performance: Fewer DOM updates and effect executions Best Practices ✅ Do - Batch related store updates together - Use store's native batch method when available - Keep batched operati

Key points:
• **Multiple Store Updates**: When updating several stores simultaneously
• **Related Operations**: When operations are logically related and should appear atomic
• **Performance Critical**: When minimizing re-renders is crucial for performance
• **Form Submissions**: When processing complex form data across multiple stores
• **Reduced Re-renders**: Multiple updates trigger only one re-render
• **Better UX**: Atomic updates prevent intermediate inconsistent states
• **Improved Performance**: Fewer DOM updates and effect executions
• Batch related store updates together
• Use store's native batch method when available
• Keep...