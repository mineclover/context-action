---
document_id: guide--vanilla-js-guide
category: guide
source_path: en/guide/vanilla-js-guide.md
character_limit: 2000
last_update: '2026-07-24T05:15:02.246Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Vanilla JavaScript Guide

Vanilla JavaScript Guide The @context-action/core package is a framework-agnostic action pipeline management library that works perfectly with vanilla JavaScript. This guide shows you how to use Context-Action in plain JavaScript applications without React. 📦 Installation 🎯 Core Concepts Context-Action provides a powerful action pipeline system for vanilla JavaScript: 1. ActionRegister: Central action management system 2. Type-safe Actions: Define actions with payload types (TypeScript optional) 3. Priority-based Handlers: Execute handlers in priority order 4. Multiple Execution Modes: Sequential, parallel, or race execution 5. Advanced Control: Debouncing, throttling, filtering, and result collection 🚀 Quick Start Basic Example With TypeScript (Optional) 🎨 Real-World Examples Example 1: Form Validation with Multiple Handlers Example 2: Event System with Debouncing Example 3: State Management Pattern Example 4: Parallel Execution for Independent Operations Example 5: Advanced Result Collecti

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
• [React Integration...