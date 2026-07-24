---
document_id: guide--patterns--ref--basic-usage
category: guide
source_path: en/guide/patterns/ref/basic-usage.md
character_limit: 2000
last_update: '2026-07-24T05:15:02.166Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Ref Basic Usage

Ref Basic Usage Fundamental RefContext pattern with type-safe ref management and zero re-renders. Import Features - ✅ Zero React re-renders for DOM manipulation - ✅ Hardware-accelerated transforms - ✅ Type-safe ref management - ✅ Automatic lifecycle management - ✅ Perfect separation of concerns - ✅ Memory efficient with automatic cleanup Prerequisites Required Reading: RefContext Setup Guide This document demonstrates usage patterns using standardized setup patterns: - Type definitions → DOM Element Refs - Context creation → Basic RefContext Setup - Provider setup → Single RefContext Provider - Initialization patterns → Lazy Initialization Setup Pattern Basic Setup Provider Integration Ref Registration Basic Usage Example Custom Hooks Pattern Available Hooks - useRefHandler(name) - Get typed ref handler by name - useWaitForRefs() - Wait for multiple refs to mount - useGetAllRefs() - Access all mounted refs - refHandler.setRef - Set ref callback - refHandler.target - Access current ref

Key points:
• ✅ Zero React re-renders for DOM manipulation
• ✅ Hardware-accelerated transforms
• ✅ Type-safe ref management
• ✅ Automatic lifecycle management
• ✅ Perfect separation of concerns
• ✅ Memory efficient with automatic cleanup
• **Type definitions** → [DOM Element Refs](../setup/ref-context-setup.md#dom-element-refs)
• **Context creation** → [Basic RefContext Setup](../setup/ref-context-setup.md#basic-refcontext-setup)
• **Provider setup** → [Single RefContext Provider](../setup/ref-context-setup.md#single-refcontext-provider)
• **Initialization patterns** → [Lazy...