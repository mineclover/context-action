---
document_id: guide--vanilla-js-guide
category: guide
source_path: en/guide/vanilla-js-guide.md
character_limit: 5000
last_update: '2026-07-24T05:15:02.246Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Vanilla JavaScript Guide

Vanilla JavaScript Guide The @context-action/core package is a framework-agnostic action pipeline management library that works perfectly with vanilla JavaScript. This guide shows you how to use Context-Action in plain JavaScript applications without React. 📦 Installation 🎯 Core Concepts Context-Action provides a powerful action pipeline system for vanilla JavaScript: 1. ActionRegister: Central action management system 2. Type-safe Actions: Define actions with payload types (TypeScript optional) 3. Priority-based Handlers: Execute handlers in priority order 4. Multiple Execution Modes: Sequential, parallel, or race execution 5. Advanced Control: Debouncing, throttling, filtering, and result collection 🚀 Quick Start Basic Example With TypeScript (Optional) 🎨 Real-World Examples Example 1: Form Validation with Multiple Handlers Example 2: Event System with Debouncing Example 3: State Management Pattern Example 4: Parallel Execution for Independent Operations Example 5: Advanced Result Collection 🎯 Advanced Patterns Pattern 1: Handler Filtering Pattern 2: Conditional Execution Pattern 3: Retry on Error Pattern 4: AbortController Integration 🛠️ Utility Helpers Simple Vanilla JS Store Simple Action Helper 📚 API Reference ActionRegister Methods - register(action, handler, config?) - Register an action handler - dispatch(action, payload?, options?) - Dispatch an action - dispatchWithResult(action, payload?, options?) - Dispatch and get detailed result - unregister(action, handlerId?) - Remove handler(s) - cleanup() - Remove all handlers - getRegistryInfo() - Get registry statistics - getActionStats(action) - Get action-specific statistics Handler Configuration Dispatch Options 🎓 Best Practices 1. Use TypeScript for Type Safety (optional but recommended) 2. Follow Store Integration Pattern: Read → Execute → Update 3. Set Appropriate Priorities: Validation (high) → Business Logic (medium) → Side Effects (low) 4. Use Debouncing for User Input: Search, form validation, etc. 5. Use Throttling for High-Frequency Events: Scroll, mouse move, resize 6. Clean Up Handlers: Call unregister functions when no longer needed 7. Handle Errors Gracefully: Use controller.abort() for validation errors 8. Leverage Execution Modes: Sequential for dependent operations, parallel for independent 🔗 See Also - Action Pattern Guide - Store Integration Pattern - TypeScript API Reference - React Integration Guide

Key points:
• `register(action, handler, config?)` - Register an action handler
• `dispatch(action, payload?, options?)` - Dispatch an action
• `dispatchWithResult(action, payload?, options?)` - Dispatch and get detailed result
• `unregister(action, handlerId?)` - Remove handler(s)
• `cleanup()` - Remove all handlers
• `getRegistryInfo()` - Get registry statistics
• `getActionStats(action)` - Get action-specific statistics
• [Action Pattern Guide](./patterns/action/index.md)
• [Store Integration Pattern](../concept/store-conventions.md)
• [TypeScript API Reference](../../api/core/README.md)
• [React Integration Guide](./patterns/action/react-integration.md)
• **ActionRegister**: Central action management system
• **Type-safe Actions**: Define actions with payload types (TypeScript optional)
• **Priority-based Handlers**: Execute handlers in priority order
• **Multiple Execution Modes**: Sequential, parallel, or race execution
• **Advanced Control**: Debouncing, throttling, filtering, and result collection
• **Use TypeScript for Type Safety** (optional but recommended)
• **Follow Store Integration Pattern**: Read → Execute → Update
• **Set Appropriate Priorities**: Validation (high) → Business Logic (medium) → Side Effects (low)
• **Use Debouncing for User Input**: Search, form validation, etc.
• **Use Throttling for High-Frequency Events**: Scroll, mouse move, resize
• **Clean Up Handlers**: Call unregister functions when no longer needed
• **Handle Errors Gracefully**: Use controller.abort() for validation errors
• **Leverage Execution Modes**: Sequential for dependent operations, parallel for independent