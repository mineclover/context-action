---
document_id: guide--patterns--ref--basic-usage
category: guide
source_path: en/guide/patterns/ref/basic-usage.md
character_limit: 5000
last_update: '2026-07-24T05:15:02.166Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Ref Basic Usage

Ref Basic Usage Fundamental RefContext pattern with type-safe ref management and zero re-renders. Import Features - ✅ Zero React re-renders for DOM manipulation - ✅ Hardware-accelerated transforms - ✅ Type-safe ref management - ✅ Automatic lifecycle management - ✅ Perfect separation of concerns - ✅ Memory efficient with automatic cleanup Prerequisites Required Reading: RefContext Setup Guide This document demonstrates usage patterns using standardized setup patterns: - Type definitions → DOM Element Refs - Context creation → Basic RefContext Setup - Provider setup → Single RefContext Provider - Initialization patterns → Lazy Initialization Setup Pattern Basic Setup Provider Integration Ref Registration Basic Usage Example Custom Hooks Pattern Available Hooks - useRefHandler(name) - Get typed ref handler by name - useWaitForRefs() - Wait for multiple refs to mount - useGetAllRefs() - Access all mounted refs - refHandler.setRef - Set ref callback - refHandler.target - Access current ref value - refHandler.isMounted - Check mount status - refHandler.waitForMount() - Async ref waiting - refHandler.withTarget() - Safe operations Real-World Examples Live Examples in Codebase - RefContext Mouse Events Page - Complete mouse tracking with RefContext - Canvas Demo - Canvas drawing with direct DOM manipulation - Form Builder Demo - Dynamic form builder with refs - Element Management Page - Complex element management - Visual Effects Context - Visual effects with RefContext - Performance Context - Performance monitoring with refs Best Practices 1. Hardware Acceleration: Use translate3d() for GPU-accelerated animations 2. Avoid React Re-renders: Keep DOM manipulation outside React's render cycle 3. Separation of Concerns: Use custom hooks for business logic 4. Type Safety: Define clear ref type interfaces with proper HTML element types 5. Performance First: Prioritize 60fps performance over convenience

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
• **Initialization patterns** → [Lazy Initialization](../setup/ref-context-setup.md#lazy-initialization)
• `useRefHandler(name)` - Get typed ref handler by name
• `useWaitForRefs()` - Wait for multiple refs to mount
• `useGetAllRefs()` - Access all mounted refs
• `refHandler.setRef` - Set ref callback
• `refHandler.target` - Access current ref value
• `refHandler.isMounted` - Check mount status
• `refHandler.waitForMount()` - Async ref waiting
• `refHandler.withTarget()` - Safe operations
• **[RefContext Mouse Events Page](https://github.com/mineclover/context-action/blob/main/example/src/pages/mouse-events/ref-context/RefContextMouseEventsPage.tsx)** - Complete mouse tracking with RefContext
• **[Canvas Demo](https://github.com/mineclover/context-action/blob/main/example/src/pages/refs/CanvasRefDemoPage.tsx)** - Canvas drawing with direct DOM manipulation
• **[Form Builder Demo](https://github.com/mineclover/context-action/blob/main/example/src/pages/refs/FormBuilderRefDemoPage.tsx)** - Dynamic form builder with refs
• **[Element Management Page](https://github.com/mineclover/context-action/blob/main/example/src/pages/examples/ElementManagementPage.tsx)** - Complex element management
• **[Visual Effects Context](https://github.com/mineclover/context-action/blob/main/example/src/pages/mouse-events/ref-context/contexts/VisualEffectsRefContext.tsx)** - Visual effects with RefContext
• **[Performance Context](https://github.com/mineclover/context-action/blob/main/example/src/pages/mouse-events/ref-context/contexts/PerformanceRefContext.tsx)** - Performance monitoring with refs
• **Hardware Acceleration**: Use `translate3d()` for GPU-accelerated animations
• **Avoid React Re-renders**: Keep DOM manipulation outside React's render cycle
• **Separation of Concerns**: Use custom hooks for business logic
• **Type Safety**: Define clear ref type interfaces with proper HTML element types
• **Performance First**: Prioritize 60fps performance over convenience