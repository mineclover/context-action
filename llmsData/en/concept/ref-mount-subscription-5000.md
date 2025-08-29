---
document_id: en_concept_ref-mount-subscription
category: concept
source_path: en/concept/ref-mount-subscription.md
character_limit: 5000
last_update: '2025-08-29T04:23:12.778Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
RefContext Mount State Subscription

RefContext Mount State Subscription RefContext now provides reactive subscription capabilities for mount state changes, allowing components to respond to mounting/unmounting events with React re-renders. Overview While RefContext's traditional isMounted property uses lazy evaluation to provide the latest state without causing re-renders, the new subscription hooks enable reactive patterns when you need components to respond to mount state changes. Available Subscription Hooks 1. useRefMountState(refName) Subscribes to mount state changes and triggers re-renders when the state changes. Returns: - isMounted: boolean - Whether the element is currently mounted - isWaitingForMount: boolean - Whether waiting for mount - mountedTarget: T | null - The actual mounted element (or null) 2. useOnMountStateChange(refName, callback) Executes a callback whenever mount state changes. 3. useRefMountChecker(refName) Returns a stable function to check current mount state (useful in event handlers). Usage Patterns Pattern 1: Reactive Mount Status Display Pattern 2: Mount-Based Effect Execution Pattern 3: Event Handler Safety Checks Comparison: Lazy Evaluation vs Reactive Subscription Traditional (Lazy Evaluation) - Zero Re-renders New (Reactive Subscription) - Triggers Re-renders When to Use Each Pattern Use Lazy Evaluation (Traditional) When: - ✅ Building selective subscription patterns (zero re-renders) - ✅ High-performance direct DOM manipulation - ✅ Event handlers that check current state - ✅ Non-reactive patterns for maximum performance Use Reactive Subscription (New) When: - ✅ UI needs to reflect mount state changes - ✅ Components need to react to mounting/unmounting - ✅ Conditional rendering based on mount status - ✅ Triggering effects when elements become available Integration with Selective Subscription Patterns The new subscription hooks work seamlessly with selective subscription patterns: Performance Considerations - Reactive Subscription: Triggers React re-renders when mount state changes - Lazy Evaluation: Zero re-renders, always current state - Mount Checker: Stable function, zero re-renders, current state on demand Choose the appropriate pattern based on whether you need reactive UI updates or maximum performance with direct DOM manipulation. TypeScript Support All subscription hooks are fully type-safe: Migration Guide From Manual State Tracking From useEffect + ref checks

Key points:
• `isMounted`: boolean - Whether the element is currently mounted
• `isWaitingForMount`: boolean - Whether waiting for mount
• `mountedTarget`: T | null - The actual mounted element (or null)
• ✅ Building selective subscription patterns (zero re-renders)
• ✅ High-performance direct DOM manipulation
• ✅ Event handlers that check current state
• ✅ Non-reactive patterns for maximum performance
• ✅ UI needs to reflect mount state changes
• ✅ Components need to react to mounting/unmounting
• ✅ Conditional rendering based on mount status
• ✅ Triggering effects when elements become available
• **Reactive Subscription**: Triggers React re-renders when mount state changes
• **Lazy Evaluation**: Zero re-renders, always current state
• **Mount Checker**: Stable function, zero re-renders, current state on demand