---
document_id: guide--patterns--action--basic-usage
category: guide
source_path: en/guide/patterns/action/basic-usage.md
character_limit: 2000
last_update: '2026-07-24T05:15:02.186Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Action Basic Usage

Action Basic Usage Fundamental Action Only pattern with type-safe dispatching and handler registration. Import Features - ✅ Type-safe action dispatching - ✅ Action handler registration - ✅ Abort support - ✅ Result handling - ✅ Lightweight (no store overhead) Prerequisites Required Setup: Complete the following setup before using this pattern: 1. Type Definitions - Define your action interfaces using the standard patterns 2. Context Creation - Create typed action contexts with proper hook renaming 3. Provider Configuration - Set up action providers in your app structure For detailed setup instructions, see Basic Action Setup. Required Action Types This document uses the EventActions specification from the setup guide: Required Context Setup This document assumes you have created the Event action context: Required Provider Setup This document assumes your app is wrapped with the Event action provider: > Setup Reference: Basic Action Setup Guide Basic Usage Advanced Features Available

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
•...