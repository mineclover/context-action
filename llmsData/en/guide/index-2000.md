---
document_id: en_guide_index
category: guide
source_path: en/guide/patterns/performance/index.md
character_limit: 2000
last_update: '2025-08-30T10:41:52.267Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Performance Patterns

Performance Patterns Performance optimization patterns and techniques for Context-Action framework applications. 🚀 Performance Optimization Core Optimization Techniques - Optimization Techniques - Comprehensive performance optimization guide   - Store optimization strategies   - Action handler optimization and memory management   - Memoization patterns   - RefContext performance techniques 🎯 Quick Reference Performance Strategies | Area | Technique | Best Practice | |------|-----------|---------------| | Store | Comparison Strategy | Choose based on data characteristics | | Actions | Handler Memoization + Memory Limits | Use useCallback with stable deps, configure maxHandlersPerAction | | RefContext | Direct DOM | Zero re-renders with hardware acceleration | | Components | Memoization | Memoize expensive computations | Comparison Strategy Guide Performance Anti-patterns ❌ Avoid these patterns: - Full object subscriptions when only partial data needed - State-driven updates for high-frequency

Key points:
• **[Optimization Techniques](./optimization-techniques.md)** - Comprehensive performance optimization guide
• Full object subscriptions when only partial data needed
• State-driven updates for high-frequency events
• Missing useCallback for handlers
• Unnecessary deep comparison strategies
• Not cleaning up animations and event listeners
• Excessive handler registration without proper limits
• Ignoring memory management in action patterns
• [RefContext Performance](../ref/performance.md)
• [Hardware Acceleration](../ref/hardware-acceleration.md)
• [Memory Optimization](../ref/memory-optimization.md)
• [Action Memory...