---
document_id: en_troubleshooting_infinite-loop-issues
category: troubleshooting
source_path: en/troubleshooting/infinite-loop-issues.md
character_limit: 2000
last_update: '2025-08-30T10:42:12.722Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Infinite Loop Issues

Infinite Loop Issues Critical infinite loop problems and their solutions in the Context-Action framework. 🔄 Overview Infinite loops are one of the most critical issues that can occur in state management systems. They typically arise from circular dependencies between actions, state updates, and side effects. This guide covers all known infinite loop patterns and their solutions. 🚨 ActionLogger + onDataChanged Infinite Loops The Problem Symptoms: - Application freezes after multiple rapid actions - Console shows continuous action dispatches - Browser becomes unresponsive with stack overflow errors - Memory usage continuously increases Root Cause Analysis When components dispatch onDataChanged actions and the handler uses actionLogger.logAction(), this creates a circular dependency: Problematic Code Pattern Solution 1: Simple Console Logging Remove actionLogger from onDataChanged handlers and use simple console logging: Solution 2: Direct LogMonitor Integration (Recommend

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
• [ ] Ensure store subscriptions...