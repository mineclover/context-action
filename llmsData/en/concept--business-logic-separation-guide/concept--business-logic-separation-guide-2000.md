---
document_id: concept--business-logic-separation-guide
category: concept
source_path: en/concept/business-logic-separation-guide.md
character_limit: 2000
last_update: '2026-07-24T05:15:02.342Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Business Logic Separation Guide

Business Logic Separation Guide This guide demonstrates patterns for separating business logic from UI components and state management in the Context-Action framework. > Related Documentation: > - Store Conventions - Store types and usage patterns > - Conventions - Overall coding conventions > - Action Pipeline Guide - Action handler patterns Business Logic Separation Overview Separating business logic from UI components and state management is crucial for maintainability, testability, and scalability. The Context-Action framework supports this through modular business logic patterns with async process state management. Core Principles 1. Pure Business Logic: Business logic should be independent of React and store implementations 2. State Machines: Use explicit state transitions for complex async processes 3. Progress Decoupling: Separate progress updates from state changes using notifyPath 4. Modular Design: Business logic modules should be testable without UI Pattern 1: B

Key points:
• ✅ Testable without React or stores
• ✅ Reusable across different UI frameworks
• ✅ Clear separation of concerns
• ✅ Easy to mock and test
• `describe('Business Logic Separation')` - Pure business logic without dependencies
• `FileUploadService` class implementation
• ✅ Explicit state transitions
• ✅ Easy to visualize workflow
• ✅ Prevents invalid states
• ✅ Facilitates debugging
• `describe('Async Process State Machine')` - State machine pattern with notifyPath
• `it('proves state machine pattern with notifyPath for state-only updates')` - Full workflow test
• ✅ 100% re-render efficiency (no wasted...