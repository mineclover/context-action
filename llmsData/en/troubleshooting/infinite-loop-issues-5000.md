---
document_id: en_troubleshooting_infinite-loop-issues
category: troubleshooting
source_path: en/troubleshooting/infinite-loop-issues.md
character_limit: 5000
last_update: '2025-08-30T10:42:12.722Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Infinite Loop Issues

Infinite Loop Issues Critical infinite loop problems and their solutions in the Context-Action framework. 🔄 Overview Infinite loops are one of the most critical issues that can occur in state management systems. They typically arise from circular dependencies between actions, state updates, and side effects. This guide covers all known infinite loop patterns and their solutions. 🚨 ActionLogger + onDataChanged Infinite Loops The Problem Symptoms: - Application freezes after multiple rapid actions - Console shows continuous action dispatches - Browser becomes unresponsive with stack overflow errors - Memory usage continuously increases Root Cause Analysis When components dispatch onDataChanged actions and the handler uses actionLogger.logAction(), this creates a circular dependency: Problematic Code Pattern Solution 1: Simple Console Logging Remove actionLogger from onDataChanged handlers and use simple console logging: Solution 2: Direct LogMonitor Integration (Recommended) Use LogMonitor's MVVM architecture directly instead of generic onDataChanged patterns: 🍞 Toast System Infinite Loops The Problem Symptoms: - Application freezes when toast limit is reached - Continuous HMR updates in development   - Browser becomes unresponsive after 4-5 consecutive actions - Console shows: Current toast state: {currentToastsCount: 4, maxToasts: 4, stackIndex: 14} Root Cause Analysis When maxToasts limit is reached, the system tries to remove old toasts by dispatching a removeToast action. However, if removal actions are tracked by the toast system, this creates an infinite loop: Problematic Code Pattern Solution: Direct Store Updates Use direct store updates instead of action dispatches for internal toast management: Prevention Strategy Exclude removal actions from toast tracking: ⚙️ Action Handler Re-registration Loops The Problem Handlers constantly re-registering causing performance degradation and potential state inconsistencies. Root Cause useCallback dependencies changing on every render: Solution: Stable Handler References Use ref patterns for stable handler references: ⏱️ Timer Cascade Loops The Problem Multiple timers creating cascading effects in rapid succession. Root Cause Each action creates multiple timers without proper cleanup: Solution: Centralized Timer Management 🔄 Store Update Loops The Problem Store updates triggering actions that update the same store. Root Cause Solution: Conditional Updates 🛡️ Prevention Strategies Design Principles 1. Unidirectional Data Flow: Actions → Handlers → Store Updates → UI Updates 2. No Circular Dependencies: Never have handlers dispatch actions that trigger the same handler 3. Direct Store Updates: Use direct store operations for internal state management 4. Action Filtering: Exclude internal/

Key points:
• Application freezes after multiple rapid actions
• Console shows continuous action dispatches
• Browser becomes unresponsive with stack overflow errors
• Memory usage continuously increases
• Application freezes when toast limit is reached
• Continuous HMR updates in development
• Browser becomes unresponsive after 4-5 consecutive actions
• Console shows: `Current toast state: {currentToastsCount: 4, maxToasts: 4, stackIndex: 14}`
• [ ] Check for actions that dispatch other actions in a circular pattern
• [ ] Verify toast/logging systems don't track their own removal actions
• [ ] Ensure store subscriptions don't trigger updates to the same store
• [ ] Confirm timer cleanup is implemented for all setTimeout/setInterval calls
• [ ] Validate that handler registrations use stable references
• [Performance Issues](./performance-issues.md) - General performance optimization
• [Action System Issues](./action-issues.md) - Action handler best practices
• [Store Issues](./store-issues.md) - Store subscription patterns
• Child dispatches onDataChanged → Parent handler processes it
• Parent handler calls actionLogger.logAction() → Internally calls addLog()
• addLog() triggers LogMonitor state changes → May dispatch more actions
• More actions create more onDataChanged events → Back to step 1...
• New toast added → currentToasts.length >= maxToasts
• Dispatch removeToast action → setupSelectiveActionToast detects it
• Creates "removeToast started" toast → exceeds maxToasts again
• Another removeToast dispatched → Back to step 2...
• **Unidirectional Data Flow**: Actions → Handlers → Store Updates → UI Updates
• **No Circular Dependencies**: Never have handlers dispatch actions that trigger the same handler
• **Direct Store Updates**: Use direct store operations for internal state management
•...