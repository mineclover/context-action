---
document_id: en_guide_code-patterns
category: guide
source_path: en/guide/code-patterns.md
character_limit: 5000
last_update: '2025-08-30T10:42:08.534Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Code Patterns

Code Patterns 📁 For comprehensive patterns and implementation guides, visit: Pattern Collection This section has been reorganized into the dedicated patterns directory with clear categorization: 🎯 Core Framework Patterns - Action Only Pattern - Pure action dispatching - Store Only Pattern - Type-safe state management   - RefContext Pattern - Zero re-render DOM manipulation 🏗️ Architecture Patterns - Pattern Composition - Combining patterns for complex apps - MVVM Architecture - Single domain architectural layers - Domain Context Architecture - Multi-domain business separation ⚡ Advanced Patterns - Async Patterns - Real-time state, element waiting, timeout protection > Migration Note: All individual pattern files have been consolidated and organized. Please use the patterns directory for the most up-to-date documentation. Quick Reference Essential Rules ✅ Do - Use useCallback for handlers with useWaitForRefs - Access real-time state with store.getValue() - Handle errors with try-catch - Test both mounted/unmounted scenarios ❌ Don't - Use direct DOM queries (document.getElementById) - Rely on component scope values in handlers - Ignore error handling - Skip timeout protection for critical paths

Key points:
• **[Action Only Pattern](./patterns/action-only-pattern.md)** - Pure action dispatching
• **[Store Only Pattern](./patterns/store-only-pattern.md)** - Type-safe state management
• **[RefContext Pattern](./patterns/ref-context-pattern.md)** - Zero re-render DOM manipulation
• **[Pattern Composition](./patterns/pattern-composition.md)** - Combining patterns for complex apps
• **[MVVM Architecture](./patterns/mvvm-architecture.md)** - Single domain architectural layers
• **[Domain Context Architecture](./patterns/domain-context-architecture.md)** - Multi-domain business separation
• **[Async Patterns](./patterns/async-patterns.md)** - Real-time state, element waiting, timeout protection
• Use `useCallback` for handlers with useWaitForRefs
• Access real-time state with `store.getValue()`
• Handle errors with try-catch
• Test both mounted/unmounted scenarios
• Use direct DOM queries (`document.getElementById`)
• Rely on component scope values in handlers
• Ignore error handling
• Skip timeout protection for critical paths