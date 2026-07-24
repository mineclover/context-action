---
document_id: context-layered--architecture--folder-structure
category: context-layered
source_path: en/context-layered/architecture/folder-structure.md
character_limit: 2000
last_update: '2026-07-24T05:15:02.303Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Context-Layered Architecture - Folder Structure Guide

Context-Layered Architecture - Folder Structure Guide A comprehensive guide to organizing Context-Action framework projects using Context-Layered Architecture with clear separation of concerns. 🏗️ Context-Layered Architecture Overview The Context-Layered Architecture provides clear separation of responsibilities while maintaining React Context integration. This architecture combines the benefits of traditional Layered Architecture with React Context patterns and props-based dependency injection: 📁 Layer Responsibilities 1. contexts/ - Context Definitions Purpose: Type definitions and context creation only Responsibilities: - ✅ Type definitions (Stores, Actions) - ✅ Context creation - ❌ Handler registration - ❌ Business logic - ❌ UI components 2. business/ - Pure Domain Logic Purpose: Side-effect-free validation, calculations, and state transitions Keep domain rules in pure functions so they can be tested without React, stores, or external services. 3. handlers

Key points:
• ✅ Type definitions (Stores, Actions)
• ✅ Context creation
• ❌ Handler registration
• ❌ Business logic
• ❌ UI components
• ✅ Props-based dependency injection
• ✅ Direct `useActionHandler` usage
• ✅ Business logic implementation
• ✅ Store access and updates
• ❌ UI rendering
• ❌ Direct dispatch calls
• ✅ Action dispatching
• ✅ Payload callback creation
• ✅ Dispatch name mapping
• ❌ Handler registration
• ❌ Business logic