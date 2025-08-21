---
document_id: concept--react-refs-guide
category: concept
source_path: en/concept/react-refs-guide.md
character_limit: 5000
last_update: '2025-08-21T02:13:42.352Z'
update_status: auto_generated
priority_score: 85
priority_tier: medium
completion_status: completed
workflow_stage: content_generated
---
React Refs Management Guide

This guide covers the React Refs Management System in the Context-Action framework - a simple and safe reference management system designed for managing DOM elements, custom objects, and complex component references with type safety and lifecycle management. > ⚠️ Important: Always use createRefContext() for ref management. Direct RefStore instantiation is discouraged and only intended for internal framework use. Overview

The React Refs system provides declarative ref management with automatic cleanup, type safety, and advanced lifecycle features through the createRefContext() API. It's particularly useful for:

- DOM Element Management: Safe access to DOM elements with proper lifecycle handling
- Custom Object References: Managing Three.js objects, game engines, or other complex instances  
- Async Ref Operations: Waiting for refs to mount and performing safe operations
- Memory Management: Automatic cleanup and leak prevention

🎯 Recommended Usage Pattern

✅ Always use createRefContext():

Core Concepts

RefContext System

The refs system is built around createRefContext(), which provides a clean, declarative API that abstracts away internal RefStore complexity:

- Type Safety: Full TypeScript support with proper type inference
- Lifecycle Management: Automatic mounting/unmounting detection
- Safe Operations: Protected ref access with error handling
- Flexible Configuration: Both simple and advanced configuration options
- Internal Optimization: Uses RefStore internally but provides a better developer experience

> 🔧 Architecture Note: createRefContext() manages RefStore instances internally, providing a cleaner API while handling all the complex lifecycle management, error handling, and memory cleanup automatically. Two Configuration Approaches

1. Simple Type Definition (Legacy)

2. Declarative Definitions (Recommended)

Naming Conventions

Following the Context-Action framework conventions, all refs contexts should use the renaming pattern for consistency and improved developer experience. ✅ Recommended: Renaming Pattern

❌ Avoided: Direct Object Access

🎯 Context Naming Rules

Domain-Based Context Names

Hook Naming Pattern

Basic Usage

Setting Up Refs

Accessing Ref Values

Advanced Features

Hook Usage Pattern

The refs system follows React's hook pattern where you extract the function first, then use it:

✅ Correct Usage Pattern

❌ Common Mistakes

Why This Pattern Works

Comprehensive Waiting Patterns

Safe Operations with withTarget

RefDefinitions Management Strategies

RefDefinitions provide powerful configuration options for different ref management strategies:

Basic DOM Elements

Input Validation

Custom Object Management

Metadata and Lifecycle Management

Available Management Strategies

| Strategy | Purpose | Usage |
|----------|---------|--------|
| autoCleanup | Automatic cleanup when component unmounts | Most refs should use true |
| mountTimeout | Maximum time to wait for ref mounting | Adjust based on complexity |
| validator | Type and validity checking | Critical for type safety |
| cleanup | Custom cleanup function | Complex objects needing disposal |
| initialMetadata | Additional ref metadata | Debugging and tracking |

Simplified Reference Management

The RefContext system now treats all references as singleton objects without deep cloning or immutability checks. This is based on the understanding that refs are meant to manage singleton objects that should never be cloned. Key Principles:
- No Cloning: All refs maintain direct references to their target objects
- Reference Comparison Only: State changes are detected using reference equality
- Universal Handling: DOM elements, custom objects, and Three.js objects are all handled identically
- Cleanup Functions: The only differentiation is through optional cleanup functions

This simplified approach:
- Eliminates circular reference issues with React Fiber
- Improves performance by avoiding unnecessary cloning
- Provides consistent behavior across all ref types
- Makes the API simpler and more predictable

Real-World Example: Mouse Events with RefContext

Here's a practical example showing how RefContext enables high-performance mouse tracking with zero React re-renders:

Key Benefits of This Approach:

1. Zero React Re-renders: All mouse movements are handled through direct DOM manipulation
2. Perfect Separation of Concerns: Each RefContext manages its own domain
3. Hardware Acceleration: Using translate3d() for smooth 60fps performance
4. Type Safety: Full TypeScript support with proper ref typing
5. Independent Contexts: Mouse position and visual effects are completely decoupled
6. Memory Efficient: Automatic cleanup when components unmount

Complete Example: Game Component

Best Practices

1. Choose the Right Configuration Approach

2. Handle Async Operations Safely

3. Configure Appropriate Timeouts

4.
