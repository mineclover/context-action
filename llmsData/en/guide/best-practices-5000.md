---
document_id: en_guide_best-practices
category: guide
source_path: en/guide/best-practices.md
character_limit: 5000
last_update: '2025-08-30T10:42:04.683Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Best Practices

Best Practices Essential best practices for Context-Action framework development. This document provides quick references and links to comprehensive pattern guides. <!-- Updated for sync-docs testing --> 📚 Comprehensive Pattern Documentation This guide has been reorganized for better maintainability. For detailed implementations, see the Pattern Collection: 🎯 Core Framework Patterns - Action Patterns - Pure action dispatching without state management - Store Patterns - Type-safe state management (Recommended)   - RefContext Patterns - Direct DOM manipulation with zero re-renders 🏗️ Advanced Patterns - Architecture Patterns - System architecture and design patterns - Async Patterns - Asynchronous operation patterns and control flow - Performance Patterns - Performance optimization techniques - Debug Patterns - Production debugging and troubleshooting ⚠️ Critical Best Practices 🔴 Must-Read Critical Patterns These patterns address common pitfalls that can cause serious issues in production: 1. Handler State Access - ⚠️ CRITICAL Avoid closure traps when accessing store values in action handlers. 📖 Read More: Handler State Access Patterns 2. Production Debugging - 🐛 ESSENTIAL Critical issues like duplicate handlers, race conditions, and component lifecycle conflicts. 📖 Read More: Production Debugging Patterns 3. Real-time State Access - ⚡ IMPORTANT Proper async patterns for accessing current state values. 📖 Read More: Real-time State Access 📋 Quick Reference Essential Development Rules ✅ Always Do - Use useCallback for action handlers - Access real-time state with store.getValue() in handlers - Choose appropriate comparison strategies for stores - Handle errors with try-catch in action handlers - Test both mounted/unmounted scenarios ❌ Never Do - Use component scope values in action handlers (closure traps!) - Register handlers without useCallback - Use direct DOM queries (document.getElementById) - Ignore error handling in critical operations - Skip timeout protection for async operations Pattern Selection Guide 📖 Detailed Documentation Core Concepts For naming conventions, file structure, and type definitions, see: - Conventions Guide - Complete coding conventions - Architecture Guide - MVVM architecture guide - Pattern Guide - Pattern selection guide Implementation Guides For step-by-step implementation details, see: - Basic Examples - Working code examples - Pattern Collection - Comprehensive implementation guides 🚨 Common Pitfalls ⚠️ Critical Issues to Avoid 1. Closure Traps: Never use component scope values in handlers 2. Duplicate Handlers: Check for multiple registrations of same handler 3. Race Conditions: Use processing state flags for critical actions 4. Memory Leaks: Clean up refs, animations, and event listeners 5. Stale State: Always use sto

Key points:
• **[Action Patterns](./patterns/action/)** - Pure action dispatching without state management
• **[Store Patterns](./patterns/store/)** - Type-safe state management (Recommended)
• **[RefContext Patterns](./patterns/ref/)** - Direct DOM manipulation with zero re-renders
• **[Architecture Patterns](./patterns/architecture/)** - System architecture and design patterns
• **[Async Patterns](./patterns/async/)** - Asynchronous operation patterns and control flow
• **[Performance Patterns](./patterns/performance/)** - Performance optimization techniques
• **[Debug Patterns](./patterns/debug/)** - Production debugging and troubleshooting
• Use `useCallback` for action handlers
• Access real-time state with `store.getValue()` in handlers
• Choose appropriate comparison strategies for stores
• Handle errors with try-catch in action handlers
• Test both mounted/unmounted scenarios
• Use component scope values in action handlers (closure traps!)
• Register handlers without `useCallback`
• Use direct DOM queries (`document.getElementById`)
• Ignore error handling in critical operations
• Skip timeout protection for async operations
• **[Conventions Guide](../concept/conventions.md)** - Complete coding conventions
• **[Architecture Guide](../concept/architecture-guide.md)** - MVVM architecture guide
• **[Pattern Guide](../concept/pattern-guide.md)** - Pattern selection guide
• **[Basic Examples](../../examples/)** - Working code examples
• **[Pattern Collection](./patterns/)** - Comprehensive implementation guides
• [API Reference](../../api/) - Complete API documentation
• [Example Code](../../../example/) - Working example application
• [Pattern Collection](./patterns/) - Comprehensive pattern guides
• [Context-Action GitHub](https://github.com/mineclover/context-action) - Source code and issues
• [TypeScript...