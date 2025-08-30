---
document_id: en_troubleshooting_performance-issues
category: troubleshooting
source_path: en/troubleshooting/performance-issues.md
character_limit: 2000
last_update: '2025-08-30T10:42:13.660Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Performance Issues

Performance Issues Performance optimization and troubleshooting for the Context-Action framework. 🚨 Important Note For infinite loop issues, see the dedicated guide: → Infinite Loop Issues - Comprehensive coverage of all infinite loop patterns and solutions ⚡ Performance Optimization Memory Management Event Object Storage Prevention Issue: DOM event objects being stored in stores causing memory leaks. Solution: The framework automatically detects and prevents storing event objects: EventBus Memory Optimization Issue: Large objects (DOM elements, React components) stored in event history causing memory leaks. Solution: EventBus automatically stores only essential metadata for memory-heavy objects: Excessive Re-renders Issue: Components re-rendering too frequently. Diagnostics: Solutions: 1. Check store comparison strategy: 2. Optimize selectors: Selective Subscription Patterns High-Frequency Update Performance Issues The Problem: - Components subscribing to stores with high

Key points:
• Components subscribing to stores with high-frequency updates
• UI becomes unresponsive during rapid state changes
• Performance degradation with large component trees
• [ ] All `setTimeout` calls have corresponding cleanup
• [ ] Action handlers use fresh state from stores
• [ ] Internal actions excluded from tracking systems
• [ ] Handler registration happens only once
• [ ] Event objects not stored in stores
• [ ] Store subscriptions use appropriate comparison strategies
• [ ] High-frequency updates use debouncing or selective subscriptions
• **Stress Testing**: Rapid consecutive actions (10+ in 1 second)
•...