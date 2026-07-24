---
document_id: guide--patterns--setup--ref-context-setup
category: guide
source_path: en/guide/patterns/setup/ref-context-setup.md
character_limit: 2000
last_update: '2026-07-24T05:15:02.179Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
RefContext Setup

RefContext Setup Shared RefContext setup patterns for direct DOM manipulation and singleton object management in the Context-Action framework. Import Overview RefContext provides lazy evaluation and lifecycle management for: - Direct DOM Operations: Canvas, video, audio elements requiring direct manipulation - Singleton Objects: Heavy libraries, SDKs, and services that need single instances - Performance Critical Operations: Operations that bypass React's virtual DOM - External Resource Management: Third-party libraries and native APIs Type Definitions DOM Element Refs Service and Library Refs Heavy Computation Refs Context Creation Patterns Basic RefContext Setup RefContext with Definitions Multi-Domain RefContext Setup Provider Setup Patterns Single RefContext Provider Multiple RefContext Providers Integrated with Store and Action Contexts Conditional RefContext Setup Initialization Patterns Lazy Initialization Service Initialization Worker Initialization Advanced Usage Pat

Key points:
• **Direct DOM Operations**: Canvas, video, audio elements requiring direct manipulation
• **Singleton Objects**: Heavy libraries, SDKs, and services that need single instances
• **Performance Critical Operations**: Operations that bypass React's virtual DOM
• **External Resource Management**: Third-party libraries and native APIs
• **[Ref Basic Usage](../ref/basic-usage.md)** - Uses CanvasRefs pattern
• **[Canvas Optimization](../ref/canvas-optimization.md)** - Uses CanvasRefs and WorkerRefs
• **[Memory Optimization](../ref/memory-optimization.md)** - Uses service cleanup patterns
• **[MVVM...