---
document_id: troubleshooting--store-issues
category: troubleshooting
source_path: en/troubleshooting/store-issues.md
character_limit: 5000
last_update: '2026-07-24T05:15:02.250Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Store & State Issues

Store & State Issues Store management problems and solutions in the Context-Action framework. 🧩 Memory Leak Prevention Event Object Storage Detection The Problem Issue: DOM event objects being stored in stores causing memory leaks and browser performance degradation. Symptoms: - Browser memory usage continuously increasing - Slow store operations over time - Memory warnings in DevTools - Application performance degradation Root Cause DOM event objects contain circular references and large object graphs that prevent garbage collection: The Fix The framework automatically detects and prevents event object storage: Store Circular Reference Detection The Problem Issue: Circular reference detection in store comparison causing false positives and performance issues. Symptoms: - Store updates not triggering re-renders when they should - Performance degradation during deep object comparison - False circular reference warnings Root Cause Previous implementation checked both values together instead of individually: The Fix Check each value individually for proper circular reference handling: 📊 Store Comparison Strategies Optimal Comparison Configuration Reference Comparison Use Case: Primitive values, immutable objects, performance-critical scenarios Shallow Comparison Use Case: Simple objects, form data, configuration objects Deep Comparison Use Case: Complex nested objects, when accuracy is more important than performance Store Performance Optimization Notification Mode Configuration Issue: Excessive re-renders from immediate notifications. Solution: Choose appropriate notification modes: Selector Optimization Issue: Inefficient selectors causing unnecessary re-renders. 🔍 Store Debugging Tools Store State Monitoring Memory Usage Tracking 🛠️ Store Configuration Best Practices Store Creation Patterns Store Integration with Actions Follow the 3-step Store Integration Pattern: ⚠️ Common Store Antipatterns Direct Store Access in Render Storing Functions in Stores Mutating Store Values 🚨 Emergency Protocols Store Recovery Strategies Memory Leak Recovery

Key points:
• Browser memory usage continuously increasing
• Slow store operations over time
• Memory warnings in DevTools
• Application performance degradation
• Store updates not triggering re-renders when they should
• Performance degradation during deep object comparison
• False circular reference warnings