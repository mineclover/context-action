---
document_id: guide--patterns--action--basic-usage
category: guide
source_path: en/guide/patterns/action/basic-usage.md
character_limit: 5000
last_update: '2026-07-24T05:15:02.186Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Action Basic Usage

Action Basic Usage Fundamental Action Only pattern with type-safe dispatching and handler registration. Import Features - ✅ Type-safe action dispatching - ✅ Action handler registration - ✅ Abort support - ✅ Result handling - ✅ Lightweight (no store overhead) Prerequisites Required Setup: Complete the following setup before using this pattern: 1. Type Definitions - Define your action interfaces using the standard patterns 2. Context Creation - Create typed action contexts with proper hook renaming 3. Provider Configuration - Set up action providers in your app structure For detailed setup instructions, see Basic Action Setup. Required Action Types This document uses the EventActions specification from the setup guide: Required Context Setup This document assumes you have created the Event action context: Required Provider Setup This document assumes your app is wrapped with the Event action provider: > Setup Reference: Basic Action Setup Guide Basic Usage Advanced Features Available Hooks From Prerequisites Setup - useEventAction() - Basic action dispatcher (renamed from useActionDispatch) - useEventActionHandler() - Register action handlers (renamed from useActionHandler) - useEventActionWithResult() - Advanced dispatcher with results/abort (renamed from useActionDispatchWithResult) Generic Pattern (before renaming) - useActionDispatch() - Basic action dispatcher - useActionHandler(action, handler, config?) - Register action handlers - useActionDispatchWithResult() - Advanced dispatcher with results/abort - useActionRegister() - Access raw ActionRegister for delegation - useActionContext() - Access raw context Real-World Examples Live Examples in Codebase - Todo List Demo - UI Actions for form interactions - Chat Demo - Real-time message handling - User Profile Demo - User action management - Mouse Events Page - High-frequency event handling - Search Page - Abortable search actions - API Blocking Page - Blocking action patterns Error Handling Best Practices Centralized Error Handling Async Error Recovery Best Practices ✅ Best Practices 1. Always Use useCallback: Wrap all handler functions with useCallback to prevent infinite re-registration 2. Handle Side Effects: Perfect for analytics, logging, API calls 3. Keep Lightweight: No state management overhead 4. Centralized Error Handling: Let framework handle errors automatically instead of manual console.error 5. Event Data Extraction: Extract needed data from DOM events, never store event objects 6. Async Error Recovery: Implement retry logic with proper error boundaries 7. Controller Usage: Use controller.abort() for error cases with context ❌ Avoid - Storing DOM events or React synthetic events in state or dispatching them - Using direct console.error instead of letting framework handle errors ce

Key points:
• ✅ Type-safe action dispatching
• ✅ Action handler registration
• ✅ Abort support
• ✅ Result handling
• ✅ Lightweight (no store overhead)
• `useEventAction()` - Basic action dispatcher (renamed from useActionDispatch)
• `useEventActionHandler()` - Register action handlers (renamed from useActionHandler)
• `useEventActionWithResult()` - Advanced dispatcher with results/abort (renamed from useActionDispatchWithResult)
• `useActionDispatch()` - Basic action dispatcher
• `useActionHandler(action, handler, config?)` - Register action handlers
• `useActionDispatchWithResult()` - Advanced dispatcher with results/abort
• `useActionRegister()` - Access raw ActionRegister for delegation
• `useActionContext()` - Access raw context
• **[Todo List Demo](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/components/TodoListDemo.tsx)** - UI Actions for form interactions
• **[Chat Demo](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/components/ChatDemo.tsx)** - Real-time message handling
• **[User Profile Demo](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/components/UserProfileDemo.tsx)** - User action management
• **[Mouse Events Page](https://github.com/mineclover/context-action/blob/main/example/src/pages/actionguard/MouseEventsPage.tsx)** - High-frequency event handling
• **[Search Page](https://github.com/mineclover/context-action/blob/main/example/src/pages/actionguard/SearchPage.tsx)** - Abortable search actions
• **[API Blocking Page](https://github.com/mineclover/context-action/blob/main/example/src/pages/actionguard/ApiBlockingPage.tsx)** - Blocking action patterns
• Storing DOM events or React synthetic events in state or dispatching them
• Using direct...