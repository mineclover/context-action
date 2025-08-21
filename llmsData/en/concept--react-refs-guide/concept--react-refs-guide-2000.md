---
document_id: concept--react-refs-guide
category: concept
source_path: en/concept/react-refs-guide.md
character_limit: 2000
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

2.
