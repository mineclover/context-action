---
document_id: en_guide_getting-started
category: guide
source_path: en/guide/getting-started.md
character_limit: 5000
last_update: '2025-08-30T10:42:08.081Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Getting Started

Getting Started Context-Action provides three main patterns for building scalable React applications with perfect separation of concerns. Quick Start Choose the right pattern for your use case: | Pattern | Use Case | Import | Best For | |---------|----------|--------|----------| | 🎯 Action Only | Action dispatching without stores | createActionContext | Event systems, command patterns | | 🏪 Store Only | State management without actions | createStoreContext | Pure state management, data layers | | 🔧 Ref Context | Direct DOM manipulation with zero re-renders | createRefContext | High-performance UI, animations, real-time interactions | 🎯 Action Only Pattern Pure action dispatching without state management. Basic Usage 🏪 Store Only Pattern Type-safe state management without action dispatching. Basic Usage 🔧 Ref Context Pattern High-performance direct DOM manipulation with zero React re-renders. Basic Usage Advanced RefContext with Business Logic Pattern Composition For complex applications, combine all three patterns: Next Steps - React Refs Guide - Deep dive into RefContext patterns - Pattern Guide - Compare all three patterns with examples - Pipeline System - Learn about action processing - MVVM Architecture - Understand the overall architecture - Hook Lifecycle - Explore available React hooks - Best Practices - Follow recommended patterns Real-World Examples - Mouse Events with RefContext: See the RefContext mouse events demo in our example app - Store Integration: Learn how to combine stores with action handlers - Performance Optimization: Discover zero re-render patterns with direct DOM manipulation

Key points:
• [React Refs Guide](../concept/react-refs-guide.md) - Deep dive into RefContext patterns
• [Pattern Guide](../concept/pattern-guide.md) - Compare all three patterns with examples
• [Pipeline System](./pipeline/) - Learn about action processing
• [MVVM Architecture](./patterns/architecture/mvvm.md) - Understand the overall architecture
• [Hook Lifecycle](./lifecycle/) - Explore available React hooks
• [Best Practices](./best-practices.md) - Follow recommended patterns
• **Mouse Events with RefContext**: See the RefContext mouse events demo in our example app
• **Store Integration**: Learn how to combine stores with action handlers
• **Performance Optimization**: Discover zero re-render patterns with direct DOM manipulation