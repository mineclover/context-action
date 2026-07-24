---
document_id: troubleshooting--ref-issues
category: troubleshooting
source_path: en/troubleshooting/ref-issues.md
character_limit: 2000
last_update: '2026-07-24T05:15:02.255Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Ref System Issues

Ref System Issues RefContext and reference management problems in the Context-Action framework. 🔗 Unresolved Refs Ref Mount Timeout Problems The Problem Issue: RefContext promises never resolving, causing memory leaks and hanging async operations. Symptoms: - Components waiting indefinitely for refs - Memory usage growing over time in development - Async operations that never complete - Console warnings about unmounted components Root Cause Refs are expected but never get set due to component lifecycle issues: The Fix Ensure proper ref registration and mounting: Ref Handler Registration Patterns Component Mount Order Issues Issue: Ref handlers registered after components that need them are already mounted. Solution: Register ref handlers before component content: 🕐 Mount Timeout Problems Ref Timeout Configuration Default Timeout Issues Issue: Default ref mount timeouts may be too short for complex components. Solution: Configure appropriate timeouts based on component complexity: Co

Key points:
• Components waiting indefinitely for refs
• Memory usage growing over time in development
• Async operations that never complete
• Console warnings about unmounted components
• **Ref Caching**: Avoid creating new ref handlers on each render
• **Cleanup Optimization**: Use batch cleanup for multiple refs
• **Memory Monitoring**: Monitor ref memory usage in development
• **Timeout Tuning**: Set appropriate timeouts based on component complexity
• **Mock Refs**: Create mock refs for testing components
• **Timeout Testing**: Test timeout scenarios and error handling
• **Memory Testing**: Verify ref cleanup prevents memory...