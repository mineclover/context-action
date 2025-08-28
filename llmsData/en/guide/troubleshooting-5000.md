---
document_id: en_guide_troubleshooting
category: guide
source_path: en/guide/troubleshooting.md
character_limit: 5000
last_update: '2025-08-28T06:28:37.921Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Troubleshooting Guide

Troubleshooting Guide Common issues and solutions for the Context-Action framework. 🔧 Common Framework Issues Memory Leak Issues Event Object Storage Prevention Issue: DOM event objects being stored in stores causing memory leaks. Solution: The framework automatically detects and prevents storing event objects: Error Message:  EventBus Memory Optimization Issue: Large objects (DOM elements, React components) stored in event history causing memory leaks. Solution: EventBus automatically stores only essential metadata for memory-heavy objects: Type Compatibility Issues Cross-Platform Timeout Types Issue: setTimeout returns different types in browser vs Node.js environments. Solution: Use proper timeout types for cross-platform compatibility: Comparison & Circular Reference Issues Circular Reference Detection Issue: Incorrect circular reference detection in deep comparison. Solution: The framework uses improved circular reference checking: Error Handling Standardization Centralized Error System Issue: Inconsistent error handling across modules. Solution: All modules use standardized ErrorHandlers: 🚨 Critical Performance Issues Infinite Loop Prevention Toast System Infinite Loops Issue: Application freezes when toast limit is reached, causing infinite HMR updates. Root Cause: When maxToasts limit is reached, removing old toasts triggers tracked actions that create new toasts: Symptoms: - Browser DevTools shows continuous HMR updates - Application becomes unresponsive after 4-5 consecutive actions - Console logs show: Current toast state: {currentToastsCount: 4, maxToasts: 4, stackIndex: 14} Solution: Use direct store updates instead of dispatching actions: Action Handler Re-registration Loops Issue: Handlers constantly re-registering causing performance degradation. Root Cause: useCallback dependencies changing on every render: Solution: Use stable references with refs: Timer Cascade Problems Issue: Multiple timers creating cascading effects in rapid succession. Root Cause: Each action creates multiple timers without cleanup: Solution: Centralized timer management: Rate Limiting and Toast Management Toast Spam Prevention Issue: Rapid consecutive actions creating too many toasts. Configuration: Rate limiting is disabled by default to avoid blocking legitimate user interactions: Prevention Strategy: Instead of aggressive rate limiting, use action filtering: Memory Leak Prevention Best Practices: 1. Timer Cleanup: Always clean up timers 2. Action Filtering: Exclude removal actions from toast tracking   3. Direct Store Updates: Use store operations instead of action dispatches for internal operations 4. Duplicate Prevention: Prevent identical toasts within short timeframes 🚨 Common Runtime Issues Handler State Access Problems Stale State in Handlers Issue: Using co

Key points:
• Browser DevTools shows continuous HMR updates
• Application becomes unresponsive after 4-5 consecutive actions
• Console logs show: `Current toast state: {currentToastsCount: 4, maxToasts: 4, stackIndex: 14}`
• **Timer Cleanup**: Always clean up timers
• **Action Filtering**: Exclude removal actions from toast tracking
• **Direct Store Updates**: Use store operations instead of action dispatches for internal operations
• **Duplicate Prevention**: Prevent identical toasts within short timeframes
• Check store comparison strategy:
• Optimize selectors:
• Ensure ref is properly set:
• Check component mounting order:
• **Always use `useCallback`** for action handlers
• **Never store event objects** in stores
• **Access fresh state** with `store.getValue()` in handlers
• **Handle async errors** with try-catch blocks
• **Clean up resources** in useEffect cleanup functions
• **Test unmounted scenarios** to catch memory leaks
• **Verify handler cleanup** when components unmount
• **Mock timers** for consistent testing
• **Test error boundaries** for graceful error handling
• **Monitor memory usage** in development
• **Check re-render frequency** with React DevTools
• **Profile store operations** in performance-critical paths
• **Test with realistic data sizes** to catch scaling issues
• **Check the Error System**: Review `getErrorStatistics()` for detailed error information
• **Enable Debug Mode**: Set stores to `immediate` notification mode for real-time debugging
• **Review Recent Changes**: Check if issues started after recent updates
• **Test in Isolation**: Create minimal reproductions to isolate the problem