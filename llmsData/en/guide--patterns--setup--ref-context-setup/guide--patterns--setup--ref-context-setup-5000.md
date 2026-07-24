---
document_id: guide--patterns--setup--ref-context-setup
category: guide
source_path: en/guide/patterns/setup/ref-context-setup.md
character_limit: 5000
last_update: '2026-07-24T05:15:02.179Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
RefContext Setup

RefContext Setup Shared RefContext setup patterns for direct DOM manipulation and singleton object management in the Context-Action framework. Import Overview RefContext provides lazy evaluation and lifecycle management for: - Direct DOM Operations: Canvas, video, audio elements requiring direct manipulation - Singleton Objects: Heavy libraries, SDKs, and services that need single instances - Performance Critical Operations: Operations that bypass React's virtual DOM - External Resource Management: Third-party libraries and native APIs Type Definitions DOM Element Refs Service and Library Refs Heavy Computation Refs Context Creation Patterns Basic RefContext Setup RefContext with Definitions Multi-Domain RefContext Setup Provider Setup Patterns Single RefContext Provider Multiple RefContext Providers Integrated with Store and Action Contexts Conditional RefContext Setup Initialization Patterns Lazy Initialization Service Initialization Worker Initialization Advanced Usage Patterns Waiting for Multiple Refs Ref Operations with Timeout Export Patterns Named Exports (Recommended) Barrel Exports Domain Bundle Exports Best Practices Ref Management 1. Lazy Initialization: Only initialize refs when actually needed 2. Cleanup: Always clean up refs in useEffect cleanup functions 3. Error Handling: Implement proper error handling for ref operations 4. Timeout Management: Use appropriate timeouts for ref operations Performance Optimization 1. Conditional Loading: Load heavy refs only when features are enabled 2. Device Adaptation: Adapt ref initialization based on device capabilities 3. Memory Management: Properly dispose of heavy objects and services 4. Worker Usage: Use Web Workers for CPU-intensive operations Integration Patterns 1. MVVM Architecture: Use RefContext as Performance layer 2. Provider Composition: Combine with Store and Action contexts 3. Feature Flags: Conditionally load ref providers 4. Environment Configuration: Adapt refs based on environment Common Patterns Reference This setup file provides reusable patterns for: - Ref Basic Usage - Uses CanvasRefs pattern - Canvas Optimization - Uses CanvasRefs and WorkerRefs - Memory Optimization - Uses service cleanup patterns - MVVM Architecture - Uses RefContext as Performance layer - Performance Patterns - Uses all ref patterns Related Setup Guides - Basic Action Setup - Action context setup patterns - Basic Store Setup - Store context setup patterns - Multi-Context Setup - Complex architecture integration - Provider Composition Setup - Advanced composition techniques

Key points:
• **Direct DOM Operations**: Canvas, video, audio elements requiring direct manipulation
• **Singleton Objects**: Heavy libraries, SDKs, and services that need single instances
• **Performance Critical Operations**: Operations that bypass React's virtual DOM
• **External Resource Management**: Third-party libraries and native APIs
• **[Ref Basic Usage](../ref/basic-usage.md)** - Uses CanvasRefs pattern
• **[Canvas Optimization](../ref/canvas-optimization.md)** - Uses CanvasRefs and WorkerRefs
• **[Memory Optimization](../ref/memory-optimization.md)** - Uses service cleanup patterns
• **[MVVM Architecture](../architecture/mvvm.md)** - Uses RefContext as Performance layer
• **[Performance Patterns](../performance/optimization-techniques.md)** - Uses all ref patterns
• **[Basic Action Setup](./basic-action-setup.md)** - Action context setup patterns
• **[Basic Store Setup](./basic-store-setup.md)** - Store context setup patterns
• **[Multi-Context Setup](./multi-context-setup.md)** - Complex architecture integration
• **[Provider Composition Setup](./provider-composition-setup.md)** - Advanced composition techniques
• **Lazy Initialization**: Only initialize refs when actually needed
• **Cleanup**: Always clean up refs in useEffect cleanup functions
• **Error Handling**: Implement proper error handling for ref operations
• **Timeout Management**: Use appropriate timeouts for ref operations
• **Conditional Loading**: Load heavy refs only when features are enabled
• **Device Adaptation**: Adapt ref initialization based on device capabilities
• **Memory Management**: Properly dispose of heavy objects and services
• **Worker Usage**: Use Web Workers for CPU-intensive operations
• **MVVM Architecture**: Use RefContext as Performance layer
• **Provider Composition**: Combine with Store and Action contexts
• **Feature Flags**: Conditionally load ref providers
• **Environment Configuration**: Adapt refs based on environment