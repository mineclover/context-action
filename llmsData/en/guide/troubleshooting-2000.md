---
document_id: en_guide_troubleshooting
category: guide
source_path: en/guide/troubleshooting.md
character_limit: 2000
last_update: '2025-08-28T06:28:37.921Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Troubleshooting Guide

Troubleshooting Guide Common issues and solutions for the Context-Action framework. 🔧 Common Framework Issues Memory Leak Issues Event Object Storage Prevention Issue: DOM event objects being stored in stores causing memory leaks. Solution: The framework automatically detects and prevents storing event objects: Error Message:  EventBus Memory Optimization Issue: Large objects (DOM elements, React components) stored in event history causing memory leaks. Solution: EventBus automatically stores only essential metadata for memory-heavy objects: Type Compatibility Issues Cross-Platform Timeout Types Issue: setTimeout returns different types in browser vs Node.js environments. Solution: Use proper timeout types for cross-platform compatibility: Comparison & Circular Reference Issues Circular Reference Detection Issue: Incorrect circular reference detection in deep comparison. Solution: The framework uses improved circular reference checking: Error Handling Standardization Centralized Error System Is

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
• **Always...