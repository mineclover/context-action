---
document_id: guide--code-patterns
category: guide
source_path: en/guide/code-patterns.md
character_limit: 2000
last_update: '2025-08-21T02:13:42.364Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Code Patterns

Core patterns for Context-Action framework's RefContext and useWaitForRefs functionality. For detailed examples and implementation guidelines, see the organized pattern collection:

📁 Pattern Collection

Core Patterns
- RefContext Setup - Basic setup with TypeScript types
- Conditional Await - Core useWaitForRefs behavior
- Wait-Then-Execute - Safe DOM manipulation
- Real-time State Access - Avoiding closure traps
- Timeout Protection - Preventing infinite waits

Quick Reference

Essential Rules

✅ Do
- Use useCallback for handlers with useWaitForRefs
- Access real-time state with store.getValue()
- Handle errors with try-catch
- Test both mounted/unmounted scenarios

❌ Don't
- Use direct DOM queries (document.getElementById)
- Rely on component scope values in handlers
- Ignore error handling
- Skip timeout protection for critical paths.
