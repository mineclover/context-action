---
document_id: en_troubleshooting_store-issues
category: troubleshooting
source_path: en/troubleshooting/store-issues.md
character_limit: 2000
last_update: '2025-08-30T10:42:11.741Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Store & State Issues

Store & State Issues Store management problems and solutions in the Context-Action framework. 🧩 Memory Leak Prevention Event Object Storage Detection The Problem Issue: DOM event objects being stored in stores causing memory leaks and browser performance degradation. Symptoms: - Browser memory usage continuously increasing - Slow store operations over time - Memory warnings in DevTools - Application performance degradation Root Cause DOM event objects contain circular references and large object graphs that prevent garbage collection: The Fix The framework automatically detects and prevents event object storage: Store Circular Reference Detection The Problem Issue: Circular reference detection in store comparison causing false positives and performance issues. Symptoms: - Store updates not triggering re-renders when they should - Performance degradation during deep object comparison - False circular reference warnings Root Cause Previous implementation checked both values together

Key points:
• Browser memory usage continuously increasing
• Slow store operations over time
• Memory warnings in DevTools
• Application performance degradation
• Store updates not triggering re-renders when they should
• Performance degradation during deep object comparison
• False circular reference warnings