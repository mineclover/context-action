---
document_id: context-layered--architecture--folder-structure
category: context-layered
source_path: en/context-layered/architecture/folder-structure.md
character_limit: 5000
last_update: '2026-07-24T05:15:02.303Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Context-Layered Architecture - Folder Structure Guide

Context-Layered Architecture - Folder Structure Guide A comprehensive guide to organizing Context-Action framework projects using Context-Layered Architecture with clear separation of concerns. 🏗️ Context-Layered Architecture Overview The Context-Layered Architecture provides clear separation of responsibilities while maintaining React Context integration. This architecture combines the benefits of traditional Layered Architecture with React Context patterns and props-based dependency injection: 📁 Layer Responsibilities 1. contexts/ - Context Definitions Purpose: Type definitions and context creation only Responsibilities: - ✅ Type definitions (Stores, Actions) - ✅ Context creation - ❌ Handler registration - ❌ Business logic - ❌ UI components 2. business/ - Pure Domain Logic Purpose: Side-effect-free validation, calculations, and state transitions Keep domain rules in pure functions so they can be tested without React, stores, or external services. 3. handlers/ - Handler Logic (Props-based) Purpose: Isolated handler registration with props-based dependency injection Key Features: - ✅ Props-based dependency injection - ✅ Direct useActionHandler usage - ✅ Business logic implementation - ✅ Store access and updates - ❌ UI rendering - ❌ Direct dispatch calls Group those handler hooks behind one domain registry. The registry is the only place where a page-level feature registers handlers, even when the feature has only one handler. 4. actions/ - Dispatch + Callbacks Purpose: Action dispatching and payload callback creation Responsibilities: - ✅ Action dispatching - ✅ Payload callback creation - ✅ Dispatch name mapping - ❌ Handler registration - ❌ Business logic - ❌ Store subscriptions 5. hooks/ - Store Subscriptions Purpose: Reactive store value subscriptions for views Responsibilities: - ✅ Store value subscriptions - ✅ Computed values for UI - ✅ Data transformation for views - ❌ Handler registration - ❌ Action dispatching - ❌ Business logic 6. views/ - Pure UI Components Purpose: Pure UI rendering without business logic Responsibilities: - ✅ UI rendering - ✅ Event handling - ✅ User interactions - ❌ Business logic - ❌ Direct store manipulation - ❌ Handler registration 7. MainPage.tsx - Integration Point Purpose: Provider composition and registry mounting Responsibilities: - ✅ Handler Registry mounting with props - ✅ Context provider setup - ✅ Component composition - ✅ Props dependency injection - ❌ Direct business logic - ❌ UI implementation details 🎯 Key Benefits Clear Separation of Concerns Each layer has a single, well-defined responsibility that doesn't overlap with others. Props-based Dependency Injection Handlers receive all dependencies through props, making them testable and flexible. React Context Integration Handler reg

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
• ❌ Store subscriptions
• ✅ Store value subscriptions
• ✅ Computed values for UI
• ✅ Data transformation for views
• ❌ Handler registration
• ❌ Action dispatching
• ❌ Business logic
• ✅ UI rendering
• ✅ Event handling
• ✅ User interactions
• ❌ Business logic
• ❌ Direct store manipulation
• ❌ Handler registration
• ✅ Handler Registry mounting with props
• ✅ Context provider setup
• ✅ Component composition
• ✅ Props dependency injection
• ❌ Direct business logic
• ❌ UI implementation details
• Keep each layer focused on its single responsibility
• Use props for dependency injection in handlers
• Register handlers in the domain Handler Registry
• Use Action Provider → Store Provider → Ref Provider (when used) → Handler Registry → View nesting
• Maintain clear naming conventions across layers
• Use TypeScript interfaces for all layer boundaries
• Don't register handlers directly in page, view, or context components
• Don't mix business logic with UI components
• Don't access stores directly in action hooks
• Don't put handler logic in action or hook layers
• Don't bypass the props-based dependency pattern