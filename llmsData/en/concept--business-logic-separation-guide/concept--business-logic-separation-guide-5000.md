---
document_id: concept--business-logic-separation-guide
category: concept
source_path: en/concept/business-logic-separation-guide.md
character_limit: 5000
last_update: '2026-07-24T05:15:02.342Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Business Logic Separation Guide

Business Logic Separation Guide This guide demonstrates patterns for separating business logic from UI components and state management in the Context-Action framework. > Related Documentation: > - Store Conventions - Store types and usage patterns > - Conventions - Overall coding conventions > - Action Pipeline Guide - Action handler patterns Business Logic Separation Overview Separating business logic from UI components and state management is crucial for maintainability, testability, and scalability. The Context-Action framework supports this through modular business logic patterns with async process state management. Core Principles 1. Pure Business Logic: Business logic should be independent of React and store implementations 2. State Machines: Use explicit state transitions for complex async processes 3. Progress Decoupling: Separate progress updates from state changes using notifyPath 4. Modular Design: Business logic modules should be testable without UI Pattern 1: Business Logic Module Create pure business logic classes or functions independent of React/stores: Benefits: - ✅ Testable without React or stores - ✅ Reusable across different UI frameworks - ✅ Clear separation of concerns - ✅ Easy to mock and test Test Reference: See packages/react/tests/stores/notifyPath-async-process.test.tsx - describe('Business Logic Separation') - Pure business logic without dependencies - FileUploadService class implementation Pattern 2: Async Process State Machine Use explicit state types and transitions for complex async workflows: State Machine Benefits: - ✅ Explicit state transitions - ✅ Easy to visualize workflow - ✅ Prevents invalid states - ✅ Facilitates debugging Test Reference: See packages/react/tests/stores/notifyPath-async-process.test.tsx - describe('Async Process State Machine') - State machine pattern with notifyPath - it('proves state machine pattern with notifyPath for state-only updates') - Full workflow test Pattern 3: Progress-Only Updates Decouple progress updates from state changes for maximum performance: Progress Decoupling Benefits: - ✅ 100% re-render efficiency (no wasted renders) - ✅ High-frequency updates without performance cost - ✅ Independent component subscriptions - ✅ Optimal for progress bars, loading indicators Test Reference: See packages/react/tests/stores/notifyPath-async-process.test.tsx - describe('Async Process State Machine') - Progress-only updates test - it('proves progress-only updates do not trigger state re-renders') - 10 progress updates, 0 state renders Pattern 4: Modular Integration Integrate business logic, state management, and UI with clear boundaries: Integration Benefits: - ✅ Business logic testable in isolation - ✅ State management decoupled from business logic - ✅ UI components are pure pres

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
• ✅ 100% re-render efficiency (no wasted renders)
• ✅ High-frequency updates without performance cost
• ✅ Independent component subscriptions
• ✅ Optimal for progress bars, loading indicators
• `describe('Async Process State Machine')` - Progress-only updates test
• `it('proves progress-only updates do not trigger state re-renders')` - 10 progress updates, 0 state renders
• ✅ Business logic testable in isolation
• ✅ State management decoupled from business logic
• ✅ UI components are pure presentation
• ✅ Clear separation of concerns
• ✅ Each layer independently testable
• `describe('Modular Business Logic Integration')` - Complete integration test
• `it('proves integration of business logic, state management, and selective rendering')` - Full layer separation proof
• ✅ Explicit error states
• ✅ Retry logic with backoff
• ✅ Error details tracked
• ✅ Clear failure recovery paths
• `describe('Error Handling with State Machine')` - Error state management test
• `it('proves error state management with notifyPath')` - Validation error handling
• ✅ Per-item state tracking
• ✅ Selective path updates
• ✅ Batch notifications with `notifyPaths`
• ✅ No unnecessary re-renders
• ✅ Global queue status tracking
• `describe('Complex...