---
document_id: troubleshooting--action-issues
category: troubleshooting
source_path: en/troubleshooting/action-issues.md
character_limit: 5000
last_update: '2026-07-24T05:15:02.252Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Action System Issues

Action System Issues Action-related problems and solutions in the Context-Action framework. 🎯 Handler State Access Problems Stale State in Handlers The Problem Issue: Action handlers using stale component scope values instead of current state. Symptoms: - Handlers operating on outdated data - Inconsistent behavior after state changes - "Ghost" values from previous renders Root Cause Handler closures capture component scope values at registration time: The Fix Always get fresh state from stores within handlers: 🔄 Action Registration Issues Handler Registration Patterns Best Practice: Store Integration Pattern Follow the 3-step pattern for reliable handler implementation: Handler Lifecycle Management Registration Timing Issue: Handlers registered after components mount can miss early actions. Solution: Register handlers before component content: Handler Cleanup Issue: Memory leaks from unregistered handlers. Solution: Framework handles cleanup automatically, but ensure proper patterns: ⚡ Performance Optimization Handler Performance Async Handler Patterns Issue: Blocking handlers affecting UI responsiveness. Solution: Use proper async patterns: Batch Operations Issue: Multiple rapid actions causing performance issues. Solution: Use batching for related operations: 🚨 Error Handling Action Error Patterns Error Recovery Issue: Handlers failing silently or causing app crashes. Solution: Implement comprehensive error handling: Action Debugging Tools Handler Monitoring Handler Registry Inspection 📊 Performance Metrics Benchmarking Action Performance Memory Usage Monitoring

Key points:
• Handlers operating on outdated data
• Inconsistent behavior after state changes
• "Ghost" values from previous renders